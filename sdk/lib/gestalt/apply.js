// Gestalt stuff
const meta = require('./metaclient')
const { debug } = require('../debug');
const jsonPatch = require('fast-json-patch');
const util = require('../util');
const chalk = require('../chalk');

const {
    createResource,
    deleteResource,
    fetchOrgResources,
    fetchWorkspaceResources,
    fetchResources
} = require('./generic');

const {
    applyFogGroupMembership
} = require('./apply/apply-group-membership');

const resolveContextPath = require('./context-resolver').contextResolver.resolveContextPath;

const {
    resourceTypeToUrlType,
    resourceTypesRequiringPatchUpdate,
    hierarchyResources,
} = require('./constants');

module.exports = {
    applyResource,
}

/**
 * Applys the resource - Queryies for the resource, if it exists then update the resource, otherwise create
 * the resource.
 * @param {*} spec Resource Spec to create or update
 * @param {*} context Context to update or create the resource in.
 */
async function applyResource(spec, context, options) {
    debug(`applyResource(${spec.name}, ${JSON.stringify(context)})`);
    if (!spec) throw Error('missing spec');
    if (!spec.resource_type) throw Error('missing spec.resource_type');
    if (!context) throw Error("missing context");

    if (willSkip(spec)) {
        console.error(chalk.yellow(`Warning: skipping resource ${spec.name} (can't handle type '${spec.resource_type}')`));
        return {
            status: 'skipped',
            message: `${spec.resource_type} '${spec.name}' skipped (can't handle type).`,
            resource: spec
        };
    }

    const type = getResourceUrlType(spec);
    const resourceType = spec.resource_type;

    if (resourceType.indexOf('Fog::') == 0) {
        // This is a non-Meta resource managed by the Fog CLI
        return applyFogResource(spec, context);
    }

    if (!type) {
        debug(`  will throw Error: resource_type: ${spec.resource_type} not present`);
        throw Error(`URL type for resourceType ${spec.resource_type} not present`);
    }
    debug(`  resource_type: ${spec.resource_type}`);
    debug(`  type: ${type}`);

    // Clone objects
    spec = util.cloneObject(spec);
    context = util.cloneObject(context);

    // Special case
    if (spec.resource_type == 'Gestalt::Resource::ApiEndpoint') {
        context.api = spec.context.api;
    }

    if (hierarchyResources.includes(spec.resource_type)) {
        if (spec.contextPath) {
            debug(`Using context path from hierarchy resource: ${spec.contextPath}`);
            context = await resolveContextPath(spec.contextPath);
            debug(`Using context from hierarchy resource: ${JSON.stringify(context, null, 2)}`);
            delete spec.contextPath;
        }
    }

    let resources = null;
    let targetResource = null;

    if (spec.resource_type == 'Gestalt::Resource::Organization') {
        validateOrgSpec(spec);

        resources = await meta.GET(`/orgs?expand=true`);
        targetResource = resources.find(r => r.properties.fqon == spec.properties.fqon);

        // Adjust the context of the org using the FQON
        if (spec.properties.fqon) {
            const contextPath = getOrgParentPathFromFqon(spec.properties.fqon);
            debug(`Found Org ${spec.properties.fqon}, using parent context path of '${contextPath}'`);
            context = await resolveContextPath(contextPath);
        }
        onlyEnv(spec);
    } else if (spec.resource_type == 'Gestalt::Resource::Workspace') {
        resources = await fetchOrgResources('workspaces', [context.org.fqon]);
        targetResource = resources.find(r => r.name == spec.name);
        onlyEnv(spec);
    } else if (spec.resource_type == 'Gestalt::Resource::Environment') {
        resources = await fetchWorkspaceResources('environments', context);
        targetResource = resources.find(r => r.name == spec.name);
    } else if (spec.resource_type == 'Gestalt::Resource::ApiEndpoint') {
        resources = await fetchResources('apiendpoints', context);
        targetResource = resources.find(r => r.properties.resource == spec.properties.resource);
    } else if (spec.resource_type.indexOf('Gestalt::Resource::Rule::') == 0) {
        if (spec.context && spec.context.policy && spec.context.policy.id) {
            // Policy context is embedded in the policy rule
            resources = await meta.GET(`/${context.org.fqon}/policies/${spec.context.policy.id}/rules?expand=true`);
            targetResource = resources.find(r => r.name == spec.name);
        } else {
            throw Error(`Can't handle type ${spec.resource_type}, policy info not present`);
        }
    } else {
        // Special cases
        if (type == 'groups' || type == 'users') {
            context = { org: { fqon: 'root' } };
        }

        resources = await fetchResources(type, context);
        targetResource = resources.find(r => r.name == spec.name);
    }
    debug(`  ${resources.length} resources to process`);

    if (targetResource) {
        if (!options.delete) {
            debug(`  Target resource exists, will update`);
            // Update
            spec.id = targetResource.id;

            // Special case for resources requiring PATCH rather than PUT
            if (resourceRequiresPatch(spec)) {

                debug(`  ${spec.name} (${resourceType}) requires PATCH`);

                return doPatch(type, context, spec, targetResource);
            }

            // TODO: Determine if resource actually needs to be updated via PUT by comparing spec to targetResource

            debug(`  Will update '${spec.name}' via PUT`);

            // Otherwise, perform PUT update
            delete spec.resource_type; // Updates don't need (and may not accept the resource_type field)
            const res = await meta.PUT(`/${context.org.fqon}/${type}/${spec.id}`, spec);
            return {
                status: 'updated',
                message: `${resourceType} '${res.name}' updated (PUT).`,
                resource: res
            };
        } else {
            debug(`  Target resource exists, will delete`);
            await deleteResource(type, targetResource, { force: options.force });
            return {
                status: 'deleted',
                message: `${resourceType} '${targetResource.name}' deleted.`,
                resource: targetResource
            };
        }
    } else {
        if (!options.delete) {
            debug(`  Will create '${spec.name}'`);

            // Create
            const res = await createResource(spec, context);
            return {
                status: 'created',
                message: `${resourceType} '${spec.name}' created.`,
                resource: res
            };
        } else {
            return {
                status: 'unchanged',
                message: `${resourceType} '${spec.name}' doesn't exist.`,
                resource: spec
            };
        }
    }
}

function willSkip(spec) {
    return (spec.resource_type.indexOf('Gestalt::Action::') == 0);
}

function getResourceUrlType(spec) {
    if (spec.resource_type.indexOf('Gestalt::Configuration::Provider::') == 0) {
        return 'providers';
    }
    const type = resourceTypeToUrlType[spec.resource_type];

    if (type) {
        return type;
    }
    throw Error(`No type found for ${spec.resource_type}`);
}

function resourceRequiresPatch(spec) {
    if (resourceTypesRequiringPatchUpdate.includes(spec.resource_type)) {
        return true;
    }
    if (spec.resource_type.indexOf('Gestalt::Configuration::Provider::') == 0) {
        return true;
    }
}

function getOrgParentPathFromFqon(fqon) {
    let arr = fqon.split('.');
    arr = arr.splice(0, arr.length - 1);
    const path = '/' + arr.join('.');
    return (path == '/') ? '/root' : path;
}

function validateOrgSpec(org) {
    if (org.properties && org.properties.fqon) {
        const fqon = org.properties.fqon;
        let arr = fqon.split('.');
        const name = arr[arr.length - 1];
        if (name != org.name) {
            throw Error(`Can't process Org '${org.name}' since FQON '${org.properties.fqon}' doesn't reflect name`)
        }
    }
}

/**
 * Deletes spec.properties except for spec.properties.env
 */
function onlyEnv(o) {
    if (o.properties && o.properties.env) {
        o.properties = { env: o.properties.env };
    } else {
        o.properties = {}
    }
}

/**
 * Special cases function for resources requiring PATH udpate.
 * Deletes metadata in the spec and targetResource that would otherwise
 * cause the comparison to generate unnecessary patches.
 */
async function doPatch(type, context, spec, targetResource) {

    // console.log(JSON.stringify(spec, null, 2))
    // console.log(JSON.stringify(targetResource, null, 2))

    const resourceType = spec.resource_type;

    if (hierarchyResources.includes(resourceType)) {
        if (resourceType == 'Gestalt::Resource::Environment') {
            delete spec.properties.workspace;
            delete targetResource.properties.workspace;
        } else {
            onlyEnv(spec);
            onlyEnv(targetResource);

            // TODO: if Workspace properties.env doesn't exist, the env from the parent org is rendered
            // This causes problems with patch, since it attempts to remove a variable that isn't present.
            // PATCH http://localhost:31112/meta/training1/workspaces/7ec324dc-9c8f-496b-b908-719afd5d05fc 
            // [
            //   {
            //     "op": "remove",
            //     "path": "/properties/env/TEST4"
            //   },
            //   {
            //     "op": "remove",
            //     "path": "/properties/env/TEST3"
            //   },
            //   {
            //     "op": "remove",
            //     "path": "/properties/env/TEST1"
            //   },
            //   {
            //     "op": "add",
            //     "path": "/properties/env/one",
            //     "value": "one"
            //   }
            // ] 
            // StatusCodeError: 500 - {"code":500,"message":"/properties/env/TEST4 does not exist."}

            if (spec.properties && !spec.properties.env) {
                if (targetResource.properties) {
                    delete targetResource.properties.env;
                }
            }
        }
    }

    if (resourceType == 'Gestalt::Resource::ApiEndpoint') {
        delete targetResource.properties.public_url;
        delete targetResource.properties.upstream_url;
        delete targetResource.properties.location_id;
    }

    if (resourceType == 'Gestalt::Resource::Group') {
        delete spec.properties;
        delete targetResource.properties;
    }

    if (resourceType == 'Gestalt::Resource::Policy') {
        // Can't update rules directly
        delete spec.properties.rules;
        delete targetResource.properties.rules;
    }

    if (resourceType.indexOf('Gestalt::Resource::Rule::') == 0) {
        delete spec.properties.defined_at;
        delete targetResource.properties.defined_at;

        // spec has to have properties.lambda = <id>
        // targetResource has to have properties.lambda.id = <id>
        if (spec.properties.lambda && targetResource.properties.lambda) {
            if (spec.properties.lambda == targetResource.properties.lambda.id) {
                delete spec.properties.lambda;
                delete targetResource.properties.lambda;
            }
        }
    }

    if (resourceType.indexOf('Gestalt::Configuration::Provider::') == 0) {
        if (targetResource.properties) {
            delete targetResource.properties.linked_providers;
        }
    }

    // Delete unmodifyable parameters
    for (let s of ['resource_type', 'resource_state', 'owner', 'parent', 'modified', 'created', 'org']) {
        delete spec[s];
        delete targetResource[s];
    }
    for (let s of ['parent', 'provider']) {
        if (spec.properties) delete spec.properties[s];
        if (targetResource.properties) delete targetResource.properties[s];
    }
    // Delete extra parameters
    for (let s of ['context']) {
        delete spec[s];
        delete targetResource[s];
    }

    // console.log(JSON.stringify(spec, null, 2))
    // console.log(JSON.stringify(targetResource, null, 2))

    let patches = jsonPatch.compare(targetResource, spec);
    debug(`  ${patches.length} patches`);

    patches = patches.filter(p => {
        if (p.op == 'remove') {
            debug(`Warning: not removing environment variable: ${JSON.stringify(p)}`);
            if (p.path.startsWith('/properties/env/')) {
                return false;
            }
        }
        return true;
    });

    debug(`  ${patches.length} patches after filter`);

    if (patches.length > 0) {

        debug(JSON.stringify(spec, null, 2))
        debug(JSON.stringify(patches, null, 2))
        debug(JSON.stringify(targetResource, null, 2))

        const res = await meta.PATCH(`/${context.org.fqon}/${type}/${spec.id}`, patches);
        const result = {
            status: 'updated',
            message: `${resourceType} '${res.name}' updated (PATCH).`,
            resource: patches
        };
        return result;
    } else {
        // Nothing to apply
        return {
            status: 'unchanged',
            message: `${resourceType} '${targetResource.name}' unchanged.`,
            resource: targetResource
        };
    }
}

function applyFogResource(spec, context) {
    if (spec.resource_type == 'Fog::GroupMembership') {
        return applyFogGroupMembership(spec, context);
    }
    throw Error(`type '${spec.resource_type}' not supported`);
}

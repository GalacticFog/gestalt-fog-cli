// Gestalt stuff
const meta = require('./metaclient')
const { debug } = require('../debug');
const jsonPatch = require('fast-json-patch');
const util = require('../util');

const {
    createResource,
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
async function applyResource(spec, context) {
    debug(`applyResource(${spec.name}, ${context})`);
    if (!spec) throw Error('missing spec');
    if (!spec.resource_type) throw Error('missing spec.resource_type');
    if (!context) throw Error("missing context");

    const type = resourceTypeToUrlType[spec.resource_type];
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
        debug(`Using context from hierarchy resource: ${spec.context}`);
        context = await resolveContextPath(spec.context);
        debug(`Using context from hierarchy resource: ${JSON.stringify(context, null, 2)}`);
        delete spec.context;
    }

    let resources = null;
    let targetResource = null;

    if (spec.resource_type == 'Gestalt::Resource::Organization') {
        resources = await meta.GET(`/orgs?expand=true`);
        targetResource = resources.find(r => r.properties.fqon == spec.properties.fqon);
        delete spec.properties;
    } else if (spec.resource_type == 'Gestalt::Resource::Workspace') {
        resources = await fetchOrgResources('workspaces', [context.org.fqon]);
        targetResource = resources.find(r => r.name == spec.name);
        delete spec.properties;
    } else if (spec.resource_type == 'Gestalt::Resource::Environment') {
        resources = await fetchWorkspaceResources('environments', context);
        targetResource = resources.find(r => r.name == spec.name);
    } else if (spec.resource_type == 'Gestalt::Resource::ApiEndpoint') {
        resources = await fetchResources(type, context);
        targetResource = resources.find(r => r.properties.resource == spec.properties.resource);
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
        debug(`  Target resource exists, will update`);
        // Update
        spec.id = targetResource.id;

        // Special case for resources requiring PATCH rather than PUT
        if (resourceTypesRequiringPatchUpdate.includes(resourceType)) {

            debug(`  Special case, will PATCH`);

            if (hierarchyResources.includes(resourceType)) {
                if (resourceType == 'Gestalt::Resource::Environment') {
                    delete spec.properties.workspace;
                    delete targetResource.properties.workspace;
                } else {
                    delete spec.properties;
                    delete targetResource.properties;
                }
            }

            if (resourceType == 'Gestalt::Resource::Group') {
                delete spec.properties;
                delete targetResource.properties;
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

            const patches = jsonPatch.compare(targetResource, spec);
            debug(`  ${patches.length} patches`);

            if (patches.length > 0) {
                const res = await meta.PATCH(`/${context.org.fqon}/${type}/${spec.id}`, patches);
                const result = {
                    status: `${resourceType} '${res.name}' updated (PATCH).`,
                    resource: patches
                };
                return result;
            } else {
                // Nothing to apply
                return {
                    status: `${resourceType} '${targetResource.name}' unchanged.`,
                    resource: targetResource
                };
            }
        }

        debug(`  Will update '${spec.name}' via PUT`);

        // Otherwise, perform PUT udpate
        delete spec.resource_type; // Updates don't need (and may not accep the resource_type field)
        const res = await meta.PUT(`/${context.org.fqon}/${type}/${spec.id}`, spec);
        return {
            status: `${resourceType} '${res.name}' updated (PUT).`,
            resource: res
        };
    } else {
        debug(`  Will create '${spec.name}'`);
        // Create
        const res = await createResource(spec, context);
        return {
            status: `${resourceType} '${spec.name}' created.`,
            resource: res
        };
    }
}

function applyFogResource(spec, context) {
    if (spec.resource_type == 'Fog::GroupMembership') {        
        return applyFogGroupMembership(spec, context);
    }
    throw Error(`type '${spec.resource_type}' not supported`);
}

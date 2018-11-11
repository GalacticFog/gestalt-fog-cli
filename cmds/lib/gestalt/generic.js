// Gestalt stuff
const meta = require('./metaclient')
const gestaltContext = require('../gestalt-context');
const { debug } = require('../debug');
const chalk = require('../chalk');
const jsonPatch = require('fast-json-patch');
const util = require('../util');

// Exports

module.exports = {
    applyResource,
    fetchResources,
    fetchOrgResources,
    fetchResourcesFromOrgEnvironments,
    fetchEnvironmentResources,
    fetchWorkspaceResources,
    fetchResource,
    updateResource,
    deleteResource,
    createOrgResource,
    createWorkspaceResource,
    createEnvironmentResource,
    createResource,
    getGestaltConfig,
    getGestaltContext,

    // TODO: Remove
    getContext: getGestaltContext
}

/**
 * Maps Meta resource types to API URL paths
 */
const resourceTypeToUrlType = {
    'Gestalt::Resource::Node::Lambda': 'lambdas',
    'Gestalt::Resource::Container': 'containers',
    'Gestalt::Resource::Api': 'apis',
    'Gestalt::Resource::Environment': 'environments',
    'Gestalt::Resource::Workspace': 'workspaces',
    'Gestalt::Resource::Organization': 'orgs',
    'Gestalt::Resource::User': 'users',
    'Gestalt::Resource::Group': 'groups',
    'Gestalt::Resource::Volume': 'volumes',
    'Gestalt::Resource::Policy': 'policies',
    'Gestalt::Resource::ApiEndpoint': 'apiendpoints',
};

/**
 * These types don't allow the resource_type field to be present when creating
 * the resources.
 */
const typesNotAllowingResourceTypeFieldOnCreation = [
    'Gestalt::Resource::Node::Lambda',
    'Gestalt::Resource::Policy',
    'Gestalt::Resource::User',
    'Gestalt::Resource::Group',
    'Gestalt::Resource::ApiEndpoint',
];

/**
 * Fetch resources from the context - Org, Workspace, or Environment context
 * @param {*} type 
 * @param {*} context 
 */
function fetchResources(type, context) {
    if (context.org) {
        if (context.workspace) {
            if (context.environment) {
                return fetchEnvironmentResources(type, context);
            }
            return fetchWorkspaceResources(type, context);
        }
        return fetchOrgResources(type, [context.org.fqon]);
    }
    throw Error(`Context doesn't contain org info`);
}

function fetchOrgResources(type, fqonList, type2) {
    if (!fqonList) throw Error('missing fqonList')

    let promises = fqonList.map(fqon => {
        debug(chalk.dim.blue(`Fetching ${type} from ${fqon}...`));
        let url = `/${fqon}/${type}?expand=true`;
        if (type2) url += `&type=${type2}`;
        const res = meta.GET(url);
        return res;
    });

    return Promise.all(promises).then(results => {
        const result = [].concat.apply([], results);
        return result.sort();
    });
}

function fetchResourcesFromOrgEnvironments(type, fqonList, type2) {
    if (!fqonList) fqonList = [getGestaltContext().org.fqon];

    let promises = fqonList.map(fqon => {
        const res = _fetchResourcesFromOrgEnvironments(type, fqon);
        return res;
    });

    return Promise.all(promises).then(results => {
        return [].concat.apply([], results);
    });
}

async function _fetchResourcesFromOrgEnvironments(type, fqon) {
    const context = gestaltContext.getContext();
    if (!fqon) fqon = context.org.fqon; // default org

    const envs = await fetchOrgResources("environments", [fqon]);
    const promises = envs.map(env => {
        debug(chalk.dim.blue(`Fetching ${type} from ${fqon}/'${env.name}'...`));
        const context2 = {
            org: {
                fqon: fqon
            },
            environment: {
                id: env.id
            }
        }
        return fetchEnvironmentResources(type, context2).then(res => {
            for (let c of res) {
                c.environment = {
                    name: env.name,
                    description: env.description,
                    id: env.id
                };
            }
            return res;
        }).catch(err => {
            console.error('Warning: ' + err.message);
            return [];
        });
    });

    const arr = await Promise.all(promises);
    const resources = [].concat.apply([], arr);
    return resources;
}

function fetchWorkspaceResources(type, context, filterType) {
    context = context || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.workspace) throw Error("No Workspace in current context");
    if (!context.workspace.id) throw Error("No Workspace ID in current context");
    let url = `/${context.org.fqon}/workspaces/${context.workspace.id}/${type}?expand=true`;
    if (filterType) url += `&type=${filterType}`;
    const res = meta.GET(url);
    return res;
}

function fetchEnvironmentResources(type, providedContext, type2) {
    debug(`fetchEnvironmentResources(${type}, ${providedContext}, ${type2}`);

    const context = providedContext || getGestaltContext();

    // Special case
    if (type == 'Gestalt::Resource::ApiEndpoint' || type == 'apiendpoints') {
        const res = meta.GET(`/${context.org.fqon}/apis/${context.api.id}/apiendpoints?expand=true`)
        return res;
    }

    type = resourceTypeToUrlType[type] || type;

    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.environment) throw Error("No Environment in current context");
    if (!context.environment.id) throw Error("No Environment ID in current context");
    if (!type) throw Error("Type not specified");
    let url = `/${context.org.fqon}/environments/${context.environment.id}/${type}?expand=true`;
    if (type2) url += `&type=${type2}`
    return meta.GET(url);
}

function createEnvironmentResource(group, spec, providedContext) {
    if (!group) throw Error('missing group');
    if (!spec) throw Error('missing spec');
    if (!spec.name) throw Error('missing spec.name');
    // TODO: Other required parameters

    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.environment) throw Error("missing context.environment");
    if (!context.environment.id) throw Error("missing context.environment.id");

    delete spec.resource_type;
    delete spec.resource_state;

    const res = meta.POST(`/${context.org.fqon}/environments/${context.environment.id}/${group}`, spec);
    return res;
}

function createOrgResource(type, spec, context) {
    if (!type) throw Error('missing type')
    if (!spec) throw Error('missing spec')
    if (!spec.name) throw Error('missing spec.name')
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");

    return meta.POST(`/${context.org.fqon}/${type}`, spec);
}

function createWorkspaceResource(type, spec, context) {
    if (!type) throw Error('missing type')
    if (!spec) throw Error('missing spec')
    if (!spec.name) throw Error('missing spec.name')
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.workspace) throw Error("missing context.workspace");
    if (!context.workspace.id) throw Error("missing context.workspace.id");

    return meta.POST(`/${context.org.fqon}/workspaces/${context.workspace.id}/${type}`, spec);
}

function createResource(spec, context) {
    if (!spec) throw Error(`createResource: spec is '${spec}'`);
    if (!spec.resource_type) throw Error(`createResource: spec.resource_type is '${spec.resource_type}'`);

    // Special cases
    if (spec.resource_type == 'Gestalt::Resource::ApiEndpoint') {
        return createApiEndpoint(spec, context);
    }

    if (!context) throw Error(`createResource: context is '${context}'`);

    const url = resolveResourceUrl(spec.resource_type, context);

    if (typesNotAllowingResourceTypeFieldOnCreation.includes(spec.resource_type)) {
        // TODO: Workaround Meta bug of not accepting the resource_type for Lambdas and potentially other
        // resource types, otherwise get the following error:
        // StatusCodeError: 500 - {"code":500,"message":"Failed parsing JSON: {\"obj.resource_type\":[{\"msg\":[\"error.expected.uuid\"],\"args\":[]}]}"}
        spec = util.cloneObject(spec);
        delete spec.resource_type;
    }

    const res = meta.POST(url, spec);
    return res;
}

/**
 * Creates an ApiEndpoint resource.  The ApiEndpoint requires a parent API object, which either
 * needs to provided in the Context (context.api) or embedded in the spec (spec.context.api).
 * @param {*} spec ApiEndpoint spec
 * @param {*} providedContext Context to create the ApiEndpoint resource.
 */
function createApiEndpoint(spec, providedContext) {
    if (!spec) throw Error('missing spec');
    if (!spec.name) throw Error('missing spec.name');
    // TODO: Other required parameters

    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.api) {
        if (!spec.context) throw Error("no context.api, missing spec.context");
        if (!spec.context.api) throw Error("no context.api, missing spec.context.api");
        if (!spec.context.api.id) throw Error("no context.api, missing spec.context.api.id");
        context.api = spec.context.api;
    }
    if (!context.api) throw Error("missing context.api");
    if (!context.api.id) throw Error("missing context.api.id");

    spec = util.cloneObject(spec);
    delete spec.resource_type; // Otherwise {"code":500,"message":"Failed parsing JSON: {\"obj.resource_type\":[{\"msg\":[\"error.expected.uuid\"],\"args\":[]}]}"}
    delete spec.context;
    return meta.POST(`/${context.org.fqon}/apis/${context.api.id}/apiendpoints`, spec);
}


async function fetchResource(type, spec, context) {
    context = context || getGestaltContext();
    if (!type) throw Error('No type')
    if (!spec) throw Error('No spec')
    if (!spec.name && !spec.id) throw Error('No spec.name or spec.id fields')

    if (spec.id) {
        return meta.GET(`/${context.org.fqon}/${type}/${spec.id}`)
    }

    // Otherwise search by name
    const url = resolveContextUrl(context);
    const resources = await meta.GET(`${url}/${type}?expand=true`)
    debug(resources)
    const matchParam = 'name';
    return resources.find(r => r[matchParam] == spec[matchParam]);
}

function updateResource(type, spec, context) {
    context = context || getGestaltContext();
    validateTypeSpecContext(type, spec, context);

    // Make a copy before mutating
    spec = util.cloneObject(spec);

    delete spec.resource_type;
    delete spec.resource_state;

    const res = meta.PUT(`/${context.org.fqon}/${type}/${spec.id}`, spec);
    return res;
}

/**
 * Applys the resource - Queryies for the resource, if it exists then update the resource, otherwise create
 * the resource.
 * @param {*} spec Resource Spec to create or update
 * @param {*} context Context to update or create the resource in.
 */
async function applyResource(spec, context) {
    if (!spec) throw Error('missing spec');
    if (!spec.resource_type) throw Error('missing spec.resource_type');
    if (!context) throw Error("missing context");

    spec = util.cloneObject(spec);
    context = util.cloneObject(context);

    const type = resourceTypeToUrlType[spec.resource_type];
    if (!type) {
        throw Error(`URL type for resourceType ${spec.resource_type} not present`);
    }

    // Special case
    if (spec.resource_type == 'Gestalt::Resource::ApiEndpoint') {
        context.api = spec.context.api;
    }

    const resources = await fetchResources(spec.resource_type, context);

    let targetResource = null;
    // special case
    if (spec.resource_type == 'Gestalt::Resource::ApiEndpoint') {
        targetResource = resources.find(r => r.properties.resource == spec.properties.resource);
    } else {
        targetResource = resources.find(r => r.name == spec.name);
    }
    if (targetResource) {
        // Update
        spec.id = targetResource.id;

        // Special case for Lambdas and API endpoints - Require PATCH rather than PUT
        if (spec.resource_type == 'Gestalt::Resource::Node::Lambda' ||
            spec.resource_type == 'Gestalt::Resource::ApiEndpoint') {


            // Delete unmodifyable parameters
            for (let s of ['resource_type', 'resource_state', 'owner', 'parent', 'modified', 'created', 'org']) {
                delete spec[s];
                delete targetResource[s];
            }
            for (let s of ['parent', 'provider']) {
                delete spec.properties[s];
                delete targetResource.properties[s];
            }
            // Delete extra parameters
            for (let s of ['context']) {
                delete spec[s];
                delete targetResource[s];
            }

            const patches = jsonPatch.compare(targetResource, spec);
            if (patches.length > 0) {
                return meta.PATCH(`/${context.org.fqon}/${type}/${spec.id}`, patches);
            } else {
                // Nothing to apply
                return new Promise((resolve) => {
                    resolve(null);
                })
            }
        }

        // Otherwise, perform PATCH udpate
        delete spec.resource_type; // Updates don't need (and may not accep the resource_type field)
        return meta.PUT(`/${context.org.fqon}/${type}/${spec.id}`, spec);    
    } else {
        // Create
        return createResource(spec, context);
    }
}

function deleteResource(type, spec, options) {
    if (!type) throw Error('missing type')
    if (!spec) throw Error('missing spec');
    if (!spec.id) throw Error('missing spec.id');
    if (!spec.org) throw Error('missing spec.org');
    if (!spec.org.properties) throw Error('missing spec.org.properties');
    if (!spec.org.properties.fqon) throw Error('missing spec.org.properties.fqon');

    let suffix = ''

    if (options) {
        for (let o of Object.keys(options)) {
            if (o == 'force') {
                if (options.force) {
                    suffix = '?force=true'
                }
            } else {
                throw Error(`Invalid delete resource option: ${o}`);
            }
        }
    }

    const fqon = spec.org.properties.fqon;
    return meta.DELETE(`/${fqon}/${type}/${spec.id}${suffix}`);
}

function validateTypeSpecContext(type, spec, context) {
    if (!type) throw Error('missing type')
    if (!spec) throw Error('missing spec')
    if (!spec.id) throw Error('missing spec.id')
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
}

function resolveResourceUrl(resourceType, context) {
    if (!resourceType) throw Error(`resolveResourceUrl: resourceType is ${resourceType}`)
    if (!context) throw Error(`resolveResourceUrl: context is ${context}`)

    let urlBase = resolveContextUrl(context);

    let type = resourceTypeToUrlType[resourceType];
    if (!type) {
        if (resourceType.indexOf("Gestalt::Configuration::Provider::") == 0) {
            type = 'providers'
        } else {
            throw Error(`Can't form URL path for resource type '${resourceType}'`);
        }
    }

    return urlBase + '/' + type;
}

function resolveContextUrl(context) {
    if (!context) throw Error("missing context");

    if (context.org && context.org.fqon) {
        if (context.environment && context.environment.id) {
            return `/${context.org.fqon}/environments/${context.environment.id}`
        } else if (context.workspace && context.workspace.id) {
            return `/${context.org.fqon}/workspaces/${context.workspace.id}`
        }
        return `/${context.org.fqon}`
    }
    throw Error(`Can't form URL path from context: ${JSON.stringify(context)}`);
}



// Internal Context functions


function getGestaltConfig() {
    return gestaltContext.getConfig();
}

function getGestaltContext() {
    return gestaltContext.getContext();
}

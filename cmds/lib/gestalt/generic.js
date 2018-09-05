// Gestalt stuff
const meta = require('./metaclient')
const gestaltContext = require('../gestalt-context');
const { debug } = require('../debug');

// Exports

module.exports = {
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
    // if (!fqonList) fqonList = [getGestaltContext().org.fqon];
    if (!fqonList) throw Error('missing fqonList')

    let promises = fqonList.map(fqon => {
        console.error(`Fetching ${type} from ${fqon}...`);
        let url = `/${fqon}/${type}?expand=true`;
        if (type2) url += `&type=${type2}`;
        const res = meta.GET(url);
        return res;
    });

    return Promise.all(promises).then(results => {
        return [].concat.apply([], results);
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
        console.error(`Fetching containers from ${fqon}/'${env.name}'`);
        const context2 = {
            org: {
                fqon: fqon
            },
            environment: {
                id: env.id
            }
        }
        return fetchEnvironmentResources(type, context2).then(containers => {
            for (let c of containers) {
                c.environment = {
                    name: env.name,
                    description: env.description,
                    id: env.id
                };
            }
            return containers;
        }).catch(err => {
            console.error('Warning: ' + err.message);
            return [];
        });
    });

    const arr = await Promise.all(promises);
    const containers = [].concat.apply([], arr);
    return containers;
}



function fetchWorkspaceResources(type, context) {
    context = context || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.workspace) throw Error("No Workspace in current context");
    if (!context.workspace.id) throw Error("No Workspace ID in current context");
    const res = meta.GET(`/${context.org.fqon}/workspaces/${context.workspace.id}/${type}?expand=true`)
    return res;
}

function fetchEnvironmentResources(type, providedContext, type2) {
    debug(`fetchEnvironmentResources(${type}, ${providedContext}, ${type2}`);
    const context = providedContext || getGestaltContext();
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
    if (!context) throw Error(`createResource: context is '${context}'`);

    const url = resolveResourceUrl(spec.resource_type, context);

    if (spec.resource_type == 'Gestalt::Resource::Node::Lambda') {
        // TODO: Workaround Meta bug of not accepting the resource_type for Lambdas and potentially other
        // resource types, otherwise get the following error:
        // StatusCodeError: 500 - {"code":500,"message":"Failed parsing JSON: {\"obj.resource_type\":[{\"msg\":[\"error.expected.uuid\"],\"args\":[]}]}"}
        spec = JSON.parse(JSON.stringify(spec));
        delete spec.resource_type;
    }

    const res = meta.POST(url, spec);
    return res;
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

// function fetchResourceById(type, id, context) {
//     return meta.GET(`/${context.org.fqon}/${type}/${id}`)
// }

function updateResource(type, spec, context) {
    context = context || getGestaltContext();
    validateTypeSpecContext(type, spec, context);

    // Make a copy before mutating
    spec = JSON.parse(JSON.stringify(spec));

    delete spec.resource_type;
    delete spec.resource_state;

    const res = meta.PUT(`/${context.org.fqon}/${type}/${spec.id}`, spec);
    return res;
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
        for (let o of options) {
            if (o == 'force') {
                if (options.force) {
                    suffix = '?force=true'
                }
            } else {
                throw Error(`Invalid option: ${o}`);
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

    const fmap = {
        'Gestalt::Resource::Node::Lambda': 'lambdas',
        'Gestalt::Resource::Container': 'containers',
        'Gestalt::Resource::Api': 'apis',
        'Gestalt::Resource::Environment': 'environments',
        'Gestalt::Resource::Workspace': 'workspaces',
        'Gestalt::Resource::Organization': 'orgs',
        'Gestalt::Resource::User': 'users',
        'Gestalt::Resource::Group': 'groups',
        'Gestalt::Resource::Volume': 'volumes'
        // TODO: 'Gestalt::Resource::ApiEndpoint': displayApiEndpoints,
    }

    let type = fmap[resourceType];
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

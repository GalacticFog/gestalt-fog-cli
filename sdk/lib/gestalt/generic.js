// Gestalt stuff
const meta = require('./metaclient')
const gestaltSession = require('../gestalt-session');
const { debug } = require('../debug');
const chalk = require('../chalk');
const util = require('../util');

const {
    resourceTypeToUrlType,
    typesNotAllowingResourceTypeFieldOnCreation,
} = require('./constants');

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
    getgestaltSession,
}

/**
 * Fetch resources from the context - Org, Workspace, or Environment context
 * @param {*} type 
 * @param {*} context 
 */
function fetchResources(type, context) {
    debug(`fetchResources(${type}, ${context})`);

    if (context.org) {
        if (context.workspace) {
            if (context.environment) {
                return fetchEnvironmentResources(type, context);
            }
            return fetchWorkspaceResources(type, context);
        }
        return fetchOrgResources(type, [context.org.fqon]);
    }
    throw Error(`fetchResources: Context doesn't contain org info`);
}

async function fetchOrgResources(type, fqonList, type2, options = {}) {
    debug(`fetchOrgResources(${type}, ${fqonList}, ${type2})`);
    if (!fqonList) throw Error('missing fqonList')

    let orgs = [];
    if (type == 'providers' && !options.noProviderFilter) {
        orgs = await meta.GET('/orgs?expand=true');
    }

    let promises = fqonList.map(fqon => {
        debug(chalk.dim.blue(`Fetching ${type} from ${fqon}...`));
        let url = `/${fqon}/${type}?expand=true`;
        if (type2) url += `&type=${type2}`;
        return meta.GET(url).then(res => {
            if (type == 'providers' && !options.noProviderFilter) {
                debug(`fetchOrgResources: Filtering Org providers by fqon '${fqon}'`);
                const org = orgs.find(o => o.properties.fqon == fqon);
                const context = { org: { id: org.id, name: org.name, fqon: org.properties.fqon } };
                return filterProvidersByContext(res, context);
            }
            return res;
        });

    });

    // return Promise.all(promises).then(results => {
    //     const result = [].concat.apply([], results);
    //     return result.sort();
    // });

    const results = await Promise.all(promises);
    const result = [].concat.apply([], results);
    return result.sort();
}

async function fetchResourcesFromOrgEnvironments(type, fqonList, type2) {
    if (!fqonList) fqonList = [getgestaltSession().org.fqon];

    let promises = fqonList.map(fqon => {
        const res = _fetchResourcesFromOrgEnvironments(type, fqon);
        return res;
    });

    // return Promise.all(promises).then(results => {
    //     return [].concat.apply([], results);
    // });
    const results = await Promise.all(promises);
    return [].concat.apply([], results);
}

async function _fetchResourcesFromOrgEnvironments(type, fqon) {
    const envs = await fetchOrgResources("environments", [fqon]);
    const promises = envs.map(env => {
        debug(chalk.dim.blue(`Fetching ${type} from ${fqon}/'${env.name}'...`));
        const context = {
            org: {
                fqon: fqon
            },
            environment: {
                id: env.id
            }
        }
        return fetchEnvironmentResources(type, context).then(res => {
            for (let c of res) {
                c.environment = {
                    name: env.name,
                    description: env.description,
                    id: env.id
                };
            }
            return res;
        }).catch(err => {
            console.error(chalk.yellow('Warning: ' + err.message));
            debug(chalk.yellow(err.stack));
            return [];
        });
    });

    const arr = await Promise.all(promises);
    const resources = [].concat.apply([], arr);
    return resources;
}

async function fetchWorkspaceResources(type, context, filterType, options = {}) {
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.workspace) throw Error("No Workspace in current context");
    if (!context.workspace.id) throw Error("No Workspace ID in current context");
    let url = `/${context.org.fqon}/workspaces/${context.workspace.id}/${type}?expand=true`;
    if (filterType) url += `&type=${filterType}`;
    const res = await meta.GET(url);
    if (type == 'providers' && !options.noProviderFilter) {
        return filterProvidersByContext(res, context);
    }
    return res;
}

async function fetchEnvironmentResources(type, context, filterType, options = {}) {
    debug(`fetchEnvironmentResources(${type}, ${context}, ${filterType}`);

    if (!context) throw Error("missing context.org");
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");

    // Special case
    if (type == 'Gestalt::Resource::ApiEndpoint' || type == 'apiendpoints') {
        return fetchEnvironmentApiEndpoints(context);
    } else if (type.startsWith('Gestalt::Resource::Rule::') || type == 'policyrules') {
        return fetchEnvironmentPolicyRules(context);
    }

    type = resourceTypeToUrlType[type] || type;
    if (!type) throw Error("Type not specified");

    if (!context.environment) throw Error("No Environment in current context");
    if (!context.environment.id) throw Error("No Environment ID in current context");
    let url = `/${context.org.fqon}/environments/${context.environment.id}/${type}?expand=true`;
    if (filterType) url += `&type=${filterType}`
    const resources = await meta.GET(url);
    if (type == 'providers' && !options.noProviderFilter) {
        return filterProvidersByContext(resources, context);
    }
    return resources;
}

function filterProvidersByContext(resources, context) {
    const filtered = resources.filter(p => {
        if (context.org) {
            if (!p.properties.parent || !p.properties.parent.id) {
                debug(`filterResources: provider ${p.name} has no parent`);
                return context.org.name == 'root';
            }

            if (context.workspace) {
                if (context.environment && context.environment.id) {
                    return p.properties.parent.id == context.environment.id;
                }
                return p.properties.parent.id == context.workspace.id;
            }
            return p.properties.parent.id == context.org.id;
        }
        return true;
    });
    return filtered;
}

async function fetchEnvironmentApiEndpoints(context) {
    // See if the context contains an api resource, otherwise, fetch all apis from environment and
    // iterate through them
    if (context.api && context.api.id) {
        const res = await meta.GET(`/${context.org.fqon}/apis/${context.api.id}/apiendpoints?expand=true`)

        decorateApiEndpointsWithApiContext(res, context.api);

        return res;
    } else {
        // First fetch apis
        let apiendpoints = []
        const apis = await fetchEnvironmentResources('apis', context);
        for (const api of apis) {
            const res = await meta.GET(`/${context.org.fqon}/apis/${api.id}/apiendpoints?expand=true`)
            decorateApiEndpointsWithApiContext(res, api);
            apiendpoints = apiendpoints.concat(res);
        }
        return apiendpoints;
    }
}

// HACK, since API endpoint doesn't have an association back to the API
function decorateApiEndpointsWithApiContext(apiendpoints, api) {
    for (const e of apiendpoints) {
        e.context = {
            api: {
                id: api.id
            }
        }
    }
}

// HACK, since API endpoint doesn't have an association back to the API
function decoratePolicyRuleWithPolicyContext(policyrules, policy) {
    for (const pr of policyrules) {
        pr.context = {
            policy: {
                id: policy.id
            }
        }
    }
}


async function fetchEnvironmentPolicyRules(context) {
    // fetch all policies from the current environment, and 
    let policyrules = []
    const policies = await fetchEnvironmentResources('policies', context);
    for (const policy of policies) {
        // console.log(chalk.yellow(`policy: ${policy.name}`));
        const rules = await meta.GET(`/${context.org.fqon}/policies/${policy.id}/rules?expand=true`);
        decoratePolicyRuleWithPolicyContext(rules, policy); // HACK to decorate policy rule info with policy for export and apply
        policyrules = policyrules.concat(rules);
    }
    return policyrules;
}

function createEnvironmentResource(group, spec, context) {
    if (!group) throw Error('missing group');
    if (!spec) throw Error('missing spec');
    if (!spec.name) throw Error('missing spec.name');
    // TODO: Other required parameters

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

    debug(`createResource(${spec.resource_type})`)

    // Special cases
    if (spec.resource_type == 'Gestalt::Resource::ApiEndpoint') {
        return createApiEndpoint(spec, context);
    } else if (spec.resource_type.indexOf('Gestalt::Resource::Rule::') == 0) {
        return createPolicyRule(spec, context);
    } else if (spec.resource_type == 'Gestalt::Resource::Organization') {
        return createOrg(spec, context);
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

function createOrg(org, context) {
    if (!org) throw Error('missing org');
    if (!org.name) throw Error('missing org.name');
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    delete org.resource_type
    const res = meta.POST(`/${context.org.fqon}`, org);
    return res;
}

/**
 * Creates an ApiEndpoint resource.  The ApiEndpoint requires a parent API object, which either
 * needs to provided in the Context (context.api) or embedded in the spec (spec.context.api).
 * @param {*} spec ApiEndpoint spec
 * @param {*} providedContext Context to create the ApiEndpoint resource.
 */
function createApiEndpoint(spec, context) {
    if (!spec) throw Error('missing spec');
    if (!spec.name) throw Error('missing spec.name');
    // TODO: Other required parameters

    if (!context) throw Error("missing context.org");
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.api) {
        if (!spec.context) throw Error("no context.api, missing spec.context");
        if (!spec.context.api) throw Error("no context.api, missing spec.context.api");
        if (!spec.context.api.id) throw Error("no context.api, missing spec.context.api.id");
        context = util.cloneObject(context);
        context.api = spec.context.api;
    }
    if (!context.api) throw Error("missing context.api");
    if (!context.api.id) throw Error("missing context.api.id");

    spec = util.cloneObject(spec);
    delete spec.resource_type; // Otherwise {"code":500,"message":"Failed parsing JSON: {\"obj.resource_type\":[{\"msg\":[\"error.expected.uuid\"],\"args\":[]}]}"}
    delete spec.context;
    return meta.POST(`/${context.org.fqon}/apis/${context.api.id}/apiendpoints`, spec);
}


/**
 * Creates a PolicyRule resource.  The ApiEndpoint requires a parent API object, which either
 * needs to provided in the Context (context.policy) or embedded in the spec (spec.context.policy).
 * @param {*} spec ApiEndpoint spec
 * @param {*} providedContext Context to create the ApiEndpoint resource.
 */
function createPolicyRule(spec, context) {
    if (!spec) throw Error('missing spec');
    if (!spec.name) throw Error('missing spec.name');
    // TODO: Other required parameters

    if (!context) throw Error("missing context.org");
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.policy) {
        if (!spec.context) throw Error("no context.policy, missing spec.context");
        if (!spec.context.policy) throw Error("no context.policy, missing spec.context.policy");
        if (!spec.context.policy.id) throw Error("no context.policy, missing spec.context.policy.id");
        context = util.cloneObject(context);
        context.policy = spec.context.policy;
    }
    if (!context.policy) throw Error("missing context.policy");
    if (!context.policy.id) throw Error("missing context.policy.id");

    spec = util.cloneObject(spec);
    // delete spec.resource_type; // Otherwise {"code":500,"message":"Failed parsing JSON: {\"obj.resource_type\":[{\"msg\":[\"error.expected.uuid\"],\"args\":[]}]}"}
    delete spec.context;
    return meta.POST(`/${context.org.fqon}/policies/${context.policy.id}/rules`, spec);
}

async function fetchResource(type, spec, context) {
    if (!type) throw Error('No type')
    if (!spec) throw Error('No spec')
    if (!spec.name && !spec.id) throw Error('No spec.name or spec.id fields')

    if (!context) throw Error("missing context.org");
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");

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
    if (!context) throw Error("missing context.org");
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    validateTypeSpecContext(type, spec, context);

    // Make a copy before mutating
    spec = util.cloneObject(spec);

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
    return gestaltSession.getSessionConfig();
}

function getgestaltSession() {
    return gestaltSession.getContext();
}




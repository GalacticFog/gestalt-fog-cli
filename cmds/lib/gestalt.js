// Gestalt stuff
const request = require('request-promise-native');
const querystring = require('querystring');
const gestaltContext = require('./gestalt-context');

// Exports

exports.resourceTypeIds = {
    workspace: 'fa17bae4-1294-42cc-93cc-c4ead7dc0343',
    environment: '',
    org: ''
}

exports.getHost = () => {
    let host = getGestaltConfig()['gestalt_url'];
    host = host.trim();
    if (host.indexOf('://') > -1) {
        host = String(host).substring(host.indexOf('://') + 3);
    }
    return host;
}

exports.getEnvironmentResourceTypes = () => {
    return ['lambdas', 'apis', 'containers'];
}

exports.fetchOrgFqons = () => {
    return meta_GET('/orgs?expand=true').then(res => {
        return res.map(item => item.properties.fqon).sort();
    });
}

// exports.fetchOrgFqons = () => {
//     const res = meta_GET('/orgs?expand=true');
//     const list = res.map(item => item.properties.fqon).sort();
//     return list;
// }

exports.fetchOrgs = () => {
    return meta_GET('/orgs?expand=true');
}

exports.fetchWorkspaceEnvironments = (context) => {
    context = context || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.workspace) throw Error("No Workspace in current context");
    if (!context.workspace.id) throw Error("No Workspace ID in current context");

    return meta_GET(`/${context.org.fqon}/workspaces/${context.workspace.id}/environments?expand=true`)
}

exports.fetchOrgWorkspaces = (fqonList) => {
    return fetchFromOrgs("workspaces", fqonList);
}

// TODO: Unsure if this gets all providers
exports.fetchOrgProviders = (fqonList, type) => {
    return fetchFromOrgs("providers", fqonList, type);
}

exports.fetchUsers = () => {
    return fetchFromOrgs("users", ['root']);
}

exports.fetchGroups = () => {
    return fetchFromOrgs("groups", ['root']);
}

exports.fetchOrgEnvironments = fetchOrgEnvironments;

function fetchOrgEnvironments(fqonList) {
    return fetchFromOrgs("environments", fqonList);
}

exports.fetchOrgApis = (fqonList) => {
    return fetchFromOrgs("apis", fqonList);
}

exports.fetchOrgLambdas = (fqonList) => {
    return fetchFromOrgs("lambdas", fqonList);
}

exports.fetchOrgContainers = (fqonList) => {
    if (!fqonList) fqonList = [getGestaltContext().org.fqon];

    let promises = fqonList.map(fqon => {
        const res = fetchContainersFromOrg(fqon);
        return res;
    });

    return Promise.all(promises).then(results => {
        return [].concat.apply([], results);
    });
}

async function fetchContainersFromOrg(fqon) {
    const context = getGestaltContext();
    if (!fqon) fqon = context.org.fqon; // default org

    const envs = await fetchOrgEnvironments([fqon]);
    const promises = envs.map(env => {
        console.log(`Fetching containers from ${fqon}/'${env.name}'`);
        const context2 = {
            org: {
                fqon: fqon
            },
            environment: {
                id: env.id
            }
        }
        return fetchEnvironmentContainers(context2).then(containers => {
            for (let c of containers) {
                c.environment = {
                    name: env.name,
                    description: env.description,
                    id: env.id
                };
            }
            return containers;
        }).catch(err => {
            console.log('Warning: ' + err.message);
            return [];
        });
    });

    const arr = await Promise.all(promises);
    const containers = [].concat.apply([], arr);
    return containers;
}

function fetchFromOrgs(type, fqonList, type2) {
    if (!fqonList) fqonList = [getGestaltContext().org.fqon];

    let promises = fqonList.map(fqon => {
        console.log(`Fetching ${type} from ${fqon}...`);
        let url = `/${fqon}/${type}?expand=true`;
        if (type2) url += `&type=${type2}`;
        const res = meta_GET(url);
        return res;
    });

    return Promise.all(promises).then(results => {
        return [].concat.apply([], results);
    });
}

// TODO: Unsure if this gets all providers
exports.fetchEnvironmentProviders = (providedContext, type) => {
    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.environment) throw Error("No Environment in current context");
    if (!context.environment.id) throw Error("No Environment ID in current context");
    let url = `/${context.org.fqon}/environments/${context.environment.id}/providers?expand=true`;
    if (type) url += `&type=${type}`;
    return meta_GET(url).then(providers => {
        for (let c of providers) {
            c.environment = context.environment;
            c.workspace = context.workspace;
        }
        return providers;
    });
}

exports.fetchWorkspaceProviders = (providedContext, type) => {
    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.workspace) throw Error("No Environment in current context");
    if (!context.workspace.id) throw Error("No Environment ID in current context");
    let url = `/${context.org.fqon}/workspaces/${context.workspace.id}/providers?expand=true`;
    if (type) url += `&type=${type}`;
    return meta_GET(url).then(providers => {
        for (let c of providers) {
            // c.environment = context.environment;
            c.workspace = context.workspace;
        }
        return providers;
    });
}

exports.fetchEnvironmentApis = (providedContext) => {
    return fetchFromEnvironment('apis', providedContext);
}

exports.fetchEnvironmentContainers = fetchEnvironmentContainers;
function fetchEnvironmentContainers(providedContext) {
    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.environment) throw Error("No Environment in current context");
    if (!context.environment.id) throw Error("No Environment ID in current context");
    let url = `/${context.org.fqon}/environments/${context.environment.id}/containers?expand=true`;
    return meta_GET(url).then(containers => {
        for (let c of containers) {
            c.environment = context.environment;
            c.workspace = context.workspace;
        }
        return containers;
    });
}

exports.fetchEnvironmentResources = (type, providedContext) => {
    return fetchFromEnvironment(type, providedContext);
}

exports.fetchEnvironmentLambdas = (providedContext) => {
    return fetchFromEnvironment('lambdas', providedContext);
}

exports.fetchEnvironmentPolicies = (providedContext) => {
    return fetchFromEnvironment('policies', providedContext);
}

function fetchFromEnvironment(type, providedContext, type2) {
    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.environment) throw Error("No Environment in current context");
    if (!context.environment.id) throw Error("No Environment ID in current context");
    if (!type) throw Error("Type not specified");
    let url = `/${context.org.fqon}/environments/${context.environment.id}/${type}?expand=true`;
    if (type2) url += `&type=${type2}`
    return meta_GET(url);
}

exports.fetchApiEndpoints = (apiList) => {
    if (!apiList) throw Error("No apiList provided");

    let eps = apiList.map(api => {
        const res = meta_GET(`/${api.fqon}/apis/${api.id}/apiendpoints?expand=true`)
        return res;
    });

    return Promise.all(eps).then(results => {
        return [].concat.apply([], results);
    });
}

exports.fetchProviderContainers = (providerSpec) => {
    if (!providerSpec.org) throw Error("No Org in current context");
    if (!providerSpec.org.properties) throw Error("No FQON in current context");
    if (!providerSpec.org.properties.fqon) throw Error("No FQON in current context");
    const fqon = providerSpec.org.properties.fqon; // default org
    return meta_GET(`/${fqon}/providers/${providerSpec.id}/containers`); // can't use '?expand=true' unless in environment
}


// function fetchFromOrg(type, fqon) {
//     if (!fqon) fqon = getGestaltContext().org.fqon;
//     const res = meta_GET(`/${fqon}/${type}?expand=true`)
//     return res;
// }


// function fetchFromOrgs(type, fqonList) {
//     if (!fqonList) fqonList = [getGestaltContext().org.fqon];

//     let apis = fqonList.map(fqon => {
//         const res = meta_GET(`/${fqon}/${type}?expand=true`)
//         return res;
//     });

//     apis = [].concat.apply([], apis); // flatten array

//     return apis;
// }

exports.fetchCurrentEnvironment = () => {
    const context = getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.environment) throw Error("missing context.environment");
    if (!context.environment.id) throw Error("missing context.environment.id");
    return this.fetchEnvironment(context.org.fqon, context.environment.id);
}

exports.fetchEnvironment = (fqonOrContext, uid) => {
    // First argument could be a context object or an fqon
    let context = fqonOrContext;
    if (context.org && context.environment) {
        fqonOrContext = context.org.fqon;
        uid = context.environment.id;
    }
    if (!fqonOrContext) throw Error("missing fqon");
    if (!uid) throw Error("mising uid");
    return meta_GET(`/${fqonOrContext}/environments/${uid}`)
}

exports.fetchWorkspace = (context) => {
    if (context.org && context.workspace) {
        fqon = context.org.fqon;
        uid = context.workspace.id;
    }
    if (!fqon) throw Error("missing fqon");
    if (!uid) throw Error("mising uid");
    return meta_GET(`/${fqon}/workspaces/${uid}`)
}

exports.fetchContainer = (spec, providedContext) => {
    const context = providedContext || getGestaltContext();

    let fqon = null;
    let id = null;

    if (spec) {
        if (!spec.id) throw Error("No container.id");
        if (!spec.fqon) {
            if (!context.org.fqon) throw Error("No container.fqon or context.org.fqon");
            fqon = context.org.fqon;
        } else {
            fqon = spec.fqon;
        }
        id = spec.id;
    } else {
        if (!context.container) throw Error("No context.container");
        if (!context.container.id) throw Error("No context.container.id");
        if (!context.org) throw Error("No context.org");
        if (!context.org.fqon) throw Error("No context.org.fqon");

        fqon = context.container.fqon || context.org.fqon;
        id = context.container.fqon
    }

    return meta_GET(`/${fqon}/containers/${id}`)
}

exports.createContainer = (spec, providedContext) => {
    if (!spec) throw Error('missing container');
    if (!spec.name) throw Error('missing container.name');
    // TODO: Other required parameters

    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.environment) throw Error("missing context.environment");
    if (!context.environment.id) throw Error("missing context.environment.id");
    return meta_POST(`/${context.org.fqon}/environments/${context.environment.id}/containers`, spec);
}

exports.createLambda = (spec, providedContext) => {
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

    const res = meta_POST(`/${context.org.fqon}/environments/${context.environment.id}/lambdas`, spec);
    return res;
}

exports.createApi = (spec, providedContext) => {
    if (!spec) throw Error('missing spec');
    if (!spec.name) throw Error('missing spec.name');
    // TODO: Other required parameters

    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.environment) throw Error("missing context.environment");
    if (!context.environment.id) throw Error("missing context.environment.id");
    return meta_POST(`/${context.org.fqon}/environments/${context.environment.id}/apis`, spec);
}

exports.createApiEndpoint = (spec, providedContext) => {
    if (!spec) throw Error('missing spec');
    if (!spec.name) throw Error('missing spec.name');
    // TODO: Other required parameters

    const context = providedContext || getGestaltContext();

    console.log(context)

    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.api) throw Error("missing context.api");
    if (!context.api.id) throw Error("missing context.api.id");
    return meta_POST(`/${context.org.fqon}/apis/${context.api.id}/apiendpoints`, spec);
}

exports.createOrgProvider = (provider, parentFqon) => {
    if (!provider) throw Error('missing provider');
    if (!provider.name) throw Error('missing provider.name');

    const context = parentFqon ? { org: { fqon: parentFqon } } : getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    const res = meta_POST(`/${context.org.fqon}/providers`, provider);
    return res;
}

// TODO createWorkspaceProvider
// TODO createEnvironmentProvider
// TODO createProvider --> createOrgProvider, createWorkspaceProvider, createEnvironmentProvider

exports.createOrg = (org, parentFqon) => {
    if (!org) throw Error('missing org');
    if (!org.name) throw Error('missing org.name');

    const context = parentFqon ? { org: { fqon: parentFqon } } : getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    const res = meta_POST(`/${context.org.fqon}`, org);
    return res;
}

exports.createWorkspace = (workspace, parentFqon) => {
    if (!workspace) throw Error('missing workspace');
    if (!workspace.name) throw Error('missing workspace.name');

    const context = parentFqon ? { org: { fqon: parentFqon } } : getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    const res = meta_POST(`/${context.org.fqon}/workspaces`, workspace);
    return res;
}

exports.createEnvironment = (environment, providedContext) => {
    if (!environment) throw Error('missing environment');
    if (!environment.name) throw Error('missing environment.name');
    if (!environment.properties) throw Error('missing environment.properties');
    if (!environment.properties.environment_type) throw Error('missing environment.properties.environment_type');

    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.workspace) throw Error("missing context.workspace");
    if (!context.workspace.id) throw Error("missing context.workspace.id");

    const res = meta_POST(`/${context.org.fqon}/workspaces/${context.workspace.id}/environments`, environment);
    return res;
}

exports.updateContainer = (container, providedContext) => {
    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!container) throw Error("missing container");
    if (!container.id) throw Error("missing container.id");

    delete container.resource_type;
    delete container.resource_state;

    const res = meta_PUT(`/${context.org.fqon}/containers/${container.id}`, container);
    return res;
}

exports.deleteContainer = (container /*, providedContext*/) => {
    if (!container) throw Error('missing container');
    if (!container.id) throw Error('missing container.id');
    if (!container.org) throw Error('missing container.org');
    if (!container.org.properties) throw Error('missing container.org.properties');
    if (!container.org.properties.fqon) throw Error('missing container.org.properties.fqon');

    const fqon = container.org.properties.fqon;

    // const context = providedContext || getGestaltContext();
    // if (!context.org) throw Error("missing context.org");
    // if (!context.org.fqon) throw Error("missing context.org.fqon");
    // if (!container) throw Error("missing container");
    // if (!container.id) throw Error("missing container.id");

    delete container.resource_type;
    delete container.resource_state;

    const res = meta_DELETE(`/${fqon}/containers/${container.id}`);
    return res;
}


// Lambdas

exports.fetchLambda = (lambda) => {
    const context = getGestaltContext();
    let fqon = null;
    let id = null;

    if (lambda) {
        if (!lambda.id) throw Error("No lambda.id");
        if (!lambda.fqon) {
            if (!context.org.fqon) throw Error("No lambda.fqon or context.org.fqon");
            fqon = context.org.fqon;
        } else {
            fqon = lambda.fqon;
        }
        id = lambda.id;
    } else {
        if (!context.lambda) throw Error("No context.lambda");
        if (!context.lambda.id) throw Error("No context.lambda.id");
        if (!context.org) throw Error("No context.org");
        if (!context.org.fqon) throw Error("No context.org.fqon");

        fqon = context.lambda.fqon || context.org.fqon;
        id = context.lambda.fqon
    }

    const res = meta_GET(`/${fqon}/lambdas/${id}`)
    return res;
}


exports.deleteLambda = (lambda) => {
    if (!lambda) throw Error('missing lambda');
    if (!lambda.id) throw Error('missing lambda.id');
    if (!lambda.org) throw Error('missing lambda.org');
    if (!lambda.org.properties) throw Error('missing lambda.org.properties');
    if (!lambda.org.properties.fqon) throw Error('missing lambda.org.properties.fqon');

    const fqon = lambda.org.properties.fqon;

    // const context = providedContext || getGestaltContext();
    // if (!context.org) throw Error("missing context.org");
    // if (!context.org.fqon) throw Error("missing context.org.fqon");
    // if (!container) throw Error("missing container");
    // if (!container.id) throw Error("missing container.id");

    delete lambda.resource_type;
    delete lambda.resource_state;

    const res = meta_DELETE(`/${fqon}/lambdas/${lambda.id}`);
    return res;
}


exports.fetchOrgEntitlements = (context) => {
    context = context || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    const res = meta_GET(`/${context.org.fqon}/entitlements?expand=true`)
    return res;
}

exports.fetchWorkspaceEntitlements = (context) => {
    context = context || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.workspace) throw Error("No Workspace in current context");
    if (!context.workspace.id) throw Error("No Workspace ID in current context");
    const res = meta_GET(`/${context.org.fqon}/workspaces/${context.workspace.id}/entitlements?expand=true`)
    return res;
}

exports.fetchEnvironmentEntitlements = (context) => {
    context = context || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.environment) throw Error("No Workspace in current context");
    if (!context.environment.id) throw Error("No Workspace ID in current context");
    const res = meta_GET(`/${context.org.fqon}/environments/${context.environment.id}/entitlements?expand=true`)
    return res;
}

exports.getCurrentWorkspace = () => {
    return getGestaltContext().workspace;
}

exports.getCurrentEnvironment = () => {
    return getGestaltContext().environment;
}

exports.getCurrentOrg = () => {
    return getGestaltContext().org;
}

exports.getEnvironment = (uid, context) => {
    context = context || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    return meta_GET(`/${context.org.fqon}/environments/${uid}`)
}

exports.setCurrentWorkspace = (s) => {
    if (!s) throw Error("Workspace not specified")
    if (!s.id) throw Error("Workspace ID not specified")

    const ws = {
        id: s.id,
        name: s.name,
        description: s.description
    }

    const context = getGestaltContext();
    Object.assign(context, { workspace: ws }); // merge in context

    delete context.environment;
    delete context.container;

    gestaltContext.setContext(context);
}

exports.setCurrentEnvironment = (s) => {
    if (!s) throw Error("Environment not specified")
    if (!s.id) throw Error("Environment ID not specified")

    const env = {
        id: s.id,
        name: s.name,
        description: s.description
    }

    const context = getGestaltContext();
    Object.assign(context, { environment: env }); // merge in context

    delete context.container;

    gestaltContext.setContext(context);
}

// exports.setCurrentContainer = (s) => {
//     if (!s) throw Error("container not specified")
//     if (!s.id) throw Error("container.id not specified")
//     let fqon = null;
//     if (s.fqon) {
//         fqon = s.fqon;
//     } else {
//         if (s.org) {
//             if (s.org.properties) {
//                 if (s.org.properties.fqon) {
//                     fqon = s.org.properties.fqon;
//                 }
//             }
//         }
//     }
//     if (!fqon) throw Error("fqon not found in parameter");

//     const ctr = {
//         id: s.id,
//         name: s.name,
//         fqon: fqon
//     }

//     const context = getGestaltContext();
//     Object.assign(context, { container: ctr }); // merge in context

//     gestaltContext.setContext(context);
// }

exports.setCurrentOrg = (s) => {
    if (!s) throw Error("Org not specified")
    if (!s.fqon) throw Error("Org fqon not specified")

    const org = {
        id: s.id,
        name: s.name,
        description: s.description,
        fqon: s.fqon
    }

    const context = getGestaltContext();
    Object.assign(context, { org: org }); // merge in context

    delete context.workspace;
    delete context.environment;
    delete context.container;

    gestaltContext.setContext(context);
}

exports.getContext = () => {
    // returns a copy of the writen context    
    return getGestaltContext();
}

exports.authenticate = (creds, callback) => {//(username, password) => {

    const security_url = getGestaltConfig()['gestalt_url'] + '/security';
    const url = '/root/oauth/issue';

    const username = creds['username'];
    const password = creds['password'];

    if (!username) throw Error("Username missing from creds");
    if (!password) throw Error("Password missing from creds");

    const postData = querystring.stringify({
        grant_type: "password",
        username: username,
        password: password
    });

    const res = request({
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        },

        body: postData,
        method: 'POST',
        uri: `${security_url}${url}`
    }).then(body => {

        const auth = JSON.parse(body); // JSON.parse(String(res.getBody()));

        // Enhance payload with username
        auth.username = username;

        const contents = `${JSON.stringify(auth, null, 2)}\n`;

        gestaltContext.saveAuthToken(contents);

        callback(null, { username: username });
    }).catch(res => {
        // console.log(JSON.stringify(res,null, 2))
        if (res.message) {
            callback(res.message);
        } else if (res.response && res.response.body) {
            callback(JSON.parse(res.response.body).error_description);
        } else {
            callback(res);
        }
    });
}


// Authenticated HTTP calls

exports.httpGet = http_GET;
exports.httpPut = http_PUT;
exports.httpPost = http_POST;
exports.httpDelete = http_DELETE;

async function http_GET(url, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    options.method = 'GET';
    options.uri = url;
    // console.log(`GET ${url}`)
    const res = await request(options);
    return JSON.parse(res);
}

async function http_POST(url, body, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    options.json = body;
    options.method = 'POST';
    options.uri = url;
    const res = await request(options);
    return res;
}

async function http_PUT(url, body, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    options.json = body;
    options.method = 'PUT';
    options.uri = url;
    const res = await request(options);
    return res;
}

async function http_DELETE(url, body, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    options.json = body;
    options.method = 'DELETE';
    options.uri = url;
    const res = await request(options);
    return res;
}


// Functions

function meta_GET(url, opts) {
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';
    return http_GET(`${meta_url}${url}`, opts);
}

function meta_POST(url, body, opts) {
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';
    return http_POST(`${meta_url}${url}`, body, opts);
}

function meta_PUT(url, body, opts) {
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';
    return http_PUT(`${meta_url}${url}`, body, opts);
}

function meta_DELETE(url, opts) {
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';
    return http_DELETE(`${meta_url}${url}`, undefined, opts);
}

// Internal Context functions 

function getCachedAuthToken() {
    return gestaltContext.getCachedAuthToken();
}

function getGestaltConfig() {
    return gestaltContext.getConfig();
}

function getGestaltContext() {
    return gestaltContext.getContext();
}

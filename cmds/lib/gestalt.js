// Gestalt stuff
const request = require('request-promise-native');
const querystring = require('querystring');
const gestaltState = require('./gestalt-state');

// Exports

exports.getHost = () => {
    let host = getGestaltConfig()['gestalt_url'];
    host = host.trim();
    if (host.indexOf('://') > -1) {
        host = String(host).substring(host.indexOf('://') + 3);
    }
    return host;
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

exports.fetchWorkspaceEnvironments = (state) => {
    state = state || getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!state.workspace) throw Error("No Workspace in current context");
    if (!state.workspace.id) throw Error("No Workspace ID in current context");

    return meta_GET(`/${state.org.fqon}/workspaces/${state.workspace.id}/environments?expand=true`)
}

exports.fetchOrgWorkspaces = (fqonList) => {
    return fetchFromOrgs("workspaces", fqonList);
}

// TODO: Unsure if this gets all providers
exports.fetchOrgProviders = (fqonList) => {
    return fetchFromOrgs("providers", fqonList);
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
    if (!fqonList) fqonList = [getGestaltState().org.fqon];

    let promises = fqonList.map(fqon => {
        const res = fetchContainersFromOrg(fqon);
        return res;
    });

    return Promise.all(promises).then(results => {
        return [].concat.apply([], results);
    });
}

async function fetchContainersFromOrg(fqon) {
    const state = getGestaltState();
    if (!fqon) fqon = state.org.fqon; // default org

    const envs = await fetchOrgEnvironments([fqon]);
    const promises = envs.map(env => {
        console.log(`Fetching containers from ${fqon}/'${env.name}'`);
        const state2 = {
            org: {
                fqon: fqon
            },
            environment: {
                id: env.id
            }
        }
        return fetchEnvironmentContainers(state2).then(containers => {
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

function fetchFromOrgs(type, fqonList) {
    if (!fqonList) fqonList = [getGestaltState().org.fqon];

    let promises = fqonList.map(fqon => {
        console.log(`Fetching ${type} from ${fqon}...`);
        const res = meta_GET(`/${fqon}/${type}?expand=true`)
        return res;
    });

    return Promise.all(promises).then(results => {
        return [].concat.apply([], results);
    });
}

// TODO: Unsure if this gets all providers
exports.fetchEnvironmentProviders = (providedState) => {
    const state = providedState || getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!state.environment) throw Error("No Environment in current context");
    if (!state.environment.id) throw Error("No Environment ID in current context");
    let url = `/${state.org.fqon}/environments/${state.environment.id}/providers?expand=true`;
    return meta_GET(url).then(providers => {
        for (let c of providers) {
            c.environment = state.environment;
            c.workspace = state.workspace;
        }
        return providers;
    });
}

exports.fetchWorkspaceProviders = (providedState) => {
    const state = providedState || getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!state.workspace) throw Error("No Environment in current context");
    if (!state.workspace.id) throw Error("No Environment ID in current context");
    let url = `/${state.org.fqon}/workspaces/${state.workspace.id}/providers?expand=true`;
    return meta_GET(url).then(providers => {
        for (let c of providers) {
            // c.environment = state.environment;
            c.workspace = state.workspace;
        }
        return providers;
    });
}

exports.fetchEnvironmentApis = (providedState) => {
    return fetchFromEnvironment('apis', providedState);
}

exports.fetchEnvironmentContainers = fetchEnvironmentContainers;
function fetchEnvironmentContainers(providedState) {
    const state = providedState || getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!state.environment) throw Error("No Environment in current context");
    if (!state.environment.id) throw Error("No Environment ID in current context");
    let url = `/${state.org.fqon}/environments/${state.environment.id}/containers?expand=true`;
    return meta_GET(url).then(containers => {
        for (let c of containers) {
            c.environment = state.environment;
            c.workspace = state.workspace;
        }
        return containers;
    });
}

exports.fetchEnvironmentLambdas = (providedState) => {
    return fetchFromEnvironment('lambdas', providedState);
}

exports.fetchEnvironmentPolicies = (providedState) => {
    return fetchFromEnvironment('policies', providedState);
}

function fetchFromEnvironment(type, providedState, type2) {
    const state = providedState || getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!state.environment) throw Error("No Environment in current context");
    if (!state.environment.id) throw Error("No Environment ID in current context");
    if (!type) throw Error("Type not specified");
    let url = `/${state.org.fqon}/environments/${state.environment.id}/${type}?expand=true`;
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

exports.fetchProviderContainers = (provider) => {
    if (!provider.org) throw Error("No Org in current context");
    if (!provider.org.properties) throw Error("No FQON in current context");
    if (!provider.org.properties.fqon) throw Error("No FQON in current context");
    const fqon = provider.org.properties.fqon; // default org
    return meta_GET(`/${fqon}/providers/${provider.id}/containers`); // can't use '?expand=true' unless in environment
}


// function fetchFromOrg(type, fqon) {
//     if (!fqon) fqon = getGestaltState().org.fqon;
//     const res = meta_GET(`/${fqon}/${type}?expand=true`)
//     return res;
// }


// function fetchFromOrgs(type, fqonList) {
//     if (!fqonList) fqonList = [getGestaltState().org.fqon];

//     let apis = fqonList.map(fqon => {
//         const res = meta_GET(`/${fqon}/${type}?expand=true`)
//         return res;
//     });

//     apis = [].concat.apply([], apis); // flatten array

//     return apis;
// }

exports.fetchCurrentEnvironment = () => {
    const state = getGestaltState();
    if (!state.org) throw Error("missing state.org");
    if (!state.org.fqon) throw Error("missing state.org.fqon");
    if (!state.environment) throw Error("missing state.environment");
    if (!state.environment.id) throw Error("missing state.environment.id");
    return this.fetchEnvironment(state.org.fqon, state.environment.id);
}

exports.fetchEnvironment = (fqon, uid) => {
    if (!fqon) throw Error("missing fqon");
    if (!uid) throw Error("mising uid");
    return meta_GET(`/${fqon}/environments/${uid}`)
}

exports.fetchContainer = (container) => {
    const state = getGestaltState();
    let fqon = null;
    let id = null;

    if (container) {
        if (!container.id) throw Error("No container.id");
        if (!container.fqon) {
            if (!state.org.fqon) throw Error("No container.fqon or state.org.fqon");
            fqon = state.org.fqon;
        } else {
            fqon = container.fqon;
        }
        id = container.id;
    } else {
        if (!state.container) throw Error("No state.container");
        if (!state.container.id) throw Error("No state.container.id");
        if (!state.org) throw Error("No state.org");
        if (!state.org.fqon) throw Error("No state.org.fqon");

        fqon = state.container.fqon || state.org.fqon;
        id = state.container.fqon
    }

    return meta_GET(`/${fqon}/containers/${id}`)
}

exports.createContainer = (container, providedState) => {
    if (!container) throw Error('missing container');
    if (!container.name) throw Error('missing container.name');
    // TODO: Other required parameters

    const state = providedState || getGestaltState();
    if (!state.org) throw Error("missing state.org");
    if (!state.org.fqon) throw Error("missing state.org.fqon");
    if (!state.environment) throw Error("missing state.environment");
    if (!state.environment.id) throw Error("missing state.environment.id");
    return meta_POST(`/${state.org.fqon}/environments/${state.environment.id}/containers`, container);
}

exports.createLambda = (lambda, providedState) => {
    if (!lambda) throw Error('missing lambda');
    if (!lambda.name) throw Error('missing lambda.name');
    // TODO: Other required parameters

    const state = providedState || getGestaltState();
    if (!state.org) throw Error("missing state.org");
    if (!state.org.fqon) throw Error("missing state.org.fqon");
    if (!state.environment) throw Error("missing state.environment");
    if (!state.environment.id) throw Error("missing state.environment.id");
    const res = meta_POST(`/${state.org.fqon}/environments/${state.environment.id}/lambdas`, lambda);
    return res;
}

exports.createOrg = (org, parentFqon) => {
    if (!org) throw Error('missing org');
    if (!org.name) throw Error('missing org.name');

    const state = parentFqon ? { org: { fqon: parentFqon } } : getGestaltState();
    if (!state.org) throw Error("missing state.org");
    if (!state.org.fqon) throw Error("missing state.org.fqon");
    const res = meta_POST(`/${state.org.fqon}`, org);
    return res;
}

exports.createWorkspace = (workspace, parentFqon) => {
    if (!workspace) throw Error('missing workspace');
    if (!workspace.name) throw Error('missing workspace.name');

    const state = parentFqon ? { org: { fqon: parentFqon } } : getGestaltState();
    if (!state.org) throw Error("missing state.org");
    if (!state.org.fqon) throw Error("missing state.org.fqon");
    const res = meta_POST(`/${state.org.fqon}/workspaces`, workspace);
    return res;
}

exports.createEnvironment = (environment, providedState) => {
    if (!environment) throw Error('missing environment');
    if (!environment.name) throw Error('missing environment.name');
    if (!environment.properties) throw Error('missing environment.properties');
    if (!environment.properties.environment_type) throw Error('missing environment.properties.environment_type');

    const state = providedState || getGestaltState();
    if (!state.org) throw Error("missing state.org");
    if (!state.org.fqon) throw Error("missing state.org.fqon");
    if (!state.workspace) throw Error("missing state.workspace");
    if (!state.workspace.id) throw Error("missing state.workspace.id");

    const res = meta_POST(`/${state.org.fqon}/workspaces/${state.workspace.id}/environments`, environment);
    return res;
}

exports.updateContainer = (container, providedState) => {
    const state = providedState || getGestaltState();
    if (!state.org) throw Error("missing state.org");
    if (!state.org.fqon) throw Error("missing state.org.fqon");
    if (!container) throw Error("missing container");
    if (!container.id) throw Error("missing container.id");

    delete container.resource_type;
    delete container.resource_state;

    const res = meta_PUT(`/${state.org.fqon}/containers/${container.id}`, container);
    return res;
}

exports.deleteContainer = (container /*, providedState*/) => {
    if (!container) throw Error('missing container');
    if (!container.id) throw Error('missing container.id');
    if (!container.org) throw Error('missing container.org');
    if (!container.org.properties) throw Error('missing container.org.properties');
    if (!container.org.properties.fqon) throw Error('missing container.org.properties.fqon');

    const fqon = container.org.properties.fqon;

    // const state = providedState || getGestaltState();
    // if (!state.org) throw Error("missing state.org");
    // if (!state.org.fqon) throw Error("missing state.org.fqon");
    // if (!container) throw Error("missing container");
    // if (!container.id) throw Error("missing container.id");

    delete container.resource_type;
    delete container.resource_state;

    const res = meta_DELETE(`/${fqon}/containers/${container.id}`);
    return res;
}


// Lambdas

exports.fetchLambda = (lambda) => {
    const state = getGestaltState();
    let fqon = null;
    let id = null;

    if (lambda) {
        if (!lambda.id) throw Error("No lambda.id");
        if (!lambda.fqon) {
            if (!state.org.fqon) throw Error("No lambda.fqon or state.org.fqon");
            fqon = state.org.fqon;
        } else {
            fqon = lambda.fqon;
        }
        id = lambda.id;
    } else {
        if (!state.lambda) throw Error("No state.lambda");
        if (!state.lambda.id) throw Error("No state.lambda.id");
        if (!state.org) throw Error("No state.org");
        if (!state.org.fqon) throw Error("No state.org.fqon");

        fqon = state.lambda.fqon || state.org.fqon;
        id = state.lambda.fqon
    }

    const res = meta_GET(`/${fqon}/lambdas/${id}`)
    return res;
}


exports.fetchOrgEntitlements = (state) => {
    state = state || getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    const res = meta_GET(`/${state.org.fqon}/entitlements?expand=true`)
    return res;
}

exports.fetchWorkspaceEntitlements = (state) => {
    state = state || getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!state.workspace) throw Error("No Workspace in current context");
    if (!state.workspace.id) throw Error("No Workspace ID in current context");
    const res = meta_GET(`/${state.org.fqon}/workspaces/${state.workspace.id}/entitlements?expand=true`)
    return res;
}

exports.fetchEnvironmentEntitlements = (state) => {
    state = state || getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!state.environment) throw Error("No Workspace in current context");
    if (!state.environment.id) throw Error("No Workspace ID in current context");
    const res = meta_GET(`/${state.org.fqon}/environments/${state.environment.id}/entitlements?expand=true`)
    return res;
}

exports.getCurrentWorkspace = () => {
    return getGestaltState().workspace;
}

exports.getCurrentEnvironment = () => {
    return getGestaltState().environment;
}

exports.getCurrentOrg = () => {
    return getGestaltState().org;
}

exports.getEnvironment = (uid, state) => {
    state = state || getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    return meta_GET(`/${state.org.fqon}/environments/${uid}`)
}

exports.setCurrentWorkspace = (s) => {
    if (!s) throw Error("Workspace not specified")
    if (!s.id) throw Error("Workspace ID not specified")

    const ws = {
        id: s.id,
        name: s.name,
        description: s.description
    }

    const state = getGestaltState();
    Object.assign(state, { workspace: ws }); // merge in state

    delete state.environment;
    delete state.container;

    gestaltState.setState(state);
}

exports.setCurrentEnvironment = (s) => {
    if (!s) throw Error("Environment not specified")
    if (!s.id) throw Error("Environment ID not specified")

    const env = {
        id: s.id,
        name: s.name,
        description: s.description
    }

    const state = getGestaltState();
    Object.assign(state, { environment: env }); // merge in state

    delete state.container;

    gestaltState.setState(state);
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

//     const state = getGestaltState();
//     Object.assign(state, { container: ctr }); // merge in state

//     gestaltState.setState(state);
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

    const state = getGestaltState();
    Object.assign(state, { org: org }); // merge in state

    delete state.workspace;
    delete state.environment;
    delete state.container;

    gestaltState.setState(state);
}

exports.getState = () => {
    // returns a copy of the writen state    
    return getGestaltState();
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

        gestaltState.saveAuthToken(contents);

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

// Internal State functions 

function getCachedAuthToken() {
    return gestaltState.getCachedAuthToken();
}

function getGestaltConfig() {
    return gestaltState.getConfig();
}

function getGestaltState() {
    return gestaltState.getState();
}

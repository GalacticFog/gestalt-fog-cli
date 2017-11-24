// Gestalt stuff
const request = require('sync-request');
const querystring = require('querystring');
const gestaltState = require('./gestalt-state');

// Exports

exports.fetchOrgFqons = () => {
    const res = meta_GET('/orgs?expand=true');
    const list = res.map(item => item.properties.fqon).sort();
    return list;
}

exports.fetchOrgs = () => {
    return meta_GET('/orgs?expand=true');
}

exports.fetchEnvironments = () => {
    const state = getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!state.workspace) throw Error("No Workspace in current context");
    if (!state.workspace.id) throw Error("No Workspace ID in current context");

    return meta_GET(`/${state.org.fqon}/workspaces/${state.workspace.id}/environments?expand=true`)
}

exports.fetchWorkspaces = (fqonList) => {
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

exports.fetchOrgEnvironments = (fqonList) => {
    return fetchFromOrgs("environments", fqonList);
}

exports.fetchOrgApis = (fqonList) => {
    return fetchFromOrgs("apis", fqonList);
}

exports.fetchOrgLambdas = (fqonList) => {
    return fetchFromOrgs("lambdas", fqonList);
}

// TODO: Unsure if this gets all providers
exports.fetchProviders = () => {
    return fetchFromEnvironment('providers');
}

exports.fetchApis = () => {
    return fetchFromEnvironment('apis');
}

exports.fetchContainers = () => {
    return fetchFromEnvironment('containers');
}

exports.fetchLambdas = () => {
    return fetchFromEnvironment('lambdas');
}

exports.fetchPolicies = () => {
    return fetchFromEnvironment('policies');
}

function fetchFromEnvironment(type) {
    const state = getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!state.environment) throw Error("No Workspace in current context");
    if (!state.environment.id) throw Error("No Workspace ID in current context");
    if (!type) throw Error("Type not specified");
    return meta_GET(`/${state.org.fqon}/environments/${state.environment.id}/${type}?expand=true`)
}

exports.fetchApiEndpoints = (apiList) => {
    const state = getGestaltState();
    if (!apiList) throw Error("No apiList provided");

    let eps = apiList.map(api => {
        const res = meta_GET(`/${api.fqon}/apis/${api.id}/apiendpoints?expand=true`)
        return res;
    });

    eps = [].concat.apply([], eps); // flatten array

    return eps;
}

exports.fetchOrgContainers = (fqon) => {
    const state = getGestaltState();
    if (!fqon) fqon = state.org.fqon; // default org
    return meta_GET(`/${fqon}/containers`); // can't use '?expand=true' unless in environment
}


// function fetchFromOrg(type, fqon) {
//     if (!fqon) fqon = getGestaltState().org.fqon;
//     const res = meta_GET(`/${fqon}/${type}?expand=true`)
//     return res;
// }


function fetchFromOrgs(type, fqonList) {
    if (!fqonList) fqonList = [getGestaltState().org.fqon];

    let apis = fqonList.map(fqon => {
        const res = meta_GET(`/${fqon}/${type}?expand=true`)
        return res;
    });

    apis = [].concat.apply([], apis); // flatten array

    return apis;
}


exports.fetchContainer = (id) => {
    const state = getGestaltState();

    if (!id) {
        if (!state.container) throw Error("No Container in current context");
        if (!state.container.id) throw Error("No Container ID in current context");    
        id = state.container.id; 
    }     

    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    const res = meta_GET(`/${state.org.fqon}/containers/${id}`)
    return res;
}

exports.fetchOrgEntitlements = () => {
    const state = getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    const res = meta_GET(`/${state.org.fqon}/entitlements?expand=true`)
    return res;
}

exports.fetchWorkspaceEntitlements = () => {
    const state = getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!state.workspace) throw Error("No Workspace in current context");
    if (!state.workspace.id) throw Error("No Workspace ID in current context");
    const res = meta_GET(`/${state.org.fqon}/workspaces/${state.workspace.id}/entitlements?expand=true`)
    return res;
}

exports.fetchEnvironmentEntitlements = () => {
    const state = getGestaltState();
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

exports.getEnvironment = (uid) => {
    const state = getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    return meta_GET(`/${state.org.fqon}/environments/${uid}`)
}

exports.setCurrentWorkspace = (s) => {
    if (!s.workspace) throw Error("Workspace not specified")
    if (!s.workspace.id) throw Error("Workspace ID not specified")

    const state = getGestaltState();
    Object.assign(state, s); // merge in state

    delete state.environment;
    delete state.container;

    gestaltState.setState(state);
}

exports.setCurrentEnvironment = (s) => {
    if (!s.environment) throw Error("Environment not specified")
    if (!s.environment.id) throw Error("Environment ID not specified")

    const state = getGestaltState();
    Object.assign(state, s); // merge in state

    delete state.container;

    gestaltState.setState(state);
}

exports.setCurrentContainer = (s, reset = false) => {
    if (!s.container) throw Error("Container not specified")
    if (!s.container.id) throw Error("Container ID not specified")

    const state = reset ? {} : getGestaltState();
    Object.assign(state, s); // merge in state

    gestaltState.setState(state);
}

exports.setCurrentOrg = (s) => {
    if (!s.org) throw Error("Org not specified")
    if (!s.org.fqon) throw Error("Org fqon not specified")

    const state = getGestaltState();
    Object.assign(state, s); // merge in state

    delete state.workspace;
    delete state.environment;
    delete state.container;

    gestaltState.setState(state);
}

exports.getState = () => {
    // returns a copy of the writen state    
    return getGestaltState();
}

exports.getContainer = (uid) => {
    const state = getGestaltState();
    if (!state.org) throw Error("No Org in current context");
    if (!state.org.fqon) throw Error("No FQON in current context");
    if (!uid) throw Error("Container UID not specified");
    const res = meta_GET(`/${state.org.fqon}/containers/${uid}`)
    return res;
}

exports.authenticate = (callback) => {//(username, password) => {

    const security_url = getGestaltConfig()['gestalt_url'] + '/security';
    const url = '/root/oauth/issue';

    const username = getGestaltConfig()['username'];
    const password = getGestaltConfig()['password'];

    if (!username) throw Error("Username missing from config");
    if (!password) throw Error("Password missing from config");

    const postData = querystring.stringify({
        grant_type: "password",
        username: username,
        password: password
    });


    const res = request('POST', `${security_url}${url}`, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        },

        body: postData
    });

    if (res.statusCode == 200) {
        const auth = JSON.parse(String(res.getBody()));

        // Enhance payload with username
        auth.username = username;

        const contents = `${JSON.stringify(auth, null, 2)}\n`;

        gestaltState.saveAuthToken(contents);

        callback(null, { username: username });

    } else {
        // Note: a call to res.getBody() throws an erorr on error status code.  use 'res.body' instead

        callback(JSON.parse(res.body).error_description);
    }
}



// Functions

function meta_GET(url, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';

    const res = request('GET', `${meta_url}${url}`, options);
    return JSON.parse(res.getBody());
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



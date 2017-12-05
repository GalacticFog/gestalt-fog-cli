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
    if (!state.environment) throw Error("No Environment in current context");
    if (!state.environment.id) throw Error("No Environment ID in current context");
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

exports.fetchCurrentContainer = () => {
    return this.fetchContainer(getGestaltState().container);
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

    const res = meta_GET(`/${fqon}/containers/${id}`)
    return res;
}

exports.createContainer = (container, providedState) => {
    const state = providedState || getGestaltState();
    if (!state.org) throw Error("missing state.org");
    if (!state.org.fqon) throw Error("missing state.org.fqon");
    if (!state.environment) throw Error("missing state.environment");
    if (!state.environment.id) throw Error("missing state.environment.id");
    const res = meta_POST(`/${state.org.fqon}/environments/${state.environment.id}/containers`, container);
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

exports.setCurrentContainer = (s) => {
    if (!s) throw Error("container not specified")
    if (!s.id) throw Error("container.id not specified")
    if (!s.fqon) throw Error("container.fqon not specified")

    const ctr = {
        id: s.id,
        name: s.name,
        fqon: s.fqon
    }

    const state = getGestaltState();
    Object.assign(state, { container: ctr }); // merge in state

    gestaltState.setState(state);
}

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

function meta_POST(url, body, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';
    options.json = body;
    const res = request('POST', `${meta_url}${url}`, options);
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

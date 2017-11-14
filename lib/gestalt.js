// Gestalt stuff
const request = require('sync-request');
const querystring = require('querystring');

const os = require('os');
const fs = require('fs');
const CONFIG_DIR = os.homedir() + '/.fog-cli'

// Exports

exports.persistState = persistState;

exports.fetchOrgFqons = () => {
    const res = meta_GET('/orgs?expand=true');
    const list = res.map(item => item.properties.fqon).sort();
    return list;
}

exports.fetchOrgs = () => {
    return meta_GET('/orgs?expand=true');
}

exports.fetchWorkspaces = (fqonList) => {
    if (!fqonList) fqonList = [getGestaltState().org.fqon];

    let workspaces = fqonList.map(fqon => {
        const res = meta_GET(`/${fqon}/workspaces?expand=true`)
        return res;
    });

    workspaces = [].concat.apply([], workspaces); // flatten array

    // console.log(workspaces);
    return workspaces;
}

exports.fetchEnvironments = () => {
    const state = getGestaltState();
    return meta_GET(`/${state.org.fqon}/workspaces/${state.workspace.id}/environments?expand=true`)
}

exports.getEnvironment = (uid) => {
    const state = getGestaltState();
    return meta_GET(`/${state.org.fqon}/environments/${uid}`)
}

exports.getState = () => {
    // returns a copy of the writen state    
    return getGestaltState();
}

exports.fetchContainers = () => {
    return fetchType('containers');
}

exports.fetchLambdas = () => {
    return fetchType('lambdas');
}

exports.fetchApis = () => {
    return fetchType('apis');
}

exports.fetchPolicies = () => {
    return fetchType('policies');
}

function fetchType(type) {
    const state = getGestaltState();
    return meta_GET(`/${state.org.fqon}/environments/${state.environment.id}/${type}?expand=true`)
}

exports.getContainer = (uid) => {
    const state = getGestaltState();
    const res = meta_GET(`/${state.org.fqon}/containers/${uid}`)
    return res;
}

exports.fetchContainer = () => {
    const state = getGestaltState();
    const res = meta_GET(`/${state.org.fqon}/containers/${state.container.id}`)
    return res;
}

exports.fetchOrgEntitlements = () => {
    const state = getGestaltState();
    const res = meta_GET(`/${state.org.fqon}/entitlements?expand=true`)
    return res;
}

exports.fetchWorkspaceEntitlements = () => {
    const state = getGestaltState();
    const res = meta_GET(`/${state.org.fqon}/workspaces/${state.workspace.id}/entitlements?expand=true`)
    return res;
}

exports.fetchEnvironmentEntitlements = () => {
    const state = getGestaltState();
    const res = meta_GET(`/${state.org.fqon}/environments/${state.environment.id}/entitlements?expand=true`)
    return res;  
}


exports.authenticate = (username, password) => {

    const security_url = getGestaltConfig()['gestalt_url'] + '/security';
    const url = '/root/oauth/issue';

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

        const contents = `${JSON.stringify(auth, null, 2)}\n`;
        fs.writeFileSync(`${CONFIG_DIR}/auth.json`, contents);
    } else {
        console.error(`Authentication to ${security_url} didn't succeed.  Response: ${res}`);
        console.error('|' + res.statusCode + '|');
        console.error(res.getBody());
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

function persistState(s) {
    let state = getGestaltState();
    Object.assign(state, s); // merge in state
    const contents = `${JSON.stringify(state, null, 2)}\n`;
    fs.writeFileSync(`${CONFIG_DIR}/state.json`, contents);
}

function getCachedAuthToken() {
    // try cached
    // return fs.readFileSync(`${CONFIG_DIR}/auth_token`, 'utf8').trim();

    return JSON.parse(fs.readFileSync(`${CONFIG_DIR}/auth.json`, 'utf8')).access_token;
}

function getGestaltConfig() {
    return getJsonFromFile("config.json")
}

function getGestaltState() {
    return getJsonFromFile("state.json")
}

function getJsonFromFile(file) {
    const f = `${CONFIG_DIR}/${file}`;
    if (fs.existsSync(f)) {
        const contents = fs.readFileSync(f, 'utf8');
        return JSON.parse(contents);
    }
    return {};
}
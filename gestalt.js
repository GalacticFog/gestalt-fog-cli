// Gestalt stuff
const request = require('sync-request');
const os = require('os');
const fs = require('fs');
const CONFIG_DIR = os.homedir() + '/.fog-cli'

// Exports

exports.persistState = persistState;

exports.fetchOrgFqons = () => {
    const res = meta_GET('/orgs?expand=true');
    const fn = item => item.properties.fqon;
    const list = res.map(fn).sort();
    return list;
}

exports.fetchOrgs = () => {
    const res = meta_GET('/orgs?expand=true')
    res.map(item => {
        item.fqon = item.properties.fqon;
    })
    return res;
}

exports.fetchWorkspaces = (fqonList) => {
    if (!fqonList) fqonList = [getGestaltState().org.fqon];

    let workspaces = fqonList.map(fqon => {
        const res = meta_GET(`/${fqon}/workspaces?expand=true`)
        return res.map(item => {
            item.fqon = fqon;
            return item;
        });
    });

    workspaces = [].concat.apply([], workspaces); // flatten array

    // console.log(workspaces);
    return workspaces;
}

exports.fetchEnvironments = () => {
    const state = getGestaltState();
    const res = meta_GET(`/${state.org.fqon}/workspaces/${state.workspace.id}/environments?expand=true`)
    return res;
}

exports.fetchContainers = () => {
    // URL:https://test.galacticfog.com/meta/engineering.eric-test/environments/108f68f6-a4a9-4d8f-85df-0247487ab2b8/containers?expand=true
    const state = getGestaltState();
    const res = meta_GET(`/${state.org.fqon}/environments/${state.environment.id}/containers?expand=true`)
    return res;
}

exports.getState = () => {
    // returns a copy of the writen state    
    return getGestaltState();
}


// Functions

function meta_GET(url, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    const meta_url = getGestaltConfig().gestalt_url + '/meta';

    const res = request('GET', `${meta_url}${url}`, options);
    return JSON.parse(res.getBody());
}

function persistState(s) {
    let state = getGestaltState();
    Object.assign(state, s); // merge in state
    let contents = `${JSON.stringify(state, null, 2)}\n`;
    fs.writeFileSync(`${CONFIG_DIR}/state.json`, contents);
}

function getCachedAuthToken() {
    // try cached
    const contents = fs.readFileSync(`${CONFIG_DIR}/auth_token`, 'utf8');
    return contents.trim();
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
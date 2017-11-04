// Gestalt stuff
const request = require('sync-request');
const os = require('os');
const fs = require('fs');
const CONFIG_DIR = os.homedir() + '/.fog-cli'  

// Exports

exports.persistState = persistState;

exports.fetchOrgFqons = () => {
    let res = meta_GET('/orgs?expand=true');
    let fn = item => item.properties.fqon;
    let list = res.map(fn).sort();
    return list;
}

exports.fetchOrgs = () => {
    let res = meta_GET('/orgs?expand=true')
    res.map(item => {
        item.fqon = item.properties.fqon;
    })
    return res;
}

exports.fetchWorkspaces = (fqonList) => {
    if (!fqonList) fqonList = [getGestaltState().org.fqon];

    let workspaces = fqonList.map(fqon => {
        let res = meta_GET(`/${fqon}/workspaces?expand=true`)
        return res.map(item => { item.fqon = fqon; return item; } );
    });

    workspaces = [].concat.apply([], workspaces); // flatten array

    // console.log(workspaces);
    return workspaces;
}

exports.fetchEnvironments = () => {
    let state = getGestaltState();
    let res = meta_GET(`/${state.org.fqon}/workspaces/${state.workspace.id}/environments?expand=true`)
    return res;
}

exports.getState = () => {
    // returns a copy of the writen state    
    return getGestaltState();
}


// Functions

function meta_GET(url) {
    let token = getCachedAuthToken();
    let options = { headers: { Authorization: `Bearer ${token}` } };
    let meta_url = getGestaltConfig().gestalt_url + '/meta';

    let res = request('GET', meta_url + url, options);
    return JSON.parse(res.getBody());
}

function persistState(s) {
    let state = getGestaltState();
    Object.assign(state, s); // merge in state
    let contents = JSON.stringify(state, null, 2) + "\n";
    fs.writeFileSync(`${CONFIG_DIR}/state.json`, contents);
}

function getCachedAuthToken() {
    // try cached
    var contents = fs.readFileSync(`${CONFIG_DIR}/auth_token`, 'utf8');
    return contents.trim();
}

function getGestaltConfig() {
    return getJsonFromFile("config.json")
}

function getGestaltState() {
    return getJsonFromFile("state.json")
}

function getJsonFromFile(file) {
    let f = `${CONFIG_DIR}/${file}`;
    if (fs.existsSync(f)) {
        var contents = fs.readFileSync(f, 'utf8');
        return JSON.parse(contents);
    }
    return {};
}
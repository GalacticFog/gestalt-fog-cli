// Gestalt stuff
const os = require('os');
const fs = require('fs');
const CONFIG_DIR = os.homedir() + '/.fog-cli'

// Exports

exports.saveState = (s) => {
    let state = this.getState();
    Object.assign(state, s); // merge in state
    const contents = `${JSON.stringify(state, null, 2)}\n`;
    fs.writeFileSync(`${CONFIG_DIR}/state.json`, contents);
}

exports.setState = (s) => {
    const contents = `${JSON.stringify(s, null, 2)}\n`;
    fs.writeFileSync(`${CONFIG_DIR}/state.json`, contents);
}

exports.clearState = () => {
    fs.unlinkSync(`${CONFIG_DIR}/state.json`)
}

exports.getCachedAuthToken = () => {
    // try cached
    // return fs.readFileSync(`${CONFIG_DIR}/auth_token`, 'utf8').trim();

    return JSON.parse(fs.readFileSync(`${CONFIG_DIR}/auth.json`, 'utf8')).access_token;
}

exports.getConfig = () => {
    return getJsonFromFile("config.json")
}

exports.getState = () => {
    return getJsonFromFile("state.json");
}

exports.saveAuthToken = (contents) => {
    fs.writeFileSync(`${CONFIG_DIR}/auth.json`, contents);
}

exports.saveConfig = (contents) => {
    fs.writeFileSync(`${CONFIG_DIR}/config.json`, contents);
}

function getJsonFromFile(file) {
    const f = `${CONFIG_DIR}/${file}`;
    if (fs.existsSync(f)) {
        const contents = fs.readFileSync(f, 'utf8');
        return JSON.parse(contents);
    }
    return {};
}
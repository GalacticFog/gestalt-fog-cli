// Gestalt stuff
const os = require('os');
const fs = require('fs');
const CONFIG_DIR = os.homedir() + '/.fog'

// Exports

exports.getConfigDir = () => {
    return CONFIG_DIR;
} 

exports.saveState = (s) => {
    let state = this.getState();
    Object.assign(state, s); // merge in state
    const contents = `${JSON.stringify(state, null, 2)}\n`;
    writeFile('state.json', contents);
}

exports.setState = (s) => {
    const contents = `${JSON.stringify(s, null, 2)}\n`;
    writeFile('state.json', contents);
}

exports.clearState = () => {
    const f = `${CONFIG_DIR}/state.json`;
    if (fs.existsSync(f)) {
        fs.unlinkSync(f)
    }
}

exports.getCachedAuthToken = () => {
    return JSON.parse(fs.readFileSync(`${CONFIG_DIR}/auth.json`, 'utf8')).access_token;
}

exports.getCachedAuthUser = () => {
    return JSON.parse(fs.readFileSync(`${CONFIG_DIR}/auth.json`, 'utf8')).username;
}

exports.clearAuthToken = () => {
    const f = `${CONFIG_DIR}/auth.json`;
    if (fs.existsSync(f)) {
        fs.unlinkSync(f)
    }
}

exports.getConfig = () => {
    return getJsonFromFile("config.json")
}

exports.getState = () => {
    return getJsonFromFile("state.json");
}

exports.saveAuthToken = (contents) => {
    writeFile('auth.json', contents);
}

exports.saveConfig = (contents) => {
    writeFile('config.json', contents);
}

function writeFile(file, contents) {
    // const stats = fs.statSync(CONFIG_DIR);
    if (!fs.existsSync(CONFIG_DIR)) {
        console.log("Creating...")
        fs.mkdirSync(CONFIG_DIR);
    }
    fs.writeFileSync(`${CONFIG_DIR}/${file}`, contents);
}

function getJsonFromFile(file) {
    const f = `${CONFIG_DIR}/${file}`;
    if (fs.existsSync(f)) {
        const contents = fs.readFileSync(f, 'utf8');
        return JSON.parse(contents);
    }
    return {};
}
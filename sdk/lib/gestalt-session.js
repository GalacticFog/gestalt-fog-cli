// Gestalt stuff
const os = require('os');
const fs = require('fs');
const del = require('del');
const glob = require('glob');
const path = require('path')
const CONFIG_DIR = os.homedir() + path.sep + '.fog'

// Exports

module.exports = {
    clearSessionData,
    // clearResourceIdCache,
    fileExists,
    getContextBrowserUrl,
    getContextPath,
    getCachedAuthToken,
    getCachedAuthData,
    getSessionConfig,
    getSessionDirectory,
    getContext,
    getSessionNames,
    getGlobalConfig,
    getResourceIdCache,
    loadSessionFile,
    saveAuthData,
    saveSessionConfig,
    saveGlobalConfigOptions,
    saveResourceIdCache,
    setContext,
    setCurrentSession,
    getSessionHost,
    removeSession,
}

function getSessionHost() {
    let host = getSessionConfig()['gestalt_url'];
    if (host.indexOf('://') > -1) {
        host = String(host).substring(host.indexOf('://') + 3);
    }
    return host;
}

// Resource ID cache functions 

function saveResourceIdCache(type, cache) {
    const initialCache = loadSessionFile("resource-ids.json.cached");
    initialCache[type] = cache;
    writeSessionFile('resource-ids.json.cached', initialCache);
}

function getResourceIdCache(type) {
    const initialCache = loadSessionFile("resource-ids.json.cached");
    return initialCache[type] || {};
}

// Context functions

function setContext(s) {
    writeSessionFile('context.json.cached', s);
}

function setCurrentSession(name) {
    const config = loadConfigFile();
    config.currentSession = name;
    writeConfigFile(config);
}

function clearSessionData(optionalSession) {
    let files = glob.sync(CONFIG_DIR + path.sep + '*.cached');
    files.map(f => {
        fs.unlinkSync(f);
    });

    const dir = getSessionDirectory(optionalSession);
    files = glob.sync(dir + path.sep + '*.cached');
    files.map(f => {
        fs.unlinkSync(f);
    });
}

function deleteDirectory(dir) {
    del.sync(dir, { force: true });
    console.log(`Deleted directory ${dir}`)
}

function getContext(optionalSession) {
    return loadSessionFile("context.json.cached", optionalSession);
}

// Auth token functions

function getCachedAuthToken() {
    return getCachedAuthData().access_token;
}

function getCachedAuthData(optionalSession) {
    return loadSessionFile('auth.json.cached', optionalSession);
}

function saveAuthData(contents) {
    writeSessionFile('auth.json.cached', contents);
}

// Configuration

function saveSessionConfig(sessionConfig, optionalSession) {
    const config = loadConfigFile();
    optionalSession = optionalSession || config.currentSession || 'default'
    config.sessions = config.sessions || {};
    config.sessions[optionalSession] = sessionConfig;

    writeConfigFile(config);
}

function removeSession(session) {
    const config = loadConfigFile();
    config.sessions = config.sessions || {};
    delete config.sessions[session]

    if (config.currentSession == session) {
        config.currentSession = 'default';
    }
    writeConfigFile(config);

    removeSessionDirectory(session);
}

function removeSessionDirectory(session) {
    if (!session) throw Error(`Missing session parameter`);
    const dir = getSessionDirectory(session);
    deleteDirectory(dir);
}

function saveGlobalConfigOptions(globalConfig) {
    const config = loadConfigFile();
    config.config = globalConfig;
    writeConfigFile(config);
}


// File functions

function fileExists(file) {
    const dir = getSessionDirectory();
    const f = dir + path.sep + file;
    return fs.existsSync(f);
}

function writeSessionFile(file, obj) {
    const dir = getSessionDirectory();
    writeFile(dir, file, obj);
}

function loadSessionFile(file, optionalSession) {
    const dir = getSessionDirectory(optionalSession);
    return loadFile(dir, file)
}

function writeFile(dir, file, obj) {
    const contents = `${JSON.stringify(obj, null, 2)}\n`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log(`Created ${dir}.`);
    }
    fs.writeFileSync(dir + path.sep + file, contents);
}

function loadFile(dir, file) {
    const filepath = dir + path.sep + file;
    if (fs.existsSync(filepath)) {
        const contents = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(contents);
    }
    return {};
}

function getSessionDirectory(optionalSession) {
    const config = loadConfigFile();
    const dir = optionalSession || config.currentSession || 'default';
    return CONFIG_DIR + path.sep + dir;
}

function getSessionNames() {
    const config = loadConfigFile();
    if (!config.sessions) return [];
    return Object.keys(config.sessions).sort();
}

function getSessionConfig(session) {
    const config = loadConfigFile();
    // Use the passed context name, or the current context
    session = session || config.currentSession || 'default';

    const sessionConfig = {
        name: session
    }

    if (session) {
        if (config.sessions) {
            return Object.assign(sessionConfig, config.sessions[session] || {});
        }
    }
    return sessionConfig;
}

function getGlobalConfig() {
    const config = loadConfigFile();
    return config.config || {};
}

function loadConfigFile() {
    return loadFile(CONFIG_DIR, 'config.json');
}

function writeConfigFile(config) {
    writeFile(CONFIG_DIR, 'config.json', config);
}

function getContextPath(optionalContext) {
    const context = optionalContext || getContext();

    let s = ''
    if (context && context.org) {
        s += `/${context.org.fqon}`;
        if (context.workspace) {
            s += `/${context.workspace.name}`;
        }
        if (context.environment) {
            s += `/${context.environment.name}`;
        }
    }
    return s;
}

function getContextBrowserUrl(optionalContext, optionalSession) {
    const config = getSessionConfig(optionalSession);
    const context = optionalContext || this.getContext();
    let url = '';
    if (context.org && context.org.fqon) {
        if (context.workspace && context.workspace.id) {
            if (context.environment && context.environment.id) {
                url = `/${context.org.fqon}/hierarchy/${context.workspace.id}/environment/${context.environment.id}`
            } else {
                url = `/${context.org.fqon}/hierarchy/${context.workspace.id}/environments`
            }
        } else {
            url = `/${context.org.fqon}/hierarchy`
        }
    } else {
        url = '/root/hierarchy';
    }
    return `${config.gestalt_url}${url}`;
}
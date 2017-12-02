const gestaltState = require('./gestalt-state');
const os = require('os');
const fs = require('fs');

const rp = require('request-promise-native');
const errors = require('request-promise-native/errors');

// Load config
const config = loadGitlabConfig();

debug(config);

if (!config) throw new Error("Options must be specified")
if (!config.token) throw new Error("missing config.token");
if (!config.url) throw new Error("missing config.url");

const _debug = false;

function debug(str) {
    // if (_debug) {
        console.error(str);
    // }
}

function exec(options, callback) {

    const opts = Object.assign({
        json: true,
        simple: true,
    }, options);

    debug(opts);

    rp(opts)
        .then(function (parsedBody) {
            callback(null, parsedBody);
        })
        // .catch(errors.StatusCodeError, function (reason) {
        //     // The server responded with a status codes other than 2xx.
        //     // Check reason.statusCode
        //     callback(reason, null);
        // })
        // .catch(errors.RequestError, function (reason) {
        //     // The request failed due to technical reasons.
        //     // reason.cause is the Error object Request would pass into a callback.
        //     callback(reason, null)
        // })
        .catch(function (reason) {
            callback(reason, null)
        });
}

//
// Projects
//

exports.listPrivateProjects = listPrivateProjects;

function listPrivateProjects(callback) {
    const uri = `${config.url}/api/v4/groups/galacticfog/projects`;
    debug(uri);
    const options = {
        uri: uri,
        headers: { 'PRIVATE-TOKEN': config.token },
        method: "GET",
        qs: {
            visibility: 'private',
            simple: true,
            per_page: 1000
        }
    };

    exec(options, callback);
}


//
// Variables
//

exports.createOrUpdateProjectVariable = createOrUpdateProjectVariable;
exports.updateProjectVariable = updateProjectVariable;
exports.createProjectVariable = createProjectVariable;
exports.getProjectVariable = getProjectVariable;
exports.getProjectVariables = getProjectVariables;

function createOrUpdateProjectVariable(project, variable, callback) {

    debug('create or update, doing get...')

    // Check if variable exists
    getProjectVariable(project, variable, (err, result) => {
        if (!err) {
            // if so, update
            debug('No err, updating variable...')
            updateProjectVariable(project, variable, callback);

        } else {
            // otherwise, create
            debug('Err, creating variable...')
            createProjectVariable(project, variable, callback);
        }
    });
}


function updateProjectVariable(project, variable, callback) {
    const uri = `${config.url}/api/v4/projects/${encodeURIComponent(project.name)}/variables/${variable.key}`;
    debug(uri);
    const options = {
        uri: uri,
        headers: { 'PRIVATE-TOKEN': config.token },
        method: "PUT",
        body: { value: variable.value },
        // resolveWithFullResponse: true,
    };
    exec(options, callback);
}

function createProjectVariable(project, variable, callback) {
    const uri = `${config.url}/api/v4/projects/${encodeURIComponent(project.name)}/variables`;
    debug(uri);
    const options = {
        uri: uri,
        headers: { 'PRIVATE-TOKEN': config.token },
        method: "POST",
        body: variable,
    };

    exec(options, callback);
}

function getProjectVariable(project, variable, callback) {
    const uri = `${config.url}/api/v4/projects/${encodeURIComponent(project.name)}/variables/${variable.key}`;
    debug(uri);
    const options = {
        uri: uri,
        headers: { 'PRIVATE-TOKEN': config.token },
        method: "GET",
    };

    exec(options, callback);
}

function getProjectVariables(project, callback) {
    const uri = `${config.url}/api/v4/projects/${encodeURIComponent(project.name)}/variables`;
    debug(uri);
    const options = {
        uri: uri,
        headers: { 'PRIVATE-TOKEN': config.token },
        method: "GET",
    };

    exec(options, callback);
};

function loadGitlabConfig() {
    const f = gestaltState.getConfigDir() + `/gitlab-config.json`;
    if (fs.existsSync(f)) {
        const contents = fs.readFileSync(f, 'utf8');
        return JSON.parse(contents);
    }
    throw new Error(`${f} not found`);
}








// function update_gitlab_environment(base_url, token, gitlab_env, payload) {
//     var url = base_url + "/environments/" + gitlab_env.id;
//     var pc = client.prepareConnect(url)
//         .setMethod("PUT")
//         .addHeader("PRIVATE-TOKEN", token);
//     log("PUT " + url, LoggingLevels.DEBUG);
//     if (payload) {
//         pc = pc.setBody(JSON.stringify(payload)).addHeader("Content-Type", "application/json")
//     }
//     return _handleResponse(pc.execute().get());
// }


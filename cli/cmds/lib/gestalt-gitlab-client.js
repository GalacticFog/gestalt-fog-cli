const gestaltContext = require('./gestalt-context');
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
if (!config.scope) throw new Error("missing config.scope");

function debug(str) {
    if (config.debug) {
        console.error(str);
    }
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
// Commits
//

exports.commitFile = commitFile;

function commitFile(project, data, callback) {
    if (!data.file_path) throw Error('missing data.file_path')
    if (!data.content) throw Error('missing data.content')

    const payload = {
        "branch": data.branch || "master",
        "commit_message": data.commit_message || 'No commit message.',
        "actions": [
            {
                "action": "create",
                "file_path": data.file_path,
                "content": data.content
            }
        ]
    };

    const uri = `${config.url}/api/v4/projects/${project.id}/repository/commits`;
    const options = {
        uri: uri,
        headers: { 'PRIVATE-TOKEN': config.token },
        method: "POST",
        body: payload
    };

    exec(options, callback);
}

//
// Projects
//

exports.listProjects = listProjects;

function listProjects(callback) {
    const uri = `${config.url}/api/v4/${config.scope}/projects`;
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
    const uri = `${config.url}/api/v4/projects/${project.id}/variables/${variable.key}`;
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
    const uri = `${config.url}/api/v4/projects/${project.id}/variables`;
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
    const uri = `${config.url}/api/v4/projects/${project.id}/variables/${variable.key}`;
    debug(uri);
    const options = {
        uri: uri,
        headers: { 'PRIVATE-TOKEN': config.token },
        method: "GET",
    };

    exec(options, callback);
}

function getProjectVariables(project, callback) {
    const uri = `${config.url}/api/v4/projects/${project.id}/variables`;
    debug(uri);
    const options = {
        uri: uri,
        headers: { 'PRIVATE-TOKEN': config.token },
        method: "GET",
    };

    exec(options, callback);
};

function loadGitlabConfig() {
    const f = gestaltContext.getConfigDir() + `/gitlab-config.json`;
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


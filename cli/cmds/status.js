'use strict';
const cmd = require('./lib/cmd-base');
const { gestaltSession } = require('gestalt-fog-sdk');
const ui = require('./lib/gestalt-ui');
const chalk = require('./lib/chalk');
const { table } = require('table');

exports.command = 'status'
exports.desc = 'Show Status'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const currentSession = gestaltSession.getSessionConfig().name;
    console.log(`Current Session: ${chalk.green.bold(currentSession)}`)
    console.log();

    displaySessions();
});

function displaySessions() {
    const currentSession = gestaltSession.getSessionConfig().name;

    const data = [
        ['Session', 'Status', 'Gestalt URL', 'Details'].map(a => chalk.bold.underline(a))
    ];
    for (let session of gestaltSession.getSessionNames()) {
        data.push(getSessionInfo(currentSession, session));
    }

    const output = table(data, getOptions());
    // const output = table(data);
    console.log(output);
}

function getSessionInfo(currentSession, session) {
    const config = gestaltSession.getSessionConfig(session);
    const auth = gestaltSession.getCachedAuthData(session);
    const context = gestaltSession.getContext(session);

    let loginString = auth.username ? `('${auth.username}' logged in)` : chalk.dim('(not logged in)')
    // const envString = auth.username ? `'${auth.username}' @ ${config.gestalt_url}` : '(not set)'
    const envString = config.gestalt_url ? config.gestalt_url : chalk.dim('(not set)')
    const browserUrl = config.gestalt_url ? gestaltSession.getContextBrowserUrl(context, session) : chalk.dim('(none)')

    const other = `Browser URL: ${browserUrl}
Context:     ${gestaltSession.getContextPath(context) || chalk.dim('(none)')}
Login time:  ${auth.timestamp || chalk.dim('(not logged in)')}`

    return [
        // currentSession == session ? chalk.cyan.bold('  =>') : '',
        currentSession == session ? chalk.green(session) : session,
        chalk.dim(loginString),
        envString,
        other
    ]
}

function getOptions() {
    const config = {
        border: {
            topBody: `─`,
            topJoin: `┬`,
            topLeft: `┌`,
            topRight: `┐`,

            bottomBody: `─`,
            bottomJoin: `┴`,
            bottomLeft: `└`,
            bottomRight: `┘`,

            bodyLeft: `│`,
            bodyRight: `│`,
            bodyJoin: `│`,

            joinBody: `─`,
            joinLeft: `├`,
            joinRight: `┤`,
            joinJoin: `┼`
        }
    };

    for (let key of Object.keys(config.border)) {
        config.border[key] = chalk.dim(config.border[key]);
    }

    return config;
}
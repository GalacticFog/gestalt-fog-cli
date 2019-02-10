const cmd = require('./lib/cmd-base');
const { gestaltSession } = require('gestalt-fog-sdk');
const chalk = require('./lib/chalk');
const { debug } = require('./lib/debug');
const { table, getBorderCharacters } = require('table');
const ta = require('time-ago');

exports.command = 'use [session]'
exports.desc = 'Use a session'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    if (argv.session) {
        if (gestaltSession.getSessionNames().find(s => s == argv.session)) {
            gestaltSession.setCurrentSession(argv.session);
            console.log(`Session set to '${chalk.green(argv.session)}'`);
        } else {
            // throw Error(`Session '${argv.session}' isn't defined, use 'fog session add <name>'`);
            gestaltSession.saveSessionConfig({}, argv.session);
            gestaltSession.setCurrentSession(argv.session);
            console.log(`Created new session '${chalk.green(argv.session)}'`);
        }
        displaySessions()
    } else {
        displaySessions();
    }
});


function displaySessions() {
    const currentSession = gestaltSession.getSessionConfig().name;

    const data = [
        [/*'',*/ 'Session', 'User', 'Status', 'Gestalt URL'].map(a => chalk.underline(a))
    ];
    data[0][0] = '  ' + chalk.underline('Session');
    for (let session of gestaltSession.getSessionNames()) {
        data.push(getSessionInfo(currentSession, session));
    }

    // debug(data);

    console.log();
    const output = table(data, getOptions());
    console.log(output);
}

function getSessionInfo(currentSession, session) {
    const config = gestaltSession.getSessionConfig(session);
    const auth = gestaltSession.getCachedAuthData(session);
    const context = gestaltSession.getContext(session);

    const loginString = auth.username ? `Logged in ${ta.ago(auth.timestamp)}` : null;
    // const envString = auth.username ? `'${auth.username}' @ ${config.gestalt_url}` : '(not set)'
    const envString = config.gestalt_url ? config.gestalt_url : chalk.dim('(not set)')

    return [
        // currentSession == session ? chalk.cyan.bold('*') : ' ',
        currentSession == session ? chalk.cyan('* ' + session) + chalk.cyan(' (active)') : '  ' + session,
        auth.username || chalk.dim('(no user)'),
        loginString ? chalk.green(loginString) : chalk.dim('(not logged in)'),
        envString,
    ]
}


function getOptions() {
    const config = {
        border: getBorderCharacters(`void`),
        columns: {
            0: {
                paddingLeft: 2,
                paddingRight: 2,
            },
        },
        columnDefault: {
            paddingLeft: 2,
            paddingRight: 2,
        },
        drawHorizontalLine: () => {
            return false
        }
    };
    return config;
}
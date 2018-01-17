'use strict';
const inquirer = require('inquirer');
const gestaltState = require('./lib/gestalt-state');
const gestalt = require('./lib/gestalt');
const chalk = require('chalk');

const cmd = require('./lib/cmd-base');
exports.command = 'login'
exports.desc = 'Log in to Gestalt Platform Instance'
exports.builder = {
    url: {
        description: 'Gestalt URL (optional, prompted if not specified)'
    },
    username: {
        description: 'Username (optional, prompted if not specified)'
    },
    password: {
        description: 'Password (optional, prompted if not specified)'
    }
}

exports.handler = cmd.handler(async function (argv) {
    // This function is interactive if any parameters missing

    // URL is passed either as first argument, or as --url parameter
    if (!argv.url && argv._[1]) {
        argv.url = argv._[1];
    }

    let params = {
        gestalt_url: argv.url,
        username: argv.username,
    };

    const config = gestaltState.getConfig();

    let questions = [];

    if (!argv.url) questions.push({
        type: 'input',
        name: 'gestalt_url',
        message: "Gestalt URL",
        default: () => {
            return config.gestalt_url || '';
        }
    });

    if (!argv.username) questions.push({
        type: 'input',
        name: 'username',
        message: "Username",
        default: () => {
            return config.username || '';
        }
    });

    { // block to limit scope
        const answers = await inquirer.prompt(questions);
        params = Object.assign(params, answers);
    }

    if (params.gestalt_url.indexOf("://") == -1) {
        params.gestalt_url = 'https://' + params.gestalt_url;
    }

    gestaltState.saveConfig(params);

    let creds = {
        username: params.username,
        password: argv.password
    };

    if (!creds.password) {
        questions = [
            {
                type: 'password',
                name: 'password',
                message: "Password",
            },
        ];
        creds = await inquirer.prompt(questions);
        creds.username = params.username;
    }

    doLogin(config.gestalt_url, creds);
});

function doLogin(gestalt_url, creds) {

    gestaltState.clearAuthToken();
    gestaltState.clearState();
    gestaltState.clearCachedFiles();

    console.log(`Logging in to ${chalk.bold(gestalt_url)}...`);
    gestalt.authenticate(creds, (err, res) => {
        if (!err) {
            console.log(`Authenticated. User ${res.username} logged in to ${gestalt_url}.`);
        } else {
            console.error("Login failed: " + err);
            console.error();
            console.error("Please check the Gestalt URL endpoint and credentials and try again.")
        }
        // Clear the current context
        gestaltState.clearState();
    });
}
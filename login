#!/usr/bin/env node
'use strict';
const inquirer = require('inquirer');
const gestaltState = require('./lib/gestalt-state');
const gestalt = require('./lib/gestalt');

const config = gestaltState.getConfig();

const questions = [
    {
        type: 'input',
        name: 'username',
        message: "Username",
        default: () => {
            return config.username || '';
        }
    },
    {
        type: 'password',
        name: 'password',
        message: "Password",
    },
];

inquirer.prompt(questions).then(creds => {

    gestalt.authenticate(creds, (err, res) => {
        if (!err) {
            console.log(`Authenticated. User ${res.username} logged in.`);    
        } else {
            console.error("Login failed: " + err);
            console.error();
            console.error("Please check the Gestalt URL endpoint and credentials and try again.")
        }
    });
    
    // Clear the current context
    gestaltState.clearState();    
});





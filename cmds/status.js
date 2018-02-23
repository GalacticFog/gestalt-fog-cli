'use strict';
const inquirer = require('inquirer');
const gestaltContext = require('./lib/gestalt-context');
const gestalt = require('./lib/gestalt');
const ui = require('./lib/gestalt-ui');
const chalk = require('chalk');

const cmd = require('./lib/cmd-base');
exports.command = 'status'
exports.desc = 'Show Status'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    // console.log();
    const config = gestaltContext.getConfig();
    console.log(`Gestalt Endpoint:  ${config.gestalt_url}`);
    console.log(`User:              ${config.username}`);
    console.log('Context:           ' + ui.getContextString(gestalt.getContext()));
    if (argv.all) {
        console.log(JSON.stringify(gestalt.getContext(), null, 2));
    }
    console.log();
});


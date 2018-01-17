'use strict';
const inquirer = require('inquirer');
const gestaltState = require('./lib/gestalt-state');
const gestalt = require('./lib/gestalt');
const chalk = require('chalk');

const cmd = require('./lib/cmd-base');
exports.command = 'status'
exports.desc = 'Show Status'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const config = gestaltState.getConfig();
    console.log(`Gestalt Instance:  ${config.gestalt_url}`);
    console.log(`Username:          ${config.username}`);
});


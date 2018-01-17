'use strict';
const cmd = require('./lib/cmd-base');
exports.command = 'logout'
exports.desc = 'Logout of Gestalt Platform Instance'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const gestaltState = require('./lib/gestalt-state');

    gestaltState.clearAuthToken();

    gestaltState.clearState();

    gestaltState.clearCachedFiles();

    console.log("Logged out.");
});
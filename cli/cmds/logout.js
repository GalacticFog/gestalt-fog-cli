'use strict';
const cmd = require('./lib/cmd-base');
exports.command = 'logout'
exports.desc = 'Logout of Gestalt Platform Instance'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const gestaltContext = require('./lib/gestalt-context');

    gestaltContext.clearAuthToken();

    gestaltContext.clearContext();

    gestaltContext.clearCachedFiles();

    console.log("Logged out.");
});
'use strict';
const { gestaltContext } = require('gestalt-fog-sdk');
const cmd = require('./lib/cmd-base');
exports.command = 'logout'
exports.desc = 'Logout of Gestalt Platform Instance'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    gestaltContext.clearAuthToken();

    gestaltContext.clearContext();

    gestaltContext.clearCachedFiles();

    console.log("Logged out.");
});
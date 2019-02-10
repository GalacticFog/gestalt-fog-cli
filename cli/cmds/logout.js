'use strict';
const { gestaltSession } = require('gestalt-fog-sdk');
const cmd = require('./lib/cmd-base');
exports.command = 'logout'
exports.desc = 'Logout of Gestalt Platform Instance'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    gestaltSession.clearSessionData();

    console.log("Logged out.");
});
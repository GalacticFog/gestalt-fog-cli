const cmd = require('../lib/cmd-base');
const { gestaltSession } = require('gestalt-fog-sdk');

exports.command = 'reset'
exports.desc = 'Reset context'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    gestaltSession.clearSessionData();

    console.log("Current context: ");
    console.log(gestaltSession.getContext());
});
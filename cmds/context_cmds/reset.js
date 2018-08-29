const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');

exports.command = 'reset'
exports.desc = 'Reset context'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    gestaltContext.clearContext();

    console.log("Current context: ");
    console.log(gestaltContext.getContext());
});
exports.command = 'reset-context'
exports.desc = 'Reset context'
exports.builder = {}
exports.handler = function (argv) {

    const gestaltContext = require('./lib/gestalt-context');

    gestaltContext.clearContext();

    console.log("Current context: ");
    console.log(gestaltContext.getContext());
}
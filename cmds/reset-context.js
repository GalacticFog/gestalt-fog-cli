exports.command = 'reset-context'
exports.desc = 'Reset context'
exports.builder = {}
exports.handler = function (argv) {

    const gestaltState = require('./lib/gestalt-state');

    gestaltState.clearState();

    console.log("Current context: ");
    console.log(gestaltState.getState());
}
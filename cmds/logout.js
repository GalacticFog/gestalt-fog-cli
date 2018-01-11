exports.command = 'logout'
exports.desc = 'Logout'
exports.builder = {}
exports.handler = function (argv) {

    const gestaltState = require('./lib/gestalt-state');

    gestaltState.clearAuthToken();

    gestaltState.clearState();

    gestaltState.clearCachedFiles();

    console.log("Logged out.");
}
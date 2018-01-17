const cmd = require('./lib/cmd-base');
exports.command = 'show-context'
exports.desc = 'Show context'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('./lib/gestalt');
    const selectHierarchy = require('./lib/selectHierarchy');
    const chalk = require('chalk');

    selectHierarchy.displayContext();

    console.log(JSON.stringify(gestalt.getState(), null, 2));
});
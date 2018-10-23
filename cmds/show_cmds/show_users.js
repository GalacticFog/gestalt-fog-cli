const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'users'
exports.desc = 'List users'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const resources = await gestalt.fetchUsers();
    ui.displayResources(resources, argv);
});
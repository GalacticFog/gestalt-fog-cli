const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { builder } = require('./lib/genericShowCommandHandler');
exports.command = 'users'
exports.desc = 'List users'
exports.builder = builder;
exports.handler = cmd.handler(async function (argv) {
    const resources = await gestalt.fetchUsers();
    ui.displayResources(resources, argv);
});
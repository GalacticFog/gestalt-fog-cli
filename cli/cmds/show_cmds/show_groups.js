const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { builder } = require('./lib/genericShowCommandHandler');
exports.command = 'groups'
exports.desc = 'List groups'
exports.builder = builder;
exports.handler = cmd.handler(async function (argv) {
    const resources = await gestalt.fetchGroups();
    ui.displayResources(resources, argv);
});
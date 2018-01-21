const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'groups'
exports.desc = 'List groups'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const chalk = require('chalk')

    const options = {
        message: "Groups",
        headers: ['UID', 'Group', 'Description', 'Org', 'Owner' /*'Created'*/],
        fields: ['id', 'name', 'description', 'org.properties.fqon', 'owner.name' /*'created.timestamp'*/],
        sortField: 'name',
    }

    const resources = await gestalt.fetchGroups();
    ui.displayResource(options, resources);
});
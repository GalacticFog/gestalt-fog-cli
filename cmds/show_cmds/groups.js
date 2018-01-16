const cmd = require('../lib/cmd-base');
exports.command = 'groups'
exports.desc = 'List groups'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const chalk = require('chalk')

    const options = {
        message: "Groups",
        headers: ['UID', 'Group', 'Description', 'Org', 'Owner' /*'Created'*/],
        fields: ['id', 'name', 'description', 'org.properties.fqon', 'owner.name' /*'created.timestamp'*/],
        sortField: 'name',
    }

    const resources = await gestalt.fetchGroups();
    displayResource.run(options, resources);
});
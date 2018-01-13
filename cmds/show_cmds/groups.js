exports.command = 'groups'
exports.desc = 'List groups'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const chalk = require('chalk')

    const options = {
        message: "Groups",
        headers: ['UID', 'Group', 'Description', 'Org', 'Owner' /*'Created'*/],
        fields: ['id', 'name', 'description', 'org.properties.fqon', 'owner.name' /*'created.timestamp'*/],
        sortField: 'name',
    }

    main();

    async function main() {
        const resources = await gestalt.fetchGroups();
        displayResource.run(options, resources);
    }
}
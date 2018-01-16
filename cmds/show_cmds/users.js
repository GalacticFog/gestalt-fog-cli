const cmd = require('../lib/cmd-base');
exports.command = 'users'
exports.desc = 'List users'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');

    const options = {
        message: "Users",
        headers: ['User', 'Description', 'Org', 'Owner', 'ID', 'Groups', 'Created'],
        fields: ['name', 'description', 'org.properties.fqon', 'owner.name', 'id', 'properties.groups', 'created.timestamp'],
        sortField: 'name',
    }

    const resources = await gestalt.fetchUsers();
    displayResource.run(options, resources);
});
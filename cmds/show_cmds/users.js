exports.command = 'users'
exports.desc = 'List users'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');

    const options = {
        message: "Users",
        headers: ['User', 'Description', 'Org', 'Owner', 'ID', 'Groups', 'Created'],
        fields: ['name', 'description', 'org.properties.fqon', 'owner.name', 'id', 'properties.groups', 'created.timestamp'],
        sortField: 'name',
    }

    try {
        const resources = gestalt.fetchUsers();

        // console.log(JSON.stringify(resources, null, 2))

        displayResource.run(options, resources);
    } catch (err) {
        console.log(err.message);
        console.log("Try running 'change-context'");
        console.log();
    }
}
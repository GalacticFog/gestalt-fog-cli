const cmd = require('../lib/cmd-base');
exports.command = 'all-workspaces'
exports.desc = 'List all workspaces'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');

    const options = {
        message: "Workspaces",
        headers: ['Org', 'Description', 'Name', 'Owner'],
        fields: ['org.properties.fqon', 'description', 'name', 'owner.name'],
        sortField: 'org.properties.fqon',
    }

    let fqons = await gestalt.fetchOrgFqons();
    let resources = await gestalt.fetchWorkspaces(fqons);
    displayResource.run(options, resources);
});
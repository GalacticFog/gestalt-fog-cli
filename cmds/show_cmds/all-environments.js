const cmd = require('../lib/cmd-base');
exports.command = 'all-environments'
exports.desc = 'List all enviornments'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');

    const options = {
        message: "Environments",
        headers: ['Description', 'Name', 'Org', 'Type', 'Workspace', 'Owner'],
        fields: ['description', 'name', 'org.properties.fqon', 'properties.environment_type', 'properties.workspace.name', 'owner.name'],
        sortField: 'description',
    }

    let fqons = await gestalt.fetchOrgFqons();
    let resources = await gestalt.fetchOrgEnvironments(fqons);
    displayResource.run(options, resources);
});
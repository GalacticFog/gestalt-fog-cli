const cmd = require('../lib/cmd-base');
exports.command = 'environments'
exports.desc = 'List enviornments'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');
    const options = {
        message: "Environments",
        headers: ['Environment', 'Name', 'Type', 'Org', 'Workspace', 'Owner'],
        fields: ['description', 'name', 'properties.environment_type', 'org.properties.fqon', 'properties.workspace.name', 'owner.name'],
        sortField: 'description',
    }

    await selectHierarchy.resolveWorkspace();
    const resources = await gestalt.fetchEnvironments();
    displayResource.run(options, resources);
});
const cmd = require('../lib/cmd-base');
exports.command = 'org-environments'
exports.desc = 'List org environments'
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

    await selectHierarchy.resolveOrg();
    const resources = await gestalt.fetchOrgEnvironments();
    displayResource.run(options, resources);
});
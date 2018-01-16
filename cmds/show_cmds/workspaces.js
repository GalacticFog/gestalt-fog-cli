const cmd = require('../lib/cmd-base');
exports.command = 'workspaces'
exports.desc = 'List workspaces'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');
    const options = {
        message: "Workspaces",
        headers: ['Workspace', 'Name', 'Org', 'Owner'],
        fields: ['description', 'name', 'org.properties.fqon', 'owner.name'],
        sortField: 'description',
    }

    await selectHierarchy.resolveOrg();
    const fqon = gestalt.getState().org.fqon;
    const resources = await gestalt.fetchWorkspaces([fqon]);
    displayResource.run(options, resources);
});
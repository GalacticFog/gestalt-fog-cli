exports.command = 'environments'
exports.desc = 'List enviornments'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');
    const options = {
        message: "Environments",
        headers: ['Environment', 'Name', 'Type', 'Org', 'Workspace', 'Owner'],
        fields: ['description', 'name', 'properties.environment_type', 'org.properties.fqon', 'properties.workspace.name', 'owner.name'],
        sortField: 'description',
    }

    main();

    async function main() {
        await selectHierarchy.resolveWorkspace();
        const resources = await gestalt.fetchEnvironments();
        displayResource.run(options, resources);
    }
}
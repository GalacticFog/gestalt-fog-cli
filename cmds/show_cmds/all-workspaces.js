exports.command = 'all-workspaces'
exports.desc = 'List all workspaces'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');

    const options = {
        message: "Workspaces",
        headers: ['Org', 'Description', 'Name', 'Owner'],
        fields: ['org.properties.fqon', 'description', 'name', 'owner.name'],
        sortField: 'org.properties.fqon',
    }

    main();

    async function main() {
        let fqons = await gestalt.fetchOrgFqons();
        let resources = await gestalt.fetchWorkspaces(fqons);
        displayResource.run(options, resources);
    }
}
const cmd = require('../lib/cmd-base');
exports.command = 'workspaces'
exports.desc = 'List workspaces'
exports.builder = {
    all: {
        description: 'Display workspaces in all orgs'
    }
}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');

    if (argv.all) {
        console.log('Showing all workspaces...');
        const options = {
            message: "Workspaces",
            headers: ['Org', 'Description', 'Name', 'Owner'],
            fields: ['org.properties.fqon', 'description', 'name', 'owner.name'],
            sortField: 'org.properties.fqon',
        }

        let fqons = await gestalt.fetchOrgFqons();
        let resources = await gestalt.fetchWorkspaces(fqons);
        displayResource.run(options, resources);
    } else {
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
    }
});

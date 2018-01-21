const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'workspaces'
exports.desc = 'List workspaces'
exports.builder = {
    all: {
        description: 'Display workspaces in all orgs'
    }
}
exports.handler = cmd.handler(async function (argv) {

    if (argv.all) {
        console.log('Showing all workspaces...');
        const options = {
            message: "Workspaces",
            headers: ['Org', 'Description', 'Name', 'Owner'],
            fields: ['org.properties.fqon', 'description', 'name', 'owner.name'],
            sortField: 'org.properties.fqon',
        }

        let fqons = await gestalt.fetchOrgFqons();
        let resources = await gestalt.fetchOrgWorkspaces(fqons);
        ui.displayResource(options, resources);
    } else {
        const options = {
            message: "Workspaces",
            headers: ['Workspace', 'Name', 'Org', 'Owner'],
            fields: ['description', 'name', 'org.properties.fqon', 'owner.name'],
            sortField: 'description',
        }

        const state = await ui.resolveOrg();
        const fqon = state.org.fqon;
        const resources = await gestalt.fetchOrgWorkspaces([fqon]);
        ui.displayResource(options, resources);
    }
});

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
        let fqons = await gestalt.fetchOrgFqons();
        let resources = await gestalt.fetchOrgWorkspaces(fqons);
        ui.displayResources(resources, argv);
    } else {
        const context = await ui.resolveOrg(false);
        const fqon = context.org.fqon;
        const resources = await gestalt.fetchOrgWorkspaces([fqon]);
        ui.displayResources(resources, argv, context);
    }
});

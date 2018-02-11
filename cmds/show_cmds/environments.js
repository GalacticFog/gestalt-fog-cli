const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'environments'
exports.desc = 'List enviornments'
exports.builder = {
    all: {
        description: 'Display all environments in all orgs'
    },
    org: {
        description: 'Display all environments in the current org'
    }
}
exports.handler = cmd.handler(async function (argv) {
    if (argv.all) {
        let fqons = await gestalt.fetchOrgFqons();
        let resources = await gestalt.fetchOrgEnvironments(fqons);
        ui.displayResources(resources, argv);
    } else if (argv.org) {
        const context = await ui.resolveOrg();
        const resources = await gestalt.fetchOrgEnvironments([context.org.fqon]);
        ui.displayResources(resources, argv, context);
    } else {
        const context = await ui.resolveWorkspace();
        const resources = await gestalt.fetchWorkspaceEnvironments(context);
        ui.displayResources(resources, argv, context);
    }
});

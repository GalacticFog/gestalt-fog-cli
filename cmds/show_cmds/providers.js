const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'providers'
exports.desc = 'List providers'
exports.builder = {
    org: {
        description: 'Fetch providers from org'
    },
    workspace: {
        description: 'Fetch providers from workspace'
    },
    type: {
        alias: 't',
        description: 'provider types'
    },
}
exports.handler = cmd.handler(async function (argv) {
    let resources = null;
    let context = null;

    if (argv.org) {
        context = await ui.resolveOrg(false);
        resources = await gestalt.fetchOrgProviders([context.org.fqon], argv.type);
    } else if (argv.workspace) {
        context = await ui.resolveWorkspace(false);
        resources = await gestalt.fetchWorkspaceProviders(context, argv.type);
    } else {
        context = await ui.resolveEnvironment(false);
        resources = await gestalt.fetchEnvironmentProviders(context, argv.type);
    }
    ui.displayResources(resources, argv, context);
});
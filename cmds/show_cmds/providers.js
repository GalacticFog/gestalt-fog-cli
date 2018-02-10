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
    environment: {
        description: 'Fetch providers from environment'
    },
    type: {
        alias: 't',
        description: 'provider types'
    },
}
exports.handler = cmd.handler(async function (argv) {
    let resources = null;

    if (argv.org) {
        const context = await ui.resolveOrg();
        resources = await gestalt.fetchOrgProviders([context.org.fqon], argv.type);
    } else if (argv.workspace) {
        const context = await ui.resolveWorkspace();
        resources = await gestalt.fetchWorkspaceProviders(context, argv.type);
    } else if (argv.environment) {
        const context = await ui.resolveEnvironment();
        resources = await gestalt.fetchEnvironmentProviders(context, argv.type);
    } else {
        resources = await gestalt.fetchOrgProviders(['root']);
    }

    ui.displayResources(resources, argv);
});
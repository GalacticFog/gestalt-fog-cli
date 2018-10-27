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
        if (argv.summary) {
            let fqons = await gestalt.fetchOrgFqons();
            let resources = await gestalt.fetchOrgEnvironments(fqons);
            ui.displayResources(resources, argv);
        } else {
            let fqons = await gestalt.fetchOrgFqons();
            let workspaces = await gestalt.fetchOrgWorkspaces(fqons);
            for (ws of workspaces) {
                const ctx = {
                    org: {
                        fqon: ws.org.properties.fqon
                    },
                    workspace: {
                        id: ws.id,
                        name: ws.name,
                        description: ws.description
                    }
                }
                const envs = await gestalt.fetchWorkspaceEnvironments(ctx);
                console.log(ui.getContextString(ctx));
                ui.displayResources(envs, argv);
            }
        }
    } else if (argv.org) {
        const context = await ui.resolveOrg(false);
        const resources = await gestalt.fetchOrgEnvironments([context.org.fqon]);
        ui.displayResources(resources, argv, context);
    } else {
        const context = await ui.resolveWorkspace(false);
        const resources = await gestalt.fetchWorkspaceEnvironments(context);
        ui.displayResources(resources, argv, context);
    }
});

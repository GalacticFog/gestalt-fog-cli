const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');
exports.command = 'environments [context_path]'
exports.desc = 'List enviornments'
exports.builder = {
    output: {
        alias: 'o',
        description: 'json, raw, yaml, list'
    },
    raw: {
        description: 'Show in raw JSON format'
    }
}
exports.handler = cmd.handler(async function (argv) {
    const context = argv.context_path ? await cmd.resolveContextPath(argv.context_path) : gestaltContext.getContext();

    if (context.workspace) {
        const resources = await gestalt.fetchWorkspaceEnvironments(context);
        ui.displayResources(resources, argv, context);
    } else if (context.org) {
        const resources = await gestalt.fetchOrgEnvironments([context.org.fqon]);
        ui.displayResources(resources, argv, context);
    } else {
        const fqons = await gestalt.fetchOrgFqons();
        for (let fqon of fqons) {
            const resources = await gestalt.fetchOrgEnvironments([fqon]);
            ui.displayResources(resources, argv, { org: { fqon: fqon } });
        }
    }
});

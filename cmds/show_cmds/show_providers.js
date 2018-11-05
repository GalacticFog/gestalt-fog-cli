const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');
exports.command = 'providers [context_path]'
exports.desc = 'List providers'
exports.builder = {
    type: {
        alias: 't',
        description: 'provider types'
    },
    raw: {
        description: "Raw JSON output"
    }
}
exports.handler = cmd.handler(async function (argv) {
    const context = argv.context_path ? await cmd.resolveContextPath(argv.context_path) : gestaltContext.getContext();

    if (!context.org) {
        context.org = { fqon: 'root' };
    }

    const resources = await gestalt.fetchProviders(context, argv.type);
    ui.displayResources(resources, argv, context);
});
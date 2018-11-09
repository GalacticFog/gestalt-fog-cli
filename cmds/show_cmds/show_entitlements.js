const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');

exports.command = 'entitlements [context_path]'
exports.desc = 'Show entitlements'
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

    if (!context.org) {
        context.org = { fqon: 'root' };
    }

    console.error(ui.getContextString(context));
    console.error();

    const resources = await gestalt.fetchEntitlements(context);
    ui.displayEntitlements(resources, argv);
});

const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');
const { builder } = require('./lib/genericShowCommandHandler');
exports.command = 'entitlements [context_path]'
exports.desc = 'Show entitlements'
exports.builder = builder;
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

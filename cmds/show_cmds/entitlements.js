const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const selectHierarchy = require('../lib/selectHierarchy');

exports.command = 'entitlements'
exports.desc = 'Show org entitlements'
exports.builder = {}

exports.handler = cmd.handler(async function (argv) {

    let context = null;
    if (argv.path) {
        context = await cmd.resolveContextPath(argv.path);
    } else {
        // Load from state
        context = gestalt.getContext();

        if (!context.org || !context.org.fqon) {
            // No arguments, allow choosing interatively
            context = await selectHierarchy.chooseContext({ includeNoSelection: true });
        }
    }

    console.error(ui.getContextString(context));
    console.error();

    const resources = await gestalt.fetchEntitlements(context);
    ui.displayEntitlements(resources);
});

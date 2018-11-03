const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');

exports.command = 'entitlements'
exports.desc = 'Show entitlements'
exports.builder = {}

exports.handler = cmd.handler(async function (argv) {

    const context = await cmd.getContextFromPathOrPrompt(argv);

    console.error(ui.getContextString(context));
    console.error();

    const resources = await gestalt.fetchEntitlements(context);
    ui.displayEntitlements(resources, argv);
});

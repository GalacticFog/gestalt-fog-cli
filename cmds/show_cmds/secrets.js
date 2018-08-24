const gestalt = require('../lib/gestalt');
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const selectHierarchy = require('../lib/selectHierarchy');
exports.command = 'secrets'
exports.desc = 'List secrets'
exports.builder = {
    raw: {
        description: 'Show in raw JSON format'
    }
}

exports.handler = cmd.handler(async function (argv) {

    let context = null;

    if (argv.path) {
        context = await cmd.resolveContextPath(argv.path);
    } else {
        // No arguments, allow choosing interatively

        context = await selectHierarchy.chooseContext({ includeNoSelection: true });

    }

    if (context) {
        const secrets = await gestalt.fetchSecrets(context);
        ui.displayResources(secrets, argv, context);
    }
});

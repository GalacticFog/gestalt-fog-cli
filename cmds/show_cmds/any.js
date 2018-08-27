const gestalt = require('../lib/gestalt');
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const selectHierarchy = require('../lib/selectHierarchy');
exports.command = 'any <type>'
exports.desc = 'List any'
exports.builder = {
    raw: {
        description: 'Show in raw JSON format'
    }
}

exports.handler = cmd.handler(async function (argv) {

    let context = null;
    const type = argv.type;

    if (argv.path) {
        context = await cmd.resolveContextPath(argv.path);
    } else {
        // No arguments, allow choosing interatively

        context = await selectHierarchy.chooseContext({ includeNoSelection: true });

    }

    if (context) {
        const resources = await gestalt.fetchEnvironmentResources(type, context);
        ui.displayResources(resources, argv, context);
    }
});

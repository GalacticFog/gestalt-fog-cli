const { gestalt, gestaltContext } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { doExportHierarchy } = require('./exportHelper');

exports.command = 'hierarchy [context_path]'
exports.desc = 'Export hierarchy'
exports.builder = {
    context_path: {
        description: 'Context path'
    },
    directory: {
        alias: 'd',
        description: 'Export directory'
    }
}

exports.handler = cmd.handler(async function (argv) {
    const context = await resolveContext(argv);

    const resourceTypes = await getResourceTypes(argv);

    await doExportHierarchy(context, resourceTypes, argv.directory, argv.output, argv.raw);
});


async function getResourceTypes(argv) {
    const types = gestalt.getEnvironmentResourceTypes();
    if (!argv.all) {
        return await ui.selectOptions('Resources to export', types);
    }
    return types;
}

async function resolveContext(argv) {
    let context = null;

    if (argv.context_path) {
        context = await cmd.resolveContextPath(argv.context_path);
    } else {
        context = gestaltContext.getContext();

        const config = gestaltContext.getConfig();
        if (config['interactive'] == 'true') {
            if (!context.environment || !context.environment.id) {
                // No arguments, allow choosing interatively
                console.error("No context configured, choose a context.")
                context = await selectHierarchy.chooseContext({ includeNoSelection: true });
            }
        }
    }
    return context;
}


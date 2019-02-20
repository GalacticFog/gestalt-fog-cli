const { gestalt, gestaltSession } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { doExportHierarchy, getDefaultExportDirectory } = require('./exportHelper');
const fs = require('fs');

exports.command = 'hierarchy [context_path]'
exports.desc = 'Export hierarchy'
exports.builder = {
    context_path: {
        description: 'Context path'
    },
    directory: {
        alias: 'd',
        description: 'Export directory'
    },
    output: {
        alias: 'o',
        description: 'Export format (yaml, json)'
    },
    raw: {
        type: 'boolean',
        description: 'Output raw resources'
    }
}

exports.handler = cmd.handler(async function (argv) {
    const context = await resolveContext(argv);

    const basePath = argv.directory || getDefaultExportDirectory(argv.raw);

    if (await checkIfDirectoryExists(basePath)) {

        const resourceTypes = await getResourceTypes(argv);

        if (!argv.output) {
            if (argv.raw) argv.output = 'json';
        }
    
        await doExportHierarchy(context, resourceTypes, basePath, argv.output, argv.raw);
    } else {
        console.log('Aborted.');
    }
});

async function checkIfDirectoryExists(basePath) {
    if (fs.existsSync(basePath)) {
        return ui.promptToContinue(`Directory '${basePath}' exists, files may be overwritten. Proceed to export?`, false);
    }
    // Directory doesn't exist, proceed
    return true;
}


async function getResourceTypes(argv) {
    const types = gestalt.getEnvironmentResourceTypes();
    types.push('entitlements');
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
        context = gestaltSession.getContext();

        const config = gestaltSession.getSessionConfig();
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


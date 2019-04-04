const { gestalt, gestaltSession } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { debug } = require('../lib/debug');
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
    },
    interactive: {
        type: 'boolean',
        default: true,
        description: 'Interactive'
    },
    'resource-types': {
        type: 'string',
        description: 'Resource types to export'
    },
    all: {

    }
}

exports.handler = cmd.handler(async function (argv) {
    const context = await resolveContext(argv);

    const basePath = argv.directory || getDefaultExportDirectory(argv.raw);

    const resourceTypes = await getResourceTypes(argv);

    if (!argv.interactive || await checkIfDirectoryExists(basePath)) {

        if (!argv.output) {
            if (argv.raw) argv.output = 'json';
        }

        await doExportHierarchy(context, resourceTypes, basePath, argv.output, argv.raw);
    } else {
        console.log('Aborted.');
    }
});

async function checkIfDirectoryExists(basePath) {

    const config = gestaltSession.getGlobalConfig();
    if (config['interactive'] == 'false') {
        return true;
    }

    if (fs.existsSync(basePath)) {
        return ui.promptToContinue(`Directory '${basePath}' exists, files may be overwritten. Proceed to export?`, false);
    }
    // Directory doesn't exist, proceed
    return true;
}


async function getResourceTypes(argv) {
    const types = gestalt.getEnvironmentResourceTypes();
    types.push('entitlements');

    if (argv.all && argv['resource-types']) {
        throw Error(`Can only specify one of --all, --resource-types`);
    }

    if (argv.all) {
        return types;
    }

    if (argv['resource-types']) {
        const specifiedTypes = argv['resource-types'].split(',');
        for (const t of specifiedTypes) {
            if (!types.includes(t)) {
                throw Error(`Specified type is not valid: ${t}`);
            }
        }
        return specifiedTypes;
    }

    // otherwise, prompt
    if (argv.interactive) {
        return await ui.selectOptions('Resources to export', types);
    }

    throw Error(`Must specify --resource-types since --interactive is 'false'`);
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


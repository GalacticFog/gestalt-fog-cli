const { gestalt } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui');
const cmd = require('../lib/cmd-base');
const { doExportEnviornmentResources } = require('./exportHelper');

exports.command = 'resources [context_path]'
exports.desc = 'Export environment resources'
exports.builder = {
    context_path: {
        description: 'Context path'
    },
    directory: {
        alias: 'd',
        description: 'Directory to export to (defaults to current directory)'
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
    let envContext = {};
    if (argv.context_path) {
        envContext = await cmd.resolveContextPath(argv.context_path);
    }
    if (!envContext.org || !envContext.workspace || !envContext.environment || !envContext.environment.id || !envContext.environment.name) {
        envContext = await ui.resolveEnvironment();
    }
    let types = gestalt.getEnvironmentResourceTypes();
    if (!argv.all) {
        types = await ui.selectOptions('Resources to export', types);
    }

    if (!argv.output) {
        if (argv.raw) argv.output = 'json';
    }

    // Do the export of resources from the specified environment
    await doExportEnviornmentResources(envContext, types, argv.directory, argv.output, argv.raw);
});


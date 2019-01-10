const { gestalt, gestaltContext } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { builder } = require('./lib/genericShowCommandHandler');
exports.command = 'workspaces [context_path]'
exports.desc = 'List workspaces'
exports.builder = builder;
exports.handler = cmd.handler(async function (argv) {

    const context = argv.context_path ? await cmd.resolveContextPath(argv.context_path) : gestaltContext.getContext();

    if (context.org) {
        const resources = await gestalt.fetchOrgWorkspaces([context.org.fqon]);
        ui.displayResources(resources, argv, context);
    } else {
        const fqons = await gestalt.fetchOrgFqons();
        for (let fqon of fqons) {
            const resources = await gestalt.fetchOrgWorkspaces([fqon]);
            ui.displayResources(resources, argv, { org: { fqon: fqon } });
        }
    }
});

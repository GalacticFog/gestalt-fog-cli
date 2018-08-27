const gestalt = require('../../lib/gestalt');
const ui = require('../../lib/gestalt-ui')
const cmd = require('../../lib/cmd-base');
const selectHierarchy = require('../../lib/selectHierarchy');
const gestaltContext = require('../../lib/gestalt-context');

module.exports = {
    buildCommand
};

function buildCommand(type) {

    const command = {
        command: type,
        description: `Show ${type}`,
        builder: {
            raw: {
                description: 'Show in raw JSON format'
            }
        },
        handler: cmd.handler(getHandler(type))
    };

    return command;
}

function getHandler(type) {

    return async function (argv) {

        if (argv.all) {
            await showAllResources(argv);
            return;
        }

        let context = null;

        if (argv.path) {
            context = await cmd.resolveContextPath(argv.path);
        } else {
            context = gestaltContext.getContext();

            if (!context.environment && !context.environment.id) {
                // No arguments, allow choosing interatively
                context = await selectHierarchy.chooseContext({ includeNoSelection: true });
            }
        }

        if (argv.org) {
            showOrgResources(argv);
            return;
        }

        if (context) {
            console.error(ui.getContextString(context));
            console.error();

            let resources = [];
            if (argv.name) {
                const secret = await gestalt.fetchResource(type, { name: argv.name }, context);
                if (secret) {
                    resources.push(secret);
                }
            } else {
                resources = await gestalt.fetchEnvironmentResources(type, context);
            }

            ui.displayResources(resources, argv, context);
        }
    }

    async function showResources(argv) {
        const context = await ui.resolveEnvironment(false);
        const resources = await gestalt.fetchEnvironmentResources(type, context);
        ui.displayResources(resources, argv, context);
    }

    async function showAllResources(argv) {
        const fqons = await gestalt.fetchOrgFqons();
        let resources = await gestalt.fetchOrgResources(type, fqons);
        ui.displayResources(resources, argv);
    }

    async function showOrgResources(argv) {
        const context = await ui.resolveOrg(false);
        const fqon = context.org.fqon;
        const resources = await gestalt.fetchOrgResources(type, [fqon]);
        ui.displayResources(resources, argv, context);
    }
}

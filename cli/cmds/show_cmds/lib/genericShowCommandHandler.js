const { gestalt, gestaltContext } = require('gestalt-fog-sdk');
const ui = require('../../lib/gestalt-ui')
const cmd = require('../../lib/cmd-base');
const selectHierarchy = require('../../lib/selectHierarchy');
const chalk = require('../../lib/chalk');
const displayContext = require('../../lib/displayContext');
const builder = {
    raw: {
        description: 'Show in raw JSON format'
    },
    output: {
        alias: 'o',
        description: 'json, raw, yaml, list'
    },
    more: {
        description: 'Show additional output fields (not applicable for json/raw/yaml/list output types)'
    },
    name: {
        description: 'Filters the resource by the specific name'
    },
    'context_path': {
        description: "Specify the context path (/<org>/<workspace>/<environment>)"
    },
    fields: {
        type: 'string',
        description: "Specify display fields.  Comma separated, and prefix with '+' to display fields in addition to default fields (e.g. '+id,name' vs 'id,name')"
    },
};

module.exports = {
    buildCommand,
    builder
};

function buildCommand(type) {

    const command = {
        command: type + ' [context_path]',
        description: `Show ${type}`,
        builder: builder,
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

        if (context.environment) {
            doShowEnvironmentResources(type, context, argv);
        } else if (context.workspace) {
            doShowWorkspaceResources(type, context, argv);
        } else if (context.org) {
            doShowOrgResources(type, context, argv);
        } else if (argv.context_path == '/') {
            doShowAllResources(type, argv);
        } else {
            throw Error('No context specified');
        }
    }

    async function doShowAllResources(type, argv) {
        const fqons = await gestalt.fetchOrgFqons();
        for (let fqon of fqons) {
            doShowOrgResources(type, { org: { fqon: fqon } }, argv);
        }
    }

    async function doShowOrgResources(type, context, argv) {
        const workspaces = await gestalt.fetchOrgWorkspaces([context.org.fqon]);
        for (let ws of workspaces) {

            const wsContext = {
                ...context,
                workspace: {
                    id: ws.id,
                    name: ws.name
                }
            }

            doShowWorkspaceResources(type, wsContext, argv);
        }
    }

    async function doShowWorkspaceResources(type, context, argv) {
        const environments = await gestalt.fetchWorkspaceEnvironments(context);
        for (let e of environments) {
            const envContext = {
                ...context,
                environment: {
                    id: e.id,
                    name: e.name
                }
            }

            doShowEnvironmentResources(type, envContext, argv);
        }
    }

    async function doShowEnvironmentResources(type, context, argv) {
        try {
            const resources = await gestalt.fetchEnvironmentResources(type, context);
            ui.displayResources(resources, argv, context);
        } catch (err) {
            console.error(displayContext.contextString(context) + ':')
            console.error(chalk.red('  ' + err.error));
            console.error();
        }
    }
}

const showCommandBuilder = require('./lib/genericShowCommandHandler');
module.exports = showCommandBuilder.buildCommand('containers');


// const { gestalt } = require('gestalt-fog-sdk')
// const ui = require('../lib/gestalt-ui')
// const cmd = require('../lib/cmd-base');
// const debug = cmd.debug;
// exports.command = 'containers [context_path]'
// exports.desc = 'List containers'
// exports.builder = {
//     all: {
//         description: 'Display all containers in all orgs'
//     },
//     org: {
//         description: 'Display all containers in the current org'
//     },
//     raw: {
//         description: 'Display raw JSON output'
//     }
// }
// exports.handler = cmd.handler(async function (argv) {
//     if (argv.all) {
//         showAllContainers(argv);
//     } else if (argv.org) {
//         showOrgContainers(argv);
//     } else {
//         showContainers(argv);
//     }
// });

// async function showContainers(argv) {
//     let context = null;
//     if (argv.context_path) {
//         context = await cmd.resolveContextPath(argv.context_path);
//     } else {
//         context = await ui.resolveEnvironment(false);
//     }

//     if (context.environment) {
//         doShowEnvironmentContainers(context, context.environment, argv);
//     } else if (context.workspace) {
//         doShowWorkspaceContainers(context, context.workspace, argv);
//     } else if (context.org) {
//         doShowOrgContainers(context, argv);
//     }
// }

// async function doShowOrgContainers(context, argv) {
//     debug('doShowOrgContainers')
//     const workspaces = await gestalt.fetchOrgWorkspaces([context.org.fqon]);
//     for (let ws of workspaces) {
//         doShowWorkspaceContainers(context, ws, argv);
//     }
// }

// async function doShowWorkspaceContainers(context, ws, argv) {
//     const wsContext = {
//         ...context,
//         workspace: {
//             id: ws.id,
//             name: ws.name
//         }
//     }

//     const environments = await gestalt.fetchWorkspaceEnvironments(wsContext);
//     for (let e of environments) {
//         doShowEnvironmentContainers(wsContext, e, argv);
//     }
// }

// async function doShowEnvironmentContainers(context, e, argv) {
//     const envContext = {
//         ...context,
//         environment: {
//             id: e.id,
//             name: e.name
//         }
//     }
//     const containers = await gestalt.fetchContainers(envContext);
//     ui.displayResources(containers, argv, envContext);    
// }

// async function showAllContainers(argv) {
//     const fqons = await gestalt.fetchOrgFqons();
//     let containers = await gestalt.fetchOrgContainers(fqons);
//     ui.displayResources(containers, argv);
// }

// async function showOrgContainers(argv) {
//     const context = await ui.resolveOrg(false);
//     const fqon = context.org.fqon;
//     const containers = await gestalt.fetchOrgContainers([fqon]);
//     ui.displayResources(containers, argv, context);
// }

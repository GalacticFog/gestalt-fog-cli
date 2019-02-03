const showCommandBuilder = require('./lib/genericShowCommandHandler');
module.exports = showCommandBuilder.buildCommand('apiendpoints');

// ##### Keeping the below for reference.  Gestalt SDK was refactored to allow retrieving apiendpoints

// const { gestalt, gestaltContext } = require('gestalt-fog-sdk');
// const ui = require('../lib/gestalt-ui')
// const cmd = require('../lib/cmd-base');
// const { builder } = require('./lib/genericShowCommandHandler');
// exports.command = 'api-endpoints [context_path]'
// exports.desc = 'List API endpoints'
// exports.builder = builder;
// exports.handler = cmd.handler(async function (argv) {

//     const context = argv.context_path ? await cmd.resolveContextPath(argv.context_path) : gestaltContext.getContext();

//     if (context.environment) {
//         doShowEnvironmentApiEndpoints(context, argv);
//     } else if (context.workspace) {
//         doShowWorkspaceApiEndpoints(context, argv);
//     } else if (context.org) {
//         doShowOrgApiEndpoints(context, argv);
//     } else {
//         doShowAllApiEndpoints(argv);
//     }
// });

// async function doShowAllApiEndpoints(argv) {
//     const fqons = await gestalt.fetchOrgFqons();
//     for (let fqon of fqons) {
//         doShowOrgApiEndpoints({ org: { fqon: fqon } }, argv);
//     }
// }

// async function doShowOrgApiEndpoints(context, argv) {
//     const workspaces = await gestalt.fetchOrgWorkspaces([context.org.fqon]);
//     for (let ws of workspaces) {

//         const wsContext = {
//             ...context,
//             workspace: {
//                 id: ws.id,
//                 name: ws.name
//             }
//         }

//         doShowWorkspaceApiEndpoints(wsContext, argv);
//     }
// }

// async function doShowWorkspaceApiEndpoints(context, argv) {
//     const environments = await gestalt.fetchWorkspaceEnvironments(context);
//     for (let e of environments) {
//         const envContext = {
//             ...context,
//             environment: {
//                 id: e.id,
//                 name: e.name
//             }
//         };

//         doShowEnvironmentApiEndpoints(envContext, argv);
//     }
// }

// async function doShowEnvironmentApiEndpoints(context, argv) {
//     const resources = await gestalt.fetchEnvironmentApis(context);
//     const apis = resources.map(item => {
//         return {
//             id: item.id,
//             fqon: item.org.properties.fqon
//         }
//     });

//     const eps = await gestalt.fetchApiEndpoints(apis);
//     ui.displayResources(eps, argv, context);
// }

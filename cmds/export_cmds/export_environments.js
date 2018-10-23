// const gestalt = require('../lib/gestalt')
// const ui = require('../lib/gestalt-ui')
// const io = require('../lib/gestalt-io');
// const cmd = require('../lib/cmd-base');
// const doExport = require('./exportHelper').doExport;

// exports.command = 'environments'
// exports.desc = 'Export environments'
// exports.builder = {
// }

// exports.handler = cmd.handler(async function (argv) {
//     const context = await ui.resolveWorkspace();

//     // Fetch the workspace and environments
//     const workspace = await gestalt.fetchWorkspace(context);
//     const environments = await gestalt.fetchWorkspaceEnvironments(context);

//     // Choose environments and resource types
//     const selectedEnvironments = await ui.select({ message: 'Environments to export', mode: 'checkbox' }, environments);
//     const types = await ui.selectOptions('Resources to export', gestalt.getEnvironmentResourceTypes());

//     await doExport([], selectedEnvironments, types, argv.path);
// });

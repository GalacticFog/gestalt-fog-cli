const cmd = require('../lib/cmd-base');
const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const selectHierarchy = require('../lib/selectHierarchy');
const gestaltContext = require('../lib/gestalt-context');

exports.command = 'set [path]'
exports.desc = 'Set context'
exports.builder = {
    reset: {
        description: 'Resets the context'
    },
    path: {
        description: "Sets the whole context path (Org, Workspace, Environment)"
    }
}
exports.handler = cmd.handler(async function (argv) {
    if (argv.path) {
        const context = await cmd.resolveContextPath(argv.path);
        gestaltContext.setContext(context);
    } else {
        // No arguments, allow choosing interatively

        const context = await selectHierarchy.chooseContext({ includeNoSelection: true });
        gestaltContext.setContext(context);
    }

    // Print the context
    cmd.debug(gestaltContext.getContext());
    console.log('Context: ' + ui.getContextString(gestaltContext.getContext()));
});


// ------------------- Previous code for reference ------------------------------


// const cmd = require('../lib/cmd-base');
// const { gestalt } = require('gestalt-fog-sdk')
// const ui = require('../lib/gestalt-ui')
// const selectHierarchy = require('../lib/selectHierarchy');
// const gestaltContext = require('../lib/gestalt-context');

// exports.command = 'set [path]'
// exports.desc = 'Set context'
// exports.builder = {
//     reset: {
//         description: 'Resets the context'
//     },
//     org: {
//         description: "Sets the org"
//     },
//     workspace: {
//         description: "Sets the workspace"
//     },
//     environment: {
//         description: "Sets the environment"
//     },
//     path: {
//         description: "Sets the whole context path (Org, Workspace, Environment)"
//     }
// }
// exports.handler = cmd.handler(async function (argv) {
//     if (argv.path) {
//         const context = await cmd.resolveContextPath(argv.path);
//         gestaltContext.setContext(context);
//     } else if (!argv.org && !argv.workspace && !argv.environment) {
//         // No arguments, allow choosing interatively

//         const context = await selectHierarchy.chooseContext({ includeNoSelection: true });
//         gestaltContext.setContext(context);

//     } else {
//         // Any or all of --org, --workspace, --environment were specified.  Adjust context accordingly.
//         // Take into account the current context when one or more parameters are omitted, for example
//         // specifying --environment without org or workspace would search for environments in the current workspace.

//         const cachedContext = gestaltContext.getContext();

//         let context = null;

//         if (argv.environment) {
//             // Ensure Org and Workspace are in current context or passed via variable
//             requireOrg(cachedContext, argv);
//             requireWorkspace(cachedContext, argv);
//             context = await cmd.resolveEnvironment(argv);
//         } else {
//             requireOrg(cachedContext, argv);
//             if (argv.workspace) {
//                 context = await cmd.resolveWorkspace(argv);
//             } else {
//                 context = await cmd.resolveOrg(argv);
//                 // Workspace was omitted, so clear it
//                 delete context.workspace;
//             }
//             // Environment param was omitted, so clear it
//             delete context.environment;
//         }

//         // Save the context
//         gestaltContext.setContext(context);
//     }

//     // Print the context
//     cmd.debug(gestaltContext.getContext());
//     console.log('Context: ' + ui.getContextString(gestaltContext.getContext()));
// });

// // Helper
// function requireOrg(cachedContext, argv) {
//     if (!cachedContext.org && !argv.org) {
//         throw Error('--org property required');
//     }
// }

// // Helper
// function requireWorkspace(cachedContext, argv) {
//     if (!cachedContext.workspace && !argv.workspace) {
//         throw Error('--workspace property required');
//     }
// }
// const gestalt = require('../lib/gestalt')
// const ui = require('../lib/gestalt-ui')
// const cmd = require('../lib/cmd-base');
// exports.command = 'lambdas'
// exports.desc = 'List lambdas'
// exports.builder = {
//     all: {
//         description: 'Display all lambdas in all orgs'
//     },
//     org: {
//         description: 'Display all lambdas in the current org'
//     }
// }

// exports.handler = cmd.handler(async function (argv) {
//     if (argv.all) {
//         showAllLambdas(argv);
//     } else if (argv.org) {
//         showOrgLambdas(argv)
//     } else {
//         showLambdas(argv);
//     }
// });

// async function showLambdas(argv) {
//     const context = await ui.resolveEnvironment();
//     const resources = await gestalt.fetchEnvironmentLambdas(context);
//     ui.displayResource(options, resources);
// }

// async function showAllLambdas(argv) {
//     let fqons = await gestalt.fetchOrgFqons();
//     let resources = await gestalt.fetchOrgLambdas(fqons);
//     ui.displayResource(options, resources);
// }

// async function showOrgLambdas(argv) {
//     const context = await ui.resolveOrg();
//     const resources = await gestalt.fetchOrgLambdas([context.org.fqon]);
//     ui.displayResource(options, resources);
// }
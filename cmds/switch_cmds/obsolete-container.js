// const cmd = require('../lib/cmd-base');
// exports.command = 'container'
// exports.desc = 'Select container'
// exports.builder = {}
// exports.handler = cmd.handler(async function (argv) {
//     const selectHierarchy = require('../lib/selectHierarchy');
//     const selectContainer = require('../lib/selectContainer');
//     const gestalt = require('../lib/gestalt');

//     await selectHierarchy.resolveEnvironment();

//     selectContainer.run({}, (result) => {
//         if (result) {
//             gestalt.setCurrentContainer(result);

//             console.log();
//             console.log(`${result.name} selected.`);
//             console.log();
//         } else {
//             console.log("No selection.");
//         }
//     });
// });
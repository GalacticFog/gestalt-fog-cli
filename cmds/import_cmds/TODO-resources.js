// const gestalt = require('../lib/gestalt')
// const ui = require('../lib/gestalt-ui')
// const io = require('../lib/gestalt-io');
// const cmd = require('../lib/cmd-base');

// var path = require('path'), fs = require('fs');

// exports.command = 'resources'
// exports.desc = 'Import resources'
// exports.builder = {
// }

// exports.handler = cmd.handler(async function (argv) {
//     const files = findFiles(argv.path || '.', '.json');

//     // const selectedFiles = await ui.selectOptions('Select', files);
//     const resources = [];
//     for (let f of files) {
//         const res = io.loadResourceFromFile(f);
//         resources.push(res);
//         // resources.push({
//         //     name: f + ' : ' + res.name,
//         //     value: res
//         // });
//     }

//     const confirm = await ui.promptToContinue('Continue?', false)
//     if (confirm) {

//         for (let res of resources) {
//             delete res.id;
//             delete res.resource_state;
//             delete res.owner;
//             delete res.created;
//             delete res.modified;
//             console.log(res);
//         }

//         // Do import

//     }
// });



// function findFiles(dir, extension, arr = []) {
//     if (!fs.existsSync(dir)) {
//         return;
//     }

//     const files = fs.readdirSync(dir);
//     for (let f of files) {
//         const filename = path.join(dir, f);
//         const stat = fs.lstatSync(filename);
//         if (stat.isDirectory()) {
//             findFiles(filename, extension, arr);
//         } else if (filename.endsWith(extension)) {
//             // console.log(filename)
//             arr.push(filename);
//         }
//     }
//     return arr;
// }


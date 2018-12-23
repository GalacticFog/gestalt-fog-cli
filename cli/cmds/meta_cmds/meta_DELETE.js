const cmd = require('../lib/cmd-base');
const { meta } = require('gestalt-fog-sdk');
exports.command = 'DELETE [path]'
exports.desc = 'HTTP functions'
exports.builder = {

}

exports.handler = cmd.handler(async function (argv) {
    const urlPath = argv.path;
    const response = await meta.DELETE(urlPath);
    //ui.displayResources(response, argv);
    try {
        console.log(JSON.stringify(response, null, 2));
    } catch (err) {
        console.log(response);
    }
});

const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { security } = require('gestalt-fog-sdk');
exports.command = 'GET [path]'
exports.desc = 'HTTP functions'
exports.builder = {

}

exports.handler = cmd.handler(async function (argv) {
    const urlPath = argv.path;
    const response = await security.GET(urlPath);
    ui.displayResources(response, argv);
});

const { renderResourceTemplate } = require('gestalt-fog-sdk')
const cmd = require('../lib/cmd-base');
const { meta } = require('gestalt-fog-sdk');

exports.command = 'POST [path]'
exports.desc = 'HTTP functions'
exports.builder = {
    file: {
        alias: 'f',
        description: 'resource definition file'
    },
}

exports.handler = cmd.handler(async function (argv) {
    const urlPath = argv.path;

    const spec = argv.file ? await renderResourceTemplate(argv.file, {}, undefined) : {};
    const response = await meta.POST(urlPath, spec);
    try {
        console.log(JSON.stringify(response, null, 2));
    } catch (err) {
        console.log(response);
    }
});

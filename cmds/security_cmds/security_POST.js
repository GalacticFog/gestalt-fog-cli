const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
const { renderResourceTemplate } = require('../lib/template-resolver');
const security = require('../lib/gestalt/securityclient');

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
    const response = await security.POST(urlPath, spec);
    try {
        console.log(JSON.stringify(response, null, 2));
    } catch (err) {
        console.log(response);
    }
});

const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const security = require('../lib/gestalt/securityclient');
const util = require('../lib/util');
exports.command = 'PATCH [path] [file]'
exports.desc = 'HTTP functions'
exports.builder = {
    file: {
        alias: 'f',
        description: 'patch definition file',
        required: true
    },
}

exports.handler = cmd.handler(async function (argv) {
    const urlPath = argv.path;
    const spec = util.loadObjectFromFile(argv.file);
    const response = await security.PATCH(urlPath, spec);
    ui.displayResources(response, argv);
});

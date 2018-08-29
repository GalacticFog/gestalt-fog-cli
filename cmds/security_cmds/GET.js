const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
const { renderResourceTemplate } = require('../lib/template-resolver');
const security = require('../lib/gestalt/securityclient');

exports.command = 'GET [path]'
exports.desc = 'HTTP functions'
exports.builder = {

}

exports.handler = cmd.handler(async function (argv) {
    const urlPath = argv.path;

    const response = await security.GET(urlPath);

    ui.displayResources(response, argv);
});

const cmd = require('../lib/cmd-base');
const security = require('../lib/gestalt/securityclient');
const ui = require('../lib/gestalt-ui')

exports.command = 'show-groups [org]';
exports.description = 'Show groups';
exports.builder = {
    org: {
        definition: 'Org to search',
        required: true
    },
    raw: {
        definition: 'Display raw output'
    }
}

exports.handler = cmd.handler(async function (argv) {
    const fqon = argv.org;
    const response = await security.GET(`/${fqon}/groups`);
    ui.displayResources(response, argv);
});

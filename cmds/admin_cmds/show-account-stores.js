const cmd = require('../lib/cmd-base');
const security = require('../lib/gestalt/securityclient');
const ui = require('../lib/gestalt-ui')

exports.command = 'show-account-stores [org]';
exports.description = 'Show account stores';
exports.builder = {
    org: {
        definition: 'Org to search directories',
        required: true
    },
    raw: {
        definition: 'Display raw output'
    }
}

exports.handler = cmd.handler(async function (argv) {
    const fqon = argv.org;
    const response = await security.GET(`/${fqon}/accountStores`);
    ui.displayResources(response, argv);
});

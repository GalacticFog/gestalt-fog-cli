const cmd = require('../lib/cmd-base');
const { security } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui')

exports.command = 'show-directories [org]';
exports.description = 'Show LDAP directories';
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
    const response = await security.GET(`/${fqon}/directories`);
    ui.displayResources(response, argv);
});

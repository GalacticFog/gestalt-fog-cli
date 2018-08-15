const gestalt = require('../lib/gestalt')
const cmd = require('../lib/cmd-base');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');

exports.command = 'show-account-stores';
exports.description = 'Show account stores';

exports.builder = {
    org: {
        definition: 'Org to search directories',
        required: true
    }
}

exports.handler = cmd.handler(async function (argv) {
    const fqon = argv.org;
    const response = await gestalt.securityGet(`/${fqon}/accountStores`);
    out(JSON.stringify(response, null, 2));
});

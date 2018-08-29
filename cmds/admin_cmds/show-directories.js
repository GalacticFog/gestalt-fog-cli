const gestalt = require('../lib/gestalt')
const cmd = require('../lib/cmd-base');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');
const security = require('../lib/gestalt/securityclient');

exports.command = 'show-directories';
exports.description = 'Show LDAP directories';

exports.builder = {
    org: {
        definition: 'Org to search directories',
        required: true
    }
}

exports.handler = cmd.handler(async function (argv) {
    const fqon = argv.org;
    const response = await security.GET(`/${fqon}/directories`);
    out(JSON.stringify(response, null, 2));
});

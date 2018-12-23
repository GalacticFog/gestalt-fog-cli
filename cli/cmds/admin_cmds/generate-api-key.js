const { gestalt } = require('gestalt-fog-sdk')
const cmd = require('../lib/cmd-base');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');

exports.command = 'generate-api-key [user]';

exports.description = 'Generate Gestalt Security API key';

exports.builder = {
    user: {
        definition: 'User',
        required: true
    },
    org: {
        definition: 'Org to create directory against',
        required: true
    },
    key: {
        definition: 'API key',
        required: true
    },
    secret: {
        definition: 'API secret',
        required: true
    }
}

exports.handler = cmd.handler(async function (argv) {

    /*  Bash example:

        echo "{\"orgId\":\"$root_org\"}" | \
        http POST $gestalt_url/security/accounts/$user/apiKeys --auth "$api_key:$api_secret"

        # Example:

        $ echo '{"orgId":"d45b81b2-2e54-482e-b257-2bfdd50f90e3"}' | \
        http POST https://<gestalt url>/security/accounts/4c5fb6e7-c379-4e51-9bf4-7c0d5c771a2e/apiKeys \
        --auth '4db7f01e-d91c-4b8e-8903-9ddef532e1ba:/lON8eNU4/v7VJ5gIKvbVRPoAgg8W9xssglUagaT'
    */

    const fqon = argv.org;
    const username = argv.user;

    const org = (await gestalt.fetchOrgs()).find(o => o.properties.fqon === fqon);
    if (!org) {
        throw Error(`Org '${fqon}' not found`);
    }

    const user = (await gestalt.fetchUsers()).find(u => u.name === username);
    if (!user) {
        throw Error(`User '${username}' not found`);
    }

    const response = await requestApiKey(org, user, argv.key, argv.secret);

    // Decorate
    const returnValue = {
        username: user.name,
        org: fqon,
        ...response
    }

    delete returnValue.disabled;

    out(JSON.stringify(returnValue, null, 2));
});

function requestApiKey(org, user, key, secret) {
    const payload = {
        orgId: org.id
    };
    const opts = {
        headers: {
            'Authorization': getBasicAuthData(key, secret)
        }
    }

    return gestalt.securityPost(`/accounts/${user.id}/apiKeys`, payload, opts);
}

function getBasicAuthData(key, secret) {
    return 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
}

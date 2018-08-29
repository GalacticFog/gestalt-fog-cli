const gestalt = require('../lib/gestalt')
const cmd = require('../lib/cmd-base');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');
const { directorySchema } = require('../../schemas');

exports.command = 'create-account-store [file]';
exports.description = 'Create Account Store';

exports.builder = {
    file: {
        alias: 'f',
        description: 'patch definition file',
        required: true
    },

    org: {
        definition: 'Org to create directory against',
        required: true
    },

    'directory-id': {
        definition: 'Target directory ID',
        required: true
    }
}

exports.handler = cmd.handler(async function (argv) {
    const fqon = argv.org;
    const directoryId = argv['directory-id'];

    // Query for directory Id
    const directories = getDirectories(fqon);
    const directory = directories.find(d => d.id == directoryId);
    
    if (directory) {
        // Query for group
        const group = await getDirectoryGroup(directory.id, groupName);

        // Create account store based on group
        const response = await createAccountStore(fqon, group.id);
        debug(response);
        out(`Created directory '${response.name}' (${response.id})`);
    } else {
        throw Error(`Directory with ID '${directoryId}' not found.`);
    }
});

async function getDirectories(fqon) {
    const response = await gestalt.securityGet(`/${fqon}/directories`);
    return response;
}

async function getDirectoryGroup(directoryId, groupName) {
    const response = await gestalt.securityGet(`/directories/${directoryId}/groups?name=${groupName}`);
    if (response.length != 1) {
        throw Error('Expected exactly one result. response.length = ' + response.length);
    }
    return response[0];
}

async function createAccountStore(fqon, group) {
    const spec = {
        name: `${fqon}-mapping`,
        description: `mapping for ${fqon} org and ${group.name} group`,
        accountStoreId: group.id,
        storeType: 'GROUP',
        isDefaultAccountStore: false,
        isDefaultGroupStore: false
    };

    directorySchema.validateSync(spec);

    const response = await gestalt.securityPost(`/${fqon}/accountStores`, spec);
    return response;
}

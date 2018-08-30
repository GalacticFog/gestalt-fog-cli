const gestalt = require('../lib/gestalt')
const cmd = require('../lib/cmd-base');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');
// const { directorySchema } = require('../../schemas');
const security = require('../lib/gestalt/securityclient');

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

    'directory': {
        definition: 'Target directory name',
        required: true
    },

    group: {
        definition: 'Target group name',
        required: true
    }
}

exports.handler = cmd.handler(async function (argv) {
    const fqon = argv.org;
    const directoryName = argv['directory'];
    const groupName = argv.group;

    out(`Loading account-store spec from file ${argv.file}`);
    const spec = util.loadObjectFromFile(argv.file);

    // Query for directory Id
    const directories = await getDirectories(fqon);
    const directory = directories.find(d => d.name == directoryName);
    
    if (directory) {
        // Query for group
        const group = await getDirectoryGroup(directory.id, groupName);

        spec.accountStoreId = group.id;

        // Create account store based on group
        const response = await createAccountStore(fqon, spec);
        debug(response);
        out(`Created account store '${response.name}' (${response.id})`);
    } else {
        throw Error(`Directory with ID '${directoryId}' not found.`);
    }
});

async function getDirectories(fqon) {
    const directories = await security.GET(`/${fqon}/directories`);
    return directories;
}

async function getDirectoryGroup(directoryId, groupName) {
    const response = await security.GET(`/directories/${directoryId}/groups?name=${groupName}`);
    if (response.length != 1) {
        throw Error('Expected exactly one result. response.length = ' + response.length);
    }
    return response[0];
}

async function createAccountStore(fqon, spec) {
    // const spec = {
    //     name: `${fqon}-mapping`,
    //     description: `mapping for ${fqon} org and ${group.name} group`,
    //     accountStoreId: group.name,
    //     storeType: 'GROUP',
    //     isDefaultAccountStore: false,
    //     isDefaultGroupStore: false
    // };

    // directorySchema.validateSync(spec);

    const response = await security.POST(`/${fqon}/accountStores`, spec);
    return response;
}

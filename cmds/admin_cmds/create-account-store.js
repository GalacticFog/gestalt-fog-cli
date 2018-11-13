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
    directory: {
        definition: 'Target directory name',
    },
    group: {
        definition: 'Target group name',
    }
}

exports.handler = cmd.handler(async function (argv) {
    const fqon = argv.org;

    out(`Loading account-store spec from file ${argv.file}`);
    const spec = util.loadObjectFromFile(argv.file);

    if (!spec.name) throw Error(`Missing spec.name`);
    if (!spec.description) throw Error(`Missing spec.description`);
    if (!spec.storeType) throw Error(`Missing spec.storeType`);
    if (!spec.isDefaultAccountStore == undefined) throw Error(`Missing spec.isDefaultAccountStore`);
    if (!spec.isDefaultGroupStore == undefined) throw Error(`Missing spec.isDefaultGroupStore`);

    if (!spec.accountStoreId) {
        if (!argv.directory) throw Error(`Argument '--directory' required when 'accountStoreId' field is not present`);

        const directoryName = argv.directory;

        // Query for directory Id
        const directories = await getDirectories(fqon);
        const directory = directories.find(d => d.name == directoryName);

        if (!directory) throw Error(`Directory with ID '${directoryId}' not found.`);
        
        if (spec.storeType == 'GROUP') {
            if (!argv.group) throw Error(`Argument '--group' required when account store is of type group`)
            // Query for group
            const group = await getDirectoryGroup(directory.id, groupName);
            if (!group) throw Error(`Group ${groupName} not found in directory ${directory.name} (${directory.id})`);
            spec.accountStoreId = group.id;
        } else if (spec.storeType == 'DIRECTORY') {
            spec.accountStoreId = directory.id;
        }
    }

    const response = await createAccountStore(fqon, spec);
    debug(response);
    out(`Created account store '${response.name}' (${response.id})`);
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

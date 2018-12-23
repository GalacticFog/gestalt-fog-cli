const cmd = require('../lib/cmd-base');
const { security } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui')

exports.command = 'show-directory-accounts [name]';
exports.description = 'Show LDAP directories';
exports.builder = {
    org: {
        definition: 'Org to search directories',
        required: true
    },
    name: {
        definition: 'Directory name',
        required: true
    },
    raw: {
        definition: 'Display raw output'
    }
}

exports.handler = cmd.handler(async function (argv) {
    const fqon = argv.org;
    const name = argv.name;

    const directories = await security.GET(`/${fqon}/directories`);
    const directory = directories.find(d => d.name == name);

    if (directory) {
        // Fetch groups
        const groups = await security.GET(`/directories/${directory.id}/accounts`);
        ui.displayResources(groups, argv);
    } else {
        throw Error(`No directory found with name '${name}'`);
    }
});

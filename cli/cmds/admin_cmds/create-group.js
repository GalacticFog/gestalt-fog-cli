const cmd = require('../lib/cmd-base');
const { gestalt } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui')

exports.command = 'create-group [name] [description]';
exports.description = 'Create group';
exports.builder = {
    name: {
        description: 'Group name'
    },
    description: {
        description: 'Group description'
    }
}

exports.handler = cmd.handler(async function (argv) {
    const spec = {
        name: argv.name,
        description: argv.description
    }
    const response = await gestalt.createGroup(spec);
    ui.displayResources(response, argv);
});

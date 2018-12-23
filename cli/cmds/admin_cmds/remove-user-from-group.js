const cmd = require('../lib/cmd-base');
const { gestalt } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui')

exports.command = 'remove-user-from-group [user] [group]';
exports.description = 'Remove user from group';
exports.builder = {
    user: {
        description: 'User name',
        required: true
    },
    group: {
        description: 'Group name',
        required: true
    }
}

exports.handler = cmd.handler(async function (argv) {
    const users = await gestalt.fetchUsers();
    const groups = await gestalt.fetchGroups();

    const user = users.find(u => u.name == argv.user);
    if (!user) throw Error(`User '${argv.user}' not found`);

    const group = groups.find(g => g.name == argv.group);
    if (!group) throw Error(`Group '${argv.group}' not found`);

    const response = await gestalt.removeUserFromGroup(group, user);
    ui.displayResources(response, argv);
});

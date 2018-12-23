const {
    addUserToGroup,
    removeUserFromGroup,
    createGroup,
    fetchGroups
} = require('../group');

const {
    fetchUsers
} = require('../user');

module.exports = {
    applyFogGroupMembership,
}

async function applyFogGroupMembership(spec, context) {

    // Get groups to build a model from
    let groups = await fetchGroups();

    // Build a model of group and user names
    const model = {};
    for (let group of groups) {
        model[group.name] = group.properties.users.map(u => u.name);
    }

    // To store items to action on
    const groupsToAdd = [];
    const usersToAdd = [];
    const usersToRemove = [];

    // Iterate through spec's groups, find out which ones are missing in the model
    for (let item of spec.groups) {
        const group = item.name;
        const users = item.members || [];

        // Check if group needs to be added
        if (!model[group]) {
            groupsToAdd.push({
                name: group,
                description: item.description
            });
            model[group] = [];
        }

        // Users to add
        for (let user of users) {
            if (!model[group].includes(user)) {
                usersToAdd.push({
                    group: group,
                    user: user
                });
            }
        }
    }

    // Iterate through the mode, find out which groups are missing from the spec
    for (let group of Object.keys(model)) {

        const item = spec.groups.find(i => i.name == group);
        if (item) {
            item.members = item.members || [];

            // Users to remove
            for (let user of model[group]) {
                if (!item.members.includes(user)) {
                    usersToRemove.push({
                        group: group,
                        user: user
                    });
                }
            }
        } else {
            console.error(`Warning: group '${group}' not found in group members`);
        }
    }

    if (groupsToAdd.length > 0) {
        for (let groupSpec of groupsToAdd) {
            console.log(`Adding group ${groupSpec.name}`)
            const resp = await createGroup(groupSpec);
        }
        // refresh groups
        groups = await fetchGroups();
    }

    const users = await fetchUsers();

    for (let item of usersToAdd) {
        const user = users.find(u => u.name == item.user);
        if (!user) throw Error(`User '${argv.user}' not found`);

        const group = groups.find(g => g.name == item.group);
        if (!group) throw Error(`Group '${argv.group}' not found`);

        console.log(`Adding user '${user.name}' to group '${group.name}'`);
        const resp = await addUserToGroup(group, user);
    }

    for (let item of usersToRemove) {
        const user = users.find(u => u.name == item.user);
        if (!user) throw Error(`User '${argv.user}' not found`);

        const group = groups.find(g => g.name == item.group);
        if (!group) throw Error(`Group '${argv.group}' not found`);

        console.log(`Removing user '${user.name}' from group '${group.name}'`);
        const resp = await removeUserFromGroup(group, user);
    }

    return {
        status: `updated`,
        message: 'OK',
        resource: {}
    };
}

const cmd = require('../lib/cmd-base');
const gestalt = require('../lib/gestalt')
exports.command = 'group-members';
exports.desc = 'List group members';
exports.builder = {};
exports.handler = cmd.handler(async function (argv) {

    function sortBy(arr, key) {
        return arr.sort((a, b) => {
            if (a[key] < b[key]) { return -1; }
            if (a[key] > b[key]) { return 1; }
            return 0;
        })
    }

    let resources = await gestalt.fetchGroups();

    resources = sortBy(resources, 'name');

    const model = {};
    for (let group of resources) {
        model[group.name] = group.properties.users.map(u => u.name);
    }

    if (argv.raw) {
        console.log(JSON.stringify(model, null, 2));
    } else {
        for (let key of Object.keys(model)) {
            console.log(key + ":");
            for (let user of model[key]) {
                console.log(` - ${user}`);
            }
            console.log();
        }
    }
});
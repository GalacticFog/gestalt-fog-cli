const cmd = require('../lib/cmd-base');
const gestalt = require('../lib/gestalt')
const chalk = require('../lib/chalk')
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

    console.log();
    for (let group of resources) {
        group.properties.users = sortBy(group.properties.users, 'name');

        console.log(chalk.underline(group.name));
        console.log();
        for (let user of group.properties.users) {
            console.log("    " + user.name);
        }
        console.log();
    }
});
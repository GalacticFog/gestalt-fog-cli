const { gestalt } = require('gestalt-fog-sdk')
const cmd = require('../lib/cmd-base');
exports.command = 'group [name]'
exports.desc = 'Delete group'
exports.builder = {
    force: {
        desc: "Force delete",
        required: false
    }
}
exports.handler = cmd.handler(async function (argv) {
    const groups = await gestalt.fetchGroups();
    const group = groups.find(g => g.name == argv.name);
    if (!group) throw Error(`Group '${argv.name}' not found`);
    const response = await gestalt.deleteGroup(group, { force: argv.force });
    console.log(`Group '${group.name}' deleted.`);
});

const gestalt = require('../lib/gestalt')
const cmd = require('../lib/cmd-base');
exports.command = 'user [name]'
exports.desc = 'Delete user'
exports.builder = {
    force: {
        desc: "Force delete",
        required: false
    }
}
exports.handler = cmd.handler(async function (argv) {
    const users = await gestalt.fetchUsers();
    const user = users.find(u => u.name == argv.name);
    if (!user) throw Error(`User '${argv.name}' not found`);
    const response = await gestalt.deleteUser(user, { force: argv.force });
    console.log(`User '${user.name}' deleted.`);
});

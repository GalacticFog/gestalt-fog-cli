const gestalt = require('../lib/gestalt')
const cmd = require('../lib/cmd-base');
exports.command = 'org [fqon]'
exports.desc = 'Delete org'
exports.builder = {
    force: {
        desc: "Force delete",
        required: false
    }
}
exports.handler = cmd.handler(async function (argv) {
    const response = await gestalt.deleteOrg(argv.fqon, { force: argv.force });
    console.log(`Org '${argv.fqon}' deleted.`);
});

const gestalt = require('../lib/gestalt')
const cmd = require('../lib/cmd-base');
exports.command = 'environment [context_path]'
exports.desc = 'Delete environment'
exports.builder = {
    force: {
        desc: "Force delete",
        required: false
    }
}
exports.handler = cmd.handler(async function (argv) {
    const context = await cmd.resolveContextPath(argv.context_path);
    const response = await gestalt.deleteEnvironment(context, { force: argv.force });
    console.log(`Environment '${context.environment.name}' deleted.`);
});

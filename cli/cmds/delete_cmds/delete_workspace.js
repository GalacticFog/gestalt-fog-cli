const { gestalt } = require('gestalt-fog-sdk')
const cmd = require('../lib/cmd-base');
exports.command = 'workspace [context_path]'
exports.desc = 'Delete workspace'
exports.builder = {
    force: {
        desc: "Force delete",
        required: false
    }
}
exports.handler = cmd.handler(async function (argv) {
    const context = await cmd.resolveContextPath(argv.context_path);
    const response = await gestalt.deleteWorkspace(context, { force: argv.force });
    console.log(`Workspace '${context.workspace.name}' deleted.`);
});

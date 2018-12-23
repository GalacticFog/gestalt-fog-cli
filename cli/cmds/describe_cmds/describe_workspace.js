const { gestalt } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui');
const cmd = require('../lib/cmd-base');
exports.command = 'workspace' // TODO: workspace [name]
exports.desc = 'Describe workspace'
exports.builder = {
    raw: {
        description: 'Raw output'
    },
}
exports.handler = cmd.handler(async function (argv) {

    const context = await ui.resolveWorkspace();

    const ws = await gestalt.fetchWorkspace(context);

    ui.displayResources(ws, argv);
});
const cmd = require('../lib/cmd-base');
exports.command = 'workspace'
exports.desc = 'Change workspace'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const selectHierarchy = require('../lib/selectHierarchy');

    selectHierarchy.displayContext();
    await selectHierarchy.chooseWorkspace();
    selectHierarchy.displayContext();
});
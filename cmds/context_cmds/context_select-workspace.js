const cmd = require('../lib/cmd-base');
exports.command = 'select-workspace'
exports.desc = 'Change workspace'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const selectHierarchy = require('../lib/selectHierarchy');

    selectHierarchy.displayContext();
    await selectHierarchy.chooseWorkspace();
    selectHierarchy.displayContext();
});
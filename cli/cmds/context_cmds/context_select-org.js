const cmd = require('../lib/cmd-base');
exports.command = 'select-org'
exports.desc = 'Change org'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const selectHierarchy = require('../lib/selectHierarchy');

    selectHierarchy.displayContext();
    await selectHierarchy.chooseOrg();
    selectHierarchy.displayContext();
});
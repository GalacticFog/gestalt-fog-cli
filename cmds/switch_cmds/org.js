const cmd = require('../lib/cmd-base');
exports.command = 'org'
exports.desc = 'Change org'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const selectHierarchy = require('../lib/selectHierarchy');

    selectHierarchy.displayContext();
    selectHierarchy.chooseOrg(() => {
        selectHierarchy.displayContext();
    });
});
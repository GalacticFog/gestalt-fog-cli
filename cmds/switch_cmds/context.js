const cmd = require('../lib/cmd-base');
exports.command = 'context'
exports.desc = 'Change context'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const selectHierarchy = require('../lib/selectHierarchy');

    selectHierarchy.displayContext();
    selectHierarchy.chooseContext(result => {
        selectHierarchy.displayContext();
    });
});
const cmd = require('../lib/cmd-base');
exports.command = 'environment'
exports.desc = 'Change environment'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const selectHierarchy = require('../lib/selectHierarchy');

    selectHierarchy.displayContext();
    selectHierarchy.chooseEnvironment(result => {
        selectHierarchy.displayContext();
    });
});
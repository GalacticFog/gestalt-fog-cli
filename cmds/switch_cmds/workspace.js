exports.command = 'workspace'
exports.desc = 'Change workspace'
exports.builder = {}
exports.handler = function (argv) {
    const selectHierarchy = require('../lib/selectHierarchy');

    try {
        selectHierarchy.displayContext();
        selectHierarchy.chooseWorkspace((result) => {
            selectHierarchy.displayContext();
        });
    } catch (err) {
        console.log(err);
        console.log("Try running 'change-context'");
        console.log();
    }
}
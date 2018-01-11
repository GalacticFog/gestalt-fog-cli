exports.command = 'environment'
exports.desc = 'Change environment'
exports.builder = {}
exports.handler = function (argv) {
    const selectHierarchy = require('../lib/selectHierarchy');

    try {
        selectHierarchy.displayContext();
        selectHierarchy.chooseEnvironment(result => {
            selectHierarchy.displayContext();
        });
    } catch (err) {
        console.log(err.message);
        console.log("Try running 'change-context'");
        console.log();
    }
}
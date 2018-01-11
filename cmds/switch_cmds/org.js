exports.command = 'org'
exports.desc = 'Change org'
exports.builder = {}
exports.handler = function (argv) {
    const selectHierarchy = require('../lib/selectHierarchy');

    try {
        selectHierarchy.displayContext();
        selectHierarchy.chooseOrg(() => {
            selectHierarchy.displayContext();
        });
    } catch (err) {
        console.log(err.message);
        console.log("Try running 'change-context'");
        console.log();
    }
}
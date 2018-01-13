exports.command = 'context'
exports.desc = 'Change context'
exports.builder = {}
exports.handler = function (argv) {
    const selectHierarchy = require('../lib/selectHierarchy');

    selectHierarchy.displayContext();
    selectHierarchy.chooseContext(result => {
        selectHierarchy.displayContext();
    });
}
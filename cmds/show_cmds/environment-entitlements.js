exports.command = 'environment-entitlements'
exports.desc = 'Show environment entitlements'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayEntitlements = require('../lib/displayEntitlements');
    const selectHierarchy = require('../lib/selectHierarchy');

    try {
        selectHierarchy.resolveEnvironment(() => {
            const resources = gestalt.fetchEnvironmentEntitlements();
            displayEntitlements.run(resources);
        });
    } catch (err) {
        console.log(err.message);
        console.log("Try running 'change-context'");
        console.log();
    }
}
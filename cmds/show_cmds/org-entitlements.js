exports.command = 'org-entitlements'
exports.desc = 'Show org entitlements'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayEntitlements = require('../lib/displayEntitlements');
    const selectHierarchy = require('../lib/selectHierarchy');

    try {
        selectHierarchy.resolveOrg(() => {
            const resources = gestalt.fetchOrgEntitlements();
            displayEntitlements.run(resources);
        });
    } catch (err) {
        console.log(err.message);
        console.log("Try running 'change-context'");
        console.log();
    }
}
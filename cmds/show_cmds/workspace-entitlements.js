exports.command = 'workspace-entitlements'
exports.desc = 'Show workspace entitlements'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayEntitlements = require('../lib/displayEntitlements');
    const selectHierarchy = require('../lib/selectHierarchy');

    try {
        selectHierarchy.resolveWorkspace(() => {
            const resources = gestalt.fetchWorkspaceEntitlements();

            displayEntitlements.run(resources);
        });
    } catch (err) {
        console.log(err.message);
        console.log("Try running 'change-context'");
        console.log();
    }
}
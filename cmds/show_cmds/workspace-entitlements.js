exports.command = 'workspace-entitlements'
exports.desc = 'Show workspace entitlements'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayEntitlements = require('../lib/displayEntitlements');
    const selectHierarchy = require('../lib/selectHierarchy');

    main();

    async function main() {
        await selectHierarchy.resolveWorkspace();
        const resources = await gestalt.fetchWorkspaceEntitlements();
        displayEntitlements.run(resources);
    }
}
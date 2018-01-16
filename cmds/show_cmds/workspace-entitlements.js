const cmd = require('../lib/cmd-base');
exports.command = 'workspace-entitlements'
exports.desc = 'Show workspace entitlements'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayEntitlements = require('../lib/displayEntitlements');
    const selectHierarchy = require('../lib/selectHierarchy');

    await selectHierarchy.resolveWorkspace();
    const resources = await gestalt.fetchWorkspaceEntitlements();
    displayEntitlements.run(resources);
});
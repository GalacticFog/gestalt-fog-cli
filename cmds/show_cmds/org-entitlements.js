const cmd = require('../lib/cmd-base');
exports.command = 'org-entitlements'
exports.desc = 'Show org entitlements'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayEntitlements = require('../lib/displayEntitlements');
    const selectHierarchy = require('../lib/selectHierarchy');

    await selectHierarchy.resolveOrg();
    const resources = await gestalt.fetchOrgEntitlements();
    displayEntitlements.run(resources);
});
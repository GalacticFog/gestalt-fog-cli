exports.command = 'org-entitlements'
exports.desc = 'Show org entitlements'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayEntitlements = require('../lib/displayEntitlements');
    const selectHierarchy = require('../lib/selectHierarchy');

    main();

    async function main() {
        await selectHierarchy.resolveOrg();
        const resources = await gestalt.fetchOrgEntitlements();
        displayEntitlements.run(resources);
    }
}
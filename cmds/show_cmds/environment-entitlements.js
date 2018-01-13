exports.command = 'environment-entitlements'
exports.desc = 'Show environment entitlements'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayEntitlements = require('../lib/displayEntitlements');
    const selectHierarchy = require('../lib/selectHierarchy');

    main();

    async function main() {
        await selectHierarchy.resolveEnvironment();
        const resources = await gestalt.fetchEnvironmentEntitlements();
        displayEntitlements.run(resources);
    }
}
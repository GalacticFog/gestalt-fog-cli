const cmd = require('../lib/cmd-base');
exports.command = 'environment-entitlements'
exports.desc = 'Show environment entitlements'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayEntitlements = require('../lib/displayEntitlements');
    const selectHierarchy = require('../lib/selectHierarchy');

    await selectHierarchy.resolveEnvironment();
    const resources = await gestalt.fetchEnvironmentEntitlements();
    displayEntitlements.run(resources);
});
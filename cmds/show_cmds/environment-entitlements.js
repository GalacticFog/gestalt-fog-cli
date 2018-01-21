const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'environment-entitlements'
exports.desc = 'Show environment entitlements'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const state = await ui.resolveEnvironment();
    const resources = await gestalt.fetchEnvironmentEntitlements(state);
    ui.displayEntitlements(resources);
});
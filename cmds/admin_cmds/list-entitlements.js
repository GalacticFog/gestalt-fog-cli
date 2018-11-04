const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const yaml = require('js-yaml');

exports.command = 'list-entitlements [context_path]'
exports.desc = 'List entitlement actions at the specified context'
exports.builder = {}

exports.handler = cmd.handler(async function (argv) {

    const context = await cmd.getContextFromPathOrPrompt(argv.context_path);

    console.error(ui.getContextString(context));
    console.error();

    const resources = await gestalt.fetchEntitlements(context);
    const actions = resources.map(e => e.properties.action);
    actions.sort();
    if (argv.yaml) {
        console.log(yaml.safeDump(actions));
    } else {
        console.log(JSON.stringify(actions, null, 2));
    }
});

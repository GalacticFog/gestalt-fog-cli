const gestalt = require('../lib/gestalt');
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const selectHierarchy = require('../lib/selectHierarchy');
const { debug } = require('../lib/debug');
exports.command = 'policy-rules <name>'
exports.desc = 'List policy rules'
exports.builder = {
    raw: {
        description: 'Show in raw JSON format'
    }
}

exports.handler = cmd.handler(async function (argv) {

    const policyName = argv.name;

    debug('Policy name: ' + policyName)

    let context = null;
    if (argv.path) {
        context = await cmd.resolveContextPath(argv.path);
    } else {
        // No arguments, allow choosing interatively
        context = await selectHierarchy.chooseContext({ includeNoSelection: true });
    }

    if (context) {
        debug(context)
        const rules = await gestalt.fetchPolicyRules(context, { name: policyName });
        ui.displayResources(rules, argv, context);
    }
});

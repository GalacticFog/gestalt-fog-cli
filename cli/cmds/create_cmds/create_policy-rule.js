const { gestalt, renderResourceTemplate, gestaltContext } = require('gestalt-fog-sdk')
const cmd = require('../lib/cmd-base');
const ui = require('../lib/gestalt-ui');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');

exports.command = 'policy-rule';
exports.description = 'Create policy rule';
exports.builder = {
    file: {
        alias: 'f',
        description: 'resource definition file',
        required: true
    },
    config: {
        description: 'config file'
    },
    context: {
        description: "Target context path for resource creation. Overrides the current context if specified",
    }
}
exports.handler = cmd.handler(async function (argv) {

    let context = null;
    if (argv.context) {
        context = await cmd.resolveContextPath(argv.context);
    } else {
        context = gestaltContext.getContext();
    }

    console.log('Using context: ' + ui.getContextString(context));

    // Include policy in context
    context.policy = await cmd.lookupEnvironmentResource('policies', argv.policy, context);

    let config = {};

    if (argv.config) {
        debug(`Loading config from file ${argv.config}`);
        config = util.loadObjectFromFile(argv.config);
    }

    const resourceSpec = await renderResourceTemplate(argv.file, config, context);

    debug(`Finished processing resource template.`)

    const resource = await gestalt.createPolicyRule(resourceSpec, context);

    debug(resource);
    out(`Created resource '${resource.name}' (${resource.resource_type}).`);
});

const gestalt = require('../lib/gestalt')
const gestaltContext = require('../lib/gestalt-context')
const cmd = require('../lib/cmd-base');
const ui = require('../lib/gestalt-ui');
const { renderResourceTemplate } = require('../lib/template-resolver');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');
const yaml = require('js-yaml');

exports.command = 'resource [name]';
exports.description = 'Create resource';
exports.builder = {
    file: {
        alias: 'f',
        description: 'resource definition file',
        required: true
    },
    config: {
        description: 'config file'
    },
    name: {
        description: 'resource name (overrides name in resource file)'
    },
    description: {
        description: 'resource description (overrides description in resource file)'
    },
    provider: {
        description: 'resource provider (sets .properties.provider value)'
    },
    context: {
        description: "Target context path for resource creation. Overrides the current context if specified"
    },
    'render-only': {
        description: 'Render only'
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

    let config = {};

    if (argv.config) {
        debug(`Loading config from file ${argv.config}`);
        config = util.loadObjectFromFile(argv.config);
    }

    const resourceSpec = await renderResourceTemplate(argv.file, config, context);

    debug(`Finished processing resource template.`)

    // Override resource name if specified
    if (argv.name) resourceSpec.name = argv.name;
    if (argv.description) resourceSpec.description = argv.description;

    // special case for provider
    if (argv.provider) {
        // Resolve provider by name
        const provider = await cmd.resolveProvider(argv.provider);

        // Build provider spec
        resourceSpec.properties.provider = {
            id: provider.id,
            locations: []
        };
    }

    if (argv['render-only']) {
        if (argv['render-only'] == 'yaml') {
            console.log(yaml.dump(resourceSpec));
        } else {
            console.log(JSON.stringify(resourceSpec, null, 2));
        }
    } else {
        const resource = await gestalt.createResource(resourceSpec, context);

        debug(resource);
        out(`Created resource '${resource.name}' (${resource.resource_type}).`);
    }
});

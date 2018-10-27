const gestalt = require('../lib/gestalt')
const gestaltContext = require('../lib/gestalt-context')
const cmd = require('../lib/cmd-base');
const ui = require('../lib/gestalt-ui');
const { renderResourceTemplate } = require('../lib/template-resolver');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');

exports.command = 'resources [files...]';
exports.description = 'Create resources';
exports.builder = {
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

    let config = {};

    if (argv.config) {
        debug(`Loading config from file ${argv.config}`);
        config = util.loadObjectFromFile(argv.config);
    }

    const specs = {}

    // Render all templates into specs
    for (file of argv.files) {
        out(`Loading template from file ${file}`);
        const resourceTemplate = util.loadObjectFromFile(file);
        const resourceSpec = await renderResourceTemplate(resourceTemplate, config, context);

        specs[file] = resourceSpec;
    }
    debug(`Finished processing resource templates.`)

    for (key of Object.keys(specs)) {
        const resourceSpec = specs[key];
        console.log(`Creating resource from rendered '${key}'...`)
        const resource = await gestalt.createResource(resourceSpec, context);
        debug(resource);
        out(`Created resource '${resource.name}' (${resource.resource_type}) from '${key}'.`);
        console.log();
    }
    console.log('Completed.');
});

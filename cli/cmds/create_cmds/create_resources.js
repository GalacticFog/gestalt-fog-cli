const { gestalt, renderResourceTemplate, gestaltSession } = require('gestalt-fog-sdk')
const cmd = require('../lib/cmd-base');
const ui = require('../lib/gestalt-ui');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');
const chalk = require('../lib/chalk');

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
    if (argv.manifest && argv.files) {
        throw Error('Can only specify one of files or manifest');
    } else if (argv.manifest) {

        // Manifest mode
        processManifest(argv);
    } else {

        // Files mode
        processFiles(argv);
    }
});


//
// Manifest mode
//
async function processManifest(argv) {

    const manifest = util.loadObjectFromFile(argv.manifest);

    // Validate phases (TODO - use yup schema)
    if (!manifest.phases) throw Error(`Missing manifest.phases`);
    for (let phase of manifest.phases) {
        if (!phase.namme) throw Error('Missing phase.name');
        if (!phase.files) throw Error(`Missing files for phase '${phase.name}'`);
    }

    const globalContext = await cmd.resolveContextPath(manifest.context);
    let globalConfig = {};
    if (manifest.config) {
        console.log(`Loading config from ${manifest.config}`);
        util.loadObjectFromFile(manifest.config);
    }

    for (let phase of manifest.phases) {
        const context = phase.context ? await cmd.resolveContextPath(phase.context) : globalContext;
        let config = globalConfig;
        if (phase.config) {
            config = Object.apply(util.loadObjectFromFile(phase.config), config);
        }
        console.log(chalk.bold(`=> Processing phase '${phase.name}'`));
        processPhase(context, config, phase.files);
    }
}

//
// Explicit files mode
//
async function processFiles(argv) {
    let context = null;
    if (argv.context) {
        context = await cmd.resolveContextPath(argv.context);
    } else {
        context = gestaltSession.getContext();
    }

    console.log('Using context: ' + ui.getContextString(context));

    let config = {};

    if (argv.config) {
        debug(`Loading config from file ${argv.config}`);
        config = util.loadObjectFromFile(argv.config);
    }

    processPhase(context, config, argv.files);
}

async function processPhase(context, config, files) {
    console.log('Using context: ' + ui.getContextString(context));

    const specs = {}

    // Render all templates into specs
    for (file of files) {
        out(`Loading template from file ${file}`);
        const resourceSpec = await renderResourceTemplate(file, config, context);

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
}
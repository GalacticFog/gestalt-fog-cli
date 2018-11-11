const gestalt = require('./lib/gestalt')
const gestaltContext = require('./lib/gestalt-context')
const cmd = require('./lib/cmd-base');
const ui = require('./lib/gestalt-ui');
const { renderResourceTemplate } = require('./lib/template-resolver');
const out = console.log;
const util = require('./lib/util');
const { debug } = require('./lib/debug');
const yaml = require('js-yaml');
const fs = require('fs');
const chalk = require('./lib/chalk');
const jsonPatch = require('fast-json-patch');
exports.command = 'apply';
exports.description = 'Apply resource';
exports.builder = {
    file: {
        alias: 'f',
        description: 'resource definition file',
    },
    directory: {
        alias: 'd',
        description: 'resource definitions directory',
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
        // Use context from the command line
        context = await cmd.resolveContextPath(argv.context);
    } else {
        // look for a special file
        if (argv.directory && fs.existsSync(`${argv.directory}/context`)) {
            const contextFile = `${argv.directory}/context`;
            const contextPath = util.readFileAsText(contextFile);
            console.log('CONTEXT PATH: ' + contextPath)
            context = await cmd.resolveContextPath(contextPath);
        } else {
            // Use saved context
            context = gestaltContext.getContext();
        }
    }

    console.log('Using context: ' + ui.getContextString(context));

    let config = {};
    if (argv.config) {
        debug(`Loading config from file ${argv.config}`);
        config = util.loadObjectFromFile(argv.config);
    }

    if (argv.file && argv.directory) {
        throw Error(`Can't specify both --file and --directory`);
    } else if (argv.file) {
        await processFile(argv.file, argv, config, context);
    } else if (argv.directory) {
        if (argv.description) throw Error(`Can't specify --description with --directory`);
        if (argv.name) throw Error(`Can't specify --description with --name`);

        // Read files from target directory, and filter for JSON and YAML
        let files = fs.readdirSync(argv.directory);
        files = files.filter(f => {
            return (f.endsWith('.json') || f.endsWith('.yaml')) ? true : false;
        })

        // Load files into resources
        const filesAndResources = files.map(f => {
            return {
                file: argv.directory + '/' + f,
                resource: util.loadObjectFromFile(argv.directory + '/' + f)
            };
        })

        // Prioritize resources by type
        const groups = prioritize(filesAndResources);

        debug(`Processing groups in this order:`);
        for (let group of groups) {
            debug(`  ${group.type}`);
        }

        // Display plan
        console.error(`Deployment plan:`)
        for (let group of groups) {
            console.error(`  ${group.type}`);
            for (let item of group.items) {
                console.error(`    ${item.file}`);
            }
            console.error();
        }

        // Process groups
        for (let group of groups) {
            for (let item of group.items) {
                try {
                    await processFile(item.file, argv, config, context);
                } catch (err) {
                    console.error(chalk.red(err));
                }
            }
        }
    } else {
        throw Error('--file or --directory parameter required');
    }
});

function prioritize(filesAndResources) {
    const resourceOrder = [
        // Hierarchy first
        'Gestalt::Resource::Organization',
        'Gestalt::Resource::Workspace',
        'Gestalt::Resource::Environment',

        // Providers next
        'Gestalt::Configuration::Provider',

        // Next, resources that don't depend on other resources (except providers)
        'Gestalt::Resource::Api',
        'Gestalt::Resource::Container',
        'Gestalt::Resource::Node::Lambda',
        'Gestalt::Resource::Policy',

        // Next, resources that depend on other resources
        'Gestalt::Resource::ApiEndpoint', // Depends on API and Container or Lambda
        'Gestalt::Resource::Rule', // Depends on Policy
    ];

    const groups = {};

    // Break into groups
    for (let item of filesAndResources) {
        let resource = item.resource;
        if (!resource.resource_type) {
            console.error(`Will not process ${item.file}, no resource_type found`);
        } else {

            let key = null;
            if (resource.resource_type.indexOf("Gestalt::Configuration::Provider::") == 0) {
                key = 'Gestalt::Configuration::Provider';
            } else {
                key = resource.resource_type;
            }

            groups[key] = groups[key] || {
                type: key,
                items: []
            };
            groups[key].items.push(item);
        }
    }

    const sorted = [];

    // Ensure the correct order for the specified resource types
    for (let key of resourceOrder) {
        if (groups[key]) {
            sortBy(groups[key].items, 'file');  // sorts in place
            sorted.push(groups[key]);
            delete groups[key];
        }
    }

    // Append the rest of types not specified in the resource ordering
    for (let key of Object.keys(groups)) {
        sortBy(groups[key].items, 'file');  // sorts in place
        sorted.push(groups[key]);
    }

    return sorted;
}

function sortBy(arr, key) {
    return arr.sort((a, b) => {
        if (a == null) return 1;
        if (b == null) return -1;
        if (a[key] < b[key]) { return -1; }
        if (a[key] > b[key]) { return 1; }
        return 0;
    })
}

async function processFile(file, params, config, context) {

    const resourceSpec = await renderResourceTemplate(file, config, context);

    debug(`Finished processing resource template.`)

    // Override resource name if specified
    if (params.name) resourceSpec.name = params.name;
    if (params.description) resourceSpec.description = params.description;

    // special case for provider
    if (params.provider) {
        // Resolve provider by name
        const provider = await cmd.resolveProvider(params.provider);

        // Build provider spec
        resourceSpec.properties.provider = {
            id: provider.id,
            locations: []
        };
    }

    if (params['render-only']) {
        if (params['render-only'] == 'yaml') {
            console.log(yaml.dump(resourceSpec));
        } else {
            console.log(JSON.stringify(resourceSpec, null, 2));
        }
    } else {
        const result = await gestalt.applyResource(resourceSpec, context);
        console.log(result.status);
    }
}

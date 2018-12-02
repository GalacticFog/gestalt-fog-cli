const gestalt = require('./lib/gestalt')
const gestaltContext = require('./lib/gestalt-context')
const cmd = require('./lib/cmd-base');
const ui = require('./lib/gestalt-ui');
const { renderResourceTemplate } = require('./lib/template-resolver');
const util = require('./lib/util');
const { debug } = require('./lib/debug');
const yaml = require('js-yaml');
const fs = require('fs');
const chalk = require('./lib/chalk');
const path = require('path');
exports.command = 'apply [context]';
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
    params: {
        type: 'array',
        description: 'config params'
    },
    'ignore-config': {
        description: 'Ignore config file if present'
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
    'ignore-context': {
        description: 'Ignore context file if present'
    },
    'render-only': {
        description: 'Render only'
    },
    //TODO: 'add-only': {
    //     description: 'Only add resources, don\'t update existing resources'
    // }
}
exports.handler = cmd.handler(async function (argv) {

    if (argv.file && argv.directory) {
        throw Error(`Can't specify both --file and --directory`);
    } else if (!argv.file && !argv.directory) {
        throw Error(`Must specify one of --file or --directory`);
    }

    const context = await obtainContext(argv);
    console.error('Using context: ' + ui.getContextString(context));

    const config = obtainConfig(argv);
    debug('Using config: ' + JSON.stringify(config, null, 2));

    if (argv.file && argv.directory) {
        throw Error(`Can't specify both --file and --directory`);
    } else if (argv.file) {
        const result = await processFile(argv.file, argv, config, context);
        console.error(result.status);
    } else if (argv.directory) {
        if (argv.description) throw Error(`Can't specify --description with --directory`);
        if (argv.name) throw Error(`Can't specify --description with --name`);

        // Read files from target directory, and filter for JSON and YAML
        let files = fs.readdirSync(argv.directory);
        files = files.filter(f => {
            return (f.endsWith('.json') || f.endsWith('.yaml')) ? true : false;
        })
        files = files.filter(f => {
            return (!f.startsWith('_'));
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
        console.error(chalk.dim.blue(`Deployment plan:`));
        for (let group of groups) {
            console.error(chalk.dim.blue(`  ${group.type}`));
            for (let item of group.items) {
                console.error(chalk.dim.blue(`    ${item.file}`));
            }
            console.error();
        }

        const succeeded = [];
        const failed = [];

        // Process groups
        for (let group of groups) {
            for (let item of group.items) {
                try {
                    const result = await processFile(item.file, argv, config, context);
                    console.error(result.status);
                    item.status = result.status;
                    succeeded.push(item);
                } catch (err) {
                    item.status = err;
                    console.error(chalk.red(err));
                    failed.push(item);
                }
            }
        }

        if (succeeded.length > 0) {
            console.error();
            console.error(`${succeeded.length} / ${succeeded.length + failed.length} succeeded:`)
            for (let item of succeeded) {
                console.error(`  ${item.status} (${item.file})`);
            }
        }
        if (failed.length > 0) {
            console.error();
            console.error(`${failed.length} / ${succeeded.length + failed.length} failed:`)
            for (let item of failed) {
                console.error(`  ${item.status} (${item.file})`);
            }
        }

        // Check for failures, return error if so
        if (failed.length > 0) {
            const message = `There were ${failed.length} failures during 'apply' (${succeeded.length} / ${succeeded.length + failed.length} resources succeeded)`;
            throw Error(message);
        }
    } else {
        throw Error('--file or --directory parameter required');
    }
});

async function obtainContext(argv) {
    let context = null;
    if (argv.context) {
        // Use context from the command line
        context = await cmd.resolveContextPath(argv.context);
    } else {
        if (argv['ignore-context']) {
            console.error('Ignoring context file (if present) due to --ignore-context');
        } else {

            const dir = argv.directory || path.dirname(argv.file)

            debug(`dir = ${dir}`);

            // look for a special file
            if (dir && fs.existsSync(`${dir}/context`)) {
                const contextFile = `${dir}/context`;
                const contextPath = util.readFileAsText(contextFile);
                console.error('CONTEXT PATH: ' + contextPath)
                context = await cmd.resolveContextPath(contextPath);
            }
        }
        // Default to saved context
        context = context || gestaltContext.getContext();
    }

    if (JSON.stringify(context) == '{}') console.error(`Warning: No default context found`);

    return context;
}

function obtainConfig(argv) {
    let config = {};
    if (argv.config) {
        debug(`Loading config from file ${argv.config}`);
        config = util.loadObjectFromFile(argv.config);
    } else {
        if (argv['ignore-config']) {
            console.error('Ignoring config file (if present) due to --ignore-config');
        } else {
            const dir = argv.directory || path.dirname(argv.file)

            debug(`dir = ${dir}`);

            // look for a special file
            if (dir && fs.existsSync(`${dir}/config`)) {
                const configFile = `${dir}/config`;
                config = util.loadObjectFromFile(configFile, 'yaml');
                console.error('Loaded config from: ' + configFile)
            }
        }
    }

    // Process params
    if (argv.params) {
        for (let a of argv.params) {
            const arg = a.split('=');
            if (arg[1] == undefined) {
                throw Error(`No value specified for '${arg[0]}', use '${arg[0]}=<value>'`)
            } else {
                config[arg[0]] = arg[1];
            }
        }
    }
    return config;
}

function prioritize(filesAndResources) {
    const resourceOrder = [
        // Hierarchy first
        'Gestalt::Resource::Organization',
        'Gestalt::Resource::Workspace',
        'Gestalt::Resource::Environment',

        // Users, groups
        'Gestalt::Resource::User',
        'Gestalt::Resource::Group',

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

async function processFile(file, params, config, defaultContext) {

    const resourceSpec = await renderResourceTemplate(file, config, defaultContext);

    debug(`Finished processing resource template.`)

    debug(`resourceSpec: ${JSON.stringify(resourceSpec)}`);

    const context = resourceSpec.contextPath ? await cmd.resolveContextPath(resourceSpec.contextPath) : defaultContext;

    delete resourceSpec.contextPath;

    debug(`Using context: ${JSON.stringify(context)}`);

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
        return gestalt.applyResource(resourceSpec, context);
    }
}

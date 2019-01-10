const { gestalt, renderResourceObject, renderResourceTemplate, actions, gestaltContext } = require('gestalt-fog-sdk')
const cmd = require('./lib/cmd-base');
const ui = require('./lib/gestalt-ui');
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
    'render-bundle': {
        description: 'Render bundle'
    },
    'delete': {
        description: 'Delete resources'
    },
    'force': {
        description: 'Force delete resources (use with --delete)'
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

    if (argv.force) {
        if (!argv.delete) throw Error(`Must specify --delete when using --force`);
    }

    const context = await obtainContext(argv);
    console.error('Using context: ' + ui.getContextString(context));

    const config = obtainConfig(argv);
    console.error('Using config: ' + JSON.stringify(config, null, 2));

    if (argv.file && argv.directory) {
        throw Error(`Can't specify both --file and --directory`);
    } else if (argv.file) {
        const result = await processFile(argv.file, argv, config, context);
        console.error(result.message);
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

        const resources = filesAndResources.map(item => item.resource);

        // Partially resolve resources (LambdaSources and Config settings)
        const partiallyResolvedResources = []
        for (let resource of resources) {
            resource = await renderResourceObject(resource, config, {}, {
                onlyPrebundle: true,
                bundleDirectory: argv.directory
            })
            partiallyResolvedResources.push(resource);
        }

        if (argv['render-bundle']) {
            const bundle = {
                context: context,
                config: config,
                options: JSON.parse(JSON.stringify(argv)),
                resources: partiallyResolvedResources
            }
            console.log(JSON.stringify(bundle, null, 2));
        } else {
            const { succeeded, failed } = await actions.applyResources(context, partiallyResolvedResources, argv, config);
            displaySummary(succeeded, failed);
        }
    } else {
        throw Error('--file or --directory parameter required');
    }
});

function displaySummary(succeeded, failed) {
    const totalSucceeded = succeeded.updated.length + succeeded.created.length + succeeded.unchanged.length;
    for (let cat of ['updated', 'created', 'unchanged']) {
        const arr = succeeded[cat];
        if (arr.length > 0) {
            console.error();
            console.error(chalk.green(`${arr.length} ${cat}:`))
            for (let item of arr) {
                console.error(chalk.green(`  ${item.message} (${item.name})`));
            }
        }
    }

    if (failed.length > 0) {
        console.error();
        console.error(chalk.red(`${failed.length}/${totalSucceeded + failed.length} failed:`))
        for (let item of failed) {
            console.error(chalk.red(`  ${item.message} (${item.name})`));
        }
    }

    // Check for failures, return error if so
    if (failed.length > 0) {
        const message = `There were ${failed.length} failures during 'apply' (${succeeded.length}/${succeeded.length + failed.length} resources succeeded)`;
        throw Error(message);
    }

    console.error();
    console.error(`Summary: ${totalSucceeded}/${totalSucceeded + failed.length} resources succeessfully applied, ${failed.length} failed to apply.`);
}

async function obtainContext(argv) {

    if (argv['render-bundle']) {
        console.error(`Skipping context resolution since --render-bundle specified`)
        return {};
    }

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

    if (JSON.stringify(context) == '{}') console.error(chalk.yellow(`Warning: No default context found`));

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

// function prioritize(filesAndResources) {
//     const resourceOrder = [
//         // Hierarchy first
//         'Gestalt::Resource::Organization',
//         'Gestalt::Resource::Workspace',
//         'Gestalt::Resource::Environment',

//         // Users, groups
//         'Gestalt::Resource::User',
//         'Gestalt::Resource::Group',

//         // Providers next
//         'Gestalt::Configuration::Provider',

//         // Next, resources that don't depend on other resources (except providers)
//         'Gestalt::Resource::Api',
//         'Gestalt::Resource::Container',
//         'Gestalt::Resource::Node::Lambda',
//         'Gestalt::Resource::Policy',

//         // Next, resources that depend on other resources
//         'Gestalt::Resource::ApiEndpoint', // Depends on API and Container or Lambda
//         'Gestalt::Resource::Rule', // Depends on Policy
//     ];

//     const groups = {};

//     // Break into groups
//     for (let item of filesAndResources) {
//         let resource = item.resource;
//         if (!resource.resource_type) {
//             console.error(chalk.yellow(`Warning: Will not process ${item.file}, no resource_type found`));
//         } else {

//             let key = null;
//             if (resource.resource_type.indexOf("Gestalt::Configuration::Provider::") == 0) {
//                 key = 'Gestalt::Configuration::Provider';
//             } else {
//                 key = resource.resource_type;
//             }

//             groups[key] = groups[key] || {
//                 type: key,
//                 items: []
//             };
//             groups[key].items.push(item);
//         }
//     }

//     const sorted = [];

//     // Ensure the correct order for the specified resource types
//     for (let key of resourceOrder) {
//         if (groups[key]) {
//             sortBy(groups[key].items, 'file');  // sorts in place
//             sorted.push(groups[key]);
//             delete groups[key];
//         }
//     }

//     // Append the rest of types not specified in the resource ordering
//     for (let key of Object.keys(groups)) {
//         sortBy(groups[key].items, 'file');  // sorts in place
//         sorted.push(groups[key]);
//     }

//     return sorted;
// }

// function sortBy(arr, key) {
//     return arr.sort((a, b) => {
//         if (a == null) return 1;
//         if (b == null) return -1;
//         if (a[key] < b[key]) { return -1; }
//         if (a[key] > b[key]) { return 1; }
//         return 0;
//     })
// }

async function processFile(file, params, config, defaultContext) {

    const resourceSpec = await renderResourceTemplate(file, config, defaultContext, { delete: params.delete });

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
        return gestalt.applyResource(resourceSpec, context, { delete: params.delete, force: params.force });
    }
}

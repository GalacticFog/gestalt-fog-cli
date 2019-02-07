const { gestalt, renderResourceObject, renderResourceTemplate, actions, gestaltContext } = require('gestalt-fog-sdk')
const cmd = require('./lib/cmd-base');
const ui = require('./lib/gestalt-ui');
const util = require('./lib/util');
const { debug } = require('./lib/debug');
const yaml = require('js-yaml');
const fs = require('fs');
const chalk = require('./lib/chalk');
const path = require('path');
const { applyResourcesFromDirectory } = require('./applyHelper');

exports.command = 'apply-recursive [context]';
exports.description = 'Apply resource';
exports.builder = {
    directory: {
        alias: 'd',
        description: 'resource definitions directory',
        required: true
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
        if (!argv.delete) {
            throw Error(`Must specify --delete when using --force`);
        }
    }

    const context = await obtainContext(argv);
    console.error('Using context: ' + ui.getContextString(context));
    debug(JSON.stringify(context, null, 2));

    const config = obtainConfig(argv);
    console.error('Using config: ' + JSON.stringify(config, null, 2));

    const results = await applyResourcesFromDirectory(argv.directory, {});

    // console.log(results);

    for (const dir in results) {

        console.log(chalk.bold('=> ' + dir));

        const result = results[dir];

        displaySummary(result.succeeded, result.failed);
    }
});



function displaySummary(succeeded, failed) {
    const totalSucceeded = succeeded.updated.length + succeeded.created.length + succeeded.unchanged.length;
    for (let cat of ['updated', 'created', 'unchanged', 'skipped']) {
        const arr = succeeded[cat];
        if (arr.length > 0) {
            console.error();
            console.error(chalk.green(`${arr.length} ${cat}:`))
            for (let item of arr) {
                if (cat == 'skipped') {
                    console.error(chalk.yellow(`  ${item.message} (${item.name})`));
                } else if (cat == 'updated') {
                    console.error(chalk.blue(`  ${item.message} (${item.name})`));
                } else if (cat == 'unchanged') {
                    console.error(chalk.white(`  ${item.message} (${item.name})`));
                } else {
                    console.error(chalk.green(`  ${item.message} (${item.name})`));
                }
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

    // // Check for failures, return error if so
    // if (failed.length > 0) {
    //     const message = `There were ${failed.length} failures during 'apply' (${succeeded.length}/${succeeded.length + failed.length} resources succeeded)`;
    //     throw Error(message);
    // }

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

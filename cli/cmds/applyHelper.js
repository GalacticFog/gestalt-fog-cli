const { gestalt, renderResourceObject, renderResourceTemplate, actions, gestaltSession } = require('gestalt-fog-sdk')
const { debug } = require('./lib/debug');
const yaml = require('js-yaml');
const fs = require('fs');
const chalk = require('./lib/chalk');
const path = require('path');
const util = require('./lib/util');
const cmd = require('./lib/cmd-base');

module.exports = {
    applyResourcesFromDirectory,
}

async function applyResourcesFromDirectory(dir, config, options) {
    if (options.skipValidation) {
        console.log(`Skipping validation`);
    } else {
        await doValidation(dir, config);  // throws error if validation fails
    }

    return await doApplyRecursive(dir, config, options);
}

async function doValidation(dir, config) {
    const validationResults = []
    await doValidateResourcesFromDirectory(dir, config, validationResults);
    if (validationResults.length > 0) {
        console.log(`There were ${validationResults.length} found:`);
        for (let msg of validationResults) {
            console.log(chalk.red(msg));
        }
        throw Error(`There were ${validationResults.length} errors, aborting`);
    }
}

async function doApplyRecursive(dir, config, options) {
    const results = {};
    await doApplyResourcesFromDirectory(dir, config, options, results);
    return results;
}

async function doValidateResourcesFromDirectory(dir, commonConfig, validationResults) {
    console.log(`=> Validating ${dir}`)

    // Merge in common config
    const config = Object.assign(obtainConfigFromFilesystem(dir), commonConfig);

    if (directoryRequiresContextFile(dir)) {
        if (!contextFileExists(dir)) {
            const msg = `Missing context file: '${dir}'`;
            console.log(chalk.yellow(`Warning: ${msg}`));
            validationResults.push(msg);
        }
    }

    // Try to render resources based on config
    try {
        await doValidateDirectory(dir, config);
    } catch (err) {
        console.log(chalk.red(err));
        debug(chalk.red(err.stack));
        validationResults.push(err.error);
    }

    // Next, apply all sub directories
    for (const subdir of getSubdirectories(dir)) {
        const subPath = dir + path.sep + subdir;
        await doValidateResourcesFromDirectory(subPath, commonConfig, validationResults);
    }
}

async function doApplyResourcesFromDirectory(dir, commonConfig, options, results) {

    console.log();
    console.log(`=> Processing ${dir}`)

    // Merge in common config
    const config = Object.assign(obtainConfigFromFilesystem(dir), commonConfig);

    if (contextFileExists(dir)) {
        const context = await obtainContextFromFilesystem(dir);

        // First, apply this directory
        results[dir] = await doApplyDirectory(dir, context, config, options);
    } else {
        console.log(chalk.yellow(`Warning: Skipping '${dir}' - context file`));
    }

    // Next, apply all sub directories
    const subdirs = getSubdirectories(dir);
    for (const subdir of subdirs) {
        const subPath = dir + path.sep + subdir;
        await doApplyResourcesFromDirectory(subPath, commonConfig, options, results);
    }
}

async function doValidateDirectory(dir, config) {

    const resources = loadResourcesFromDirectory(dir);

    // Partially resolve resources (LambdaSources and Config settings)
    const partiallyResolvedResources = await partiallyResolveResources(resources, config, dir);
    console.log(`Resolved ${partiallyResolvedResources.length} resources`);
}

async function doApplyDirectory(dir, context, config, options) {

    const resources = loadResourcesFromDirectory(dir);

    // Partially resolve resources (LambdaSources and Config settings)
    const partiallyResolvedResources = await partiallyResolveResources(resources, config, dir);

    const { succeeded, failed } = await actions.applyResources(context, partiallyResolvedResources, options, config);

    return {
        succeeded, failed
    }
}

// Move 'root' directory to the top of the list so it is processed first
function sortDirs(arr) {
    return arr.sort((a, b) => {
        if (a == 'root' && b != "root") {
            return -1;
        };
        if (b == 'root' && a != "root") {
            return 1;
        };
        if (a < b) { return -1; }
        if (a > b) { return 1; }
        return 0;
    })
}

function getSubdirectories(currentPath) {
    const files = fs.readdirSync(currentPath);
    const subdirs = files.filter(f => {
        const stats = fs.statSync(currentPath + path.sep + f);
        return stats.isDirectory();
    });

    return sortDirs(subdirs);
}

function directoryRequiresContextFile(dir) {
    const pathElements = dir.split(path.sep);
    if (pathElements[pathElements.length - 1] == 'src') {
        return false;
    }
    // console.log(chalk.blue(`Requires context: ${dir}`))
    return true;
}

function contextFileExists(dir) {
    const contextFile = `${dir}${path.sep}context`;
    debug('checking for ' + contextFile)

    // if (fs.existsSync(contextFile)) {
    //     console.log(chalk.blue(`context: ${contextFile}`))
    // }

    return fs.existsSync(contextFile);
}

async function obtainContextFromFilesystem(dir) {
    const contextFile = `${dir}${path.sep}context`;
    if (contextFileExists(dir)) {
        const contextPath = util.readFileAsText(contextFile);
        context = await cmd.resolveContextPath(contextPath);
    } else {
        throw Error(`Context file '${contextFile}' not present`);
    }

    return context;
}

function obtainConfigFromFilesystem(dir) {
    let config = {};

    debug(`obtainConfigFromFilesystem: dir = ${dir}`);

    // look for a special file
    if (fs.existsSync(`${dir}/config`)) {
        const configFile = `${dir}/config`;
        config = util.loadObjectFromFile(configFile, 'yaml');
        console.error('Loaded config from: ' + configFile)
    }
    return config;
}

function loadResourcesFromDirectory(directory) {
    // Read files from target directory, and filter for JSON and YAML
    let files = fs.readdirSync(directory);
    files = files.filter(f => {
        return (f.endsWith('.json') || f.endsWith('.yaml')) ? true : false;
    })
    files = files.filter(f => {
        // ignore files that start with dot or underscore
        return (!f.startsWith('_') && !f.startsWith('.'));
    })

    const resources = files.map(f => util.loadObjectFromFile(directory + '/' + f));
    return resources;
}

async function partiallyResolveResources(resources, config, directory) {
    const partiallyResolvedResources = []
    for (let resource of resources) {
        resource = await renderResourceObject(resource, config, {}, {
            onlyOffline: true,
            bundleDirectory: directory // TODO: Refactor this - bundle directory doesn't make sense as an option, but directory is needed to render LAmbdaSource directive
        })
        partiallyResolvedResources.push(resource);
    }
    return partiallyResolvedResources;
}

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
        context = context || gestaltSession.getContext();
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

// TODO: Combine this with apply-resources.js from SDK
async function processFile(file, params, config, defaultContext) {
    console.error(`Processing ${file}...`)

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

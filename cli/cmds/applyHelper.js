const { gestalt, renderResourceObject, renderResourceTemplate, actions, gestaltContext } = require('gestalt-fog-sdk')
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

async function applyResourcesFromDirectory(dir, options) {
    const results = {};
    await doApplyResourcesFromDirectory(dir, options, results);
    return results;
}

async function doApplyResourcesFromDirectory(dir, options, results) {

    console.log();
    console.log(`=> Processing ${dir}`)

    const config = obtainConfigFromFilesystem(dir);

    const context = await obtainContextFromFilesystem(dir);

    // First, apply this directory
    results[dir] = await doApplyDirectory(dir, context, config, options);

    // Next, apply all sub directories
    const subdirs = getSubdirectories(dir);
    for (const subdir of subdirs) {
        const subPath = dir + path.sep + subdir;
        await doApplyResourcesFromDirectory(subPath, options, results);
    }
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

async function obtainContextFromFilesystem(dir) {
    const contextFile = `${dir}/context`;

    let context = null;
    // look for a special file
    if (dir && fs.existsSync(contextFile)) {
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
            onlyPrebundle: true,
            bundleDirectory: directory
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

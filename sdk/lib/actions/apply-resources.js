const gestalt = require('../gestalt');
const templateResolver = require('../template-resolver');
const contextResolver = require('../context-resolver')
const { debug } = require('../debug');
const yaml = require('js-yaml');
const chalk = require('chalk');

module.exports = {
    applyResources,
};

async function applyResources(context, resources, opts, config) {

    // Prioritize resources by type
    const groups = prioritize(resources);

    if (opts.delete) {
        groups.reverse();
    }

    debug(`Processing groups in this order:`);
    for (let group of groups) {
        debug(`  ${group.type}`);
    }

    // Display plan
    console.error(chalk.blue.dim(`Deployment plan:`));
    for (let group of groups) {
        console.error(chalk.blue.dim(`  ${group.type}`));
        for (let item of group.items) {
            console.error(chalk.blue.dim(`    ${item.name}`));
        }
        console.error();
    }

    const succeeded = {
        updated: [],
        created: [],
        unchanged: [],
        deleted: [],
    };
    const failed = [];

    // Process groups
    for (let group of groups) {
        for (let item of group.items) {
            try {
                const ret = await processResource(item.resource, opts, config, context);
                if (opts['render-only']) {
                    if (opts['render-only'] == 'yaml') {
                        console.log(yaml.dump(ret.spec));
                    } else {
                        console.log(JSON.stringify(ret.spec, null, 2));
                    }
                } else {
                    const result = await gestalt.applyResource(ret.spec, ret.context, { delete: opts.delete, force: opts.force });
                    console.error(result.message);
                    item.status = result.status;
                    item.message = result.message;
                    succeeded[item.status].push(item);
                }
            } catch (err) {
                item.status = err;
                item.message = err;
                console.error(chalk.red(err));
                failed.push(item);
            }
        }
    }

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

function prioritize(resources) {
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
    for (let resource of resources) {
        if (!resource.resource_type) {
            console.error(chalk.yellow(`Warning: Will not process ${resource.name}, no resource_type found`));
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
            groups[key].items.push({
                resource: resource,
                name: resource.name
            });
        }
    }

    const sorted = [];

    // Ensure the correct order for the specified resource types
    for (let key of resourceOrder) {
        if (groups[key]) {
            sortBy(groups[key].items, 'name');  // sorts in place
            sorted.push(groups[key]);
            delete groups[key];
        }
    }

    // Append the rest of types not specified in the resource ordering
    for (let key of Object.keys(groups)) {
        sortBy(groups[key].items, 'name');  // sorts in place
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

async function processResource(resource, params, config, defaultContext) {

    // console.log(resource)

    const resourceSpec = await templateResolver.renderResourceObject(resource, config, defaultContext, { delete: params.delete });

    debug(`Finished processing resource template.`)

    debug(`resourceSpec: ${JSON.stringify(resourceSpec)}`);

    const context = resourceSpec.contextPath ? await contextResolver.resolveContextPath(resourceSpec.contextPath) : defaultContext;

    delete resourceSpec.contextPath;

    debug(`Using context: ${JSON.stringify(context)}`);

    // Override resource name if specified
    if (params.name) resourceSpec.name = params.name;
    if (params.description) resourceSpec.description = params.description;

    // special case for provider
    if (params.provider) {
        // Resolve provider by name
        const provider = await contextResolver.resolveProvider(params.provider);

        // Build provider spec
        resourceSpec.properties.provider = {
            id: provider.id,
            locations: []
        };
    }

    return {
        spec: resourceSpec,
        context: context
    };
}

const gestalt = require('./gestalt');
const gestaltContext = require('./gestalt-context');
const { debug } = require('./debug');
const chalk = require('./chalk');

const resolveContextPath = gestalt.contextResolver.resolveContextPath;

module.exports = {
    resolveProvider,
    resolveProviderByPath,
    resolveProviderInfoByPath,
    resolveResourceByPath,
    resolveContextFromResourcePath,
    resolveOrg,
    resolveWorkspace,
    resolveEnvironment,
    lookupEnvironmentResource,
    resolveContextPath
}

// This is a Map of maps. First level is resource type, second level is resource ID
const resourcePathCache = {
    'providers': {}
};

async function resolveProviderByPath(providerPath) {

    const pathElements = providerPath.split('/');

    debug(pathElements);

    const providerName = pathElements.pop();

    debug(pathElements);

    debug('providerName: ' + providerName);

    const contextPath = pathElements.join('/')
    const context = await resolveContextPath(contextPath);

    debug('context: ' + context);

    // const providerPathCache = resourcePathCache['providers'];
    //    const cachedProviders = providerPathCache[contextPath];
    const cachedProviders = gestaltContext.getResourceIdCache(contextPath);

    // if (cachedProviders) {
    if (Object.keys(cachedProviders).length > 0) {
        const provider = cachedProviders.find(p => p.name == providerName);

        debug(`Returning cached provider value for path '${providerPath}'`);
        return provider;
    } else {
        const providers = await gestalt.fetchProviders(context);

        // Save to cache
        // providerPathCache[contextPath] = providers;
        gestaltContext.saveResourceIdCache(contextPath, providers);


        debug('providers: ' + providers)
        const provider = providers.find(p => p.name == providerName);
        return provider;
        // throw Error(`Could not resolve provider for path '${providerPath}'`);
    }
}

/**
 * Returns provider info { name, id }
 * @param {*} providerPath 
 */
async function resolveProviderInfoByPath(providerPath) {

    const pathElements = providerPath.split('/');

    debug(pathElements);

    const providerName = pathElements.pop();

    debug(pathElements);

    debug('providerName: ' + providerName);

    const contextPath = pathElements.join('/')
    const context = await resolveContextPath(contextPath);

    debug('context: ' + JSON.stringify(context));

    // const providerPathCache = resourcePathCache['providers'];
    //    const cachedProviders = providerPathCache[contextPath];
    const cachedProviders = gestaltContext.getResourceIdCache('providersInfo');

    // if (cachedProviders) {
    if (cachedProviders[providerPath]) {
        console.error(chalk.dim.blue(`Returning cached provider value for path '${providerPath}'`));
        return cachedProviders[providerPath];
    } else {
        const providers = await gestalt.fetchProviders(context);

        const providersInfo = {}
        for (let p of providers) {
            console.error(chalk.dim.blue(`Will cache provider for path '${contextPath + '/' + p.name}'`));
            providersInfo[contextPath + '/' + p.name] = {
                id: p.id,
                name: p.name,
            };
        }

        // Save to cache
        // providerPathCache[contextPath] = providers;
        gestaltContext.saveResourceIdCache('providersInfo', providersInfo);

        return providersInfo[providerPath]
    }
}

/**
 * Returns a context object defined by a path to a resource
 * @param {*} resourcePath /<org>/resource>, or /<org>/<workspace>/<resource>, or /<org>/<workspace>/<environment>/<resource>
 */
async function resolveContextFromResourcePath(resourcePath) {
    const pathElements = resourcePath.split('/');

    debug(pathElements);

    const resourceName = pathElements.pop();

    debug(pathElements);

    debug('resourceName: ' + resourceName);

    const contextPath = pathElements.join('/')
    const context = await resolveContextPath(contextPath);

    debug('context: ' + context);
    return context;
}

async function resolveProvider(name, providedContext, optionalType) {

    console.error(chalk.dim.blue(`Resolving provider '${name}'`));

    const context = providedContext || gestaltContext.getContext();

    // Check if workspace property is required
    if (name) {

        const cache = gestaltContext.getResourceIdCache('provider');

        // first, look in cache
        if (cache[name]) {
            console.error(chalk.dim.blue(`Using cached id for provider ${name}`));
            return {
                id: cache[name],
                name: name
            };
        }

        // Not found in cache, look up ID by name
        const providers = await gestalt.fetchProviders(context, optionalType);

        let numFound = 0;
        let foundProvider = null;
        // Search for duplicates
        for (const p of providers) {
            if (p.name == name) {
                foundProvider = p;
                numFound++;
            }
        }

        if (numFound == 0) throw Error(`Could not find provider with name '${name}'`);
        if (numFound > 1) throw Error(`Found duplicate providers, ${numFound} providers with name='${name}'`);

        // found it, write to cache
        cache[foundProvider.name] = foundProvider.id;
        gestaltContext.saveResourceIdCache('provider', cache);

        return {
            id: foundProvider.id,
            name: foundProvider.name
        };
    } else {
        throw Error(`Missing name property`);
    }
}

/**
 * Finds a resource by path
 * @param {*} resourceType 'provider', 'lambda', etc
 * @param {*} resourcePath a path defined by '/<org>/<workspace>/<environment>/<resource>'
 */
async function resolveResourceByPath(resourceType, resourcePath) {
    const pathElements = resourcePath.split('/');

    debug(pathElements);

    const resourceName = pathElements.pop();

    debug(pathElements);

    debug('providerName: ' + resourceName);

    const contextPath = pathElements.join('/')
    const context = await resolveContextPath(contextPath);

    debug('context: ' + context);

    if (!resourcePathCache[resourceType]) {
        resourcePathCache[resourceType] = {};
    }

    const cache = resourcePathCache[resourceType][contextPath];
    if (cache) {
        const resource = cache.find(r => r.name == resourceName);

        debug(`Returning cached ${resourceType} value for path '${resourcePath}'`);
        console.error(chalk.dim.blue(`Returning cached ${resourceType} value for path '${resourcePath}'`));
        return resource;
    } else {
        console.error(chalk.dim.blue(`Resolving ${resourceType} value for path '${resourcePath}'`));

        // const resources = await gestalt.fetchProviders(context);
        const resources = await gestalt.fetchResources(resourceType, context);

        // Save to cache
        resourcePathCache[resourceType][contextPath] = resources;

        debug('Resources of type ' + resourceType + ': ' + resources)
        const resource = resources.find(r => r.name == resourceName);
        return resource;
    }
}

async function resolveOrg() {
    const context = gestaltContext.getContext();
    if (!context.org) throw Error('missing context.org');
    if (!context.org.fqon) throw Error('missing context.org.fqon');
    return context;
}

async function resolveWorkspace() {
    const context = gestaltContext.getContext();
    if (!context.org) throw Error('missing context.org');
    if (!context.org.fqon) throw Error('missing context.org.fqon');
    if (!context.workspace) throw Error('missing context.workspace');
    if (!context.workspace.id) throw Error('missing context.workspace.id');
    if (!context.workspace.name) throw Error('missing context.workspace.name');
    return context;
}

async function resolveEnvironment() {
    const context = gestaltContext.getContext();
    if (!context.org) throw Error('missing context.org');
    if (!context.org.fqon) throw Error('missing context.org.fqon');
    if (!context.workspace) throw Error('missing context.workspace');
    if (!context.workspace.id) throw Error('missing context.workspace.id');
    if (!context.workspace.name) throw Error('missing context.workspace.name');
    if (!context.environment) throw Error('missing context.environment');
    if (!context.environment.id) throw Error('missing context.environment.id');
    if (!context.environment.name) throw Error('missing context.environment.name');
    return context;
}

async function lookupEnvironmentResource(type, name, context) {

    if (!type) throw Error('missing resource type');
    if (!name) throw Error('missing resource name');
    if (!context) throw Error('missing context');

    const resources = await gestalt.fetchEnvironmentResources(type, context);
    for (let res of resources) {
        if (name == res.name) {
            return {
                id: res.id,
                name: res.name
            };
        }
    }

    throw Error(`Environment '${type}' resource with name '${name}' not found`);
}

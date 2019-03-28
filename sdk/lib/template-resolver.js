const { debug, trace } = require('./debug');
const contextResolver = require('../lib/context-resolver');
const gestalt = require('../lib/gestalt');
const util = require('../lib/util');
const path = require('path');
const chalk = require('../lib/chalk');

// -----------OLD Method - traversing an object --------------------------------------------------------------------
// exports.renderResourceTemplate = async function (template, config, context) {
//     state.config = util.cloneObject(config);
//     state.context = util.cloneObject(context);

//     // const resource = Object.assign({}, template);
//     const resource = JSON.parse(JSON.stringify(template));
//     debug('cloned resource:')
//     debug(resource)
//     await traverse(resource, parseFieldForDirectives)
//     return resource;
// }

// async function traverse(obj, func) {
//     for (let k in obj) {
//         if (obj[k] && typeof obj[k] === 'object') {
//             await traverse(obj[k], func)
//         } else {
//             obj[k] = await func(obj[k])
//         }
//     }
// }
// -----------OLD Method - traversing an object --------------------------------------------------------------------

module.exports = {
    renderResourceTemplate,
    renderResourceObject
}

async function renderResourceTemplate(templateFile, config, context, options) {
    state.config = util.cloneObject(config);
    state.context = util.cloneObject(context);
    state.templateFile = templateFile;
    state.options = options || {};

    debug(`Loading template from '${templateFile}'`);
    let template = "";
    if(templateFile == "-") {
        template = util.readFromStdin();
    }else {
        template = util.readFileAsText(templateFile);
    }

    const dataType = util.getFileObjectType(templateFile);

    const processedData = await parseFieldForDirectives(template);

    const resource = util.loadObjectFromString(processedData, dataType);

    // debug('cloned resource:')
    // debug(resource)
    return resource;
}

async function renderResourceObject(obj, config, context, options) {
    state.config = util.cloneObject(config);
    state.context = util.cloneObject(context);
    state.templateFile = options.bundleDirectory + '/dummyfile';
    state.options = options || {};

    // Only render non-Gestalt dependent options
    if (state.options.onlyOffline) {
        state.options.only = {
            LambdaSource: true,
            Config: true
        }
    }

    if (state.options.onlyPrebundle) {
        state.options.only = {
            LambdaSource: true,
            Config: false
        }
    }

    debug(`Loading temmplate from object`);

    const processedData = await parseFieldForDirectives(JSON.stringify(obj, null, 2));

    // console.log(processedData)

    const resource = util.loadObjectFromString(processedData, 'json');

    // debug('cloned resource:')
    // debug(resource)
    return resource;
}

const state = {
    config: undefined,
    context: undefined,
    templateFile: undefined,
    options: {}
};


async function parseFieldForDirectives(value) {
    return doDarseFieldForDirectives(value, resolveTemplateDirective)
}

async function doDarseFieldForDirectives(value, func) {
    if (typeof value !== 'string') {
        return value;
    }

    const directivesCache = {}

    const startToken = '#{'
    const endToken = '}'

    let start = -1;
    let lastDeep = -1;
    while (true) {
        start = getDeepestTokenPosition(startToken, value, lastDeep);
        // console.log(`start=${start}`)

        // Use last deep as a way to back off processing a directive again if it was unresolve
        // a previous iteration
        lastDeep = start;

        // debug(`Parsing ${value} at start=${start}`)
        if (start > -1) {
            const end = value.indexOf(endToken, start + startToken.length);
            trace(`start: ${start}, end: ${end}`)
            if (end > start) {
                // Process the directive between the tokens
                const directive = value.substring(start + startToken.length, end);
                trace(`Directive: ${directive}`)

                let replacementValue = 'NOT_RESOLVED';

                if (state.options.delete) {
                    if (directive.startsWith('Config ') || directive.startsWith('Api ')) {
                        replacementValue = await func(directive, directivesCache);
                        trace(`Resolved: ${replacementValue}`)
                    } else {
                        trace(`Skipping resolution since options specify this resource will be deleted`)
                        trace(`Not Resolved: ${replacementValue}`)
                    }
                } else {
                    replacementValue = await func(directive, directivesCache);
                    trace(`Resolved: ${replacementValue}`)
                    if (replacementValue == undefined) {
                        replacementValue = `${startToken}${directive}${endToken}`
                    }
                }

                // Construct the new string, replacing the token with the replacement value
                const token = `${startToken}${directive}${endToken}`
                value = value.substring(0, start) + replacementValue + value.substring(start + token.length);
                start = -1; //reset
                // debug(`New Value: ${value}`)
            } else {
                break;
            }
        } else {
            break;
        }
    }

    return value;
}

function getDeepestTokenPosition(token, stringValue, lastDeep) {
    // console.log(`getDeepestTokenPosition(${token}, ${stringValue}, ${lastDeep})`)
    let start = -1;
    let pos = 0;
    while (true) {
        pos = stringValue.indexOf(token, start + 1);
        // console.log(`pos=${pos}`)

        // Use last deep as a way to back off processing a directive again if it was unresolve
        // a previous iteration.  lastDeep initializes at -1
        if (lastDeep > 0 && pos >= lastDeep) {
            // console.log(`pos=${pos} >= lastDeep=${lastDeep} ... breaking`)
            break;
        }

        if (pos > -1) {
            start = pos;
        } else {
            break;
        }
    }
    return start;
}

async function resolveTemplateDirective(directiveString, directivesCache_) {

    let directivesCache = {}
    if(directivesCache_ !== undefined) {
        directivesCache = directivesCache_
    }

    let tokens = directiveString.split(' ');
    const directive = tokens[0];
    tokens.shift(); // Pop off the directive from tokens

    let skip = false;
    // console.log(state)
    if (state.options && state.options.only) {
        if (state.options.only[directive]) {
            skip = false;
        } else {
            skip = true;
        }
    }

    if (skip) {
        debug(`Skipping '${directive}'`)
    } else {
        debug(`Not skipping '${directive}'`)

        // First, look in the Directive cache
        const cachedValue = directivesCache[directiveString];
        if (cachedValue) {
            debug(`Found cached value for '${directiveString}': '${cachedValue}'`)
            return cachedValue;
        }

        // Remove any blank parameters
        while (true) {
            const index = tokens.indexOf('');
            if (index > -1) {
                tokens.splice(index, 1);
            } else {
                break;
            }
        }

        debug('Tokens:')
        debug(tokens);

        const handler = directiveHandlers[directive]
        if (handler) {
            const calculatedValue = await handler.apply(handler, tokens)

            // Save back to cache
            directivesCache[directiveString] = calculatedValue;
            return calculatedValue;
        }
        throw Error(`No handler for directive '${directive}'`)
    }
}

const directiveHandlers = {
    Provider: resolveProvider,
    Config: resolveConfig,
    Environment: resolveEnvironment,
    Lambda: resolveLambda,
    Container: resolveContainer,
    Api: resolveApi,
    Policy: resolvePolicy,
    LambdaSource: resolveBase64File,
    Datafeed: resolveDatafeed,
    ResourceType: resolveResourceTypeId,
    Resource: resolveGenericResource
}

async function resolveProvider(pathOrName, param = 'id') {
    debug(`template-resolver: resolveProvider: path=${path}, context=${JSON.stringify(state.context, null, 2)}`);
    const provider = await getProvider(pathOrName);
    if (!provider) {
        throw Error('Provider not found for path: ' + path);
    }
    debug(`Found provider '${provider.name}'`);
    return provider[param];
}

async function getProvider(pathOrName) {
    if (pathOrName.startsWith('/')) {
        // treat as an absolute path
        return contextResolver.resolveProviderInfoByPath(pathOrName);
    } else {
        return contextResolver.resolveProvider(pathOrName, state.context);
    }
}

async function resolveLambda(pathOrName, param = 'id') {
    let lambda = null;
    if (pathOrName[0] == '/') {
        lambda = await contextResolver.resolveResourceByPath('lambdas', pathOrName);
        if (!lambda) {
            throw Error('Lambda not found for path: ' + pathOrName);
        }
    } else {
        console.error(chalk.dim.blue(`Resolving environment lambda '${pathOrName}'`));
        const lambdas = await gestalt.fetchEnvironmentLambdas(state.context);
        lambda = lambdas.find(l => l.name == pathOrName);
        if (!lambda) {
            console.error(chalk.yellow(`Warning: lambda not found with name '${pathOrName} in environment, searching all orgs...`));
            const allLambdas = await gestalt.fetchOrgLambdas(await gestalt.fetchOrgFqons());
            lambda = allLambdas.find(l => l.name == pathOrName);
            if (!lambda) {
                throw Error('Lambda not found with name: ' + pathOrName);
            }
        }
    }
    debug(`Found lambda '${lambda.name}'`);
    return lambda[param];
}

async function resolveContainer(pathOrName, param = 'id') {
    let container = null;
    if (pathOrName[0] == '/') {
        container = await contextResolver.resolveResourceByPath('containers', pathOrName);
        if (!container) {
            throw Error('Container not found for path: ' + pathOrName);
        }
    } else {
        const containers = await gestalt.fetchContainers(state.context);
        container = containers.find(l => l.name == pathOrName);
        if (!container) {
            throw Error('Container not found for path: ' + pathOrName);
        }
    }
    debug(`Found container '${container.name}'`);
    return container[param];
}

async function resolveConfig(key) {
    if (state.config[key]) {
        debug(`Using '${key}' from configuration object`);
        return state.config[key];
    } else if (process.env[key]) {
        debug(`Using '${key}' from environment variable`);
        return process.env[key];
    }
    throw Error(`Unable to resolve configuration for key '${key}'`);
}

async function resolveEnvironment(path, param) {
    const context = await contextResolver.resolveContextPath(path);
    return context.environment[param];
}

async function resolveApi(apiName, param = 'id') {
    const resources = await gestalt.fetchEnvironmentApis(state.context);
    const api = resources.find(r => r.name == apiName);
    if (api) {
        return api[param];
    }
    throw Error(`Unable to resolve API with name '${apiName}'`);
}

async function resolvePolicy(name, param = 'id') {
    const resources = await gestalt.fetchEnvironmentPolicies(state.context);
    const res = resources.find(r => r.name == name);
    if (res) {
        return res[param];
    }
    throw Error(`Unable to resolve Policy with name '${res}'`);
}

async function resolveDatafeed(pathOrName, param = 'id') {
    let datafeed = null;
    if (pathOrName[0] == '/') {
        datafeed = await contextResolver.resolveResourceByPath('datafeeds', pathOrName);
        if (!datafeed) {
            throw Error('Datafeed not found for path: ' + pathOrName);
        }
    } else {
        console.error(chalk.dim.blue(`Resolving environment datafeed '${pathOrName}'`));
        const lambdas = await gestalt.fetchEnvironmentResources('datafeeds', state.context);
        datafeed = lambdas.find(l => l.name == pathOrName);
        if (!datafeed) {
            throw Error('Datafeed not found for path: ' + pathOrName);
        }
    }
    debug(`Found Datafeed '${datafeed.name}'`);
    return datafeed[param];
}

async function resolveBase64File(file) {

    // Calculate path relative to the template file
    const sourcePath = path.dirname(state.templateFile);
    file = path.join(sourcePath, file);

    const contents = util.readFileAsText(file);
    const buf = Buffer.from(contents, 'utf8');
    const code = buf.toString('base64');
    return code;
}

async function resolveResourceTypeId(name) {
    // #{ResourceType Gestalt::Resource::Job } matches with Gestalt::Resource::Job
    // #{ResourceType job } matches with Gestalt::Resource::Job
    // #{ResourceType lambda::aws } matches with Gestalt::Configuration::Provider::Lambda::AWS
    // #{ResourceType gatewaymanager::aws } matches with Gestalt::Configuration::Provider::GatewayManager::AWS
    // #{ResourceType aws } throws an error
    const resourceTypes = await gestalt.fetchResourceTypes();
    const matches = resourceTypes.filter(rt => {
            const left = rt.name.toLowerCase().split("::")
            const right = name.toLowerCase().split("::")
            
            return left.slice(-1 * right.length).join("::") == right.join("::")
        }
    );

    if(matches.length == 0) {
        throw Error(`Unable to resolve ResourceType with name '${name}'`);
    }else if(matches.length == 1) {
        return matches.pop().id;
    }else {
        matches.forEach(match => debug(`Ambigous Resource Type: '${match.name}'`))
        throw Error(`Unable to resolve ResourceType with name '${name}': more than one matched`);
    }
}

async function resolveGenericResource(resourceType, pathOrName, param = 'id') {
    let resource = null;
    resource = await contextResolver.resolveResourceByPath(resourceType, pathOrName);
    if (!resource) {
        throw Error('Resource ' + resourceType + ' not found for path: ' + pathOrName);
    }
    debug(`Found resource '${resource.name}'`);
    return container[param];
}
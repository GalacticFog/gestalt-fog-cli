const debug = require('./debug').debug;
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

exports.renderResourceTemplate = async function (templateFile, config, context) {
    state.config = util.cloneObject(config);
    state.context = util.cloneObject(context);
    state.templateFile = templateFile;

    debug(`Loading temmplate from '${templateFile}'`);
    const template = util.readFileAsText(templateFile);

    const dataType = util.getFileObjectType(templateFile);

    const processedData = await parseFieldForDirectives(template);

    const resource = util.loadObjectFromString(processedData, dataType);

    // debug('cloned resource:')
    // debug(resource)
    return resource;
}

const state = {
    config: undefined,
    context: undefined,
    directivesCache: {},
    templateFile: undefined
};


async function parseFieldForDirectives(value) {
    return doDarseFieldForDirectives(value, resolveTemplateDirective)
}

async function doDarseFieldForDirectives(value, func) {
    if (typeof value !== 'string') {
        return value;
    }

    const startToken = '#{'
    const endToken = '}'

    let start = -1;
    while (true) {
        start = getDeepestTokenPosition(startToken, value);
        // debug(`Parsing ${value} at start=${start}`)
        if (start > -1) {
            const end = value.indexOf(endToken, start + startToken.length);
            debug(`start: ${start}, end: ${end}`)
            if (end > start) {
                // Process the directive between the tokens
                const directive = value.substring(start + startToken.length, end);
                debug(`Directive: ${directive}`)

                const replacementValue = await func(directive);
                debug(`Resolved: ${replacementValue}`)

                value = value.replace(`${startToken}${directive}${endToken}`, replacementValue);
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

function getDeepestTokenPosition(token, stringValue) {
    let start = -1;
    let pos = 0;
    while (true) {
        pos = stringValue.indexOf(token, start + 1);
        if (pos > -1) {
            start = pos;
        } else {
            break;
        }
    }
    return start;
}

async function resolveTemplateDirective(directiveString) {

    // First, look in the Directive cache
    const cachedValue = state.directivesCache[directiveString];
    if (cachedValue) {
        debug(`Found cached value for '${directiveString}': '${cachedValue}'`)
        return cachedValue;
    }

    let tokens = directiveString.split(' ');
    const directive = tokens[0];
    tokens.shift(); // Pop off the directive from tokens

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
        const calculatedValue = /*await*/ handler.apply(handler, tokens)

        // Save back to cache
        state.directivesCache[directiveString] = calculatedValue;
        return calculatedValue;
    }
    throw Error(`No handler for directive '${directive}'`)
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
}

async function resolveProvider(path, param = 'id') {
    const provider = await contextResolver.resolveProviderInfoByPath(path);
    if (!provider) {
        throw Error('Provider not found for path: ' + path);
    }
    debug(`Found provider '${provider.name}'`);
    return provider[param];
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
            throw Error('Lambda not found for path: ' + pathOrName);
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


async function resolveBase64File(file) {

    // Calculate path relative to the template file
    const sourcePath = path.dirname(state.templateFile);
    file = path.join(sourcePath, file);

    const contents = util.readFileAsText(file);
    const buf = Buffer.from(contents, 'utf8');
    const code = buf.toString('base64');
    return code;
}

// //TODO: implement
// async function resolveLambda(lambdaName, param = 'id') {
//     const lambda = await gestalt.fetchLambda({ name: lambdaName }, state.context);
//     debug(`Found lambda '${lambda.name}'`);
//     return lambda[param];
// }

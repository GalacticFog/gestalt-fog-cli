const debug = require('./debug').debug;
const contextResolver = require('../lib/context-resolver');

exports.renderResourceTemplate = async function (template, config) {
    state.config = Object.assign({}, config);
    const resource = Object.assign({}, template);
    await traverse(resource, parseFieldForDirectives)
    return resource;
}

const state = {
    config: undefined,
    directivesCache: {}
};

async function traverse(obj, func) {
    for (let k in obj) {
        if (obj[k] && typeof obj[k] === 'object') {
            await traverse(obj[k], func)
        } else {
            obj[k] = await func(obj[k])
        }
    }
}

async function parseFieldForDirectives(value) {
    if (typeof value !== 'string') {
        return value;
    }

    const startToken = '#{'
    const endToken = '}'

    let start = -1;
    while (true) {
        start = value.indexOf(startToken, start + 1);
        debug(`Parsing ${value} at start=${start}`)
        if (start > -1) {
            const end = value.indexOf(endToken, start + startToken.length);
            debug(`start: ${start}, end: ${end}`)
            if (end > start) {
                // Process the directive between the tokens
                const directive = value.substring(start + startToken.length, end);
                debug(`Directive: ${directive}`)

                const replacementValue = await resolveTemplateDirective(directive);
                debug(`Resolved: ${replacementValue}`)

                value = value.replace(`${startToken}${directive}${endToken}`, replacementValue);
                start = -1; //reset
                debug(`New Value: ${value}`)
            } else {
                break;
            }
        } else {
            break;
        }
    }

    return value;
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
    Environment: resolveEnvironment
}

async function resolveProvider(path, param) {
    const provider = await contextResolver.resolveProviderByPath(path);
    debug(`Found provider '${provider.name}'`);
    return provider[param];
}

async function resolveConfig(key) {
    if (state.config[key]) {
        return state.config[key];
    }
    throw Error(`Unable to resolve configuration for key '${key}'`);
}

async function resolveEnvironment(path, param) {
    const context = await contextResolver.resolveContextPath(path);
    return context.environment[param];
}

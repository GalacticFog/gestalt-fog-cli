const { cli, ui, out, debug, gestalt, gestaltContext, util } = require('../lib/gestalt-cli');
const fs = require('fs');
const contextResolver = require('../lib/context-resolver');

exports.command = 'resource-from-template';
exports.description = 'Create resource';
exports.builder = {
    file: {
        alias: 'f',
        description: 'resource definition file',
        required: true
    },
    config: {
        description: 'config file'
    }
}

cli.initialize(exports, main, ['AcceptEnvironmentScope']);

const state = {

}

async function main(argv) {

    out(`Loading template from file ${argv.file}`);
    const rawTemplate = util.loadObjectFromFile(argv.file);

    if (argv.config) {
        state.config = util.loadObjectFromFile(argv.config);
    }

    // console.log(rawTemplate)

    const spec = await renderTemplate(rawTemplate);

    debug('Directives cache:')
    debug(directivesCache);
    debug()

    out('Raw Template:')
    out(JSON.stringify(rawTemplate, null, 2))

    const context = gestaltContext.getContext();

    // const provider = await gestalt.createProvider(providerSpec, context);
    // out(`provider '${provider.name}' created.`);
}

async function renderTemplate(template) {
    return await traverse(template, parseFieldForDirectives)
}

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
    const cachedValue = directivesCache[directiveString];
    if (cachedValue) {
        debug(`Found cached value for '${directiveString}': '${cachedValue}'`)
        return cachedValue;
    }

    let tokens = directiveString.split(' ');
    const directive = tokens[0];
    tokens.shift();

    debug('Tokens:')
    debug(tokens);

    const handler = directives[directive]
    if (handler) {
        const calculatedValue = /*await*/ handler.apply(handler, tokens)

        // Save back to cache
        directivesCache[directiveString] = calculatedValue;
        return calculatedValue;
    }
    throw Error(`No handler for directive '${directive}'`)
}

const directivesCache = {}

const directives = {
    resolveProvider: resolveProvider,
    resolveConfig: resolveConfig,
    resolveEnvironment: resolveEnvironment
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


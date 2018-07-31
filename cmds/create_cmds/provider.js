const { cli, ui, out, debug, gestalt, gestaltContext, util } = require('../lib/gestalt-cli');
const fs = require('fs');

exports.command = 'provider';
exports.description = 'Create provider';
exports.builder = {
    file: {
        alias: 'f',
        description: 'resource definition file',
        required: true
    }
}

cli.initialize(exports, main, ['AcceptEnvironmentScope']);

async function main(argv) {

    out(`Loading template from file ${argv.file}`);
    const rawTemplate = util.loadObjectFromFile(argv.file);

    // console.log(rawTemplate)

    const spec = renderTemplate(rawTemplate);

    debug('Directives cache:')
    debug(directivesCache);
    debug()

    out(JSON.stringify(rawTemplate, null, 2))

    const context = gestaltContext.getContext();

    // const provider = await gestalt.createProvider(providerSpec, context);
    // out(`provider '${provider.name}' created.`);
}

function renderTemplate(template) {
    traverse(template, parseFieldForDirectives)
}

function traverse(obj, func) {
    for (let k in obj) {
        if (obj[k] && typeof obj[k] === 'object') {
            traverse(obj[k], func)
        } else {
            obj[k] = func(obj[k])
        }
    }
}

function parseFieldForDirectives(value) {
    if (typeof value !== 'string') {
        return value;
    }

    const startToken = '#{'
    const endToken = '}'

    let start = -1;
    while (true) {
        start = value.indexOf(startToken, start + 1);
        console.log(`Parsing ${value} at start=${start}`)
        if (start > -1) {
            const end = value.indexOf(endToken, start + 1);
            debug(`start: ${start}, end: ${end}`)
            if (end > start) {
                // Process the directive between the tokens
                const directive = value.substring(start + startToken.length, end);
                debug(`Directive: ${directive}`)
                const replacementValue = resolveTemplateDirective(directive);
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

function resolveTemplateDirective(directiveString) {

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
        const calculatedValue = handler.apply(handler, tokens);

        // Save back to cache
        directivesCache[directiveString] = calculatedValue;
        return calculatedValue;
    }
    throw Error(`No handler for directive '${directive}'`)
}


const directives = {
    resolveProvider: resolveProvider,
    resolveSecret: resolveSecret,
    resolveEnvironment: resolveEnvironment
}

function resolveProvider(path, param) {
    return `PROVIDER ${param} FOR ${path}`
}

function resolveSecret(key) {
    return `SECRET FOR ${key}`
}

function resolveEnvironment(path, param) {
    return `ENVIRONMENT ${param} FOR ${path}`
}

const directivesCache = {}

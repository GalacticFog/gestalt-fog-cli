const chalk = require('chalk')
const { debug } = require('./debug')

exports.initialize = (targetCommand, main, options = {}) => {
    const handlers = [];
    processOptions(options, targetCommand, handlers);
    targetCommand.handler = createHandler(main, handlers);
}

// Creates a handler that yargs framework expects (non-async function)
function createHandler(main, handlers) {
    return function (argv) {
        if (argv.insecure) {
            console.log('Insecure mode: Ignoring TLS to allow self-signed certificates');
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        }

        global.fog = global.fog || {};
        if (argv.debug) global.fog.debug = true;

        // Run pre-handlers
        run(main, argv, handlers).then((unused) => {
            // Nothing
            debug(unused);
        });
    }
}

// Wraps the function and handlers
async function run(fn, argv, handlers) {

    try {
        // First call handlers
        for (let handler of handlers) {
            debug(`Calling handler ${handler}...`);
            await handler(argv)
        }

        // Next call main handler
        await fn(argv);

    } catch (err) {
        // Write error to screen
        console.error(chalk.red(err));

        // Debug output
        debug(JSON.stringify(err));
        if (global.fog.debug) {
            throw err;
        }

        process.exit(-1);
    }
}

function processOptions(options, targetCommand, handlers) {

    switch (options['enviornment']) {
        case 'required':
            applyRequiredEnvironmentScope(targetCommand, handlers);
            break;
        case 'optional':
            applyOptionalEnvironmentScope(targetCommand, handlers)
            break;
        default:
            throw Error(`Unknown option: ${options['enviornment']}`)
    }
}

function applyOptionalEnvironmentScope(command, handlers) {
    setEnvironmentScope(command);
}

function applyRequiredEnvironmentScope(command, handlers) {

    setEnvironmentScope(command);
    setEnvironmentScopeHandlers(handlers);

    // Supporting functions

    function setEnvironmentScopeHandlers(handlers) {
        const handler = async (argv) => {

            debug(`This command requires environment scope.`)

            const context = gestaltContext.getContext();

            await util.requireOrgArg(argv, context);
            await util.requireEnvironmentArg(argv, context);
            await util.requireEnvironmentArg(argv, context);

        };

        handlers.push(handler);
    }
}

function setEnvironmentScope(command) {
    const options = {
        org: {
            description: "Sets the org"
        },
        workspace: {
            description: "Sets the workspace"
        },
        environment: {
            description: "Sets the environment"
        },
        context: {
            description: "Sets the scope"
        }
    }
    command.builder = Object.assign(command.builder, options)
}


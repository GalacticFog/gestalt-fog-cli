const chalk = require('chalk')
const { debug } = require('./debug')

exports.initialize = (exp, main, directives = []) => {
    const handlers = [];
    processCommandDirectives(exp, directives, handlers);
    exp.handler = createHandler(main, handlers);
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

function processCommandDirectives(command, directives, handlers) {

    const map = require('./gestalt-cli-additions');

    for (let o of directives) {
        if (o in map) {
            map[o](command, handlers);
        } else {
            throw Error(`Invalid command directive: ${o}`);
        }
    }
}

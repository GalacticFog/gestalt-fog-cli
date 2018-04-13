const context = {};

exports.handler = function (main) {
    return function (argv) {
        if (argv.insecure) {
            console.log('Insecure mode: Ignoring TLS to allow self-signed certificates');
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        }

        context.argv = argv;
        run(main, argv).then(() => {
            // Post
        });
    }
}

exports.debug = debug;

async function run(fn, argv) {
    try {
        await fn(argv);
    } catch (err) {
        handleError(argv, err);
        process.exit(-1);
    }
}

function handleError(argv, err) {
    if (argv.debug) {
        console.log(err)
    } else {
        try {
            const json = JSON.parse(err);
            if (json) {
                if (json.message) {
                    console.error(json.message);
                } else {
                    console.error(`Error: ${err}`);
                }
            } else {
                console.error(`Error: ${err}`);
            }
        } catch (err2) {
            // Failed to parse
            console.error(`Error: ${err}`);
        }
    }
}

function debug(str) {
    if (!context.argv) console.error('WARNING: context.argv isn\'t initialized in cmd-base.js::debug()');
    if (context.argv && context.argv.debug) {
        console.log(typeof str)
        if (typeof str == 'object') {
            console.log('[DEBUG] ' + JSON.stringify(str, null, 2));
        } else {
            console.log('[DEBUG] ' + str);
        }
    }
}

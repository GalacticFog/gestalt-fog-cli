const gestalt = require('./gestalt')

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

exports.resolveProvider = async function (argv, providedContext) {

    const context = providedContext || gestalt.getContext();

    // Check if workspace property is required
    if (argv.provider) {
        // Look up ID by name
        const providers = await gestalt.fetchEnvironmentProviders(context);
        for (let p of providers) {
            if (p.name == argv.provider) {
                // found it
                return {
                    id: p.id,
                    name: p.name
                };
                break;
            }
        }
        throw Error(`Could not find provider with name '${argv.provider}'`);
    } else {
        throw Error(`Missing --provider property`);
    }
}

exports.resolveOrg = async function (argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);
    return context;
}

exports.resolveWorkspace = async function (argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);
    return context;
}

exports.resolveEnvironment = async function (argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);
    await requireEnvironmentArg(argv, context);
    return context;
}

async function requireOrgArg(argv, context) {
    // Check if org property is required
    if (argv.org) {
        context.org = { fqon: argv.org }
    } else {
        if (!context.org || !context.org.fqon) {
            throw Error(`Missing --org property, not found in current context`);
        }
    }
    console.log(`Using '${context.org.fqon}' org.`)
}

async function requireWorkspaceArg(argv, context) {

    // Check if workspace property is required
    if (argv.workspace) {
        context.workspace = {};

        // Look up ID by name
        const orgWorkspaces = await gestalt.fetchOrgWorkspaces([context.org.fqon]);
        for (let ws of orgWorkspaces) {
            if (ws.name == argv.workspace) {
                // found it
                context.workspace = {
                    id: ws.id,
                    name: ws.name
                };
                break;
            }
        }
        if (!context.workspace.id) throw Error(`Could not find workspace with name '${argv.workspace}'`);
    } else {
        if (!context.workspace || !context.workspace.id) {
            throw Error(`Missing --workspace property, not found in current context`);
        }
    }
}

async function requireEnvironmentArg(argv, context) {

    // Check if environment property is required
    if (argv.environment) {
        context.environment = {};

        // Look up ID by name
        const envs = await gestalt.fetchWorkspaceEnvironments(context);
        for (let env of envs) {
            if (env.name == argv.environment) {
                // found it
                context.environment = {
                    id: env.id,
                    name: env.name
                };
                break;
            }
        }
        if (!context.environment.id) throw Error(`Could not find environment with name '${argv.environment}'`);
    } else {
        if (!context.environment || !context.environment.id) {
            throw Error(`Missing --environment property, not found in current context`);
        }
    }
}

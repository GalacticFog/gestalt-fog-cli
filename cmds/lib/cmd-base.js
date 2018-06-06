const gestalt = require('./gestalt')
const fs = require('fs');

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

exports.loadObjectFromFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        const contents = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(contents);
    }
    throw new Error(`File '${filePath}' not found`);
}


exports.resolveProvider = async function (argv, providedContext, optionalType) {

    const context = providedContext || gestalt.getContext();

    // Check if workspace property is required
    if (argv.provider) {
        // Look up ID by name
        const providers = await gestalt.fetchEnvironmentProviders(context, optionalType);

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

exports.resolveEnvironment = async function (argv, optionalContext) {
    const context = optionalContext || gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);
    await requireEnvironmentArg(argv, context);
    return context;
}

exports.resolveEnvironmentApi = async function (argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);
    await requireEnvironmentArg(argv, context);
    await requireEnvironmentApiArg(argv, context);
    return context;
}

exports.resolveEnvironmentContainer = async function (argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);
    await requireEnvironmentArg(argv, context);
    await requireEnvironmentContainerArg(argv, context);
    return context;
}

exports.resolveEnvironmentLambda = async function (argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);
    await requireEnvironmentArg(argv, context);
    await requireEnvironmentLambdaArg(argv, context);
    return context;
}

exports.lookupEnvironmentResourcebyName = async function(name, type, context) {
    const resources = await gestalt.fetchEnvironmentResources(type, context);
    for (let res of resources) {
        if (name == res.name) {
            return {
                id: res.id,
                name: res.name
            }
        }
    }
    throw Error(`Environment '${type}' resource with name '${name}' not found`);
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

async function requireEnvironmentApiArg(argv, context) {
    if (argv.api) {
        context.api = {};
        const resources = await gestalt.fetchEnvironmentApis(context);
        for (let res of resources) {
            if (res.name == argv.api) {
                context.api = {
                    id: res.id,
                    name: res.name
                };
                break;
            }
        }
        if (!context.api.id) throw Error(`Could not find api with name '${argv.api}'`);
    } else {
        throw Error(`Missing --api property`);
    }
}

async function requireEnvironmentContainerArg(argv, context) {
    if (argv.container) {
        context.container = {};
        const resources = await gestalt.fetchEnvironmentContainers(context);
        for (let res of resources) {
            if (res.name == argv.container) {
                context.container = {
                    id: res.id,
                    name: res.name
                };
                break;
            }
        }
        if (!context.container.id) throw Error(`Could not find container with name '${argv.container}'`);
    } else {
        throw Error(`Missing --container property`);
    }
}

async function requireEnvironmentLambdaArg(argv, context) {
    if (argv.lambda) {
        context.lambda = {};
        const resources = await gestalt.fetchEnvironmentLambdas(context);
        for (let res of resources) {
            if (res.name == argv.lambda) {
                context.lambda = {
                    id: res.id,
                    name: res.name
                };
                break;
            }
        }
        if (!context.lambda.id) throw Error(`Could not find lambda with name '${argv.lambda}'`);
    } else {
        throw Error(`Missing --lambda property`);
    }
}

exports.requireArgs = (argv, requiredArgs) => {
    for (let s of requiredArgs) {
        if (!argv[s]) throw Error(`Missing --${s} property`);
    }
}
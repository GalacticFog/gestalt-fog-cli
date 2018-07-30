const gestalt = require('./gestalt')
const gestaltContext = require('./gestalt-context')
const fs = require('fs');
const chalk = require('chalk');
const debug = require('./debug').debug;

exports.handler = function (main) {
    return function (argv) {
        if (argv.insecure) {
            console.log('Insecure mode: Ignoring TLS to allow self-signed certificates');
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        }

        global.fog = global.fog || {};
        if (argv.debug) global.fog.debug = true;

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
    // Write error to screen
    console.error(chalk.red(`Error: ${err}`));

    // Debug output
    debug(err);
}

exports.loadObjectFromFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        const contents = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(contents);
    }
    throw new Error(`File '${filePath}' not found`);
}


exports.resolveProvider = async function (argv, providedContext, optionalType, param = 'provider') {

    const context = providedContext || gestalt.getContext();
    const name = argv[param];

    // Check if workspace property is required
    if (name) {

        const cache = gestaltContext.getResourceIdCache('provider');

        // first, look in cache
        if (cache[name]) {
            console.log(`Using cached id for provider ${name}`);
            return {
                id: cache[name],
                name: name
            };
        }

        // Not found in cache, look up ID by name
        let providers = null;
        if (context.environment && context.environment.id) {
            providers = await gestalt.fetchEnvironmentProviders(context, optionalType);
        } else {
            providers = await gestalt.fetchOrgProviders(['root'], optionalType);
        }

        for (let p of providers) {
            if (p.name == name) {
                // found it, write to cache
                cache[p.name] = p.id;
                gestaltContext.saveResourceIdCache('provider', cache);

                return {
                    id: p.id,
                    name: p.name
                };
                break;
            }
        }
        throw Error(`Could not find provider with name '${name}'`);
    } else {
        throw Error(`Missing --${param} property`);
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

exports.lookupEnvironmentResourcebyName = async function (name, type, context) {
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

/**
 * Resolves a context object given a context path.
 * Supports the following path structures:
 * - "/<fqon>"
 * - "/<fqon>/<workspace name>"
 * - "/<fqon>/<workspace name>/<environment name>"
 * @param {*} path An absolute context path specifiying a target org, workspace, or environment
 */
exports.resolveContextPath = async function (path) {
    path = path.split('/');
    
    debug('Context path:');
    debug(path)
    
    if (path[0] != "") throw Error("Path must start with '/'");
    const orgName = path[1];
    const workspaceName = path[2];
    const environmentName = path[3];

    const context = {}; // Start with empty context, then populate it
    if (orgName) {
        await resolveOrgContextByName(context, orgName);
        if (workspaceName) {
            await resolveWorkspaceContextByName(context, workspaceName);
            if (environmentName) {
                await resolveEnvironmentContextByName(context, environmentName);
            }
        }
    }
    debug(context);
    return context;
}

async function resolveOrgContextByName(context, name) {
    let found = false;
    const orgs = await gestalt.fetchOrgFqons();
    for (let org of orgs) {
        if (org == name) {
            // found it
            context.org = {
                fqon: org
            };
            found = true;
            break;
        }
    }
    if (!found) throw Error(`Could not find org with fqon '${name}'`);
}

async function resolveWorkspaceContextByName(context, name) {
    let found = false;
    const orgWorkspaces = await gestalt.fetchOrgWorkspaces([context.org.fqon]);
    for (let ws of orgWorkspaces) {
        if (ws.name == name) {
            // found it
            context.workspace = {
                id: ws.id,
                name: ws.name
            };
            found = true;
            break;
        }
    }
    if (!found) throw Error(`Could not find workspace with name '${name}'`);
}


async function resolveEnvironmentContextByName(context, name) {
    let found = false;
    const envs = await gestalt.fetchWorkspaceEnvironments(context);
    for (let env of envs) {
        if (env.name == name) {
            // found it
            context.environment = {
                id: env.id,
                name: env.name
            };
            found = true;
            break;
        }
    }
    if (!found) throw Error(`Could not find environment with name '${name}'`);
}


async function requireOrgArg(argv, context) {
    // Check if org property is required
    if (argv.org) {
        await resolveOrgContextByName(context, argv.org);
    } else {
        if (!context.org || !context.org.fqon) {
            throw Error(`Missing --org property, not found in current context`);
        }
    }
    // console.log(`Using '${context.org.fqon}' org.`)
}

async function requireWorkspaceArg(argv, context) {

    // Check if workspace property is required
    if (argv.workspace) {
        await resolveWorkspaceContextByName(context, argv.workspace);
    } else {
        if (!context.workspace || !context.workspace.id) {
            throw Error(`Missing --workspace property, not found in current context`);
        }
    }
}

async function requireEnvironmentArg(argv, context) {

    // Check if environment property is required
    if (argv.environment) {
        await resolveEnvironmentContextByName(context, argv.environment);
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
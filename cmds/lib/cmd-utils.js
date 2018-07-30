const gestalt = require('./gestalt')
const gestaltContext = require('./gestalt-context')
const debug = require('./debug').debug;

/**
 * Accepts a context containing org and/or workspace and/or environment names, and populates
 * the context with IDs
 * @returns context object
 * @param scope org | workspace | environment
 * @param contextIn Context object with org/workspace/environment names to be resolved to IDs
 */
async function resolveContext(scope, contextIn) {
    const context = Object.assign({}, contextIn);
    if (scope == 'org') {
        await resolveOrg(context, context.org.fqon);
        return context;
    }

    if (scope == 'workspace') {
        await resolveOrg(context, context.org.fqon);
        await resolveWorkspace(context, context.workspace.name);
        return context;
    }

    if (scope == 'environment') {
        await resolveOrg(context, context.org.fqon);
        await resolveWorkspace(context, context.workspace.name);
        await resolveEnvironment(context, context.environment.name);
        return context;
    }
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

exports.resolveContextPath = async function (path) {
    path = path.split('/');
    const org = path[0];
    const ws = path[1];
    const env = path[2];

    const context = {};
    if (org) {
        await resolveOrg(context, org);
        if (ws) {
            await resolveWorkspace(context, ws);
            if (env) {
                await resolveEnvironment(context, env);
            }
        }
    }
    debug(context);
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

async function resolveOrg(context, org) {
    context.org = { fqon: org };
}

async function resolveWorkspace(context, workspaceName) {
    if (!context.org) throw Error('Missing context.org');
    if (!context.org.fqon) throw Error('Missing context.org.fqon');

    // Look up ID by name
    const orgWorkspaces = await gestalt.fetchOrgWorkspaces([context.org.fqon]);
    let target = null;
    for (let ws of orgWorkspaces) {
        if (ws.name == workspaceName) {
            // found it
            target = {
                id: ws.id,
                name: ws.name
            };
            break;
        }
    }
    if (!target) throw Error(`Could not find workspace with name '${workspaceName}'`);
    context.workspace = target;
}

async function resolveEnvironment(context, environmentName) {
    if (!context.org) throw Error('Missing context.org');
    if (!context.org.fqon) throw Error('Missing context.org.fqon');
    if (!context.workspace) throw Error('Missing context.workspace');
    if (!context.workspace.id) throw Error('Missing context.workspace.id');

    // Look up ID by name
    const envs = await gestalt.fetchWorkspaceEnvironments(context);
    let target = null;
    for (let env of envs) {
        if (env.name == environmentName) {
            // found it
            target = {
                id: env.id,
                name: env.name
            };
            break;
        }
    }
    if (!target) throw Error(`Could not find environment with name '${environmentName}'`);
    context.environment = target;
}

exports.requireWorkspaceArg = requireWorkspaceArg;
exports.requireEnvironmentArg = requireEnvironmentArg
exports.requireOrgArg = requireOrgArg;

async function requireOrgArg(argv, context) {
    // Check if org property is required
    if (argv.org) {
        context.org = { fqon: argv.org }
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
        await resolveWorkspace(context, argv.workspace);
    } else {
        if (!context.workspace || !context.workspace.id) {
            throw Error(`Missing --workspace property, not found in current context`);
        }
    }
}

async function requireEnvironmentArg(argv, context) {

    // Check if environment property is required
    if (argv.environment) {
        await resolveEnvironment(context, argv.environment);
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
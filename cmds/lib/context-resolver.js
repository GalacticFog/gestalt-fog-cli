const gestalt = require('./gestalt');
const gestaltContext = require('./gestalt-context');
const { debug } = require('./debug');
const selectHierarchy = require('../lib/selectHierarchy');

//TODO: Move 'requireArg' functions to separate library

module.exports = {
    resolveProvider,
    resolveProviderByPath,
    resolveContextFromProviderPath,
    resolveOrg,
    resolveWorkspace,
    resolveEnvironment,
    resolveEnvironmentApi,
    resolveEnvironmentContainer,
    resolveEnvironmentLambda,
    lookupEnvironmentResourcebyName,
    resolveContextPath,
    requireArgs,
    getContextFromPathOrPrompt
};

async function getContextFromPathOrPrompt(argv /*TODO: ,scope='any'*/) {
    let context = null;
    if (argv.path) {
        context = await resolveContextPath(argv.path);
    } else {
        // Load from state
        context = gestalt.getContext();

        if (!context.org || !context.org.fqon) {
            // No arguments, allow choosing interatively
            context = await selectHierarchy.chooseContext({ includeNoSelection: true });
        }
    }

    return context;
}

function requireArgs(argv, requiredArgs) {
    for (let s of requiredArgs) {
        if (!argv[s]) throw Error(`Missing --${s} property`);
    }
}

function requireOrgArg(argv, context) {
    // Check if org property is required
    if (argv.org) {
        context.org = { fqon: argv.org };
    } else {
        if (!context.org || !context.org.fqon) {
            throw Error('Missing --org property, not found in current context');
        }
    }
    // console.log(`Using '${context.org.fqon}' org.`)
}

async function resolveOrgContextByName(context, name) {
    const orgs = await gestalt.fetchOrgFqons();
    const fqon = orgs.find(i => i === name);

    if (fqon) {
        return {
            ...context,
            org: { fqon },
        };
    }

    throw Error(`Could not find org with fqon '${name}'`);
}

async function resolveWorkspaceContextByName(context, name) {
    const { org } = context;
    const orgWorkspaces = await gestalt.fetchOrgWorkspaces([org.fqon]);
    const workspace = orgWorkspaces.find(i => i.name === name);

    if (workspace) {
        return {
            ...context,
            workspace: {
                id: workspace.id,
                name: workspace.name
            }
        };
    }

    throw Error(`Could not find workspace with name '${name}'`);
}

async function resolveEnvironmentContextByName(context, name) {
    const envs = await gestalt.fetchWorkspaceEnvironments(context);
    const env = envs.find(i => i.name === name);

    if (env) {
        return {
            ...context,
            environment: {
                id: env.id,
                name: envs.name
            }
        };
    }

    throw Error(`Could not find environment with name '${name}'`);
}

/**
 * Resolves a context object given a context path.
 * Supports the following path structures:
 * - "/<fqon>"
 * - "/<fqon>/<workspace name>"
 * - "/<fqon>/<workspace name>/<environment name>"
 * @param {*} path An absolute context path specifiying a target org, workspace, or environment
 */
async function resolveContextPath(path) {
    const [unused, orgName, workspaceName, environmentName] = path.split('/');
    debug('Context path: ', path);

    if (unused) throw Error("Path must start with '/'");

    let context = {};

    if (orgName) {
        context = await resolveOrgContextByName(context, orgName);
        if (workspaceName) {
            context = await resolveWorkspaceContextByName(context, workspaceName);
            if (environmentName) {
                context = await resolveEnvironmentContextByName(context, environmentName);
            }
        }
    }

    debug(context);

    return context;
}

const providerPathCache = {};

async function resolveProviderByPath(providerPath) {
    const pathElements = providerPath.split('/');

    debug(pathElements);

    const providerName = pathElements.pop();

    debug(pathElements);

    debug('providerName: ' + providerName);

    const contextPath = pathElements.join('/')
    const context = await resolveContextPath(contextPath);

    debug('context: ' + context);

    const cachedProviders = providerPathCache[contextPath];
    if (cachedProviders) {
        const provider = cachedProviders.find(p => p.name == providerName);

        debug(`Returning cached provider value for path '${providerPath}'`);
        return provider;
    } else {
        const providers = await gestalt.fetchProviders(context);

        // Save to cache
        providerPathCache[contextPath] = providers;

        debug('providers: ' + providers)
        const provider = providers.find(p => p.name == providerName);
        return provider;
        throw Error(`Could not resolve provider for path '${providerPath}'`);
    }
}

async function resolveContextFromProviderPath(providerPath) {
    const pathElements = providerPath.split('/');

    debug(pathElements);

    const providerName = pathElements.pop();

    debug(pathElements);

    debug('providerName: ' + providerName);

    const contextPath = pathElements.join('/')
    const context = await resolveContextPath(contextPath);

    debug('context: ' + context);
    return context;
}

async function resolveProvider(argv, providedContext, optionalType, param = 'provider') {
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
        let providers = await gestalt.fetchProviders(context, optionalType);

        for (let p of providers) {
            if (p.name == name) {
                // found it, write to cache
                cache[p.name] = p.id;
                gestaltContext.saveResourceIdCache('provider', cache);

                return {
                    id: p.id,
                    name: p.name
                };

                break; // this is unreachable
            }
        }
        throw Error(`Could not find provider with name '${name}'`);
    } else {
        throw Error(`Missing --${param} property`);
    }
}

async function resolveOrg(argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);

    return context;
}

async function resolveWorkspace(argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);

    return context;
}

async function resolveEnvironment(argv, optionalContext = {}) {
    const context = optionalContext || gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);
    await requireEnvironmentArg(argv, context);

    return context;
}

async function resolveEnvironmentApi(argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);
    await requireEnvironmentArg(argv, context);
    await requireEnvironmentApiArg(argv, context);

    return context;
}

async function resolveEnvironmentContainer(argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);
    await requireEnvironmentArg(argv, context);
    await requireEnvironmentContainerArg(argv, context);

    return context;
}

async function resolveEnvironmentLambda(argv) {
    const context = gestalt.getContext();
    await requireOrgArg(argv, context);
    await requireWorkspaceArg(argv, context);
    await requireEnvironmentArg(argv, context);
    await requireEnvironmentLambdaArg(argv, context);

    return context;
}

async function lookupEnvironmentResourcebyName(name, type, context) {
    const resources = await gestalt.fetchEnvironmentResources(type, context);
    for (let res of resources) {
        if (name == res.name) {
            return {
                id: res.id,
                name: res.name
            };
        }
    }

    throw Error(`Environment '${type}' resource with name '${name}' not found`);
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
            throw Error('Missing --workspace property, not found in current context');
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
            throw Error('Missing --environment property, not found in current context');
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
        throw Error('Missing --api property');
    }
}

async function requireEnvironmentContainerArg(argv, context) {
    if (argv.container) {
        context.container = {};
        const resources = await gestalt.fetchContainers(context);
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
        throw Error('Missing --container property');
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
        throw Error('Missing --lambda property');
    }
}

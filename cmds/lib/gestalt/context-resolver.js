// Gestalt stuff
const { debug } = require('../debug');

const {
    fetchOrgResources,
    fetchWorkspaceResources
} = require('./generic');

// Exports

module.exports = {
    
    // Just for context-resolver
    contextResolver: {
        resolveContextPath
    }
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
        context = { org: { fqon: orgName } }
        if (workspaceName) {
            context = await resolveWorkspaceContextByName(context, workspaceName);
            if (environmentName) {
                context = await resolveEnvironmentContextByName(context, environmentName);
            }
        }
    }

    debug(context);

    return context;

    // ------------ functions ------------------

    async function resolveWorkspaceContextByName(context, name) {
        const { org } = context;
        const orgWorkspaces = await fetchOrgResources("workspaces", [org.fqon]);
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
        const envs = await fetchWorkspaceResources('environments', context);
        const env = envs.find(i => i.name === name);

        if (env) {
            return {
                ...context,
                environment: {
                    id: env.id,
                    name: env.name
                }
            };
        }

        throw Error(`Could not find environment with name '${name}'`);
    }
}

const {
    fetchOrgResources,
    getGestaltContext
} = require('./generic');

const meta = require('./metaclient');

exports.fetchProviders = (context, type) => {
    if (context.org) {
        if (context.workspace) {
            if (context.environment) {
                return fetchEnvironmentProviders(context, type);
            }
            return fetchWorkspaceProviders(context, type);
        }
        return fetchOrgProviders([context.org.fqon], type);
    }
    throw Error(`Context doesn't contain org info`);
}

function fetchOrgProviders(fqonList, type) {
    return fetchOrgResources("providers", fqonList, type);
}

// TODO: Unsure if this gets all providers
function fetchEnvironmentProviders(providedContext, type) {
    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.environment) throw Error("No Environment in current context");
    if (!context.environment.id) throw Error("No Environment ID in current context");
    let url = `/${context.org.fqon}/environments/${context.environment.id}/providers?expand=true`;
    if (type) url += `&type=${type}`;
    return meta.GET(url).then(providers => {
        for (let c of providers) {
            c.environment = context.environment;
            c.workspace = context.workspace;
        }
        return providers;
    });
}

function fetchWorkspaceProviders(providedContext, type) {
    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("No Org in current context");
    if (!context.org.fqon) throw Error("No FQON in current context");
    if (!context.workspace) throw Error("No Environment in current context");
    if (!context.workspace.id) throw Error("No Environment ID in current context");
    let url = `/${context.org.fqon}/workspaces/${context.workspace.id}/providers?expand=true`;
    if (type) url += `&type=${type}`;
    return meta.GET(url).then(providers => {
        for (let c of providers) {
            // c.environment = context.environment;
            c.workspace = context.workspace;
        }
        return providers;
    });
}

// exports.createOrgProvider = (provider, parentFqon) => {
//     if (!provider) throw Error('missing provider');
//     if (!provider.name) throw Error('missing provider.name');

//     const context = parentFqon ? { org: { fqon: parentFqon } } : getGestaltContext();
//     if (!context.org) throw Error("missing context.org");
//     if (!context.org.fqon) throw Error("missing context.org.fqon");
//     const res = meta.POST(`/${context.org.fqon}/providers`, provider);
//     return res;
// }

// TODO createWorkspaceProvider
// TODO createEnvironmentProvider
// TODO createProvider --> createOrgProvider, createWorkspaceProvider, createEnvironmentProvider

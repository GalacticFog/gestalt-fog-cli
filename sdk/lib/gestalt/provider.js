const {
    fetchOrgResources,
    // getgestaltSession,
    fetchWorkspaceResources,
    fetchEnvironmentResources
} = require('./generic');

// const meta = require('./metaclient');

exports.fetchProviders = (context, type, options) => {
    options = options || { noProviderFilter: true };
    if (context.org) {
        if (context.workspace) {
            if (context.environment) {
                return fetchEnvironmentProviders(context, type, options);
            }
            return fetchWorkspaceProviders(context, type, options);
        }
        return fetchOrgProviders([context.org.fqon], type, options);
    }
    throw Error(`fetchProviders: Context doesn't contain org info`);
}

function fetchOrgProviders(fqonList, type, options = {}) {
    return fetchOrgResources("providers", fqonList, type, options);
}

// TODO: Unsure if this gets all providers
function fetchEnvironmentProviders(providedContext, type, options = {}) {
    return fetchEnvironmentResources('providers', providedContext, type, options);
}

function fetchWorkspaceProviders(providedContext, filterType, options = {}) {
    return fetchWorkspaceResources('providers', providedContext, filterType, options);
}

// exports.createOrgProvider = (provider, parentFqon) => {
//     if (!provider) throw Error('missing provider');
//     if (!provider.name) throw Error('missing provider.name');

//     const context = parentFqon ? { org: { fqon: parentFqon } } : getgestaltSession();
//     if (!context.org) throw Error("missing context.org");
//     if (!context.org.fqon) throw Error("missing context.org.fqon");
//     const res = meta.POST(`/${context.org.fqon}/providers`, provider);
//     return res;
// }

// TODO createWorkspaceProvider
// TODO createEnvironmentProvider
// TODO createProvider --> createOrgProvider, createWorkspaceProvider, createEnvironmentProvider

const {
    fetchOrgResources,
    fetchEnvironmentResources,
    fetchWorkspaceResources,
} = require('./generic');

exports.fetchEntitlements = (context) => {
    if (context.org) {
        if (context.workspace) {
            if (context.environment) {
                return fetchEnvironmentResources("entitlements", context);
            }
            return fetchWorkspaceResources("entitlements", context);
        }
        return fetchOrgResources("entitlements", [context.org.fqon]);
    }
    throw Error(`Context doesn't contain org info`);
}

// exports.fetchOrgEntitlements = (context) => {
//     return fetchOrgResources("entitlements", [context.org.fqon]);
// }

// exports.fetchWorkspaceEntitlements = (context) => {
//     return fetchWorkspaceResources("entitlements", context);
// }

// exports.fetchEnvironmentEntitlements = (context) => {
//     return fetchEnvironmentResources("entitlements", context);
// }

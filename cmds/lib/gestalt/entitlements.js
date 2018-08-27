const {
    fetchOrgResources,
    fetchEnvironmentResources,
    fetchWorkspaceResources,
} = require('./generic');

exports.fetchOrgEntitlements = (context) => {
    return fetchOrgResources("entitlements", [context.org.fqon]);
}

exports.fetchWorkspaceEntitlements = (context) => {
    return fetchWorkspaceResources("entitlements", context);
}

exports.fetchEnvironmentEntitlements = (context) => {
    return fetchEnvironmentResources("entitlements", context);
}

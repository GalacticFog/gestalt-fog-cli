const {
    fetchResources,
} = require('./generic');

exports.fetchEntitlements = (context) => {
    return fetchResources('entitlements', context);
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

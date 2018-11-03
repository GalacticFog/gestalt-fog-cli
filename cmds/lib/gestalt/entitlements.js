const {
    fetchResources,
} = require('./generic');

const meta = require('./metaclient');

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

exports.updateEntitlement = (context, entitlement) => {

    /* Example payload to update identities
    {
        "id": "5d8bd69b-105f-4421-a497-0978e550ebb7",
        "name": "d4afaf1f-27cd-49a3-a656-0181c21013be.workspace.create",
        "properties": {
            "action": "workspace.create",
            "identities": [
                "621ebac3-af0a-4e2d-9033-6dda33df2ea9",
                "73cdeaf7-7bd3-4d68-98f3-67232cd3e389"
            ]
        }
    }
    */

    if (!context) throw Error('missing context');
    if (!context.org) throw Error('missing context.org');
    if (!context.org.fqon) throw Error('missing context.org.fqon');
    if (!entitlement) throw Error('missing entitlement');
    if (!entitlement.id) throw Error('missing entitlement.id');
    if (!entitlement.name) throw Error('missing entitlement.name');
    if (!entitlement.properties) throw Error('missing entitlement.properties');
    if (!entitlement.org) throw Error('missing entitlement.org');
    if (!entitlement.org.properties) throw Error('missing entitlement.org.properties');
    if (!entitlement.org.properties.fqon) throw Error('missing entitlement.org.properties.fqon');
    if (!entitlement.properties.action) throw Error('missing entitlement.properties.action');
    if (!entitlement.properties.identities) throw Error('missing entitlement.properties.identities');

    if (context.org.fqon != entitlement.org.properties.fqon) throw Error(`Context org and entitlement org don't match!`);

    // Create a minimal payload to PUT
    const payload = {
        id: entitlement.id,
        name: entitlement.name,
        properties: {
            action: entitlement.properties.action,
            identities: entitlement.properties.identities
        }
    }

    return meta.PUT(`/${context.org.fqon}/entitlements/${entitlement.id}`, payload);
}
const meta = require('./metaclient');

exports.fetchProviderContainers = (providerSpec) => {
    if (!providerSpec.org) throw Error("No Org in current context");
    if (!providerSpec.org.properties) throw Error("No FQON in current context");
    if (!providerSpec.org.properties.fqon) throw Error("No FQON in current context");
    const fqon = providerSpec.org.properties.fqon; // default org
    return meta.GET(`/${fqon}/providers/${providerSpec.id}/containers`); // can't use '?expand=true' unless in environment
}

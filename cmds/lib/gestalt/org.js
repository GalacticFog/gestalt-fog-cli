const {
    getGestaltContext
} = require('./generic');

const meta = require('./metaclient');

exports.fetchOrgFqons = () => {
    return meta.GET('/orgs?expand=true').then(res => {
        return res.map(item => item.properties.fqon).sort();
    });
}

// exports.fetchOrgFqons = () => {
//     const res = meta.GET('/orgs?expand=true');
//     const list = res.map(item => item.properties.fqon).sort();
//     return list;
// }

exports.fetchOrg = (contextOrFqon) => {
    const fqon = typeof contextOrFqon === 'string' ? contextOrFqon : contextOrFqon.org.fqon;
    return meta.GET(`/${fqon}`);
}

exports.fetchOrgs = () => {
    return meta.GET('/orgs?expand=true');
}

exports.createOrg = (org, parentFqon) => {
    if (!org) throw Error('missing org');
    if (!org.name) throw Error('missing org.name');

    const context = parentFqon ? { org: { fqon: parentFqon } } : getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    const res = meta.POST(`/${context.org.fqon}`, org);
    return res;
}

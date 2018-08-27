const {
    fetchOrgResources,
    fetchResourcesFromOrgEnvironments,
    fetchEnvironmentResources,
    fetchResource,
    createEnvironmentResource,
} = require('./generic');

const meta = require('./metaclient');

exports.fetchOrgApis = (fqonList) => {
    // return fetchResourcesFromOrgEnvironments("apis", fqonList);
    
    // APIs can be retrieved directly from the org level
    return fetchOrgResources("apis", fqonList);
}

exports.fetchEnvironmentApis = (providedContext) => {
    return fetchEnvironmentResources('apis', providedContext);
}

exports.fetchApi = (spec, context) => {
    return fetchResource('apis', spec, context);
}

exports.fetchApiEndpoints = (apiList) => {
    if (!apiList) throw Error("No apiList provided");

    let eps = apiList.map(api => {
        const res = meta.GET(`/${api.fqon}/apis/${api.id}/apiendpoints?expand=true`)
        return res;
    });

    return Promise.all(eps).then(results => {
        return [].concat.apply([], results);
    });
}


exports.createApiEndpoint = (spec, providedContext) => {
    if (!spec) throw Error('missing spec');
    if (!spec.name) throw Error('missing spec.name');
    // TODO: Other required parameters

    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.api) throw Error("missing context.api");
    if (!context.api.id) throw Error("missing context.api.id");
    return meta.POST(`/${context.org.fqon}/apis/${context.api.id}/apiendpoints`, spec);
}

exports.createApi = (spec, providedContext) => {
    return createEnvironmentResource('apis', spec, providedContext);
}

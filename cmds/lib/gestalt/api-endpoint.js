const meta = require('./metaclient');

const {
    getGestaltContext
} = require('./generic');

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
    // TODO: Untested
    console.error('/lib/gestalt/api-endpoint.js:createApiEndpoint is untested');

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

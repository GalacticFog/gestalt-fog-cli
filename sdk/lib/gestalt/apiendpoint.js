const meta = require('./metaclient');
const util = require('../util');

const {
    getgestaltSession,
    createResource
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

exports.createApiEndpoint = (spec, context) => {
    spec = util.cloneObject(spec);
    spec.resource_type = 'Gestalt::Resource::ApiEndpoint';
    return createResource(spec, context);
}

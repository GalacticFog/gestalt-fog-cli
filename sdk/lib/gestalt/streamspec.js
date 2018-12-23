const {
    fetchEnvironmentResources,
    createEnvironmentResource,
    fetchResource
} = require('./generic');

exports.fetchStreamSpecs = (context) => {
    return fetchEnvironmentResources('streamspecs', context); // Must be at environment
}

exports.fetchStreamspec = (spec, context) => {
    return fetchResource('streamspecs', spec, context);
}

exports.createStreamspec = (spec, context) => {
    return createEnvironmentResource('streamspecs', spec, context);
}

exports.updateStreamspec = (spec, context) => {
    return updateResource('streamspecs', spec, context);
}

exports.deleteStreamspec = (spec) => {
    return deleteResource('streamspecs', spec);
}

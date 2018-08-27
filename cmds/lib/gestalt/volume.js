const {
    fetchEnvironmentResources,
    createEnvironmentResource,
    fetchResource,
} = require('./generic');

exports.fetchVolumes = (context) => {
    return fetchEnvironmentResources('volumes', context);  // Must be at environment
}

exports.fetchVolume = async (context, spec) => {
    return fetchResource('volumes', spec, context);
}

exports.createSecret = (spec, context) => {
    return createEnvironmentResource('volumes', spec, context);
}

exports.updateSecret = (spec, context) => {
    return updateResource('volumes', spec, context);
}

exports.deleteSecret = (spec) => {
    return deleteResource('volumes', spec);
}

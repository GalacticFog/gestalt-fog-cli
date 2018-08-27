const {
    fetchEnvironmentResources,
    createEnvironmentResource,
    fetchResource,
} = require('./generic');

exports.fetchSecrets = (context) => {
    return fetchEnvironmentResources('secrets', context);
}

exports.fetchSecret = async (context, spec) => {
    return fetchResource('secrets', spec, context);
}

exports.createSecret = (spec, context) => {
    return createEnvironmentResource('secrets', spec, context);
}

exports.updateSecret = (spec, context) => {
    return updateResource('secrets', spec, context);
}

exports.deleteSecret = (spec) => {
    return deleteResource('secrets', spec);
}

const {
    fetchEnvironmentResources,
    createEnvironmentResource,
    fetchResource,
} = require('./generic');

exports.fetchDatafeeds = (context) => {
    return fetchEnvironmentResources('datafeeds', context);
}

exports.fetchDatafeed = (spec, context) => {
    return fetchResource('datafeeds', spec, context);
}

exports.createDatafeed = (spec, context) => {
    return createEnvironmentResource('datafeeds', spec, context);
}

exports.updateDatafeed = (spec, context) => {
    return updateResource('datafeeds', spec, context);
}

exports.deleteDatafeed = (spec) => {
    return deleteResource('datafeeds', spec);
}

const {
    fetchResources,
    fetchEnvironmentResources
} = require('./generic');

exports.fetchPolicies = (context) => {
    return fetchResources('policies', context);
}

exports.fetchEnvironmentPolicies = (providedContext) => {
    return fetchEnvironmentResources('policies', providedContext);
}

exports.fetchPolicy = async (context, spec) => {
    if (!spec) throw Error('No spec')
    if (!spec.name && !spec.id) throw Error('No spec.name or spec.id fields')

    const policies = await this.fetchPolicies(context);
    const matchParam = spec.id ? 'id' : 'name';
    return policies.find(p => p[matchParam] == spec[matchParam]);
}

exports.updatePolicy = (spec, context) => {
    return updateResource('policies', spec, context);
}

exports.deletePolicy = (spec) => {
    return deleteResource('policies', spec);
}


// TODO: create, update, delete policy rules

exports.createPolicy = (spec, providedContext) => {

    // TODO: if Workspace or Environment

    return createEnvironmentResource('policies', spec, providedContext);
}

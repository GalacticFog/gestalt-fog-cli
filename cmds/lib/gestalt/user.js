const {
    fetchOrgResources,
    createOrgResource,
    deleteResource
} = require('./generic');

exports.fetchUsers = () => {
    return fetchOrgResources('users', ['root']); // Must be at root Org
}

exports.createUser = (spec) => {
    return createOrgResource('users', spec, { org: { fqon: 'root' } }); // Must be at root Org
}

exports.deleteUser = (spec, options) => {
    return deleteResource('users', spec, options);
}

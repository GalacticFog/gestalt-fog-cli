const {
    fetchOrgResources,
} = require('./generic');

exports.fetchUsers = () => {
    return fetchOrgResources("users", ['root']); // Must be at root Org
}

exports.fetchGroups = () => {
    return fetchOrgResources("groups", ['root']); // Must be at root Org
}

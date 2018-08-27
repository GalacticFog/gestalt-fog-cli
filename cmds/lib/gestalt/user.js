const {
    fetchOrgResources,
} = require('./generic');

exports.fetchUsers = () => {
    return fetchOrgResources("users", ['root']);
}

exports.fetchGroups = () => {
    return fetchOrgResources("groups", ['root']);
}

exports.run = async () => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    const res = await gestalt.fetchOrgs();

    const options = {
        mode: 'autocomplete',
        message: "Select Org",
        fields: ['description', 'properties.fqon', 'owner.name'],
        sortBy: 'fqon',
        resources: res.map(r => {
            r.fqon = r.properties.fqon;
            return r;
        })
    };
    return selectResource.run(options);
}

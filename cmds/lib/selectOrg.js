exports.run = async (opts) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    const res = await gestalt.fetchOrgs();

    const options = {
        mode: 'autocomplete',
        message: "Select Org",
        fields: ['properties.fqon', 'description', 'owner.name'],
        sortBy: 'fqon',
        resources: res.map(r => {
            r.fqon = r.properties.fqon;
            return r;
        })
    };

    if (opts.includeNoSelection) {
        // Add the 'null' selection
        options.resources = [null].concat(options.resources);
    }

    return selectResource.run(options);
}

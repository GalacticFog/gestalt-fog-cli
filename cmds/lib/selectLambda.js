exports.run = async (opts, res) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    if (!res) res = await gestalt.fetchLambdas();

    if (opts.name) {
        res = res.filter(c => {
            return c.name == opts.name;
        })
    }

    if (res.length == 0) return null;
    if (res.length == 1) return res[0];

    let options = {
        mode: 'autocomplete',
        message: "Select Lambda",
        fields: ['name', 'properties.runtime', 'properties.public', 'org.properties.fqon', 'properties.code_type', 'owner.name', 'id'],
        sortBy: 'name',
        resources: res
    }

    // merge in user specified options
    options = Object.assign(options, opts);

    return selectResource.run(options);
}

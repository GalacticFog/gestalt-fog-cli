exports.run = async (opts, res, context) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    if (!res) res = await gestalt.fetchEnvironmentPolicies(context)
    if (opts.name) {
        res = res.filter(c => {
            return c.name == opts.name;
        })
    }

    // if (res.length == 0) return null;
    // if (res.length == 1) return res[0];

    let options = {
        mode: 'autocomplete',
        message: "Select Policies(s)",
        fields: ['name', 'description', 'owner.name', 'created.timestamp'],
        sortBy: 'name',
        resources: res
    }

    // merge in user specified options
    options = Object.assign(options, opts);

    return selectResource.run(options);
}

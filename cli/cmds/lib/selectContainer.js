exports.run = async (opts, res) => {
    const { gestalt } = require('gestalt-fog-sdk')
    const selectResource = require('./selectResourceUI');

    if (!res) res = await gestalt.fetchContainers();
    if (opts.name) {
        res = res.filter(c => {
            return c.name == opts.name;
        })
    }

    // if (res.length == 0) return null;
    // if (res.length == 1) return res[0];

    let options = {
        mode: 'autocomplete',
        message: "Select Container(s)",
        fields: ['name', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'properties.provider.name'],
        sortBy: 'name',
        resources: res
    }

    // merge in user specified options
    options = Object.assign(options, opts);

    return selectResource.run(options);
}

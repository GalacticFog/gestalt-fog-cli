exports.run = async (opts) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    const res = await gestalt.fetchContainers();

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


exports.run = async (opts, items) => {
    const selectResource = require('./selectResourceUI');

    const options = {
        mode: 'autocomplete',
        message: "Select Item",
        fields: ['name'],
        sortBy: 'name',
        resources: items
    };

    Object.assign(options, opts);

    return selectResource.run(options).then(i => i.map(j => j.value));
}

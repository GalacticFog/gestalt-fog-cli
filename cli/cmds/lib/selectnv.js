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

    return selectResource.run(options).then(i => {
        if (Array.isArray(i)) {
            return i.map(j => j.value)
        } else {
            return i.value;
        }
    });
}

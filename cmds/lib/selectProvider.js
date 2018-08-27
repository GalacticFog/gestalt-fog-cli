exports.run = async (opts, context) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    let res = gestalt.fetchProviders(context, opts.type);

    if (opts) {
        if (opts.filter) {
            res = res.filter(opts.filter);
        }
    }

    // if (res.length == 1) {
    //     console.log('only one...')
    //     return new Promise(resolve => { resolve(res[0]) });
    // }

    const options = {
        mode: opts.mode || 'autocomplete',
        message: opts.message || "Select Provider",
        fields: ['name', /*'description',*/ 'resource_type', 'org.properties.fqon', 'owner.name', 'id'/*'created.timestamp'*/],
        sortBy: 'name',
        resources: res.map(item => {
            item.resource_type = item.resource_type.replace(/Gestalt::Configuration::Provider::/, '');
            return item;
        })
    }

    return selectResource.run(options);
}
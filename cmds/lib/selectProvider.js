#!/usr/bin/env node

exports.run = (opts, callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    const options = {
        mode: 'autocomplete',
        message: opts.message || "Select Provider",
        fields: ['name', /*'description',*/ 'resource_type', 'org.properties.fqon', 'owner.name', 'id'/*'created.timestamp'*/],
        sortBy: 'name',
        fetchFunction: () => {

            const res = gestalt.fetchProviders(null, opts.type);

            // enhance for display
            res.map(item => {
                item.resource_type = item.resource_type.replace(/Gestalt::Configuration::Provider::/, '')
            })
            return res;
        }
    }

    selectResource.run(options, selection => {
        if (callback) callback(selection);
    });
}


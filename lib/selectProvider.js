#!/usr/bin/env node

exports.run = (callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    const options = {
        mode: 'autocomplete',
        message: "Select Provider",
        fields: ['name', /*'description',*/ 'resource_type', 'org.properties.fqon', 'owner.name', 'id'/*'created.timestamp'*/],
        sortBy: 'name',
        fetchFunction: () => {

            const res = gestalt.fetchProviders();

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


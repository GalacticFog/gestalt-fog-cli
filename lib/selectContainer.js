#!/usr/bin/env node

exports.run = (callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    const options = {
        mode: 'autocomplete',
        message: "Select Container",
        fields: ['name', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'properties.provider.name'],
        sortBy: 'name',
        fetchFunction: () => {

            const res = gestalt.fetchContainers();

            // enhance for display
            res.map(r => {
                r.running_instances = `${r.properties.tasks_running} / ${r.properties.num_instances}`,
                r.fqon = r.org.properties.fqon
            })
            return res;
        }
    }

    selectResource.run(options, selection => {
        if (callback) callback(selection.value);
    });
}


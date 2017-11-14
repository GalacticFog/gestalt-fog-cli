#!/usr/bin/env node

exports.run = (callback) => {
    const argv = require('yargs').argv
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    selectResource.mode = 'autocomplete';

    function sortBy(arr, key) {
        return arr.sort((a, b) => {
            if (a[key] < b[key]) { return -1; }
            if (a[key] > b[key]) { return 1; }
            return 0;
        })
    }

    const options = {
        message: "Select Container",
        valueKey: 'value',
        fields: ['name', 'properties.status', 'properties.image', 'running_instances', 'owner.name'],
        returnValue: "container",
        fetchFunction: () => {

            let fqon = gestalt.getState().org.fqon;
            let ws = gestalt.getState().workspace;

            var res = gestalt.fetchContainers();
            res.map(r => {
                r.value = {
                    id: r.id,
                    name: r.name,
                    description: r.description
                };

                r.running_instances = `${r.properties.tasks_running} / ${r.properties.num_instances}`
            });
            return sortBy(res, 'description');
        }
    }

    selectResource.run(options, answers => {
        gestalt.setCurrentContainer(answers);
        if (callback) callback(answers);        
    });    
}


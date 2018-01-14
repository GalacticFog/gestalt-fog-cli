'use strict';

exports.run = (container, callback) => {
    const selectResource = require('./selectResourceUI');
    const options = {
        mode: 'autocomplete',
        message: "Select Container Instance",
        fields: ['id', 'ipAddresses[0].ipAddress', 'startedAt'],
        sortBy: 'id',
        resources: container.properties.instances || []
    }

    selectResource.run(options, answers => {
        callback(answers);
    });
}
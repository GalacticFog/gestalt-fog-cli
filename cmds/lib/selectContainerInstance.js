'use strict';

exports.run = async (container) => {
    const selectResource = require('./selectResourceUI');
    const options = {
        mode: 'autocomplete',
        message: "Select Container Instance",
        fields: ['id', 'ipAddresses[0].ipAddress', 'startedAt'],
        sortBy: 'id',
        resources: container.properties.instances || []
    }

    return selectResource.run(options);
}
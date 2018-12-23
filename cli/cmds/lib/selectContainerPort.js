exports.run = async (container) => {
    const selectResource = require('./selectResourceUI');

    const options = {
        mode: 'autocomplete',
        message: "Select Container Port",
        fields: ['name', 'service_port', 'expose_endpoint', 'container_port', 'protocol'],
        sortBy: 'name',
        resources: container.properties.port_mappings || []
    }

    return selectResource.run(options);
}

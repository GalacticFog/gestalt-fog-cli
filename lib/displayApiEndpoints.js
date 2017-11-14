#!/usr/bin/env node

exports.run = (eps) => {

    const displayResource = require('./displayResourceUI');

    const options = {
        message: "APIs",
        headers: [
            'Resource Patch',
            'Type',
            'Security',
            'FQON',
            'Workspace',
            'Environment',
            'Synchronous',
            'Methods',
            'Owner'
        ],
        fields: [
            'properties.api_path',
            'properties.implementation_type',
            'properties.plugins.gestaltSecurity.enabled',
            'org.properties.fqon',
            'properties.workspace',
            'properties.environment',
            'properties.synchronous',
            'properties.methods',
            'owner.name'
        ],
        sortField: 'description',
    }


    console.log(JSON.stringify(eps, null, 2))

    // console.log(eps);

    displayResource.run(options, eps);
    console.log();
}

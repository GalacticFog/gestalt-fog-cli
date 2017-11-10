#!/usr/bin/env node
const argv = require('yargs').argv
const gestalt = require('./lib/gestalt')
const displayResource = require('./lib/displayResourceUI');

const options = {
    message: "Containers",
    headers: ['Description', 'Status', 'Name', 'Path', 'Image', 'Instances', 'Owner'],
    fields: ['description', 'properties.status', 'name', 'path', 'properties.image', 'properties.num_instances', 'owner.name'],
    sortField: 'description',
}


if (argv.uuid) {
    const uuid = process.argv[2];
    const res = gestalt.getContainer(uuid);
    console.log(res);

    displayResource.run(options, [res]);
}    
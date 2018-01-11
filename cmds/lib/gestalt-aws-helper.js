#!/usr/bin/env node
const gestaltState = require('./gestalt-state');
const AmazonClient = require('./amazon');
const fs = require('fs');
const selectResource = require('./selectResourceUI');

exports.selectElb = (loadBalancers, callback) => {

    const options = {
        mode: 'autocomplete',
        message: "Select ELB",
        fields: ['name', 'dnsname', 'listeners', 'zones', 'instances'],
        sortBy: 'name',
        fetchFunction: () => {
            return renderElbs(loadBalancers);
        }
    }

    selectResource.run(options, answers => {
        if (callback) callback(answers.value);
    });
}

exports.getAwsClient = (key) => {
    return getAwsClient(key);
}

function getAwsClient(key) {
    const config = loadClusterConfig(key);
    const aws = new AmazonClient(config.aws);
    return aws;
}

function renderElbs(lbs) {

    // Iterate through LBs
    return lbs.LoadBalancerDescriptions.map(lbd => {
        return {
            name: lbd.LoadBalancerName,
            dnsname: lbd.DNSName,
            listeners: `${lbd.ListenerDescriptions.length} listeners`,
            zones: `${lbd.AvailabilityZones.join(',')}`,
            instances: `${lbd.Instances.length} instances`,
            value: Object.assign({}, lbd)
        }
    });
}

function loadClusterConfig(key) {
    const f = gestaltState.getConfigDir() + `/cluster-${key}.json`;
    if (fs.existsSync(f)) {
        const contents = fs.readFileSync(f, 'utf8');
        return JSON.parse(contents);
    }
    throw new Error(`${f} not found`);
}

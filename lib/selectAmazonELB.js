#!/usr/bin/env node
const gestaltState = require('./gestalt-state');
const fs = require('fs');


exports.run = (loadBalancers, callback) => {
    const selectResource = require('./selectResourceUI');

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

exports.getElbs = (key, callback) => {

    const AWS = require('aws-sdk');
    const config = loadConfig(key);

    const elb = new AWS.ELB({ region: config.aws.region });

    var params = {
        LoadBalancerNames: config.aws.elbs
    };

    elb.describeLoadBalancers(params, function (err, lbs) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        } else {

            // console.log(JSON.stringify(lbs, null, 2))

            callback(null, lbs);
        }
    });
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
        }
    });
}

function loadConfig(key) {
    const f = gestaltState.getConfigDir() + `/cluster-${key}.json`;
    if (fs.existsSync(f)) {
        const contents = fs.readFileSync(f, 'utf8');
        return JSON.parse(contents);
    }
    throw new Error(`${f} not found`);
}

#!/usr/bin/env node

exports.run = (opts, elb, callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    let options = {
        mode: 'checkbox',
        message: `Select ELB Listener(s) for '${elb.LoadBalancerName}'`,
        fields: ['LoadBalancerPort', 'Protocol', 'InstancePort', 'InstanceProtocol'],
        sortBy: 'LoadBalancerPort',
        resources: elb.ListenerDescriptions.map(item => {
            return item.Listener;
        })
    }

    // merge in user specified options
    options = Object.assign(options, opts);

    selectResource.run(options, selection => {
        if (callback) callback(selection);
    });
}

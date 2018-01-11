const AWS = require('aws-sdk');

// For interacting with Kubernetes cluster configured with webhook authentication to Gestalt.
class AmazonClient {

    constructor(options) {
        if (!options) throw new Error("options must be specified")
        if (!options.region) throw new Error("missing options.region");
        if (!options.elbs) throw new Error("missing options.elbs");
        this.options = Object.assign({}, options);
    }

    describeLoadBalancers(callback) {
        const elb = new AWS.ELB({ region: this.options.region });
        const params = {
            LoadBalancerNames: this.options.elbs
        };
        elb.describeLoadBalancers(params, callback);
    }

    describeLoadBalancer(name, callback) {
        const elb = new AWS.ELB({ region: this.options.region });
        const params = {
            LoadBalancerNames: [name]
        };
        elb.describeLoadBalancers(params, (err, result) => {
            if (!result.LoadBalancerDescriptions || result.LoadBalancerDescriptions.length != 1) {
                callback(new Error(`ELB ${name} not found`), null);
            }  else {
                callback(null, result.LoadBalancerDescriptions[0]);
            }
        });
    }

    createLoadBalancerListener(elbName, listener, callback) {
        if (!listener.InstancePort) throw new Error('listener.InstancePort not specified');
        if (!listener.InstanceProtocol) throw new Error('listener.InstanceProtocol not specified');
        if (!listener.LoadBalancerPort) throw new Error('listener.LoadBalancerPort not specified');
        if (!listener.Protocol) throw new Error('listener.Protocol not specified');

        const elb = new AWS.ELB({ region: this.options.region });
        const params = {
            Listeners: [listener],
            LoadBalancerName: elbName
        };
        elb.createLoadBalancerListeners(params, callback);
    }

    deleteLoadBalancerListener(elbName, listenerPort, callback) {
        if (!elbName) throw new Error('elbName not specified');
        if (!listenerPort) throw new Error('listenerPort not specified');

        const elb = new AWS.ELB({ region: this.options.region });
        const params = {
            LoadBalancerName: elbName,
            LoadBalancerPorts: [listenerPort]
        };
        elb.deleteLoadBalancerListeners(params, callback);
    }
}

module.exports = AmazonClient;

const displayResource = require('./displayResourceUI');

exports.displayDetails = (obj) => {
    if (obj.LoadBalancerName) {
        displayElbSummary(obj);
        displayElbListeners(obj);
    }
}

function displayElbSummary(elb) {
    const resources = [
        {
            name: elb.LoadBalancerName,
            dnsname: elb.DNSName,
            listeners: `${elb.ListenerDescriptions.length} listeners`,
            zones: `${elb.AvailabilityZones.join(',')}`,
            instances: `${elb.Instances.length} instances`,
        }
    ];
    const options = {
        headers: ['Name', 'DNSName', 'Listeners', 'Zones', 'Instances'],
        fields: ['name', 'dnsname', 'listeners', 'zones', 'instances'],
        sortField: 'name',
        emptyString: '-'
    }
    displayResource.run(options, resources);
}

function displayElbListeners(elb) {
    const resources = elb.ListenerDescriptions;
    const options = {
        headers: ['LB Port', 'LB Protocol', 'Cluster Port', 'Cluster Protocol', 'SSLCertificateId'],
        fields: ['Listener.LoadBalancerPort', 'Listener.Protocol', 'Listener.InstancePort', 'Listener.InstanceProtocol', 'Listener.SSLCertificateId'],
        sortField: 'Listener.LoadBalancerPort',
        emptyString: '-'
    }
    displayResource.run(options, resources);
}
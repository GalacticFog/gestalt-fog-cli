const { getGestaltConfig } = require('./generic')

exports.getHost = () => {
    let host = getGestaltConfig()['gestalt_url'];
    host = host.trim();
    if (host.indexOf('://') > -1) {
        host = String(host).substring(host.indexOf('://') + 3);
    }
    return host;
}

exports.getEnvironmentResourceTypes = () => {
    return [
        'lambdas', 
        'apis', 
        'apiendpoints', 
        'containers', 
        'datafeeds', 
        'streamspecs', 
        'secrets', 
        'policies', 
        'policyrules', 
        'volumes', 
        'appdeployments',
        'providers'
    ].sort();
}

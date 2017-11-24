const gestaltState = require('./gestalt-state');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const request = require('sync-request');

const CONFIG_DIR = os.homedir() + '/.fog/ext'

// For interacting with Kubernetes cluster configured with webhook authentication to Gestalt.
class GestaltKubeClient {

    constructor(options) {
        if (!options) throw new Error("Options must be specified")
        if (!options.cluster) throw new Error("missing cluster identifier");
        this.options = Object.assign({}, options);
    }

    getServicesAllNamespaces(callback) {

        fetchKubeConfigFromURL(this.options.cluster);

        const kubeconfig = getKubeConfig(this.options.cluster);

        if (!fs.existsSync(kubeconfig)) {
            callback(new Error(`'${this.options.cluster}' cluster specified but '${kubeconfig}' was not found`, null))
            return;
        }

        const token = gestaltState.getCachedAuthToken();
        if (!token) {
            callback(new Error(`No cached Gestalt auth token found, you may need to login first`, null));
            return;
        }

        // call kubectl, passing in gestalt auth token.  This requires the target kube cluster has webhook
        // authentication configured to Gestalt
        const command = `kubectl --kubeconfig=${kubeconfig} --token ${token} get svc --all-namespaces -ojson`;

        exec(command, (err, stdout, stderr) => {
            if (err) {
                // error
                callback(err, null);
            } else {
                const kuberesponse = JSON.parse(stdout);

                // success
                callback(null, kuberesponse);
            }
        });
    }
}

function fetchKubeConfigFromURL(key) {
    // get URL
    const configfile = `${CONFIG_DIR}/kubeconfig.json`
    if (fs.existsSync(configfile)) {
        const contents = fs.readFileSync(configfile, 'utf8');
        const url = JSON.parse(contents)['kubeconfig_url'];

        const res = request('GET', `${url}?cluster=${key}`);

        // write to file
        const f = getKubeConfig(key);
        fs.writeFileSync(f, res.getBody());
    }
}

function getKubeConfig(key) {
    return `${CONFIG_DIR}/kubeconfig-${key}`
}

function meta_GET(url, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';

    const res = request('GET', `${meta_url}${url}`, options);
    return JSON.parse(res.getBody());
}



module.exports = GestaltKubeClient;
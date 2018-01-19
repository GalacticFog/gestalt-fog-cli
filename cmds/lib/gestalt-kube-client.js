const gestaltState = require('./gestalt-state');
const gestaltServicesConfig = require('./gestalt-services-config');
const childProcess = require('child_process');
const os = require('os');
const fs = require('fs');
const request = require('request-promise-native');

const CONFIG_DIR = gestaltState.getConfigDir();

// For interacting with Kubernetes cluster configured with webhook authentication to Gestalt.
class GestaltKubeClient {

    constructor(options) {
        if (!options) throw new Error("Options must be specified")
        if (!options.cluster) throw new Error("missing cluster identifier");
        this.options = Object.assign({}, options);
    }

    runCommand(commandArgs) {
        return obtainKubeConfig(this.options.cluster).then(kubeconfig => {
            if (!fs.existsSync(kubeconfig)) {
                console.log(`${kubeconfig} doesn't exist, fetching...`);
                fetchKubeConfigFromURL(this.options.cluster);
            }

            if (!fs.existsSync(kubeconfig)) {
                throw Error(`'${this.options.cluster}' cluster specified but '${kubeconfig}' was not found`, null);
            }

            const token = gestaltState.getCachedAuthToken();
            if (!token) {
                throw Error(`No cached Gestalt auth token found, you may need to login first`, null);
            }

            let command = `kubectl --kubeconfig=${kubeconfig} --token ${token} ${commandArgs.join(' ')}`;
            if (this.options.omitTokenAuth) {
                command = `kubectl --kubeconfig=${kubeconfig} ${commandArgs.join(' ')}`;
            }
            // console.log(command);

            // Trap Control-C so the parent node process doesn't exit, and CTRL-C gets sent to the child process
            process.on('SIGINT', function () {
                console.log('CTRL-C pressed!');
                // Do some code here....
            });
            // console.log(command);
            try {
                const result = childProcess.execSync(command, { stdio: 'inherit' });
                // console.log(result.stdout);
                return new Promise(resolve => { resolve(result) });
            } catch (err) {
                // Nothing
                return new Promise((resolve, reject) => { reject(err) });
            }
        });
    }

    accessPodLogs(namespace, pod, options) {
        return obtainKubeConfig(this.options.cluster).then(kubeconfig => {
            const token = gestaltState.getCachedAuthToken();
            if (!token) {
                throw Error(`No cached Gestalt auth token found, you may need to login first`, null);
            }

            let command = `kubectl --kubeconfig=${kubeconfig} --token ${token} --namespace ${namespace} logs ${pod}`;
            if (this.options.omitTokenAuth) {
                command = `kubectl --kubeconfig=${kubeconfig} --namespace ${namespace} logs ${pod}`;
            }
            if (options.tail) {
                command = `${command} --tail=${options.tail}`;
            }
            if (options) {
                if (options.follow) {

                    // Trap Control-C so the parent node process doesn't exit, and CTRL-C gets sent to the child process
                    process.on('SIGINT', function () {
                        console.log('CTRL-C pressed!');
                        // Do some code here....
                    });
                    command = `${command} --follow`;
                }
            }
            // console.log(command);
            try {
                const result = childProcess.execSync(command, { stdio: 'inherit' });
                return new Promise(resolve => { resolve(result) });
            } catch (err) {
                // Nothing
                return new Promise((resolve, reject) => { reject(err) });
            }
        });
    }

    accessPodConsole(namespace, pod, options) {
        return obtainKubeConfig(this.options.cluster).then(kubeconfig => {

            const token = gestaltState.getCachedAuthToken();
            if (!token) {
                throw Error(`No cached Gestalt auth token found, you may need to login first`, null);
            }

            let command = `kubectl --kubeconfig=${kubeconfig} --token ${token} --namespace ${namespace} exec ${pod} -ti --`;
            if (this.options.omitTokenAuth) {
                command = `kubectl --kubeconfig=${kubeconfig} --namespace ${namespace} exec ${pod} -ti --`;
            }
            if (options.shell) {
                command = `${command} ${options.shell}`;
            } else {
                command = `${command} sh`;
            }
            // Trap Control-C so the parent node process doesn't exit, and CTRL-C gets sent to the child process
            process.on('SIGINT', function () {
                console.log('CTRL-C pressed!');
                // Do some code here....
            });
            // console.log(command);
            try {
                const result = childProcess.execSync(command, { stdio: 'inherit' });
                return new Promise(resolve => { resolve(result) });
            } catch (err) {
                // Nothing
                return new Promise((resolve, reject) => { reject(err) });
            }
        });
    }

    getServicesAllNamespaces(callback) {
        return obtainKubeConfig(this.options.cluster).then(kubeconfig => {
            const token = gestaltState.getCachedAuthToken();
            if (!token) {
                callback(new Error(`No cached Gestalt auth token found, you may need to login first`, null));
                return;
            }

            // call kubectl, passing in gestalt auth token.  This requires the target kube cluster has webhook
            // authentication configured to Gestalt
            let command = `kubectl --kubeconfig=${kubeconfig} --token ${token} get svc --all-namespaces -ojson`;
            if (this.options.omitTokenAuth) {
                command = `kubectl --kubeconfig=${kubeconfig} get svc --all-namespaces -ojson`;
            }
            // console.log(`${command}`);
            childProcess.exec(command, (err, stdout, stderr) => {
                if (err) {
                    // error, remove cached kubeconfig
                    console.log(`Removing ${kubeconfig} since an error occurred`);
                    fs.unlinkSync(kubeconfig);

                    // report error
                    if (callback) {
                        callback(err, null);
                    } else {
                        return new Promise((resolve, reject) => { reject(err) });
                    }
                } else {
                    const kuberesponse = JSON.parse(stdout);

                    // success
                    if (callback) {
                        callback(null, kuberesponse);
                    } else {
                        return new Promise(resolve => { resolve(kuberesponse) });
                    }
                }
            });
        });
    }
}

function obtainKubeConfig(cluster) {
    const kubeconfig = getKubeConfigCacheFilePath(cluster);

    if (!fs.existsSync(kubeconfig)) {
        console.log(`${kubeconfig} doesn't exist, fetching...`);
        return fetchKubeConfigFromURL(cluster).then(() => {
            return postProcess(cluster, kubeconfig);
        });
    } else {
        console.log(`Using ${kubeconfig}`);
        return postProcess(cluster, kubeconfig);
    }
}

function postProcess(cluster, kubeconfig) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(kubeconfig)) {
            reject(Error(`'${cluster}' cluster specified but '${kubeconfig}' was not found`));
        } else {
            resolve(getKubeConfigCacheFilePath(cluster));
        }
    });
}

async function fetchKubeConfigFromURL(key) {
    const config = await gestaltServicesConfig.getServiceConfig('kubeconfig');
    const url = config['kubeconfig_url'];

    // get URL
    const opts = {
        uri: `${url}?cluster=${key}`,
        method: 'GET'
    }

    return request(opts).then(res => {
        // write to file
        const f = getKubeConfigCacheFilePath(key);
        fs.writeFileSync(f, res);
        console.log(`Wrote to file ${f}`);
        return f;//res.getBody();
    });
}

function getKubeConfigCacheFilePath(key) {
    return `${CONFIG_DIR}/kubeconfig-${key}.cached`
}

module.exports = GestaltKubeClient;
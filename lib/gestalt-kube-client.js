const gestaltState = require('./gestalt-state');
// const { exec } = require('child_process');
const childProcess = require('child_process');
const os = require('os');
const fs = require('fs');
const request = require('sync-request');

const CONFIG_DIR = gestaltState.getConfigDir();

// For interacting with Kubernetes cluster configured with webhook authentication to Gestalt.
class GestaltKubeClient {

    constructor(options) {
        if (!options) throw new Error("Options must be specified")
        if (!options.cluster) throw new Error("missing cluster identifier");
        this.options = Object.assign({}, options);
    }

    runCommand(commandArgs) {

        const kubeconfig = getKubeConfig(this.options.cluster);

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
        } catch (err) {
            // Nothing
        }
    }

    accessPodLogs(namespace, pod, options) {
        const kubeconfig = getKubeConfig(this.options.cluster);

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
            // console.log(result.stdout);
        } catch (err) {
            // Nothing
        }
    }

    accessPodConsole(namespace, pod, options) {
        const kubeconfig = getKubeConfig(this.options.cluster);

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
            // console.log(result.stdout);
        } catch (err) {
            // Nothing
        }
    }

    getServicesAllNamespaces(callback) {

        const kubeconfig = getKubeConfig(this.options.cluster);

        if (!fs.existsSync(kubeconfig)) {
            console.log(`${kubeconfig} doesn't exist, fetching...`);
            fetchKubeConfigFromURL(this.options.cluster);
            console.log(`Fetched ${kubeconfig}`);
        }

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
    return `${CONFIG_DIR}/kubeconfig-${key}.cached`
}

module.exports = GestaltKubeClient;
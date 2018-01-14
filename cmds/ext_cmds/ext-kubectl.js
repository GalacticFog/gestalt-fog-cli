'use strict';
exports.command = 'kubectl'
exports.desc = 'kubectl'
exports.builder = {}
exports.handler = function (argv) {
    const GestaltKubeClient = require('../lib/gestalt-kube-client');

    try {
        const argv = [].concat(process.argv);
        argv.splice(0, 4);
        console.log(argv)

        // Use the container's provider to get the cluster name e.g. 'dev' or 'prod' so that the kubeconfig can be downloaded via ?cluster=dev
        const kube = new GestaltKubeClient({ cluster: argv[0] });

        argv.splice(0, 1);

        // Select the container instance

        console.log(argv)

        kube.runCommand(argv).then(() => {
            console.log('Done.');
        });

    } catch (err) {
        console.log(err);
    }
}
const gestaltContext = require('../lib/gestalt-context');
const GestaltKubeClient = require('../lib/gestalt-kube-client');
const gestalt = require('../lib/gestalt')
const selectContainerInstance = require('../lib/selectContainerInstance');
const selectContainer = require('../lib/selectContainer');
const selectHierarchy = require('../lib/selectHierarchy');

const cmd = require('../lib/cmd-base');
exports.command = 'kube-container-console'
exports.desc = 'Container Console (Kubernetes)'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    if (argv.cluster || argv.env || argv.instance) {
        if (!argv.env) throw Error('missing argv.env');
        if (!argv.instance) throw Error('missing argv.instance');
        if (!argv.cluster) throw Error('missing argv.cluster');

        // command driven mode

        const kube = new GestaltKubeClient({ cluster: argv.cluster });
        accessConsole(kube, { id: argv.env }, { id: argv.instance });
    } else {
        const providerConfig = gestaltContext.loadConfigFile('providers.json');
        // No command line args, interactive mode
        await selectHierarchy.resolveEnvironment();

        // Use the container's provider to get the cluster name e.g. 'dev' or 'prod' so that the kubeconfig can be downloaded via ?cluster=dev
        const env = gestalt.getCurrentEnvironment();

        const container = await selectContainerOrCurrent();
        if (!container) {
            console.log("No selection.");
            return;
        }
        const clusterName = providerConfig[container.properties.provider.id];
        const kube = new GestaltKubeClient({ cluster: clusterName });

        // Select the container instance

        if (container.properties.instances.length > 1) {
            // More than one container instance, choose
            const inst = await selectContainerInstance.run(container);
            displayHint(clusterName, inst.id, env.id);
            accessConsole(kube, env, inst);

        } else {
            displayHint(clusterName, container.properties.instances[0].id, env.id);
            accessConsole(kube, env, container.properties.instances[0]);
        }
    }

    async function selectContainerOrCurrent(callback) {
        // No container in current context, prompt
        return selectContainer.run({});
    }

    function displayHint(cluster, instance, env) {
        console.log('To run this command directly, run the following:');
        console.log();
        console.log(`    fog ext kube-container-console --cluster ${cluster} --instance ${instance} --env ${env}`);
        console.log();
    }

    function accessConsole(kube, env, inst) {
        console.log(`Starting console session to '${inst.id}', press CTRL-D to exit.`);
        console.log();

        kube.accessPodConsole(env.id, inst.id, { shell: 'sh' }).then(() => {
            console.log();
            console.log('Console session ended.');
        });
    }
});
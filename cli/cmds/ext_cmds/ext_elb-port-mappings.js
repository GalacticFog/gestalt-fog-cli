'use strict';
const cmd = require('../lib/cmd-base');
exports.command = 'elb-port-mappings'
exports.desc = 'ELB Port Mappings'
exports.builder = {
    cluster: {
        description: 'cluster'
    },
    all: {
        description: 'Include unmapped ports'
    },
}
exports.handler = cmd.handler(async function (argv) {
    const { gestalt } = require('gestalt-fog-sdk');
    const { gestaltSession } = require('gestalt-fog-sdk');
    const displayResource = require('../lib/displayResourceUI');
    const selectResource = require('../lib/selectResourceUI');
    const displayAmazon = require('../lib/displayAmazon');
    const selectElbListeners = require('../lib/selectElbListeners');
    const gestaltServicesConfig = require('../lib/gestalt-services-config');
    const chalk = require('../lib/chalk');
    const inquirer = require('inquirer');
    const SERVICE_CONFIG_KEY = 'elb_mappings.v1';

    if (argv._.length < 3) {
        printUsage();
        process.exit(1);
    }

    const COMMAND = argv._[2];

    switch (COMMAND) {
        // case 'configure':
        //     configure();
        //     return;
        case 'clusters':
            listClusters();
            return;
    }

    // Other commands require the cluster
    if (!argv.cluster) {
        console.log('missing --cluster <cluster>');
        printUsage();
        process.exit(1);
    }

    const CLUSTER = argv.cluster;

    switch (COMMAND) {
        case 'list':
            listServicePortMappings();
            break;
        // case 'list-certs':
        //     listClusterCertificates();
        //     break;
        case 'create':
            createExternalPortMappingInteractive();
            break;
        case 'delete':
            deleteExternalPortMappingInteractive();
            break;
        default:
            console.log(`Invalid command: '${COMMAND}`);
            console.log();
            printUsage();
    }

    function printUsage() {
        console.log(`Usage:`);
        console.log();
        console.log(`  list clusters:          ${argv['$0']} elb-port-mappings clusters`);
        // console.log(`  list certificates:      ${argv['$0']} elb-port-mappings --cluster <cluster> list-certs`);
        console.log(`  list port mappings:     ${argv['$0']} elb-port-mappings --cluster <cluster> list`);
        console.log(`  create port mapping:    ${argv['$0']} elb-port-mappings --cluster <cluster> create`);
        console.log(`  delete port mapping:    ${argv['$0']} elb-port-mappings --cluster <cluster> delete`);
        console.log();
        console.log(`  use '--all' to show unmapped ports`);
        console.log();
    }

    async function createMapping(elb, listener) {
        const cluster = argv.cluster;
        const resources = doPut(`/clusters/${cluster}/elbs/${elb}/ports/${listener.LoadBalancerPort}`, listener);
        return resources;
    }

    async function deleteMapping(elb, lbPort) {
        const cluster = argv.cluster;
        if (!lbPort) throw Error(`missing lbPort`);

        return doDelete(`/clusters/${cluster}/elbs/${elb}/ports/${lbPort}`);
    }

    function listClusters() {
        let resources = Object.keys(gestaltServicesConfig.getServiceConfig(SERVICE_CONFIG_KEY));
        resources = resources.map(r => {
            return chalk.green(`'${r}'`);
        });

        console.log();
        console.log(chalk.bold('Clusters: ') + resources.join(', '));
        console.log();

    }

    function listClustersFromServer() {
        try {
            console.log(`Fetching clusters information...`);
            let resources = doGet(`/clusters`);
            resources = resources.map(r => {
                return chalk.green(`'${r}'`);
            });

            console.log();
            console.log(chalk.bold('Clusters: ') + resources.join(', '));
            console.log();
        } catch (err) {
            console.log(err.message);
            console.log();
        }
    }

    // function listClusterCertificates() {
    //     try {
    //         const cluster = argv.cluster;

    //         console.log(`Fetching information from cluster '${cluster}'...`);
    //         let resources = doGet(`/clusters/${cluster}/certs`);

    //         // console.log(JSON.stringify(resources, null, 2));

    //     } catch (err) {
    //         console.log(err.message);
    //         console.log();
    //     }
    // }

    async function doGet(path) {
        const url = await getServiceUrl();
        let resources = await gestalt.httpGet(`${url}${path}`);
        return resources;
    }

    async function doDelete(path) {
        const url = await getServiceUrl();
        return gestalt.httpDelete(`${url}${path}`);
    }

    async function doPut(path, body) {
        const url = await getServiceUrl();
        let resources = await gestalt.httpPut(`${url}${path}`, body);
        return resources;
    }

    async function listServicePortMappings() {
        try {
            const cluster = argv.cluster;

            console.log(`Fetching information from cluster '${cluster}'...`);
            let resources = await doGet(`/clusters/${cluster}/external_mappings`);

            for (let elb of resources.elbs) {
                displayMappedServices(elb.name, elb.listeners);
            }

            if (argv.all) {
                displayUnmappedServices(resources.unmapped_services);
                console.log(`Note: Non-mapped cluster services are not exposed on the above ELBs, but may be exposed elsewhere.`);
            } else {
                console.log(`There are ${resources.unmapped_services.length} unmapped services on cluster '${cluster}' (use '--all' to display)`);
            }

            console.log();

        } catch (err) {
            console.log(err.message);
            console.log();
        }
    }


    function displayMappedServices(name, listeners) {
        const options = {
            headers: ['LB Port', 'LB Protocol', 'Cluster Port', 'Cluster Protocol', 'Service Name', 'Port', 'Protocol', 'Name', 'Namespace'],
            fields: ['LoadBalancerPort', 'Protocol', 'InstancePort', 'InstanceProtocol', 'mapped_service.serviceName', 'mapped_service.port', 'mapped_service.protocol', 'mapped_service.name', 'mapped_service.namespace'],
            sortField: 'LoadBalancerPort',
            emptyString: '-'
        }

        let resources = listeners.map(i => i);

        if (!argv.all) {
            resources = resources.filter(item => {
                return item.mapped_service.namespace != 'gestalt-system' && item.mapped_service.namespace != 'kube-system';
            });
        }

        // Output
        console.log();
        console.log(chalk.green.bold(`ELB: ${name}`));
        displayResource.run(options, resources);
    }

    function displayUnmappedServices(data) {
        const options = {
            headers: ['LB Port', 'LB Protocol', 'Cluster Port', 'Cluster Protocol', 'Service Name', 'Port', 'Protocol', 'Name', 'Namespace'],
            fields: ['a', 'b', 'nodePort', 'c', 'serviceName', 'port', 'protocol', 'name', 'namespace'],
            sortField: 'serviceName',
            emptyString: '-'
        }

        let resources = Object.values(data);

        // Exclude services that were accounted for on other ELBs
        resources = resources.filter(item => {
            return !item.accountedFor;
        });

        if (!argv.all) {
            // Hide gestalt-* and kube-* namespaces
            resources = resources.filter(item => {
                return item.namespace.indexOf('gestalt-') != 0 && item.namespace.indexOf('kube-') != 0;
                // return item.namespace.indexOf('kube-') != 0;
            });
        }

        if (!argv.all) {
            // Hide Gestalt related services
            resources = resources.filter(item => {
                return item.serviceName.indexOf("gestalt-") != 0;
            });
        }

        // Output
        console.log();
        console.log(chalk.blue.bold(`Exposed Services not mapped on the above ELBs`));
        displayResource.run(options, resources);
    }

    function loadClusterConfig(key) {
        const f = gestaltSession.getSessionDirectory() + `/cluster-${key}.json`;
        if (fs.existsSync(f)) {
            const contents = fs.readFileSync(f, 'utf8');
            return JSON.parse(contents);
        }
        throw new Error(`${f} not found`);
    }

    async function getServiceUrl() {
        if (!argv.cluster) throw Error('Missing argv.cluster, try using \'--cluster <cluster>\'');
        return (await gestaltServicesConfig.getServiceConfig(SERVICE_CONFIG_KEY))[argv.cluster]['service_url'];
    }

    async function deleteExternalPortMappingInteractive() {
        // Select ELB to expose to
        const lbs = await doGet(`/clusters/${argv.cluster}/elbs`);

        const elb = await selectELB(lbs);

        // Collect user input
        const selectedListeners = await selectElbListeners.run({}, elb);

        // Display summary to the user before executing
        const confirmed = await summarizeAndConfirmDeleteELBListener(elb.LoadBalancerName, selectedListeners);
        if (confirmed) {

            // Confirmed, perform the execution
            for (let listener of selectedListeners) {
                await deleteMapping(elb.LoadBalancerName, listener.LoadBalancerPort);
                console.log(chalk.green(`Deleted port ${listener.LoadBalancerPort} from ELB ${elb.LoadBalancerName}.`));
            }

            // Show details after the delete operations
            // showElbDetails(elb.LoadBalancerName);
        } else {
            console.log('Aborted.');
        }
    }

    async function createExternalPortMappingInteractive() {

        console.log(`Fetching ELBS for cluster '${argv.cluster}'...`);
        const elbs = await doGet(`/clusters/${argv.cluster}/elbs`);

        const elb = await selectELB(elbs);

        // Show ELB Details
        displayAmazon.displayDetails(elb);

        const externalPort = await userInput('ELB port to expose:', null);

        const internalPort = await userInput("Cluster Service port to expose:", externalPort);

        const externalProtocol = await selectOptions('ELB protocol:', ['TCP', 'HTTPS', 'HTTP']);

        const cert = await selectCertificateIfNecessary(externalProtocol == 'HTTPS', elb.LoadBalancerName);

        let protocols = null;
        if (externalProtocol === 'TCP') {
            protocols = ['TCP'];
        } else {
            protocols = ['HTTP', 'HTTPS'];
        }

        const internalProtocol = await selectOptions('Cluster Service protocol:', protocols);

        const params = {
            elb: elb.LoadBalancerName,
            listener: {
                InstancePort: internalPort,
                InstanceProtocol: internalProtocol,
                LoadBalancerPort: externalPort,
                Protocol: externalProtocol
            }
        };

        if (cert) {
            params.cert = cert;
            params.listener.SSLCertificateId = cert.CertificateArn;
        }

        // Display summary to the user before executing
        const confirmed = await summarizeAndConfirmCreateELBListener(params);
        if (confirmed) {

            // Confirmed, perform the execution
            await createMapping(params.elb, params.listener);
            console.log(chalk.bold.green("Added listener."));

            // showElbDetails(elb.LoadBalancerName);
        } else {
            console.log('Aborted');
        }
    }

    // ----------------------------INTERACTIVE FUNCTIONS

    function showElbDetails(elbName) {
        const lbs = doGet(`/clusters/${argv.cluster}/elbs`);
        for (let lb of lbs) {
            if (elbName == lb.LoadBalancerName) {
                // console.log(JSON.stringify(lb, null, 2));
                displayAmazon.displayDetails(lb);
            }
        }
    }


    function selectELB(lbs) {

        const res = lbs.map(lbd => {
            return {
                name: lbd.LoadBalancerName,
                dnsname: lbd.DNSName,
                listeners: `${lbd.ListenerDescriptions.length} listeners`,
                zones: `${lbd.AvailabilityZones.join(',')}`,
                instances: `${lbd.Instances.length} instances`,
                value: Object.assign({}, lbd)
            }
        });

        const options = {
            mode: 'autocomplete',
            message: "Select ELB",
            fields: ['name', 'dnsname', 'listeners', 'zones', 'instances'],
            sortBy: 'name',
            resources: res
        }

        return selectResource.run(options).then(result => {
            return result.value;
        });
    }

    async function selectCertificateIfNecessary(necessary, elb, callback) {
        if (!necessary) {
            return new Promise(resolve => resolve());
        } else {
            console.log(`Fetching HTTPS certificates allowed for ELB '${elb}'...`);
            const certs = await doGet(`/clusters/${argv.cluster}/elbs/${elb}/certs`);

            const options = {
                mode: 'autocomplete',
                message: "Select SSL Certificate",
                fields: ['DomainName', 'CertificateArn'],
                sortBy: 'DomainName',
                resources: certs
            }

            return selectResource.run(options).then(result => {
                // console.log();
                // console.log(`${result.DomainName} selected.`);
                // console.log();

                result.SSLCertificateId = result.CertificateArn.split('/')[1];

                return result;
            });
        }
    }

    function userInput(message, defaultValue, callback) {
        const questions = [
            {
                message: message,
                type: 'input',
                name: 'value',
                default: defaultValue
            },
        ];

        return inquirer.prompt(questions).then(answers => {
            return answers.value;
        });
    }

    function selectOptions(message, opts, callback) {
        if (opts.length == 0) throw Error('No options specified');
        if (opts.length > 1) {
            const res = opts.map(o => { return { name: o } });
            let options = {
                mode: 'list',
                message: message,
                fields: ['name'],
                sortBy: 'name',
                resources: res
            }

            console.log('test')

            return selectResource.run(options).then(selection => selection.name);
        } else {
            return new Promise(resolve => {
                resolve(opts[0]);
            })
        }
    }

    function displayListeners(listeners) {
        const options = {
            headers: ['LB Port', 'LB Protocol', 'Cluster Port', 'Cluster Protocol'],
            fields: ['LoadBalancerPort', 'Protocol', 'InstancePort', 'InstanceProtocol'],
            sortField: 'LoadBalancerPort',
            emptyString: '-'
        }
        displayResource.run(options, listeners);
    }


    function displayAddListenerAction(params) {
        const resources = [{
            listener: params.listener,
            cert: params.cert,
            LoadBalancerName: params.elb
        }];
        const options = {
            headers: ['LB Name', 'LB Port', 'LB Protocol', 'Cluster Port', 'Cluster Protocol', 'Domain' /*, 'SSLCertificateId'*/],
            fields: ['LoadBalancerName', 'listener.LoadBalancerPort', 'listener.Protocol', 'listener.InstancePort', 'listener.InstanceProtocol', 'cert.DomainName' /*, 'listener.SSLCertificateId'*/],
            // sortField: 'LoadBalancerName',
            emptyString: '-'
        }
        displayResource.run(options, resources);
    }

    function summarizeAndConfirmCreateELBListener(params) {
        console.log();
        console.log(chalk.bold(`The following listener will be added to ELB ${chalk.green(params.elb)}:`));

        displayAddListenerAction(params);

        // Prompt to continue
        const questions = [
            {
                message: "Proceed to add ELB listener?",
                type: 'confirm',
                name: 'confirm',
                default: false
            },
        ];

        return inquirer.prompt(questions).then(answers => {
            return answers.confirm;
        });
    }

    function summarizeAndConfirmDeleteELBListener(elb, listeners) {
        console.log();
        console.log(chalk.bold(`The following listeners will be deleted from ELB ${chalk.green(elb)}:`));

        displayListeners(listeners);

        // Prompt to continue
        const questions = [
            {
                message: `Proceed to remove ${listeners.length} listeners from ${chalk.green(elb)} ELB?`,
                type: 'confirm',
                name: 'confirm',
                default: false
            },
        ];

        return inquirer.prompt(questions).then(answers => {
            return answers.confirm;
        });
    }
});
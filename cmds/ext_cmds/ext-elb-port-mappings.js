'use strict';
exports.command = 'elb-port-mappings'
exports.desc = 'ELB Port Mappings'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt');
    const gestaltState = require('../lib/gestalt-state');
    const displayResource = require('../lib/displayResourceUI');
    const selectResource = require('../lib/selectResourceUI');
    const displayAmazon = require('../lib/displayAmazon');
    const selectElbListeners = require('../lib/selectElbListeners');
    const gestaltServicesConfig = require('../lib/gestalt-services-config');
    const request = require('sync-request');
    const chalk = require('chalk');
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

    main();

    function printUsage() {
        console.log(`Usage:`);
        console.log();
        console.log(`  list clusters:          ${argv['$0']} clusters`);
        // console.log(`  list certificates:      ${argv['$0']} --cluster <cluster> list-certs`);
        console.log(`  list port mappings:     ${argv['$0']} --cluster <cluster> list`);
        console.log(`  create port mapping:    ${argv['$0']} --cluster <cluster> create`);
        console.log(`  delete port mapping:    ${argv['$0']} --cluster <cluster> delete`);
        console.log();
    }

    function main() {

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
    }

    function createMapping(elb, listener) {
        const cluster = argv.cluster;
        const resources = doPut(`/clusters/${cluster}/elbs/${elb}/ports/${listener.LoadBalancerPort}`, listener);
    }

    function deleteMapping(elb, lbPort) {
        const cluster = argv.cluster;
        if (!lbPort) throw Error(`missing lbPort`);

        doDelete(`/clusters/${cluster}/elbs/${elb}/ports/${lbPort}`);
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

    function doGet(path) {
        const url = getServiceUrl();
        let resources = gestalt.httpGet(`${url}${path}`);
        return resources;
    }

    function doDelete(path) {
        const url = getServiceUrl();
        gestalt.httpDelete(`${url}${path}`);
    }

    function doPut(path, body) {
        const url = getServiceUrl();
        let resources = gestalt.httpPut(`${url}${path}`, body);
        return resources;
    }

    function listServicePortMappings() {
        try {
            const cluster = argv.cluster;

            console.log(`Fetching information from cluster '${cluster}'...`);
            let resources = doGet(`/clusters/${cluster}/external_mappings`);

            resources.elbs.map(elb => {
                displayMappedServices(elb.name, elb.listeners);
            })

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
        const f = gestaltState.getConfigDir() + `/cluster-${key}.json`;
        if (fs.existsSync(f)) {
            const contents = fs.readFileSync(f, 'utf8');
            return JSON.parse(contents);
        }
        throw new Error(`${f} not found`);
    }

    function getServiceUrl() {
        if (!argv.cluster) throw Error('Missing argv.cluster, try using \'--cluster <cluster>\'');
        return gestaltServicesConfig.getServiceConfig(SERVICE_CONFIG_KEY)[argv.cluster]['service_url'];
    }

    function promptToContinue(message, callback) {
        // Prompt to continue
        const questions = [
            {
                message: message,
                type: 'confirm',
                name: 'confirm',
                default: false
            },
        ];
        inquirer.prompt(questions).then(answers => {
            const contents = JSON.stringify(answers, null, '  ');

            if (answers.confirm) {
                callback(true);
            } else {
                callback(false);
            }
        });
    }


    function deleteExternalPortMappingInteractive() {
        // Select ELB to expose to
        const lbs = doGet(`/clusters/${argv.cluster}/elbs`);

        selectELB(lbs, (err, elb) => {
            if (err) {
                console.error(chalk.red(`Error: ${err.message}`));
                return;
            }

            // Collect user input
            selectElbListeners.run({}, elb, (selectedListeners) => {

                console.log(selectedListeners);

                // Display summary to the user before executing
                summarizeAndConfirmDeleteELBListener(elb.LoadBalancerName, selectedListeners, () => {

                    // Confirmed, perform the execution
                    selectedListeners.map(listener => {
                        deleteMapping(elb.LoadBalancerName, listener.LoadBalancerPort);
                        console.log(chalk.green(`Deleted port ${listener.LoadBalancerPort} from ELB ${elb.LoadBalancerName}.`));
                    })

                    // Show details after the delete operations
                    // showElbDetails(elb.LoadBalancerName);
                });
            });
        });
    }

    function createExternalPortMappingInteractive() {

        console.log(`Fetching ELBS for cluster '${argv.cluster}'...`);
        const elbs = doGet(`/clusters/${argv.cluster}/elbs`);

        selectELB(elbs, (err, elb) => {
            if (err) {
                console.error(chalk.red(`Error: ${err.message}`));
                return;
            }

            // Show ELB Details
            displayAmazon.displayDetails(elb);

            userInput('ELB port to expose:', null, externalPort => {

                userInput("Cluster Service port to expose:", externalPort, internalPort => {

                    selectOptions('ELB protocol:', ['TCP', 'HTTPS', 'HTTP'], externalProtocol => {

                        selectCertificateIfNecessary(externalProtocol == 'HTTPS', elb.LoadBalancerName, (cert) => {

                            let protocols = null;
                            if (externalProtocol === 'TCP') {
                                protocols = ['TCP'];
                            } else {
                                protocols = ['HTTP', 'HTTPS'];
                            }

                            selectOptions('Cluster Service protocol:', protocols, internalProtocol => {

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

                                // console.log(JSON.stringify(params, null, 2));

                                // Display summary to the user before executing
                                summarizeAndConfirmCreateELBListener(params, () => {

                                    // Confirmed, perform the execution
                                    createMapping(params.elb, params.listener);
                                    console.log(chalk.bold.green("Added listener."));

                                    // showElbDetails(elb.LoadBalancerName);
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    // ----------------------------INTERACTIVE FUNCTIONS

    function showElbDetails(elbName) {
        const lbs = doGet(`/clusters/${argv.cluster}/elbs`);
        lbs.map(lb => {
            if (elbName == lb.LoadBalancerName) {
                // console.log(JSON.stringify(lb, null, 2));
                displayAmazon.displayDetails(lb);
            }
        });
    }


    function selectELB(lbs, callback) {

        const options = {
            mode: 'autocomplete',
            message: "Select ELB",
            fields: ['name', 'dnsname', 'listeners', 'zones', 'instances'],
            sortBy: 'name',
            fetchFunction: () => {
                return lbs.map(lbd => {
                    return {
                        name: lbd.LoadBalancerName,
                        dnsname: lbd.DNSName,
                        listeners: `${lbd.ListenerDescriptions.length} listeners`,
                        zones: `${lbd.AvailabilityZones.join(',')}`,
                        instances: `${lbd.Instances.length} instances`,
                        value: Object.assign({}, lbd)
                    }
                });
            }
        }

        selectResource.run(options, result => {
            // console.log();
            // console.log(`${result.value.LoadBalancerName} selected.`);
            // console.log();

            callback(null, result.value);
        });
    }

    function selectCertificateIfNecessary(necessary, elb, callback) {
        if (!necessary) {
            callback()
        } else {
            console.log(`Fetching HTTPS certificates allowed for ELB '${elb}'...`);
            const certs = doGet(`/clusters/${argv.cluster}/elbs/${elb}/certs`);

            const options = {
                mode: 'autocomplete',
                message: "Select SSL Certificate",
                fields: ['DomainName', 'CertificateArn'],
                sortBy: 'DomainName',
                fetchFunction: () => {
                    return certs;
                }
            }

            selectResource.run(options, result => {
                // console.log();
                // console.log(`${result.DomainName} selected.`);
                // console.log();

                result.SSLCertificateId = result.CertificateArn.split('/')[1];

                callback(result);
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

        inquirer.prompt(questions).then(answers => {
            callback(answers.value);
        });
    }

    function selectOptions(message, opts, callback) {
        if (opts.length == 0) throw Error('No options specified');
        if (opts.length > 1) {
            let options = {
                mode: 'list',
                message: message,
                fields: ['name'],
                sortBy: 'name',
                fetchFunction: () => {
                    // Extract the listeners
                    return opts.map(o => { return { name: o } });
                }
            }

            selectResource.run(options, selection => {
                if (callback) callback(selection.name);
            });
        } else {
            callback(opts[0]);
        }
    }


    function summarizeAndConfirmCreateELBListener(params, callback) {
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

        inquirer.prompt(questions).then(answers => {
            const contents = JSON.stringify(answers, null, '  ');

            if (answers.confirm) {
                callback();
            } else {
                console.log("Aborted.")
            }
        });
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


    function summarizeAndConfirmDeleteELBListener(elb, listeners, callback) {
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

        inquirer.prompt(questions).then(answers => {
            const contents = JSON.stringify(answers, null, '  ');

            if (answers.confirm) {
                callback();
            } else {
                console.log("Aborted.")
            }
        });
    }
}
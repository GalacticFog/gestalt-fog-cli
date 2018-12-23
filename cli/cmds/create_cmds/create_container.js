const inquirer = require('inquirer');
const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'container [name]'
exports.desc = 'Create container'
exports.builder = {
    template: {
        alias: 't',
        description: 'template file'
    },
    file: {
        alias: 'f',
        description: 'resource definition file'
    },
    image: {
        alias: 'i',
        description: 'image (overrides template)'
    },
    network: {
        alias: 'n',
        description: 'network (overrides template)'
    },
    cpus: {
        description: 'cpus (overrides template)'
    },
    memory: {
        description: 'memory (overrides template)'
    },
    num_instances: {
        description: 'num_instances (overrides template)'
    },
}

exports.handler = cmd.handler(async function (argv) {
    if (argv.file || argv.name || argv.description) {
        if (!argv.file) throw Error('Missing file');
        // TODO - Make this standard for other resource types
        // if (argv.file == '-') {

        //     function processData() {
        //         let containerSpec = JSON.parse(data)
        //         await doCreateContainer(argv, containerSpec);
        //     }

        //     let data = '';
        //     process.stdin.setEncoding('utf-8');

        //     process.stdin.on('readable', function () {
        //         var chunk;
        //         while (chunk = process.stdin.read()) {
        //             data += chunk;
        //         }
        //     });

        //     process.stdin.on('end', function () {
        //         // There will be a trailing \n from the user hitting enter. Get rid of it.
        //         data = data.replace(/\n$/, '');
        //         processData();
        //     });


        // } else {
            console.log(`Loading container spec from file ${argv.file}`);
            let containerSpec = cmd.loadObjectFromFile(argv.file);

            // Override resource name if specified
            if (argv.name) containerSpec.name = argv.name;
            if (argv.description) containerSpec.description = argv.description;

            // TODO: Consider yup schema.cast to convert values to expected types, rather than
            // dealing with numbers specifically

            // Overrides (string values)
            if (argv.image) containerSpec.properties.image = argv.image;
            if (argv.network) containerSpec.properties.image = argv.network;

            // Overrides (numbers)
            if (argv['num-instances']) containerSpec.properties.num_instances = Number.parseInt(argv['num-instances']);
            if (argv.cpus) containerSpec.properties.image = Number(argv.cpus);
            if (argv.memory) containerSpec.properties.image = Number(argv.memory);

            await doCreateContainer(argv, containerSpec);
        // }
    } else {

        // Interactive mode
        const template = argv.template ? cmd.loadObjectFromFile(argv.template) : {};

        const context = await ui.resolveEnvironment();

        const answers = await promptForInput(context, template);

        // debug(`answers: ${JSON.stringify(answers, null, 2)}`);

        if (answers.confirm) {
            const containerSpec = Object.assign({}, answers);
            delete containerSpec.confirm;
            containerSpec.properties.container_type = 'DOCKER';

            debug(`containerSpec: ${JSON.stringify(containerSpec, null, 2)}`);

            // Create
            const container = await gestalt.createContainer(containerSpec, context);
            debug(`container: ${JSON.stringify(container, null, 2)}`);
            console.log(`Container '${container.name}' created.`);
        } else {
            console.log('Aborted.');
        }
    }
});


async function doCreateContainer(argv, containerSpec) {
    // load from file
    // Create
    if (argv.template) {
        const template = cmd.loadObjectFromFile(argv.template);
        console.log(`Mixing in template: ${template}`);
        containerSpec = Object.assign(template, containerSpec);
    }

    // Resolve environment context from command line args
    const context = await cmd.resolveEnvironment();

    const provider = await cmd.resolveProvider(argv.provider, context);

    containerSpec.properties.provider = provider;

    const container = await gestalt.createContainer(containerSpec, context);
    // console.log(`container: ${JSON.stringify(container, null, 2)}`);
    // console.log(`Container '${container.name}' created from file ${argv.file}.`);
    console.log(`Container '${container.name}' created.`);
}

async function promptForInput(context, template) {

    if (!template.properties) template.properties = {};

    let filter = null;
    if (template.properties.provider && template.properties.provider.name) {
        console.log(template.properties.provider.name)
        filter = (item) => {
            return item.name == template.properties.provider.name;
        }
    }

    const provider = await ui.selectProvider({ type: 'CaaS', message: 'Select Provider', mode: 'list', filter: filter }, context);
    if (provider.resource_type == 'CaaS::Kubernetes') {
        template.properties.network = 'default';
    } else if (provider.resource_type == 'CaaS::Kubernetes') {
        // Don't provide an option for host networking
        template.properties.network = 'BRIDGE';
    }

    let questions = [
        {
            when: !template.name,
            message: "Container Name",
            type: 'input',
            name: 'name',
            validate: inputValidation.resourceName
        },
        {
            when: !template.description,
            message: "Container Description",
            type: 'input',
            name: 'description',
            validate: inputValidation.resourceDescription
        },
        {
            when: !template.properties.image,
            message: "Container Image",
            type: 'input',
            name: 'properties.image',
            validate: inputValidation.containerImage
        },
        {
            when: !template.properties.force_pull,
            message: "Force Pull Image",
            type: 'confirm',
            name: 'properties.force_pull',
            default: true
        },
        // {   // For DCOS Only 
        //     when: provider.resource_type == 'CaaS::DCOS',
        //     message: "DC/OS Network Type",
        //     type: 'list',
        //     name: 'properties.network',
        //     choices: ['BRIDGE', 'HOST'],
        //     default: "BRIDGE"
        // },
        {
            when: !template.properties.cpus,
            message: "CPU",
            type: 'input',
            name: 'properties.cpus',
            default: 0.1,
            validate: inputValidation.cpu
        },
        {
            when: !template.properties.memory,
            message: "Memory (MB)",
            type: 'input',
            name: 'properties.memory',
            default: 128,
            validate: inputValidation.memory
        },
        {
            when: !template.properties.num_instances,
            message: "Number of instances",
            type: 'input',
            name: 'properties.num_instances',
            default: 1,
            validate: inputValidation.containerNumInstances
        },
        {
            message: "\nProceed to create container?",
            type: 'confirm',
            name: 'confirm',
            default: false
        },
    ];

    return inquirer.prompt(questions).then(answers => {
        answers.properties.provider = {
            id: provider.id
        };

        // merge in defaults
        answers.properties = Object.assign(template.properties, answers.properties);

        return Object.assign(template, answers);
    });
}


const inquirer = require('inquirer');
const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'job [name]'
exports.desc = 'Create job'
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
}

exports.handler = cmd.handler(async function (argv) {
    if (argv.file || argv.name || argv.description) {
        if (!argv.file) throw Error('Missing file');

        console.log(`Loading job spec from file ${argv.file}`);
        let jobSpec = cmd.loadObjectFromFile(argv.file);

        // Override resource name if specified
        if (argv.name) jobSpec.name = argv.name;
        if (argv.description) jobSpec.description = argv.description;

        if (argv.image) jobSpec.properties.image = argv.image;

        await doCreateJob(argv, jobSpec);
    } else {

        // Interactive mode
        const template = argv.template ? cmd.loadObjectFromFile(argv.template) : {};

        const context = await ui.resolveEnvironment();

        const answers = await promptForInput(context, template);

        // debug(`answers: ${JSON.stringify(answers, null, 2)}`);

        if (answers.confirm) {
            const jobSpec = Object.assign({}, answers);
            delete jobSpec.confirm;
            jobSpec.properties.container_type = 'DOCKER';

            debug(`jobSpec: ${JSON.stringify(jobSpec, null, 2)}`);

            // Create
            const job = await gestalt.createJob(jobSpec, context);
            debug(`job: ${JSON.stringify(job, null, 2)}`);
            console.log(`Job '${job.name}' created.`);
        } else {
            console.log('Aborted.');
        }
    }
});


async function doCreateJob(argv, jobSpec) {
    // load from file
    // Create
    if (argv.template) {
        const template = cmd.loadObjectFromFile(argv.template);
        console.log(`Mixing in template: ${template}`);
        jobSpec = Object.assign(template, jobSpec);
    }

    // Resolve environment context from command line args
    const context = await cmd.resolveEnvironment();

    const provider = await cmd.resolveProvider(argv.provider, context);

    jobSpec.properties.provider = provider;

    const job = await gestalt.createJob(jobSpec, context);
    console.log(`Job '${job.name}' created.`);
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
            message: "Job Name",
            type: 'input',
            name: 'name',
            validate: inputValidation.resourceName
        },
        {
            when: !template.description,
            message: "Job Description",
            type: 'input',
            name: 'description',
            validate: inputValidation.resourceDescription
        },
        {
            when: !template.properties.image,
            message: "Job Image",
            type: 'input',
            name: 'properties.image',
            validate: inputValidation.containerImage
        },
        {
            message: "\nProceed to create job?",
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


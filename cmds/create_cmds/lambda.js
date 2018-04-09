const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const fs = require('fs');
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'lambda'
exports.desc = 'Create lambda'
exports.builder = {
    source: {
        description: 'Source code for in-line lambda'
    },
    url: {
        description: 'URL for package lambda'
    },
    file: {
        alias: 'f',
        description: 'Lambda definition'
    }
}

// fog create lambda --name test --runtime python --public true --org engineering --env asdf --inline source.py
// fog create lambda --from template.json --name test --inline source.py
// fog create lambda --from mylambda.json

// TODO - Create API endpoint

function getDefaultProperties() {
    return {
        "public": true,
        "compressed": false,
        "cpus": 0.1,
        "memory": 512,
        "headers": {
            "Accept": "text/plain"
        },
        "periodic_info": {},
        "timeout": 30,
        "env": {}
    }
}

exports.handler = cmd.handler(async function (argv) {

    if (argv.source && argv.url) {
        console.log("Error: Only one of --source or --url can be specified");
        return;
    }

    let code = null;

    if (argv.source) {
        if (!fs.existsSync(argv.source)) {
            console.log(`Error: ${argv.source} doesn't exist, aborted.`);
            return;
        }

        const contents = fs.readFileSync(argv.source, 'utf8');
        const buf = Buffer.from(contents, 'utf8');
        code = buf.toString('base64');

        console.log(`Creating inline code lambda from ${argv.source}`);
    } else if (argv.url) {
        console.log(`Creating package lambda from ${argv.url}`);
    }

    const context = await ui.resolveEnvironment();

    const answers = await promptForInput(context, argv);

    debug(`answers: ${JSON.stringify(answers, null, 2)}`);

    if (answers.confirm) {

        const lambdaSpec = Object.assign({}, answers);
        delete lambdaSpec.confirm;

        if (code) {
            lambdaSpec.properties.code = code;
            lambdaSpec.properties.code_type = 'code';
        } else {
            lambdaSpec.properties.code_type = 'package';
            if (argv.url) {
                lambdaSpec.properties.package_url = argv.url;
            }
        }

        debug(`lambdaSpec: ${JSON.stringify(lambdaSpec, null, 2)}`);

        // Create
        gestalt.createLambda(lambdaSpec, context).then(lambda => {
            debug(`lambda: ${JSON.stringify(lambda, null, 2)}`);
            console.log(`Lambda '${lambda.name}' created.`);
        });
    } else {
        console.log('Aborted.');
    }
});

async function promptForInput(context, argv) {

    //TODO: The following makes two API calls to provider.  Should reduce to 1, and do filtering here.
    const lambdaProvider = await ui.selectProvider({ type: 'Lambda', message: 'Select Provider' }, context);
    debug(lambdaProvider);

    const executorProvider = await ui.selectProvider({ type: 'Executor', message: 'Select Runtime' }, context);
    debug(executorProvider);

    let questions = [
        {
            when: (!argv.source && !argv.url),
            message: "Lambda Package URL",
            type: 'input',
            name: 'properties.package_url',
            validate: inputValidation.url
        },
        {
            when: (!argv.source && !argv.url),
            message: "Is Package Compressed?",
            type: 'confirm',
            name: 'properties.compressed',
            default: true
        },
        {
            message: "Name",
            type: 'input',
            name: 'name',
            // default: TODO: use filename as default
            validate: inputValidation.resourceName
        },
        {
            message: "Description",
            type: 'input',
            name: 'description',
            validate: inputValidation.resourceDescription
        },
        {
            message: "Accept Header",
            type: 'list',
            name: 'properties.headers.Accept',
            choices: ['text/plain', 'text/html', 'application/js', 'application/json', 'application/xml']
        },
        {
            message: "CPU",
            type: 'input',
            name: 'properties.cpus',
            default: 0.1,
            validate: inputValidation.cpu
        },
        {
            message: "Memory (MB)",
            type: 'input',
            name: 'properties.memory',
            default: 128,
            validate: inputValidation.memory
        },
        {
            message: "Timeout (seconds)",
            type: 'input',
            name: 'properties.timeout',
            default: 30,
            validate: inputValidation.lambdaTimeout
        },
        {
            message: "Handler",
            type: 'input',
            name: 'properties.handler',
            default: 'run',
            validate: inputValidation.lambdaHandler
        },
        {
            message: "Public?",
            type: 'confirm',
            name: 'properties.public',
            default: false
        },
        {
            message: "\nProceed to Create Lambda?",
            type: 'confirm',
            name: 'confirm',
            default: false
        },
    ];

    const answers = await inquirer.prompt(questions);

    answers.properties.provider = {
        id: lambdaProvider.id,
        locations: []
    };

    answers.properties.runtime = executorProvider.properties.config.env.public.RUNTIME;
    return answers;
}



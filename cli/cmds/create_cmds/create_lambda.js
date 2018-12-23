const inquirer = require('inquirer');
const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const fs = require('fs');
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'lambda [name]'
exports.desc = 'Create lambda'
exports.builder = {
    url: {
        description: 'URL for package lambda'
    },
    file: {
        alias: 'f',
        description: 'Lambda definition'
    },
    name: {
        description: 'Lambda name'
    },
    description: {
        description: 'Lambda description'
    },
    code: {
        description: 'Source code for in-line lambda'
    },
    'package-url': {
        description: 'Package URL for package lambda'
    },
    handler: {
        description: 'Handler'
    },
    runtime: {
        description: 'Lambda runtime'
    }
}

// fog create lambda --org sandbox --workspace admin-sandbox --environment dev --code demo-setup.js --name demo-setup --description 'asdf' --handler 'run'
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

function getCodeFromSource(source) {
    if (!fs.existsSync(source)) {
        throw Error(`File '${source}' doesn't exist`);
    }

    const contents = fs.readFileSync(source, 'utf8');
    const buf = Buffer.from(contents, 'utf8');
    const code = buf.toString('base64');
    return code;
}

async function doCreateLambda(argv, spec) {

    // Resolve environment context from command line args
    const context = await cmd.resolveEnvironment();

    // Resolve provider by name
    const provider = await cmd.resolveProvider(argv.provider, context);

    // Build provider spec
    spec.properties.provider = {
        id: provider.id,
        locations: []
    };

    debug(`lambda: ${JSON.stringify(spec, null, 2)}`);

    // Create lambda
    const lambda = await gestalt.createLambda(spec, context);
    debug(`lambda: ${JSON.stringify(lambda, null, 2)}`);
    console.log(`Lambda '${lambda.name}' created.`);
}

exports.handler = cmd.handler(async function (argv) {
    if (argv.file) {
        console.error(`Loading resource spec from file ${argv.file}`);
        let spec = cmd.loadObjectFromFile(argv.file);
        await doCreateLambda(argv, spec);

    } else if (argv.name) {
        // Command line mode

        // Check for required args
        if (!argv.description) throw Error('missing --description');
        if (!argv.handler) throw Error('missing --handler');
        if (!argv.runtime) throw Error('missing --runtime');

        // Build lambda spec
        const spec = {
            name: argv.name,
            description: argv.description || '',
            properties: getDefaultProperties()
        };

        // Load code
        if (argv.code && argv['packge-url']) {
            console.log("Error: Only one of --code or --package-url can be specified");
            return;
        } else if (argv.code) {
            spec.properties.code = getCodeFromSource(argv.code);
            spec.properties.code_type = 'code';
        } else if (argv['package-url']) {
            spec.properties.code_type = 'package';
            spec.properties.package_url = argv['package-url'];
            if (argv.compressed) {
                spec.properties.compressed = argv.compressed;
            } else {
                // infer by .zip extension
                spec.properties.compressed = String(spec.properties.package_url).endsWith('.zip') ? 'true' : 'false';
            }
        } else {
            throw Error(`Missing --code or --package-url property`);
        }

        spec.properties.handler = argv.handler;
        spec.properties.runtime = argv.runtime;

        await doCreateLambda(argv, spec);

    } else {
        // Interactive mdoe

        if (argv.code && argv['packge-url']) {
            console.log("Error: Only one of --code or --package-url can be specified");
            return;
        }

        let code = null;

        if (argv.code) {
            code = getCodeFromSource(argv.code);
            console.log(`Creating inline code lambda from ${argv.code}`);
        } else if (argv['package-url']) {
            console.log(`Creating package lambda from ${argv['package-url']}`);
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
                    lambdaSpec.properties.package_url = argv['package-url'];
                }
            }

            debug(`lambdaSpec: ${JSON.stringify(lambdaSpec, null, 2)}`);

            // Create
            const lambda = await gestalt.createLambda(lambdaSpec, context);
            debug(`lambda: ${JSON.stringify(lambda, null, 2)}`);
            console.log(`Lambda '${lambda.name}' created.`);
        } else {
            console.log('Aborted.');
        }
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



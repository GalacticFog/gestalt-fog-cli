const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'api-endpoint [name]'
exports.desc = 'Create API Endpoint'
exports.builder = {
    template: {
        alias: 't',
        description: 'template file'
    },
    file: {
        alias: 'f',
        description: 'container definition file'
    }
}
exports.handler = cmd.handler(async function (argv) {
    if (argv.file) {
        console.log(`Loading resource spec from file ${argv.file}`);
        let spec = cmd.loadObjectFromFile(argv.file);

        doCreateApiEndpoint(argv, spec);

    } else if (argv.name) {
        // Command line

        // Check for required args
        if (!argv.description) throw Error('missing --description');

        const context = await cmd.resolveEnvironment();
        const resources = await gestalt.fetchEnvironmentApis(context);
        const targetApi = resources.find(api => api.name == argv.api);
        if (!targetApi) throw Error(`API ${argv.api} not found`);
        context.api = {
            id: targetApi.id,
            name: targetApi.name
        }

        // Get Kong provider
        const kongProvider = await cmd.resolveProvider(argv.provider, context, 'Kong');

        const specProperties = {};

        if (argv.container) {
            if (argv['port-name']) {
                specProperties.implementation_type = 'container';
                specProperties.container_port_name = argv['port-name']
            } else {
                throw Error(`Missing --port-name property`);
            }
        } else if (argv.lambda) {
            specProperties.implementation_type = 'lambda';
        } else {
            throw Error(`Missing --container or --lambda property`);
        }

        // Default
        if (!argv.methods) {
            argv.methods = ['GET']
        } else {
            argv.methods = argv.methods.toUpperCase().split(',');
        }

        const targetResource = await cmd.lookupEnvironmentResource(
            specProperties.implementation_type + 's', argv.container, context);

        specProperties.implementation_id = targetResource.id;

        const spec = {
            name: argv.name,
            description: argv.description,
            properties: {
                resource: argv.name,
                methods: argv.methods,
                plugins: {
                    "gestaltSecurity": {
                        "enabled": false,
                        "users": [

                        ],
                        "groups": [

                        ]
                    }
                },
                synchronous: true,
            }
        };

        // Merge in 
        spec.properties = Object.assign(spec.properties, specProperties);

        const apiendpoint = await gestalt.createApiEndpoint(spec, context);

        console.log(`API Endpoint '${apiendpoint.name}' created.`);
    } else {

        const context = await ui.resolveEnvironment();

        // API
        const targetApi = await ui.selectApi({}, context);

        // Target Lambda (or Container)
        const lambdas = await gestalt.fetchEnvironmentLambdas(context);
        const targetResource = await ui.selectLambda({}, lambdas);

        // User input
        // Resource Path

        // Allowed HTTP Methods

        // Security - Require Authentication

        // Sync or Async

        // Rate Limit (per min)

        const questions = [
            {
                message: "Resource Path",
                type: 'input',
                name: 'resource',
                validate: inputValidation.resourcePath
            },
            {
                message: "Description (optional)",
                type: 'input',
                name: 'description',
                validate: inputValidation.resourceDescription
            },
            {
                message: "Methods",
                type: 'checkbox',
                name: 'methods',
                choices: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'],
                default: ['GET']
            },
            // {
            //     message: "Rate Limit",
            //     type: 'input',
            //     name: 'rateLimit',
            //     default: 60
            // },
            {
                message: "Proceed?",
                type: 'confirm',
                name: 'confirm',
                default: false
            },
        ];

        const answers = await inquirer.prompt(questions);

        debug(`answers: ${answers}`);
        if (answers.confirm) {

            const spec = {
                name: answers.resource,
                description: answers.description,
                properties: {
                    resource: answers.resource,
                    methods: answers.methods,
                    plugins: {
                        "gestaltSecurity": {
                            "enabled": false,
                            "users": [

                            ],
                            "groups": [

                            ]
                        }
                    },
                    synchronous: true,
                    implementation_type: 'lambda',
                    implementation_id: targetResource.id
                }
            };

            if (answers.rateLimit) {
                spec.properties.plugins.rateLimit = {
                    enabled: true,
                    perMinute: answers.rateLimit
                }
            }

            const apiendpoint = await gestalt.createApiEndpoint(spec, Object.assign(context, { api: { id: targetApi.id } }));

            console.log(`API Endpoint '${apiendpoint.name}' created.`);
        } else {
            console.log('Aborted.');
        }
    }
});

async function doCreateApiEndpoint(argv, spec) {
    if (argv.template) {
        const template = cmd.loadObjectFromFile(argv.template);
        console.log(`Mixing in template: ${template}`);
        spec = Object.assign(template, spec);
    }

    // Resolve environment context from command line args
    const context = await cmd.resolveEnvironment();
    const resources = await gestalt.fetchEnvironmentApis(context);
    const targetApi = resources.find(api => api.name == argv.api);
    if (!targetApi) throw Error(`API ${argv.api} not found`);
    context.api = {
        id: targetApi.id,
        name: targetApi.name
    }

    if (argv.container && argv.lambda) {
        throw Error('Can only specify one of --container and --lambda');
    }

    if (argv.container) {
        if (!argv['port-name']) {
            throw Error('missing --port-name parameter');
        }
        // resolve container name
        const resources = await gestalt.fetchContainers(context);
        const target = resources.find(c => c.name == argv.container);
        if (!target) throw Error(`Container '${argv.container}' not found.`);

        spec.properties = Object.assign(spec.properties, {
            'implementation_id': target.id,
            "implementation_type": "container",
            "container_port_name": argv['port-name']
        })
    } else if (argv.lambda) {
        const resources = await gestalt.fetchEnvironmentLambdas(context);
        const target = resources.find(c => c.name == argv.lambda);
        if (!target) throw Error(`Lambda '${argv.lambda}' not found.`);
        spec.properties = Object.assign(spec.properties, {
            'implementation_id': target.id,
            "implementation_type": "lambda"
        })
    }

    const resource = await gestalt.createApiEndpoint(spec, context);
    console.log(`API endpoint '${resource.name}' created.`);
}
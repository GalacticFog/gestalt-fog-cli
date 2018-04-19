const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'api-endpoint'
exports.desc = 'Create API Endpoint'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    if (argv.name) {
        // Command line

        // Check for required args
        for (let s of ['name', 'description']) {
            if (!argv[s]) throw Error(`Missing --${s} property`);
        }

        const context = await cmd.resolveEnvironmentApi(argv);

        // Get Kong provider
        const kongProvider = await cmd.resolveProvider(argv, context, 'Kong');

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

        const targetResource = await cmd.lookupEnvironmentResourcebyName(argv.container,
            specProperties.implementation_type + 's', context);

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

            debug(`apiendpoint: ${apiendpoint}`);

            console.log(`API Endpoint '${apiendpoint.name}' created.`);
        } else {
            console.log('Aborted.');
        }
    }
});


// {
//     "name": "/test1",
//     "description": "",
//     "properties": {
//         "resource": "/test1",
//         "methods": [
//             "GET"
//         ],
//         "plugins": {
//             "rateLimit": {
//                 "enabled": false,
//                 "perMinute": 60
//             },
//             "gestaltSecurity": {
//                 "enabled": false,
//                 "users": [

//                 ],
//                 "groups": [

//                 ]
//             }
//         },
//         "synchronous": true,
//         "implementation_id": "9467c42b-d5cf-4bd0-86f7-9f4defa1d929",
//         "implementation_type": "lambda"
//     }
// }
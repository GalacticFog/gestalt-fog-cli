exports.command = 'lambda'
exports.desc = 'Create lambda'
exports.builder = {
    source: {},
    url: {}
}
exports.handler = function (argv) {

    const inquirer = require('inquirer');
    const gestalt = require('../lib/gestalt')
    const gestaltState = require('../lib/gestalt-state');
    const selectHierarchy = require('../lib/selectHierarchy');
    const selectProvider = require('../lib/selectProvider');
    const fs = require('fs');

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

    selectHierarchy.resolveWorkspace(() => {

        promptForInput(answers => {

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
                const lambda = gestalt.createLambda(lambdaSpec);

                debug(`lambda: ${JSON.stringify(lambda, null, 2)}`);

                console.log('Lambda created.');
            } else {
                console.log('Aborted.');
            }
        });
    });

    function promptForInput(callback) {

        // {
        //     "name": "One",
        //     "properties": {
        //         "env": {
        //         },
        //         "headers": {
        //             "Accept": "text/plain"
        //         },
        //         "code_type": "code",
        //         "code": "ZnVuY3Rpb24gcnVuKCkgeyByZXR1cm4gJ2hlbGxvJzsgfQ==",
        //         "cpus": 0.1,
        //         "memory": 512,
        //         "timeout": 30,
        //         "handler": "run",
        //         "public": true,
        //         "runtime": "nashorn",
        //         "provider": {
        //             "id": "11969fa1-36b0-4384-88b3-998fb93410bb",
        //             "locations": [

        //             ]
        //         },
        //         "periodic_info": {
        //         }
        //     }
        // }

        selectProvider.run({ type: 'Lambda', message: 'Select Provider' }, lambdaProvider => {

            debug(lambdaProvider);

            selectProvider.run({ type: 'Executor', message: 'Select Runtime' }, executorProvider => {

                debug(executorProvider);

                let questions = [
                    {
                        message: "Name",
                        type: 'input',
                        name: 'name',
                        // default: TODO: use filename as default
                        validate: function (input) {
                            if (!input) return "Required";
                            if (input.indexOf(' ') > -1) return "No Spaces";
                            return true;
                        }
                    },
                    {
                        message: "Description",
                        type: 'input',
                        name: 'description',
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
                        default: 0.1
                    },
                    {
                        message: "Memory (MB)",
                        type: 'input',
                        name: 'properties.memory',
                        default: 128
                    },
                    {
                        message: "Timeout (seconds)",
                        type: 'input',
                        name: 'properties.timeout',
                        default: 30
                    },
                    {
                        message: "Handler",
                        type: 'input',
                        name: 'properties.handler',
                        default: 'run'
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

                if (!argv.source) {
                    let moreQuestions = [];
                    if (!argv.url) {
                        moreQuestions.push({
                            message: "Lambda Package URL",
                            type: 'input',
                            name: 'properties.package_url',
                        });
                    }

                    moreQuestions.push({
                        message: "Is Package Compressed?",
                        type: 'confirm',
                        name: 'properties.compressed',
                    });

                    questions = moreQuestions.concat(questions);
                }

                inquirer.prompt(questions).then(answers => {

                    answers.properties.provider = {
                        id: lambdaProvider.id,
                        locations: []
                    };

                    answers.properties.runtime = executorProvider.properties.config.env.public.RUNTIME;
                    callback(answers);
                });
            });
        });
    }

    function debug(str) {
        if (argv.debug) {
            console.log(typeof str)
            if (typeof str == 'object') {
                console.log('[DEBUG] ' + JSON.stringify(str, null, 2));
            } else {
                console.log('[DEBUG] ' + str);
            }
        }
    }
}


exports.command = 'lambda'
exports.desc = 'Describe lambda'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectResource = require('../lib/selectResourceUI');
    const chalk = require('chalk');
    const selectHierarchy = require('../lib/selectHierarchy');

    // Main
    try {
        if (argv.fqon || argv.id) {
            // Command mode

            if (!argv.fqon) throw Error("missing argv.fqon");
            if (!argv.id) throw Error("missing argv.id");

            const lambda = gestalt.fetchLambda({
                fqon: argv.fqon,
                id: argv.id
            });

            doShowLambda(lambda, argv);
        } else {
            // Interactive mode

            selectLambda(lambda => {
                doShowLambda(lambda, argv);
            });
        }
    } catch (err) {
        console.log(err.message);
        console.log("Try running 'change-context'");
        console.log();
    }

    function doShowLambda(lambda, argv) {
        if (argv.raw) {
            console.log(JSON.stringify(lambda, null, 2));
        } else {
            showLambda(lambda);

            console.log(`Use '--raw' to see raw JSON output`);
            console.log();
            console.log('Run the following to see this lambda directly:')
            console.log();
            console.log(`    ./${argv['$0']} --fqon ${lambda.org.properties.fqon} --id ${lambda.id}`);
            console.log();
        }
    }

    function showLambda(lambda) {
        selectHierarchy.resolveEnvironment(() => {
            const options = {
                message: "Lambdas",
                headers: ['Lambda', 'Runtime', 'Public', 'FQON', 'Type', 'Owner', 'ID'],
                fields: ['name', 'properties.runtime', 'properties.public', 'org.properties.fqon', 'properties.code_type', 'owner.name', 'id'],
                sortField: 'description',
            }

            displayResource.run(options, [lambda]);

            // Display Code
            if (lambda.properties) {
                if (lambda.properties.code) {
                    const buf = Buffer.from(lambda.properties.code, 'base64');
                    displayCode(buf.toString('utf8'));
                }
            }
        });
    }

    function displayCode(code) {
        console.log(chalk.bold('--- Start of Lambda Code ---'));
        console.log(chalk.green(code));
        console.log(chalk.bold('--- End of Lambda Code ---'));
        console.log();
    }

    function selectLambda(callback) {
        selectHierarchy.resolveEnvironment(() => {
            let options = {
                mode: 'autocomplete',
                message: "Select Lambda",
                fields: ['name', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'properties.provider.name'],
                sortBy: 'name',
                fetchFunction: () => {
                    const res = gestalt.fetchLambdas();
                    return res;
                }
            }

            selectResource.run(options, selection => {
                if (callback) callback(selection);
            });
        });
    }
}
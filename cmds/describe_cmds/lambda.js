const cmd = require('../lib/cmd-base');
exports.command = 'lambda'
exports.desc = 'Describe lambda'
exports.builder = {
    all: {
        description: 'Describe from all lambdas'
    },
    org: {
        description: 'Describe from all lambdas in current org'
    }
}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectResource = require('../lib/selectResourceUI');
    const chalk = require('chalk');
    const selectHierarchy = require('../lib/selectHierarchy');
    const options = {
        message: "Lambdas",
        headers: ['Lambda', 'Runtime', 'Public', 'FQON', 'Type', 'Owner', 'ID'],
        fields: ['name', 'properties.runtime', 'properties.public', 'org.properties.fqon', 'properties.code_type', 'owner.name', 'id'],
        sortField: 'description',
    }

    if (argv.fqon || argv.id) {
        // Command mode

        if (!argv.fqon) throw Error("missing argv.fqon");
        if (!argv.id) throw Error("missing argv.id");

        const lambda = await gestalt.fetchLambda({
            fqon: argv.fqon,
            id: argv.id
        });

        doShowLambda(lambda, argv);
    } else if (argv.all) {
        const lambda = await selectFromAllLambdas();
        doShowLambda(lambda, argv);
    } else if (argv.org) {
        const lambda = await selectFromOrgLambdas();
        doShowLambda(lambda, argv);
    } else {        
        const lambda = await selectLambda();
        doShowLambda(lambda, argv);
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
            console.log(`    ${argv['$0']} ${argv._[0]} ${argv._[1]} --fqon ${lambda.org.properties.fqon} --id ${lambda.id}`);
            console.log();
        }
    }

    function showLambda(lambda) {

        displayResource.run(options, [lambda]);

        // Display Code
        if (lambda.properties) {
            if (lambda.properties.code) {
                const buf = Buffer.from(lambda.properties.code, 'base64');
                displayCode(buf.toString('utf8'));
            }
        }
    }

    function displayCode(code) {
        console.log(chalk.bold('--- Start of Lambda Code ---'));
        console.log(chalk.green(code));
        console.log(chalk.bold('--- End of Lambda Code ---'));
        console.log();
    }

    async function selectFromAllLambdas() {
        let fqons = await gestalt.fetchOrgFqons();
        let res = await gestalt.fetchOrgLambdas(fqons);
        return select(res);
    }

    async function selectFromOrgLambdas() {
        await selectHierarchy.resolveOrg();
        const res = await gestalt.fetchOrgLambdas();
        return select(res);
    }

    async function selectLambda() {
        await selectHierarchy.resolveEnvironment();
        const res = await gestalt.fetchLambdas();
        return select(res);
    }

    function select(res) {
        let options = {
            mode: 'autocomplete',
            message: "Select Lambda",
            fields: ['name', 'properties.runtime', 'properties.public', 'org.properties.fqon', 'properties.code_type', 'owner.name', 'id'],
            sortBy: 'name',
            resources: res
        }

        return selectResource.run(options);
    }
});
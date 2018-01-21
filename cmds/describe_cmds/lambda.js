const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui');
const chalk = require('chalk');
const cmd = require('../lib/cmd-base');
exports.command = 'lambda [name]'
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
    if (argv.fqon || argv.id) {
        // Command mode

        if (!argv.fqon) throw Error("missing argv.fqon");
        if (!argv.id) throw Error("missing argv.id");

        const lambda = await gestalt.fetchLambda({
            fqon: argv.fqon,
            id: argv.id
        });

        doShowLambda(lambda, argv);
    } else {
        const lambdaName = argv.name
        let lambda = null;

        if (argv.all) {
            lambda = await selectFromAllLambdas(lambdaName);
        } else if (argv.org) {
            lambda = await selectFromOrgLambdas(lambdaName);
        } else {
            lambda = await selectFromEnvLambdas(lambdaName);
        }

        if (!lambda) {
            console.error(`No lambda with name '${lambdaName}' in the current context.`);
        } else {
            doShowLambda(lambda, argv);
        }
    }
});

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

    const options = {
        message: "Lambdas",
        headers: ['Lambda', 'Runtime', 'Public', 'FQON', 'Type', 'Owner', 'ID'],
        fields: ['name', 'properties.runtime', 'properties.public', 'org.properties.fqon', 'properties.code_type', 'owner.name', 'id'],
        sortField: 'description',
    }
    ui.displayResource(options, [lambda]);

    // Display Code
    if (lambda.properties) {
        if (lambda.properties.code) {
            const buf = Buffer.from(lambda.properties.code, 'base64');
            const code = buf.toString('utf8');
            console.log(chalk.bold('--- Start of Lambda Code ---'));
            console.log(chalk.green(code));
            console.log(chalk.bold('--- End of Lambda Code ---'));
            console.log();
        }
    }
}

async function selectFromAllLambdas(lambdaName) {
    let fqons = await gestalt.fetchOrgFqons();
    let res = await gestalt.fetchOrgLambdas(fqons);
    return ui.selectLambda({ name: lambdaName }, res);
}

async function selectFromOrgLambdas(lambdaName) {
    const state = await ui.resolveOrg();
    const res = await gestalt.fetchOrgLambdas([state.org.fqon]);
    return ui.selectLambda({ name: lambdaName }, res);
}

async function selectFromEnvLambdas(lambdaName) {
    const state = await ui.resolveEnvironment();
    const res = await gestalt.fetchEnvironmentLambdas(state);
    return ui.selectLambda({ name: lambdaName }, res);
}
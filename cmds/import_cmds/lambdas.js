const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const fs = require('fs');
exports.command = 'lambdas'
exports.desc = 'List lambdas'
exports.builder = {
    dir: {
        alias: 'd',
        description: 'Directory to import Lambdas from'
    },
    // all: {
    //     description: 'Display all lambdas in all orgs'
    // },
    // org: {
    //     description: 'Display all lambdas in the current org'
    // }
}

exports.handler = cmd.handler(async function (argv) {
    if (argv.dir) {
        const context = await ui.resolveEnvironment();
        const lambdaFiles = readLambdaFiles(argv.dir);
        const selectedLambdas = selectLambdaItems(lambdaFiles);
        const confirmed = await ui.promptToContinue('Proceed with import?');
        if (confirmed) {
            // Resolve lambda and executor providers

            // Do Import
            for (let item of selectedLambdas) {
                console.log(`Importing ${item.lambda.name} (${item.file})`);
                const res = await gestalt.createLambda(item.lambda, context);
            }
            console.log('Done.');
        } else {
            console.log('Aborted.');
        }
    }
});

function readLambdaFiles(dir) {
}

async function selectLambdaItems(lambdaFiles) {
    const options = {
        message: "Select Lambda",
        fields: ['lambda.name', 'file'],
        sortBy: 'lambda.name',
    }
    return await ui.select(options, lambdaFiles);
}

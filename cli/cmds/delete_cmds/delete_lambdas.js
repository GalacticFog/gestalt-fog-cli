const { gestalt } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'lambdas'
exports.desc = 'Delete lambdas'
exports.builder = {
    all: {
        description: 'Delete lambdas from all environments'
    },
    org: {
        description: 'Delete lambdas from all environments in current org'
    }
}
exports.handler = cmd.handler(async function (argv) {
    let lambdas = null;
    if (argv.all) {
        const fqons = await gestalt.fetchOrgFqons();
        lambdas = await gestalt.fetchOrgLambdas(fqons);
    } else if (argv.org) {
        const context = await ui.resolveOrg();
        lambdas = await gestalt.fetchOrgLambdas([context.org.fqon]);
    } else {
        const context = await ui.resolveEnvironment();
        lambdas = await gestalt.fetchEnvironmentLambdas(context);
    }

    if (lambdas.length == 0) {
        console.log('No lambdas in current context.');
        return;
    }

    console.log("Select lambdas to delete (use arrows and spacebar to modify selection)");
    console.log();

    const fields = ['name', 'description', 'owner.name', 'org.properties.fqon']//, 'environment.name'];

    const selectedLambdas = await ui.selectLambda({ mode: 'checkbox', defaultChecked: false, fields: fields }, lambdas);
    console.log();

    ui.displayResources(selectedLambdas);

    const confirmed = await ui.promptToContinue(`Proceed to delete ${selectedLambdas.length} lambda(s)?`, false);
    if (!confirmed) {
        console.log('Aborted.');
        return;
    }

    const promises = selectedLambdas.map(item => {
        console.log(`Deleting lambda ${item.name}...`)
        return gestalt.deleteLambda(item)
    });

    await Promise.all(promises);
    console.log('Done.');
});

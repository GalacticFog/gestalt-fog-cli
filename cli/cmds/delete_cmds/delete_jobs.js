const { gestalt } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { debug } = require('../lib/debug');
exports.command = 'jobs'
exports.desc = 'Delete jobs'
exports.builder = {
    all: {
        description: 'Delete jobs from all environments'
    },
    org: {
        description: 'Delete jobs from all environments in current org'
    }
}
exports.handler = cmd.handler(async function (argv) {
    let jobs = null;
    if (argv.all) {
        const fqons = await gestalt.fetchOrgFqons();
        jobs = await gestalt.fetchOrgJobs(fqons);
    } else if (argv.org) {
        const context = await ui.resolveOrg();
        jobs = await gestalt.fetchOrgJobs([context.org.fqon]);
    } else {
        const context = await ui.resolveEnvironment();
        jobs = await gestalt.fetchJobs(context);
    }

    if (jobs.length == 0) {
        console.log('No jobs in current context.');
        return;
    }

    console.log("Select jobs to delete (use arrows and spacebar to modify selection)");
    console.log();

    debug(jobs);

    const fields = ['name', 'description', 'properties.status', 'properties.image', 'owner.name', 'org.properties.fqon'];

    const selectedJobs = await ui.selectJob({ mode: 'checkbox', defaultChecked: false, fields: fields }, jobs);
    console.log();

    ui.displayResources(selectedJobs);

    const confirmed = await ui.promptToContinue(`Proceed to delete ${selectedJobs.length} job(s)?`, false);
    if (!confirmed) {
        console.log('Aborted.');
        return;
    }

    const promises = selectedJobs.map(item => {
        console.log(`Deleting job ${item.name}...`)
        return gestalt.deleteJob(item)
    });

    await Promise.all(promises);
    console.log('Done.');
});

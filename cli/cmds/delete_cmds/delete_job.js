const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');

exports.command = 'job [job_name]'
exports.desc = 'Delete job'
exports.builder = {
    force: {
        desc: "Force delete",
        required: false
    }
}
exports.handler = cmd.handler(async function (argv) {

    // fog delete container nginx1

    // Main
    if (argv.job_name) {
        // Command mode

        const context = await cmd.resolveEnvironment();

        const job = await gestalt.fetchJob({ name: argv.job_name }, context);

        const response = await gestalt.deleteJob(job, { force: argv.force });
        console.log(`Job '${job.name}' deleted.`);
    } else {

        // Interactive mode

        const context = await ui.resolveEnvironment();

        const jobs = await gestalt.fetchJobs(context);
        const job = await ui.selectJob({}, jobs);

        const confirm = await confirmIfNeeded();
        if (confirm) {
            const response = await gestalt.deleteJob(job, { force: argv.force });
            console.log(`Job '${job.name}' deleted.`);
        } else {
            console.log('Aborted.');
        }
    }
});

function confirmIfNeeded() {
    const questions = [
        {
            message: `Will delete job, are you sure?`,
            type: 'confirm',
            name: 'confirm',
            default: false
        },
    ];

    return inquirer.prompt(questions).then(answers => answers.confirm);
}

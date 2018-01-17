'use strict';
exports.command = 'configure-gitlab-project'
exports.desc = 'Configure Gitlab project'
exports.builder = {}
exports.handler = function (argv) {
    const gitlab = require('../lib/gestalt-gitlab-client');
    const selectResource = require('../lib/selectResourceUI');
    // const selectGestaltContext = require('../lib/selectOrgWorkspaceEnvironment');
    const selectHierarchy = require('../lib/selectHierarchy');
    const chalk = require('chalk');
    const inquirer = require('inquirer');

    console.log("Step 1 - Select a Gitlab project to configure for deployment to Gestalt.")
    console.log();
    // Choose a Gitlab Project
    doGetProjects((err, project) => {
        if (err) {
            console.error(`ERROR: ${err.message}`);
            return;
        }

        console.log();
        console.log("Step 2 - Select a Gestalt Environment to deploy to.")
        console.log();

        // Choose a Gestalt Org / Workspace / Environment
        doSelectGestaltEnvironment((err, context) => {

            // Summarize and confirm
            doSummarizeAndConfirm(project, context, (confirmed) => {
                if (!confirmed) {
                    // Cancelled
                    console.log('Aborted.');
                    return;
                }

                // Execute
                doSetupGitlabProject(project, context, (err, result) => {

                    if (err) {
                        console.error(`ERROR: ${err.message}`);
                        console.error();
                        console.error(`An error occurred, aborted.`);
                        return;
                    }

                    // complete
                    console.log(`.gitlab-ci.yml:\n'''\n${context.fileContents}\n'''`);
                    console.log(`Complete, .gitlab-ci.yaml written to Gitlab project '${project.name_with_namespace}'.`);
                });
            });
        });
    });

    // 
    // ------------------ Functions -------------------------
    ///

    function doGetProjects(callback) {
        if (!callback) throw Error('missing callback');
        gitlab.listProjects((err, result) => {
            if (err) {
                callback(err, null);
                return;
            }
            selectGitlabProject(result, callback);
        });
    }

    function selectGitlabProject(result, callback) {
        if (!result) throw Error('missing result');
        if (!callback) throw Error('missing callback');

        const options = {
            mode: 'autocomplete',
            message: "Gitlab Projects",
            fields: ['name_with_namespace', 'description_truncated'],
            sortBy: 'name_with_namespace',
            pageSize: 20,
            resources: result
        }

        result.map(r => {
            const width = 100;
            r.description_truncated = r.description;
            if (String(r.description_truncated).length > width) {
                r.description_truncated = `${String(r.description).substring(0, width)}...`;
            }
        });

        selectResource.run(options, (selection) => {
            callback(null, selection);
        });
    }

    function doSelectGestaltEnvironment(callback) {

        // Only show 'DEV' environments
        const opts = {
            environment: {
                filter: function (r) {
                    return r.properties.environment_type == 'development';
                }
            }
        }

        // Choose a Gestalt Org / Workspace / Environment
        selectHierarchy.chooseContext(opts).then(context => {
            callback(null, context);
        });
    }

    function getGitlabCiFileContents(context) {
        if (!context) throw Error('missing context');
        if (!context.org) throw Error('missing context.org');
        if (!context.org.fqon) throw Error('missing context.org.fqon');
        if (!context.environment) throw Error('missing context.environment');
        if (!context.environment.id) throw Error('missing context.environment.id');

        const fileContents = `# Generated for deployment to Gestalt Platform: org=${context.org.fqon}, env=${context.environment.id}
variables:
    GF_ORG: ${context.org.fqon}
    GF_ENV: ${context.environment.id}

image: docker:git

services:
    - docker:dind

stages:
    - build
    - review

build-and-publish:
    stage: build
    script:
        - docker login -u gitlab-ci-token -p $CI_BUILD_TOKEN $CI_REGISTRY
        - docker build --build-arg GIT_HASH=$CI_BUILD_REF -t $CI_REGISTRY_IMAGE:$CI_BUILD_REF -t $CI_REGISTRY_IMAGE:latest -f Dockerfile .
        - docker push $CI_REGISTRY_IMAGE

review:
    stage: review
    environment:
        name: review-$CI_COMMIT_REF_SLUG
        on_stop: stop_review
    script:
        - apk add --update --no-cache curl && rm -rf /var/cache/apk/*
        - curl -u "$GF_API_KEY":"$GF_API_SECRET" "$GF_DEPLOY_URL?org=$GF_ORG&env=$GF_ENV&sha=$CI_COMMIT_SHA&ref=$CI_COMMIT_REF_SLUG&image=$CI_REGISTRY_IMAGE&name=$CI_PROJECT_NAME&pid=$CI_PROJECT_ID"
    except:
        - /^[Ww][Ii][Pp]-.*$/

stop_review:
    stage: review
    script:
        - apk add --update --no-cache curl && rm -rf /var/cache/apk/*
        - curl -u "$GF_API_KEY":"$GF_API_SECRET" "$GF_DEPLOY_URL?entryPoint=stop&org=$GF_ORG&env=$GF_ENV&ref=$CI_COMMIT_REF_SLUG&name=$CI_PROJECT_NAME&pid=$CI_PROJECT_ID"
    variables:
        GIT_STRATEGY: none
    environment:
        name: review-$CI_COMMIT_REF_SLUG
        action: stop
    when: manual
    except:
        - master
`;
        return fileContents;
    }

    function doCommitGitlabCiFile(project, context, callback) {
        if (!project) throw Error('missing project');
        if (!callback) throw Error('missing callback');

        const fileContents = getGitlabCiFileContents(context);

        context.fileContents = fileContents; // save to context for later display

        const data = {
            file_path: '.gitlab-ci.yml',
            content: fileContents,
            commit_message: ".gitlab-ci.yml configured for Gestalt Platform"
        }
        gitlab.commitFile(project, data, (err, result) => {
            callback(err, result);
        });
    }

    function doSetupGitlabProject(project, context, callback) {
        if (!project) throw Error('missing project');
        if (!context) throw Error('missing context');
        if (!context.org) throw Error('missing context.org');
        if (!context.org.fqon) throw Error('missing context.org.fqon');
        if (!context.environment) throw Error('missing context.environment');
        if (!context.environment.id) throw Error('missing context.environment.id');
        if (!callback) throw Error('missing callback');

        console.log(`Committing .gitlab-ci.yml file`);

        // commit gitlabci file
        doCommitGitlabCiFile(project, context, (err, result) => {
            callback(err, result);
        });
    }

    function doSummarizeAndConfirm(project, context, callback) {
        if (!project) throw Error('missing project');
        if (!context) throw Error('missing context');
        if (!callback) throw Error('missing callback');

        console.log(`The following project will be set up for automatic deployment:`);
        console.log();
        console.log(`    ${chalk.bold(project.name_with_namespace)} (${project.web_url})`);
        console.log();
        console.log(`     - Check-in new '.gitlab-ci.yml' file`);
        console.log();
        console.log(`Builds will deploy to Gestalt Platform at:`);
        console.log();
        console.log('    Org:         ' + chalk.bold(`${context.org.description} (${context.org.fqon})`));
        console.log('    Workspace:   ' + chalk.bold(`${context.workspace.description} (${context.workspace.name})`));
        console.log('    Environment: ' + chalk.bold(`${context.environment.description} (${context.environment.name})`));
        console.log();

        // Prompt to continue

        const questions = [
            {
                message: "Proceed?",
                type: 'confirm',
                name: 'confirm',
                default: false // Don't proceed if no user input
            },
        ];

        inquirer.prompt(questions).then(answers => {
            const contents = JSON.stringify(answers, null, '  ');
            callback(answers.confirm);
        });
    }
}
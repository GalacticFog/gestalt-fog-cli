exports.run = (callback) => {
    const selectOrg = require('./selectOrg');
    const selectWorkspace = require('./selectWorkspace');
    const selectEnvironment = require('./selectEnvironment');
    const gestalt = require('./gestalt');

    selectOrg.run((org) => {
        if (!org) {
            console.log("No selection, exiting.");
            return;
        }

        console.log();
        // console.log(`${org.fqon} selected.`);
        // console.log();

        gestalt.setCurrentOrg(org);        

        selectWorkspace.run((workspace) => {
            if (!workspace) {
                console.log("No selection, exiting.");
                return;
            }

            console.log();
            // console.log(`${workspace.name} selected.`);
            // console.log();

            gestalt.setCurrentWorkspace(workspace);

            selectEnvironment.run((environment) => {
                if (!environment) {
                    console.log("No selection, exiting.");
                    return;
                }

                console.log();
                // console.log(`${environment.name} selected.`);
                // console.log();

                gestalt.setCurrentEnvironment(environment);

                callback({
                    org: org,
                    workspace: workspace,
                    environment: environment
                });
            });
        });
    });
}
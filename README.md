
# 'FOG' CLI Utilities

Interactive, stateful command line utilities for Gestalt Platform.

## Getting Started

```
git clone git@gitlab.com:galacticfog/fog-cli-utilities.git
cd fog-cli-utilities
npm install
```

Note: These utilities are packaged in a Docker image here: https://gitlab.com/galacticfog/gestalt-utility-image


## Initial Configuration
```
$ ./configure 
? Gestalt URL 
? Username 
? Password [hidden]

./login

./switch-context
```

## List Gestalt Resources
Commands to query for resources.
```
# List All
list-all-api-endpoints
list-all-containers
list-all-environments
list-all-lambdas
list-all-orgs
list-all-workspaces

# List in the current org
list-org-api-endpoints
list-org-containers
list-org-environments
list-org-lambdas
list-workspaces

# List in the current Environment
list-api-endpoints
list-containers
list-environments
list-lambdas

# Show resource details in the current context
show-container-details
show-container-raw-json
show-environment-entitlements
show-org-entitlements
show-workspace-entitlements
```

## Select Context Commands
Commands to change the current context to selected resources.
```
clear-context
switch-context
switch-environment
switch-org
switch-workspace
```

## Other
```
configure*
login
logout
```

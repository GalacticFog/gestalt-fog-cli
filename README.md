
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

./authenticate

./select-context
```

## Display Gestalt Resources
Commands to query for resources.
```
# Show All
show-all-api-endpoints
show-all-containers
show-all-environments
show-all-lambdas
show-all-orgs
show-all-workspaces

# Show resources in the current context
show-api-endpoints
show-container-details
show-container-raw-json
show-containers
show-current-context
show-environment-entitlements
show-environments
show-lambdas
show-org-entitlements
show-workspace-entitlements
show-workspaces
```

## Select Context Commands
Commands to change the current context to selected resources.
```
select-container
select-context
select-environment
select-org
select-workspace
clear-current-context
select-context
show-current-context
```

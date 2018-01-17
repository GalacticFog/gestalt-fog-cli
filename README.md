# Fog CLI Utilities

Client utility for Gestalt Platform (similar to `kubectl` for Kubernetes and `dcos` for DC/OS).

## Binary Installation
```sh
wget https://(TBD path to published binary)/fog
chmod +x fog
mv fog /usr/local/bin
```

## Set up Bash Completion
```sh
fog bash-completion >> ~/.bashrc
```

## Login to Gestalt Platform
```sh
fog login
```

## Discover commands
```sh
# Help
fog --help
fog [command] --help
```

## Tab autocompletion
```sh
fog <tab, tab>
fog [command] <tab,tab>
```

## Run from source
```sh
git clone git@gitlab.com:galacticfog/fog-cli-utilities.git
cd fog-cli-utilities
npm install
./fog
```

## Build binary from source
```sh
git clone git@gitlab.com:galacticfog/fog-cli-utilities.git
cd fog-cli-utilities
npm install

npm install pkg -g

# Build
pkg .

# For MacOS
mv fog-macos /usr/local/bin/fog

# For Linux
mv fog-linux /usr/local/bin/fog

# For Windows
mv fog-win.exe /Somewhere/In/Path/fog.exe
```
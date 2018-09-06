#!/bin/bash

exit_with_error() {
  echo
  echo "[Error] $@"
  exit 1
}

exit_on_error() {
  if [ $? -ne 0 ]; then
    echo
    echo "[Error] $@"
    exit 1
  fi
}

check_if_installed() {
    for curr_tool in "$@"; do
        if ! which $curr_tool &> /dev/null; then
            exit_with_error "Unable locate $curr_tool"
        fi
    done
}

echo "Validating that dependencies are present..."
check_if_installed npm pkg

echo "Lookup / Set variables...."
VERSION=`cat package.json | jq -r '.version'`
OS_LIST="linux alpine macos"

echo "Installing npm packages..."
npm install
exit_on_error "Failed npm install, aborting..."

echo "Clean-up and Re-build Fog CLI..."
rm -rf ./target

for os in ${OS_LIST}; do
  echo "Building fog for target ${os}..."
  mkdir -p ./target/${os}
  pkg -t node8-${os}-x64  -o ./target/${os}/fog .
  exit_on_error "Failed package fog cli for ${os}, aborting..."
done

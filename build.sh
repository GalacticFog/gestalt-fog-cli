echo "Installing npm packages..."
npm install

rm -rf ./target

VERSION=`cat package.json | jq -r '.version'`

os_list="linux alpine macos"

for os in ${os_list}; do
    echo "Building fog for target $os..."
    mkdir -p ./target/$os
    pkg -t node8-${os}-x64  -o ./target/${os}/fog .
    cd ./target/${os}
    zip ../gestalt-fog-cli-${os}-$VERSION.zip fog
    cd -
done

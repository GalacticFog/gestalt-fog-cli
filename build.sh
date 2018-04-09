echo "Installing npm packages..."
npm install

rm -rf ./target/linux
rm -rf ./target/macos

VERSION=`cat package.json | jq -r '.version'`

echo "Building fog for Linux..."
mkdir -p ./target/linux
pkg -t node8-linux-x64  -o ./target/linux/fog .
cd ./target/linux
zip gestalt-fog-cli-linux-v$VERSION.zip fog
cd -

echo "Building fog for MacOS..."
mkdir -p ./target/macos
pkg -t node8-macos-x64  -o ./target/macos/fog .
cd ./target/macos
zip gestalt-fog-cli-macos-v$VERSION.zip fog
cd -


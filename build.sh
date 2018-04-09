echo "Installing npm packages..."
npm install

echo "Building fog for Linux..."
mkdir -p ./target/linux
pkg -t node8-linux-x64  -o ./target/linux/fog .

echo "Building fog for MacOS..."
mkdir -p ./target/macos
pkg -t node8-macos-x64  -o ./target/macos/fog .

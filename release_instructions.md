```sh
cd cli

vi package.json # Edit package.json to increment the version number

./build.sh

git add .

version=`cat package.json | jq -r .version`

echo $version > ../LATEST

git commit -m "Version $version"

git tag $version

git push --mirror https://github.com/GalacticFog/gestalt-fog-cli

```
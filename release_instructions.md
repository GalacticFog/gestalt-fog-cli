To build a release
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

(now upload release binaries to github)

```


To update dependencies
```
rm -rf cli/node_modules cli/package-lock.json

rm -rf sdk/node_modules sdk/package-lock.json

cd cli

./build.sh

(now test, then check in new package-lock.json)

```

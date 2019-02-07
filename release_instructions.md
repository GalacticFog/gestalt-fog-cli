```sh
cd cli

vi package.json # Edit package.json to increment the version number

./build.sh

git add .

git commit -m "Version x.x.x"

git tag x.x.x

git push --mirror https://github.com/GalacticFog/gestalt-fog-cli
```
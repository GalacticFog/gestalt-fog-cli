#!/bin/bash

exit_on_error() {
  if [ $? -ne 0 ]; then
    echo
    echo "[Error] $@"
    exit 1
  fi
}

IMAGE_NAME="gestalt-cli"
publish="true"

#Build
echo "Building..."
docker build -t ${IMAGE_NAME} . | tee buildoutput
exit_on_error "docker build failed, aborting."
imageid=`tail buildoutput | grep "^Successfully built" | awk '{ print $3 }'`

#Tag and Push
for curr_tag in $@; do
  echo "Tagging ${curr_tag}"
  docker tag $imageid galacticfog/${IMAGE_NAME}:${curr_tag}
  exit_on_error "image tag '${curr_tag}' failed, aborting."
  if [ ${publish} == "true" ]; then
    docker push galacticfog/${IMAGE_NAME}:${curr_tag}
    exit_on_error "docker push failed, aborting."
  fi
done

echo "Build and publish successful."

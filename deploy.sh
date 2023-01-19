#!/bin/bash

IMAGE_NAME=asia-northeast1-docker.pkg.dev/default-364617/timeline
IMAGE_PATH=$IMAGE_NAME/latest

docker build . --tag $IMAGE_PATH
docker push $IMAGE_PATH
gcloud run deploy timeline --image $IMAGE_PATH --region asia-northeast1

digests=$(gcloud container images list-tags $IMAGE_NAME --sort-by=~TIMESTAMP --limit=5 --format='get(digest)')

for digest in $digests; do
  if [[ $digest != $(echo "$digests" | tail -n 1) ]]; then
    gcloud container images delete $IMAGE_NAME@$digest --force-delete-tags
  fi
done

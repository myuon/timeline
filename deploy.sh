#!/bin/bash

IMAGE_NAME=asia-northeast1-docker.pkg.dev/default-364617/timeline
IMAGE_PATH=$IMAGE_NAME/latest

docker build . --tag $IMAGE_PATH
docker push $IMAGE_PATH
gcloud run deploy timeline --image $IMAGE_PATH --region asia-northeast1

digests=$(gcloud container images list-tags $IMAGE_PATH --sort-by=~TIMESTAMP --format='get(digest)')
digests_to_delete=$(echo "$digests" | tail -n +6)

for digest in $digests_to_delete; do
  echo $IMAGE_NAME@$digest
  gcloud container images delete $IMAGE_PATH@$digest --force-delete-tags --quiet
done

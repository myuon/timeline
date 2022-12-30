#!/bin/sh
set -e

if [ -f ./dist/server/db.sqlite ]; then
  mv ./dist/server/db.sqlite ./dist/server/db.sqlite.bk
fi

litestream restore -if-replica-exists -config /etc/litestream.yml ./dist/server/db.sqlite

if [ -f ./dist/server/db.sqlite ]; then
  echo "---- Restored from Cloud Storage ----"
  rm ./dist/server/db.sqlite.bk
else
  echo "---- Failed to restore from Cloud Storage ----"
  mv ./dist/server/db.sqlite.bk ././dist/server/db.sqlite
fi

exec litestream replicate -exec "/nodejs/bin/node dist/server/index.js" -config /etc/litestream.yml

#!/bin/sh

set -x

PATH="/home/server/.nvm/versions/node/v24.12.0/bin:/usr/bin:/home/server/.rbenv/shims/"
export PATH

GIT_WORK_TREE="/your/server/your_repo"
export GIT_WORK_TREE

# This is needed for git push based deploy
git reset --hard

cd $GIT_WORK_TREE
git checkout .

cd backend
npm install

# ssh server@domain.com "/your/server/your_repo/bin/deploy/prod/backend.sh"

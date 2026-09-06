#!/bin/sh

set -x

PATH="/home/server/.nvm/versions/node/v24.12.0/bin:/usr/bin:/home/server/.rbenv/shims/"
export PATH

GIT_WORK_TREE="/home/server/you_repo"
export GIT_WORK_TREE

# This is needed for git push based deploy
git reset --hard

cd $GIT_WORK_TREE
git checkout .

cd admin
npm install
npm run build

rsync -avh /home/server/you_repo/admin/dist/ /var/www/html/you_repo/admin

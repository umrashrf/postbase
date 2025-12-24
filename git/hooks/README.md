# Git Hooks

## post-receive hook

The purpose of this hook is to automate deployment of your app with `git push`.

## How to enable post-receive hook on your server?

1. Login to your ssh server
2. cd /path/to/your/app/repo

```
ln -s `pwd`/git/hooks/post-receive `pwd`/.git/hooks/post-receive
```

Allow post-receive hook to copy over files.

```
sudo chown -R you_username:root /var/www/html
```

Lastly,

```
git remote add deploy server_username@your_server:/your/server/your_repo
git push deploy
```

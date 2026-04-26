# Git Hooks

## post-receive hook

The purpose of this hook is to automate deployment of your app with `git push`.

## How to enable post-receive hook on your server?

1. Login to your ssh server
2. mkdir /path/to/your/app/repo
3. cd /path/to/your/app/repo
4. git init

Locally, in your dev environment:

```
git remote add deploy server_username@your_server:/your/server/your_repo
git push deploy
```

Back to ssh server:

```
ln -s `pwd`/git/hooks/post-receive `pwd`/.git/hooks/post-receive
```

Allow post-receive hook to copy over files.

```
sudo chown -R you_username:root /var/www/html
```

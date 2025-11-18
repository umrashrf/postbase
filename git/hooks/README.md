# Git Hooks

## post-receive hook

The purpose of this hook is to automate deployment of your app with `git push`.

## How to enable post-receive hook on your server?

```
ln -s `pwd`/git/hooks/post-receive `pwd`/.git/hooks/post-receive
```

Allow post-receive hook to copy over files.

```
sudo chown -R you_username:root /var/www/html
```

Follow next steps in etc/sudoers.d for post-receive hook to run.

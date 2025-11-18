# Systemd for backend process

### Reload the systemd user configuration to recognize the new service:

```
systemctl --user daemon-reload
```

### Start the service.

```
systemctl --user start your_website.com.service
```

### Enable the service to start automatically on login:

```
systemctl --user enable your_website.com.service
```

### Check the service status.

```
systemctl --user status your_website.com.service
```

### Restart the service.

```
systemctl --user restart your_website.com.service
```

## Lingering

### Lingering: If you want your user service to continue running even after you log out, you need to enable user lingering:

```
loginctl enable-linger your_username
```

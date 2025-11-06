# Nginx (Web Server)

## Let's Encrypt for HTTPS

```
brew install certbot
cd nginx/letsencrypt
certbot certonly --manual --preferred-challenges dns-01 -d your_website.com -d *.your_website.com
```

## Enable Nginx

```
cp /Users/your_username/your_website/nginx/www.your_website.com.conf /opt/homebrew/etc/nginx/services/

brew services restart nginx
brew services info nginx

tail /opt/homebrew/var/log/nginx/error.log
tail /opt/homebrew/var/log/nginx/access.log
```

# Nginx (Web Server)

## Install

```
brew install nginx certbot
```

## Map hosts to localhost

This is needed so locally when you visit your website, it will use your nginx.

```
sudo echo "127.0.0.1 your_website.com" >> /etc/hosts
sudo echo "127.0.0.1 www.your_website.com" >> /etc/hosts
```

## Let's Encrypt for HTTPS

```
brew install certbot
cd nginx/letsencrypt
sudo certbot certonly --manual --preferred-challenges dns-01 -d your_website.com -d www.your_website.com
```

## Enable Nginx

```
cp /Users/your_username/your_website/nginx/www.your_website.com.conf /opt/homebrew/etc/nginx/services/

brew services restart nginx
brew services info nginx

tail /opt/homebrew/var/log/nginx/error.log
tail /opt/homebrew/var/log/nginx/access.log
```

Note you can skip running frontend server if your are using nginx.
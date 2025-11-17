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

Configuring nginx varies based on whether you are using apt (Linux) or homebrew (Mac) package manager.

### Homebrew (Mac)

First, you must edit this file /Users/your_username/your_website/nginx/www.your_website.com.conf and fix names, paths, etc

```
cp /Users/your_username/your_website/nginx/www.your_website.com.conf /opt/homebrew/etc/nginx/services/

brew services restart nginx
brew services info nginx

tail /opt/homebrew/var/log/nginx/error.log
tail /opt/homebrew/var/log/nginx/access.log
```

## apt (Linux)

This is different because when nginx is installed using apt, it runs with sudo.

```
sudo mkdir /etc/ssl/certs/your_website
sudo cp nginx/letsencrypt/fullchain.pem /etc/ssl/certs/your_website

sudo mkdir /etc/ssl/private/your_website
sudo cp nginx/letsencrypt/privkey.pem /etc/ssl/private/your_website

mkdir /var/www/html/your_website
sudo cp -a frontend/dist/. /var/www/html/your_website

sudo cp nginx/apt/www.your_website.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/www.your_website.com.conf /etc/nginx/sites-enabled

nginx -t

sudo systemctl restart nginx
```

Note you can skip running frontend server if you are using nginx.
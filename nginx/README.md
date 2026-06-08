# Nginx (Web Server)

## Install

### Homebrew (Mac)

```
brew install nginx
```

## apt (Linux)

Installation instructions https://nginx.org/en/linux_packages.html#Ubuntu

## Map hosts to localhost

This is needed so locally when you visit your website, it will use your nginx.

```
sudo echo "127.0.0.1 your_website.com" >> /etc/hosts
sudo echo "127.0.0.1 www.your_website.com" >> /etc/hosts
```

## Let's Encrypt for HTTPS

### Homebrew (Mac)

Installation instructions https://certbot.eff.org/instructions?ws=other&os=osx

### apt (Linux)

Installation instructions https://certbot.eff.org/instructions?ws=other&os=pip

After installing the certbot, generate the certificates and private keys.

#### Manual Method

Using this method, you have to manually set DNS records which can be slow and error-prone but works in complicated situations.

```
cd nginx && rm -rf letsencrypt
sudo certbot certonly --manual --preferred-challenges dns-01 -d your_website.com -d www.your_website.com
```

#### Recommended Method

To use this method, you will need two nginx config files (http and https). First only copy and enable http nginx file and restart nginx to use the following command to generate your certificates.

Make sure your nginx web server is running and is serving all your domains listed in the command below.

*If prompted to choose an option, select option 3 or an option which says something like "an existing web server running".*

```
sudo certbot certonly -d your_website.com -d www.your_website.com -w /var/www/html/your_website/
```

This will generate your certificate at /etc/letsencrypt/live/your_domain.com/fullchain.pem and key at /etc/letsencrypt/live/your_domain.com/privkey.pem.

Once the certificates are generated, update your https nginx file with the right paths and copy over to /etc/nginx/sites-available/ and /etc/nginx/sites-enabled/ and restart nginx. Don't forget to delete the older http nginx file.

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

tail /var/log/nginx/error.log
tail /var/log/nginx/access.log
```

Note you can skip running frontend server if you are using nginx.

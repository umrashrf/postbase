#!/bin/bash

# 1. Update & upgrade

sudo apt update && sudo apt upgrade

# 2. install nginx - https://nginx.org/en/linux_packages.html#Ubuntu

sudo apt install -y curl gnupg2 ca-certificates lsb-release ubuntu-keyring

curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null

gpg --dry-run --quiet --no-keyring --import --import-options import-show /usr/share/keyrings/nginx-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
https://nginx.org/packages/ubuntu `lsb_release -cs` nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list

echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n" \
    | sudo tee /etc/apt/preferences.d/99nginx

sudo apt update
sudo apt install -y nginx

# 3. Install node and npm - https://nodejs.org/en/download

# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 24

# Verify the Node.js version:
node -v # Should print "v24.12.0".

# Verify npm version:
npm -v # Should print "11.6.2".

# 4. Install Docker

# Add Docker's official GPG key:
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
echo "TODO: sudo systemctl status docker"

docker volume create postgres_data
docker run --name postgres -d \
    -p 5432:5432 \
    -e POSTGRES_PASSWORD=yoursecretpassword \
    -e PGDATA=/var/lib/postgresql/data \
    --mount source=postgres_data,target=/var/lib/postgresql/data \
    --restart=unless-stopped \
    postgres;

# 5. Postgres for psql - https://www.postgresql.org/download/linux/ubuntu/

sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
sudo apt install curl ca-certificates
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
. /etc/os-release
sudo sh -c "echo 'deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $VERSION_CODENAME-pgdg main' > /etc/apt/sources.list.d/pgdg.list"
sudo apt update
sudo apt install postgresql-18

PGPASSWORD=yoursecretpassword psql -h localhost -U postgres -d postgres -c "create database app"; 

adduser server
mkdir -p /home/server/app
cd /home/server/app
git init

mkdir -p /var/www/html/app
chown server:root -R /var/www/html/app

#sudo mkdir /etc/ssl/certs/app
#sudo cp nginx/letsencrypt/fullchain.pem /etc/ssl/certs/app

#sudo mkdir /etc/ssl/private/app
#sudo cp nginx/letsencrypt/privkey.pem /etc/ssl/private/app

#sudo cp nginx/apt/app.conf /etc/nginx/sites-available/
#sudo ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled

#nginx -t

#sudo systemctl restart nginx

# Postbase Backend

Custom backend code written in Node.js and Express.js to use Firebase like API against PostgreSQL. 

Also support Firebase like Rule based security. See backend/postbase_db_rules.js

Follow the steps below to setup this boilerplate

### Todo

- [ ] Install PostgreSQL - Easiest is to use Docker (Don't forget to set PGDATA=/var/lib/postgresql/data/pgdata)
```
docker run --name postgres -d \
    -p 5432:5432 \
    -e POSTGRES_PASSWORD=yoursecretpassword \
    -e PGDATA=/var/lib/postgresql/data \
    postgres
```
- [ ] Setup BetterAuth - https://www.better-auth.com/docs/installation#create-database-tables
- [ ] Move template.env to .env and set all the environment variables

```
cd postbase/backend 
npm install
```

- [ ] Design or copy schema from backend/migrations/1762137399367_init_jsonb_schema.js and run migrations
```
npm run migrate:up
```

Learn more from https://synvinkel.org/notes/node-postgres-migrations

## Local (HTTP)

```
node local.js
```

## Production (HTTPS)

```
node main.js
```

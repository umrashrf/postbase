# Postbase Backend

Custom backend code written in Node.js and Express.js to use Firebase like API against PostgreSQL. 

Also support Firebase like Rule based security. See backend/postbase_db_rules.js

Follow the steps below to setup this boilerplate

### Todo

- [ ] Install PostgreSQL - Easiest is to use Docker (Don't forget to set PGDATA=/var/lib/postgresql/data/pgdata)
```
docker volume create postgres_data
docker run --name postgres -d \
    -p 5432:5432 \
    -e POSTGRES_PASSWORD=yoursecretpassword \
    -e PGDATA=/var/lib/postgresql/data \
    --mount source=postgres_data,target=/var/lib/postgresql/data \
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

* Note: Because of PostgreSQL's pg_notify() function, JSONB data is limited to 8000 bytes (1 char = 1 byte). To avoid this limitation, do not use 3rd migration.

Learn more from https://synvinkel.org/notes/node-postgres-migrations

## Local (HTTP)

```
node local.js
```

## Production (HTTPS)

```
node main.js
```

# Tests

Don't forget to create a database and run migrations first

## Create Database

```
PGPASSWORD=yoursecretpassword psql -h localhost -U postgres -c 'create database postbase_test;'
```

## Run Migrations

```
cd backend/lib/postbase/
npm run migrate:up
```

## Run test

```
npm test
```

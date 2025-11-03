# Postbase Backend

Custom backend code written in Node.js and Express.js to use Firebase like API against PostgreSQL. 

Also support Firebase like Rule based security. See backend/rules.js

Follow the steps below to setup this boilerplate

### Todo

- [ ] Install PostgreSQL - Easiest is to use Docker (Don't forget to set PGDATA=/var/lib/postgresql/data/pgdata)
- [ ] Setup BetterAuth - https://www.better-auth.com/docs/installation#create-database-tables

```
cd postbase/backend 
npm install
npm run migrate:up
```

```
node main.js
```

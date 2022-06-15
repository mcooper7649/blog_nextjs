---
title: Postgres Notes
excerpt: PostgreSQL is an advanced, enterprise class open source relational database that supports both SQL (relational) and JSON (non-relational) querying. It is a highly stable database management system, backed by more than 20 years of community development which has contributed to its high levels of resilience, integrity, and correctness. PostgreSQL is used as the primary data store or data warehouse for many web, mobile, geospatial, and analytics applications
image: postgres-main.jpeg
isFeatured: true
date: '2022-06-06'
---

## What is Postgres?

![PostgreSQL](postgres-main.jpeg)

PostgreSQL is an advanced, enterprise class open source relational database that supports both SQL (relational) and JSON (non-relational) querying. It is a highly stable database management system, backed by more than 20 years of community development which has contributed to its high levels of resilience, integrity, and correctness. PostgreSQL is used as the primary data store or data warehouse for many web, mobile, geospatial, and analytics applications

## Documentation

- NPM Package [here](https://www.npmjs.com/package/postgres)
- PostgreSQL Favorite YouTube Tutorial [here](https://www.youtube.com/watch?v=zw4s3Ey8ayo)

## Installation

```sh
npm install postgres
```

## Usage

### Create your sql database instance

```js
import postgres from 'postgres';
const sql = postgres({
  /* options */
}); // will use psql environment variables
export default sql;
```

### Simply Import for use elsewhere

```js
import sql from './db.js';

async function getUsersOver(age) {
  const users = await sql`
    select
      name,
      age
    from users
    where age > ${age}
  `;
  // users = Result [{ name: "Walter", age: 80 }, { name: 'Murray', age: 68 }, ...]
  return users;
}

async function insertUser({ name, age }) {
  const users = await sql`
    insert into users
      (name, age)
    values
      (${name}, ${age})
    returning name, age
  `;
  // users = Result [{ name: "Murray", age: 68 }]
  return users;
}
```

## Connection

- postgres([url], [options])
  You can use either a postgres:// url connection string or the options to define your database connection properties. Options in the object will override any present in the url. Options will fall back to the same environment variables as psql.

```sql

const sql = postgres('postgres://username:password@host:port/database', {
  host                 : '',            // Postgres ip address[s] or domain name[s]
  port                 : 5432,          // Postgres server port[s]
  database             : '',            // Name of database to connect to
  username             : '',            // Username of database user
  password             : '',            // Password of database user
  ...and more
})
```

## Noteables

- A Free Open Source Relational Database Management System or RDBMS
- Emphasized extensibility and SQL Compliance
- Postgres features transactions with ACID pipelines.

Learn more about it [here](https://www.npmjs.com/package/postgres)

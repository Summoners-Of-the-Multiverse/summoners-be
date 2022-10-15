# Backend for Summoners

## Requirements

1. PostgreSQL
2. NodeJS (Node 16 was used in this project)

## How to start

1. Clone this repo
2. Configure .env
3. use ```npm run migrate:seed``` to add tables and seed the needed data.
4. If needed, request those asset files from us. (assets too large to commit to GitHub)
5. use ```npm run drop:seed``` to reseed your tables. (WARNING: THIS DROPS THE PUBLIC SCHEMA, MAKE SURE YOU WANT TO DROP THE SCHEMA BEFORE DOING THIS)
6. alternatively, you can use ```npm run rollback``` until you rollbacked to Migrate ID 1 and use ```npm run migrate:seed``` to reseed.
7. use ```npm install``` to install dependencies
8. use ```npm run restart``` to start the backend

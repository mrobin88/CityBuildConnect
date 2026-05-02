# Build Connect

## Quickstart

```bash
npm install
npm run db:init
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` - start local app
- `npm run lint` - run ESLint
- `npm run build` - production build
- `npm run start` - run production server
- `npm run db:init` - start DB, push schema, seed
- `npm run db:up` / `npm run db:down` - start/stop local Postgres container
- `npm run db:push` - sync schema to DB
- `npm run db:migrate` - create + apply migration
- `npm run db:deploy` - apply existing migrations
- `npm run db:seed` - seed data

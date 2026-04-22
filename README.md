# CityBuildConnect

CityBuildConnect is a Next.js app configured to run on Azure (not Vercel).

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start local services and seed the database:

```bash
npm run db:init
```

3. Start the app:

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Azure Deployment Notes

- This app does not require Vercel.
- `next.config.mjs` uses `output: "standalone"` to create a lean deployment artifact for Azure App Service.
- Build the app with:

```bash
npm run build
```

- Start the production server with:

```bash
npm run start
```

## Useful Scripts

- `npm run lint` - run ESLint
- `npm run db:up` - start local database container
- `npm run db:down` - stop local database container
- `npm run db:push` - push Prisma schema to database
- `npm run db:migrate` - create and apply migration
- `npm run db:seed` - seed database

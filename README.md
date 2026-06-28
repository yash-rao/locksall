# LocksAll

LocksAll is a Next.js prototype for centralized card lock and recovery workflows. It includes a marketing homepage, database-backed account signup/signin, and an authenticated prototype dashboard.

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example` and set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Create the database tables:

```bash
npm run db:push
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Vercel Setup

Add these environment variables in Vercel before using signup, signin, early access, or the prototype dashboard:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`, usually your deployed app URL

The Vercel build command runs `npm run db:deploy` before `npm run build`. If `DATABASE_URL` is set, this syncs the Prisma schema to the connected database. If `DATABASE_URL` is missing, the build continues, but runtime database features will return a clear configuration message.

## Scripts

- `npm run dev` starts local development.
- `npm run build` generates Prisma Client and builds the app.
- `npm run lint` runs ESLint.
- `npm run db:push` syncs the Prisma schema to the database.
- `npm run db:deploy` syncs the schema only when `DATABASE_URL` is configured.
- `npm run db:studio` opens Prisma Studio.

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

Add these environment variables in Vercel before deploying the database-backed auth flow:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`, usually your deployed app URL

After connecting a Postgres database, run the Prisma schema push once from a local machine or deployment workflow:

```bash
npm run db:push
```

## Scripts

- `npm run dev` starts local development.
- `npm run build` builds the app.
- `npm run lint` runs ESLint.
- `npm run db:push` syncs the Prisma schema to the database.
- `npm run db:studio` opens Prisma Studio.

import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set. Skipping prisma db push.");
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "db", "push"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

process.exit(result.status ?? 1);

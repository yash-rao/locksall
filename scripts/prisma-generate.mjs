import { spawnSync } from "node:child_process";

process.env.DATABASE_URL ||= "postgresql://user:password@localhost:5432/locksall_build_placeholder";

const result = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

process.exit(result.status ?? 1);

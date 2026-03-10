import { spawnSync } from "node:child_process";

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const args = ["firebase-tools@latest", "dataconnect:sdk:generate"];

if (process.env.FIREBASE_PROJECT_ID) {
  args.push("--project", process.env.FIREBASE_PROJECT_ID);
}

const result = spawnSync(npxCommand, args, { stdio: "inherit" });

if (result.error) {
  console.error("Failed to run firebase-tools:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);

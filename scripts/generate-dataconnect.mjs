import { spawnSync } from "node:child_process";

const npxCommand = "npx";
const args = ["--yes", "firebase-tools@latest", "dataconnect:sdk:generate"];

if (process.env.FIREBASE_PROJECT_ID) {
  args.push("--project", process.env.FIREBASE_PROJECT_ID);
}

const result = spawnSync(npxCommand, args, {
  stdio: "inherit",
  shell: true,
});

if (result.error) {
  console.error("Failed to run firebase-tools:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);

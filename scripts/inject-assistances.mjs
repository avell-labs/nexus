import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const outputPath = path.join(
  projectRoot,
  "src",
  "data",
  "authorized_assistances.json",
);

const rawJson = process.env.AUTHORIZED_ASSISTANCES_JSON;
const rawBase64 = process.env.AUTHORIZED_ASSISTANCES_JSON_B64;

function writeJsonFile(content) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");
  console.log(`Authorized assistances file generated at: ${outputPath}`);
}

if (rawJson && rawJson.trim()) {
  JSON.parse(rawJson);
  writeJsonFile(rawJson);
  process.exit(0);
}

if (rawBase64 && rawBase64.trim()) {
  const decoded = Buffer.from(rawBase64, "base64").toString("utf8");
  JSON.parse(decoded);
  writeJsonFile(decoded);
  process.exit(0);
}

console.log(
  "No AUTHORIZED_ASSISTANCES_JSON(_B64) provided. Skipping data injection.",
);

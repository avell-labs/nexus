import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const templatePath = path.join(rootDir, ".github", "release-template.md");
const outputPath = path.join(rootDir, ".github", "release-notes.md");

const tag = process.env.GITHUB_REF_NAME || process.argv[2] || "v0.0.0";
const date = new Date().toISOString().slice(0, 10);

function run(command) {
  return execSync(command, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function getPreviousTag(currentTag) {
  const tagsRaw = run("git tag --sort=-version:refname");
  if (!tagsRaw) return null;

  const tags = tagsRaw.split(/\r?\n/).filter(Boolean);
  const currentIndex = tags.indexOf(currentTag);

  if (currentIndex === -1) return tags[0] ?? null;
  return tags[currentIndex + 1] ?? null;
}

function getChanges(currentTag, previousTag) {
  const range = previousTag ? `${previousTag}..${currentTag}` : currentTag;
  const log = run(`git log ${range} --pretty=format:"- %s (%h)"`);

  if (!log) {
    return "- Internal maintenance updates.";
  }

  return log;
}

const template = fs.readFileSync(templatePath, "utf8");
const previousTag = getPreviousTag(tag);
const changes = getChanges(tag, previousTag);

const rendered = template
  .replaceAll("{{TAG}}", tag)
  .replaceAll("{{DATE}}", date)
  .replaceAll("{{CHANGES}}", changes);

fs.writeFileSync(outputPath, rendered, "utf8");
console.log(`Release notes generated at ${outputPath}`);

import { readFileSync } from "node:fs";
import path from "node:path";

async function loadFirebaseAdmin() {
  try {
    const module = await import("firebase-admin");
    return module.default ?? module;
  } catch (error) {
    console.error(
      "firebase-admin is required to seed Firestore. Install it with `npm install firebase-admin --no-save`.",
    );
    throw error;
  }
}

function readJsonFile(relativePath) {
  const filePath = path.join(process.cwd(), relativePath);
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function loadServiceAccount() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (rawJson && rawJson.trim()) {
    return JSON.parse(rawJson);
  }

  const rawBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (rawBase64 && rawBase64.trim()) {
    const decoded = Buffer.from(rawBase64, "base64").toString("utf8");
    return JSON.parse(decoded);
  }

  throw new Error(
    "Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_B64.",
  );
}

function sanitizeDocId(value, fallback) {
  const base = (value ?? fallback ?? "").toString().trim();
  if (!base) return fallback ?? "unknown";
  return base.replaceAll("/", "_");
}

async function seedCollection(db, collectionName, items, resolveId) {
  const batchSize = 400;
  let batch = db.batch();
  let batchCount = 0;
  let total = 0;

  for (const [index, item] of items.entries()) {
    const id = sanitizeDocId(resolveId(item, index), `${collectionName}-${index + 1}`);
    const ref = db.collection(collectionName).doc(id);
    batch.set(ref, item, { merge: true });
    batchCount += 1;
    total += 1;

    if (batchCount >= batchSize) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Seeded ${total} documents into ${collectionName}.`);
}

async function main() {
  const admin = await loadFirebaseAdmin();
  const serviceAccount = loadServiceAccount();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id ?? process.env.FIREBASE_PROJECT_ID,
    });
  }

  const db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });

  const authorizedAssistances = readJsonFile(
    "src/data/authorized_assistances.json",
  );
  const betaTesters = readJsonFile("src/data/beta-testers.json");
  const bugBusters = readJsonFile("src/data/bug-busters.json");
  const developers = readJsonFile("src/data/developers.json");

  await seedCollection(
    db,
    "authorized_assistances",
    authorizedAssistances,
    (item) => item.id,
  );

  await seedCollection(db, "beta_testers", betaTesters, (item) => item.email);
  await seedCollection(db, "bug_busters", bugBusters, (item) => item.email);
  await seedCollection(db, "developers", developers, (item) => item.email);
}

main().catch((error) => {
  console.error("Firestore seeding failed:", error);
  process.exit(1);
});

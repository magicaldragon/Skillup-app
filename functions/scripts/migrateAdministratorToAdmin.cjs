/*
  Migration: Normalize user role from 'administrator' to canonical 'admin'
  - Backup users collection (optional)
  - Dry-run supported via --dry
  - Initialize Admin SDK using GOOGLE_APPLICATION_CREDENTIALS or ../../serviceAccountKey.json
*/

const fs = require("fs");
const path = require("path");
let admin;
try {
  admin = require("firebase-admin");
} catch (e) {
  console.error("[migration] firebase-admin not found. Please install in functions package.");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const BACKUP = args.includes("--backup");
const LIMIT_ARG = args.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split("=")[1]) : undefined;

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupsDir = path.resolve(__dirname, "../../backups");
fs.mkdirSync(backupsDir, { recursive: true });

function initAdmin() {
  const envCred = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const localCred = path.resolve(__dirname, "../../serviceAccountKey.json");
  try {
    if (envCred && fs.existsSync(envCred)) {
      const serviceAccount = require(envCred);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log("[migration] Initialized with GOOGLE_APPLICATION_CREDENTIALS");
      return { initialized: true, canQuery: true };
    } else if (fs.existsSync(localCred)) {
      const serviceAccount = require(localCred);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log("[migration] Initialized with local serviceAccountKey.json");
      return { initialized: true, canQuery: true };
    } else {
      // Attempt default init (useful in emulator or if app default creds configured)
      admin.initializeApp();
      console.log("[migration] Initialized with default credentials");
      // Check project id presence for query capability
      const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
      const canQuery = !!projectId;
      if (!canQuery) {
        console.warn("[migration] No project id detected; will skip Firestore queries");
      }
      return { initialized: true, canQuery };
    }
  } catch (e) {
    console.error("[migration] Failed to initialize Firebase Admin:", e.message);
    return { initialized: false, canQuery: false };
  }
}

async function backupUsers() {
  console.log("[migration] Starting users backup...");
  const outPath = path.join(backupsDir, `users-backup-${timestamp}.json`);
  const usersRef = admin.firestore().collection("users");
  const snap = await usersRef.get();
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  fs.writeFileSync(outPath, JSON.stringify({ count: data.length, users: data }, null, 2));
  console.log(`[migration] Users backup written: ${outPath} (count=${data.length})`);
}

async function migrateRoles(canQuery) {
  console.log("[migration] Searching for users with role 'administrator' (any case)...");
  const changes = [];
  if (!canQuery) {
    const logPath = path.join(backupsDir, `migration-log-${timestamp}.json`);
    fs.writeFileSync(logPath, JSON.stringify({ dryRun: true, changesCount: 0, changes, note: "No project id; skipped Firestore queries" }, null, 2));
    console.log(`[migration] Migration log written: ${logPath} (changes=0)`);
    return;
  }
  const usersRef = admin.firestore().collection("users");

  // Firestore does not support case-insensitive queries; check common cases
  const roleVariants = ["administrator", "Administrator", "ADMINISTRATOR"];

  for (const variant of roleVariants) {
    let query = usersRef.where("role", "==", variant);
    if (LIMIT && Number.isFinite(LIMIT)) {
      query = query.limit(LIMIT);
    }
    const snap = await query.get();
    for (const doc of snap.docs) {
      const before = doc.data();
      changes.push({ id: doc.id, beforeRole: before.role, afterRole: "admin" });
      if (!DRY) {
        await doc.ref.update({ role: "admin", updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        console.log(`[migration] Updated ${doc.id}: ${before.role} -> admin`);
      } else {
        console.log(`[migration] DRY: would update ${doc.id}: ${before.role} -> admin`);
      }
    }
  }

  const logPath = path.join(backupsDir, `migration-log-${timestamp}.json`);
  fs.writeFileSync(logPath, JSON.stringify({ dryRun: DRY, changesCount: changes.length, changes }, null, 2));
  console.log(`[migration] Migration log written: ${logPath} (changes=${changes.length})`);
}

async function main() {
  const init = initAdmin();
  if (!init.initialized) {
    console.warn("[migration] Admin init failed; running in DRY mode only");
  }

  try {
    if (BACKUP && init.canQuery && !DRY) {
      await backupUsers();
    }
    if (init.initialized || DRY) {
      await migrateRoles(init.canQuery);
    }
    console.log("[migration] Completed");
    process.exit(0);
  } catch (e) {
    console.error("[migration] Error:", e);
    process.exit(1);
  }
}

main();

// ... existing code ...
import { createHmac, randomUUID } from "node:crypto";

// Minimal structured logger to avoid leaking secrets
function logInfo(message, context = {}) {
  const safe = Object.fromEntries(
    Object.entries(context).filter(([k]) => !/secret|token|key|url/i.test(k)),
  );
  console.log(`[notify] ${message}`, safe);
}

function logError(message, error) {
  const safeError =
    error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { error };
  console.error(`[notify] ${message}`, safeError);
}

function buildPayload() {
  const repo = process.env.GITHUB_REPOSITORY || "unknown";
  const workflow = process.env.GITHUB_WORKFLOW || "unknown";
  const runId = process.env.GITHUB_RUN_ID || "unknown";
  const runUrl = `https://github.com/${repo}/actions/runs/${runId}`;
  const commit = process.env.GITHUB_SHA || "unknown";
  const env = process.env.NODE_ENV || "production";

  return {
    id: randomUUID(),
    event: "deployment_failure",
    timestamp: new Date().toISOString(),
    repo,
    workflow,
    runUrl,
    commit,
    environment: env,
    summary: "Firebase deployment failed. See Actions for details.",
  };
}

function signPayload(payloadJson, signatureKey) {
  return createHmac("sha256", signatureKey).update(payloadJson).digest("hex");
}

async function sendWebhook(webhookUrl, payload, signatureKey) {
  const payloadJson = JSON.stringify(payload);
  const headers = { "Content-Type": "application/json" };
  if (signatureKey) {
    const signature = signPayload(payloadJson, signatureKey);
    headers["X-Signature"] = `sha256=${signature}`;
  }
  const res = await fetch(webhookUrl, { method: "POST", headers, body: payloadJson });
  return res;
}

async function main() {
  const argvUrl = process.argv[2] || "";
  const argvSig = process.argv[3] || "";
  const webhookUrl = argvUrl || process.env.ALERT_WEBHOOK_URL;
  const signatureKey = argvSig || process.env.ALERT_WEBHOOK_SIGNATURE_KEY;

  if (!webhookUrl) {
    logInfo("Webhook URL not configured, skipping notification.");
    return;
  }

  const payload = buildPayload();
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      logInfo(`Sending webhook attempt ${attempt}`, { attempt });
      const res = await sendWebhook(webhookUrl, payload, signatureKey);
      const status = res.status;
      // Avoid logging entire response body (may contain sensitive info)
      if (status >= 200 && status < 300) {
        logInfo("Webhook sent successfully", { status });
        return;
      }
      logError("Webhook non-2xx response", new Error(`Status ${status}`));
    } catch (err) {
      logError("Webhook send failed", err);
    }
    // Exponential backoff: 500ms, 1000ms, 2000ms
    const delay = 500 * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Do not throw — keep CI failure reason isolated to original failure
  logError("All webhook retries exhausted", new Error("Notification failed"));
}

main().catch((err) => {
  logError("Unexpected error in notification", err);
});
// ... existing code ...

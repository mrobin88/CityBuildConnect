/**
 * Sends a branded test email to verify SMTP configuration end-to-end.
 *
 * Usage:
 *   npm run email:test -- you@example.com
 *
 * Requires EMAIL_SERVER and EMAIL_FROM to be set (in .env or the environment).
 * Without EMAIL_SERVER the mailer only logs the message instead of delivering.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { appBaseUrl, renderActionEmail, sendMail } from "../src/lib/mailer";

// Minimal .env loader so this standalone script picks up local config.
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      if (process.env[key]) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // No .env file — rely on the ambient environment.
  }
}

async function main() {
  loadEnv();

  const to = process.argv[2];
  if (!to) {
    console.error("Usage: npm run email:test -- <recipient@example.com>");
    process.exit(1);
  }

  const { html, text } = renderActionEmail({
    previewText: "This is a Build Connect email deliverability test.",
    heading: "Build Connect email test",
    bodyLines: [
      "This is a test email confirming that Build Connect can deliver transactional email (password resets and account confirmations).",
      "If you received this, your SMTP settings are working.",
    ],
    buttonLabel: "Open Build Connect",
    buttonUrl: appBaseUrl(),
    footerNote: "This is an automated deliverability test — no action is needed.",
  });

  const result = await sendMail({
    to,
    subject: "Build Connect email test",
    html,
    text,
  });

  if (result.delivered) {
    console.log(`✅ Test email sent to ${to} via ${process.env.EMAIL_SERVER ? "SMTP" : "unknown"}.`);
  } else {
    console.warn(
      `⚠️  EMAIL_SERVER is not configured, so nothing was delivered to ${to}.\n` +
        "Set EMAIL_SERVER and EMAIL_FROM (in .env or the environment) and re-run to actually send.",
    );
    process.exit(2);
  }
}

main().catch((error) => {
  console.error("Test email failed:", error);
  process.exit(1);
});

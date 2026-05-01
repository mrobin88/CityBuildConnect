/**
 * Optional SMS ping when someone receives an in-app message.
 * Set TWILIO_* in Azure App Service when your Twilio account is ready.
 * Uses Twilio REST API (no SDK) — failures are logged and do not block messaging.
 */
export async function notifyNewDirectMessageSms(opts: {
  recipientPhone: string | null;
  senderDisplayName: string;
  preview: string;
}): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER ?? process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return;
  if (!opts.recipientPhone?.trim()) return;

  const to = normalizeUsPhone(opts.recipientPhone);
  if (!to) return;

  const bodyText = `Build Connect: ${opts.senderDisplayName} messaged you. ${truncate(opts.preview, 120)}`.trim();

  const body = new URLSearchParams();
  body.set("To", to);
  body.set("From", from);
  body.set("Body", bodyText);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.warn("[twilio] SMS failed", res.status, t.slice(0, 200));
    }
  } catch (e) {
    console.warn("[twilio] SMS error", e);
  }
}

function truncate(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** E.164 for US if 10 digits; pass through if already +... */
function normalizeUsPhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) return raw.trim();
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

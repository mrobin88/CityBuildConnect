import nodemailer from "nodemailer";

const BRAND_NAME = "Build Connect";
const BRAND_DARK = "#161b21";
const BRAND_ACCENT = "#c6932f";
const BRAND_ACCENT_STRONG = "#e27f1d";

/** Public base URL used to build links inside emails. */
export function appBaseUrl(): string {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  if (!process.env.EMAIL_SERVER) return null;
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport(process.env.EMAIL_SERVER);
  }
  return cachedTransport;
}

type SendResult = { delivered: boolean };

/**
 * Sends an email via the configured SMTP server (EMAIL_SERVER / EMAIL_FROM).
 * When email isn't configured (e.g. local dev), it logs the message instead of
 * throwing so flows still work end-to-end.
 */
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM || `${BRAND_NAME} <noreply@example.com>`;

  if (!transport) {
    console.warn(
      `[mailer] EMAIL_SERVER not configured — email to ${opts.to} not sent.\n` +
        `Subject: ${opts.subject}\n${opts.text}`,
    );
    return { delivered: false };
  }

  await transport.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
  return { delivered: true };
}

/**
 * Renders a branded, responsive-ish HTML email with a single primary action.
 * Kept inline-styled for broad email-client compatibility.
 */
export function renderActionEmail(opts: {
  previewText: string;
  heading: string;
  bodyLines: string[];
  buttonLabel: string;
  buttonUrl: string;
  footerNote?: string;
}): { html: string; text: string } {
  const { previewText, heading, bodyLines, buttonLabel, buttonUrl, footerNote } = opts;

  const paragraphs = bodyLines
    .map(
      (line) =>
        `<p style="margin:0 0 16px;color:#3d444d;font-size:15px;line-height:1.6;">${line}</p>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef1f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${previewText}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f4;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e6ea;">
            <tr>
              <td style="background:${BRAND_DARK};padding:20px 28px;">
                <span style="color:#f4f6f8;font-size:18px;font-weight:700;letter-spacing:0.2px;">${BRAND_NAME}</span>
                <span style="display:inline-block;width:26px;height:3px;border-radius:3px;background:linear-gradient(90deg,${BRAND_ACCENT},${BRAND_ACCENT_STRONG});vertical-align:middle;margin-left:10px;"></span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 8px;">
                <h1 style="margin:0 0 18px;color:${BRAND_DARK};font-size:21px;line-height:1.3;">${heading}</h1>
                ${paragraphs}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background:${BRAND_DARK};">
                      <a href="${buttonUrl}" style="display:inline-block;padding:13px 26px;color:#f4f6f8;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${buttonLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0;color:#8a929c;font-size:12px;line-height:1.6;word-break:break-all;">
                  Or paste this link into your browser:<br />
                  <a href="${buttonUrl}" style="color:${BRAND_ACCENT_STRONG};">${buttonUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 26px;border-top:1px solid #eef1f4;">
                <p style="margin:0;color:#9aa1ab;font-size:12px;line-height:1.6;">
                  ${footerNote ?? `If you didn't request this, you can safely ignore this email.`}
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#aab0b8;font-size:11px;">© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${heading}\n\n${bodyLines
    .map((l) => l.replace(/<[^>]+>/g, ""))
    .join("\n\n")}\n\n${buttonLabel}: ${buttonUrl}\n\n${
    footerNote ?? "If you didn't request this, you can safely ignore this email."
  }`;

  return { html, text };
}

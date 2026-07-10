import { appBaseUrl, renderActionEmail, sendMail } from "@/lib/mailer";
import { EMAIL_VERIFY_PREFIX, EMAIL_VERIFY_TTL_MS, issueToken } from "@/lib/auth-tokens";

/**
 * Issues a verification token and emails a branded confirmation link.
 * Safe to call in the background — failures are logged, not thrown.
 */
export async function sendVerificationEmail(email: string, name?: string | null): Promise<void> {
  try {
    const rawToken = await issueToken(`${EMAIL_VERIFY_PREFIX}${email}`, EMAIL_VERIFY_TTL_MS);
    const verifyUrl = `${appBaseUrl()}/api/auth/verify-email?email=${encodeURIComponent(email)}&token=${rawToken}`;
    const firstName = name?.trim().split(" ")[0];

    const { html, text } = renderActionEmail({
      previewText: "Confirm your email to finish setting up Build Connect.",
      heading: "Confirm your email",
      bodyLines: [
        `${firstName ? `Welcome, ${firstName}!` : "Welcome to Build Connect!"}`,
        "Please confirm your email address to secure your account and unlock everything Build Connect has to offer.",
        "This link expires in 24 hours.",
      ],
      buttonLabel: "Confirm email",
      buttonUrl: verifyUrl,
      footerNote: "If you didn't create a Build Connect account, you can safely ignore this email.",
    });

    await sendMail({ to: email, subject: "Confirm your Build Connect email", html, text });
  } catch (error) {
    console.error("send_verification_email_error", error);
  }
}

type SendOtpEmailInput = {
  appName: string;
  appUrl?: string;
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
};

type BuildWelcomeEmailInput = {
  appName: string;
  appUrl?: string;
  email: string;
  userName?: string | null;
};

const otpActionLabels: Record<SendOtpEmailInput["type"], string> = {
  "sign-in": "sign in to your account",
  "email-verification": "verify your email address",
  "forget-password": "reset your password",
  "change-email": "confirm your email change",
};

const buildEmailShell = ({
  appName,
  appUrl,
  preview,
  heading,
  intro,
  body,
  footer,
}: {
  appName: string;
  appUrl?: string;
  preview: string;
  heading: string;
  intro: string;
  body: string;
  footer: string;
}) => {
  const text = [
    `${appName}`,
    "",
    heading,
    "",
    intro,
    "",
    body,
    "",
    footer,
  ].join("\n");

  const html = `
    <div style="margin:0; padding:32px 16px; background:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
      <div style="display:none; max-height:0; overflow:hidden; opacity:0; visibility:hidden;">${preview}</div>
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #dbe4f0; border-radius:24px; overflow:hidden; box-shadow:0 18px 50px rgba(15, 23, 42, 0.08);">
        <div style="padding:28px 32px 18px; background:#0f172a; border-bottom:1px solid #1e293b;">
          <p style="margin:0 0 10px; font-size:12px; letter-spacing:0.2em; text-transform:uppercase; color:#bfdbfe;">${appName} account</p>
          <h1 style="margin:0; font-size:28px; line-height:1.15; color:#f8fafc;">${heading}</h1>
        </div>
        <div style="padding:28px 32px 32px;">
          <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#334155;">${intro}</p>
          ${body}
          <p style="margin:24px 0 0; font-size:13px; line-height:1.7; color:#64748b;">${footer}</p>
          ${
            appUrl
              ? `<p style="margin:12px 0 0; font-size:13px; line-height:1.7; color:#64748b;">Access your account on <a href="${appUrl}" style="color:#2563eb; text-decoration:none; font-weight:600;">${appName}</a>.</p>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  return { text, html };
};

export const buildOtpEmail = ({
  appName,
  appUrl,
  email,
  otp,
  type,
}: SendOtpEmailInput) => {
  const actionLabel = otpActionLabels[type];
  const subject =
    type === "email-verification"
      ? `Verify your email for ${appName}`
      : `${appName} verification code`
  const intro =
    type === "email-verification"
      ? `Use the one-time code below to confirm that ${email} belongs to you and complete your ${appName} account setup.`
      : `Use the one-time code below to ${actionLabel} for your ${appName} account.`
  const body = `
    <div style="margin:22px 0; padding:22px 24px; border-radius:20px; background:#f8fafc; border:1px solid #e2e8f0;">
      <p style="margin:0 0 10px; font-size:12px; letter-spacing:0.16em; text-transform:uppercase; color:#64748b;">Verification code</p>
      <p style="margin:0; font-size:34px; line-height:1; letter-spacing:0.32em; font-weight:700; color:#0f172a;">${otp}</p>
    </div>
    <p style="margin:0 0 12px; font-size:14px; line-height:1.7; color:#475569;">This code expires in 5 minutes and can be used only once.</p>
    <p style="margin:0; font-size:14px; line-height:1.7; color:#475569;">If you did not request this email, no further action is required.</p>
  `;
  const { text, html } = buildEmailShell({
    appName,
    appUrl,
    preview: `${appName} verification code: ${otp}`,
    heading:
      type === "email-verification" ? "Verify your email address" : "Confirm your request",
    intro,
    body,
    footer: `This email was sent to ${email} because a request was made for your ${appName} account.`,
  });

  return {
    subject,
    text,
    html,
  };
};

export const buildWelcomeEmail = ({
  appName,
  appUrl,
  email,
  userName,
}: BuildWelcomeEmailInput) => {
  const subject = `Welcome to ${appName}`
  const intro = userName
    ? `Hello ${userName}, your email address has been verified and your ${appName} account is now active.`
    : `Your email address has been verified and your ${appName} account is now active.`
  const body = `
    <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#334155;">You can now sign in securely and use Kochat for private direct messaging, invite-only group rooms, media sharing, and in-thread AI assistance.</p>
    <div style="margin:20px 0 0; padding:18px 20px; border-radius:18px; background:#f8fafc; border:1px solid #e2e8f0;">
      <p style="margin:0 0 8px; font-size:13px; font-weight:600; color:#0f172a;">Your account is ready for</p>
      <p style="margin:0; font-size:14px; line-height:1.7; color:#475569;">Verified sign-in, direct conversations, secure group collaboration, image uploads, voice messaging, and AI-supported replies within your rooms.</p>
    </div>
    ${
      appUrl
        ? `<div style="margin:20px 0 0;">
      <a href="${appUrl}" style="display:inline-block; padding:12px 18px; border-radius:999px; background:#0f172a; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600;">Open ${appName}</a>
    </div>`
        : ""
    }
  `;
  const { text, html } = buildEmailShell({
    appName,
    appUrl,
    preview: `Your ${appName} account is verified and ready to use.`,
    heading: `Welcome to ${appName}`,
    intro,
    body,
    footer: `This email was sent to ${email}. If you did not complete this verification, contact support immediately.`,
  })

  return {
    subject,
    text,
    html,
  }
}

export async function syncUserToEmailList(
  email: string,
  name: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[EmailService] RESEND_API_KEY not set — skipping email sync.");
    return;
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) {
    console.log("[EmailService] RESEND_AUDIENCE_ID not set — skipping email sync.");
    return;
  }

  try {
    const firstName = name.split(" ")[0] || name;
    const lastName = name.split(" ").slice(1).join(" ") || "";

    const response = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          unsubscribed: false,
          data: {
            source: "qikworksheet.in",
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error(`[EmailService] Failed to sync user to Resend: ${err}`);
    } else {
      console.log(`[EmailService] Synced ${email} to Resend audience.`);
    }
  } catch (err) {
    console.error("[EmailService] Error syncing user to email list:", err);
  }
}

export type SendEmailResult =
  | { ok: true; deliveredTo: string }
  | { ok: false; error: string; devOtpLogged?: boolean };

export async function sendPasswordResetOtpEmail(
  email: string,
  name: string,
  otp: string,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "Qik Worksheets <onboarding@resend.dev>";
  const firstName = name.split(" ")[0] || name;
  const deliveredTo = email.trim().toLowerCase();

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px;font-size:22px;">Your password reset code</h2>
      <p>Hi ${firstName},</p>
      <p>Use this one-time code to reset your Qik Worksheets password. It expires in 10 minutes.</p>
      <p style="margin:28px 0;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#C13584;">${otp}</p>
      <p style="font-size:13px;color:#666;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  if (!apiKey) {
    console.log(`[EmailService] RESEND_API_KEY not set — password reset OTP for ${email}: ${otp}`);
    return { ok: false, error: "Email service is not configured.", devOtpLogged: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [deliveredTo],
        subject: `${otp} is your Qik Worksheets password reset code`,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[EmailService] Failed to send password reset OTP email: ${errText}`);
      console.log(`[EmailService] Password reset OTP for ${email}: ${otp}`);
      let message = "Failed to send OTP email.";
      try {
        const parsed = JSON.parse(errText) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // keep default message
      }
      return { ok: false, error: message, devOtpLogged: true };
    }

    console.log(`[EmailService] Password reset OTP email sent to ${deliveredTo}.`);
    return { ok: true, deliveredTo };
  } catch (err) {
    console.error("[EmailService] Error sending password reset OTP email:", err);
    console.log(`[EmailService] Password reset OTP for ${email}: ${otp}`);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send OTP email.",
      devOtpLogged: true,
    };
  }
}

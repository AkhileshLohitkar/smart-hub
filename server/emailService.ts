export async function syncUserToEmailList(
  email: string,
  name: string,
  userCategory?: string | null
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
            user_category: userCategory || "Not specified",
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

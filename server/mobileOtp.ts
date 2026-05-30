import { Router } from "express";
import axios from "axios";

// In-memory stores. Keys are 10-digit mobile numbers.
// `otpStore`     -> active OTPs awaiting verification
// `verifiedStore`-> mobiles that have just been verified (used by /register
//                   to enforce that the mobile was verified before signup)

type OtpRecord = { otp: string; expiresAt: number };

const otpStore = new Map<string, OtpRecord>();
const verifiedStore = new Map<string, number>(); // mobile -> verifiedExpiresAt

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const VERIFIED_TTL_MS = 15 * 60 * 1000; // verified mobile valid for 15 min to complete signup
const MOBILE_RE = /^[0-9]{10}$/;
const OTP_RE = /^[0-9]{6}$/;

function pruneExpired(): void {
  const now = Date.now();
  for (const [k, v] of otpStore) {
    if (v.expiresAt <= now) otpStore.delete(k);
  }
  for (const [k, exp] of verifiedStore) {
    if (exp <= now) verifiedStore.delete(k);
  }
}

function generateOtp(): string {
  // 6-digit numeric OTP, leading zeros possible
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function deliverOtp(mobile: string, otp: string): Promise<void> {
  // Some `.env` files accidentally include whitespace around the key name.
  // We defensively check both variants and trim the result.
  const apiKey = (process.env.FAST2SMS_API_KEY ??
    process.env["FAST2SMS_API_KEY "] ??
    "").trim();
  if (!apiKey) throw new Error("FAST2SMS_API_KEY not set");

  const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
    params: {
      authorization: apiKey,
      variables_values: otp,
      route: "otp",
      numbers: mobile,
    },
    timeout: 10_000,
    validateStatus: () => true, // we'll inspect manually
  });

  if (response.status >= 400 || response.data?.return === false) {
    const msg =
      response.data?.message ||
      response.data?.error ||
      `Fast2SMS returned status ${response.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
}

/**
 * Consume a previously-verified mobile token.
 * Returns true if the mobile was verified within VERIFIED_TTL_MS and removes
 * it from the store (single-use). Returns false otherwise.
 */
export function consumeVerifiedMobile(mobile: string): boolean {
  pruneExpired();
  const exp = verifiedStore.get(mobile);
  if (!exp || exp <= Date.now()) return false;
  verifiedStore.delete(mobile);
  return true;
}

export const mobileOtpRouter = Router();

mobileOtpRouter.post("/send-mobile-otp", async (req, res) => {
  try {
    const mobile = String(req.body?.mobile ?? "").trim();

    if (!MOBILE_RE.test(mobile)) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number must be exactly 10 digits" });
    }

    pruneExpired();

    const otp = generateOtp();
    const record: OtpRecord = {
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
    };

    try {
      await deliverOtp(mobile, otp);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[mobileOtp] Failed to send OTP:", msg);
      if (msg.includes("FAST2SMS_API_KEY not set")) {
        return res.status(500).json({
          success: false,
          message:
            "SMS provider is not configured on the server (FAST2SMS_API_KEY missing).",
        });
      }
      // In development, surface provider errors so setup issues are obvious.
      // Never include the OTP in any message.
      if (process.env.NODE_ENV !== "production") {
        return res.status(502).json({
          success: false,
          message: msg,
        });
      }
      return res
        .status(502)
        .json({ success: false, message: "Could not send OTP right now. Please try again." });
    }

    // Only persist the OTP after a successful send so we don't accept an OTP
    // for a delivery that failed.
    otpStore.set(mobile, record);

    return res.json({ success: true, message: "OTP Sent Successfully" });
  } catch (err) {
    console.error("[mobileOtp] /send-mobile-otp error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

mobileOtpRouter.post("/verify-mobile-otp", (req, res) => {
  try {
    const mobile = String(req.body?.mobile ?? "").trim();
    const otp = String(req.body?.otp ?? "").trim();

    if (!MOBILE_RE.test(mobile)) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number must be exactly 10 digits" });
    }
    if (!OTP_RE.test(otp)) {
      return res
        .status(400)
        .json({ success: false, message: "OTP must be 6 digits" });
    }

    pruneExpired();

    const rec = otpStore.get(mobile);
    if (!rec) {
      return res
        .status(400)
        .json({ success: false, message: "OTP expired or never requested. Please send a new OTP." });
    }
    if (rec.expiresAt <= Date.now()) {
      otpStore.delete(mobile);
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired. Please request a new one." });
    }
    if (rec.otp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect OTP. Please try again." });
    }

    // Success: consume the OTP and mark the mobile as verified for a short window.
    otpStore.delete(mobile);
    verifiedStore.set(mobile, Date.now() + VERIFIED_TTL_MS);

    return res.json({ success: true, message: "Mobile Verified Successfully" });
  } catch (err) {
    console.error("[mobileOtp] /verify-mobile-otp error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

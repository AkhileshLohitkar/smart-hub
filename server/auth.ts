import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import session from "express-session";
import { createHash } from "crypto";
import { storage } from "./storage";
import { syncUserToEmailList, sendPasswordResetOtpEmail } from "./emailService";
import type { Express } from "express";
import type { User } from "@shared/schema";
import { forgotPasswordSchema, resetPasswordSchema, USER_ROLES } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { logUserActivity, touchLastLoginAt, touchLastLogoutAt } from "./services/userActivity";
import { hashPassword, comparePasswords } from "./utils/password";
import { getAppBaseUrl } from "./utils/appUrl";

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateResetOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const RESET_OTP_TTL_MS = 10 * 60 * 1000;

async function ensureUsersMobileNumberColumn(): Promise<void> {
  try {
    await pool.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "mobile_number" text NOT NULL DEFAULT '';
    `);
  } catch (err) {
    console.error("[Auth] Failed to ensure users.mobile_number column:", err);
  }
}

async function ensureSessionTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        PRIMARY KEY ("sid")
      );
    `);
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
      `);
    } catch (indexErr: any) {
      // In some local setups the session table may already exist but be owned by a different role.
      // The app can still run (and sessions can still work) as long as the DB user has normal DML
      // privileges; failing to create the index should not block startup.
      if (indexErr?.code !== "42501") {
        throw indexErr;
      }
      console.warn(
        `[Auth] Skipping session index creation (insufficient privileges). ` +
          `Fix by changing table owner or granting privileges. Error code: ${indexErr?.code}`,
      );
    }
  } catch (err) {
    console.error("[Auth] Failed to ensure session table:", err);
  }
}

async function ensurePasswordResetTokensTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
      ON password_reset_tokens (user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
      ON password_reset_tokens (expires_at);
    `);
  } catch (err) {
    console.error("[Auth] Failed to ensure password_reset_tokens table:", err);
  }
}

declare global {
  namespace Express {
    type AppUser = import("@shared/schema").User;
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AppUser {}
  }
}

export async function setupAuth(app: Express) {
  // Ensure new required columns exist for normal signup.
  await ensureUsersMobileNumberColumn();
  await ensureSessionTable();
  await ensurePasswordResetTokensTable();

  const PgStore = connectPg(session);

  app.set("trust proxy", 1);

  let pgSessionStore:
    | InstanceType<ReturnType<typeof connectPg>>
    | undefined = undefined;

  if (process.env.NODE_ENV === "production") {
    // In prod we require postgres-backed sessions.
    pgSessionStore = new PgStore({
      pool,
      createTableIfMissing: false,
    });
  } else {
    // In dev, fall back to MemoryStore if the DB user can't read/write the session table.
    try {
      await pool.query(`SELECT 1 FROM "session" LIMIT 1;`);
      pgSessionStore = new PgStore({
        pool,
        createTableIfMissing: false,
      });
    } catch (e: any) {
      console.warn(
        `[Auth] Postgres session store disabled for dev (DB permissions). ` +
          `Falling back to MemoryStore. Error: ${e?.code || e?.message || e}`,
      );
    }
  }

  app.use(
    session({
      store: pgSessionStore,
      secret:
        process.env.SESSION_SECRET ||
        (process.env.NODE_ENV !== "production"
          ? "local-dev-session-secret-change-me"
          : (() => {
              throw new Error("SESSION_SECRET is required in production");
            })()),
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) return done(null, false, { message: "Invalid email or password" });
          if (!user.password) return done(null, false, { message: "This account uses social login. Please sign in with Google or Facebook." });
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) return done(null, false, { message: "Invalid email or password" });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  const appUrl = getAppBaseUrl();

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${appUrl}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const googleId = profile.id;
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName || email || "User";

            let user = await storage.getUserByGoogleId(googleId);
            if (user) return done(null, user);

            if (email) {
              user = await storage.getUserByEmail(email);
              if (user) {
                user = await storage.linkGoogleId(user.id, googleId);
                return done(null, user);
              }
            }

            user = await storage.createOAuthUser({
              email: email || `google_${googleId}@oauth.local`,
              name,
              googleId,
            });
            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }

  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: `${appUrl}/api/auth/facebook/callback`,
          profileFields: ["id", "displayName", "emails"],
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const facebookId = profile.id;
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName || email || "User";

            let user = await storage.getUserByFacebookId(facebookId);
            if (user) return done(null, user);

            if (email) {
              user = await storage.getUserByEmail(email);
              if (user) {
                user = await storage.linkFacebookId(user.id, facebookId);
                return done(null, user);
              }
            }

            user = await storage.createOAuthUser({
              email: email || `fb_${facebookId}@oauth.local`,
              name,
              facebookId,
            });
            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (err) {
      done(err);
    }
  });

  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth?error=google_failed" }),
    (_req, res) => {
      res.redirect("/new-worksheet");
    }
  );

  app.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
  app.get(
    "/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/auth?error=facebook_failed" }),
    (_req, res) => {
      res.redirect("/new-worksheet");
    }
  );

  app.get("/api/auth/oauth-status", (_req, res) => {
    res.json({
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, name, password, mobile, role } = req.body;
      if (!email || !name || !password || !mobile || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const validRoles = USER_ROLES as readonly string[];
      if (typeof role !== "string" || !validRoles.includes(role)) {
        return res.status(400).json({ message: "Please select your role." });
      }
      if (typeof mobile !== "string" || !/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        name,
        password: hashedPassword,
        mobileNumber: mobile,
        role,
      });
      syncUserToEmailList(email, name).catch((e) =>
        console.error("[Auth] Email sync failed:", e)
      );
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        const { password: _, ...safeUser } = user;
        return res.status(201).json(safeUser);
      });
    } catch (err) {
      const e = err as any;
      console.error("[Auth] Registration failed:", {
        message: e?.message,
        code: e?.code,
        detail: e?.detail,
        constraint: e?.constraint,
        stack: e?.stack,
      });
      res.status(500).json({
        message: "Registration failed",
        ...(process.env.NODE_ENV !== "production" && e?.message ? { debug: e.message } : {}),
      });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        // Fire-and-forget: do not block login response on analytics logging.
        void logUserActivity(user.id, "LOGIN").catch(() => {});
        void touchLastLoginAt(user.id).catch(() => {});
        void (async () => {
          try {
            const freshUser = await storage.getUser(user.id);
            console.log("[Login] DB snapshot:", {
              user: freshUser
                ? {
                    id: freshUser.id,
                    email: freshUser.email,
                    name: freshUser.name,
                    plan: freshUser.plan,
                    worksheetsGenerated: freshUser.worksheetsGenerated,
                    createdAt: freshUser.createdAt,
                  }
                : null,
            });
          } catch (e) {
            console.error("[Login] Failed to fetch DB snapshot:", e);
          }
        })();
        const { password: _, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    const userId = req.user?.id;
    if (typeof userId === "number") {
      void logUserActivity(userId, "LOGOUT").catch(() => {});
      void touchLastLogoutAt(userId).catch(() => {});
    }
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const freshUser = await storage.getUser(req.user.id);
    if (!freshUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password: _, ...safeUser } = freshUser;
    res.json(safeUser);
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Please enter a valid email address." });
      }

      const email = parsed.data.email.trim().toLowerCase();
      const user = await storage.getUserByEmailInsensitive(email);

      if (user?.password) {
        const otp = generateResetOtp();
        const tokenHash = hashResetToken(otp);
        const expiresAt = new Date(Date.now() + RESET_OTP_TTL_MS);

        await storage.deletePasswordResetTokensForUser(user.id);
        await storage.createPasswordResetToken(user.id, tokenHash, expiresAt);

        const emailResult = await sendPasswordResetOtpEmail(user.email, user.name, otp);
        if (!emailResult.ok) {
          if (process.env.NODE_ENV !== "production") {
            return res.status(502).json({
              message: emailResult.error,
              devOtpLogged: emailResult.devOtpLogged,
              hint:
                "To send OTP to any email, verify qikworksheet.in in Resend and set RESEND_FROM_EMAIL=Qik Worksheets <hi@qikworksheet.in>. Until then, onboarding@resend.dev only works for Resend test inboxes.",
            });
          }
          console.error("[Auth] Password reset OTP email failed:", emailResult.error);
        }
      }

      return res.json({
        message:
          "If an account with that email exists, we sent a 6-digit OTP. Check your inbox and spam folder.",
        emailSent: true,
      });
    } catch (err) {
      console.error("[Auth] Forgot password failed:", err);
      return res.status(500).json({ message: "Could not process password reset request." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstError = parsed.error.errors[0]?.message;
        return res.status(400).json({ message: firstError || "Invalid reset request." });
      }

      const { email, otp, password } = parsed.data;
      const normalizedEmail = email.trim().toLowerCase();
      const user = await storage.getUserByEmailInsensitive(normalizedEmail);
      if (!user?.password) {
        return res.status(400).json({ message: "Invalid OTP or email." });
      }

      const record = await storage.getLatestPasswordResetTokenForUser(user.id);
      if (!record || record.expiresAt <= new Date()) {
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }

      if (record.tokenHash !== hashResetToken(otp)) {
        return res.status(400).json({ message: "Incorrect OTP. Please try again." });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.deletePasswordResetTokensForUser(user.id);

      return res.json({ message: "Password updated successfully. You can sign in with your new password." });
    } catch (err) {
      console.error("[Auth] Reset password failed:", err);
      return res.status(500).json({ message: "Could not reset password." });
    }
  });
}

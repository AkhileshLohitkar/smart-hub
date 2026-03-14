import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { syncUserToEmailList } from "./emailService";
import type { Express } from "express";
import type { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const scryptAsync = promisify(scrypt);

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
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
  } catch (err) {
    console.error("[Auth] Failed to ensure session table:", err);
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hashed, "hex"), buf);
}

declare global {
  namespace Express {
    interface User extends import("@shared/schema").User {}
  }
}

export async function setupAuth(app: Express) {
  await ensureSessionTable();

  const PgStore = connectPg(session);

  app.set("trust proxy", 1);

  app.use(
    session({
      store: new PgStore({
        pool,
        createTableIfMissing: false,
      }),
      secret: process.env.SESSION_SECRET!,
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

  const appUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.REPL_SLUG
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : "http://localhost:5000";

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
      res.redirect("/dashboard");
    }
  );

  app.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
  app.get(
    "/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/auth?error=facebook_failed" }),
    (_req, res) => {
      res.redirect("/dashboard");
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
      const { email, name, password, userCategory } = req.body;
      if (!email || !name || !password) {
        return res.status(400).json({ message: "All fields are required" });
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
        userCategory: userCategory || null,
      });
      syncUserToEmailList(email, name, userCategory).catch((e) =>
        console.error("[Auth] Email sync failed:", e)
      );
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        const { password: _, ...safeUser } = user;
        return res.status(201).json(safeUser);
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password: _, ...safeUser } = req.user;
    res.json(safeUser);
  });
}

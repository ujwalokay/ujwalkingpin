import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // CSRF protection (lax required for OAuth flows)
      maxAge: sessionTtl,
    },
  });
}

export async function setupGoogleAuth(app: Express) {
  // Check if Google OAuth credentials are provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required");
    console.log("ℹ️  Use staff/admin login with username and password instead");
    return;
  }

  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
    (process.env.NODE_ENV === "production" 
      ? `${process.env.RENDER_EXTERNAL_URL}/api/auth/google/callback`
      : "http://localhost:5000/api/auth/google/callback");

  console.log("✅ Setting up Google OAuth authentication...");
  console.log(`📍 Callback URL: ${callbackURL}`);

  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          // Check if email whitelist is enabled
          const allowedEmail = process.env.ALLOWED_EMAIL;
          if (allowedEmail && email !== allowedEmail) {
            console.log(`Access denied for email: ${email}. Only ${allowedEmail} is allowed.`);
            return done(new Error("Access denied. Your email is not authorized to use this application."), undefined);
          }

          // Upsert user in database
          await storage.upsertUser({
            id: profile.id,
            email: email,
            firstName: profile.name?.givenName || profile.displayName || "",
            lastName: profile.name?.familyName || "",
            profileImageUrl: profile.photos?.[0]?.value,
          });

          // Return user object for session
          return done(null, {
            id: profile.id,
            email: email,
            firstName: profile.name?.givenName || profile.displayName,
            lastName: profile.name?.familyName,
            profileImageUrl: profile.photos?.[0]?.value,
          });
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/?error=google_auth_failed",
    }),
    (req, res) => {
      // Check if authentication was successful
      if (!req.user) {
        return res.redirect("/?error=authentication_failed");
      }
      
      // Set Google verification in session
      const googleUser = req.user as any;
      req.session.googleVerified = true;
      req.session.googleUserId = googleUser.id;
      req.session.googleEmail = googleUser.email;
      
      // Redirect to show staff/admin login form
      res.redirect("/?google_verified=true");
    }
  );

  // Handle authentication errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err.message && err.message.includes("Access denied")) {
      return res.redirect("/?error=access_denied");
    }
    next(err);
  });

  app.get("/api/auth/google/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.redirect("/");
    });
  });
}

export const isGoogleAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

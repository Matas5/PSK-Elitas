import express from "express"; 
// Importing Express, a web framework for handling HTTP requests.

import passport from "../config/passport.js"; 
// Importing the configured Passport instance for authentication.

const router = express.Router(); 
// Creating a new router instance to handle specific routes.

// Google OAuth Routes
router.get(
  "/google",
  (req, res, next) => {
    console.log("[OAuth] Google login initiated");
    console.log("[OAuth] Client ID:", process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET");
    console.log("[OAuth] Callback URL:", process.env.GOOGLE_CALLBACK_URL);
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
  // Starts the Google login process using Passport.
  // The 'scope' specifies the data we want access to (profile info and email).
);

router.get(
  "/callback",
  (req, res, next) => {
    console.log("[OAuth] Callback received");
    console.log("[OAuth] Query params:", { code: req.query.code ? "SET" : "MISSING", error: req.query.error });
    next();
  },
  passport.authenticate("google", { 
    failureRedirect: "/auth/error",
    failureMessage: true 
  }),
  // Handles the response after the user logs in via Google.
  // If authentication fails, the user is redirected to '/auth/error'.

  (req, res) => {
    console.log("[OAuth] Authentication successful for user:", req.user?.email);
    // Get the first frontend URL from CORS_ORIGIN (comma-separated)
    const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
    const primaryOrigin = corsOrigins[0].trim();
    console.log("[OAuth] Redirecting to:", primaryOrigin);
    res.redirect(`${primaryOrigin}`);
    // If authentication succeeds, redirect the user to the front-end app 
    // using the primary URL.
  }
);

// Error handler for OAuth failures
router.get("/error", (req, res) => {
  console.log("[OAuth] Error route hit. Message:", req.session?.messages);
  res.status(401).json({ 
    error: "Authentication failed",
    message: req.session?.messages?.[0] || "Unknown error"
  });
});

export default router; 
// Exporting this router to use in the main app file for mounting routes.
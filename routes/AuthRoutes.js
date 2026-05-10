import express from "express"; 
// Importing Express, a web framework for handling HTTP requests.

import passport from "../config/passport.js"; 
// Importing the configured Passport instance for authentication.

const router = express.Router(); 
// Creating a new router instance to handle specific routes.

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
  // Starts the Google login process using Passport.
  // The 'scope' specifies the data we want access to (profile info and email).
);

router.get(
  "/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  // Handles the response after the user logs in via Google.
  // If authentication fails, the user is redirected to '/login'.

  (req, res) => {
    const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5174";
    res.redirect(`${corsOrigin}`);
    // If authentication succeeds, redirect the user to the front-end app 
    // using the URL from the CORS_ORIGIN environment variable.
  }
);

export default router; 
// Exporting this router to use in the main app file for mounting routes.
import passport from "passport";
// Importing 'passport', a library that helps with user authentication.

import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// Importing the 'Google OAuth 2.0' strategy to let users log in using Google accounts.

import dotenv from "dotenv";
import path from "path";
// .env lives at the project root, one level above auth-server/
dotenv.config({ path: path.resolve(import.meta.dirname, "../.env") });

let users = []; // In-memory array
// A temporary list to store user information in memory.
// This is for testing; in a real app, you'd use a database.

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // This function runs after a user logs in with Google.
      console.log("[Passport] User authenticated:", {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      let user = users.find((user) => user.userId === profile.id);
      // Check if we already have this user in our list by their Google ID.

      if (!user) {
        // If the user doesn't exist, create a new user object.
        user = {
          userId: profile.id,
          displayName: profile.displayName, // User's name from their Google account.
          email: profile.emails[0]?.value, // User's email (uses optional chaining to avoid errors if email is missing).
        };
        users.push(user); // Add the new user to our list.
      }
      return done(null, user);
      // Finish the process by passing the user data back to 'passport'.
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.userId));
// When saving the user session, store only their Google ID (less data to manage).

passport.deserializeUser((id, done) => {
  const user = users.find((user) => user.userId === id);
  // Look up the user in our list by their Google ID.

  done(null, user || false);
  // If the user is found, return their data; otherwise, return 'false'.
});

export default passport;
// Export the configured 'passport' to use in other parts of your app.

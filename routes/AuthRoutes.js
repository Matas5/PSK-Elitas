import express from "express"; 
import passport from "../config/passport.js"; 

const router = express.Router(); 

router.get(
  "/google",
  (req, res, next) => {
    console.log("[OAuth] Google login initiated");
    console.log("[OAuth] Client ID:", process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET");
    console.log("[OAuth] Callback URL:", process.env.GOOGLE_CALLBACK_URL);
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
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
  (req, res) => {
    console.log("[OAuth] Authentication successful for user:", req.user?.email);
    const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
    const primaryOrigin = corsOrigins[0].trim();
    console.log("[OAuth] Redirecting to:", primaryOrigin);
    res.redirect(`${primaryOrigin}`);
  }
);

router.get("/error", (req, res) => {
  console.log("[OAuth] Error route hit. Message:", req.session?.messages);
  res.status(401).json({ 
    error: "Authentication failed",
    message: req.session?.messages?.[0] || "Unknown error"
  });
});

export default router; 
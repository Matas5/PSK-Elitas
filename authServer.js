import express from "express";
import passport from "passport";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/AuthRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Parse CORS_ORIGIN to support multiple origins
const corsOrigins = CORS_ORIGIN.split(",").map(origin => origin.trim());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin) || corsOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// OAuth Error Handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("TokenError")) {
    console.error("[Auth Error]", err.message);
    console.error("[Auth Error] Details:", err);
    return res.status(401).json({
      error: "OAuth authentication failed",
      details: "Failed to exchange code for token. Check your Google OAuth credentials."
    });
  }
  next(err);
});

// Routes
app.use("/auth", authRoutes);

// Debug endpoint (remove in production)
app.get("/debug/config", (req, res) => {
  res.json({
    auth_server_running: true,
    google_client_id_set: !!process.env.GOOGLE_CLIENT_ID,
    google_callback_url: process.env.GOOGLE_CALLBACK_URL,
    cors_origin: process.env.CORS_ORIGIN,
    auth_port: process.env.AUTH_PORT,
  });
});

// Endpoint to get current user info
app.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// Logout endpoint
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logged out successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});

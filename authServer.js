import express from "express";
import passport from "passport";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/AuthRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5174";

// CORS configuration
const corsOptions = {
  origin: CORS_ORIGIN,
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

// Routes
app.use("/auth", authRoutes);

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

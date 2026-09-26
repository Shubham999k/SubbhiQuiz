import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import connectDB from "./config/db.js";

// Load env vars
dotenv.config();

// Connect to database (will log error if MONGODB_URI is not set, but won't crash)
connectDB();

const app = express();

// Middleware
// gzip-compresses all responses — reduces JSON payload transfer size by 70-80%
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || "*"
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Disable caching for all API responses to prevent data leakage between accounts
// when users log in and out on the same browser.
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "API is running" });
});

export default app;

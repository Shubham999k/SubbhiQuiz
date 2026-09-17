import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Load env vars
dotenv.config();

// Connect to database (will log error if MONGODB_URI is not set, but won't crash)
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/history", historyRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "API is running" });
});

export default app;

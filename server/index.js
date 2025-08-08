const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const schedule = require("node-schedule");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const imageRoutes = require("./routes/images");
const analysisRoutes = require("./routes/analysis");
const { initDatabase } = require("./database/database");
const { processImageAnalysis } = require("./services/imageAnalysis");
const { processPendingImages } = require("./services/backgroundProcessor");

const app = express();
const PORT = process.env.PORT || 5050;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://keen-narwhal-03b42d.netlify.app",
            "https://your-frontend-domain.netlify.app",
          ]
        : "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static file serving
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/analysis", analysisRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "AlwayCare server is running" });
});

// Root endpoint - redirect to frontend in development
app.get("/", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  } else {
    res.redirect("http://localhost:3000");
  }
});

// Serve React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    console.log("✅ Database initialized successfully");

    // Start background processing job
    // Process pending images every 30 seconds
    schedule.scheduleJob("*/30 * * * * *", async () => {
      try {
        await processPendingImages();
      } catch (error) {
        console.error("Background processing error:", error);
      }
    });
    console.log("✅ Background processing scheduled");

    app.listen(PORT, () => {
      console.log(`🚀 AlwayCare server running on port ${PORT}`);
      console.log(`📱 Frontend available at http://localhost:3000`);
      console.log(`🔒 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();

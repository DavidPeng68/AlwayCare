const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { runQuery, getQuery, allQuery } = require("../database/database");
const { authenticateToken } = require("../middleware/auth");

// OPTIONAL: enable immediate analysis right after upload (non-blocking)
// const { processImageAnalysis } = require('../services/imageAnalysis');

const router = express.Router();

/** ---------------- Multer: upload config ---------------- **/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ok =
    allowed.test(path.extname(file.originalname).toLowerCase()) &&
    allowed.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error("Only image files are allowed!"), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

/** ---------------- Helpers ---------------- **/
function parseJsonField(value, fallback) {
  if (!value) return fallback;
  try {
    if (typeof value === "string") return JSON.parse(value);
    return value;
  } catch {
    return fallback;
  }
}

/** ---------------- Routes ---------------- **/

// Upload image
router.post(
  "/upload",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No image file provided" });

      const { filename, originalname, path: filePath } = req.file;
      const userId = req.user.userId;

      // Insert as "pending"
      const result = await runQuery(
        `INSERT INTO image_records
         (filename, original_filename, file_path, user_id, analysis_status)
       VALUES (?, ?, ?, ?, 'pending')`,
        [filename, originalname, filePath, userId]
      );

      // OPTIONAL: fire-and-forget immediate analysis so users don't wait for the scheduler
      /*
    (async () => {
      try {
        const analysis = await processImageAnalysis(filePath);
        await runQuery(
          `UPDATE image_records
             SET analysis_status='completed',
                 detected_objects=?,
                 risk_level=?,
                 risk_description=?,
                 confidence_scores=?
           WHERE id=?`,
          [
            JSON.stringify(analysis.detectedObjects),
            analysis.riskLevel,
            analysis.riskDescription,
            JSON.stringify(analysis.confidenceScores),
            result.id
          ]
        );
      } catch (e) {
        await runQuery(`UPDATE image_records SET analysis_status='failed' WHERE id=?`, [result.id]);
      }
    })();
    */

      return res.status(201).json({
        message: "Image uploaded successfully",
        imageId: result.id,
        filename,
        originalName: originalname,
        status: "pending",
      });
    } catch (error) {
      console.error("Upload error:", error);
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

// Get user's images (ALIased to camelCase + JSON parsed)
router.get("/my-images", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const rows = await allQuery(
      `SELECT
         id,
         filename,
         original_filename AS originalName,
         upload_timestamp  AS uploadTimestamp,
         analysis_status   AS status,
         detected_objects  AS detectedObjects,
         risk_level        AS riskLevel,
         risk_description  AS riskDescription,
         confidence_scores AS confidenceScores
       FROM image_records
       WHERE user_id = ?
       ORDER BY upload_timestamp DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const images = (rows || []).map((r) => ({
      ...r,
      detectedObjects: parseJsonField(r.detectedObjects, []),
      confidenceScores: parseJsonField(r.confidenceScores, null),
    }));

    const count = await getQuery(
      `SELECT COUNT(*) AS total FROM image_records WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      images,
      pagination: {
        page,
        limit,
        total: count.total,
        totalPages: Math.ceil(count.total / limit),
      },
    });
  } catch (error) {
    console.error("Get images error:", error);
    return res.status(500).json({ error: "Failed to fetch images" });
  }
});

// Get specific image details (ALIased + JSON parsed)
router.get("/:imageId", authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.userId;

    const row = await getQuery(
      `SELECT
         id,
         filename,
         original_filename AS originalName,
         upload_timestamp  AS uploadTimestamp,
         analysis_status   AS status,
         detected_objects  AS detectedObjects,
         risk_level        AS riskLevel,
         risk_description  AS riskDescription,
         confidence_scores AS confidenceScores
       FROM image_records
       WHERE id = ? AND user_id = ?`,
      [imageId, userId]
    );

    if (!row) return res.status(404).json({ error: "Image not found" });

    const image = {
      ...row,
      detectedObjects: parseJsonField(row.detectedObjects, []),
      confidenceScores: parseJsonField(row.confidenceScores, null),
    };

    return res.json({ image });
  } catch (error) {
    console.error("Get image error:", error);
    return res.status(500).json({ error: "Failed to fetch image details" });
  }
});

// Delete image
router.delete("/:imageId", authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.userId;

    const image = await getQuery(
      `SELECT filename, file_path FROM image_records WHERE id = ? AND user_id = ?`,
      [imageId, userId]
    );
    if (!image) return res.status(404).json({ error: "Image not found" });

    await runQuery(`DELETE FROM image_records WHERE id = ? AND user_id = ?`, [
      imageId,
      userId,
    ]);

    if (fs.existsSync(image.file_path)) {
      fs.unlink(image.file_path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    return res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete image error:", error);
    return res.status(500).json({ error: "Failed to delete image" });
  }
});

/** ---------------- Multer errors ---------------- **/
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ error: "File too large. Maximum size is 10MB." });
  }
  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

module.exports = router;

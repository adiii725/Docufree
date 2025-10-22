import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import path from "path";
import fs from "fs";
import authMiddleware from "../middleware/authMiddleware.js";
import { summarizeText } from "../gemini.service.js";

const router = express.Router();

// Ensure uploads folder exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

// Only allow images for now
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/tiff"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else
      cb(
        new Error(
          "Only image files allowed (png/jpg/tiff). PDF support will come later."
        )
      );
  },
});

// POST /api/upload
router.post("/", authMiddleware, upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;

    // Run OCR
    const {
      data: { text },
    } = await Tesseract.recognize(filePath, "eng");

    // Delete the uploaded file after processing
    fs.unlink(filePath, (err) => {
      if (err) console.warn("Could not delete file:", err);
    });

    // Generate summary with Gemini
    const summary = await summarizeText(text);

    res.json({
      userId: req.user,
      extractedText: text,
      summary,
    });
  } catch (err) {
    console.error("OCR + Gemini error:", err);
    res.status(500).json({ message: "Processing failed", error: err.message });
  }
});

export default router;

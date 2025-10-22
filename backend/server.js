// ==================== COMPLETE server.js WITH ALL CHANGES ====================

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import ocrRouter from "./ocr/index.js";
import summaryRoutes from "./routes/summary.routes.js";
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.routes.js";
import summarizationService from "./services/summarization.service.js";
import translationRoutes from "./routes/translationRoutes.js";

// Warm up the summarization model (loads in background)
summarizationService.initialize().catch(err =>
  console.error("Model preload failed:", err)
);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- Directories Setup --------------------
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const RESULTS_DIR = path.join(process.cwd(), "results");
const SUMMARIES_DIR = path.join(process.cwd(), "backend", "summarisedresults");

// Create directories if they don't exist
[UPLOAD_DIR, RESULTS_DIR, SUMMARIES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// -------------------- Index.json Management --------------------
const INDEX_JSON_PATH = path.join(UPLOAD_DIR, "index.json");

function ensureIndexJson() {
  if (!fs.existsSync(INDEX_JSON_PATH)) {
    fs.writeFileSync(INDEX_JSON_PATH, JSON.stringify([]), "utf8");
  }
}

function readIndex() {
  ensureIndexJson();
  try {
    const content = fs.readFileSync(INDEX_JSON_PATH, "utf8");
    return JSON.parse(content || "[]");
  } catch (err) {
    console.error("Error reading index:", err);
    return [];
  }
}

function writeIndex(arr) {
  try {
    fs.writeFileSync(INDEX_JSON_PATH, JSON.stringify(arr, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing index:", err);
  }
}

function addToIndex(fileData) {
  const arr = readIndex();
  const existingIndex = arr.findIndex(item => {
    const filename = typeof item === "string" ? item : item.filename;
    return filename === fileData.filename;
  });

  if (existingIndex === -1) {
    arr.unshift(fileData);
  } else {
    arr[existingIndex] = fileData;
  }
  writeIndex(arr);
}

function removeFromIndex(filename) {
  let arr = readIndex();
  arr = arr.filter(item => {
    const itemFilename = typeof item === "string" ? item : item.filename;
    return itemFilename !== filename;
  });
  writeIndex(arr);

  // Delete corresponding OCR result if exists
  const resultFile = path.join(RESULTS_DIR, `${filename}.txt`);
  if (fs.existsSync(resultFile)) {
    try {
      fs.unlinkSync(resultFile);
      console.log(`✅ Deleted OCR result: ${resultFile}`);
    } catch (err) {
      console.error("Error deleting OCR result:", err);
    }
  }
}

// Initialize index.json
ensureIndexJson();

// -------------------- Multer Setup --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const uniqueName = `${base}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "application/pdf",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and PDFs allowed."));
    }
  },
});

// -------------------- Middleware --------------------
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.text({ limit: "10mb" })); // For PUT requests to results

// -------------------- Routes --------------------
app.use("/api/summaries", summaryRoutes);
app.use("/ocr", ocrRouter);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/translation', translationRoutes);

// -------------------- File Upload Endpoint --------------------
app.post("/upload", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mime: req.file.mimetype,
      uploadDate: new Date().toISOString(),
    };

    addToIndex(fileData);

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${encodeURIComponent(
      req.file.filename
    )}`;

    return res.json({
      ...fileData,
      path: req.file.path,
      url: fileUrl,
      status: "completed",
    });
  } catch (err) {
    next(err);
  }
});

// -------------------- File Management Endpoints --------------------
app.get("/uploads/index.json", (req, res) => {
  ensureIndexJson();
  try {
    const data = fs.readFileSync(INDEX_JSON_PATH, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (err) {
    console.error("Error serving index.json:", err);
    res.status(500).json({ error: "Failed to read index" });
  }
});

app.delete("/upload/:filename", (req, res) => {
  const filename = req.params.filename;
  if (!filename)
    return res.status(400).json({ ok: false, message: "Missing filename" });

  const filePath = path.join(UPLOAD_DIR, filename);
  fs.unlink(filePath, err => {
    if (err)
      return res.status(404).json({ ok: false, message: "File not found", error: err.message });
    removeFromIndex(filename);
    return res.json({ ok: true, message: "File deleted successfully" });
  });
});

app.delete("/uploads/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  if (!filename) return res.status(400).json({ success: false, error: "Missing filename" });

  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ success: false, error: "File not found" });

  try {
    fs.unlinkSync(filePath);
    removeFromIndex(filename);
    console.log(`✅ Deleted upload: ${filename}`);
    return res.json({ success: true, message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting file:", err);
    return res.status(500).json({ success: false, error: "Failed to delete file", details: err.message });
  }
});

app.delete("/results/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  if (!filename) return res.status(400).json({ success: false, error: "Missing filename" });

  const filePath = path.join(RESULTS_DIR, filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ success: false, error: "Result file not found" });

  try {
    fs.unlinkSync(filePath);
    console.log(`✅ Deleted result: ${filename}`);
    return res.json({ success: true, message: "Result deleted successfully" });
  } catch (err) {
    console.error("Error deleting result:", err);
    return res.status(500).json({ success: false, error: "Failed to delete result", details: err.message });
  }
});

app.put("/results/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  if (!filename) return res.status(400).json({ success: false, error: "Missing filename" });

  const filePath = path.join(RESULTS_DIR, filename);

  try {
    const textContent = req.is("application/json") ? req.body.text || "" : req.body || "";
    fs.writeFileSync(filePath, textContent, "utf8");
    console.log(`✅ Updated result: ${filename}`);
    return res.json({ success: true, message: "Result updated successfully" });
  } catch (err) {
    console.error("Error updating result:", err);
    return res.status(500).json({ success: false, error: "Failed to update result", details: err.message });
  }
});

// -------------------- Static File Serving --------------------
app.use("/uploads", express.static(UPLOAD_DIR));
app.use("/results", express.static(RESULTS_DIR));
app.use("/summaries", express.static(SUMMARIES_DIR));

// -------------------- Error Handling --------------------
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ message: "File too large. Max 50MB." });
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// -------------------- Health & Info Endpoints --------------------
app.get("/", (req, res) => {
  res.json({
    message: "DocuFree Backend Server",
    version: "1.0.0",
    endpoints: {
      upload: "POST /upload",
      files: "GET /uploads/index.json",
      ocr: "POST /ocr/run/:filename",
      summarize_text: "POST /api/summaries/text",
      summarize_file: "POST /api/summaries/file",
      save_summary: "POST /api/summaries/save",
      get_summaries: "GET /api/summaries",
      delete: "DELETE /upload/:filename",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    directories: {
      uploads: fs.existsSync(UPLOAD_DIR),
      results: fs.existsSync(RESULTS_DIR),
      summaries: fs.existsSync(SUMMARIES_DIR),
    },
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// -------------------- MongoDB Connection & Server Start --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Uploads: ${UPLOAD_DIR}`);
      console.log(`📄 Results: ${RESULTS_DIR}`);
      console.log(`📝 Summaries: ${SUMMARIES_DIR}`);
      console.log("🤖 Summarization: T5-base model (Xenova)");
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  mongoose.connection.close(() => {
    console.log("MongoDB closed");
    process.exit(0);
  });
});

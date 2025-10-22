// ================= translationRoutes.js (ES module version) =================
import express from "express";
import {
  translateText,
  saveTranslation,
  getTranslationHistory,
  deleteTranslation,
  getTranslation,
} from "../translation/translationController.js"; // note the .js extension

const router = express.Router();

// POST /api/translation/translate - Translate text
router.post("/translate", translateText);

// POST /api/translation/save - Save translation
router.post("/save", saveTranslation);

// GET /api/translation/history - Get all translations
router.get("/history", getTranslationHistory);

// GET /api/translation/:id - Get specific translation
router.get("/:id", getTranslation);

// DELETE /api/translation/delete/:id - Delete translation
router.delete("/delete/:id", deleteTranslation);

// Export default for ES module
export default router;
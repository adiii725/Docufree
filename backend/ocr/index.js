import express from "express";
import { createWorker } from "tesseract.js";
import path from "path";
import fs from "fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const router = express.Router();
const RESULTS_DIR = path.join(process.cwd(), "results");

if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

// Extract text from PDF using pdfjs-dist
async function extractPdfText(filePath) {
  try {
    console.log("Reading PDF file...");
    const dataBuffer = fs.readFileSync(filePath);
    const data = new Uint8Array(dataBuffer);
    
    console.log("Loading PDF document...");
    const loadingTask = pdfjs.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    const numPages = pdfDocument.numPages;
    console.log(`PDF has ${numPages} pages`);
    
    let fullText = "";
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      console.log(`Extracting text from page ${pageNum}/${numPages}...`);
      
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map(item => item.str)
        .join(" ");
      
      fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
    }
    
    console.log(`Extracted ${fullText.length} characters from PDF`);
    
    if (!fullText || fullText.trim().length < 50) {
      return {
        success: false,
        text: null,
        message: "PDF appears to be scanned or has no text."
      };
    }
    
    return {
      success: true,
      text: fullText,
      pages: numPages
    };
  } catch (err) {
    console.error("PDF extraction error:", err);
    return {
      success: false,
      text: null,
      message: err.message
    };
  }
}

// OCR for images
async function ocrImage(filePath) {
  let worker = null;
  try {
    console.log(`Processing image: ${filePath}`);
    
    worker = await createWorker("eng", 1, {
      logger: (m) => console.log(`OCR: ${m.status} ${Math.round(m.progress * 100)}%`),
    });

    const { data } = await worker.recognize(filePath);
    await worker.terminate();
    
    return data.text;
  } catch (err) {
    console.error("Image OCR error:", err);
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }
    throw err;
  }
}

// Main OCR route
router.post("/run/:filename", async (req, res) => {
  const { filename } = req.params;
  
  if (!filename) {
    return res.status(400).json({ ok: false, message: "No file specified" });
  }

  const filePath = path.join(process.cwd(), "uploads", filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ ok: false, message: "File not found" });
  }

  const resultPath = path.join(RESULTS_DIR, `${filename}.txt`);
  const fileExt = path.extname(filename).toLowerCase();

  try {
    let extractedText = "";
    let additionalInfo = {};
    
    // Handle PDF files
    if (fileExt === ".pdf") {
      console.log("Processing PDF file...");
      
      const result = await extractPdfText(filePath);
      
      if (!result.success) {
        return res.status(400).json({
          ok: false,
          message: result.message || "Failed to extract text from PDF",
          suggestion: "This PDF may be scanned. Try converting it to images first."
        });
      }
      
      extractedText = result.text;
      additionalInfo.pages = result.pages;
      console.log(`✅ Extracted text from ${result.pages} pages`);
    } 
    // Handle image files
    else if ([".png", ".jpg", ".jpeg", ".webp"].includes(fileExt)) {
      console.log("Processing image file...");
      extractedText = await ocrImage(filePath);
    } 
    else {
      return res.status(400).json({ 
        ok: false, 
        message: "Unsupported file type. Only images (PNG, JPG, WEBP) and PDFs are supported." 
      });
    }

    // Check if we got any text
    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({
        ok: false,
        message: "No text could be extracted from the file.",
        suggestion: "For scanned documents, try using image format (PNG/JPG) instead."
      });
    }

    // Save result
    await fs.promises.writeFile(resultPath, extractedText, "utf8");
    
    console.log(`✅ Text extraction completed for: ${filename}`);

    return res.json({
      ok: true,
      message: "Text extraction completed successfully",
      text: extractedText,
      resultPath,
      filename: `${filename}.txt`,
      charCount: extractedText.length,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
      ...additionalInfo
    });
    
  } catch (err) {
    console.error("❌ Extraction error:", err);
    
    return res.status(500).json({
      ok: false,
      message: err.message || "Text extraction failed",
      error: err.message
    });
  }
});

export default router;
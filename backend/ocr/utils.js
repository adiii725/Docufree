import fs from "fs-extra";
import { createWorker } from "tesseract.js";
import pdfParse from "pdf-parse";
import path from "path";

// OCR for images
export async function ocrImage(filePath) {
  let worker = null;
  try {
    console.log(`Processing image: ${filePath}`);
    
    // Create worker properly for tesseract.js v6
    worker = await createWorker("eng", 1, {
      logger: (m) => console.log("OCR:", m.status),
    });

    const { data } = await worker.recognize(filePath);
    
    await worker.terminate();
    
    return data.text;
  } catch (err) {
    console.error("OCR image error:", err);
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }
    throw err;
  }
}

// Extract text from PDF (text-based PDFs only)
export async function ocrPDF(filePath) {
  try {
    console.log(`Extracting text from PDF: ${filePath}`);
    
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length < 50) {
      throw new Error(
        "PDF appears to be scanned or has no text. " +
        "Please convert it to images and run OCR on each page separately."
      );
    }
    
    console.log(`Extracted ${data.text.length} characters from PDF`);
    return data.text;
  } catch (err) {
    console.error("PDF extraction error:", err);
    throw err;
  }
}

// Save OCR result to file
export async function saveOCRResult(filename, text) {
  try {
    const resultDir = path.join(process.cwd(), "results");
    await fs.ensureDir(resultDir);
    
    const txtFile = path.join(resultDir, `${filename}.txt`);
    await fs.writeFile(txtFile, text, "utf-8");
    
    console.log(`Saved OCR result to: ${txtFile}`);
    return txtFile;
  } catch (err) {
    console.error("Error saving OCR result:", err);
    throw err;
  }
}
// Node.js-only file extractor for PDF and DOCX
import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";

/**
 * Extract text from a PDF buffer
 * @param {Buffer} buffer PDF file buffer
 * @returns {Promise<string>} extracted text
 */
export async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF contains no extractable text");
    }
    return data.text;
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract PDF text: ${error.message}`);
  }
}

/**
 * Extract text from a DOCX buffer
 * @param {Buffer} buffer DOCX file buffer
 * @returns {Promise<string>} extracted text
 */
export async function extractTextFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (!result.value || result.value.trim().length === 0) {
      throw new Error("DOCX contains no extractable text");
    }
    return result.value;
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error(`Failed to extract DOCX text: ${error.message}`);
  }
}

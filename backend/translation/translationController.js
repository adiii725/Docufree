import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Directory to store translation results
const RESULTS_DIR = path.join(process.cwd(), 'translation', 'results');

// Ensure directory exists
const ensureResultsDir = async () => {
  try {
    await fs.access(RESULTS_DIR);
  } catch {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
  }
};

// Supported languages map with bidirectional support
const languageMap = {
  hi: 'hi', mr: 'mr', en: 'en', bn: 'bn', te: 'te',
  ta: 'ta', gu: 'gu', kn: 'kn', ml: 'ml', pa: 'pa',
  ur: 'ur', es: 'es', fr: 'fr', de: 'de', zh: 'zh',
  ja: 'ja', ko: 'ko', ar: 'ar', pt: 'pt', ru: 'ru',
};

// Language pair to model mapping
const getModelForLanguagePair = (sourceLang, targetLang) => {
  // If source is auto, default to English source
  if (sourceLang === 'auto') sourceLang = 'en';
  
  const pair = `${sourceLang}-${targetLang}`;
  
  // Direct model mappings
  const modelMap = {
    // English to other languages
    'en-hi': 'Helsinki-NLP/opus-mt-en-hi',
    'en-mr': 'Helsinki-NLP/opus-mt-en-mul',
    'en-bn': 'Helsinki-NLP/opus-mt-en-mul',
    'en-te': 'Helsinki-NLP/opus-mt-en-mul',
    'en-ta': 'Helsinki-NLP/opus-mt-en-mul',
    'en-gu': 'Helsinki-NLP/opus-mt-en-mul',
    'en-kn': 'Helsinki-NLP/opus-mt-en-mul',
    'en-ml': 'Helsinki-NLP/opus-mt-en-mul',
    'en-pa': 'Helsinki-NLP/opus-mt-en-mul',
    'en-ur': 'Helsinki-NLP/opus-mt-en-ur',
    'en-es': 'Helsinki-NLP/opus-mt-en-es',
    'en-fr': 'Helsinki-NLP/opus-mt-en-fr',
    'en-de': 'Helsinki-NLP/opus-mt-en-de',
    'en-zh': 'Helsinki-NLP/opus-mt-en-zh',
    'en-ja': 'Helsinki-NLP/opus-mt-en-jap',
    'en-ko': 'Helsinki-NLP/opus-mt-en-ko',
    'en-ar': 'Helsinki-NLP/opus-mt-en-ar',
    'en-pt': 'Helsinki-NLP/opus-mt-en-ROMANCE',
    'en-ru': 'Helsinki-NLP/opus-mt-en-ru',
    
    // Other languages to English
    'hi-en': 'Helsinki-NLP/opus-mt-hi-en',
    'es-en': 'Helsinki-NLP/opus-mt-es-en',
    'fr-en': 'Helsinki-NLP/opus-mt-fr-en',
    'de-en': 'Helsinki-NLP/opus-mt-de-en',
    'zh-en': 'Helsinki-NLP/opus-mt-zh-en',
    'ja-en': 'Helsinki-NLP/opus-mt-jap-en',
    'ru-en': 'Helsinki-NLP/opus-mt-ru-en',
    'ar-en': 'Helsinki-NLP/opus-mt-ar-en',
  };
  
  // Return direct mapping if exists
  if (modelMap[pair]) {
    return modelMap[pair];
  }
  
  // For non-English to non-English, use multilingual model
  return 'Helsinki-NLP/opus-mt-mul-en';
};

// Chunk text into manageable pieces (based on sentences and character limit)
const chunkText = (text, maxChunkSize = 500) => {
  // Split by sentences (., !, ?, newlines)
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    // If single sentence is too long, split by character limit
    if (sentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Split long sentence into smaller parts
      for (let i = 0; i < sentence.length; i += maxChunkSize) {
        chunks.push(sentence.slice(i, i + maxChunkSize).trim());
      }
    } else if ((currentChunk + sentence).length > maxChunkSize) {
      // Current chunk would exceed limit, save it and start new
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      // Add sentence to current chunk
      currentChunk += sentence;
    }
  }
  
  // Add remaining chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

// ---------------- Translation Helpers ----------------

// Hugging Face Translation with language pair support
const translateWithHuggingFace = async (text, sourceLang, targetLang) => {
  const model = getModelForLanguagePair(sourceLang, targetLang);
  
  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${model}`,
    { inputs: text, options: { wait_for_model: true } },
    { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
  );

  let translatedText = '';
  if (Array.isArray(response.data) && response.data.length > 0) {
    translatedText = response.data[0].translation_text || response.data[0].generated_text || '';
  } else if (response.data.translation_text) {
    translatedText = response.data.translation_text;
  } else if (response.data.generated_text) {
    translatedText = response.data.generated_text;
  }

  return { translatedText, model };
};

// LibreTranslate Fallback with source language support
const translateWithLibreTranslate = async (text, sourceLang, targetLang) => {
  const source = sourceLang === 'auto' ? 'auto' : sourceLang;
  
  const response = await axios.post(
    'https://libretranslate.com/translate',
    { q: text, source, target: targetLang, format: 'text' },
    { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
  );

  return { translatedText: response.data.translatedText, model: 'LibreTranslate' };
};

// MyMemory Fallback with language pair support
const translateWithMyMemory = async (text, sourceLang, targetLang) => {
  const source = sourceLang === 'auto' ? 'en' : sourceLang;
  const encodedText = encodeURIComponent(text);
  
  const response = await axios.get(
    `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${source}|${targetLang}`,
    { timeout: 30000 }
  );

  if (response.data.responseStatus === 200) {
    return { translatedText: response.data.responseData.translatedText, model: 'MyMemory' };
  }

  throw new Error('MyMemory translation failed');
};

// Translate a single chunk with fallback logic
const translateChunk = async (chunk, sourceLang, targetLang) => {
  const errors = [];
  
  // If source and target are the same, return original
  if (sourceLang === targetLang && sourceLang !== 'auto') {
    return { translatedText: chunk, usedModel: 'No translation needed' };
  }
  
  // Try HuggingFace first
  try {
    const result = await translateWithHuggingFace(chunk, sourceLang, targetLang);
    if (result.translatedText) {
      return { translatedText: result.translatedText, usedModel: result.model };
    }
  } catch (hfErr) {
    errors.push(`HuggingFace: ${hfErr.message}`);
  }
  
  // Try LibreTranslate
  try {
    const result = await translateWithLibreTranslate(chunk, sourceLang, targetLang);
    if (result.translatedText) {
      return { translatedText: result.translatedText, usedModel: result.model };
    }
  } catch (libreErr) {
    errors.push(`LibreTranslate: ${libreErr.message}`);
  }
  
  // Try MyMemory
  try {
    const result = await translateWithMyMemory(chunk, sourceLang, targetLang);
    if (result.translatedText) {
      return { translatedText: result.translatedText, usedModel: result.model };
    }
  } catch (memErr) {
    errors.push(`MyMemory: ${memErr.message}`);
  }
  
  throw new Error(`All services failed: ${errors.join('; ')}`);
};

// ---------------- Controller Functions ----------------

// Translate text with chunking support
export const translateText = async (req, res) => {
  try {
    const { text, sourceLang = 'auto', targetLang } = req.body;
    
    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    // Validate target language
    const targetLanguage = languageMap[targetLang] || targetLang;
    const sourceLanguage = sourceLang === 'auto' ? 'auto' : (languageMap[sourceLang] || sourceLang);
    
    // Check if source and target are the same
    if (sourceLanguage === targetLanguage && sourceLanguage !== 'auto') {
      return res.json({
        success: true,
        translatedText: text,
        sourceLang: sourceLanguage,
        targetLang: targetLanguage,
        model: 'No translation needed',
        chunksProcessed: 1
      });
    }
    
    // Chunk the text
    const chunks = chunkText(text, 500);
    const translatedChunks = [];
    const models = new Set();
    const errors = [];
    
    // Translate each chunk
    for (let i = 0; i < chunks.length; i++) {
      try {
        const result = await translateChunk(chunks[i], sourceLanguage, targetLanguage);
        translatedChunks.push(result.translatedText);
        models.add(result.usedModel);
      } catch (err) {
        errors.push(`Chunk ${i + 1}: ${err.message}`);
        // If a chunk fails, add original text to maintain continuity
        translatedChunks.push(chunks[i]);
      }
    }
    
    const translatedText = translatedChunks.join(' ');
    
    if (!translatedText) {
      return res.status(503).json({
        error: 'All translation services unavailable',
        details: errors
      });
    }

    res.json({
      success: true,
      translatedText,
      sourceLang: sourceLanguage,
      targetLang: targetLanguage,
      model: Array.from(models).join(', '),
      chunksProcessed: chunks.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'Translation failed', details: err.message });
  }
};

// Save translation
export const saveTranslation = async (req, res) => {
  try {
    await ensureResultsDir();
    const { originalText, translatedText, sourceLang, targetLang } = req.body;
    
    if (!originalText || !translatedText) {
      return res.status(400).json({ error: 'Original and translated text required' });
    }

    const translationId = uuidv4();
    const timestamp = new Date().toISOString();
    const translationData = {
      id: translationId,
      originalText,
      translatedText,
      sourceLang: sourceLang || 'auto',
      targetLang,
      timestamp,
    };

    const filepath = path.join(RESULTS_DIR, `${translationId}.json`);
    await fs.writeFile(filepath, JSON.stringify(translationData, null, 2));

    res.json({ success: true, message: 'Translation saved', translationId });
  } catch (err) {
    console.error('Save translation error:', err);
    res.status(500).json({ error: 'Failed to save translation', details: err.message });
  }
};

// Get translation history
export const getTranslationHistory = async (req, res) => {
  try {
    await ensureResultsDir();
    const files = (await fs.readdir(RESULTS_DIR)).filter(f => f.endsWith('.json'));

    const translations = await Promise.all(
      files.map(async file => {
        try {
          const content = await fs.readFile(path.join(RESULTS_DIR, file), 'utf-8');
          return JSON.parse(content);
        } catch {
          return null;
        }
      })
    );

    const validTranslations = translations
      .filter(t => t !== null)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, translations: validTranslations, count: validTranslations.length });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Failed to get translation history', details: err.message });
  }
};

// Delete translation
export const deleteTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Translation ID required' });

    const filepath = path.join(RESULTS_DIR, `${id}.json`);
    try {
      await fs.access(filepath);
      await fs.unlink(filepath);
      res.json({ success: true, message: 'Translation deleted' });
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Translation not found' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Delete translation error:', err);
    res.status(500).json({ error: 'Failed to delete translation', details: err.message });
  }
};

// Get specific translation
export const getTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Translation ID required' });

    const filepath = path.join(RESULTS_DIR, `${id}.json`);
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      res.json({ success: true, translation: JSON.parse(content) });
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Translation not found' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Get translation error:', err);
    res.status(500).json({ error: 'Failed to get translation', details: err.message });
  }
};
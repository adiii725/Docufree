import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Translation {
  id: string;
  name?: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
}

const LANGS = [
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'ur', label: 'Urdu (اردو)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'zh', label: 'Chinese (中文)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'ko', label: 'Korean (한국어)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'pt', label: 'Portuguese (Português)' },
  { code: 'ru', label: 'Russian (Русский)' },
];

const API_BASE_URL = "http://localhost:5000";

const TranslationPage: React.FC = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [translated, setTranslated] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('hi');
  const [loadingTranslate, setLoadingTranslate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [past, setPast] = useState<Translation[]>([]);
  const [translationInfo, setTranslationInfo] = useState<{model?: string, chunks?: number} | null>(null);

  useEffect(() => {
    if (showPast) fetchPastTranslations();
  }, [showPast]);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoadingTranslate(true);
    setTranslated('');
    setTranslationInfo(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/translation/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, sourceLang, targetLang })
      });
      const data = await res.json();
      
      if (data.success) {
        setTranslated(data.translatedText || '');
        setTranslationInfo({
          model: data.model,
          chunks: data.chunksProcessed
        });
      } else {
        setTranslated('Translation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      setTranslated('Translation failed: Network error');
    } finally {
      setLoadingTranslate(false);
    }
  };

  const handleSave = async () => {
    if (!translated) return;
    setSaving(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/translation/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${sourceLang}->${targetLang} ${new Date().toLocaleString()}`,
          sourceLang,
          targetLang,
          originalText: input,
          translatedText: translated
        })
      });
      const data = await res.json();
      
      if (data?.success) {
        alert('✓ Translation saved successfully!');
        if (showPast) fetchPastTranslations();
      } else {
        alert('Save failed');
      }
    } catch (e) {
      console.error(e);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const fetchPastTranslations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/translation/history`);
      const data = await res.json();
      setPast(data.translations || []);
    } catch (e) {
      console.error(e);
      setPast([]);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => alert('✓ Copied to clipboard'));
  };

  const handleDownload = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this translation?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/translation/delete/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data?.success) {
        setPast(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Delete failed');
      }
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    
    // Swap texts too
    const tempText = input;
    setInput(translated);
    setTranslated(tempText);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div style={{ 
      fontFamily: "'Inter', 'Segoe UI', sans-serif", 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      margin: 0, 
      padding: 0 
    }}>
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        style={{ 
          position: 'sticky', 
          top: 0, 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(10px)',
          padding: '16px 32px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          zIndex: 100 
        }}
      >
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard')}
          style={{ 
            padding: '10px 20px', 
            borderRadius: 12, 
            border: 'none', 
            cursor: 'pointer', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
          }}
        >
          ← Dashboard
        </motion.button>
        
        <div style={{ textAlign: 'center' }}>
          <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ 
              margin: 0, 
              fontSize: 28, 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            DOCUFREE TRANSLATION
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ 
              margin: '4px 0 0 0', 
              fontSize: 13, 
              color: '#666',
              fontWeight: 500
            }}
          >
            AI-powered multilingual translation • Supports 20+ languages • Any text size
          </motion.p>
        </div>
        
        <div style={{ width: 140 }} />
      </motion.header>

      {/* Main Content */}
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ 
          display: 'flex', 
          gap: 24, 
          padding: '32px', 
          maxWidth: 1400, 
          margin: '0 auto',
          flexWrap: 'wrap'
        }}
      >
        {/* Input Section */}
        <motion.section 
          variants={itemVariants}
          style={{ 
            flex: '1 1 500px',
            background: 'rgba(255, 255, 255, 0.95)', 
            padding: 24, 
            borderRadius: 20, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <h3 style={{ marginTop: 0, color: '#333', fontSize: 18, fontWeight: 700 }}>
            📝 Input Text
          </h3>
          
          <motion.textarea 
            whileFocus={{ boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.2)' }}
            style={{ 
              width: '100%', 
              minHeight: 250, 
              padding: 16, 
              borderRadius: 12, 
              border: '2px solid #e0e0e0', 
              resize: 'vertical',
              fontSize: 14,
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }} 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Paste or type text in any language to translate..."
          />
          
          <div style={{ marginTop: 12, fontSize: 12, color: '#999', textAlign: 'right' }}>
            {input.length} characters {input.length > 500 && `(~${Math.ceil(input.length / 500)} chunks)`}
          </div>

          {/* Language Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <motion.select 
              whileHover={{ scale: 1.02 }}
              value={sourceLang} 
              onChange={e => setSourceLang(e.target.value)}
              style={{ 
                padding: '10px 14px', 
                borderRadius: 10, 
                border: '2px solid #e0e0e0', 
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                flex: 1,
                minWidth: 150
              }}
            >
              <option value="auto">🔍 Auto-detect</option>
              {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </motion.select>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={swapLanguages}
              disabled={sourceLang === 'auto'}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '2px solid #e0e0e0',
                background: '#fff',
                cursor: sourceLang === 'auto' ? 'not-allowed' : 'pointer',
                fontSize: 18,
                opacity: sourceLang === 'auto' ? 0.5 : 1
              }}
            >
              ⇄
            </motion.button>
            
            <motion.select 
              whileHover={{ scale: 1.02 }}
              value={targetLang} 
              onChange={e => setTargetLang(e.target.value)}
              style={{ 
                padding: '10px 14px', 
                borderRadius: 10, 
                border: '2px solid #e0e0e0', 
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                flex: 1,
                minWidth: 150
              }}
            >
              {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </motion.select>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTranslate} 
            disabled={loadingTranslate || !input.trim()}
            style={{ 
              width: '100%',
              marginTop: 16,
              padding: '14px 20px', 
              borderRadius: 12, 
              cursor: loadingTranslate || !input.trim() ? 'not-allowed' : 'pointer', 
              border: 'none', 
              background: loadingTranslate ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              opacity: !input.trim() ? 0.6 : 1
            }}
          >
            {loadingTranslate ? '⏳ Translating...' : '🚀 Translate Now'}
          </motion.button>
        </motion.section>

        {/* Output Section */}
        <motion.section 
          variants={itemVariants}
          style={{ 
            flex: '1 1 500px',
            background: 'rgba(255, 255, 255, 0.95)', 
            padding: 24, 
            borderRadius: 20, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <h3 style={{ marginTop: 0, color: '#333', fontSize: 18, fontWeight: 700 }}>
            ✨ Translated Text
          </h3>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={translated || 'empty'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ 
                minHeight: 250, 
                padding: 16, 
                borderRadius: 12, 
                border: '2px solid #e8e8e8', 
                background: translated ? '#f9fafb' : '#fafafa',
                position: 'relative'
              }}
            >
              {loadingTranslate ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  minHeight: 250,
                  color: '#999'
                }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ fontSize: 40, marginBottom: 16 }}
                  >
                    ⚙️
                  </motion.div>
                  <div style={{ fontWeight: 600 }}>Processing translation...</div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>This may take a moment for large texts</div>
                </div>
              ) : translated ? (
                <>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    margin: 0, 
                    fontFamily: 'inherit',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#333'
                  }}>
                    {translated}
                  </pre>
                  {translationInfo && (
                    <div style={{ 
                      marginTop: 12, 
                      paddingTop: 12, 
                      borderTop: '1px solid #e0e0e0',
                      fontSize: 11,
                      color: '#999',
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8
                    }}>
                      <span>Model: {translationInfo.model}</span>
                      {translationInfo.chunks && translationInfo.chunks > 1 && (
                        <span>Chunks: {translationInfo.chunks}</span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  minHeight: 250,
                  color: '#999'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>
                  <div style={{ fontWeight: 500 }}>Translation result will appear here</div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>Supports texts of any length</div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCopy(translated)} 
              disabled={!translated}
              style={{ 
                padding: '10px 18px', 
                borderRadius: 10, 
                border: '2px solid #e0e0e0', 
                cursor: !translated ? 'not-allowed' : 'pointer', 
                background: '#fff',
                fontWeight: 600,
                fontSize: 14,
                opacity: !translated ? 0.5 : 1
              }}
            >
              📋 Copy
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDownload(`translation_${new Date().toISOString().slice(0,10)}.txt`, translated)} 
              disabled={!translated}
              style={{ 
                padding: '10px 18px', 
                borderRadius: 10, 
                border: '2px solid #e0e0e0', 
                cursor: !translated ? 'not-allowed' : 'pointer', 
                background: '#fff',
                fontWeight: 600,
                fontSize: 14,
                opacity: !translated ? 0.5 : 1
              }}
            >
              💾 Download
            </motion.button>
          </div>

          {/* Save & History Buttons */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: '0 6px 16px rgba(34, 197, 94, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave} 
              disabled={!translated || saving}
              style={{ 
                flex: 1,
                minWidth: 200,
                padding: '12px 20px', 
                borderRadius: 10, 
                cursor: !translated || saving ? 'not-allowed' : 'pointer', 
                border: 'none', 
                background: !translated || saving ? '#ccc' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
              }}
            >
              {saving ? '💾 Saving...' : '💾 Save Translation'}
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPast(s => !s)}
              style={{ 
                flex: 1,
                minWidth: 200,
                padding: '12px 20px', 
                borderRadius: 10, 
                cursor: 'pointer', 
                border: '2px solid #667eea', 
                background: showPast ? '#667eea' : '#fff',
                color: showPast ? '#fff' : '#667eea',
                fontWeight: 700,
                fontSize: 14
              }}
            >
              {showPast ? '👁️ Hide History' : '📚 View History'}
            </motion.button>
          </div>

          {/* Past Translations */}
          <AnimatePresence>
            {showPast && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ marginTop: 24 }}
              >
                <h4 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: '#333' }}>
                  📜 Translation History
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto' }}>
                  {past.length === 0 ? (
                    <div style={{ 
                      padding: 24, 
                      textAlign: 'center', 
                      color: '#999',
                      background: '#f9fafb',
                      borderRadius: 10
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                      No past translations found
                    </div>
                  ) : (
                    past.map((item, idx) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{ 
                          border: '2px solid #e8e8e8', 
                          padding: 16, 
                          borderRadius: 12, 
                          background: '#fff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>
                              {item.sourceLang} → {item.targetLang}
                            </div>
                            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                              {new Date(item.timestamp).toLocaleString()}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleCopy(item.translatedText)}
                              style={{ 
                                padding: '6px 10px', 
                                borderRadius: 6, 
                                border: '1px solid #e0e0e0', 
                                cursor: 'pointer', 
                                background: '#fff',
                                fontSize: 12,
                                fontWeight: 600
                              }}
                            >
                              📋
                            </motion.button>
                            
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDownload(`${item.sourceLang}-${item.targetLang}.txt`, item.translatedText)}
                              style={{ 
                                padding: '6px 10px', 
                                borderRadius: 6, 
                                border: '1px solid #e0e0e0', 
                                cursor: 'pointer', 
                                background: '#fff',
                                fontSize: 12,
                                fontWeight: 600
                              }}
                            >
                              💾
                            </motion.button>
                            
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setInput(item.originalText);
                                setTranslated(item.translatedText);
                                setSourceLang(item.sourceLang);
                                setTargetLang(item.targetLang);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              style={{ 
                                padding: '6px 10px', 
                                borderRadius: 6, 
                                border: '1px solid #667eea', 
                                cursor: 'pointer', 
                                background: '#fff',
                                color: '#667eea',
                                fontSize: 12,
                                fontWeight: 600
                              }}
                            >
                              ↺
                            </motion.button>
                            
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(item.id)}
                              style={{ 
                                padding: '6px 10px', 
                                borderRadius: 6, 
                                border: '1px solid #ef4444', 
                                cursor: 'pointer', 
                                background: '#fff',
                                color: '#ef4444',
                                fontSize: 12,
                                fontWeight: 600
                              }}
                            >
                              🗑️
                            </motion.button>
                          </div>
                        </div>
                        
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ 
                            fontWeight: 600, 
                            fontSize: 13, 
                            color: '#667eea',
                            userSelect: 'none'
                          }}>
                            View content ▼
                          </summary>
                          
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e8e8e8' }}>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6 }}>
                                Original ({item.sourceLang}):
                              </div>
                              <div style={{ 
                                padding: 10, 
                                background: '#f9fafb', 
                                borderRadius: 8,
                                fontSize: 13,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: 150,
                                overflowY: 'auto'
                              }}>
                                {item.originalText}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6 }}>
                                Translated ({item.targetLang}):
                              </div>
                              <div style={{ 
                                padding: 10, 
                                background: '#f0fdf4', 
                                borderRadius: 8,
                                fontSize: 13,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: 150,
                                overflowY: 'auto'
                              }}>
                                {item.translatedText}
                              </div>
                            </div>
                          </div>
                        </details>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default TranslationPage;
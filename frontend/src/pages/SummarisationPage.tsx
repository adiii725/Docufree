import React, { useEffect, useState } from "react";
import { ArrowLeft, Save, Trash2, Download, Copy, X } from "lucide-react";

export default function SummarisationPage() {
  const [pastedText, setPastedText] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lengthPercent, setLengthPercent] = useState(30);
  const [showSaved, setShowSaved] = useState(false);
  const [savedList, setSavedList] = useState<any[]>([]);
  const [preview, setPreview] = useState<{ id: string; text: string; title: string } | null>(null);
  const [error, setError] = useState("");
  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    if (showSaved) fetchSummaries();
  }, [showSaved]);

  async function handleSummarize() {
    setIsLoading(true);
    setSummary("");
    setError("");
    
    try {
      if (!pastedText.trim()) {
        throw new Error("Please provide text to summarize");
      }

      console.log("📤 Sending text for summarization");
      const body = { text: pastedText, length_percent: lengthPercent };
      
      const res = await fetch(`${API_BASE_URL}/api/summaries/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      console.log("📥 Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Server error:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || errorText);
        } catch {
          throw new Error(errorText || `Server error: ${res.status}`);
        }
      }
      
      const data = await res.json();
      console.log("✅ Summary received:", data);
      setSummary(data.summary || "");
    } catch (err: any) {
      console.error("❌ Summarization error:", err);
      const errorMsg = err.message || String(err);
      setError(errorMsg);
      alert("Summarization failed: " + errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!summary) return alert("No summary to save");
    if (!title.trim()) return alert("Please enter a title for the summary");
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/summaries/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: summary }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Saved successfully");
      setTitle(""); // Clear title after saving
      fetchSummaries();
    } catch (err: any) {
      console.error(err);
      alert("Save failed: " + (err.message || err));
    }
  }

  async function fetchSummaries() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/summaries`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSavedList(data.summaries || []);
    } catch (err) {
      console.error(err);
      setSavedList([]);
    }
  }

  async function handleLoadFull(filename: string, title: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/summaries/${filename}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPreview({ id: filename, text: data.summary, title });
    } catch (err) {
      console.error(err);
      alert("Failed to load summary");
    }
  }

  async function handleDelete(filename: string) {
    if (!confirm("Delete this summary?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/summaries/${filename}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      fetchSummaries();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  }

  function handleDownloadText(text: string, filename = "summary.txt") {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard"));
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #e0e7ff, #ffffff, #fce7f3)',
      padding: '24px'
    },
    maxWidth: {
      maxWidth: '1152px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    headerCenter: {
      textAlign: 'center' as const,
      width: '100%'
    },
    title: {
      fontSize: '36px',
      fontWeight: '800',
      letterSpacing: '0.025em'
    },
    subtitle: {
      fontSize: '14px',
      color: '#4b5563',
      marginTop: '4px'
    },
    buttonRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap' as const
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      background: 'rgba(255,255,255,0.8)',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background 0.2s'
    },
    buttonGradient: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      background: 'linear-gradient(to right, #f472b6, #a855f7)',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px'
    },
    buttonPrimary: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '8px',
      background: 'linear-gradient(to right, #34d399, #3b82f6)',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600'
    },
    savedGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column' as const
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    cardTitle: {
      fontWeight: '600',
      marginBottom: '4px'
    },
    cardDate: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px'
    },
    iconButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      color: '#6b7280'
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '24px'
    },
    textarea: {
      width: '100%',
      minHeight: '220px',
      padding: '12px',
      borderRadius: '12px',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
      background: 'rgba(255,255,255,0.8)',
      border: '1px solid #e5e7eb',
      fontSize: '14px',
      fontFamily: 'inherit',
      resize: 'vertical' as const
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '12px',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
      background: 'rgba(255,255,255,0.9)',
      border: '1px solid #e5e7eb',
      fontSize: '14px'
    },
    slider: {
      width: '100%',
      marginTop: '12px'
    },
    outputBox: {
      background: 'white',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      minHeight: '260px'
    },
    outputText: {
      marginTop: '12px',
      fontSize: '14px',
      color: '#374151',
      whiteSpace: 'pre-wrap' as const,
      lineHeight: '1.6'
    },
    modal: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      width: '100%',
      maxWidth: '768px',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
      position: 'relative' as const,
      maxHeight: '80vh',
      overflow: 'auto'
    },
    closeButton: {
      position: 'absolute' as const,
      top: '16px',
      right: '16px',
      padding: '8px',
      borderRadius: '50%',
      background: '#f3f4f6',
      border: 'none',
      cursor: 'pointer'
    },
    sliderContainer: {
      background: 'rgba(255,255,255,0.9)',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    errorBox: {
      background: '#fee2e2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px'
    },
    titleBox: {
      background: 'rgba(255,255,255,0.9)',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '16px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <div style={styles.header}>
          <div style={styles.headerCenter}>
            <h1 style={styles.title}>DOCUFREE — SUMMARISATION</h1>
            <p style={styles.subtitle}>Paste text, choose summary length and generate a crisp legal summary.</p>
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            style={styles.button}
            onMouseOver={(e) => e.currentTarget.style.background = 'white'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
          >
            <ArrowLeft size={16} /> Back to dashboard
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowSaved(s => !s)} style={styles.button}>
              View summaries
            </button>
            <button onClick={handleSave} style={styles.buttonGradient}>
              <Save size={16} /> Save summary
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {showSaved && (
          <div style={styles.savedGrid}>
            {savedList.length === 0 && (
              <div style={styles.card}>No saved summaries yet.</div>
            )}
            {savedList.map((s) => (
              <div key={s.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.cardTitle}>{s.title}</div>
                    <div style={styles.cardDate}>{new Date(s.date).toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleCopy(s.snippet || "")} style={styles.iconButton} title="Copy">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => handleDownloadText(s.snippet || "", `${s.title || 'summary'}.txt`)} style={styles.iconButton} title="Download">
                      <Download size={16} />
                    </button>
                    <button onClick={() => handleDelete(s.filename)} style={styles.iconButton} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '14px', color: '#374151' }}>{s.snippet}</div>
                <div style={{ marginTop: '12px' }}>
              
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.mainGrid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'block' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>Paste text</div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                style={styles.textarea}
                placeholder="Paste document text here..."
              />
            </label>

            <div style={styles.titleBox}>
              <label style={{ display: 'block' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>Title for this summary</div>
                <input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter a title to save this summary" 
                  style={styles.input}
                />
              </label>
            </div>

            <button 
              onClick={handleSummarize} 
              disabled={isLoading} 
              style={{...styles.buttonPrimary, opacity: isLoading ? 0.6 : 1}}
            >
              {isLoading ? "Generating..." : "Summarise"}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={styles.sliderContainer}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '600' }}>Summary length</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{lengthPercent}%</div>
              </div>
              <input
                type="range"
                min={10}
                max={80}
                value={lengthPercent}
                onChange={(e) => setLengthPercent(Number(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.outputBox}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '600' }}>Output</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleCopy(summary)} 
                    disabled={!summary} 
                    style={{...styles.button, padding: '4px 8px', fontSize: '12px', opacity: !summary ? 0.5 : 1}}
                  >
                    Copy
                  </button>
                  <button 
                    onClick={() => handleDownloadText(summary, `${title || 'summary'}.txt`)} 
                    disabled={!summary} 
                    style={{...styles.button, padding: '4px 8px', fontSize: '12px', opacity: !summary ? 0.5 : 1}}
                  >
                    Download
                  </button>
                </div>
              </div>
              <div style={styles.outputText}>
                {summary || "No summary generated yet."}
              </div>
            </div>
          </div>
        </div>

        {preview && (
          <div style={styles.modal} onClick={() => setPreview(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setPreview(null)} style={styles.closeButton}>
                <X size={20} />
              </button>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>{preview.title}</h3>
              <div style={styles.outputText}>
                {preview.text}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
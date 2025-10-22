import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toolbar } from "./components/Toolbar";
import { UploadModal } from "./components/UploadModal";
import { DocumentDetailsPanel } from "./components/DocumentDetailsPanel";
import { FileText, MessageSquare, Languages, ScanText } from "lucide-react";
import axios from "axios";

type IndexItemObject = {
  filename: string;
  originalName?: string;
  size?: number;
  mime?: string;
  uploadDate?: string;
};

type Doc = {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  status: string;
  url?: string;
  fileType?: string;
  mime?: string;
};

export default function App() {
  console.log("🏠 App.tsx rendering (Dashboard)");
  
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<Doc[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Doc | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [ocrLoading, setOcrLoading] = useState<string | null>(null);

  const normalizeFromFilename = (filename: string): Doc => {
    const url = `http://localhost:5000/uploads/${encodeURIComponent(filename)}`;
    const fileType = (filename.split(".").pop() || "").toLowerCase();
    return {
      id: filename,
      name: filename,
      size: "—",
      uploadDate: new Date().toISOString(),
      status: "completed",
      url,
      fileType,
    };
  };

  const normalizeFromObject = (it: IndexItemObject): Doc => {
    const filename = it.filename;
    const url = `http://localhost:5000/uploads/${encodeURIComponent(filename)}`;
    const fileType = it.mime
      ? it.mime.split("/").pop()
      : filename.split(".").pop() || "";
    const size = typeof it.size === "number" ? `${(it.size / (1024 * 1024)).toFixed(2)} MB` : "—";
    const uploadDate = it.uploadDate || new Date().toISOString();
    return {
      id: filename,
      name: it.originalName || filename,
      size,
      uploadDate,
      status: "completed",
      url,
      fileType: fileType.toLowerCase(),
      mime: it.mime,
    };
  };

  const fetchExisting = async () => {
    try {
      const res = await axios.get<any>("http://localhost:5000/uploads/index.json", { 
        timeout: 5000 
      });
      const data = res.data;
      
      if (!Array.isArray(data)) {
        setDocuments([]);
        return;
      }
      
      const docs = data
        .map((item) => {
          if (typeof item === "string") return normalizeFromFilename(item);
          if (typeof item === "object" && item.filename) return normalizeFromObject(item);
          return null;
        })
        .filter(Boolean) as Doc[];
      
      setDocuments(docs);
    } catch (err) {
      console.warn("Error loading files:", err);
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchExisting();
  }, []);

  const handleModalUpload = async () => {
    await fetchExisting();
  };

  const handleDelete = async (doc: Doc) => {
    const confirmDelete = window.confirm(
      `Delete "${doc.name}"? This will remove the file and any OCR results permanently.`
    );
    if (!confirmDelete) return;
    
    try {
      await axios.delete(`http://localhost:5000/upload/${encodeURIComponent(doc.id)}`);
      console.log(`Deleted: ${doc.name}`);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete the file. Please try again.");
    } finally {
      await fetchExisting();
    }
  };

  const openPreview = (doc: Doc) => setPreviewDoc(doc);
  const closePreview = () => setPreviewDoc(null);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    return documents.filter((d) => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const completedDocs = documents.filter((d) => d.status === "completed").length;
    return {
      totalDocs,
      summaries: Math.floor(completedDocs * 0.8),
      translations: Math.floor(completedDocs * 0.6),
      ocrProcessed: Math.floor(completedDocs * 0.9),
    };
  }, [documents]);

  const runOCR = async (doc: Doc) => {
    const supportedTypes = ["png", "jpg", "jpeg", "webp", "pdf"];
    if (!doc.fileType || !supportedTypes.includes(doc.fileType)) {
      alert("OCR is only supported for images (PNG, JPG, WEBP) and PDF files.");
      return;
    }

    setOcrLoading(doc.id);
    
    try {
      console.log(`Starting OCR for: ${doc.name}`);
      
      const res = await axios.post(
        `http://localhost:5000/ocr/run/${encodeURIComponent(doc.id)}`,
        {},
        { 
          timeout: 120000,
          onUploadProgress: (progressEvent) => {
            console.log("OCR in progress...");
          }
        }
      );

      if (res.data.ok) {
        const resultText = res.data.text || "";
        const preview = resultText.length > 200 
          ? resultText.substring(0, 200) + "..." 
          : resultText;
        
        const stats = doc.fileType === "pdf"
          ? `Characters: ${res.data.charCount || 0}\nWords: ${res.data.wordCount || 0}`
          : `Text length: ${resultText.length} characters`;
        
        alert(
          `✅ Text extraction completed!\n\n` +
          `File: ${doc.name}\n` +
          `${stats}\n` +
          `Result saved to: ${res.data.filename}\n\n` +
          `Preview:\n${preview}`
        );
        
        console.log("OCR result:", res.data);
      } else {
        throw new Error(res.data.message || "Text extraction failed");
      }
    } catch (err: any) {
      console.error("OCR failed:", err);
      
      let errorMessage = "Failed to run OCR on this document.";
      
      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = "OCR process timed out. The image might be too large or complex.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`❌ OCR Error:\n${errorMessage}`);
    } finally {
      setOcrLoading(null);
    }
  };

  const handleDocumentAction = (action: string, documentId: string) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;
    
    switch (action) {
      case "view":
        setSelectedDocument(doc);
        setDetailsPanelOpen(true);
        break;
      case "delete":
        handleDelete(doc);
        break;
      case "ocr":
        runOCR(doc);
        break;
      default:
        console.log(action, documentId);
    }
  };

  const handleLogout = () => {
    try {
      // Note: localStorage might not work in artifacts, but kept for compatibility
      console.log("Logging out...");
    } catch (err) {
      console.error("Logout error:", err);
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="text-center w-full">
            <h1 className="text-3xl font-bold mb-2">DocuFree Dashboard</h1>
            <p className="text-gray-600">Manage and process your documents with AI</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 rounded-lg border bg-white hover:shadow-md transition-shadow"
              title="Logout"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
              >
                <path 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M17 16l4-4m0 0l-4-4m4 4H7" 
                />
                <path 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M7 8v8" 
                />
              </svg>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Top buttons */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button 
          onClick={() => {
            console.log("📄 Navigating to /ocrresults");
            navigate("/ocrresults");
          }} 
          className="flex flex-col items-start justify-center gap-2 p-6 rounded-lg border bg-white hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 mb-2">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-sm text-gray-600">View Documents</div>
          <div className="text-2xl font-semibold">{stats.ocrProcessed}</div>
        </button>
        
        <button 
          onClick={() => navigate("/summarization")} 
          className="flex flex-col items-start justify-center gap-2 p-6 rounded-lg border bg-white hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 mb-2">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="text-sm text-gray-600">Summarization</div>
          <div className="text-2xl font-semibold">{stats.summaries}</div>
        </button>
        
        <button 
          onClick={() => navigate("/translation")} 
          className="flex flex-col items-start justify-center gap-2 p-6 rounded-lg border bg-white hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 mb-2">
            <Languages className="h-5 w-5" />
          </div>
          <div className="text-sm text-gray-600">Translation</div>
          <div className="text-2xl font-semibold">{stats.translations}</div>
        </button>
        
        <button 
          onClick={() => navigate("/ai-assistance")} 
          className="flex flex-col items-start justify-center gap-2 p-6 rounded-lg border bg-white hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 mb-2">
            <ScanText className="h-5 w-5" />
          </div>
          <div className="text-sm text-gray-600">AI Assistance</div>
          <div className="text-2xl font-semibold">{stats.ocrProcessed}</div>
        </button>
      </div>

      {/* Toolbar + Documents */}
      <div className="max-w-7xl mx-auto px-6 py-6 bg-white rounded-lg border shadow-sm">
        <Toolbar 
          onUpload={() => setUploadModalOpen(true)} 
          onSearch={setSearchQuery} 
        />
        
        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No documents uploaded yet — click Upload to add your first document.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {filteredDocuments.map((doc) => (
              <div 
                key={doc.id} 
                className="border rounded p-3 flex flex-col gap-2 hover:shadow-md transition-shadow bg-white"
              >
                <div 
                  className="cursor-pointer" 
                  onClick={() => openPreview(doc)} 
                  title="Click to preview"
                >
                  {doc.url && ["png", "jpg", "jpeg", "webp"].includes(doc.fileType || "") ? (
                    <img 
                      src={doc.url} 
                      alt={doc.name} 
                      className="h-40 w-full object-contain rounded bg-gray-50" 
                    />
                  ) : doc.url && doc.fileType === "pdf" ? (
                    <iframe 
                      src={doc.url} 
                      title={doc.name} 
                      className="h-40 w-full rounded pointer-events-none" 
                    />
                  ) : (
                    <div className="h-40 w-full flex items-center justify-center rounded bg-gray-50 text-sm uppercase font-semibold">
                      {doc.fileType || "FILE"}
                    </div>
                  )}
                </div>
                
                <div className="font-medium truncate" title={doc.name}>
                  {doc.name}
                </div>
                
                <div className="text-xs text-gray-600">
                  {doc.size} • {new Date(doc.uploadDate).toLocaleString()}
                </div>
                
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button 
                    className="px-2 py-1 border rounded text-sm hover:bg-gray-50 transition-colors" 
                    onClick={() => handleDocumentAction("view", doc.id)}
                  >
                    View
                  </button>
                  
                  <a 
                    className="px-2 py-1 border rounded text-sm hover:bg-gray-50 transition-colors" 
                    href={doc.url} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    Open
                  </a>
                  
                  <button 
                    className="px-2 py-1 border rounded text-sm text-red-600 hover:bg-red-50 transition-colors" 
                    onClick={() => handleDelete(doc)}
                  >
                    Delete
                  </button>
                  
                  <button 
                    className="px-2 py-1 border rounded text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => handleDocumentAction("ocr", doc.id)}
                    disabled={ocrLoading === doc.id}
                  >
                    {ocrLoading === doc.id ? "Processing..." : "Run OCR"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onUpload={handleModalUpload}
        />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={closePreview} 
          />
          <div className="relative z-10 max-w-4xl w-[90%] max-h-[90%] bg-white rounded shadow-lg overflow-auto p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{previewDoc.name}</div>
              <button 
                className="px-3 py-1 border rounded hover:bg-gray-100" 
                onClick={closePreview}
              >
                Close
              </button>
            </div>
            <div>
              {previewDoc.fileType && ["png","jpg","jpeg","webp"].includes(previewDoc.fileType) ? (
                <img 
                  src={previewDoc.url} 
                  alt={previewDoc.name} 
                  className="w-full h-auto object-contain"
                />
              ) : previewDoc.fileType === "pdf" ? (
                <iframe 
                  src={previewDoc.url} 
                  title={previewDoc.name} 
                  className="w-full h-[80vh]" 
                />
              ) : (
                <div className="p-6 text-center">
                  Preview not available for this file type.{" "}
                  <a 
                    href={previewDoc.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 underline"
                  >
                    Open in new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Details Panel */}
      <DocumentDetailsPanel 
        open={detailsPanelOpen} 
        onOpenChange={setDetailsPanelOpen} 
        document={selectedDocument} 
        onAction={handleDocumentAction} 
      />

      {/* OCR Loading Overlay */}
      {ocrLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Processing OCR...</h3>
                <p className="text-sm text-gray-600">
                  Extracting text from your document. This may take a minute.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
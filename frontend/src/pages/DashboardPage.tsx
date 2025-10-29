import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Toolbar } from "../components/Toolbar";
import { UploadModal } from "../components/UploadModal";
import { DocumentDetailsPanel } from "../components/DocumentDetailsPanel";
import { FileText, MessageSquare, Languages, ScanText, LogOut, Sparkles, Loader2, X } from "lucide-react";
import axios from "axios";
// ✅ Auto switch between localhost & vercel
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://docufree.onrender.com");


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

// Resizable Preview Modal Component
const ResizablePreviewModal = ({ previewDoc, closePreview }: { previewDoc: Doc; closePreview: () => void }) => {
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      setSize({
        width: Math.max(400, Math.min(window.innerWidth - 100, resizeStart.width + deltaX)),
        height: Math.max(300, Math.min(window.innerHeight - 100, resizeStart.height + deltaY))
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart]);

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      style={{ width: size.width, height: size.height }}
      className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header with Close Button */}
      <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
        <div className="font-semibold text-lg truncate pr-4">{previewDoc.name}</div>
        <button 
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white transition-colors group flex-shrink-0" 
          onClick={closePreview}
        >
          <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-gray-50 relative">
        {previewDoc.fileType && ["png","jpg","jpeg","webp"].includes(previewDoc.fileType) ? (
          <div className="flex items-center justify-center min-h-full p-4">
            <img 
              src={previewDoc.url} 
              alt={previewDoc.name} 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : previewDoc.fileType === "pdf" ? (
          <iframe 
            src={previewDoc.url} 
            title={previewDoc.name} 
            className="w-full h-full" 
          />
        ) : (
          <div className="flex items-center justify-center h-full p-12 text-center">
            <div>
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Preview not available for this file type.</p>
              <a 
                href={previewDoc.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 underline font-medium"
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle - Bottom Right Corner */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize group"
      >
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-gray-400 group-hover:border-blue-500 transition-colors" />
      </div>

      {/* Resize Indicators */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
        {size.width} × {size.height}
      </div>
    </motion.div>
  );
};

export default function DashboardPage() {
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
    const url = `${API_BASE_URL}/uploads/${encodeURIComponent(filename)}`;

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
    const url = `${API_BASE_URL}/uploads/${encodeURIComponent(filename)}`;

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
     const res = await axios.get(`${API_BASE_URL}/uploads/index.json`);

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
      await axios.delete(`${API_BASE_URL}/upload/${encodeURIComponent(doc.id)}`);

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
  `${API_BASE_URL}/ocr/run/${encodeURIComponent(doc.id)}`
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
    console.log("🚪 Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
    console.log("✅ Logged out successfully");
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    }),
    hover: {
      y: -8,
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  const statCards = [
    {
      title: "View Documents",
      icon: FileText,
      route: "/ocrresults",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Summarisation",
      icon: MessageSquare,
      route: "/summarisation",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Translation",
      icon: Languages,
      route: "/translation",
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "AI Assistance",
      icon: ScanText,
      route: "/ai-assistance",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header - Now scrolls with page */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border-b bg-white/80 backdrop-blur-lg shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          {/* Center-aligned title */}
          <div className="flex-1 text-center">
            <motion.div 
              className="inline-flex items-center gap-3 mb-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DocuFree Dashboard
              </h1>
            </motion.div>
            <p className="text-gray-600 text-sm">Manage and process your documents with AI</p>
          </div>

          {/* Logout button - positioned absolute to stay on right */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="absolute right-6 flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:shadow-md transition-all group"
          >
            <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-medium">Logout</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Stat Cards - Removed Numbers */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <motion.button
              key={card.route}
              custom={index}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              variants={cardVariants}
              onClick={() => {
                console.log(`📄 Navigating to ${card.route}`);
                navigate(card.route);
              }}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-gray-100"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative flex flex-col items-start">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                
                <div className="text-lg font-semibold text-gray-900">{card.title}</div>
                <div className="text-sm text-gray-500 mt-1">Access {card.title.toLowerCase()}</div>
              </div>

              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Documents Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="max-w-7xl mx-auto px-6 py-6"
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border shadow-xl overflow-hidden">
          <Toolbar 
            onUpload={() => setUploadModalOpen(true)} 
            onSearch={setSearchQuery} 
          />

          {documents.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center"
            >
              <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">No documents uploaded yet</p>
              <p className="text-gray-400 text-sm mt-2">Click Upload to add your first document</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
              <AnimatePresence>
                {filteredDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.9 }}
                    variants={cardVariants}
                    whileHover="hover"
                    className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300"
                  >
                    {/* Document Preview - Fixed Size Container */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {doc.url && ["png", "jpg", "jpeg", "webp"].includes(doc.fileType || "") ? (
                        <img 
                          src={doc.url} 
                          alt={doc.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : doc.url && doc.fileType === "pdf" ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-16 w-16 text-red-500" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-4xl font-bold text-gray-300 uppercase">
                            {doc.fileType || "FILE"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Document Info */}
                    <div className="p-4">
                      <div className="font-semibold text-gray-900 truncate mb-2" title={doc.name}>
                        {doc.name}
                      </div>

                      <div className="text-xs text-gray-500 mb-4">
                        {doc.size} • {new Date(doc.uploadDate).toLocaleDateString()}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          className="flex-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 transition-colors font-medium" 
                          onClick={() => openPreview(doc)}
                        >
                          View
                        </button>

                        <a 
                          className="flex-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 transition-colors text-center font-medium" 
                          href={doc.url} 
                          target="_blank" 
                          rel="noreferrer"
                        >
                          Open
                        </a>

                        <button 
                          className="flex-1 px-3 py-1.5 text-xs border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium" 
                          onClick={() => handleDelete(doc)}
                        >
                          Delete
                        </button>

                        <button 
                          className="w-full px-3 py-1.5 text-xs border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-1" 
                          onClick={() => handleDocumentAction("ocr", doc.id)}
                          disabled={ocrLoading === doc.id}
                        >
                          {ocrLoading === doc.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Run OCR"
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onUpload={handleModalUpload}
        />
      )}

      {/* Preview Modal - Resizable */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={closePreview} 
            />
            
            <ResizablePreviewModal 
              previewDoc={previewDoc} 
              closePreview={closePreview} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Details Panel */}
      <DocumentDetailsPanel 
        open={detailsPanelOpen} 
        onOpenChange={setDetailsPanelOpen} 
        document={selectedDocument} 
        onAction={handleDocumentAction} 
      />

      {/* OCR Loading Overlay */}
      <AnimatePresence>
        {ocrLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute inset-0"></div>
                </div>
                
                <div className="text-center">
                  <h3 className="font-bold text-xl mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Processing OCR...
                  </h3>
                  <p className="text-sm text-gray-600">
                    Extracting text from your document. This may take a minute.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Copy, FileDown, Trash2, X, Save } from "lucide-react";
import axios from "axios";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://docufree.onrender.com");

type OcrResult = {
  id: string;
  filename: string;
  originalName: string;
  text: string;
  charCount: number;
  wordCount: number;
  uploadDate: string;
  processedDate: string;
};

export default function OcrResultsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ocrResults, setOcrResults] = useState<OcrResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<OcrResult | null>(null);
  const [editedText, setEditedText] = useState("");

  useEffect(() => {
    fetchOcrResults();
  }, []);

  const fetchOcrResults = async () => {
    try {
      setLoading(true);
      setError(null);
     const indexRes = await axios.get(`${API_BASE_URL}/uploads/index.json`);

      const files = indexRes.data;

      if (!Array.isArray(files)) return setOcrResults([]);

      const results: OcrResult[] = [];
      for (const file of files) {
        const filename = typeof file === "string" ? file : file.filename;
        const originalName = typeof file === "object" ? file.originalName : filename;

        try {
          const resultRes =
         await axios.get(`${API_BASE_URL}/results/${encodeURIComponent(filename)}.txt`);

          if (resultRes.data) {
            const text = resultRes.data;
            const wordCount = text.split(/\s+/).filter(Boolean).length;
            results.push({
              id: filename,
              filename: `${filename}.txt`,
              originalName,
              text,
              charCount: text.length,
              wordCount,
              uploadDate:
                typeof file === "object" ? file.uploadDate : new Date().toISOString(),
              processedDate: new Date().toISOString(),
            });
          }
        } catch {
          // skip missing OCR files
        }
      }
      setOcrResults(results);
    } catch (err: any) {
      setError(err.message || "Failed to load OCR results");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (result: OcrResult) => {
    const blob = new Blob([result.text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Success", description: "Text copied to clipboard!" });
    } catch {
      toast({ title: "Error", description: "Failed to copy text.", variant: "destructive" });
    }
  };

  const handleDelete = async (result: OcrResult, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Delete clicked for:", result.originalName);
    
    if (!window.confirm(`Are you sure you want to delete ${result.originalName}?`)) {
      console.log("Delete cancelled by user");
      return;
    }
    
    console.log("Attempting to delete files...");
    try {
      console.log(
  "Deleting result file:",
  `${API_BASE_URL}/results/${encodeURIComponent(result.id)}.txt`
);
await axios.delete(
  `${API_BASE_URL}/results/${encodeURIComponent(result.id)}.txt`
);

// Delete the upload file
console.log(
  "Deleting upload file:",
  `${API_BASE_URL}/uploads/${encodeURIComponent(result.id)}`
);
await axios.delete(
  `${API_BASE_URL}/uploads/${encodeURIComponent(result.id)}`
);

      setOcrResults((prev) => prev.filter((r) => r.id !== result.id));
      toast({ title: "Success", description: "File deleted successfully" });
      console.log("Delete successful");
    } catch (err: any) {
      console.error("Delete failed:", err);
      console.error("Error details:", err.response?.data || err.message);
      toast({ title: "Error", description: `Failed to delete file: ${err.response?.data?.error || err.message}`, variant: "destructive" });
    }
  };

  const handleOpenDocument = (result: OcrResult) => {
    setSelectedResult(result);
    setEditedText(result.text);
  };

  const handleCloseDocument = () => {
    setSelectedResult(null);
    setEditedText("");
  };

  const handleSaveDocument = async () => {
    if (!selectedResult) return;
    try {
      // Send the updated text to the backend to update the existing file
      await axios.put(
  `${API_BASE_URL}/results/${encodeURIComponent(selectedResult.id)}.txt`,
  { text: editedText },

        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Update local state
      setOcrResults((prev) =>
        prev.map((r) =>
          r.id === selectedResult.id
            ? { 
                ...r, 
                text: editedText, 
                charCount: editedText.length, 
                wordCount: editedText.split(/\s+/).filter(Boolean).length 
              }
            : r
        )
      );
      
      toast({ title: "Success", description: "Document saved successfully" });
      handleCloseDocument();
    } catch (err: any) {
      console.error("Save failed:", err);
      console.error("Error details:", err.response?.data || err.message);
      toast({ 
        title: "Error", 
        description: `Failed to save document: ${err.response?.data?.error || err.message}`, 
        variant: "destructive" 
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-gray-200"
    >
      {/* Header - Now scrolls with page */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Top row: Back button and document count */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:shadow-md transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <p className="text-sm text-gray-600">
              {ocrResults.length} document{ocrResults.length !== 1 ? "s" : ""} processed
            </p>
          </div>

          {/* Centered title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800">OCR PROCESSED DOCUMENTS</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading OCR results...</p>
          </div>
        ) : ocrResults.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <h2 className="text-xl font-semibold mb-2">No OCR Results Found</h2>
            <p className="text-gray-600 mb-4">
              Upload documents and run OCR to see results here.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {ocrResults.map((result, i) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.4, type: "spring" }}
                  exit={{ opacity: 0, y: 30 }}
                  onClick={() => handleOpenDocument(result)}
                  className="relative flex flex-col justify-between border rounded-2xl bg-white p-6 shadow-md hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                >
                  <div>
                    <h3 className="text-lg font-semibold mb-2 truncate text-gray-800">
                      {result.originalName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      📅 Uploaded: {new Date(result.uploadDate).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      ⚙ Processed: {new Date(result.processedDate).toLocaleString()}
                    </p>
                    <div className="mt-3 text-sm text-gray-500">
                      📝 {result.wordCount} words • {result.charCount} characters
                    </div>
                  </div>

                  {/* Buttons with colored outlined boxes */}
                  <div className="mt-6 flex items-center justify-between gap-2">
                    <div
                      style={{
                        border: "2px solid #3B82F6",
                        borderRadius: "10px",
                        padding: "8px",
                        backgroundColor: "#EFF6FF",
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(result.text);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-navy-blue text-sm rounded-lg hover:bg-blue-600 shadow hover:shadow-lg transition"
                        title="Copy text"
                      >
                        <Copy className="h-4 w-4" /> Copy
                      </motion.button>
                    </div>

                    <div
                      style={{
                        border: "2px solid #10B981",
                        borderRadius: "10px",
                        padding: "8px",
                        backgroundColor: "#ECFDF5",
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(result);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-green-500 text-darkgreen text-sm rounded-lg hover:bg-green-600 shadow hover:shadow-lg transition"
                        title="Download"
                      >
                        <FileDown className="h-4 w-4" /> Download
                      </motion.button>
                    </div>

                    <div
                      style={{
                        border: "2px solid #EF4444",
                        borderRadius: "10px",
                        padding: "8px",
                        backgroundColor: "#FEF2F2",
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleDelete(result, e)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-500 text-maroon text-sm rounded-lg hover:bg-red-600 shadow hover:shadow-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Document Viewer Modal - BLACK BACKGROUND WITH WHITE TEXT */}
      <AnimatePresence>
        {selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseDocument}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="border-2 border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
              style={{ backgroundColor: '#000000' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700" style={{ backgroundColor: '#000000' }}>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#ffffff' }}>{selectedResult.originalName}</h2>
                  <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                    {editedText.split(/\s+/).filter(Boolean).length} words • {editedText.length} characters
                  </p>
                </div>
                <button
                  onClick={handleCloseDocument}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  style={{ color: '#ffffff' }}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content - Editable Text with BLACK BACKGROUND & WHITE TEXT */}
              <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#000000' }}>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full min-h-[400px] border-2 border-gray-700 rounded-lg p-4 font-mono text-sm resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  style={{ 
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                  }}
                  placeholder="Edit your document text here..."
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700" style={{ backgroundColor: '#000000' }}>
                <button
                  onClick={handleCloseDocument}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition"
                  style={{ color: '#d1d5db' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDocument}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
                  style={{ color: '#ffffff' }}
                >
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

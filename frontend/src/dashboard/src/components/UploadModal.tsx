import React, { useCallback, useRef, useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import Webcam from "react-webcam";

type UploadResult = {
  filename: string;
  name: string;
  size: number;
  mime: string;
  url: string;
  uploadDate: string;
  status: string;
};

export function UploadModal({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpload: (files: UploadResult[] | UploadResult) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const webcamRef = useRef<Webcam | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    await uploadFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "application/pdf": [".pdf"] },
    multiple: false,
  });

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setProgressMsg("Uploading...");
    try {
      const results: UploadResult[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const res = await axios.post("http://localhost:5000/upload", form);
        results.push(res.data);
      }
      setProgressMsg("Upload complete");
      onUpload(results.length === 1 ? results[0] : results);
      setTimeout(() => onOpenChange(false), 600);
    } catch (err: any) {
      console.error(err);
      setProgressMsg("Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setProgressMsg(null), 1500);
    }
  };

  const captureFromWebcam = async () => {
    if (!webcamRef.current) return;
    const base64 = webcamRef.current.getScreenshot();
    if (!base64) return;
    const res = await fetch(base64);
    const blob = await res.blob();
    const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: blob.type });
    await uploadFiles([file]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />

      <div className="relative z-10 w-[min(900px,95%)] bg-card rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium">Upload document</h3>
          <button className="text-sm text-muted-foreground" onClick={() => onOpenChange(false)}>Close</button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Dropzone & file input */}
          <div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed p-6 rounded-md text-center cursor-pointer ${isDragActive ? "border-primary/80 bg-primary/5" : "border-muted"}`}
              style={{ minHeight: 220 }}
            >
              <input {...getInputProps()} />
              <p className="mb-3">Drag & drop a file here, or click to select</p>
              <p className="text-xs text-muted-foreground">Supported: images (png/jpg), PDF</p>
            </div>

            <div className="mt-3">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await uploadFiles([f]);
                  e.currentTarget.value = "";
                }}
              />
            </div>

            {progressMsg && <div className="mt-2 text-sm">{progressMsg}</div>}
            {uploading && <div className="mt-2 text-sm">Uploading...</div>}
          </div>

          {/* Right: Webcam */}
          <div>
            <div className="rounded-md border p-2 flex flex-col items-center justify-center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="w-full rounded-sm"
              />
              <div className="mt-2 flex gap-2">
                <button
                  className="px-3 py-1 rounded bg-primary text-white"
                  onClick={captureFromWebcam}
                  disabled={uploading}
                >
                  Capture & Upload
                </button>
                <button
                  className="px-3 py-1 rounded border"
                  onClick={() => webcamRef.current && webcamRef.current.getScreenshot()}
                >
                  Snapshot
                </button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">Use the camera to capture an image of a document.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

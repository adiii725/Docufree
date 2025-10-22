import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import {
  Download,
  FileText,
  MessageSquare,
  Languages,
  Volume2,
  ScanText,
  Clock,
  User,
} from "lucide-react";

interface DocumentDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    name: string;
    size: string;
    uploadDate: string;
    status: string;
    fileType: string;
    extractedText?: string;
    summary?: string;
    translations?: { language: string; text: string }[];
    history?: { action: string; timestamp: string; user: string }[];
  } | null;
  onAction: (action: string, documentId: string) => void;
}

export function DocumentDetailsPanel({ 
  open, 
  onOpenChange, 
  document, 
  onAction 
}: DocumentDetailsPanelProps) {
  if (!document) return null;

  const statusColors = {
    uploading: "bg-blue-100 text-blue-800",
    processing: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {document.name}
              </SheetTitle>
              <SheetDescription>
                {document.uploadDate} • {document.size} • {document.fileType.toUpperCase()}
              </SheetDescription>
              <Badge className={statusColors[document.status as keyof typeof statusColors]} variant="secondary">
                {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction('download', document.id)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {document.status === 'completed' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction('summarize', document.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Summarize
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction('translate', document.id)}
                >
                  <Languages className="h-4 w-4 mr-2" />
                  Translate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction('tts', document.id)}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Text to Speech
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction('ocr', document.id)}
                >
                  <ScanText className="h-4 w-4 mr-2" />
                  OCR
                </Button>
              </>
            )}
          </div>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="translations">Translations</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div>
                <h4 className="mb-2">Extracted Text</h4>
                <ScrollArea className="h-80 w-full border rounded-md p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {document.extractedText || 
                      "This is a sample document containing important information about the DocuFree platform. The platform provides advanced document processing capabilities including OCR, text extraction, summarization, and translation services. Users can upload documents in various formats including PDF, DOC, and image files. The system automatically processes these documents and extracts meaningful information that can be used for further analysis and workflow automation."
                    }
                  </p>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <div>
                <h4 className="mb-2">AI Summary</h4>
                <ScrollArea className="h-80 w-full border rounded-md p-4">
                  <p className="text-sm">
                    {document.summary || 
                      "This document outlines the key features and capabilities of the DocuFree platform. The main points include: 1) Multi-format document support (PDF, DOC, images), 2) Automated text extraction using OCR technology, 3) AI-powered summarization for quick insights, 4) Multi-language translation services, and 5) Text-to-speech conversion for accessibility. The platform is designed to streamline document workflows and improve productivity for businesses and individuals."
                    }
                  </p>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="translations" className="space-y-4">
              <div>
                <h4 className="mb-2">Available Translations</h4>
                <ScrollArea className="h-80 w-full">
                  <div className="space-y-4">
                    {(document.translations || [
                      { language: "Spanish", text: "Este documento describe las características clave de la plataforma DocuFree..." },
                      { language: "French", text: "Ce document décrit les fonctionnalités clés de la plateforme DocuFree..." },
                      { language: "German", text: "Dieses Dokument beschreibt die wichtigsten Funktionen der DocuFree-Plattform..." }
                    ]).map((translation, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{translation.language}</h5>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{translation.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div>
                <h4 className="mb-2">Document History</h4>
                <ScrollArea className="h-80 w-full">
                  <div className="space-y-3">
                    {(document.history || [
                      { action: "Document uploaded", timestamp: "2 hours ago", user: "John Doe" },
                      { action: "OCR processing completed", timestamp: "1 hour ago", user: "System" },
                      { action: "Summary generated", timestamp: "45 minutes ago", user: "AI Assistant" },
                      { action: "Translated to Spanish", timestamp: "30 minutes ago", user: "John Doe" },
                      { action: "Document downloaded", timestamp: "15 minutes ago", user: "Jane Smith" }
                    ]).map((entry, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                        <div className="mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{entry.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{entry.user}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
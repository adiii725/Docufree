import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  FileText,
  File,
  Image as ImageIcon,
  MoreHorizontal,
  FileType,
  Download,
  Trash2,
  MessageSquare,
  Languages,
  Volume2,
  ScanText,
} from "lucide-react";

interface DocumentCardProps {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  status: "uploading" | "processing" | "completed" | "error";
  fileType: "pdf" | "doc" | "jpg" | "png" | "txt";
  onAction: (action: string, documentId: string) => void;
}

const fileIcons = {
  pdf: FileText,
  doc: File,
  jpg: ImageIcon,
  png: ImageIcon,
  txt: FileType,
};

const statusColors = {
  uploading: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

export function DocumentCard({ 
  id, 
  name, 
  size, 
  uploadDate, 
  status, 
  fileType, 
  onAction 
}: DocumentCardProps) {
  const FileIcon = fileIcons[fileType];

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onAction('view', id)}>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <FileIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate" title={name}>{name}</h3>
            <p className="text-sm text-muted-foreground">
              {uploadDate} • {size} • {fileType.toUpperCase()}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction('download', id)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('delete', id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Badge className={statusColors[status]} variant="secondary">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>

        {status === 'completed' && (
          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onAction('summarize', id)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Summarize
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onAction('translate', id)}
            >
              <Languages className="h-4 w-4 mr-2" />
              Translate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction('tts', id)}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction('ocr', id)}
            >
              <ScanText className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
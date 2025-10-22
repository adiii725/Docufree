import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Upload, Search } from "lucide-react";

interface ToolbarProps {
  onUpload: () => void;
  onSearch: (query: string) => void;
}

export function Toolbar({ onUpload, onSearch }: ToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-6 bg-card border-b">
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        <Button onClick={onUpload} className="shrink-0">
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
        
        <div className="flex gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Palette, 
  Type, 
  Image, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  FileText,
  Trash2
} from "lucide-react";
import { BrandGuideline } from "@/lib/brand-guideline-extractor";
import { StoredBrandGuideline } from "@/lib/brand-guidelines-storage";

interface BrandGuidelinesPanelProps {
  brandGuidelines: BrandGuideline | null;
  storedBrandGuidelines: StoredBrandGuideline[];
  selectedStoredGuideline: string;
  isExtractingBrand: boolean;
  brandExtractionError: string;
  onFileUpload: (file: File) => Promise<void>;
  onStoredGuidelineSelect: (id: string) => void;
  onStoredGuidelineDelete: (id: string) => void;
  onClearBrandGuidelines: () => void;
}

// Helper function to safely render content
const safeRenderContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (typeof content === 'number' || typeof content === 'boolean') return String(content);
  if (content === null || content === undefined) return '';
  if (Array.isArray(content)) return content.map(item => safeRenderContent(item)).join(', ');
  if (typeof content === 'object') {
    try {
      return Object.entries(content).map(([key, value]) => `${key}: ${safeRenderContent(value)}`).join(', ');
    } catch {
      return JSON.stringify(content);
    }
  }
  return String(content);
};

export function BrandGuidelinesPanel({
  brandGuidelines,
  storedBrandGuidelines,
  selectedStoredGuideline,
  isExtractingBrand,
  brandExtractionError,
  onFileUpload,
  onStoredGuidelineSelect,
  onStoredGuidelineDelete,
  onClearBrandGuidelines
}: BrandGuidelinesPanelProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-600" />
          Brand Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stored Guidelines Selection */}
        {storedBrandGuidelines.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Use Existing Guidelines</Label>
            <div className="flex gap-2">
              <Select value={selectedStoredGuideline} onValueChange={onStoredGuidelineSelect}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select stored guidelines" />
                </SelectTrigger>
                <SelectContent>
                  {storedBrandGuidelines.map((guideline) => (
                    <SelectItem key={guideline.id} value={guideline.id}>
                      {guideline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStoredGuideline && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStoredGuidelineDelete(selectedStoredGuideline)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Upload Brand Guidelines PDF</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isExtractingBrand ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="text-sm text-gray-600">Extracting brand guidelines...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Drag and drop your PDF here, or{" "}
                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                      browse files
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-400">PDF files only</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {brandExtractionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">{brandExtractionError}</div>
          </div>
        )}

        {/* Brand Guidelines Display */}
        {brandGuidelines && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Brand Guidelines Loaded</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearBrandGuidelines}
                className="text-gray-600 hover:text-gray-700"
              >
                Clear
              </Button>
            </div>

            {/* Colors */}
            {brandGuidelines.colors && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Palette className="h-4 w-4" />
                  Colors
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(brandGuidelines.colors).map(([category, colors]) => (
                    <div key={category} className="space-y-1">
                      <span className="text-xs font-medium text-gray-600 capitalize">{category}</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(colors) ? colors.slice(0, 3).map((color, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded border border-gray-200"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        )) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typography */}
            {brandGuidelines.typography && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Type className="h-4 w-4" />
                  Typography
                </Label>
                <div className="text-xs text-gray-600 space-y-1">
                  {brandGuidelines.typography.fonts && (
                    <div>
                      <span className="font-medium">Fonts: </span>
                      {safeRenderContent(brandGuidelines.typography.fonts)}
                    </div>
                  )}
                  {brandGuidelines.typography.weights && (
                    <div>
                      <span className="font-medium">Weights: </span>
                      {safeRenderContent(brandGuidelines.typography.weights)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Points */}
            {brandGuidelines.keyPoints && brandGuidelines.keyPoints.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Key Guidelines
                </Label>
                <div className="flex flex-wrap gap-1">
                  {brandGuidelines.keyPoints.slice(0, 3).map((point, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {safeRenderContent(point)}
                    </Badge>
                  ))}
                  {brandGuidelines.keyPoints.length > 3 && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      +{brandGuidelines.keyPoints.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
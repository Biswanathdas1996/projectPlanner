import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface BrandExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExtracting: boolean;
  extractionProgress: { current: number; total: number; currentStep: string };
  extractionError: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BrandExtractionModal({
  isOpen,
  onClose,
  isExtracting,
  extractionProgress,
  extractionError,
  onFileUpload
}: BrandExtractionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Brand Guidelines
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isExtracting && !extractionError && (
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Upload PDF Brand Guidelines</p>
                <p className="text-xs text-gray-500">
                  Upload a PDF file containing your brand guidelines to extract colors, fonts, and design rules
                </p>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={onFileUpload}
                className="hidden"
                id="brand-pdf-upload"
              />
              <Button 
                onClick={() => document.getElementById('brand-pdf-upload')?.click()}
                className="mt-4"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose PDF File
              </Button>
            </div>
          )}

          {isExtracting && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Extracting Brand Guidelines</span>
              </div>
              
              <Progress 
                value={extractionProgress.total > 0 ? (extractionProgress.current / extractionProgress.total) * 100 : 0} 
                className="h-2"
              />
              
              <p className="text-xs text-gray-600">{extractionProgress.currentStep}</p>
            </div>
          )}

          {extractionError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-800">Extraction Failed</p>
                <p className="text-xs text-red-600">{extractionError}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
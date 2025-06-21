import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, AlertCircle, CheckCircle2, Palette } from "lucide-react";
import type { StoredBrandGuideline } from "@/lib/brand-guidelines-storage";

interface MultimodalAnalysisProgress {
  current: number;
  total: number;
  currentStep: string;
}

interface BrandUploadSectionProps {
  isExtractingBrand: boolean;
  isPerformingMultimodalAnalysis: boolean;
  multimodalAnalysisProgress: MultimodalAnalysisProgress;
  brandExtractionError: string;
  storedBrandGuidelines: StoredBrandGuideline[];
  selectedStoredGuideline: string;
  handleBrandGuidelineUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleStoredGuidelineSelection: (guidelineId: string) => void;
}

export function BrandUploadSection({
  isExtractingBrand,
  isPerformingMultimodalAnalysis,
  multimodalAnalysisProgress,
  brandExtractionError,
  storedBrandGuidelines,
  selectedStoredGuideline,
  handleBrandGuidelineUpload,
  handleStoredGuidelineSelection
}: BrandUploadSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5" />
          Brand Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Upload Brand Guidelines PDF</h3>
              <p className="text-sm text-gray-600">
                Extract colors, fonts, and design rules from your brand guidelines
              </p>
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleBrandGuidelineUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isExtractingBrand}
              />
              <Button
                variant="outline"
                disabled={isExtractingBrand}
                className="flex items-center gap-2"
              >
                {isExtractingBrand ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <FileText className="h-4 w-4" />
                    Upload PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Display */}
          {isPerformingMultimodalAnalysis && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{multimodalAnalysisProgress.currentStep}</span>
                <span className="font-medium">
                  {multimodalAnalysisProgress.current}%
                </span>
              </div>
              <Progress 
                value={multimodalAnalysisProgress.current} 
                max={100}
                className="w-full"
              />
            </div>
          )}

          {/* Error Display */}
          {brandExtractionError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Brand Guidelines Extraction Failed</p>
                <p className="mt-1">{brandExtractionError}</p>
              </div>
            </div>
          )}

          {/* Stored Guidelines Selection */}
          {storedBrandGuidelines.length > 0 && (
            <div className="border-t pt-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium">Previously Extracted Guidelines</h3>
                  <p className="text-sm text-gray-600">
                    Select from your saved brand guidelines
                  </p>
                </div>
                
                <Select
                  value={selectedStoredGuideline}
                  onValueChange={handleStoredGuidelineSelection}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select brand guidelines..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No brand guidelines</SelectItem>
                    {storedBrandGuidelines.map((guideline) => (
                      <SelectItem key={guideline.id} value={guideline.id}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{guideline.name}</span>
                          <span className="text-xs text-gray-500">
                            ({new Date(guideline.extractedAt).toLocaleDateString()})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
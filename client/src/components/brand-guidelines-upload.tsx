import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Palette, 
  Eye, 
  Sparkles, 
  Code, 
  Loader2, 
  Trash2,
  X
} from 'lucide-react';

interface StoredBrandGuideline {
  id: string;
  name: string;
  extractedAt: string;
}

interface MultimodalAnalysisProgress {
  current: number;
  total: number;
  currentStep?: string;
}

interface FinalBrandReport {
  documentInfo: {
    totalPages: number;
    totalChunks: number;
    averageConfidence: number;
    processingTime: number;
  };
  keyFindings: {
    criticalRequirements: string[];
    brandThemes: string[];
    designPrinciples: string[];
    complianceNotes: string[];
  };
}

interface BrandGuidelinesUploadProps {
  visible: boolean;
  brandGuidelines: any;
  storedBrandGuidelines: StoredBrandGuideline[];
  selectedStoredGuideline: string;
  isExtractingBrand: boolean;
  isPerformingMultimodalAnalysis: boolean;
  multimodalAnalysisProgress: MultimodalAnalysisProgress;
  finalBrandReport: FinalBrandReport | null;
  brandExtractionError: string | null;
  isGeneratingWireframes: boolean;
  isGeneratingUnifiedHTML: boolean;
  showBrandModal: boolean;
  onStoredGuidelineSelection: (value: string) => void;
  onDeleteStoredGuideline: (id: string) => void;
  onBrandGuidelineUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onShowBrandModal: () => void;
  onCloseBrandModal: () => void;
  onGenerateBrandAwareWireframes: () => void;
  onGenerateUnifiedHTML: () => void;
  isExternalBrandData: (data: any) => boolean;
  getColorsFromExternalData: (data: any) => string[];
  getFontsFromExternalData: (data: any) => string[];
}

export function BrandGuidelinesUpload({
  visible,
  brandGuidelines,
  storedBrandGuidelines,
  selectedStoredGuideline,
  isExtractingBrand,
  isPerformingMultimodalAnalysis,
  multimodalAnalysisProgress,
  finalBrandReport,
  brandExtractionError,
  isGeneratingWireframes,
  isGeneratingUnifiedHTML,
  showBrandModal,
  onStoredGuidelineSelection,
  onDeleteStoredGuideline,
  onBrandGuidelineUpload,
  onShowBrandModal,
  onCloseBrandModal,
  onGenerateBrandAwareWireframes,
  onGenerateUnifiedHTML,
  isExternalBrandData,
  getColorsFromExternalData,
  getFontsFromExternalData
}: BrandGuidelinesUploadProps) {
  if (!visible) return null;

  return (
    <>
      {/* Brand Guidelines Upload Section */}
      <Card className="mt-8 mb-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            Brand Guidelines
            {brandGuidelines && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                Loaded
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a new brand guidelines PDF or select from previously extracted guidelines to generate wireframes that match your brand identity.
            </p>

            {/* Stored Brand Guidelines Selection */}
            {storedBrandGuidelines.length > 0 && (
              <div className="space-y-2">
                <Label className="block text-sm font-medium">
                  Previously Extracted Guidelines ({storedBrandGuidelines.length} available)
                </Label>
                <div className="flex gap-2">
                  <Select value={selectedStoredGuideline} onValueChange={onStoredGuidelineSelection}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select stored brand guidelines..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None - Upload new PDF</SelectItem>
                      {storedBrandGuidelines.map((guideline) => (
                        <SelectItem key={guideline.id} value={guideline.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{guideline.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(guideline.extractedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStoredGuideline && (
                    <Button
                      onClick={() => onDeleteStoredGuideline(selectedStoredGuideline)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="brand-pdf" className="block text-sm font-medium mb-2">
                  Upload New Brand Guidelines PDF
                </Label>
                <div className="relative">
                  <Input
                    id="brand-pdf"
                    type="file"
                    accept=".pdf"
                    onChange={onBrandGuidelineUpload}
                    disabled={isExtractingBrand}
                    className="file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {isExtractingBrand && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    </div>
                  )}
                </div>
                
                {/* Multimodal Analysis Progress */}
                {isPerformingMultimodalAnalysis && multimodalAnalysisProgress.total > 0 && (
                  <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-700 flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                        Multimodal PDF Analysis
                      </span>
                      <span className="text-xs text-indigo-600">
                        {Math.round((multimodalAnalysisProgress.current / multimodalAnalysisProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${(multimodalAnalysisProgress.current / multimodalAnalysisProgress.total) * 100}%` }}
                      ></div>
                    </div>
                    {multimodalAnalysisProgress.currentStep && (
                      <p className="text-xs text-indigo-600">
                        {multimodalAnalysisProgress.currentStep}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Multimodal Brand Analysis Results */}
                {finalBrandReport && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-700">
                        Multimodal Analysis Complete
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="text-emerald-600">
                          <strong>Pages Analyzed:</strong> {finalBrandReport.documentInfo.totalPages}
                        </div>
                        <div className="text-emerald-600">
                          <strong>Content Chunks:</strong> {finalBrandReport.documentInfo.totalChunks}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-emerald-600">
                          <strong>Confidence:</strong> {Math.round(finalBrandReport.documentInfo.averageConfidence * 100)}%
                        </div>
                        <div className="text-emerald-600">
                          <strong>Processing Time:</strong> {Math.round(finalBrandReport.documentInfo.processingTime / 1000)}s
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-200">
                      <div className="text-xs text-emerald-600 space-y-1">
                        <div><strong>Critical Requirements:</strong> {finalBrandReport.keyFindings.criticalRequirements.length}</div>
                        <div><strong>Brand Themes:</strong> {finalBrandReport.keyFindings.brandThemes.length}</div>
                        <div><strong>Design Principles:</strong> {finalBrandReport.keyFindings.designPrinciples.length}</div>
                        <div><strong>Compliance Notes:</strong> {finalBrandReport.keyFindings.complianceNotes.length}</div>
                      </div>
                    </div>
                  </div>
                )}
                {brandExtractionError && (
                  <p className="text-sm text-red-600 mt-1">{brandExtractionError}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                {brandGuidelines && (
                  <Button
                    onClick={onShowBrandModal}
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Guidelines
                  </Button>
                )}
                
                <Button
                  onClick={onGenerateBrandAwareWireframes}
                  disabled={!brandGuidelines || isGeneratingWireframes}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="sm"
                >
                  {isGeneratingWireframes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate Brand Wireframes
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={onGenerateUnifiedHTML}
                  disabled={!brandGuidelines || isGeneratingUnifiedHTML}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  size="sm"
                >
                  {isGeneratingUnifiedHTML ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Creating Wireframes...
                    </>
                  ) : (
                    <>
                      <Code className="h-4 w-4 mr-1" />
                      Generate Section Wireframes
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {brandGuidelines && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t">
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <div className="text-xs text-gray-500">Colors</div>
                  <div className="text-sm font-medium">
                    {isExternalBrandData(brandGuidelines) 
                      ? getColorsFromExternalData(brandGuidelines).length 
                      : (brandGuidelines.colors?.primary?.length || 0) + (brandGuidelines.colors?.text?.length || 0)
                    }
                  </div>
                </div>
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <div className="text-xs text-gray-500">Typography</div>
                  <div className="text-sm font-medium">
                    {isExternalBrandData(brandGuidelines) 
                      ? getFontsFromExternalData(brandGuidelines).length 
                      : brandGuidelines.typography?.fonts?.length || 0
                    } fonts
                  </div>
                </div>
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <div className="text-xs text-gray-500">Components</div>
                  <div className="text-sm font-medium">{Object.keys(brandGuidelines.components || {}).length} types</div>
                </div>
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <div className="text-xs text-gray-500">Logo Info</div>
                  <div className="text-sm font-medium">{brandGuidelines.logos?.variations?.length || 0} variants</div>
                </div>
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <div className="text-xs text-gray-500">Brand Voice</div>
                  <div className="text-sm font-medium">{brandGuidelines.tone?.personality?.length || 0} traits</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Brand Guidelines Modal */}
      {showBrandModal && brandGuidelines && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-[90vw] max-w-4xl h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Palette className="h-6 w-6 text-purple-600" />
                Brand Guidelines Overview
              </h3>
              <Button
                onClick={onCloseBrandModal}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 overflow-auto h-[calc(90vh-120px)]">
              {/* Multimodal Brand Analysis Summary */}
              {finalBrandReport && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                  <h3 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    Multimodal Brand Analysis Results
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                      <div className="text-2xl font-bold text-emerald-600">{finalBrandReport.documentInfo.totalPages}</div>
                      <div className="text-xs text-gray-600">Pages Analyzed</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                      <div className="text-2xl font-bold text-blue-600">{finalBrandReport.documentInfo.totalChunks}</div>
                      <div className="text-xs text-gray-600">Content Chunks</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                      <div className="text-2xl font-bold text-purple-600">{finalBrandReport.keyFindings.criticalRequirements.length}</div>
                      <div className="text-xs text-gray-600">Critical Requirements</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                      <div className="text-2xl font-bold text-orange-600">{Math.round(finalBrandReport.documentInfo.averageConfidence * 100)}%</div>
                      <div className="text-xs text-gray-600">Confidence</div>
                    </div>
                  </div>
                  
                  {/* Processing Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">Processing Summary:</div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>Processing Time: {Math.round(finalBrandReport.documentInfo.processingTime / 1000)}s</span>
                      <span>Brand Themes: {finalBrandReport.keyFindings.brandThemes.length}</span>
                      <span>Design Principles: {finalBrandReport.keyFindings.designPrinciples.length}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colors Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-blue-500"></div>
                      Color Palette
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Primary Colors</h4>
                      <div className="flex flex-wrap gap-2">
                        {(brandGuidelines.colors?.primary || []).map((color: string, index: number) => (
                          <div key={index} className="flex items-center gap-1">
                            <div 
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-xs font-mono">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Secondary Colors</h4>
                      <div className="flex flex-wrap gap-2">
                        {(brandGuidelines.colors?.secondary || []).map((color: string, index: number) => (
                          <div key={index} className="flex items-center gap-1">
                            <div 
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-xs font-mono">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Typography Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-lg">Aa</span>
                      Typography
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(brandGuidelines.typography?.fonts || []).map((font: any, index: number) => (
                      <div key={index} className="p-2 border rounded">
                        <div className="font-medium text-sm">{font.name || font}</div>
                        {font.weights && (
                          <div className="text-xs text-gray-600">
                            Weights: {font.weights.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
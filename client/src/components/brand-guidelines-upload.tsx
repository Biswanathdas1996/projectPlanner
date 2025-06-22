import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBrandGuidelineExtractor,
  type BrandGuideline,
} from "@/lib/brand-guideline-extractor";
import { BrandGuidelinesStorage } from "@/lib/brand-guidelines-storage";
import {
  createMultimodalPDFExtractor,
  type ComprehensiveBrandReport,
} from "@/lib/multimodal-pdf-extractor";
import { createChunkedBrandAnalyzer } from "@/lib/chunked-brand-analyzer";
import {
  createBrandAwareWireframeGenerator,
  type BrandedWireframeRequest,
} from "@/lib/brand-aware-wireframe-generator";
import {
  createHTMLWireframeGenerator,
  type DetailedPageContent,
} from "@/lib/html-wireframe-generator";
import { useToast } from "@/hooks/use-toast";
import {
  Palette,
  Eye,
  Sparkles,
  Code,
  Loader2,
  Trash2,
  X,
  MessageSquare,
} from "lucide-react";

interface ExternalBrandData {
  brand_name: string;
  color_palette?: { [key: string]: string };
  typography?: {
    primary_font?: string;
    on_screen_font?: string;
    print_font?: string;
    font_weights?: string[];
    line_spacing?: { [key: string]: string };
    alignment?: string;
    case?: string;
    tracking?: { [key: string]: string };
  };
  page_layout?: {
    grid_system?: string;
    spacing?: string;
    margins?: string;
    alignment?: string;
    breakpoints?: string[] | null;
  };
  photography?: {
    style?: string;
    sources?: string;
  };
  illustration?: {
    purpose?: string;
    style?: string;
    usage?: string;
  };
  icons?: {
    style?: string;
    usage?: string;
  };
  other_guidelines?: string[];
}

interface StoredBrandGuideline {
  id: string;
  name: string;
  extractedAt: string;
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
  pageContentCards: any[];
  onBrandGuidelinesExtracted?: (guidelines: BrandGuideline) => void;
  onWireframesGenerated?: (wireframes: any[]) => void;
  onUnifiedHTMLGenerated?: (html: any) => void;
}

export function BrandGuidelinesUpload({
  visible,
  pageContentCards,
  onBrandGuidelinesExtracted,
  onWireframesGenerated,
  onUnifiedHTMLGenerated,
}: BrandGuidelinesUploadProps) {
  const { toast } = useToast();

  // Brand Guidelines state
  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuideline | null>(
    null,
  );
  const [rawBrandData, setRawBrandData] = useState<ExternalBrandData | null>(
    null,
  );
  const [isExtractingBrand, setIsExtractingBrand] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandExtractionError, setBrandExtractionError] = useState<string>("");
  const [storedBrandGuidelines, setStoredBrandGuidelines] = useState<
    StoredBrandGuideline[]
  >([]);
  const [selectedStoredGuideline, setSelectedStoredGuideline] =
    useState<string>("");
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);
  const [isGeneratingUnifiedHTML, setIsGeneratingUnifiedHTML] = useState(false);

  // Multimodal brand analysis state
  const [finalBrandReport, setFinalBrandReport] =
    useState<FinalBrandReport | null>(null);
  const [isPerformingMultimodalAnalysis, setIsPerformingMultimodalAnalysis] =
    useState(false);
  const [multimodalAnalysisProgress, setMultimodalAnalysisProgress] = useState({
    current: 0,
    total: 0,
    currentStep: "",
  });

  // Load stored brand guidelines on component mount
  useEffect(() => {
    const stored = BrandGuidelinesStorage.getAll();
    setStoredBrandGuidelines(stored);

    const latest = BrandGuidelinesStorage.getLatest();
    if (latest && !brandGuidelines) {
      setBrandGuidelines(latest);
      onBrandGuidelinesExtracted?.(latest);
    }
  }, []);

  // Helper functions
  const isExternalBrandData = (data: any): data is ExternalBrandData => {
    return data && typeof data === "object" && "brand_name" in data;
  };

  const getColorsFromExternalData = (data: ExternalBrandData): string[] => {
    if (!data.color_palette) return [];
    return Object.values(data.color_palette);
  };

  const getFontsFromExternalData = (data: ExternalBrandData): string[] => {
    const fonts: string[] = [];
    if (data.typography?.primary_font) fonts.push(data.typography.primary_font);
    if (data.typography?.on_screen_font)
      fonts.push(data.typography.on_screen_font);
    if (data.typography?.print_font) fonts.push(data.typography.print_font);
    return fonts;
  };

  const handleStoredGuidelineSelection = (value: string) => {
    setSelectedStoredGuideline(value);
    if (value !== "none" && value !== "") {
      const guideline = storedBrandGuidelines.find(
        (g: StoredBrandGuideline) => g.id === value,
      );
      if (guideline) {
        const stored = BrandGuidelinesStorage.getById(value);
        if (stored) {
          setBrandGuidelines(stored);
          onBrandGuidelinesExtracted?.(stored);
          toast({
            title: "Brand Guidelines Loaded",
            description: `Loaded guidelines: ${guideline.name}`,
          });
        }
      }
    } else {
      setBrandGuidelines(null);
    }
  };

  const handleDeleteStoredGuideline = (id: string) => {
    BrandGuidelinesStorage.delete(id);
    const updated = BrandGuidelinesStorage.getAll();
    setStoredBrandGuidelines(updated);
    if (selectedStoredGuideline === id) {
      setSelectedStoredGuideline("");
      setBrandGuidelines(null);
    }
    toast({
      title: "Guidelines Deleted",
      description: "Brand guidelines have been removed from storage.",
    });
  };

  const handleBrandGuidelineUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setBrandExtractionError("Please upload a PDF file.");
      return;
    }

    setIsExtractingBrand(true);
    setBrandExtractionError("");
    setIsPerformingMultimodalAnalysis(true);
    setMultimodalAnalysisProgress({
      current: 0,
      total: 0,
      currentStep: "Initializing multimodal analysis...",
    });

    try {
      console.log('🚀 Starting external API PDF extraction for:', file.name);
      setMultimodalAnalysisProgress({ current: 20, total: 100, currentStep: "Uploading PDF to extraction service..." });
      
      // Use FormData to send file to external API
      const formData = new FormData();
      formData.append("file", file, file.name);

      const requestOptions = {
        method: 'POST',
        body: formData,
        redirect: 'follow' as RequestRedirect
      };

      setMultimodalAnalysisProgress({ current: 40, total: 100, currentStep: "Processing PDF with external service..." });

      const response = await fetch("http://127.0.0.1:5001/extract-guidelines", requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('External API error response:', errorText);
        throw new Error(`External API failed with status: ${response.status} - ${errorText}`);
      }

      const result = await response.text();
      console.log('External API response:', result);

      setMultimodalAnalysisProgress({ current: 70, total: 100, currentStep: "Processing extracted guidelines..." });

      // Parse the response - expecting JSON format
      let extractedData;
      try {
        extractedData = JSON.parse(result);
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        throw new Error('Invalid response format from extraction service');
      }

      // Store the raw JSON response
      setBrandGuidelines(extractedData);
      setFinalBrandReport(null); // Clear previous report since we're using external API
      onBrandGuidelinesExtracted?.(extractedData);

      setMultimodalAnalysisProgress({ current: 100, total: 100, currentStep: "Completed!" });

      toast({
        title: "Brand Guidelines Extracted",
        description: `Successfully extracted guidelines from ${file.name}`,
      });
    } catch (error) {
      console.error("Brand guideline extraction failed:", error);
      setBrandExtractionError(
        error instanceof Error
          ? error.message
          : "Failed to extract brand guidelines",
      );
      toast({
        title: "Extraction Failed",
        description: "Failed to extract brand guidelines. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingBrand(false);
      setIsPerformingMultimodalAnalysis(false);
    }
  };

  const generateBrandAwareWireframes = async () => {
    if (!brandGuidelines) return;

    setIsGeneratingWireframes(true);
    try {
      const brandAwareGenerator = createBrandAwareWireframeGenerator();
      const wireframes = [];

      for (const page of pageContentCards) {
        const request: BrandedWireframeRequest = {
          pageContent: page,
          brandGuidelines: brandGuidelines,
          designStyle: "modern",
          deviceType: "desktop",
        };

        const wireframe =
          await brandAwareGenerator.generateBrandedWireframe(request);
        wireframes.push({
          id: `wireframe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          pageName: page.pageName,
          htmlCode: wireframe.html,
          cssCode: wireframe.css,
          jsCode: "",
        });
      }

      onWireframesGenerated?.(wireframes);
      toast({
        title: "Brand Wireframes Generated",
        description: `Generated ${wireframes.length} brand-aware wireframes`,
      });
    } catch (error) {
      console.error("Brand wireframe generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate brand-aware wireframes.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWireframes(false);
    }
  };

  const generateUnifiedHTML = async () => {
    if (!brandGuidelines) return;

    setIsGeneratingUnifiedHTML(true);
    try {
      const htmlGenerator = createHTMLWireframeGenerator();
      const unifiedPages = [];

      for (const page of pageContentCards) {
        const detailedContent: DetailedPageContent = {
          pageName: page.pageName,
          pageType: page.pageType,
          purpose: page.purpose,
          stakeholders: page.stakeholders,
          htmlContent: "",
          cssStyles: "",
          contentDetails: {
            headers: page.headers || [],
            texts: page.additionalContent || [],
            buttons: page.buttons || [],
            forms: page.forms || [],
            lists: page.lists || [],
            images: [],
          },
        };

        const result = await htmlGenerator.generateDetailedWireframes(
          [detailedContent],
          "modern",
          "desktop",
        );
        unifiedPages.push({
          pageName: page.pageName,
          htmlCode: result[0].htmlContent,
          cssCode: result[0].cssStyles,
          jsCode: "",
        });
      }

      onUnifiedHTMLGenerated?.({ pages: unifiedPages });
      toast({
        title: "Section Wireframes Generated",
        description: `Generated ${unifiedPages.length} unified wireframes`,
      });
    } catch (error) {
      console.error("Unified HTML generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate section wireframes.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingUnifiedHTML(false);
    }
  };

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
              Upload a new brand guidelines PDF or select from previously
              extracted guidelines to generate wireframes that match your brand
              identity.
            </p>

            {/* Stored Brand Guidelines Selection */}
            {storedBrandGuidelines.length > 0 && (
              <div className="space-y-2">
                <Label className="block text-sm font-medium">
                  Previously Extracted Guidelines (
                  {storedBrandGuidelines.length} available)
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedStoredGuideline}
                    onValueChange={handleStoredGuidelineSelection}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select stored brand guidelines..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        None - Upload new PDF
                      </SelectItem>
                      {storedBrandGuidelines.map((guideline) => (
                        <SelectItem key={guideline.id} value={guideline.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{guideline.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(
                                guideline.extractedAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStoredGuideline && (
                    <Button
                      onClick={() =>
                        handleDeleteStoredGuideline(selectedStoredGuideline)
                      }
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
                <Label
                  htmlFor="brand-pdf"
                  className="block text-sm font-medium mb-2"
                >
                  Upload New Brand Guidelines PDF
                </Label>
                <div className="relative">
                  <Input
                    id="brand-pdf"
                    type="file"
                    accept=".pdf"
                    onChange={handleBrandGuidelineUpload}
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
                {isPerformingMultimodalAnalysis &&
                  multimodalAnalysisProgress.total > 0 && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-700 flex items-center gap-2">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                          Multimodal PDF Analysis
                        </span>
                        <span className="text-xs text-indigo-600">
                          {Math.round(
                            (multimodalAnalysisProgress.current /
                              multimodalAnalysisProgress.total) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(multimodalAnalysisProgress.current / multimodalAnalysisProgress.total) * 100}%`,
                          }}
                        ></div>
                      </div>
                      {multimodalAnalysisProgress.currentStep && (
                        <p className="text-xs text-indigo-600">
                          {multimodalAnalysisProgress.currentStep}
                        </p>
                      )}
                    </div>
                  )}

                {/* JSON Response Viewer */}
                {brandGuidelines && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-700">
                        Extracted Brand Guidelines JSON
                      </span>
                    </div>
                    <div className="mt-2 bg-white rounded border p-3 max-h-60 overflow-auto">
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(brandGuidelines, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {brandExtractionError && (
                  <p className="text-sm text-red-600 mt-1">
                    {brandExtractionError}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {brandGuidelines && (
                  <Button
                    onClick={() => setShowBrandModal(true)}
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Guidelines
                  </Button>
                )}

                <Button
                  onClick={generateBrandAwareWireframes}
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
                  onClick={generateUnifiedHTML}
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
                      : (brandGuidelines.colors?.primary?.length || 0) +
                        (brandGuidelines.colors?.text?.length || 0)}
                  </div>
                </div>
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <div className="text-xs text-gray-500">Typography</div>
                  <div className="text-sm font-medium">
                    {isExternalBrandData(brandGuidelines)
                      ? getFontsFromExternalData(brandGuidelines).length
                      : brandGuidelines.typography?.fonts?.length || 0}{" "}
                    fonts
                  </div>
                </div>
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <div className="text-xs text-gray-500">Components</div>
                  <div className="text-sm font-medium">
                    {Object.keys(brandGuidelines.components || {}).length} types
                  </div>
                </div>
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <div className="text-xs text-gray-500">Logo Info</div>
                  <div className="text-sm font-medium">
                    {brandGuidelines.logos?.variations?.length || 0} variants
                  </div>
                </div>
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <div className="text-xs text-gray-500">Brand Voice</div>
                  <div className="text-sm font-medium">
                    {brandGuidelines.tone?.personality?.length || 0} traits
                  </div>
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
                onClick={() => setShowBrandModal(false)}
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
                      <div className="text-2xl font-bold text-emerald-600">
                        {finalBrandReport.documentInfo.totalPages}
                      </div>
                      <div className="text-xs text-gray-600">
                        Pages Analyzed
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {finalBrandReport.documentInfo.totalChunks}
                      </div>
                      <div className="text-xs text-gray-600">
                        Content Chunks
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                      <div className="text-2xl font-bold text-purple-600">
                        {
                          finalBrandReport.keyFindings.criticalRequirements
                            .length
                        }
                      </div>
                      <div className="text-xs text-gray-600">
                        Critical Requirements
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(
                          finalBrandReport.documentInfo.averageConfidence * 100,
                        )}
                        %
                      </div>
                      <div className="text-xs text-gray-600">Confidence</div>
                    </div>
                  </div>

                  {/* Processing Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Processing Summary:
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>
                        Processing Time:{" "}
                        {Math.round(
                          finalBrandReport.documentInfo.processingTime / 1000,
                        )}
                        s
                      </span>
                      <span>
                        Brand Themes:{" "}
                        {finalBrandReport.keyFindings.brandThemes.length}
                      </span>
                      <span>
                        Design Principles:{" "}
                        {finalBrandReport.keyFindings.designPrinciples.length}
                      </span>
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
                      <h4 className="font-medium text-sm mb-2">
                        Primary Colors
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(brandGuidelines.colors?.primary || []).map(
                          (color: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-1"
                            >
                              <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: color }}
                              ></div>
                              <span className="text-xs font-mono">{color}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        Secondary Colors
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(brandGuidelines.colors?.secondary || []).map(
                          (color: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-1"
                            >
                              <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: color }}
                              ></div>
                              <span className="text-xs font-mono">{color}</span>
                            </div>
                          ),
                        )}
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
                    {(brandGuidelines.typography?.fonts || []).map(
                      (font: any, index: number) => (
                        <div key={index} className="p-2 border rounded">
                          <div className="font-medium text-sm">
                            {font.name || font}
                          </div>
                          {font.weights && (
                            <div className="text-xs text-gray-600">
                              Weights: {font.weights.join(", ")}
                            </div>
                          )}
                        </div>
                      ),
                    )}
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

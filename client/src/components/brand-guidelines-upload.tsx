import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBrandAwareWireframeGenerator,
  type BrandedWireframeRequest,
} from "@/lib/brand-aware-wireframe-generator";
import {
  createHTMLWireframeGenerator,
  type DetailedPageContent,
} from "@/lib/html-wireframe-generator";
import {
  BrandGuidelinesStorage,
  type ExternalBrandJSON,
} from "@/lib/brand-guidelines-storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  createPDFExtractionClient,
  type PDFExtractionResult,
} from "@/lib/pdf-extraction-client";
import {
  createWebBrandSearchAgent,
  type BrandSearchResult,
  type BrandAsset,
  type SearchProgress,
} from "@/lib/web-brand-search-agent";
import { JsonEditor } from "@/components/json-editor";
import { BrandGuidelinesViewer } from "@/components/brand-guidelines-viewer";
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
  Search,
  Settings,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface MultimodalAnalysisProgress {
  current: number;
  total: number;
  currentStep?: string;
}

interface BrandGuidelinesUploadProps {
  visible: boolean;
  pageContentCards: any[];
  onBrandGuidelinesExtracted?: (guidelines: any) => void;
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
  const [isExtractingBrand, setIsExtractingBrand] = useState(false);
  const [brandExtractionError, setBrandExtractionError] = useState("");
  const [brandGuidelines, setBrandGuidelines] = useState<any>(null);
  const [finalBrandReport, setFinalBrandReport] = useState<any>(null);
  const [isPerformingMultimodalAnalysis, setIsPerformingMultimodalAnalysis] =
    useState(false);
  const [multimodalAnalysisProgress, setMultimodalAnalysisProgress] =
    useState<MultimodalAnalysisProgress>({ current: 0, total: 0 });
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);
  const [isGeneratingUnifiedHTML, setIsGeneratingUnifiedHTML] = useState(false);
  const [wireframeProgress, setWireframeProgress] = useState({
    current: 0,
    total: 0,
    currentPage: "",
  });
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showStoredGuidelines, setShowStoredGuidelines] = useState(false);
  const [storedGuidelines, setStoredGuidelines] = useState(
    BrandGuidelinesStorage.getAll()
  );
  const [brandName, setBrandName] = useState("");
  const [isSearchingBrand, setIsSearchingBrand] = useState(false);
  const [brandSearchError, setBrandSearchError] = useState("");
  const [brandSearchResults, setBrandSearchResults] =
    useState<BrandSearchResult | null>(null);
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(
    null
  );
  const [useSpecializedViewer, setUseSpecializedViewer] = useState(true);
  const { toast } = useToast();

  if (!visible) return null;

  const handleBrandNameSearch = async () => {
    if (!brandName.trim()) return;

    setIsSearchingBrand(true);
    setBrandSearchError("");
    setSearchProgress(null);
    setBrandSearchResults(null);

    try {
      console.log(
        "🔍 Starting comprehensive brand asset search for:",
        brandName
      );

      // Use the new web brand search agent
      const searchAgent = createWebBrandSearchAgent();

      let searchResults = await searchAgent.searchBrandAssets(
        brandName,
        (progress: SearchProgress) => {
          setSearchProgress(progress);
        }
      );

      console.log("=============searchResults======>>>>>>>>>>>", searchResults);
      setBrandSearchResults(searchResults);

      // Create comprehensive brand guidelines from search results
      if (searchResults.startsWith("```json")) {
        searchResults = searchResults
          .replace(/^```json\s*/, "")
          .replace(/```\s*$/, "");
      }
      setBrandGuidelines(searchResults);
      onBrandGuidelinesExtracted?.(searchResults);

      // Save to localStorage using proper storage
      const stored = BrandGuidelinesStorage.save(
        searchResults as any,
        brandName,
        `web-search-${Date.now()}`
      );

      setStoredGuidelines(BrandGuidelinesStorage.getAll());

      console.log(
        "💾 Saved comprehensive brand guidelines for",
        brandName,
        "to local storage"
      );

      toast({
        title: "Brand Assets Found",
        description: `Successfully found  brand assets for ${brandName}`,
      });

      setShowBrandModal(true);
    } catch (error) {
      console.error("Brand search failed:", error);
      setBrandSearchError(
        "Failed to search for brand assets. Please try again."
      );

      toast({
        title: "Search Failed",
        description:
          "Could not find brand assets. Please try a different brand name.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingBrand(false);
      setSearchProgress(null);
    }
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r},${g},${b}`;
    }
    return "0,0,0";
  };

  const handleBrandGuidelineUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
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
      total: 100,
      currentStep: "Initializing PDF extraction...",
    });

    try {
      console.log("🚀 Starting PDF extraction for:", file.name);

      // Use the new PDF extraction client
      const extractionClient = createPDFExtractionClient();

      const extractedData = await extractionClient.extractBrandGuidelines(
        file,
        (step: string, progress: number) => {
          setMultimodalAnalysisProgress({
            current: progress,
            total: 100,
            currentStep: step,
          });
        }
      );

      console.log("✅ PDF extraction completed:", extractedData);

      // Store the extracted data
      setBrandGuidelines(extractedData);
      setFinalBrandReport(null); // Clear previous report

      // Save to local storage
      const stored = BrandGuidelinesStorage.save(
        extractedData as ExternalBrandJSON,
        extractedData.brand_name || "Brand Guidelines",
        file.name
      );

      // Update stored guidelines list
      setStoredGuidelines(BrandGuidelinesStorage.getAll());

      onBrandGuidelinesExtracted?.(extractedData);

      toast({
        title: "Brand Guidelines Extracted",
        description: `Successfully extracted guidelines from ${file.name}`,
      });
    } catch (error) {
      console.error("Brand guideline extraction failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setBrandExtractionError(
        `Failed to extract brand guidelines: ${errorMessage}`
      );

      toast({
        title: "Extraction Failed",
        description: "Could not extract brand guidelines from the PDF file.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingBrand(false);
      setIsPerformingMultimodalAnalysis(false);
      setMultimodalAnalysisProgress({ current: 0, total: 0, currentStep: "" });
    }
  };

  const generateBrandAwareWireframes = async () => {
    if (!brandGuidelines || !pageContentCards || pageContentCards.length === 0)
      return;

    setIsGeneratingWireframes(true);
    setWireframeProgress({
      current: 0,
      total: pageContentCards.length,
      currentPage: "",
    });

    try {
      console.log("🚀 Starting Gemini-based wireframe generation");

      // Initialize Gemini AI
      const apiKey = "AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg";
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
      });

      const wireframes = [];

      for (let i = 0; i < pageContentCards.length; i++) {
        const page = pageContentCards[i];

        // Update progress
        setWireframeProgress({
          current: i,
          total: pageContentCards.length,
          currentPage: page.pageName,
        });

        console.log(`Generating wireframe for: ${page.pageName}`);

        // Combine page content with brand guidelines
        const combinedPrompt = `You are a senior web HTML 5 developer creating a brand-consistent and fully brand complaint  wireframe. Generate a complete HTML page with embedded CSS and JavaScript.

PAGE CONTENT:
${JSON.stringify(
  {
    pageName: page.pageName,
    pageType: page.pageType,
    purpose: page.purpose,
    stakeholders: page.stakeholders,
    headers: page.headers || [],
    buttons: page.buttons || [],
    forms: page.forms || [],
    lists: page.lists || [],
    navigation: page.navigation || [],
    additionalContent: page.additionalContent || [],
  },
  null,
  2
)}

BRAND GUIDELINES:
${JSON.stringify(brandGuidelines, null, 2)}

Brand Logo: 
https://logo.clearbit.com/${brandGuidelines?.brand_url}

REQUIREMENTS:
1. Create a complete HTML document with embedded CSS and JavaScript
2. Use the brand colors, fonts, styling and layouts from the guidelines
3. Implement all page elements (headers, footers, buttons, forms, lists, cards, navigation)
4. Make it responsive and modern with various HTML 5 components like cards, slides, icons
5. Follow the brand's visual identity strictly
6. Use semantic HTML5 elements
7. CRITICAL ACCESSIBILITY: Ensure proper color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text)
8. NEVER use the same color for text and background - always use contrasting brand colors
9. For dark backgrounds, use light text colors; for light backgrounds, use dark text colors
10. Include hover effects and transitions with maintained contrast
11. Make forms functional with validation
12. Use interactive UI elements with proper contrast
13. Ensure proper spacing between elements
14. Test all color combinations for readability before applying
15. If available, use Image of brand Logo, add some images in the body to make it more brand view   


RESPONSE FORMAT:
Return only the complete HTML code with embedded CSS in <style> tags and JavaScript in <script> tags. Do not include any explanations or markdown formatting.`;

        const result = await model.generateContent(combinedPrompt);
        const response = result.response.text();

        console.log(
          `Generated wireframe for ${page.pageName}, length: ${response.length}`
        );

        // Extract HTML, CSS, and JS from response
        const htmlMatch = response.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
        const cssMatch = response.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        const jsMatch = response.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

        const htmlCode = htmlMatch ? htmlMatch[0] : response;
        const cssCode = cssMatch ? cssMatch[1] : "";
        const jsCode = jsMatch ? jsMatch[1] : "";

        wireframes.push({
          id: `wireframe-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          pageName: page.pageName,
          htmlCode: htmlCode,
          cssCode: cssCode,
          jsCode: jsCode,
        });

        // Update progress after completion
        setWireframeProgress({
          current: i + 1,
          total: pageContentCards.length,
          currentPage: page.pageName,
        });
      }

      onWireframesGenerated?.(wireframes);
      toast({
        title: "Brand Wireframes Generated",
        description: `Generated ${wireframes.length} brand-aware wireframes using AI`,
      });
    } catch (error) {
      console.error("Error generating brand wireframes:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate brand-aware wireframes with Gemini",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWireframes(false);
      setWireframeProgress({ current: 0, total: 0, currentPage: "" });
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
          "desktop"
        );
        unifiedPages.push({
          pageName: page.pageName,
          htmlCode: result[0].htmlContent,
          cssCode: result[0].cssStyles,
          jsCode: "",
        });
      }

      onUnifiedHTMLGenerated?.(unifiedPages);
      toast({
        title: "Unified HTML Generated",
        description: `Generated unified HTML for ${unifiedPages.length} pages`,
      });
    } catch (error) {
      console.error("Error generating unified HTML:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate unified HTML",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingUnifiedHTML(false);
    }
  };

  const loadStoredGuideline = (stored: any) => {
    setBrandGuidelines(stored.brandData);
    onBrandGuidelinesExtracted?.(stored.brandData);
    setShowStoredGuidelines(false);

    toast({
      title: "Brand Guidelines Loaded",
      description: `Loaded ${stored.name} from local storage`,
    });
  };

  const deleteStoredGuideline = (id: string) => {
    BrandGuidelinesStorage.delete(id);
    setStoredGuidelines(BrandGuidelinesStorage.getAll());

    toast({
      title: "Brand Guidelines Deleted",
      description: "Guidelines removed from local storage",
    });
  };

  console.log("==============brandGuidelines=========>", brandGuidelines);

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-6 w-6 text-purple-600" />
            Brand Guidelines Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Upload Section */}
            <div className="space-y-3">
              {/* PDF Upload Option */}
              <div className="space-y-2">
                <Label
                  htmlFor="brand-upload"
                  className="text-sm font-medium text-gray-700"
                >
                  Upload Brand Guidelines PDF
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="brand-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleBrandGuidelineUpload}
                    disabled={isExtractingBrand}
                    className="flex-1 text-sm"
                    placeholder="Choose PDF file..."
                  />
                  <Button
                    onClick={() => setShowBrandModal(true)}
                    variant="outline"
                    size="sm"
                    disabled={!brandGuidelines}
                    className="px-3"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setShowStoredGuidelines(true)}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="ml-1 text-xs">
                      ({storedGuidelines.length})
                    </span>
                  </Button>
                </div>
              </div>

              {/* OR Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 bg-white px-2">OR</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Brand Name Search Option */}
              <div className="space-y-2">
                <Label
                  htmlFor="brand-name"
                  className="text-sm font-medium text-gray-700"
                >
                  Search Brand Assets by Name
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="brand-name"
                    type="text"
                    placeholder="Enter brand name (e.g., Nike, Apple, Starbucks)"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    disabled={isSearchingBrand}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleBrandNameSearch}
                    disabled={!brandName.trim() || isSearchingBrand}
                    variant="default"
                    size="sm"
                    className="px-4"
                  >
                    {isSearchingBrand ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-1" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
                {brandSearchError && (
                  <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                    {brandSearchError}
                  </div>
                )}
              </div>
            </div>

            {/* Status Indicators */}
            {isExtractingBrand && (
              <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting guidelines...
              </div>
            )}

            {isSearchingBrand && (
              <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {searchProgress?.step || "Searching for brand assets..."}
                  </div>
                  {searchProgress && (
                    <span className="text-xs text-blue-600">
                      {searchProgress.progress}%
                    </span>
                  )}
                </div>
                {searchProgress && (
                  <>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${searchProgress.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-blue-700">
                      {searchProgress.details}
                    </div>
                  </>
                )}
              </div>
            )}

            {isPerformingMultimodalAnalysis &&
              multimodalAnalysisProgress.total > 0 && (
                <div className="bg-indigo-50 rounded-md p-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      Processing PDF
                    </div>
                    <span className="text-xs text-indigo-600">
                      {Math.round(
                        (multimodalAnalysisProgress.current /
                          multimodalAnalysisProgress.total) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (multimodalAnalysisProgress.current /
                            multimodalAnalysisProgress.total) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

            {brandGuidelines && (
              <div className="bg-emerald-50 rounded-md p-3 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Brand Guidelines Ready
                  </div>
                  <Button
                    onClick={() => setShowBrandModal(true)}
                    variant="ghost"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 p-1"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {brandExtractionError && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                {brandExtractionError}
              </div>
            )}
          </div>

          {/* Wireframe Generation Progress */}
          {isGeneratingWireframes && wireframeProgress.total > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-md p-3 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                  <Sparkles className="h-4 w-4" />
                  Generating Wireframes
                </div>
                <span className="text-xs text-blue-600">
                  {wireframeProgress.current}/{wireframeProgress.total}
                </span>
              </div>
              <Progress
                value={
                  (wireframeProgress.current / wireframeProgress.total) * 100
                }
                className="w-full mb-2 h-2"
              />
              <div className="text-xs text-blue-700">
                {wireframeProgress.current < wireframeProgress.total ? (
                  <span>
                    Processing: <strong>{wireframeProgress.currentPage}</strong>
                  </span>
                ) : (
                  <span className="font-medium">Finalizing...</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
            <Button
              onClick={generateBrandAwareWireframes}
              // disabled={
              //   !brandGuidelines ||
              //   isGeneratingWireframes ||
              //   !pageContentCards ||
              //   pageContentCards.length === 0
              // }
              variant="default"
              size="sm"
              className="flex items-center gap-2"
            >
              {isGeneratingWireframes ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Brand Wireframes
                </>
              )}
            </Button>
            <Button
              onClick={generateUnifiedHTML}
              disabled={!brandGuidelines || isGeneratingUnifiedHTML}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isGeneratingUnifiedHTML ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Code className="h-4 w-4" />
                  Section Wireframes
                </>
              )}
            </Button>
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
              {/* View Toggle */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  Brand Guidelines Data
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseSpecializedViewer(!useSpecializedViewer)}
                  className="flex items-center gap-2"
                >
                  {useSpecializedViewer ? (
                    <>
                      <Code className="h-4 w-4" />
                      Raw JSON
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4" />
                      Structured View
                    </>
                  )}
                </Button>
              </div>

              {/* Conditional Rendering */}
              {useSpecializedViewer ? (
                <BrandGuidelinesViewer
                  data={brandGuidelines}
                  onDataChange={(newData) => {
                    setBrandGuidelines(newData);
                    // Also update the stored guidelines if this came from storage
                    if (newData && typeof newData === 'object' && newData.brand) {
                      BrandGuidelinesStorage.updateExisting(newData);
                    }
                    // Keep legacy localStorage for backward compatibility
                    localStorage.setItem("brand_guidelines", JSON.stringify(newData));
                  }}
                  className="mb-6"
                />
              ) : (
                <JsonEditor
                  data={brandGuidelines}
                  onDataChange={(newData) => {
                    setBrandGuidelines(newData);
                    // Also update the stored guidelines if this came from storage
                    if (newData && typeof newData === 'object' && newData.brand) {
                      BrandGuidelinesStorage.updateExisting(newData);
                    }
                    // Keep legacy localStorage for backward compatibility
                    localStorage.setItem("brand_guidelines", JSON.stringify(newData));
                  }}
                  storageKey="brand_guidelines"
                  title="Brand Guidelines JSON"
                  className="mb-6"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stored Brand Guidelines Modal */}
      {showStoredGuidelines && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-[90vw] max-w-4xl h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-purple-600" />
                Stored Brand Guidelines ({storedGuidelines.length})
              </h3>
              <Button
                onClick={() => setShowStoredGuidelines(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 overflow-auto h-[calc(90vh-120px)]">
              {storedGuidelines.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No stored guidelines
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Upload a PDF to automatically extract and save brand
                    guidelines for future projects
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {storedGuidelines.map((stored) => (
                    <div
                      key={stored.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {stored.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>•</span>
                              <time>
                                {new Date(
                                  stored.extractedAt
                                ).toLocaleDateString()}
                              </time>
                            </div>
                          </div>
                          {stored.pdfFileName && (
                            <p className="text-sm text-gray-500 truncate">
                              {stored.pdfFileName}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => loadStoredGuideline(stored)}
                            variant="default"
                            size="sm"
                            className="px-3"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Load
                          </Button>
                          <Button
                            onClick={() => deleteStoredGuideline(stored.id)}
                            variant="outline"
                            size="sm"
                            className="px-3 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="text-gray-600">Brand:</span>
                          <span className="font-medium text-gray-900">
                            {stored.brandData.brand}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {storedGuidelines.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Storage:</span>{" "}
                      {BrandGuidelinesStorage.getStorageInfo().size} used
                      {BrandGuidelinesStorage.getStorageInfo().lastUpdated && (
                        <span className="ml-2">
                          • Updated{" "}
                          {new Date(
                            BrandGuidelinesStorage.getStorageInfo().lastUpdated!
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        BrandGuidelinesStorage.deleteAll();
                        setStoredGuidelines([]);
                        toast({
                          title: "Storage Cleared",
                          description:
                            "All stored guidelines have been removed",
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

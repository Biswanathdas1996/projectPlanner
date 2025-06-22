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
    BrandGuidelinesStorage.getAll(),
  );
  const { toast } = useToast();

  if (!visible) return null;

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
      console.log("🚀 Starting external API PDF extraction for:", file.name);
      setMultimodalAnalysisProgress({
        current: 20,
        total: 100,
        currentStep: "Uploading PDF to extraction service...",
      });

      // Use FormData to send file to external API
      const formData = new FormData();
      formData.append("file", file, file.name);

      const requestOptions = {
        method: "POST",
        body: formData,
        redirect: "follow" as RequestRedirect,
      };

      setMultimodalAnalysisProgress({
        current: 40,
        total: 100,
        currentStep: "Processing PDF with external service...",
      });

      const response = await fetch(
        "http://127.0.0.1:5001/extract-guidelines",
        requestOptions,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("External API error response:", errorText);
        throw new Error(
          `External API failed with status: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.text();
      console.log("External API response:", result);

      setMultimodalAnalysisProgress({
        current: 70,
        total: 100,
        currentStep: "Processing extracted guidelines...",
      });

      // Parse the response - expecting JSON format
      let extractedData;
      try {
        extractedData = JSON.parse(result);
      } catch (parseError) {
        console.error("Failed to parse API response:", parseError);
        throw new Error("Invalid response format from extraction service");
      }

      // Store the raw JSON response
      setBrandGuidelines(extractedData);
      setFinalBrandReport(null); // Clear previous report since we're using external API

      // Save to local storage
      const stored = BrandGuidelinesStorage.save(
        extractedData as ExternalBrandJSON,
        extractedData.brand || "Brand Guidelines",
        file.name,
      );

      // Update stored guidelines list
      setStoredGuidelines(BrandGuidelinesStorage.getAll());

      onBrandGuidelinesExtracted?.(extractedData);

      setMultimodalAnalysisProgress({
        current: 100,
        total: 100,
        currentStep: "Completed!",
      });

      toast({
        title: "Brand Guidelines Extracted",
        description: `Successfully extracted guidelines from ${file.name}`,
      });
    } catch (error) {
      console.error("Brand guideline extraction failed:", error);

      let errorMessage = "Unknown error occurred";
      let userMessage = "Could not extract brand guidelines from the PDF file.";

      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        errorMessage = "Connection failed - extraction service unavailable";
        userMessage =
          "Cannot connect to the brand extraction service. Please ensure the external API service is running on http://127.0.0.1:5001";
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (
          error.message.includes("NetworkError") ||
          error.message.includes("ECONNREFUSED")
        ) {
          userMessage =
            "Network connection failed. Please verify the extraction service is accessible.";
        }
      }

      setBrandExtractionError(
        `Failed to extract brand guidelines: ${errorMessage}`,
      );
      toast({
        title: "Extraction Service Unavailable",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsExtractingBrand(false);
      setIsPerformingMultimodalAnalysis(false);
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
      const apiKey = "AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM";
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        const combinedPrompt = `You are a senior web developer creating a brand-consistent wireframe. Generate a complete HTML page with embedded CSS and JavaScript.

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
  2,
)}

BRAND GUIDELINES:
${JSON.stringify(brandGuidelines, null, 2)}

REQUIREMENTS:
1. Create a complete HTML document with embedded CSS and JavaScript
2. Use the brand colors, fonts, styling and layouts from the guidelines
3. Implement all page elements (headers, footers, buttons, forms, lists, cards, navigation)
4. Make it responsive and modern
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


RESPONSE FORMAT:
Return only the complete HTML code with embedded CSS in <style> tags and JavaScript in <script> tags. Do not include any explanations or markdown formatting.`;

        const result = await model.generateContent(combinedPrompt);
        const response = result.response.text();

        console.log(
          `Generated wireframe for ${page.pageName}, length: ${response.length}`,
        );

        // Extract HTML, CSS, and JS from response
        const htmlMatch = response.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
        const cssMatch = response.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        const jsMatch = response.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

        const htmlCode = htmlMatch ? htmlMatch[0] : response;
        const cssCode = cssMatch ? cssMatch[1] : "";
        const jsCode = jsMatch ? jsMatch[1] : "";

        wireframes.push({
          id: `wireframe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
          "desktop",
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
            <div className="space-y-2">
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
                  <span className="ml-1 text-xs">({storedGuidelines.length})</span>
                </Button>
              </div>

              {/* Status Indicators */}
              {isExtractingBrand && (
                <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting guidelines...
                </div>
              )}

              {isPerformingMultimodalAnalysis && multimodalAnalysisProgress.total > 0 && (
                <div className="bg-indigo-50 rounded-md p-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      Processing PDF
                    </div>
                    <span className="text-xs text-indigo-600">
                      {Math.round((multimodalAnalysisProgress.current / multimodalAnalysisProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(multimodalAnalysisProgress.current / multimodalAnalysisProgress.total) * 100}%`,
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
                  value={(wireframeProgress.current / wireframeProgress.total) * 100}
                  className="w-full mb-2 h-2"
                />
                <div className="text-xs text-blue-700">
                  {wireframeProgress.current < wireframeProgress.total ? (
                    <span>Processing: <strong>{wireframeProgress.currentPage}</strong></span>
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
                disabled={
                  !brandGuidelines ||
                  isGeneratingWireframes ||
                  !pageContentCards ||
                  pageContentCards.length === 0
                }
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
              {/* Brand Guidelines JSON Display */}
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  Extracted Brand Guidelines JSON
                </h3>
                <div className="bg-white rounded-lg border p-4 max-h-96 overflow-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {JSON.stringify(brandGuidelines, null, 2)}
                  </pre>
                </div>
              </div>
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

            <div className="p-4 overflow-auto h-[calc(90vh-120px)]">
              {storedGuidelines.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No brand guidelines stored yet
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Upload a PDF to save brand guidelines for future use
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {storedGuidelines.map((stored) => (
                    <div
                      key={stored.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {stored.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Extracted:{" "}
                            {new Date(stored.extractedAt).toLocaleDateString()}
                          </p>
                          {stored.pdfFileName && (
                            <p className="text-xs text-gray-500">
                              From: {stored.pdfFileName}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => loadStoredGuideline(stored)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Load
                          </Button>
                          <Button
                            onClick={() => deleteStoredGuideline(stored.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Brand:</span>
                          <p className="text-gray-600">
                            {stored.brandData.brand}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Sections:</span>
                          <p className="text-gray-600">
                            {stored.brandData?.sections?.length || 0}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Colors:</span>
                          <p className="text-gray-600">
                            {BrandGuidelinesStorage.getBrandColors(stored)
                              ?.length || 0}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Fonts:</span>
                          <p className="text-gray-600">
                            {BrandGuidelinesStorage.getBrandFonts(stored)
                              ?.length || 0}
                          </p>
                        </div>
                      </div>

                      {/* Preview Colors */}
                      {(BrandGuidelinesStorage.getBrandColors(stored)?.length ||
                        0) > 0 && (
                        <div className="mt-3">
                          <span className="text-xs font-medium text-gray-700">
                            Colors:
                          </span>
                          <div className="flex gap-2 mt-1">
                            {BrandGuidelinesStorage.getBrandColors(stored)
                              ?.slice(0, 5)
                              ?.map((color, index) => (
                                <div
                                  key={index}
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color.hex }}
                                  title={`${color.name}: ${color.hex}`}
                                />
                              ))}
                            {(BrandGuidelinesStorage.getBrandColors(stored)
                              ?.length || 0) > 5 && (
                              <span className="text-xs text-gray-500 self-center">
                                +
                                {(BrandGuidelinesStorage.getBrandColors(stored)
                                  ?.length || 0) - 5}{" "}
                                more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {storedGuidelines.length > 0 && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <strong>Storage Info:</strong>{" "}
                    {BrandGuidelinesStorage.getStorageInfo().size} used, last
                    updated{" "}
                    {BrandGuidelinesStorage.getStorageInfo().lastUpdated
                      ? new Date(
                          BrandGuidelinesStorage.getStorageInfo().lastUpdated!,
                        ).toLocaleDateString()
                      : "never"}
                  </div>
                  <Button
                    onClick={() => {
                      BrandGuidelinesStorage.deleteAll();
                      setStoredGuidelines([]);
                      toast({
                        title: "All Guidelines Cleared",
                        description: "Local storage has been cleared",
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All Storage
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

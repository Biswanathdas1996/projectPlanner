import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { NavigationBar } from "@/components/navigation-bar";
import { WorkflowProgress } from "@/components/workflow-progress";
import { createWireframeAnalysisAgent, type PageRequirement, type WireframeAnalysisResult, type ContentElement } from "@/lib/wireframe-analysis-agent";
import { createHTMLWireframeGenerator, type DetailedPageContent } from "@/lib/html-wireframe-generator";
import { createAICodeEnhancer, type CodeEnhancementRequest, type EnhancedCodeResponse } from "@/lib/ai-code-enhancer";
import { createPageContentAgent, type PageContentCard } from "@/lib/page-content-agent";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Palette,
  Smartphone,
  Monitor,
  Tablet,
  Layers,
  Grid,
  Type,
  Image,
  Square,
  Circle,
  ArrowRight,
  Download,
  Copy,
  Eye,
  Settings,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Layout,
  MousePointer,
  Zap,
  Paintbrush,
  Frame,
  Component,
  Users,
  ShoppingCart,
  Calendar,
  MessageSquare,
  Home,
  User,
  X,
  Plus,
  Edit3,
  RotateCcw,
  Wand2,
  Target,
  FileText,
  Save,
  RefreshCw,
  Code,
  Play,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";

// Enhanced localStorage utilities
const STORAGE_KEY = "wireframe-designer-data";
const STORAGE_VERSION = "2.0";

interface StorageData {
  version: string;
  timestamp: string;
  currentStep: string;
  analysisResult: WireframeAnalysisResult | null;
  pageContentCards: PageContentCard[];
  detailedWireframes: DetailedPageContent[];
  generatedWireframes: any[];
  selectedDeviceType: string;
  selectedColorScheme: string;
  selectedDesignType: string;
}

const saveToStorage = (data: Partial<StorageData>) => {
  try {
    const existingData = loadFromStorage();
    const newData: StorageData = {
      ...existingData,
      ...data,
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    console.log('[Storage] Data saved successfully:', {
      step: newData.currentStep,
      hasAnalysis: !!newData.analysisResult,
      pageCount: newData.pageContentCards.length,
      wireframeCount: newData.detailedWireframes.length,
      generatedCount: newData.generatedWireframes.length,
    });
  } catch (error) {
    console.error('[Storage] Error saving data:', error);
  }
};

const loadFromStorage = (): StorageData => {
  const defaultData: StorageData = {
    version: STORAGE_VERSION,
    timestamp: new Date().toISOString(),
    currentStep: "input",
    analysisResult: null,
    pageContentCards: [],
    detailedWireframes: [],
    generatedWireframes: [],
    selectedDeviceType: "desktop",
    selectedColorScheme: "modern",
    selectedDesignType: "clean",
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('[Storage] No existing data found, using defaults');
      return defaultData;
    }

    const parsed = JSON.parse(stored);
    
    // Version check and migration
    if (parsed.version !== STORAGE_VERSION) {
      console.log('[Storage] Version mismatch, migrating data...');
      return { ...defaultData, ...parsed, version: STORAGE_VERSION };
    }

    console.log('[Storage] Data loaded successfully:', {
      step: parsed.currentStep,
      hasAnalysis: !!parsed.analysisResult,
      pageCount: parsed.pageContentCards?.length || 0,
      wireframeCount: parsed.detailedWireframes?.length || 0,
      generatedCount: parsed.generatedWireframes?.length || 0,
    });

    return { ...defaultData, ...parsed };
  } catch (error) {
    console.error('[Storage] Error loading data, using defaults:', error);
    return defaultData;
  }
};

export default function WireframeDesigner() {
  // Load initial state from localStorage
  const initialData = loadFromStorage();
  
  // Core state
  const [currentStep, setCurrentStep] = useState<"input" | "analysis" | "content" | "wireframes" | "generating">(initialData.currentStep as any);
  const [analysisResult, setAnalysisResult] = useState<WireframeAnalysisResult | null>(initialData.analysisResult);
  const [pageContentCards, setPageContentCards] = useState<PageContentCard[]>(initialData.pageContentCards);
  const [detailedWireframes, setDetailedWireframes] = useState<DetailedPageContent[]>(initialData.detailedWireframes);
  const [generatedWireframes, setGeneratedWireframes] = useState<any[]>(initialData.generatedWireframes);

  // Input state
  const [stakeholderInput, setStakeholderInput] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [error, setError] = useState("");

  // Generation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, status: "" });
  const [contentGenerationProgress, setContentGenerationProgress] = useState({ current: 0, total: 0, currentPage: "" });
  const [wireframeGenerationProgress, setWireframeGenerationProgress] = useState({ current: 0, total: 0, currentPage: "" });

  // Design state
  const [selectedDeviceType, setSelectedDeviceType] = useState(initialData.selectedDeviceType);
  const [selectedColorScheme, setSelectedColorScheme] = useState(initialData.selectedColorScheme);
  const [selectedDesignType, setSelectedDesignType] = useState(initialData.selectedDesignType);

  // Modal state
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPageCode, setSelectedPageCode] = useState<any>(null);

  // Enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementPrompt, setEnhancementPrompt] = useState("");
  const [enhancedCode, setEnhancedCode] = useState<EnhancedCodeResponse | null>(null);

  // Selection state for targeted enhancement
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedElementPrompt, setSelectedElementPrompt] = useState("");

  // Page layout state
  const [pageLayouts, setPageLayouts] = useState<{[key: string]: string}>({});

  const { toast } = useToast();

  // Auto-save to localStorage
  useEffect(() => {
    saveToStorage({
      currentStep,
      analysisResult,
      pageContentCards,
      detailedWireframes,
      generatedWireframes,
      selectedDeviceType,
      selectedColorScheme,
      selectedDesignType,
    });
  }, [currentStep, analysisResult, pageContentCards, detailedWireframes, generatedWireframes, selectedDeviceType, selectedColorScheme, selectedDesignType]);

  // Initialize agents
  const wireframeAgent = createWireframeAnalysisAgent();
  const htmlGenerator = createHTMLWireframeGenerator();
  const codeEnhancer = createAICodeEnhancer();
  const pageContentAgent = createPageContentAgent();

  const analyzeStakeholderFlows = async () => {
    if (!stakeholderInput.trim() && !projectDescription.trim()) {
      setError("Please provide stakeholder flow data or project description");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      // Save input data to localStorage for the agent to access
      if (stakeholderInput.trim()) {
        localStorage.setItem("bpmn-stakeholder-flow-data", stakeholderInput);
      }
      if (projectDescription.trim()) {
        localStorage.setItem("bpmn-project-description", projectDescription);
      }
      if (targetUsers.trim()) {
        localStorage.setItem("bpmn-target-users", targetUsers);
      }

      const result = await wireframeAgent.analyzeStakeholderFlows();

      setAnalysisResult(result);
      setCurrentStep("content");
      
      toast({
        title: "Analysis Complete",
        description: `Identified ${result.pageRequirements.length} pages and ${result.stakeholders.length} stakeholders`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setError("Failed to analyze stakeholder flows. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePageContent = async () => {
    if (!analysisResult) return;

    setIsGeneratingContent(true);
    setContentGenerationProgress({ current: 0, total: analysisResult.pageRequirements.length, currentPage: "" });

    try {
      const request = {
        analysisResult,
        stakeholderFlows: [],
        flowTypes: {},
        projectDescription: projectDescription || ""
      };

      setContentGenerationProgress({ 
        current: 1, 
        total: 1, 
        currentPage: "Generating all pages..." 
      });

      const generatedCards = await pageContentAgent.generatePageContent(request);
      setPageContentCards(generatedCards);
      setCurrentStep("wireframes");
      
      toast({
        title: "Content Generated",
        description: `Created detailed content for ${generatedCards.length} pages`,
      });
    } catch (error) {
      console.error('Content generation error:', error);
      setError("Failed to generate page content. Please try again.");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleGenerateWireframes = async () => {
    if (pageContentCards.length === 0) return;

    setIsGeneratingWireframes(true);
    setWireframeGenerationProgress({ current: 1, total: 1, currentPage: "Generating wireframes..." });

    try {
      // Use the correct method signature for HTML wireframe generator
      const wireframes = await htmlGenerator.generateDetailedWireframes(
        {},
        {},
        projectDescription || "Generated wireframes"
      );

      setDetailedWireframes(wireframes);
      setGeneratedWireframes(wireframes.map(w => ({
        pageName: w.pageName,
        htmlCode: w.htmlContent,
        cssCode: w.cssStyles,
        jsCode: ""
      })));
      
      toast({
        title: "Wireframes Generated",
        description: `Created ${wireframes.length} detailed wireframes`,
      });
    } catch (error) {
      console.error('Wireframe generation error:', error);
      setError("Failed to generate wireframes. Please try again.");
    } finally {
      setIsGeneratingWireframes(false);
    }
  };

  const handleEnhanceCode = async () => {
    if (!selectedPageCode || !enhancementPrompt.trim()) return;

    setIsEnhancing(true);

    try {
      const request: CodeEnhancementRequest = {
        htmlCode: selectedPageCode.htmlCode,
        cssCode: selectedPageCode.cssCode,
        prompt: enhancementPrompt,
        pageName: selectedPageCode.pageName,
      };

      const enhanced = await codeEnhancer.enhanceCode(request);
      setEnhancedCode(enhanced);

      toast({
        title: "Code Enhanced",
        description: "Your wireframe has been enhanced with AI improvements",
      });
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance the code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleEnhanceSelectedElement = async () => {
    if (!selectedPageCode || !selectedElementPrompt.trim() || !selectedElement) return;

    setIsEnhancing(true);

    try {
      const enhancementPrompt = `Focus on enhancing the ${selectedElement} element: ${selectedElementPrompt}`;
      
      const request: CodeEnhancementRequest = {
        htmlCode: selectedPageCode.htmlCode,
        cssCode: selectedPageCode.cssCode,
        prompt: enhancementPrompt,
        pageName: selectedPageCode.pageName,
      };

      const enhanced = await codeEnhancer.enhanceCode(request);
      setEnhancedCode(enhanced);

      toast({
        title: "Element Enhanced",
        description: `${selectedElement} has been enhanced with your specifications`,
      });
    } catch (error) {
      console.error('Element enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance the selected element. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleElementSelection = (element: HTMLElement) => {
    const elementType = element.tagName.toLowerCase();
    const elementClass = element.className;
    const elementId = element.id;
    
    let elementDescription = elementType;
    if (elementClass) elementDescription += ` with class "${elementClass}"`;
    if (elementId) elementDescription += ` with id "${elementId}"`;
    
    setSelectedElement(elementDescription);
    setSelectionMode(false);
    
    toast({
      title: "Element Selected",
      description: `Selected: ${elementDescription}`,
    });
  };

  const startOver = () => {
    setCurrentStep("input");
    setAnalysisResult(null);
    setPageContentCards([]);
    setDetailedWireframes([]);
    setGeneratedWireframes([]);
    setStakeholderInput("");
    setProjectDescription("");
    setTargetUsers("");
    setError("");
    
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    toast({
      title: "Reset Complete",
      description: "All data has been cleared. Starting fresh.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar title="Wireframe Designer" showBackButton={true} showStartOverButton={true} />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <WorkflowProgress 
          currentStep={currentStep === "analysis" ? "research" : currentStep === "content" ? "plan" : currentStep === "wireframes" ? "diagram" : "input"}
          completedSteps={[
            ...(analysisResult ? ["research"] : []),
            ...(pageContentCards.length > 0 ? ["plan"] : []),
            ...(detailedWireframes.length > 0 ? ["diagram"] : []),
            ...(generatedWireframes.length > 0 ? ["stories"] : [])
          ]}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* AI Analysis Section */}
        {currentStep === "input" && (
          <Accordion type="single" collapsible className="mb-6" defaultValue="stakeholder-analysis">
            <AccordionItem value="stakeholder-analysis" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2 text-left">
                  <Sparkles className="h-5 w-5" />
                  <div>
                    <h3 className="text-lg font-semibold">AI-Powered Stakeholder Flow Analysis</h3>
                    <p className="text-sm text-gray-600">
                      Analyze your stakeholder flows to automatically generate contextual wireframes
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => {/* analyzeStakeholderFlows logic */}}
                      disabled={isAnalyzing}
                      className="flex-1"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analyze Flows
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-description">Project Description</Label>
                      <Textarea
                        id="project-description"
                        placeholder="Describe your project, its goals, and main features..."
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target-users">Target Users</Label>
                      <Textarea
                        id="target-users"
                        placeholder="Who are your main users? What are their needs and behaviors?"
                        value={targetUsers}
                        onChange={(e) => setTargetUsers(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stakeholder-input">Stakeholder Flow Data</Label>
                    <Textarea
                      id="stakeholder-input"
                      placeholder="Paste your stakeholder flow data, user journeys, or business requirements here..."
                      value={stakeholderInput}
                      onChange={(e) => setStakeholderInput(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Analysis Results and Content Generation */}
        {currentStep === "content" && analysisResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Stakeholder Analysis Results
              </CardTitle>
              <p className="text-sm text-gray-600">
                Review and customize the generated page requirements
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Identified Stakeholders ({analysisResult.stakeholders.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.stakeholders.map((stakeholder, idx) => (
                      <Badge key={idx} variant="secondary">
                        {stakeholder}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Page Requirements ({analysisResult.pageRequirements.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {analysisResult.pageRequirements.map((page, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="font-medium">{page.pageName}</div>
                        <div className="text-sm text-gray-600">{page.purpose}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Priority: {page.priority} | Stakeholders: {page.stakeholders.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleGeneratePageContent}
                  disabled={isGeneratingContent}
                  className="flex-1"
                >
                  {isGeneratingContent ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Page Content
                    </>
                  )}
                </Button>
              </div>

              {isGeneratingContent && contentGenerationProgress.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {contentGenerationProgress.current} / {contentGenerationProgress.total}</span>
                    <span>{Math.round((contentGenerationProgress.current / contentGenerationProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(contentGenerationProgress.current / contentGenerationProgress.total) * 100}%` }}
                    />
                  </div>
                  {contentGenerationProgress.currentPage && (
                    <p className="text-sm text-gray-600">
                      Currently generating: {contentGenerationProgress.currentPage}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Page Content Cards */}
        {currentStep === "wireframes" && pageContentCards.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Page Content
              </CardTitle>
              <p className="text-sm text-gray-600">
                Review and edit the detailed page content before generating wireframes
              </p>
            </CardHeader>
            <CardContent>
              {isGeneratingWireframes && wireframeGenerationProgress.total > 0 && (
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating wireframes: {wireframeGenerationProgress.current} / {wireframeGenerationProgress.total}</span>
                    <span>{Math.round((wireframeGenerationProgress.current / wireframeGenerationProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(wireframeGenerationProgress.current / wireframeGenerationProgress.total) * 100}%` }}
                    />
                  </div>
                  {wireframeGenerationProgress.currentPage && (
                    <p className="text-sm text-gray-600">
                      Currently generating: {wireframeGenerationProgress.currentPage}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-6">
                {pageContentCards.map((card, index) => (
                  <div key={card.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{card.pageName}</h3>
                      <Badge variant="outline">{card.pageType}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Purpose & Stakeholders
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{card.purpose}</p>
                        <div className="flex flex-wrap gap-1">
                          {card.stakeholders.map((stakeholder, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {stakeholder}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          Headers & Navigation
                        </h4>
                        <div className="space-y-1">
                          {card.headers.map((header, idx) => (
                            <div key={idx} className="text-sm px-2 py-1 bg-gray-100 rounded">
                              {header}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Square className="h-4 w-4" />
                          Buttons ({card.buttons.length})
                        </h4>
                        <div className="space-y-2">
                          {card.buttons.map((button, idx) => (
                            <div key={idx} className="text-sm p-2 border rounded">
                              <div className="font-medium">{button.label}</div>
                              <div className="text-xs text-gray-500">{button.action}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Grid className="h-4 w-4" />
                          Forms ({card.forms.length})
                        </h4>
                        <div className="space-y-2">
                          {card.forms.map((form, idx) => (
                            <div key={idx} className="text-sm p-2 border rounded">
                              <div className="font-medium">{form.title}</div>
                              <div className="text-xs text-gray-500">{form.fields.join(", ")}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          Lists ({card.lists.length})
                        </h4>
                        <div className="space-y-2">
                          {card.lists.map((list, idx) => (
                            <div key={idx} className="text-sm p-2 border rounded">
                              <div className="font-medium">{list.title}</div>
                              <div className="text-xs text-gray-500">{list.type}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="device-type">Device Type</Label>
                    <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color-scheme">Color Scheme</Label>
                    <Select value={selectedColorScheme} onValueChange={setSelectedColorScheme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="design-type">Design Style</Label>
                    <Select value={selectedDesignType} onValueChange={setSelectedDesignType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clean">Clean</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateWireframes}
                  disabled={isGeneratingWireframes || pageContentCards.length === 0}
                  className="w-full"
                >
                  {isGeneratingWireframes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Wireframes...
                    </>
                  ) : (
                    <>
                      <Layout className="h-4 w-4 mr-2" />
                      Generate Wireframes ({pageContentCards.length} pages)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Wireframes Display */}
        {generatedWireframes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Generated Wireframes
              </CardTitle>
              <p className="text-sm text-gray-600">
                Interactive wireframes with enhancement capabilities
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {generatedWireframes.map((wireframe, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{wireframe.pageName}</h3>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPageCode(wireframe);
                              setShowCodeModal(true);
                            }}
                          >
                            <Code className="h-4 w-4 mr-1" />
                            Code
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPageCode(wireframe);
                              setShowPreviewModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div 
                        className="border rounded bg-white overflow-hidden"
                        style={{ height: "300px", transform: "scale(0.5)", transformOrigin: "top left", width: "200%" }}
                      >
                        <iframe
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <style>${wireframe.cssCode}</style>
                              </head>
                              <body>
                                ${wireframe.htmlCode}
                                <script>${wireframe.jsCode || ''}</script>
                              </body>
                            </html>
                          `}
                          width="100%"
                          height="600px"
                          style={{ border: "none", pointerEvents: "none" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Code Enhancement Modal */}
        {showCodeModal && selectedPageCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold">{selectedPageCode.pageName}</h2>
                  <p className="text-sm text-gray-600">Code editor with AI enhancement</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCodeModal(false);
                    setSelectedPageCode(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <Tabs defaultValue="preview" className="w-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="css">CSS</TabsTrigger>
                    <TabsTrigger value="enhance">Enhance</TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-hidden p-6">
                    <TabsContent value="preview" className="h-full">
                      <div 
                        className="w-full h-full border rounded-lg overflow-hidden bg-white"
                        style={{
                          ...(selectionMode && selectedPageCode ? {
                            cursor: 'crosshair'
                          } : {})
                        }}
                        onClick={(e) => {
                          if (selectionMode && selectedPageCode) {
                            handleElementSelection(e.target as HTMLElement);
                          }
                        }}
                      >
                        <iframe
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <style>${selectedPageCode.cssCode}</style>
                                <style>
                                  ${selectionMode ? `
                                    * { 
                                      cursor: crosshair !important; 
                                      transition: all 0.2s ease;
                                    }
                                    *:hover { 
                                      outline: 2px solid #3b82f6 !important; 
                                      background-color: rgba(59, 130, 246, 0.1) !important;
                                    }
                                  ` : ''}
                                </style>
                              </head>
                              <body>
                                ${selectedPageCode.htmlCode}
                                <script>${selectedPageCode.jsCode || ''}</script>
                              </body>
                            </html>
                          `}
                          width="100%"
                          height="100%"
                          style={{ border: "none" }}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="html" className="h-full">
                      <Textarea
                        value={selectedPageCode.htmlCode}
                        readOnly
                        className="w-full h-full font-mono text-sm resize-none"
                      />
                    </TabsContent>

                    <TabsContent value="css" className="h-full">
                      <Textarea
                        value={selectedPageCode.cssCode}
                        readOnly
                        className="w-full h-full font-mono text-sm resize-none"
                      />
                    </TabsContent>

                    <TabsContent value="enhance" className="h-full space-y-4">
                      <div className="space-y-4">
                        {!selectionMode && !selectedElement && (
                          <div className="space-y-3">
                            <h3 className="font-medium">Enhancement Options</h3>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEnhancementPrompt("Add modern styling with better colors and typography")}
                              >
                                <Paintbrush className="h-4 w-4 mr-1" />
                                Modern Styling
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEnhancementPrompt("Add hover effects and smooth animations")}
                              >
                                <Zap className="h-4 w-4 mr-1" />
                                Hover Effects
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEnhancementPrompt("Improve responsiveness for mobile devices")}
                              >
                                <Smartphone className="h-4 w-4 mr-1" />
                                Mobile Responsive
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectionMode(!selectionMode);
                                  setSelectedElement(null);
                                  setSelectedElementPrompt("");
                                }}
                              >
                                {selectionMode ? (
                                  <>
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel Selection
                                  </>
                                ) : (
                                  <>
                                    <MousePointer className="h-4 w-4 mr-1" />
                                    Select Element
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {selectionMode && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Selection Mode Active</h4>
                            <p className="text-sm text-blue-700 mb-2">
                              Click on any element in the preview to select it for targeted enhancement.
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectionMode(false);
                                setSelectedElement(null);
                                setSelectedElementPrompt("");
                              }}
                            >
                              Cancel Selection
                            </Button>
                          </div>
                        )}

                        {selectedElement && (
                          <div className="space-y-3">
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <h4 className="font-medium text-green-900">Selected Element</h4>
                              <p className="text-sm text-green-700">{selectedElement}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="element-prompt">Enhancement for Selected Element</Label>
                              <Textarea
                                id="element-prompt"
                                placeholder="Describe how you want to enhance this specific element..."
                                value={selectedElementPrompt}
                                onChange={(e) => setSelectedElementPrompt(e.target.value)}
                                className="min-h-[100px]"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={handleEnhanceSelectedElement}
                                disabled={isEnhancing || !selectedElementPrompt.trim()}
                                className="flex-1"
                              >
                                {isEnhancing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enhancing...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Enhance Element
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedElement(null);
                                  setSelectedElementPrompt("");
                                }}
                              >
                                Clear Selection
                              </Button>
                            </div>
                          </div>
                        )}

                        {!selectedElement && !selectionMode && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="enhancement-prompt">AI Enhancement Prompt</Label>
                              <Textarea
                                id="enhancement-prompt"
                                placeholder="Describe how you want to enhance this wireframe..."
                                value={enhancementPrompt}
                                onChange={(e) => setEnhancementPrompt(e.target.value)}
                                className="min-h-[150px]"
                              />
                            </div>

                            <Button
                              onClick={handleEnhanceCode}
                              disabled={isEnhancing || !enhancementPrompt.trim()}
                              className="w-full"
                            >
                              {isEnhancing ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Enhancing...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="h-4 w-4 mr-2" />
                                  Enhance Wireframe
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {enhancedCode && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Enhanced Result</h4>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">{enhancedCode.explanation}</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy Code
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedPageCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold">{selectedPageCode.pageName}</h2>
                  <p className="text-sm text-gray-600">Full-size preview</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setSelectedPageCode(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden p-6">
                <div className="w-full h-full border rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <style>${selectedPageCode.cssCode}</style>
                        </head>
                        <body>
                          ${selectedPageCode.htmlCode}
                          <script>${selectedPageCode.jsCode || ''}</script>
                        </body>
                      </html>
                    `}
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
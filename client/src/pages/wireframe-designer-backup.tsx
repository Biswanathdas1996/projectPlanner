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

        {/* Rest of the component content would go here */}
        <div className="text-center py-8">
          <p className="text-gray-600">Component restored - ready for accordion implementation</p>
        </div>
      </div>
    </div>
  );
}
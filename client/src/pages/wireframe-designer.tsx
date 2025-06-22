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
import { createPreciseElementEnhancer, type PreciseElementRequest } from "@/lib/precise-element-enhancer";
import { createPageContentAgent, type PageContentCard } from "@/lib/page-content-agent";
import { createBrandGuidelineExtractor, type BrandGuideline } from "@/lib/brand-guideline-extractor";
import { createBrandAwareWireframeGenerator, type BrandedWireframeRequest } from "@/lib/brand-aware-wireframe-generator";
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
  Layout,
  MessageSquare,
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
  MousePointer,
  Zap,
  Paintbrush,
  Frame,
  Component,
  Globe,
  Code,
  Users,
  ShoppingCart,
  Calendar,
  Home,
  User,
  Search,
  Bell,
  Menu,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  Save,
  Upload,
  FileText,
  Star,
  Heart,
  Share2,
  Play,
  Pause,
  Volume2,
  Camera,
  Video,
  Map,
  Clock,
  Filter,
  SortAsc,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Target,
  Lightbulb,
  Briefcase,
  Shield,
  Activity,
  RefreshCw
} from "lucide-react";

interface WireframeData {
  id: string;
  name: string;
  description: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenType: string;
  components: WireframeComponent[];
  colorScheme: string;
  style: string;
  timestamp: string;
}

interface WireframeComponent {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: Record<string, string>;
  content?: string;
}

interface DesignPrompt {
  projectType: string;
  targetAudience: string;
  primaryFeatures: string[];
  colorPreference: string;
  designStyle: string;
  deviceType: string;
  screenTypes: string[];
}

// Comprehensive utility function to safely render any content and prevent React object rendering errors
const safeRenderContent = (content: any): string => {
  if (typeof content === 'string') {
    return content;
  } else if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content);
  } else if (content === null || content === undefined) {
    return '';
  } else if (typeof content === 'object') {
    // Handle various object structures that might be present
    if (content.label && content.url) {
      return `${content.label} (${content.url})`;
    } else if (content.label && content.href) {
      return `${content.label} (${content.href})`;
    } else if (content.text && content.link) {
      return `${content.text} (${content.link})`;
    } else if (content.name && content.url) {
      return `${content.name} (${content.url})`;
    } else if (content.title && content.link) {
      return `${content.title} (${content.link})`;
    } else if (content.text) {
      return String(content.text);
    } else if (content.label) {
      return String(content.label);
    } else if (content.name) {
      return String(content.name);
    } else if (content.title) {
      return String(content.title);
    } else if (content.value) {
      return String(content.value);
    } else if (content.content) {
      return String(content.content);
    } else if (Array.isArray(content)) {
      return content.map(item => safeRenderContent(item)).join(', ');
    } else {
      // Fallback: convert object to readable string
      try {
        return Object.entries(content).map(([key, value]) => `${key}: ${safeRenderContent(value)}`).join(', ');
      } catch {
        return JSON.stringify(content);
      }
    }
  } else {
    return String(content);
  }
};

export default function WireframeDesigner() {
  const [wireframes, setWireframes] = useState<WireframeData[]>([]);
  const [selectedWireframe, setSelectedWireframe] = useState<WireframeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<"input" | "generating" | "results">("input");
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [designPrompt, setDesignPrompt] = useState<DesignPrompt>({
    projectType: "",
    targetAudience: "",
    primaryFeatures: [],
    colorPreference: "",
    designStyle: "",
    deviceType: "desktop",
    screenTypes: []
  });
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, status: "" });
  const [analysisResult, setAnalysisResult] = useState<WireframeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detailedWireframes, setDetailedWireframes] = useState<DetailedPageContent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedPageCode, setSelectedPageCode] = useState<{
    pageName: string;
    htmlCode: string;
    cssCode: string;
    jsCode?: string;
    isEnhanced?: boolean;
    lastUpdated?: string;
    lastEnhancedElement?: string;
    enhancementExplanation?: string;
  } | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [pageContentCards, setPageContentCards] = useState<PageContentCard[]>([]);
  const [pageLayouts, setPageLayouts] = useState<Record<string, string>>({});
  const [contentGenerationProgress, setContentGenerationProgress] = useState({ current: 0, total: 0, currentPage: "" });
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);

  const [generatedWireframes, setGeneratedWireframes] = useState<{ 
    id: string;
    pageName: string; 
    htmlCode: string; 
    cssCode: string; 
    jsCode: string;
    isEnhanced?: boolean;
    lastUpdated?: string;
    lastEnhancedElement?: string;
    enhancementExplanation?: string;
    lastEditorSync?: string;
  }[]>([]);
  const [wireframeGenerationProgress, setWireframeGenerationProgress] = useState({ current: 0, total: 0, currentPage: "" });
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedCode, setEnhancedCode] = useState<{ html: string; css: string; js: string; explanation: string; improvements: string[] } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedElementPrompt, setSelectedElementPrompt] = useState('');
  
  // Wireframe customization options
  const [selectedDeviceType, setSelectedDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>('modern-blue');
  const [selectedDesignType, setSelectedDesignType] = useState<string>('modern');
  const [selectedLayout, setSelectedLayout] = useState<string>('standard-header');

  // Brand Guidelines state
  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuideline | null>(null);
  const [isExtractingBrand, setIsExtractingBrand] = useState(false);
  const [brandExtractionError, setBrandExtractionError] = useState<string>('');

  // Load stored data on component mount
  useEffect(() => {
    const stored = localStorage.getItem('generated_wireframes');
    if (stored) {
      try {
        const parsedWireframes = JSON.parse(stored);
        setGeneratedWireframes(parsedWireframes);
      } catch (error) {
        console.error('Error parsing stored wireframes:', error);
      }
    }
  }, []);

  const analyzeRequirements = async () => {
    if (!designPrompt.projectType.trim()) {
      setError("Please provide a project type to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setCurrentStep("generating");

    try {
      const analysisAgent = createWireframeAnalysisAgent();
      const result = await analysisAgent.analyze({
        projectType: designPrompt.projectType,
        targetAudience: designPrompt.targetAudience,
        primaryFeatures: designPrompt.primaryFeatures,
        designStyle: designPrompt.designStyle,
        deviceType: designPrompt.deviceType,
        screenTypes: designPrompt.screenTypes
      });

      setAnalysisResult(result);
      setCurrentStep("results");
      
      toast({
        title: "Analysis Complete",
        description: `Found ${result.pageRequirements?.length || 0} recommended pages for your project.`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setError("Failed to analyze requirements. Please try again.");
      setCurrentStep("input");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateDetailedContent = async () => {
    if (!analysisResult?.pageRequirements) return;

    setIsGeneratingContent(true);
    setContentGenerationProgress({ current: 0, total: analysisResult.pageRequirements.length, currentPage: "" });

    try {
      const contentAgent = createPageContentAgent();
      const results: DetailedPageContent[] = [];

      for (let i = 0; i < analysisResult.pageRequirements.length; i++) {
        const page = analysisResult.pageRequirements[i];
        setContentGenerationProgress({ 
          current: i + 1, 
          total: analysisResult.pageRequirements.length, 
          currentPage: page.pageName || `Page ${i + 1}` 
        });

        const content = await contentAgent.generatePageContent({
          pageName: page.pageName,
          pageType: page.pageType,
          purpose: page.purpose,
          projectContext: {
            projectType: designPrompt.projectType,
            targetAudience: designPrompt.targetAudience,
            primaryFeatures: designPrompt.primaryFeatures
          }
        });

        results.push(content);
      }

      setDetailedWireframes(results);
      toast({
        title: "Content Generated",
        description: `Created detailed content for ${results.length} pages.`,
      });
    } catch (error) {
      console.error('Content generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate detailed content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const generateWireframes = async () => {
    if (detailedWireframes.length === 0) return;

    setIsGeneratingWireframes(true);
    setWireframeGenerationProgress({ current: 0, total: detailedWireframes.length, currentPage: "" });

    try {
      const generator = brandGuidelines 
        ? createBrandAwareWireframeGenerator() 
        : createHTMLWireframeGenerator();
      
      const results: typeof generatedWireframes = [];

      for (let i = 0; i < detailedWireframes.length; i++) {
        const page = detailedWireframes[i];
        setWireframeGenerationProgress({ 
          current: i + 1, 
          total: detailedWireframes.length, 
          currentPage: page.pageName 
        });

        let wireframeData;
        
        if (brandGuidelines) {
          const brandAwareRequest: BrandedWireframeRequest = {
            pageContent: {
              id: `page-${i}`,
              pageName: page.pageName,
              pageType: page.pageType || 'standard',
              purpose: page.purpose,
              stakeholders: [],
              headers: [],
              buttons: [],
              forms: [],
              lists: [],
              navigation: [],
              additionalContent: [],
              isEdited: false
            },
            brandGuidelines,
            designStyle: selectedDesignType,
            deviceType: selectedDeviceType
          };
          wireframeData = await (generator as any).generateBrandedWireframe(brandAwareRequest);
        } else {
          wireframeData = await (generator as any).generateWireframe({
            pageContent: page,
            designStyle: selectedDesignType,
            deviceType: selectedDeviceType
          });
        }

        const wireframe = {
          id: `wireframe-${Date.now()}-${i}`,
          pageName: page.pageName,
          htmlCode: wireframeData.html,
          cssCode: wireframeData.css,
          jsCode: wireframeData.js || '',
          lastUpdated: new Date().toISOString()
        };

        results.push(wireframe);
      }

      setGeneratedWireframes(results);
      localStorage.setItem('generated_wireframes', JSON.stringify(results));
      
      toast({
        title: "Wireframes Generated",
        description: `Created ${results.length} wireframes successfully.`,
      });
    } catch (error) {
      console.error('Wireframe generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate wireframes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingWireframes(false);
    }
  };

  const handleBrandFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setBrandExtractionError('Please upload a PDF file.');
      return;
    }

    setIsExtractingBrand(true);
    setBrandExtractionError('');

    try {
      const extractor = createBrandGuidelineExtractor();
      const guidelines = await extractor.extractFromPDF(file);
      setBrandGuidelines(guidelines);
      
      toast({
        title: "Brand Guidelines Extracted",
        description: "Successfully extracted brand guidelines from PDF",
      });
    } catch (error) {
      console.error('Brand extraction error:', error);
      setBrandExtractionError('Failed to extract brand guidelines. Please try again.');
    } finally {
      setIsExtractingBrand(false);
    }
  };

  const clearAllWireframes = () => {
    setGeneratedWireframes([]);
    localStorage.removeItem('generated_wireframes');
  };

  const commonFeatures = [
    "User Authentication", "Search Functionality", "Notifications", "User Profile",
    "Settings/Preferences", "Data Visualization", "File Upload", "Social Sharing",
    "Comments/Reviews", "Favorites/Bookmarks", "Chat/Messaging", "Payment Integration",
    "Multi-language Support", "Dark Mode", "Offline Support", "Push Notifications"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NavigationBar title="Wireframe Designer" showBackButton={true} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <WorkflowProgress currentStep="wireframes" />

        {currentStep === "input" && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                Project Requirements
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Describe your project to generate tailored wireframes and content
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="projectType" className="text-sm font-medium text-gray-700">
                    Project Type
                  </Label>
                  <Input
                    id="projectType"
                    placeholder="e.g., E-commerce Platform, Social Media App"
                    value={designPrompt.projectType}
                    onChange={(e) => setDesignPrompt({ ...designPrompt, projectType: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience" className="text-sm font-medium text-gray-700">
                    Target Audience
                  </Label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g., Young professionals, Small businesses"
                    value={designPrompt.targetAudience}
                    onChange={(e) => setDesignPrompt({ ...designPrompt, targetAudience: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Primary Features</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {designPrompt.primaryFeatures.map((feature) => (
                    <Badge 
                      key={feature} 
                      variant="secondary" 
                      className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                    >
                      {feature}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => setDesignPrompt({
                          ...designPrompt,
                          primaryFeatures: designPrompt.primaryFeatures.filter(f => f !== feature)
                        })}
                      />
                    </Badge>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {commonFeatures.filter(feature => !designPrompt.primaryFeatures.includes(feature)).map((feature) => (
                    <Badge 
                      key={feature} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => setDesignPrompt({
                        ...designPrompt,
                        primaryFeatures: [...designPrompt.primaryFeatures, feature]
                      })}
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="colorPreference" className="text-sm font-medium text-gray-700">
                    Color Preference
                  </Label>
                  <Select value={designPrompt.colorPreference} onValueChange={(value) => setDesignPrompt({ ...designPrompt, colorPreference: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose color scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="neutral">Neutral/Gray</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designStyle" className="text-sm font-medium text-gray-700">
                    Design Style
                  </Label>
                  <Select value={designPrompt.designStyle} onValueChange={(value) => setDesignPrompt({ ...designPrompt, designStyle: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose design style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Device Type</Label>
                <div className="flex gap-4">
                  {[
                    { value: 'mobile', label: 'Mobile', icon: Smartphone },
                    { value: 'tablet', label: 'Tablet', icon: Tablet },
                    { value: 'desktop', label: 'Desktop', icon: Monitor }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setDesignPrompt({ ...designPrompt, deviceType: value })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        designPrompt.deviceType === value
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Screen Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[
                    "Home/Landing", "Product List", "Product Detail", "Shopping Cart",
                    "User Profile", "Settings", "Login/Register", "Dashboard",
                    "Search Results", "Contact/About", "Blog/News", "FAQ/Help"
                  ].map((screenType) => (
                    <button
                      key={screenType}
                      onClick={() => {
                        const updatedScreenTypes = designPrompt.screenTypes.includes(screenType)
                          ? designPrompt.screenTypes.filter(type => type !== screenType)
                          : [...designPrompt.screenTypes, screenType];
                        
                        setDesignPrompt({
                          ...designPrompt,
                          screenTypes: updatedScreenTypes
                        });
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        designPrompt.screenTypes.includes(screenType)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {screenType}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={analyzeRequirements}
                disabled={isAnalyzing || !designPrompt.projectType.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing Requirements...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Analyze Requirements
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === "generating" && (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Analyzing Your Requirements</h3>
              <p className="text-gray-600 text-center">
                We're analyzing your project requirements to create the perfect wireframe structure...
              </p>
            </CardContent>
          </Card>
        )}

        {currentStep === "results" && (
          <div className="space-y-6">
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis">Analysis & Content</TabsTrigger>
                <TabsTrigger value="brand">Brand Guidelines</TabsTrigger>
                <TabsTrigger value="wireframes">Generated Wireframes</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-6">
                {analysisResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        Project Analysis Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">Recommended Pages ({analysisResult.pageRequirements?.length || 0})</h4>
                            <div className="space-y-2">
                              {analysisResult.pageRequirements?.map((page, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">{page.pageName}</span>
                                    <Badge variant="outline" className="text-xs">{page.pageType}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">{page.purpose}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">Actions</h4>
                            <div className="space-y-2">
                              <Button
                                onClick={generateDetailedContent}
                                disabled={isGeneratingContent}
                                className="w-full"
                                variant="outline"
                              >
                                {isGeneratingContent ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating Content...
                                  </div>
                                ) : (
                                  "Generate Detailed Content"
                                )}
                              </Button>
                              
                              <Button
                                onClick={generateWireframes}
                                disabled={isGeneratingWireframes || detailedWireframes.length === 0}
                                className="w-full"
                              >
                                {isGeneratingWireframes ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating Wireframes...
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4" />
                                    Generate Wireframes
                                  </div>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {isGeneratingContent && (
                          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              <span className="font-medium text-blue-800">Generating Content</span>
                            </div>
                            <div className="text-sm text-blue-700">
                              {contentGenerationProgress.currentPage && (
                                <div>Current: {contentGenerationProgress.currentPage}</div>
                              )}
                              <div>Progress: {contentGenerationProgress.current} / {contentGenerationProgress.total}</div>
                            </div>
                          </div>
                        )}

                        {isGeneratingWireframes && (
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                              <span className="font-medium text-green-800">Generating Wireframes</span>
                            </div>
                            <div className="text-sm text-green-700">
                              {wireframeGenerationProgress.currentPage && (
                                <div>Current: {wireframeGenerationProgress.currentPage}</div>
                              )}
                              <div>Progress: {wireframeGenerationProgress.current} / {wireframeGenerationProgress.total}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="brand" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-600" />
                      Brand Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleBrandFileUpload(e.target.files[0]);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </p>
                            <p className="text-xs text-gray-400">PDF files only</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {brandExtractionError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {brandExtractionError}
                      </div>
                    )}

                    {brandGuidelines && (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-700">Brand Guidelines Loaded</span>
                        </div>
                        <p className="text-sm text-green-600">
                          Brand guidelines have been successfully extracted and will be used in wireframe generation.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="wireframes" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Generated Wireframes ({generatedWireframes.length})
                  </h3>
                  {generatedWireframes.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearAllWireframes}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                {generatedWireframes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Frame className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Wireframes Generated</h3>
                    <p className="text-gray-500">Generate your first wireframe to see it here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedWireframes.map((wireframe) => (
                      <Card key={wireframe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-3 border-b">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              </div>
                              <div className="flex-1 bg-white rounded px-2 py-1 text-xs text-gray-600 truncate font-mono">
                                {wireframe.pageName.toLowerCase().replace(/\s+/g, '-')}.html
                              </div>
                              {isRefreshing && (
                                <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>Updating</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="relative h-80 bg-white">
                            <iframe
                              key={`${wireframe.id}-${wireframe.lastUpdated || Date.now()}`}
                              srcDoc={wireframe.htmlCode}
                              className="w-full h-full border-0 transform scale-[0.4] origin-top-left"
                              style={{ 
                                width: '250%', 
                                height: '250%',
                                overflow: 'hidden'
                              }}
                              title={`Preview of ${wireframe.pageName}`}
                              sandbox="allow-same-origin"
                              scrolling="no"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
                          </div>
                          
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-800 truncate">{wireframe.pageName}</h4>
                              {wireframe.isEnhanced && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                  Enhanced
                                </Badge>
                              )}
                            </div>
                            
                            {wireframe.lastEnhancedElement && (
                              <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                Last enhanced: {wireframe.lastEnhancedElement}
                              </div>
                            )}
                            
                            <div className="mt-4 flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs font-medium border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                                onClick={() => {
                                  const newWindow = window.open('', '_blank');
                                  if (newWindow) {
                                    newWindow.document.write(wireframe.htmlCode);
                                    newWindow.document.close();
                                  }
                                }}
                              >
                                <Frame className="h-3 w-3 mr-1" />
                                Preview
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs font-medium border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                                onClick={() => {
                                  console.log('Edit button clicked for wireframe:', wireframe);
                                  console.log('Wireframe ID:', wireframe.id);
                                  console.log('Full wireframe object keys:', Object.keys(wireframe));
                                  if (!wireframe.id) {
                                    console.error('Wireframe ID is missing! Wireframe object:', wireframe);
                                  }
                                  window.location.href = `/html-editor?id=${wireframe.id}`;
                                }}
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
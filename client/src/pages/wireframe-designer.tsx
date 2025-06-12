import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavigationBar } from "@/components/navigation-bar";
import { WorkflowProgress } from "@/components/workflow-progress";
import { createWireframeAnalysisAgent, type PageRequirement, type WireframeAnalysisResult, type ContentElement } from "@/lib/wireframe-analysis-agent";
import { createHTMLWireframeGenerator, type DetailedPageContent } from "@/lib/html-wireframe-generator";
import { createPageContentAgent, type PageContentCard } from "@/lib/page-content-agent";
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
  Search,
  Bell,
  Menu,
  Plus,
  Trash2,
  Edit3,
  Save,
  RefreshCw,
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
  Activity
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

export default function WireframeDesigner() {
  const [wireframes, setWireframes] = useState<WireframeData[]>([]);
  const [selectedWireframe, setSelectedWireframe] = useState<WireframeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<"input" | "generating" | "results">("input");
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
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedPageCode, setSelectedPageCode] = useState<{
    pageName: string;
    htmlCode: string;
    cssCode: string;
  } | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [pageContentCards, setPageContentCards] = useState<PageContentCard[]>([]);

  // Load saved data
  useEffect(() => {
    const savedWireframes = localStorage.getItem('wireframe_designs');
    if (savedWireframes) {
      setWireframes(JSON.parse(savedWireframes));
    }
  }, []);

  // Save wireframes to localStorage
  useEffect(() => {
    if (wireframes.length > 0) {
      localStorage.setItem('wireframe_designs', JSON.stringify(wireframes));
    }
  }, [wireframes]);

  // Analyze stakeholder flows using AI
  const analyzeStakeholderFlows = async () => {
    setIsAnalyzing(true);
    setError("");
    
    try {
      const stakeholderFlows = JSON.parse(localStorage.getItem('stakeholder_flows') || '[]');
      const flowTypes = JSON.parse(localStorage.getItem('flow_types') || '{}');
      const projectDescription = localStorage.getItem('project_description') || '';

      const analysisAgent = createWireframeAnalysisAgent();
      const result = await analysisAgent.analyzeStakeholderFlows();

      setAnalysisResult(result);
      setCurrentStep("input");
      
    } catch (err) {
      console.error("Error analyzing stakeholder flows:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze stakeholder flows");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate detailed page content
  const handleGeneratePageContent = async () => {
    if (!analysisResult) return;
    
    setIsGeneratingContent(true);
    setError("");
    
    try {
      // Get flow data from localStorage
      const stakeholderFlows = JSON.parse(localStorage.getItem('stakeholder_flows') || '[]');
      const flowTypes = JSON.parse(localStorage.getItem('flow_types') || '{}');
      const projectDescription = localStorage.getItem('project_description') || '';
      
      // Create content generation agent
      const contentAgent = createPageContentAgent();
      
      // Generate content for each page
      const contentCards = await contentAgent.generatePageContent({
        analysisResult,
        stakeholderFlows,
        flowTypes,
        projectDescription
      });
      
      setPageContentCards(contentCards);
      
    } catch (err) {
      console.error("Error generating page content:", err);
      setError(err instanceof Error ? err.message : "Failed to generate page content");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Generate wireframes from analysis
  const generateWireframes = async () => {
    if (!analysisResult) return;
    
    setIsGenerating(true);
    setError("");
    setCurrentStep("generating");
    setGenerationProgress({ current: 0, total: analysisResult.totalPages, status: "Generating wireframes..." });

    try {
      const generator = createHTMLWireframeGenerator();
      const newWireframes: DetailedPageContent[] = [];

      for (let i = 0; i < analysisResult.pageRequirements.length; i++) {
        const pageReq = analysisResult.pageRequirements[i];
        setGenerationProgress({ 
          current: i + 1, 
          total: analysisResult.pageRequirements.length, 
          status: `Generating ${pageReq.pageName}...` 
        });

        const stakeholderFlows = JSON.parse(localStorage.getItem('stakeholder_flows') || '[]');
        const flowTypes = JSON.parse(localStorage.getItem('flow_types') || '{}');
        const projectDescription = localStorage.getItem('project_description') || '';
        
        const result = await generator.generateDetailedWireframes(
          stakeholderFlows,
          flowTypes,
          projectDescription
        );

        newWireframes.push(...result);
      }

      setDetailedWireframes(newWireframes);
      setCurrentStep("results");
      
    } catch (err) {
      console.error("Error generating wireframes:", err);
      setError(err instanceof Error ? err.message : "Failed to generate wireframes");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportWireframe = (wireframe: WireframeData) => {
    const dataStr = JSON.stringify(wireframe, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${wireframe.name.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  const clearAllWireframes = () => {
    setWireframes([]);
    localStorage.removeItem('wireframe_designs');
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
        <WorkflowProgress currentStep="diagram" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-lg p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Layout className="h-5 w-5 text-white" />
              </div>
              AI Wireframe Designer
            </h1>
            <p className="text-gray-600 mt-2">
              Generate interactive wireframes from your stakeholder flows
            </p>
          </div>
          {wireframes.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {wireframes.length} wireframes
              </Badge>
              <Button
                onClick={clearAllWireframes}
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* AI Analysis Section */}
        {currentStep === "input" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Powered Stakeholder Flow Analysis
              </CardTitle>
              <p className="text-sm text-gray-600">
                Analyze your stakeholder flows to automatically generate contextual wireframes
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={analyzeStakeholderFlows}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Flows...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Stakeholder Flows
                    </>
                  )}
                </Button>
                
                {analysisResult && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {analysisResult.totalPages} pages analyzed
                    </Badge>
                    <Button
                      onClick={generateWireframes}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Grid className="h-4 w-4 mr-2" />
                          Generate Wireframes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              {analysisResult && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3">Analysis Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-700 mb-2">
                        <strong>Project Context:</strong> {analysisResult.projectContext}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Total Pages:</strong> {analysisResult.totalPages}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-2">
                        <strong>Identified Stakeholders:</strong>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.stakeholders?.map((stakeholder, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {stakeholder}
                          </Badge>
                        )) || <span className="text-xs text-gray-500">No stakeholders identified</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Page Types Identified:</strong>
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {analysisResult.pageRequirements.map((page, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border">
                          <p className="font-medium text-xs">{page.pageName}</p>
                          <p className="text-xs text-gray-600">{page.pageType}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Generate Content Button */}
                  <div className="mt-6 flex justify-center">
                    <Button 
                      onClick={handleGeneratePageContent}
                      disabled={isGeneratingContent}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isGeneratingContent ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Generating Content...
                        </>
                      ) : (
                        'Generate content of all pages'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generation Progress */}
        {currentStep === "generating" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Wireframes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>{generationProgress.status}</span>
                  <span>{generationProgress.current} of {generationProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {currentStep === "results" && detailedWireframes.length > 0 && (
          <div className="space-y-6 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Generated Wireframes</h2>
              <p className="text-gray-600">
                {detailedWireframes.length} wireframes generated from your stakeholder flows
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {detailedWireframes.map((page, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{page.pageName}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {page.pageType}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{page.purpose}</p>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {/* HTML Preview */}
                    <div className="border-t bg-gray-50 p-4">
                      <div className="bg-white rounded border shadow-sm overflow-hidden relative">
                        <div 
                          className="h-48 w-full overflow-hidden relative"
                          style={{ 
                            transform: 'scale(0.25)', 
                            transformOrigin: 'top left', 
                            width: '400%', 
                            height: '400%' 
                          }}
                        >
                          <style dangerouslySetInnerHTML={{ __html: page.cssStyles }} />
                          <div dangerouslySetInnerHTML={{ __html: page.htmlContent }} />
                        </div>
                        <div className="absolute inset-0 bg-transparent hover:bg-black hover:bg-opacity-10 transition-colors cursor-pointer" 
                             onClick={() => {
                               setSelectedPageCode({
                                 pageName: page.pageName,
                                 htmlCode: page.htmlContent,
                                 cssCode: page.cssStyles
                               });
                               setShowCodeModal(true);
                             }}
                        />
                      </div>
                    </div>
                    
                    {/* Content Summary */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-800 mb-2">Content Elements</h4>
                        <div className="space-y-1 text-xs text-gray-600">
                          {page.contentDetails.headers.length > 0 && (
                            <div><strong>Headers:</strong> {page.contentDetails.headers.slice(0, 2).join(', ')}</div>
                          )}
                          {page.contentDetails.buttons.length > 0 && (
                            <div><strong>Actions:</strong> {page.contentDetails.buttons.slice(0, 3).map(b => b.label).join(', ')}</div>
                          )}
                          {page.contentDetails.forms.length > 0 && (
                            <div><strong>Forms:</strong> {page.contentDetails.forms.length} form(s)</div>
                          )}
                        </div>
                      </div>
                      
                      {page.stakeholders.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-800 mb-1">Target Users</h4>
                          <div className="flex flex-wrap gap-1">
                            {page.stakeholders.map((stakeholder, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {stakeholder}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs flex-1"
                          onClick={() => {
                            const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${page.pageName}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${page.cssStyles}</style>
</head>
<body>${page.htmlContent}</body>
</html>`;
                            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
                            const url = URL.createObjectURL(htmlBlob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${page.pageName.replace(/\s+/g, '_').toLowerCase()}.html`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs flex-1"
                          onClick={() => {
                            navigator.clipboard.writeText(`<!-- ${page.pageName} -->\n${page.htmlContent}\n\n/* CSS for ${page.pageName} */\n${page.cssStyles}`);
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                          onClick={() => {
                            setSelectedPageCode({
                              pageName: page.pageName,
                              htmlCode: page.htmlContent,
                              cssCode: page.cssStyles
                            });
                            setShowCodeModal(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Code
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Start Over Button */}
            <div className="text-center pt-6">
              <Button
                onClick={() => {
                  setCurrentStep("input");
                  setAnalysisResult(null);
                  setDetailedWireframes([]);
                }}
                variant="outline"
                className="px-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Start Over
              </Button>
            </div>
          </div>
        )}

        {/* Code Modal */}
        {showCodeModal && selectedPageCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">{selectedPageCode.pageName} - Code</h3>
                <Button
                  onClick={() => {
                    setShowCodeModal(false);
                    setSelectedPageCode(null);
                  }}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                <Tabs defaultValue="html" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="css">CSS</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="html">
                    <div className="relative">
                      <Button
                        onClick={() => navigator.clipboard.writeText(selectedPageCode.htmlCode)}
                        className="absolute top-2 right-2 z-10"
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                        <code>{selectedPageCode.htmlCode}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="css">
                    <div className="relative">
                      <Button
                        onClick={() => navigator.clipboard.writeText(selectedPageCode.cssCode)}
                        className="absolute top-2 right-2 z-10"
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                        <code>{selectedPageCode.cssCode}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview">
                    <div className="border rounded-lg overflow-hidden">
                      <style dangerouslySetInnerHTML={{ __html: selectedPageCode.cssCode }} />
                      <div dangerouslySetInnerHTML={{ __html: selectedPageCode.htmlCode }} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Cards Display */}
        {pageContentCards.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Generated Page Content</h2>
            <div className="grid gap-6">
              {pageContentCards.map((card, index) => (
                <Card key={card.id} className="border-2 border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold text-purple-700">
                          {card.pageName}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Type:</span> {card.pageType} | 
                          <span className="font-medium ml-2">Purpose:</span> {card.purpose}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {card.stakeholders.map((stakeholder, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {stakeholder}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedCards = [...pageContentCards];
                          updatedCards[index] = { ...card, isEdited: !card.isEdited };
                          setPageContentCards(updatedCards);
                        }}
                      >
                        {card.isEdited ? "Save" : "Edit"}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <Tabs defaultValue="content" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="forms">Forms</TabsTrigger>
                        <TabsTrigger value="buttons">Buttons</TabsTrigger>
                        <TabsTrigger value="media">Media</TabsTrigger>
                        <TabsTrigger value="navigation">Navigation</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="content" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Headers</h4>
                            <div className="space-y-1">
                              {card.headers.map((header, idx) => (
                                <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                                  {card.isEdited ? (
                                    <Input
                                      value={header}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].headers[idx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-sm"
                                    />
                                  ) : (
                                    header
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Text Content</h4>
                            <div className="space-y-1">
                              {card.textContent.map((text, idx) => (
                                <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                                  {card.isEdited ? (
                                    <Input
                                      value={text}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].textContent[idx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-sm"
                                    />
                                  ) : (
                                    text
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="forms" className="mt-4">
                        <div className="space-y-4">
                          {card.forms.map((form, formIdx) => (
                            <div key={formIdx} className="border rounded-lg p-4 bg-gray-50">
                              <h4 className="font-semibold mb-2">{form.title}</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Form Fields</Label>
                                  <div className="space-y-1 mt-1">
                                    {form.fields.map((field, fieldIdx) => (
                                      <div key={fieldIdx} className="p-2 bg-white rounded text-sm">
                                        {card.isEdited ? (
                                          <Input
                                            value={field}
                                            onChange={(e) => {
                                              const updatedCards = [...pageContentCards];
                                              updatedCards[index].forms[formIdx].fields[fieldIdx] = e.target.value;
                                              setPageContentCards(updatedCards);
                                            }}
                                            className="text-sm"
                                          />
                                        ) : (
                                          field
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">Submit Action</Label>
                                  <div className="p-2 bg-white rounded text-sm mt-1">
                                    {card.isEdited ? (
                                      <Input
                                        value={form.submitAction}
                                        onChange={(e) => {
                                          const updatedCards = [...pageContentCards];
                                          updatedCards[index].forms[formIdx].submitAction = e.target.value;
                                          setPageContentCards(updatedCards);
                                        }}
                                        className="text-sm"
                                      />
                                    ) : (
                                      form.submitAction
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="buttons" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {card.buttons.map((button, btnIdx) => (
                            <div key={btnIdx} className="border rounded-lg p-3 bg-gray-50">
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs">Label</Label>
                                  {card.isEdited ? (
                                    <Input
                                      value={button.label}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].buttons[btnIdx].label = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-sm mt-1"
                                    />
                                  ) : (
                                    <div className="p-1 bg-white rounded text-sm mt-1">{button.label}</div>
                                  )}
                                </div>
                                <div>
                                  <Label className="text-xs">Action</Label>
                                  {card.isEdited ? (
                                    <Input
                                      value={button.action}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].buttons[btnIdx].action = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-sm mt-1"
                                    />
                                  ) : (
                                    <div className="p-1 bg-white rounded text-sm mt-1">{button.action}</div>
                                  )}
                                </div>
                                <div>
                                  <Label className="text-xs">Style</Label>
                                  {card.isEdited ? (
                                    <Select
                                      value={button.style}
                                      onValueChange={(value) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].buttons[btnIdx].style = value;
                                        setPageContentCards(updatedCards);
                                      }}
                                    >
                                      <SelectTrigger className="text-sm mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="primary">Primary</SelectItem>
                                        <SelectItem value="secondary">Secondary</SelectItem>
                                        <SelectItem value="outline">Outline</SelectItem>
                                        <SelectItem value="ghost">Ghost</SelectItem>
                                        <SelectItem value="destructive">Destructive</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div className="p-1 bg-white rounded text-sm mt-1">{button.style}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="media" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Images</h4>
                            <div className="space-y-2">
                              {card.images.map((image, imgIdx) => (
                                <div key={imgIdx} className="border rounded-lg p-3 bg-gray-50">
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium">{image.alt}</div>
                                    <div className="text-xs text-gray-600">{image.description}</div>
                                    <div className="text-xs">
                                      <span className="font-medium">Position:</span> {image.position}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Lists</h4>
                            <div className="space-y-2">
                              {card.lists.map((list, listIdx) => (
                                <div key={listIdx} className="border rounded-lg p-3 bg-gray-50">
                                  <div className="font-medium text-sm mb-1">{list.title}</div>
                                  <div className="text-xs text-gray-600 mb-2">Type: {list.type}</div>
                                  <div className="space-y-1">
                                    {list.items.map((item, itemIdx) => (
                                      <div key={itemIdx} className="text-sm p-1 bg-white rounded">
                                        • {item}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="navigation" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Navigation Items</h4>
                            <div className="space-y-1">
                              {card.navigation.map((navItem, navIdx) => (
                                <div key={navIdx} className="p-2 bg-gray-50 rounded text-sm">
                                  {card.isEdited ? (
                                    <Input
                                      value={navItem}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].navigation[navIdx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-sm"
                                    />
                                  ) : (
                                    navItem
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Additional Content</h4>
                            <div className="space-y-1">
                              {card.additionalContent.map((content, contentIdx) => (
                                <div key={contentIdx} className="p-2 bg-gray-50 rounded text-sm">
                                  {card.isEdited ? (
                                    <Input
                                      value={content}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].additionalContent[contentIdx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-sm"
                                    />
                                  ) : (
                                    content
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
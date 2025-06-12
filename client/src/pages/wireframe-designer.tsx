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
  const [contentGenerationProgress, setContentGenerationProgress] = useState({ current: 0, total: 0, currentPage: "" });
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);
  const [generatedWireframes, setGeneratedWireframes] = useState<{ pageName: string; htmlCode: string; cssCode: string }[]>([]);
  const [wireframeGenerationProgress, setWireframeGenerationProgress] = useState({ current: 0, total: 0, currentPage: "" });

  // Load saved data
  useEffect(() => {
    const savedWireframes = localStorage.getItem('wireframe_designs');
    const savedPageContent = localStorage.getItem('page_content_cards');
    const savedGeneratedWireframes = localStorage.getItem('generated_wireframes');
    if (savedWireframes) {
      setWireframes(JSON.parse(savedWireframes));
    }
    if (savedPageContent) {
      setPageContentCards(JSON.parse(savedPageContent));
    }
    if (savedGeneratedWireframes) {
      setGeneratedWireframes(JSON.parse(savedGeneratedWireframes));
    }
  }, []);

  // Save wireframes to localStorage
  useEffect(() => {
    if (wireframes.length > 0) {
      localStorage.setItem('wireframe_designs', JSON.stringify(wireframes));
    }
  }, [wireframes]);

  // Save page content cards to localStorage
  useEffect(() => {
    if (pageContentCards.length > 0) {
      localStorage.setItem('page_content_cards', JSON.stringify(pageContentCards));
    }
  }, [pageContentCards]);

  // Save generated wireframes to localStorage
  useEffect(() => {
    if (generatedWireframes.length > 0) {
      localStorage.setItem('generated_wireframes', JSON.stringify(generatedWireframes));
    }
  }, [generatedWireframes]);

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
    setContentGenerationProgress({ current: 0, total: analysisResult.pageRequirements.length, currentPage: "" });
    
    try {
      // Get flow data from localStorage
      const stakeholderFlows = JSON.parse(localStorage.getItem('stakeholder_flows') || '[]');
      const flowTypes = JSON.parse(localStorage.getItem('flow_types') || '{}');
      const projectDescription = localStorage.getItem('project_description') || '';
      
      // Create content generation agent
      const contentAgent = createPageContentAgent();
      
      const contentCards: PageContentCard[] = [];
      
      // Generate content for each page with progress tracking
      for (let i = 0; i < analysisResult.pageRequirements.length; i++) {
        const pageReq = analysisResult.pageRequirements[i];
        
        setContentGenerationProgress({ 
          current: i + 1, 
          total: analysisResult.pageRequirements.length, 
          currentPage: pageReq.pageName 
        });
        
        const content = await contentAgent.generateSinglePageContent(pageReq, {
          stakeholderFlows,
          flowTypes,
          projectDescription
        });
        
        contentCards.push({
          id: `page-${i}`,
          ...content,
          isEdited: false
        });
      }
      
      setPageContentCards(contentCards);
      
    } catch (err) {
      console.error("Error generating page content:", err);
      setError(err instanceof Error ? err.message : "Failed to generate page content");
    } finally {
      setIsGeneratingContent(false);
      setContentGenerationProgress({ current: 0, total: 0, currentPage: "" });
    }
  };

  // Generate HTML wireframes from page content
  const handleGenerateWireframes = async () => {
    if (pageContentCards.length === 0) return;
    
    setIsGeneratingWireframes(true);
    setError("");
    setWireframeGenerationProgress({ current: 0, total: pageContentCards.length, currentPage: "" });
    
    try {
      const wireframes: { pageName: string; htmlCode: string; cssCode: string }[] = [];
      
      for (let i = 0; i < pageContentCards.length; i++) {
        const card = pageContentCards[i];
        
        setWireframeGenerationProgress({ 
          current: i + 1, 
          total: pageContentCards.length, 
          currentPage: card.pageName 
        });
        
        const wireframe = await generatePageWireframe(card);
        wireframes.push(wireframe);
      }
      
      setGeneratedWireframes(wireframes);
      
    } catch (err) {
      console.error("Error generating wireframes:", err);
      setError(err instanceof Error ? err.message : "Failed to generate wireframes");
    } finally {
      setIsGeneratingWireframes(false);
      setWireframeGenerationProgress({ current: 0, total: 0, currentPage: "" });
    }
  };

  const generatePageWireframe = async (card: PageContentCard): Promise<{ pageName: string; htmlCode: string; cssCode: string }> => {
    const htmlCode = generateWireframeHTML(card);
    const cssCode = generateWireframeCSS(card);
    
    return {
      pageName: card.pageName,
      htmlCode,
      cssCode
    };
  };

  const generateWireframeHTML = (card: PageContentCard): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${card.pageName}</title>
    <style>
        ${generateWireframeCSS(card)}
    </style>
</head>
<body>
    <div class="wireframe-container">
        <!-- Header -->
        <header class="page-header">
            <h1>${card.headers[0] || card.pageName}</h1>
            <nav class="navigation">
                ${card.navigation.map(item => `<a href="#" class="nav-item">${item}</a>`).join('')}
            </nav>
        </header>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Page Headers -->
            <div class="content-section">
                ${card.headers.slice(1).map(header => `<h2 class="section-header">${header}</h2>`).join('')}
            </div>

            <!-- Text Content -->
            <div class="content-section">
                ${card.textContent.map(text => `<p class="content-text">${text}</p>`).join('')}
            </div>

            <!-- Forms -->
            ${card.forms.map(form => `
                <div class="form-section">
                    <h3 class="form-title">${form.title}</h3>
                    <form class="wireframe-form">
                        ${form.fields.map(field => `
                            <div class="form-field">
                                <label class="field-label">${field}</label>
                                <input type="text" class="field-input" placeholder="Enter ${field.toLowerCase()}" />
                            </div>
                        `).join('')}
                        <button type="submit" class="form-button primary">${form.submitAction}</button>
                    </form>
                </div>
            `).join('')}

            <!-- Input Fields -->
            <div class="inputs-section">
                ${card.inputs.map(input => `
                    <div class="input-group">
                        <label class="input-label">${input.label}${input.required ? ' *' : ''}</label>
                        <input type="${input.type}" class="input-field" placeholder="${input.placeholder}" ${input.required ? 'required' : ''} />
                    </div>
                `).join('')}
            </div>

            <!-- Buttons -->
            <div class="buttons-section">
                ${card.buttons.map(button => `
                    <button class="wireframe-button ${button.style}" data-action="${button.action}">
                        ${button.label}
                    </button>
                `).join('')}
            </div>

            <!-- Lists -->
            ${card.lists.map(list => `
                <div class="list-section">
                    <h4 class="list-title">${list.title}</h4>
                    <ul class="wireframe-list ${list.type}">
                        ${list.items.map(item => `<li class="list-item">${item}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}

            <!-- Images Placeholders -->
            <div class="images-section">
                ${card.images.map(image => `
                    <div class="image-placeholder ${image.position}">
                        <div class="image-box">
                            <span class="image-text">${image.alt}</span>
                            <small class="image-description">${image.description}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        </main>

        <!-- Footer -->
        <footer class="page-footer">
            ${card.additionalContent.map(content => `<p class="footer-text">${content}</p>`).join('')}
        </footer>
    </div>
</body>
</html>`;
  };

  const generateWireframeCSS = (card: PageContentCard): string => {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }

        .wireframe-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        .page-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }

        .page-header h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        .navigation {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 1rem;
        }

        .nav-item {
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: background-color 0.3s;
        }

        .nav-item:hover {
            background-color: rgba(255,255,255,0.2);
        }

        .main-content {
            padding: 2rem;
        }

        .content-section {
            margin-bottom: 2rem;
        }

        .section-header {
            color: #444;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #eee;
        }

        .content-text {
            margin-bottom: 1rem;
            line-height: 1.8;
            color: #666;
        }

        .form-section {
            background: #f9f9f9;
            padding: 2rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            border: 1px solid #e0e0e0;
        }

        .form-title {
            color: #333;
            margin-bottom: 1.5rem;
        }

        .wireframe-form {
            display: grid;
            gap: 1rem;
        }

        .form-field {
            display: flex;
            flex-direction: column;
        }

        .field-label {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #555;
        }

        .field-input {
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
        }

        .field-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
        }

        .inputs-section {
            display: grid;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .input-group {
            display: flex;
            flex-direction: column;
        }

        .input-label {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #555;
        }

        .input-field {
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
        }

        .buttons-section {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 2rem;
        }

        .wireframe-button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
        }

        .wireframe-button.primary {
            background-color: #667eea;
            color: white;
        }

        .wireframe-button.secondary {
            background-color: #6c757d;
            color: white;
        }

        .wireframe-button.outline {
            background-color: transparent;
            color: #667eea;
            border: 1px solid #667eea;
        }

        .wireframe-button.ghost {
            background-color: transparent;
            color: #6c757d;
        }

        .wireframe-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .list-section {
            margin-bottom: 2rem;
        }

        .list-title {
            color: #444;
            margin-bottom: 1rem;
        }

        .wireframe-list {
            list-style: none;
            background: #f9f9f9;
            border-radius: 8px;
            padding: 1rem;
        }

        .list-item {
            padding: 0.5rem;
            border-bottom: 1px solid #eee;
        }

        .list-item:last-child {
            border-bottom: none;
        }

        .images-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .image-placeholder {
            background: #f0f0f0;
            border: 2px dashed #ccc;
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .image-box {
            text-align: center;
        }

        .image-text {
            font-weight: 600;
            color: #666;
            display: block;
            margin-bottom: 0.5rem;
        }

        .image-description {
            color: #999;
            font-size: 0.875rem;
        }

        .page-footer {
            background: #333;
            color: white;
            padding: 2rem;
            text-align: center;
        }

        .footer-text {
            margin-bottom: 0.5rem;
        }

        @media (max-width: 768px) {
            .page-header h1 {
                font-size: 2rem;
            }
            
            .navigation {
                flex-direction: column;
                gap: 1rem;
            }
            
            .main-content {
                padding: 1rem;
            }
            
            .buttons-section {
                flex-direction: column;
            }
        }
    `;
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
                  
                  {/* Content Generation Progress */}
                  {isGeneratingContent && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-700">
                          Generating Page Content ({contentGenerationProgress.current}/{contentGenerationProgress.total})
                        </span>
                        <span className="text-xs text-purple-600">
                          {Math.round((contentGenerationProgress.current / contentGenerationProgress.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(contentGenerationProgress.current / contentGenerationProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      {contentGenerationProgress.currentPage && (
                        <p className="text-xs text-purple-600 mt-2">
                          Currently generating: {contentGenerationProgress.currentPage}
                        </p>
                      )}
                    </div>
                  )}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Generated Page Content</h2>
              <Button 
                onClick={handleGenerateWireframes}
                disabled={isGeneratingWireframes}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isGeneratingWireframes ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating Wireframes...
                  </>
                ) : (
                  'Generate wireframe of each pages'
                )}
              </Button>
            </div>
            
            {/* Wireframe Generation Progress */}
            {isGeneratingWireframes && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">
                    Generating Wireframes ({wireframeGenerationProgress.current}/{wireframeGenerationProgress.total})
                  </span>
                  <span className="text-xs text-green-600">
                    {Math.round((wireframeGenerationProgress.current / wireframeGenerationProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(wireframeGenerationProgress.current / wireframeGenerationProgress.total) * 100}%` }}
                  ></div>
                </div>
                {wireframeGenerationProgress.currentPage && (
                  <p className="text-xs text-green-600 mt-2">
                    Currently generating: {wireframeGenerationProgress.currentPage}
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pageContentCards.map((card, index) => (
                <Card key={card.id} className="border-2 border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 py-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-base font-semibold text-purple-700">
                          {card.pageName}
                        </CardTitle>
                        <p className="text-xs text-gray-600 mt-1">
                          {card.pageType} • {card.purpose}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {card.stakeholders.slice(0, 3).map((stakeholder, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
                              {stakeholder}
                            </Badge>
                          ))}
                          {card.stakeholders.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              +{card.stakeholders.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
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
                  
                  <CardContent className="p-4">
                    <Tabs defaultValue="content" className="w-full">
                      <TabsList className="grid w-full grid-cols-5 h-8">
                        <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                        <TabsTrigger value="forms" className="text-xs">Forms</TabsTrigger>
                        <TabsTrigger value="buttons" className="text-xs">Buttons</TabsTrigger>
                        <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
                        <TabsTrigger value="navigation" className="text-xs">Nav</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="content" className="mt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <h4 className="font-medium mb-1 text-sm">Headers</h4>
                            <div className="space-y-1">
                              {card.headers.map((header, idx) => (
                                <div key={idx} className="p-1 bg-gray-50 rounded text-xs">
                                  {card.isEdited ? (
                                    <Input
                                      value={header}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].headers[idx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-xs h-6"
                                    />
                                  ) : (
                                    header
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1 text-sm">Text Content</h4>
                            <div className="space-y-1">
                              {card.textContent.map((text, idx) => (
                                <div key={idx} className="p-1 bg-gray-50 rounded text-xs">
                                  {card.isEdited ? (
                                    <Input
                                      value={text}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].textContent[idx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-xs h-6"
                                    />
                                  ) : (
                                    typeof text === 'string' ? text : String(text)
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="forms" className="mt-3">
                        <div className="space-y-2">
                          {card.forms.map((form, formIdx) => (
                            <div key={formIdx} className="border rounded p-2 bg-gray-50">
                              <h4 className="font-medium text-sm mb-1">{form.title}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs font-medium">Fields</Label>
                                  <div className="space-y-1">
                                    {form.fields.map((field, fieldIdx) => (
                                      <div key={fieldIdx} className="p-1 bg-white rounded text-xs">
                                        {card.isEdited ? (
                                          <Input
                                            value={field}
                                            onChange={(e) => {
                                              const updatedCards = [...pageContentCards];
                                              updatedCards[index].forms[formIdx].fields[fieldIdx] = e.target.value;
                                              setPageContentCards(updatedCards);
                                            }}
                                            className="text-xs h-6"
                                          />
                                        ) : (
                                          field
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-xs font-medium">Action</Label>
                                  <div className="p-1 bg-white rounded text-xs">
                                    {card.isEdited ? (
                                      <Input
                                        value={form.submitAction}
                                        onChange={(e) => {
                                          const updatedCards = [...pageContentCards];
                                          updatedCards[index].forms[formIdx].submitAction = e.target.value;
                                          setPageContentCards(updatedCards);
                                        }}
                                        className="text-xs h-6"
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
                      
                      <TabsContent value="buttons" className="mt-3">
                        <div className="grid grid-cols-2 gap-2">
                          {card.buttons.map((button, btnIdx) => (
                            <div key={btnIdx} className="border rounded p-2 bg-gray-50">
                              <div className="space-y-1">
                                <div className="text-xs font-medium">{button.label}</div>
                                <div className="text-xs text-gray-600">{button.action}</div>
                                <div className="text-xs">
                                  <span className="px-1 py-0.5 bg-blue-100 rounded">{button.style}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="media" className="mt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <h4 className="font-medium mb-1 text-sm">Images</h4>
                            <div className="space-y-1">
                              {card.images.map((image, imgIdx) => (
                                <div key={imgIdx} className="border rounded p-2 bg-gray-50">
                                  <div className="text-xs font-medium">{image.alt}</div>
                                  <div className="text-xs text-gray-600">{image.description}</div>
                                  <div className="text-xs text-gray-500">Position: {image.position}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1 text-sm">Lists</h4>
                            <div className="space-y-1">
                              {card.lists.map((list, listIdx) => (
                                <div key={listIdx} className="border rounded p-2 bg-gray-50">
                                  <div className="font-medium text-xs">{list.title}</div>
                                  <div className="text-xs text-gray-600">{list.type} • {list.items.length} items</div>
                                  <div className="space-y-0.5 mt-1">
                                    {list.items.map((item, itemIdx) => (
                                      <div key={itemIdx} className="text-xs bg-white p-1 rounded">• {item}</div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="navigation" className="mt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <h4 className="font-medium mb-1 text-sm">Navigation</h4>
                            <div className="space-y-1">
                              {card.navigation.map((navItem, navIdx) => (
                                <div key={navIdx} className="p-1 bg-gray-50 rounded text-xs">
                                  {card.isEdited ? (
                                    <Input
                                      value={navItem}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].navigation[navIdx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-xs h-6"
                                    />
                                  ) : (
                                    navItem
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1 text-sm">Additional</h4>
                            <div className="space-y-1">
                              {card.additionalContent.map((content, contentIdx) => (
                                <div key={contentIdx} className="p-1 bg-gray-50 rounded text-xs">
                                  {card.isEdited ? (
                                    <Input
                                      value={content}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].additionalContent[contentIdx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-xs h-6"
                                    />
                                  ) : (
                                    typeof content === 'string' ? content : String(content)
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

        {/* Generated Wireframes Display */}
        {generatedWireframes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Generated Wireframes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedWireframes.map((wireframe, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 py-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-semibold text-green-700 truncate">
                        {wireframe.pageName}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setSelectedPageCode({
                              pageName: wireframe.pageName,
                              htmlCode: wireframe.htmlCode,
                              cssCode: wireframe.cssCode
                            });
                            setShowCodeModal(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const blob = new Blob([wireframe.htmlCode], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${wireframe.pageName.replace(/\s+/g, '_')}.html`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3">
                    <div className="border rounded overflow-hidden bg-white">
                      <div className="bg-gray-100 px-2 py-1 border-b">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="ml-2 text-xs text-gray-600 truncate">{wireframe.pageName}</span>
                        </div>
                      </div>
                      <div className="h-48 overflow-auto">
                        <iframe
                          srcDoc={wireframe.htmlCode}
                          className="w-full h-full border-0 transform scale-75 origin-top-left"
                          style={{ width: '133.33%', height: '133.33%' }}
                          title={`Preview of ${wireframe.pageName}`}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-2 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const newWindow = window.open('', '_blank');
                          if (newWindow) {
                            newWindow.document.write(wireframe.htmlCode);
                            newWindow.document.close();
                          }
                        }}
                      >
                        <Frame className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
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
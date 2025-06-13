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
  Search,
  Bell,
  Menu,
  Plus,
  Trash2,
  Edit2,
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
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedPageCode, setSelectedPageCode] = useState<{
    pageName: string;
    htmlCode: string;
    cssCode: string;
  } | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [pageContentCards, setPageContentCards] = useState<PageContentCard[]>([]);
  const [pageLayouts, setPageLayouts] = useState<Record<string, string>>({});
  const [contentGenerationProgress, setContentGenerationProgress] = useState({ current: 0, total: 0, currentPage: "" });
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);

  const [generatedWireframes, setGeneratedWireframes] = useState<{ pageName: string; htmlCode: string; cssCode: string }[]>([]);
  const [wireframeGenerationProgress, setWireframeGenerationProgress] = useState({ current: 0, total: 0, currentPage: "" });
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedCode, setEnhancedCode] = useState<{ html: string; css: string; js: string; explanation: string; improvements: string[] } | null>(null);
  
  // Wireframe customization options
  const [selectedDeviceType, setSelectedDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>('modern-blue');
  const [selectedDesignType, setSelectedDesignType] = useState<string>('modern');
  const [selectedLayout, setSelectedLayout] = useState<string>('standard-header');

  // Load saved data
  useEffect(() => {
    const savedWireframes = localStorage.getItem('wireframe_designs');
    const savedPageContent = localStorage.getItem('page_content_cards');
    const savedGeneratedWireframes = localStorage.getItem('generated_wireframes');
    const savedAnalysisResult = localStorage.getItem('analysis_result');
    const savedPageLayouts = localStorage.getItem('page_layouts');
    
    if (savedWireframes) {
      setWireframes(JSON.parse(savedWireframes));
    }
    if (savedPageContent) {
      setPageContentCards(JSON.parse(savedPageContent));
    }
    if (savedGeneratedWireframes) {
      setGeneratedWireframes(JSON.parse(savedGeneratedWireframes));
    }
    if (savedAnalysisResult) {
      setAnalysisResult(JSON.parse(savedAnalysisResult));
    }
    if (savedPageLayouts) {
      setPageLayouts(JSON.parse(savedPageLayouts));
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

  // Save page layouts to localStorage
  useEffect(() => {
    localStorage.setItem('page_layouts', JSON.stringify(pageLayouts));
  }, [pageLayouts]);

  // Save analysis results to localStorage
  useEffect(() => {
    if (analysisResult) {
      localStorage.setItem('analysis_result', JSON.stringify(analysisResult));
    }
  }, [analysisResult]);

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
    if (pageContentCards.length === 0) {
      toast({
        title: "No Content Available",
        description: "Please generate page content first before creating wireframes.",
        variant: "destructive",
      });
      return;
    }
    
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
      
      toast({
        title: "Wireframes Generated",
        description: `Successfully created ${wireframes.length} wireframe(s).`,
      });
      
    } catch (err) {
      console.error("Error generating wireframes:", err);
      setError(err instanceof Error ? err.message : "Failed to generate wireframes");
      toast({
        title: "Generation Failed",
        description: "Failed to generate wireframes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWireframes(false);
      setWireframeGenerationProgress({ current: 0, total: 0, currentPage: "" });
    }
  };

  // AI Code Enhancement Function
  const handleEnhanceCode = async () => {
    if (!selectedPageCode || !enhancementPrompt.trim()) {
      toast({
        title: "Invalid Request",
        description: "Please enter an enhancement prompt.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    setError("");

    try {
      const enhancer = createAICodeEnhancer();
      const request: CodeEnhancementRequest = {
        htmlCode: selectedPageCode.htmlCode,
        cssCode: selectedPageCode.cssCode,
        prompt: enhancementPrompt,
        pageName: selectedPageCode.pageName
      };

      const enhanced = await enhancer.enhanceCode(request);
      setEnhancedCode(enhanced);

      // Update the selected page code with enhanced versions
      setSelectedPageCode({
        pageName: selectedPageCode.pageName,
        htmlCode: enhanced.html,
        cssCode: enhanced.css
      });

      toast({
        title: "Code Enhanced Successfully",
        description: "HTML and CSS tabs now show the enhanced code.",
      });
    } catch (err) {
      console.error("Error enhancing code:", err);
      // Set fallback enhanced code with original content
      setEnhancedCode({
        html: selectedPageCode.htmlCode,
        css: selectedPageCode.cssCode,
        js: '// Enhancement failed - showing original code\n// Please check API configuration and try again',
        explanation: 'Enhancement failed. Showing original code instead.',
        improvements: ['Original HTML preserved', 'Original CSS preserved', 'Please try again with a different prompt']
      });
      setError(err instanceof Error ? err.message : "Failed to enhance code");
      toast({
        title: "Enhancement Failed",
        description: "Showing original code. Please check your prompt and try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const generatePageWireframe = async (card: PageContentCard): Promise<{ pageName: string; htmlCode: string; cssCode: string }> => {
    const pageLayout = pageLayouts[card.id] || 'standard-header';
    const htmlCode = generateWireframeHTML(card, selectedDeviceType, selectedColorScheme, selectedDesignType, pageLayout);
    const cssCode = generateWireframeCSS(card, selectedDeviceType, selectedColorScheme, selectedDesignType, pageLayout);
    
    return {
      pageName: card.pageName,
      htmlCode,
      cssCode
    };
  };

  const generateWireframeHTML = (card: PageContentCard, deviceType: string, colorScheme: string, designType: string, layout: string = 'standard-header'): string => {
    const viewportWidth = deviceType === 'mobile' ? '375' : deviceType === 'tablet' ? '768' : '1200';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${card.pageName}</title>
    <style>
        ${generateWireframeCSS(card, deviceType, colorScheme, designType, layout)}
    </style>
</head>
<body>
    <div class="wireframe-container layout-${layout}">
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

  const generateWireframeCSS = (card: PageContentCard, deviceType: string, colorScheme: string, designType: string, layout: string = 'standard-header'): string => {
    // Color scheme definitions
    const colorSchemes = {
      'modern-blue': { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA', bg: '#F8FAFC', text: '#1F2937' },
      'professional-gray': { primary: '#6B7280', secondary: '#374151', accent: '#9CA3AF', bg: '#F9FAFB', text: '#111827' },
      'vibrant-green': { primary: '#10B981', secondary: '#047857', accent: '#34D399', bg: '#F0FDF4', text: '#1F2937' },
      'elegant-purple': { primary: '#8B5CF6', secondary: '#6D28D9', accent: '#A78BFA', bg: '#FAF5FF', text: '#1F2937' },
      'warm-orange': { primary: '#F59E0B', secondary: '#D97706', accent: '#FBBF24', bg: '#FFFBEB', text: '#1F2937' },
      'corporate-navy': { primary: '#1E3A8A', secondary: '#1E40AF', accent: '#3B82F6', bg: '#F8FAFC', text: '#1F2937' },
      'minimalist-black': { primary: '#1F2937', secondary: '#111827', accent: '#6B7280', bg: '#FFFFFF', text: '#1F2937' },
      'fresh-teal': { primary: '#0D9488', secondary: '#0F766E', accent: '#2DD4BF', bg: '#F0FDFA', text: '#1F2937' }
    };

    const colors = colorSchemes[colorScheme as keyof typeof colorSchemes] || colorSchemes['modern-blue'];
    
    // Device-specific styling
    const maxWidth = deviceType === 'mobile' ? '375px' : deviceType === 'tablet' ? '768px' : '1200px';
    const padding = deviceType === 'mobile' ? '1rem' : deviceType === 'tablet' ? '1.5rem' : '2rem';
    const fontSize = deviceType === 'mobile' ? '14px' : '16px';
    
    // Design type specific styling
    const borderRadius = designType === 'minimal' ? '0' : designType === 'modern' ? '12px' : designType === 'classic' ? '4px' : '8px';
    const shadows = designType === 'minimal' ? 'none' : designType === 'bold' ? '0 8px 32px rgba(0,0,0,0.12)' : '0 4px 16px rgba(0,0,0,0.08)';
    
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${designType === 'classic' ? 'Georgia, serif' : designType === 'modern' ? "'Inter', sans-serif" : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"};
            line-height: 1.6;
            color: ${colors.text};
            background-color: ${colors.bg};
            font-size: ${fontSize};
        }

        .wireframe-container {
            max-width: ${maxWidth};
            margin: 0 auto;
            background: white;
            min-height: 100vh;
            box-shadow: ${shadows};
            border-radius: ${borderRadius};
            overflow: hidden;
        }

        .page-header {
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
            color: white;
            padding: ${padding};
            text-align: center;
        }

        .page-header h1 {
            font-size: ${deviceType === 'mobile' ? '1.8rem' : deviceType === 'tablet' ? '2.2rem' : '2.5rem'};
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
            padding: ${padding};
        }

        .content-section {
            margin-bottom: ${deviceType === 'mobile' ? '1rem' : '2rem'};
        }

        .section-header {
            color: ${colors.secondary};
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid ${colors.accent};
        }

        .content-text {
            margin-bottom: 1rem;
            line-height: 1.8;
            color: ${colors.text};
        }

        .form-section {
            background: ${colors.bg};
            padding: ${padding};
            border-radius: ${borderRadius};
            margin-bottom: ${deviceType === 'mobile' ? '1rem' : '2rem'};
            border: 1px solid ${colors.accent};
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
            padding: ${deviceType === 'mobile' ? '0.5rem 1rem' : '0.75rem 1.5rem'};
            border: none;
            border-radius: ${borderRadius};
            font-size: ${deviceType === 'mobile' ? '0.875rem' : '1rem'};
            cursor: pointer;
            transition: all 0.3s;
        }

        .wireframe-button.primary {
            background-color: ${colors.primary};
            color: white;
        }

        .wireframe-button.secondary {
            background-color: ${colors.secondary};
            color: white;
        }

        .wireframe-button.outline {
            background-color: transparent;
            color: ${colors.primary};
            border: 1px solid ${colors.primary};
        }

        .wireframe-button.ghost {
            background-color: transparent;
            color: ${colors.accent};
        }

        .wireframe-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .list-section {
            margin-bottom: 2rem;
        }

        .list-title {
            color: ${colors.secondary};
            margin-bottom: 1rem;
        }

        .wireframe-list {
            list-style: none;
            background: ${colors.bg};
            border-radius: ${borderRadius};
            padding: 1rem;
            border: 1px solid ${colors.accent};
        }

        .list-item {
            padding: 0.5rem;
            border-bottom: 1px solid ${colors.accent};
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
            background: ${colors.bg};
            border: 2px dashed ${colors.accent};
            border-radius: ${borderRadius};
            padding: ${padding};
            text-align: center;
            min-height: ${deviceType === 'mobile' ? '150px' : '200px'};
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

        /* Layout-specific styles */
        .layout-hero-banner .page-header {
            background: transparent;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10;
            padding: 1rem 2rem;
        }

        .layout-hero-banner .main-content {
            background: linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}20 100%);
            min-height: 60vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 4rem 2rem 2rem;
        }

        .layout-sidebar-layout {
            display: flex;
            min-height: 100vh;
        }

        .layout-sidebar-layout .page-header {
            width: 250px;
            background: ${colors.secondary};
            padding: 2rem 1rem;
            position: fixed;
            height: 100vh;
            left: 0;
            top: 0;
            display: flex;
            flex-direction: column;
        }

        .layout-sidebar-layout .main-content {
            margin-left: 250px;
            padding: 2rem;
            flex: 1;
        }

        .layout-dashboard-grid .main-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            padding: 2rem;
        }

        .layout-dashboard-grid .content-section {
            background: white;
            padding: 1.5rem;
            border-radius: ${borderRadius};
            box-shadow: ${shadows};
            border: 1px solid ${colors.accent}30;
        }

        .layout-centered-content {
            max-width: 800px;
            margin: 0 auto;
        }

        .layout-centered-content .main-content {
            text-align: center;
            padding: 3rem 2rem;
        }

        .layout-landing-page .main-content {
            background: linear-gradient(180deg, ${colors.bg} 0%, ${colors.accent}10 100%);
        }

        .layout-landing-page .content-section:first-child {
            background: linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}15 100%);
            padding: 4rem 2rem;
            text-align: center;
            margin-bottom: 3rem;
            border-radius: ${borderRadius};
        }

        .layout-blog-layout {
            max-width: 1000px;
            margin: 0 auto;
        }

        .layout-blog-layout .main-content {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 3rem;
            padding: 2rem;
        }

        .layout-ecommerce-grid .main-content {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 2rem;
            padding: 2rem;
        }

        .layout-ecommerce-grid .content-section {
            background: white;
            border-radius: ${borderRadius};
            overflow: hidden;
            box-shadow: ${shadows};
            transition: transform 0.2s ease;
            border: 1px solid ${colors.accent}20;
        }

        .layout-ecommerce-grid .content-section:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
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

            .layout-sidebar-layout {
                flex-direction: column;
            }
            
            .layout-sidebar-layout .page-header {
                position: static;
                width: 100%;
                height: auto;
            }
            
            .layout-sidebar-layout .main-content {
                margin-left: 0;
            }
            
            .layout-dashboard-grid .main-content {
                grid-template-columns: 1fr;
            }
            
            .layout-blog-layout .main-content {
                grid-template-columns: 1fr;
            }
            
            .layout-ecommerce-grid .main-content {
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            }

            .layout-hero-banner .page-header {
                position: static;
                background: ${colors.primary};
            }

            .layout-hero-banner .main-content {
                padding: 2rem 1rem;
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {analysisResult.pageRequirements.map((page, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border border-gray-200 hover:border-blue-300 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{page.pageName}</p>
                              <p className="text-xs text-gray-600 mt-1">{page.pageType}</p>
                              {page.purpose && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{page.purpose}</p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                onClick={() => {
                                  // Toggle edit mode for this page
                                  const updatedResult = { ...analysisResult };
                                  updatedResult.pageRequirements[idx] = {
                                    ...page,
                                    isEditing: !page.isEditing
                                  } as PageRequirement;
                                  setAnalysisResult(updatedResult);
                                }}
                              >
                                <Edit2 className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100"
                                onClick={() => {
                                  // Remove this page from analysis results
                                  const updatedResult = { ...analysisResult };
                                  updatedResult.pageRequirements = updatedResult.pageRequirements.filter((_, i) => i !== idx);
                                  updatedResult.totalPages = updatedResult.pageRequirements.length;
                                  setAnalysisResult(updatedResult);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          
                          {page.isEditing && (
                            <div className="mt-3 space-y-2 border-t pt-2">
                              <div>
                                <Label className="text-xs font-medium text-gray-700">Page Name</Label>
                                <Input
                                  value={page.pageName}
                                  onChange={(e) => {
                                    const updatedResult = { ...analysisResult };
                                    const updatedPage = { ...updatedResult.pageRequirements[idx] };
                                    updatedPage.pageName = e.target.value;
                                    updatedResult.pageRequirements[idx] = updatedPage as PageRequirement;
                                    setAnalysisResult(updatedResult);
                                  }}
                                  className="text-xs h-7 mt-1"
                                  placeholder="Enter page name"
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-700">Page Type</Label>
                                <Input
                                  value={page.pageType}
                                  onChange={(e) => {
                                    const updatedResult = { ...analysisResult };
                                    const updatedPage = { ...updatedResult.pageRequirements[idx] };
                                    updatedPage.pageType = e.target.value;
                                    updatedResult.pageRequirements[idx] = updatedPage as PageRequirement;
                                    setAnalysisResult(updatedResult);
                                  }}
                                  className="text-xs h-7 mt-1"
                                  placeholder="Enter page type"
                                />
                              </div>
                              {page.purpose !== undefined && (
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Purpose</Label>
                                  <Textarea
                                    value={page.purpose || ''}
                                    onChange={(e) => {
                                      const updatedResult = { ...analysisResult };
                                      const updatedPage = { ...updatedResult.pageRequirements[idx] };
                                      updatedPage.purpose = e.target.value;
                                      updatedResult.pageRequirements[idx] = updatedPage as PageRequirement;
                                      setAnalysisResult(updatedResult);
                                    }}
                                    className="text-xs min-h-[60px] mt-1"
                                    placeholder="Enter page purpose"
                                  />
                                </div>
                              )}
                              <div className="flex gap-2 pt-1">
                                <Button
                                  size="sm"
                                  className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    const updatedResult = { ...analysisResult };
                                    const updatedPage = { ...updatedResult.pageRequirements[idx] };
                                    updatedPage.isEditing = false;
                                    updatedResult.pageRequirements[idx] = updatedPage as PageRequirement;
                                    setAnalysisResult(updatedResult);
                                  }}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs px-2"
                                  onClick={() => {
                                    const updatedResult = { ...analysisResult };
                                    const updatedPage = { ...updatedResult.pageRequirements[idx] };
                                    updatedPage.isEditing = false;
                                    updatedResult.pageRequirements[idx] = updatedPage as PageRequirement;
                                    setAnalysisResult(updatedResult);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Add New Page Button */}
                    <div className="mt-3 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          const updatedResult = { ...analysisResult };
                          const newPage: PageRequirement = {
                            pageName: "New Page",
                            pageType: "Custom",
                            purpose: "Enter page purpose",
                            stakeholders: [],
                            contentElements: [],
                            userInteractions: [],
                            dataRequirements: [],
                            priority: "medium" as const,
                            isEditing: true
                          };
                          updatedResult.pageRequirements.push(newPage);
                          updatedResult.totalPages = updatedResult.pageRequirements.length;
                          setAnalysisResult(updatedResult);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add New Page
                      </Button>
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
                            <div><strong>Actions:</strong> {page.contentDetails.buttons.slice(0, 3).map(b => safeRenderContent(b.label || b)).join(', ')}</div>
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
                                {safeRenderContent(stakeholder)}
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
            <div className="bg-white rounded-lg w-[90vw] h-[90vh] overflow-hidden">
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
              
              <div className="p-4 overflow-auto h-[calc(90vh-120px)]">
                {/* AI Enhancement Section - Always Visible */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">🤖 AI Code Enhancement</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Describe how you'd like to enhance this page. The AI will improve the HTML, CSS, and add JavaScript functionality while preserving all content.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Enhancement Prompt</Label>
                      <Textarea
                        value={enhancementPrompt}
                        onChange={(e) => setEnhancementPrompt(e.target.value)}
                        placeholder="e.g., Make it more modern with better animations, improve mobile responsiveness, add interactive elements, enhance the color scheme..."
                        className="mt-1 min-h-[100px] resize-none"
                        disabled={isEnhancing}
                      />
                    </div>
                    
                    <Button
                      onClick={handleEnhanceCode}
                      disabled={isEnhancing || !enhancementPrompt.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isEnhancing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enhancing Code...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🚀</span>
                          Enhance Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Enhancement Success Message */}
                {enhancedCode && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-green-800 mb-2">✨ Enhancement Complete</h4>
                    <p className="text-sm text-green-700 mb-2">{enhancedCode.explanation}</p>
                    {enhancedCode.improvements && enhancedCode.improvements.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-800 mb-1">Key Improvements:</p>
                        <ul className="text-sm text-green-700 space-y-1">
                          {enhancedCode.improvements.map((improvement: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      The HTML and CSS tabs below now show your enhanced code.
                    </p>
                  </div>
                )}

                <Tabs defaultValue="preview" className="space-y-4">
                  <TabsList className={enhancedCode ? "grid grid-cols-4" : "grid grid-cols-3"}>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="css">CSS</TabsTrigger>
                    {enhancedCode && <TabsTrigger value="javascript">JavaScript</TabsTrigger>}
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
                  
                  {enhancedCode && (
                    <TabsContent value="javascript">
                      <div className="relative">
                        <Button
                          onClick={() => navigator.clipboard.writeText(enhancedCode.js)}
                          className="absolute top-2 right-2 z-10"
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                          <code>{enhancedCode.js}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  )}
                  
                  <TabsContent value="preview">
                    <div className="space-y-4">
                      {enhancedCode && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              const combinedHtml = `${selectedPageCode.htmlCode}
<style>
${selectedPageCode.cssCode}
</style>
<script>
${enhancedCode.js}
</script>`;
                              const newWindow = window.open('', '_blank');
                              if (newWindow) {
                                newWindow.document.write(combinedHtml);
                                newWindow.document.close();
                              }
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            <Frame className="h-4 w-4 mr-2" />
                            Preview with JavaScript
                          </Button>
                          <Button
                            onClick={() => {
                              const combinedHtml = `${selectedPageCode.htmlCode}
<style>
${selectedPageCode.cssCode}
</style>
<script>
${enhancedCode.js}
</script>`;
                              const blob = new Blob([combinedHtml], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `enhanced_${selectedPageCode.pageName.replace(/\s+/g, '_')}.html`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Complete
                          </Button>
                        </div>
                      )}
                      <div className="border rounded-lg overflow-hidden">
                        <style dangerouslySetInnerHTML={{ __html: selectedPageCode.cssCode }} />
                        <div dangerouslySetInnerHTML={{ __html: selectedPageCode.htmlCode }} />
                      </div>
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
                              {safeRenderContent(stakeholder)}
                            </Badge>
                          ))}
                          {card.stakeholders.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              +{card.stakeholders.length - 3}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Page Layout Selector with Visual Previews */}
                        <div className="pt-2 border-t border-gray-200 w-full mt-[16px] mb-[16px] text-justify ml-[20px] mr-[20px] pl-[0px] pr-[0px]">
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="layout" className="border-0 w-full">
                              <AccordionTrigger className="text-xs font-medium text-gray-700 py-2 hover:no-underline w-full">
                                <div className="flex items-center gap-2 w-full">
                                  🎨 Page Layout: {(() => {
                                    const layoutNames = {
                                      'standard-header': 'Standard Header',
                                      'hero-banner': 'Hero Banner',
                                      'sidebar-layout': 'Sidebar Layout',
                                      'dashboard-grid': 'Dashboard Grid',
                                      'centered-content': 'Centered Content',
                                      'landing-page': 'Landing Page',
                                      'blog-layout': 'Blog Layout',
                                      'ecommerce-grid': 'E-commerce Grid'
                                    };
                                    return layoutNames[pageLayouts[card.id] as keyof typeof layoutNames] || 'Standard Header';
                                  })()}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2 w-full">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                                  {[
                                    {
                                      id: 'standard-header',
                                      name: 'Standard Header',
                                      description: 'Traditional layout',
                                      preview: (
                                        <div className="w-full h-12 bg-white border border-gray-200 rounded-sm overflow-hidden">
                                          <div className="h-2 bg-blue-500"></div>
                                          <div className="p-1 space-y-0.5">
                                            <div className="h-0.5 bg-gray-300 rounded w-1/2"></div>
                                            <div className="h-0.5 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-0.5 bg-gray-200 rounded w-2/3"></div>
                                          </div>
                                        </div>
                                      )
                                    },
                                    {
                                      id: 'hero-banner',
                                      name: 'Hero Banner',
                                      description: 'Large hero section',
                                      preview: (
                                        <div className="w-full h-12 bg-white border border-gray-200 rounded-sm overflow-hidden">
                                          <div className="h-1 bg-purple-500"></div>
                                          <div className="h-5 bg-gradient-to-r from-purple-100 to-blue-100"></div>
                                          <div className="p-1 space-y-0.5">
                                            <div className="h-0.5 bg-gray-200 rounded w-1/3 mx-auto"></div>
                                          </div>
                                        </div>
                                      )
                                    },
                                    {
                                      id: 'sidebar-layout',
                                      name: 'Sidebar Layout',
                                      description: 'Side navigation',
                                      preview: (
                                        <div className="w-full h-12 bg-white border border-gray-200 rounded-sm overflow-hidden flex">
                                          <div className="w-1/4 bg-gray-600"></div>
                                          <div className="flex-1 p-1 space-y-0.5">
                                            <div className="h-0.5 bg-gray-300 rounded"></div>
                                            <div className="h-0.5 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-0.5 bg-gray-200 rounded w-2/3"></div>
                                          </div>
                                        </div>
                                      )
                                    },
                                    {
                                      id: 'dashboard-grid',
                                      name: 'Dashboard Grid',
                                      description: 'Card-based layout',
                                      preview: (
                                        <div className="w-full h-12 bg-white border border-gray-200 rounded-sm overflow-hidden">
                                          <div className="h-1 bg-green-500"></div>
                                          <div className="p-0.5 grid grid-cols-2 gap-0.5">
                                            <div className="h-2 bg-gray-100 border border-gray-200 rounded-sm"></div>
                                            <div className="h-2 bg-gray-100 border border-gray-200 rounded-sm"></div>
                                            <div className="h-2 bg-gray-100 border border-gray-200 rounded-sm"></div>
                                            <div className="h-2 bg-gray-100 border border-gray-200 rounded-sm"></div>
                                          </div>
                                        </div>
                                      )
                                    },
                                    {
                                      id: 'centered-content',
                                      name: 'Centered Content',
                                      description: 'Clean centered',
                                      preview: (
                                        <div className="w-full h-12 bg-white border border-gray-200 rounded-sm overflow-hidden">
                                          <div className="h-1 bg-indigo-500"></div>
                                          <div className="p-1.5 flex justify-center">
                                            <div className="w-3/4 space-y-0.5">
                                              <div className="h-0.5 bg-gray-300 rounded mx-auto"></div>
                                              <div className="h-0.5 bg-gray-200 rounded w-2/3 mx-auto"></div>
                                              <div className="h-0.5 bg-gray-200 rounded w-1/2 mx-auto"></div>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    },
                                    {
                                      id: 'landing-page',
                                      name: 'Landing Page',
                                      description: 'Marketing focus',
                                      preview: (
                                        <div className="w-full h-12 bg-white border border-gray-200 rounded-sm overflow-hidden">
                                          <div className="h-0.5 bg-orange-500"></div>
                                          <div className="h-4 bg-gradient-to-b from-orange-50 to-yellow-50"></div>
                                          <div className="p-1 space-y-0.5">
                                            <div className="h-0.5 bg-gray-300 rounded w-1/2 mx-auto"></div>
                                            <div className="h-0.5 bg-orange-300 rounded w-1/4 mx-auto"></div>
                                          </div>
                                        </div>
                                      )
                                    },
                                    {
                                      id: 'blog-layout',
                                      name: 'Blog Layout',
                                      description: 'Article focused',
                                      preview: (
                                        <div className="w-full h-12 bg-white border border-gray-200 rounded-sm overflow-hidden">
                                          <div className="h-1 bg-teal-500"></div>
                                          <div className="p-1 space-y-0.5">
                                            <div className="h-0.5 bg-gray-400 rounded w-3/4"></div>
                                            <div className="h-0.5 bg-gray-200 rounded"></div>
                                            <div className="h-0.5 bg-gray-200 rounded"></div>
                                            <div className="h-0.5 bg-gray-200 rounded w-5/6"></div>
                                          </div>
                                        </div>
                                      )
                                    },
                                    {
                                      id: 'ecommerce-grid',
                                      name: 'E-commerce Grid',
                                      description: 'Product showcase',
                                      preview: (
                                        <div className="w-full h-12 bg-white border border-gray-200 rounded-sm overflow-hidden">
                                          <div className="h-1 bg-pink-500"></div>
                                          <div className="p-0.5 grid grid-cols-3 gap-0.5">
                                            <div className="h-2.5 bg-gray-100 border border-gray-200 rounded-sm"></div>
                                            <div className="h-2.5 bg-gray-100 border border-gray-200 rounded-sm"></div>
                                            <div className="h-2.5 bg-gray-100 border border-gray-200 rounded-sm"></div>
                                          </div>
                                        </div>
                                      )
                                    }
                                  ].map((layout) => (
                                    <div
                                      key={layout.id}
                                      className={`cursor-pointer border rounded-md p-2 transition-all duration-200 hover:shadow-sm ${
                                        (pageLayouts[card.id] || 'standard-header') === layout.id
                                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                                          : 'border-gray-200 bg-white hover:border-gray-300'
                                      }`}
                                      onClick={() => {
                                        setPageLayouts(prev => ({
                                          ...prev,
                                          [card.id]: layout.id
                                        }));
                                      }}
                                    >
                                      <div className="mb-1">
                                        {layout.preview}
                                      </div>
                                      <div className="text-center">
                                        <h4 className="text-xs font-medium text-gray-800 mb-0.5">{layout.name}</h4>
                                        <p className="text-xs text-gray-500">{layout.description}</p>
                                      </div>
                                      {(pageLayouts[card.id] || 'standard-header') === layout.id && (
                                        <div className="mt-1 flex justify-center">
                                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
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
                  
                  <CardContent className="p-3">
                    <Tabs defaultValue="content" className="w-full">
                      <TabsList className="grid w-full grid-cols-5 h-7 bg-gray-50">
                        <TabsTrigger value="content" className="text-xs py-1">📝 Content</TabsTrigger>
                        <TabsTrigger value="forms" className="text-xs py-1">📋 Forms</TabsTrigger>
                        <TabsTrigger value="buttons" className="text-xs py-1">🔘 Buttons</TabsTrigger>
                        <TabsTrigger value="media" className="text-xs py-1">🖼️ Media</TabsTrigger>
                        <TabsTrigger value="navigation" className="text-xs py-1">🧭 Nav</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="content" className="mt-2 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            📰 Headers
                            {card.isEdited && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-blue-50"
                                onClick={() => {
                                  const updatedCards = [...pageContentCards];
                                  updatedCards[index].headers.push("New Header");
                                  setPageContentCards(updatedCards);
                                }}
                              >
                                <Plus className="h-3 w-3 text-blue-500" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1">
                            {card.headers.map((header, idx) => (
                              <div key={idx} className="group flex items-center gap-1">
                                <div className="flex-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-xs">
                                  {card.isEdited ? (
                                    <Input
                                      value={header}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].headers[idx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-xs h-5 border-0 bg-transparent p-0"
                                      placeholder="Header text"
                                    />
                                  ) : (
                                    safeRenderContent(header)
                                  )}
                                </div>
                                {card.isEdited && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                                    onClick={() => {
                                      const updatedCards = [...pageContentCards];
                                      updatedCards[index].headers.splice(idx, 1);
                                      setPageContentCards(updatedCards);
                                    }}
                                  >
                                    <Trash2 className="h-2.5 w-2.5 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            📝 Text Content
                            {card.isEdited && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-green-50"
                                onClick={() => {
                                  const updatedCards = [...pageContentCards];
                                  updatedCards[index].textContent.push("New text content");
                                  setPageContentCards(updatedCards);
                                }}
                              >
                                <Plus className="h-3 w-3 text-green-500" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1">
                            {card.textContent.map((text, idx) => (
                              <div key={idx} className="group flex gap-1">
                                <div className="flex-1 px-2 py-1 bg-green-50 border border-green-100 rounded text-xs">
                                  {card.isEdited ? (
                                    <Textarea
                                      value={text}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].textContent[idx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-xs min-h-[40px] border-0 bg-transparent p-0 resize-none"
                                      placeholder="Enter text content"
                                    />
                                  ) : (
                                    <span className="break-words">{safeRenderContent(text)}</span>
                                  )}
                                </div>
                                {card.isEdited && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 self-start mt-1"
                                    onClick={() => {
                                      const updatedCards = [...pageContentCards];
                                      updatedCards[index].textContent.splice(idx, 1);
                                      setPageContentCards(updatedCards);
                                    }}
                                  >
                                    <Trash2 className="h-2.5 w-2.5 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="forms" className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                          📋 Forms
                          {card.isEdited && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-purple-50"
                              onClick={() => {
                                const updatedCards = [...pageContentCards];
                                updatedCards[index].forms.push({
                                  title: "New Form",
                                  fields: ["Field 1"],
                                  submitAction: "Submit"
                                });
                                setPageContentCards(updatedCards);
                              }}
                            >
                              <Plus className="h-3 w-3 text-purple-500" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {card.forms.map((form, formIdx) => (
                            <div key={formIdx} className="group border border-purple-100 rounded p-2 bg-purple-50 relative">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex-1">
                                  {card.isEdited ? (
                                    <Input
                                      value={form.title}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].forms[formIdx].title = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-xs h-5 border-0 bg-transparent p-0 font-medium"
                                      placeholder="Form title"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">{form.title}</span>
                                  )}
                                </div>
                                {card.isEdited && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                                    onClick={() => {
                                      const updatedCards = [...pageContentCards];
                                      updatedCards[index].forms.splice(formIdx, 1);
                                      setPageContentCards(updatedCards);
                                    }}
                                  >
                                    <Trash2 className="h-2 w-2 text-red-500" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex gap-2 text-xs">
                                <div className="flex-1">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="text-gray-600">Fields:</span>
                                    {card.isEdited && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-3 w-3 p-0 hover:bg-blue-50"
                                        onClick={() => {
                                          const updatedCards = [...pageContentCards];
                                          updatedCards[index].forms[formIdx].fields.push("New Field");
                                          setPageContentCards(updatedCards);
                                        }}
                                      >
                                        <Plus className="h-2 w-2 text-blue-400" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="space-y-0.5">
                                    {form.fields.map((field, fieldIdx) => (
                                      <div key={fieldIdx} className="flex items-center gap-1">
                                        <div className="flex-1 px-1 py-0.5 bg-white border border-purple-200 rounded text-xs">
                                          {card.isEdited ? (
                                            <Input
                                              value={field}
                                              onChange={(e) => {
                                                const updatedCards = [...pageContentCards];
                                                updatedCards[index].forms[formIdx].fields[fieldIdx] = e.target.value;
                                                setPageContentCards(updatedCards);
                                              }}
                                              className="text-xs h-4 border-0 bg-transparent p-0"
                                              placeholder="Field name"
                                            />
                                          ) : (
                                            field
                                          )}
                                        </div>
                                        {card.isEdited && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-3 w-3 p-0 hover:bg-red-50"
                                            onClick={() => {
                                              const updatedCards = [...pageContentCards];
                                              updatedCards[index].forms[formIdx].fields.splice(fieldIdx, 1);
                                              setPageContentCards(updatedCards);
                                            }}
                                          >
                                            <Trash2 className="h-1.5 w-1.5 text-red-400" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="w-20">
                                  <div className="text-gray-600 mb-1">Action:</div>
                                  <div className="px-1 py-0.5 bg-white border border-purple-200 rounded text-xs">
                                    {card.isEdited ? (
                                      <Input
                                        value={form.submitAction}
                                        onChange={(e) => {
                                          const updatedCards = [...pageContentCards];
                                          updatedCards[index].forms[formIdx].submitAction = e.target.value;
                                          setPageContentCards(updatedCards);
                                        }}
                                        className="text-xs h-4 border-0 bg-transparent p-0"
                                        placeholder="Submit"
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
                      
                      <TabsContent value="buttons" className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                          🔘 Buttons
                          {card.isEdited && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-orange-50"
                              onClick={() => {
                                const updatedCards = [...pageContentCards];
                                updatedCards[index].buttons.push({
                                  label: "New Button",
                                  action: "Click action",
                                  style: "primary"
                                });
                                setPageContentCards(updatedCards);
                              }}
                            >
                              <Plus className="h-3 w-3 text-orange-500" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {card.buttons.map((button, btnIdx) => (
                            <div key={btnIdx} className="group flex items-center gap-2 p-2 border border-orange-100 rounded bg-orange-50">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    {card.isEdited ? (
                                      <Input
                                        value={button.label}
                                        onChange={(e) => {
                                          const updatedCards = [...pageContentCards];
                                          updatedCards[index].buttons[btnIdx].label = e.target.value;
                                          setPageContentCards(updatedCards);
                                        }}
                                        className="text-xs h-4 border-0 bg-transparent p-0 font-medium"
                                        placeholder="Button label"
                                      />
                                    ) : (
                                      <span className="text-xs font-medium">{button.label}</span>
                                    )}
                                  </div>
                                  <div className="w-16">
                                    {card.isEdited ? (
                                      <Select 
                                        value={button.style} 
                                        onValueChange={(value) => {
                                          const updatedCards = [...pageContentCards];
                                          updatedCards[index].buttons[btnIdx].style = value;
                                          setPageContentCards(updatedCards);
                                        }}
                                      >
                                        <SelectTrigger className="h-5 text-xs border-orange-200">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="primary">Primary</SelectItem>
                                          <SelectItem value="secondary">Secondary</SelectItem>
                                          <SelectItem value="outline">Outline</SelectItem>
                                          <SelectItem value="ghost">Ghost</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <span className="text-xs px-1 py-0.5 bg-orange-200 rounded">{button.style}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-600">
                                  {card.isEdited ? (
                                    <Input
                                      value={button.action}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].buttons[btnIdx].action = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-xs h-4 border-0 bg-transparent p-0"
                                      placeholder="Button action"
                                    />
                                  ) : (
                                    button.action
                                  )}
                                </div>
                              </div>
                              {card.isEdited && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                                  onClick={() => {
                                    const updatedCards = [...pageContentCards];
                                    updatedCards[index].buttons.splice(btnIdx, 1);
                                    setPageContentCards(updatedCards);
                                  }}
                                >
                                  <Trash2 className="h-2 w-2 text-red-500" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="media" className="mt-2 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            🖼️ Images
                            {card.isEdited && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-indigo-50"
                                onClick={() => {
                                  const updatedCards = [...pageContentCards];
                                  updatedCards[index].images.push({
                                    alt: "New Image",
                                    description: "Image description",
                                    position: "center"
                                  });
                                  setPageContentCards(updatedCards);
                                }}
                              >
                                <Plus className="h-3 w-3 text-indigo-500" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1">
                            {card.images.map((image, imgIdx) => (
                              <div key={imgIdx} className="group flex gap-2 p-2 border border-indigo-100 rounded bg-indigo-50">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-1">
                                    <div className="flex-1">
                                      {card.isEdited ? (
                                        <Input
                                          value={image.alt}
                                          onChange={(e) => {
                                            const updatedCards = [...pageContentCards];
                                            updatedCards[index].images[imgIdx].alt = e.target.value;
                                            setPageContentCards(updatedCards);
                                          }}
                                          className="text-xs h-4 border-0 bg-transparent p-0 font-medium"
                                          placeholder="Alt text"
                                        />
                                      ) : (
                                        <span className="text-xs font-medium">{image.alt}</span>
                                      )}
                                    </div>
                                    <div className="w-16">
                                      {card.isEdited ? (
                                        <Select 
                                          value={image.position} 
                                          onValueChange={(value) => {
                                            const updatedCards = [...pageContentCards];
                                            updatedCards[index].images[imgIdx].position = value;
                                            setPageContentCards(updatedCards);
                                          }}
                                        >
                                          <SelectTrigger className="h-5 text-xs border-indigo-200">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="top">Top</SelectItem>
                                            <SelectItem value="center">Center</SelectItem>
                                            <SelectItem value="bottom">Bottom</SelectItem>
                                            <SelectItem value="left">Left</SelectItem>
                                            <SelectItem value="right">Right</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className="text-xs px-1 py-0.5 bg-indigo-200 rounded">{image.position}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {card.isEdited ? (
                                      <Input
                                        value={image.description}
                                        onChange={(e) => {
                                          const updatedCards = [...pageContentCards];
                                          updatedCards[index].images[imgIdx].description = e.target.value;
                                          setPageContentCards(updatedCards);
                                        }}
                                        className="text-xs h-4 border-0 bg-transparent p-0"
                                        placeholder="Description"
                                      />
                                    ) : (
                                      image.description
                                    )}
                                  </div>
                                </div>
                                {card.isEdited && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                                    onClick={() => {
                                      const updatedCards = [...pageContentCards];
                                      updatedCards[index].images.splice(imgIdx, 1);
                                      setPageContentCards(updatedCards);
                                    }}
                                  >
                                    <Trash2 className="h-2 w-2 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            📋 Lists
                            {card.isEdited && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-teal-50"
                                onClick={() => {
                                  const updatedCards = [...pageContentCards];
                                  updatedCards[index].lists.push({
                                    title: "New List",
                                    type: "unordered",
                                    items: ["Item 1"]
                                  });
                                  setPageContentCards(updatedCards);
                                }}
                              >
                                <Plus className="h-3 w-3 text-teal-500" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1">
                            {card.lists.map((list, listIdx) => (
                              <div key={listIdx} className="group border border-teal-100 rounded p-2 bg-teal-50">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex-1">
                                    {card.isEdited ? (
                                      <Input
                                        value={list.title}
                                        onChange={(e) => {
                                          const updatedCards = [...pageContentCards];
                                          updatedCards[index].lists[listIdx].title = e.target.value;
                                          setPageContentCards(updatedCards);
                                        }}
                                        className="text-xs h-4 border-0 bg-transparent p-0 font-medium"
                                        placeholder="List title"
                                      />
                                    ) : (
                                      <span className="text-xs font-medium">{list.title}</span>
                                    )}
                                  </div>
                                  {card.isEdited && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                                      onClick={() => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].lists.splice(listIdx, 1);
                                        setPageContentCards(updatedCards);
                                      }}
                                    >
                                      <Trash2 className="h-2 w-2 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="flex-1">
                                    {card.isEdited ? (
                                      <Select 
                                        value={list.type} 
                                        onValueChange={(value) => {
                                          const updatedCards = [...pageContentCards];
                                          updatedCards[index].lists[listIdx].type = value;
                                          setPageContentCards(updatedCards);
                                        }}
                                      >
                                        <SelectTrigger className="h-5 text-xs border-teal-200">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="ordered">Ordered</SelectItem>
                                          <SelectItem value="unordered">Unordered</SelectItem>
                                          <SelectItem value="checklist">Checklist</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <span className="text-xs text-gray-600">{list.type} • {list.items.length} items</span>
                                    )}
                                  </div>
                                  {card.isEdited && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 hover:bg-blue-50"
                                      onClick={() => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].lists[listIdx].items.push("New item");
                                        setPageContentCards(updatedCards);
                                      }}
                                    >
                                      <Plus className="h-2 w-2 text-blue-400" />
                                    </Button>
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  {list.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center gap-1">
                                      <div className="flex-1 px-1 py-0.5 bg-white border border-teal-200 rounded text-xs">
                                        {card.isEdited ? (
                                          <Input
                                            value={item}
                                            onChange={(e) => {
                                              const updatedCards = [...pageContentCards];
                                              updatedCards[index].lists[listIdx].items[itemIdx] = e.target.value;
                                              setPageContentCards(updatedCards);
                                            }}
                                            className="text-xs h-4 border-0 bg-transparent p-0"
                                            placeholder="List item"
                                          />
                                        ) : (
                                          `• ${item}`
                                        )}
                                      </div>
                                      {card.isEdited && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-4 w-4 p-0 hover:bg-red-50"
                                          onClick={() => {
                                            const updatedCards = [...pageContentCards];
                                            updatedCards[index].lists[listIdx].items.splice(itemIdx, 1);
                                            setPageContentCards(updatedCards);
                                          }}
                                        >
                                          <Trash2 className="h-1.5 w-1.5 text-red-400" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="navigation" className="mt-2 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            🧭 Navigation
                            {card.isEdited && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-cyan-50"
                                onClick={() => {
                                  const updatedCards = [...pageContentCards];
                                  updatedCards[index].navigation.push("New Nav Item");
                                  setPageContentCards(updatedCards);
                                }}
                              >
                                <Plus className="h-3 w-3 text-cyan-500" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1">
                            {card.navigation.map((navItem, navIdx) => (
                              <div key={navIdx} className="group flex items-center gap-1">
                                <div className="flex-1 px-2 py-1 bg-cyan-50 border border-cyan-100 rounded text-xs">
                                  {card.isEdited ? (
                                    <Input
                                      value={navItem}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].navigation[navIdx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-xs h-5 border-0 bg-transparent p-0"
                                      placeholder="Navigation item"
                                    />
                                  ) : (
                                    safeRenderContent(navItem)
                                  )}
                                </div>
                                {card.isEdited && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                                    onClick={() => {
                                      const updatedCards = [...pageContentCards];
                                      updatedCards[index].navigation.splice(navIdx, 1);
                                      setPageContentCards(updatedCards);
                                    }}
                                  >
                                    <Trash2 className="h-2.5 w-2.5 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            ➕ Additional Content
                            {card.isEdited && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-pink-50"
                                onClick={() => {
                                  const updatedCards = [...pageContentCards];
                                  updatedCards[index].additionalContent.push("New content");
                                  setPageContentCards(updatedCards);
                                }}
                              >
                                <Plus className="h-3 w-3 text-pink-500" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1">
                            {card.additionalContent.map((content, contentIdx) => (
                              <div key={contentIdx} className="group flex gap-1">
                                <div className="flex-1 px-2 py-1 bg-pink-50 border border-pink-100 rounded text-xs">
                                  {card.isEdited ? (
                                    <Textarea
                                      value={content}
                                      onChange={(e) => {
                                        const updatedCards = [...pageContentCards];
                                        updatedCards[index].additionalContent[contentIdx] = e.target.value;
                                        setPageContentCards(updatedCards);
                                      }}
                                      className="text-xs min-h-[40px] border-0 bg-transparent p-0 resize-none"
                                      placeholder="Additional content"
                                    />
                                  ) : (
                                    <span className="break-words">{safeRenderContent(content)}</span>
                                  )}
                                </div>
                                {card.isEdited && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 self-start mt-1"
                                    onClick={() => {
                                      const updatedCards = [...pageContentCards];
                                      updatedCards[index].additionalContent.splice(contentIdx, 1);
                                      setPageContentCards(updatedCards);
                                    }}
                                  >
                                    <Trash2 className="h-2.5 w-2.5 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Wireframe Generation Options */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Wireframe Generation Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Device Type Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Device Type</Label>
                  <Select value={selectedDeviceType} onValueChange={(value: 'mobile' | 'tablet' | 'desktop') => setSelectedDeviceType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile (375px)</SelectItem>
                      <SelectItem value="tablet">Tablet (768px)</SelectItem>
                      <SelectItem value="desktop">Desktop (1200px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Scheme Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Color Scheme</Label>
                  <Select value={selectedColorScheme} onValueChange={setSelectedColorScheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern-blue">Modern Blue</SelectItem>
                      <SelectItem value="professional-gray">Professional Gray</SelectItem>
                      <SelectItem value="vibrant-green">Vibrant Green</SelectItem>
                      <SelectItem value="elegant-purple">Elegant Purple</SelectItem>
                      <SelectItem value="warm-orange">Warm Orange</SelectItem>
                      <SelectItem value="corporate-navy">Corporate Navy</SelectItem>
                      <SelectItem value="minimalist-black">Minimalist Black</SelectItem>
                      <SelectItem value="fresh-teal">Fresh Teal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Design Type Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Design Type</Label>
                  <Select value={selectedDesignType} onValueChange={setSelectedDesignType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple & Clean</SelectItem>
                      <SelectItem value="modern">Modern & Trendy</SelectItem>
                      <SelectItem value="corporate">Corporate & Formal</SelectItem>
                      <SelectItem value="professional">Professional & Polished</SelectItem>
                      <SelectItem value="creative">Creative & Artistic</SelectItem>
                      <SelectItem value="minimal">Minimal & Elegant</SelectItem>
                      <SelectItem value="bold">Bold & Dynamic</SelectItem>
                      <SelectItem value="classic">Classic & Traditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Generate Wireframes Button */}
              <div className="flex justify-center pt-4 border-t border-gray-200">
                <Button
                  onClick={handleGenerateWireframes}
                  disabled={isGeneratingWireframes || pageContentCards.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {isGeneratingWireframes ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Wireframes...
                    </>
                  ) : (
                    <>
                      <Frame className="h-5 w-5 mr-2" />
                      Generate Wireframes ({pageContentCards.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Wireframes Display */}
        {generatedWireframes.length > 0 && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
              <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Generated Wireframes ({generatedWireframes.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {generatedWireframes.map((wireframe, index) => (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gray-200 text-gray-700 py-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gray-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex justify-between items-center relative z-10">
                        <CardTitle className="text-sm font-semibold truncate flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                          {wireframe.pageName}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-gray-300/50 text-gray-600"
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
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-gray-300/50 text-gray-600"
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
                    
                    <CardContent className="p-4">
                      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:border-blue-200 transition-colors duration-300">
                        <div className="bg-gradient-to-r from-gray-200 to-gray-300 px-3 py-2 border-b border-gray-300">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                            </div>
                            <div className="flex-1 bg-white rounded px-2 py-1 text-xs text-gray-600 truncate font-mono">
                              {wireframe.pageName.toLowerCase().replace(/\s+/g, '-')}.html
                            </div>
                          </div>
                        </div>
                        
                        <div className="relative h-80 bg-white">
                          <iframe
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
                      </div>
                      
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
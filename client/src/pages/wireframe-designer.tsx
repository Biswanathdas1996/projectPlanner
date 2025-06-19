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
import { BrandGuidelinesStorage, type StoredBrandGuideline } from "@/lib/brand-guidelines-storage";
import { storage } from "@/lib/storage-utils";
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
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandExtractionError, setBrandExtractionError] = useState<string>('');
  const [storedBrandGuidelines, setStoredBrandGuidelines] = useState<StoredBrandGuideline[]>([]);
  const [selectedStoredGuideline, setSelectedStoredGuideline] = useState<string>("");
  const [isGeneratingUnifiedHTML, setIsGeneratingUnifiedHTML] = useState(false);
  const [unifiedHTMLResult, setUnifiedHTMLResult] = useState<{ html: string; css: string; js: string } | null>(null);

  // Helper function to get the best version of a wireframe (enhanced if available, original otherwise)
  const getBestWireframeVersion = (pageName: string) => {
    const enhancedWireframes = JSON.parse(localStorage.getItem('generated_wireframes') || '[]');
    const enhancedVersion = enhancedWireframes.find((w: any) => w.pageName === pageName && w.isEnhanced);
    
    if (enhancedVersion) {
      return {
        pageName: enhancedVersion.pageName,
        htmlCode: enhancedVersion.htmlCode,
        cssCode: enhancedVersion.cssCode,
        jsCode: enhancedVersion.jsCode,
        isEnhanced: true,
        lastUpdated: enhancedVersion.lastUpdated,
        lastEnhancedElement: enhancedVersion.lastEnhancedElement,
        enhancementExplanation: enhancedVersion.enhancementExplanation
      };
    }
    
    // Fallback to original if no enhanced version exists
    const originalPage = detailedWireframes.find(page => page.pageName === pageName);
    if (originalPage) {
      return {
        pageName: originalPage.pageName,
        htmlCode: originalPage.htmlContent,
        cssCode: originalPage.cssStyles,
        jsCode: '',
        isEnhanced: false
      };
    }
    
    return null;
  };

  // Load saved data and stored brand guidelines
  useEffect(() => {
    // Load stored brand guidelines
    const stored = BrandGuidelinesStorage.getAll();
    setStoredBrandGuidelines(stored);
    
    // Load the most recent brand guidelines if available
    const latest = BrandGuidelinesStorage.getLatest();
    if (latest && !brandGuidelines) {
      setBrandGuidelines(latest);
    }
    
    const savedWireframes = storage.getItem('wireframe_designs');
    const savedPageContent = storage.getItem('page_content_cards');
    const savedGeneratedWireframes = storage.getItem('generated_wireframes');
    const savedAnalysisResult = storage.getItem('analysis_result');
    const savedPageLayouts = storage.getItem('page_layouts');
    
    if (savedWireframes) {
      setWireframes(savedWireframes);
    }
    if (savedPageContent) {
      setPageContentCards(savedPageContent);
    }
    if (savedGeneratedWireframes) {
      // Ensure we have a valid array
      let parsedWireframes = savedGeneratedWireframes;
      
      if (!Array.isArray(parsedWireframes)) {
        console.log('Loading generated wireframes from localStorage:', parsedWireframes, 'wireframes found');
        // If it's not an array, try to convert or initialize as empty array
        parsedWireframes = [];
      } else {
        console.log('Loading generated wireframes from storage:', parsedWireframes.length, 'wireframes found');
      }
      
      if (parsedWireframes.length > 0) {
        // Check if wireframes have IDs, if not, add them (migration)
        const wireframesWithIds = parsedWireframes.map((wireframe: any) => {
          if (!wireframe.id) {
            console.log('Adding missing ID to wireframe:', wireframe.pageName);
            wireframe.id = `wireframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          }
          return wireframe;
        });
        
        // Save back to storage if we added IDs
        const needsUpdate = wireframesWithIds.some((w: any, idx: number) => w.id !== parsedWireframes[idx]?.id);
        if (needsUpdate) {
          console.log('Updating storage with IDs for existing wireframes');
          storage.setItem('generated_wireframes', wireframesWithIds);
        }
        
        // Check for enhanced wireframes
        const enhancedCount = wireframesWithIds.filter((w: any) => w.isEnhanced).length;
        if (enhancedCount > 0) {
          console.log(`Found ${enhancedCount} enhanced wireframes in localStorage`);
          console.log('Enhanced wireframes:', wireframesWithIds.filter((w: any) => w.isEnhanced).map((w: any) => ({ 
            id: w.id,
            pageName: w.pageName, 
            isEnhanced: w.isEnhanced, 
            lastUpdated: w.lastUpdated 
          })));
        }
        
        console.log('All wireframes with IDs:', wireframesWithIds.map((w: any) => ({ id: w.id, pageName: w.pageName })));
        setGeneratedWireframes(wireframesWithIds);
      }
    }
    if (savedAnalysisResult) {
      setAnalysisResult(savedAnalysisResult);
    }
    if (savedPageLayouts) {
      setPageLayouts(savedPageLayouts);
    }
  }, [detailedWireframes]);

  // Listen for changes in HTML editor data and update wireframes
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedWireframes = storage.getItem('generated_wireframes');
      if (updatedWireframes && Array.isArray(updatedWireframes)) {
        setGeneratedWireframes(updatedWireframes);
      }
    };

    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', handleStorageChange);
    
    // Set up polling to check for updates every 500ms for immediate sync
    const pollInterval = setInterval(() => {
      const currentWireframes = storage.getItem('generated_wireframes');
      if (currentWireframes && Array.isArray(currentWireframes)) {
        // Check if any wireframe has been updated since last check
        const hasUpdates = currentWireframes.some((wireframe: any) => {
          const existing = generatedWireframes.find((w: any) => w.id === wireframe.id);
          return existing && wireframe.lastUpdated && existing.lastUpdated !== wireframe.lastUpdated;
        });
        
        // Also check for HTML editor specific updates
        const hasEditorUpdates = currentWireframes.some((wireframe: any) => {
          const editorData = storage.getItem(`html_editor_${wireframe.id}`);
          if (editorData) {
            const existing = generatedWireframes.find((w: any) => w.id === wireframe.id);
            return existing && editorData.lastSaved && 
                   (!existing.lastEditorSync || editorData.lastSaved > existing.lastEditorSync);
          }
          return false;
        });
        
        if (hasUpdates || hasEditorUpdates) {
          console.log('Detected wireframe updates, refreshing preview...');
          setIsRefreshing(true);
          
          // Merge HTML editor data with wireframes
          const syncedWireframes = currentWireframes.map((wireframe: any) => {
            const editorData = storage.getItem(`html_editor_${wireframe.id}`);
            if (editorData && editorData.lastSaved) {
              return {
                ...wireframe,
                htmlCode: editorData.htmlCode || wireframe.htmlCode,
                cssCode: editorData.cssCode || wireframe.cssCode,
                jsCode: editorData.jsCode || wireframe.jsCode,
                lastUpdated: editorData.lastSaved,
                lastEditorSync: editorData.lastSaved
              };
            }
            return wireframe;
          });
          
          setGeneratedWireframes(syncedWireframes);
          
          // Reset refresh indicator after a short delay
          setTimeout(() => setIsRefreshing(false), 500);
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [generatedWireframes]);

  // Save wireframes to storage
  useEffect(() => {
    if (wireframes.length > 0) {
      storage.setItem('wireframe_designs', wireframes);
    }
  }, [wireframes]);

  // Save page content cards to storage
  useEffect(() => {
    if (pageContentCards.length > 0) {
      storage.setItem('page_content_cards', pageContentCards);
    }
  }, [pageContentCards]);

  // Save generated wireframes to storage
  useEffect(() => {
    if (generatedWireframes.length > 0) {
      storage.setItem('generated_wireframes', generatedWireframes);
    }
  }, [generatedWireframes]);

  // Save page layouts to storage
  useEffect(() => {
    storage.setItem('page_layouts', pageLayouts);
  }, [pageLayouts]);

  // Save analysis results to storage
  useEffect(() => {
    if (analysisResult) {
      storage.setItem('analysis_result', analysisResult);
    }
  }, [analysisResult]);

  // Analyze stakeholder flows using AI
  const analyzeStakeholderFlows = async () => {
    setIsAnalyzing(true);
    setError("");
    
    try {
      const stakeholderFlows = storage.getItem('stakeholder_flows') || [];
      const flowTypes = storage.getItem('flow_types') || {};
      const projectDescription = storage.getItem('project_description') || '';

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
      const wireframes: { id: string; pageName: string; htmlCode: string; cssCode: string; jsCode: string; isEnhanced: boolean }[] = [];
      
      for (let i = 0; i < pageContentCards.length; i++) {
        const card = pageContentCards[i];
        
        setWireframeGenerationProgress({ 
          current: i + 1, 
          total: pageContentCards.length, 
          currentPage: card.pageName 
        });
        
        const wireframe = await generatePageWireframe(card);
        const wireframeWithId = {
          id: `wireframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...wireframe,
          isEnhanced: false
        };
        wireframes.push(wireframeWithId);
      }
      
      // Save wireframes to localStorage with complete data
      const wireframeData = wireframes.map(w => ({
        ...w,
        deviceType: selectedDeviceType,
        colorScheme: selectedColorScheme,
        designType: selectedDesignType,
        timestamp: new Date().toISOString()
      }));
      console.log('Saving initial wireframes to localStorage:', wireframeData);
      localStorage.setItem('generated_wireframes', JSON.stringify(wireframes));
      
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
      // First, check for HTML editor data to get the latest code
      const wireframe = generatedWireframes.find(w => w.pageName === selectedPageCode.pageName);
      let latestHtmlCode = selectedPageCode.htmlCode;
      let latestCssCode = selectedPageCode.cssCode;
      let latestJsCode = selectedPageCode.jsCode;
      
      if (wireframe?.id) {
        const editorData = storage.getItem(`html_editor_${wireframe.id}`);
        if (editorData && editorData.lastSaved) {
          console.log('Using latest HTML editor data for enhancement');
          latestHtmlCode = editorData.htmlCode || selectedPageCode.htmlCode;
          latestCssCode = editorData.cssCode || selectedPageCode.cssCode;
          latestJsCode = editorData.jsCode || selectedPageCode.jsCode;
        }
      }

      const enhancer = createAICodeEnhancer();
      const request: CodeEnhancementRequest = {
        htmlCode: latestHtmlCode,
        cssCode: latestCssCode,
        prompt: enhancementPrompt,
        pageName: selectedPageCode.pageName
      };

      const enhanced = await enhancer.enhanceCode(request);
      setEnhancedCode(enhanced);

      // Update the selected page code with enhanced versions
      const updatedPageCode = {
        pageName: selectedPageCode.pageName,
        htmlCode: enhanced.html,
        cssCode: enhanced.css,
        jsCode: enhanced.js
      };
      setSelectedPageCode(updatedPageCode);

      // Update localStorage with enhanced wireframe data
      const existingWireframes = JSON.parse(localStorage.getItem('wireframeData') || '[]');
      console.log('Existing wireframes:', existingWireframes);
      console.log('Looking for page:', selectedPageCode.pageName);
      
      const updatedWireframes = existingWireframes.map((wireframe: any) => {
        if (wireframe.pageName === selectedPageCode.pageName) {
          console.log('Found matching wireframe, updating...');
          return {
            ...wireframe,
            htmlCode: enhanced.html,
            cssCode: enhanced.css,
            jsCode: enhanced.js,
            isEnhanced: true,
            lastUpdated: new Date().toISOString()
          };
        }
        return wireframe;
      });
      
      console.log('Updated wireframes:', updatedWireframes);
      localStorage.setItem('wireframeData', JSON.stringify(updatedWireframes));
      
      // Verify data was saved correctly
      const savedData = JSON.parse(localStorage.getItem('wireframeData') || '[]');
      const savedPage = savedData.find((w: any) => w.pageName === selectedPageCode.pageName);
      console.log('Verification - saved enhanced page:', savedPage);
      
      // Also update the current generated wireframes state
      setGeneratedWireframes(prev => prev.map(wireframe => {
        if (wireframe.pageName === selectedPageCode.pageName) {
          return {
            ...wireframe,
            htmlCode: enhanced.html,
            cssCode: enhanced.css,
            jsCode: enhanced.js
          };
        }
        return wireframe;
      }));

      toast({
        title: "Code Enhanced Successfully",
        description: "Enhanced code saved to localStorage and tabs updated.",
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

  // Save HTML Editor data to wireframes
  const handleSaveEditorData = () => {
    if (!selectedPageCode) return;

    const wireframe = generatedWireframes.find(w => w.pageName === selectedPageCode.pageName);
    if (!wireframe?.id) {
      toast({
        title: "Error",
        description: "Could not find wireframe ID for this page.",
        variant: "destructive",
      });
      return;
    }

    // Get latest HTML editor data
    const editorData = storage.getItem(`html_editor_${wireframe.id}`);
    if (!editorData) {
      toast({
        title: "No Changes Found",
        description: "No HTML editor data found for this wireframe.",
        variant: "destructive",
      });
      return;
    }

    console.log('Saving HTML editor data to wireframes:', editorData);

    // Update the wireframes with HTML editor data
    const updatedWireframes = generatedWireframes.map(w => {
      if (w.id === wireframe.id) {
        return {
          ...w,
          htmlCode: editorData.htmlCode || w.htmlCode,
          cssCode: editorData.cssCode || w.cssCode,
          jsCode: editorData.jsCode || w.jsCode,
          isEnhanced: true,
          lastUpdated: editorData.lastSaved || new Date().toISOString(),
          lastEnhancedElement: 'HTML Editor',
          lastEditorSync: editorData.lastSaved
        };
      }
      return w;
    });

    // Update storage and state
    storage.setItem('generated_wireframes', updatedWireframes);
    setGeneratedWireframes(updatedWireframes);

    // Update selected page code for immediate preview
    setSelectedPageCode({
      pageName: selectedPageCode.pageName,
      htmlCode: editorData.htmlCode || selectedPageCode.htmlCode,
      cssCode: editorData.cssCode || selectedPageCode.cssCode,
      jsCode: editorData.jsCode || selectedPageCode.jsCode
    });

    toast({
      title: "Code Saved Successfully",
      description: "HTML editor changes have been saved to the wireframe.",
    });
  };

  // Generate individual brand-compliant wireframes for each page content section
  const generateUnifiedHTML = async () => {
    if (!brandGuidelines || pageContentCards.length === 0) {
      toast({
        title: "Missing Requirements",
        description: "Please ensure you have both brand guidelines and page content sections before generating wireframes.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingUnifiedHTML(true);
    setWireframeGenerationProgress({ current: 0, total: pageContentCards.length, currentPage: "" });
    
    try {
      const newWireframes = [];
      
      // Generate individual wireframes for each page content section
      for (let i = 0; i < pageContentCards.length; i++) {
        const card = pageContentCards[i];
        setWireframeGenerationProgress({ 
          current: i + 1, 
          total: pageContentCards.length, 
          currentPage: card.pageName 
        });

        // Create a complete, modern HTML page for this section with embedded CSS and JS
        const primaryColor = brandGuidelines.colors.primary[0] || '#DA291C';
        const accentColor = brandGuidelines.colors.accent[0] || '#FFC72C';
        const secondaryColor = brandGuidelines.colors.secondary[0] || '#264A2B';
        const neutralColor = brandGuidelines.colors.neutral[0] || '#f8fafc';
        const brandFont = brandGuidelines.typography.fonts[0] || 'Helvetica Neue';

        const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${card.pageName} - Brand Compliant</title>
    <style>
        /* Brand-compliant styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: '${brandFont}', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background: linear-gradient(135deg, ${neutralColor} 0%, #ffffff 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            animation: fadeIn 0.8s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .header {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
            border-left: 6px solid ${accentColor};
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100px;
            background: ${accentColor};
            opacity: 0.1;
            border-radius: 50%;
            transform: translate(50%, -50%);
        }
        
        .header h1 {
            color: ${primaryColor};
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
        }
        
        .header p {
            color: #64748b;
            font-size: 1.1rem;
            margin-bottom: 20px;
        }
        
        .stakeholders {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 15px;
        }
        
        .stakeholder-badge {
            background: ${accentColor};
            color: ${primaryColor === '#DA291C' ? 'white' : '#333'};
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .content-section {
            background: white;
            margin-bottom: 25px;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .content-section:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .content-section h2 {
            color: ${primaryColor};
            font-size: 1.5rem;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .content-section h2::before {
            content: '';
            width: 4px;
            height: 20px;
            background: ${accentColor};
            border-radius: 2px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .card {
            background: ${neutralColor};
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }
        
        .card:hover {
            border-color: ${accentColor};
            transform: translateY(-3px);
        }
        
        .btn {
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            margin: 5px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(218, 41, 28, 0.4);
            filter: brightness(1.1);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: ${primaryColor};
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: ${accentColor};
            box-shadow: 0 0 0 3px rgba(255, 199, 44, 0.1);
        }
        
        .nav-links {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 15px;
        }
        
        .nav-links a {
            color: ${primaryColor};
            text-decoration: none;
            font-weight: 600;
            padding: 8px 16px;
            border-radius: 6px;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .nav-links a:hover {
            background: ${primaryColor};
            color: white;
            transform: translateY(-1px);
        }
        
        .list-items {
            list-style: none;
            padding: 0;
        }
        
        .list-items li {
            padding: 12px;
            margin-bottom: 8px;
            background: white;
            border-left: 4px solid ${accentColor};
            border-radius: 6px;
            transition: all 0.3s ease;
        }
        
        .list-items li:hover {
            transform: translateX(5px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            .header {
                padding: 25px;
            }
            .header h1 {
                font-size: 2rem;
            }
            .content-section {
                padding: 20px;
            }
            .grid {
                grid-template-columns: 1fr;
            }
            .nav-links {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>${card.pageName}</h1>
            <p>${card.purpose}</p>
            ${card.stakeholders.length > 0 ? `
            <div class="stakeholders">
                ${card.stakeholders.map(stakeholder => `<span class="stakeholder-badge">${stakeholder}</span>`).join('')}
            </div>
            ` : ''}
        </header>
        
        ${card.headers.length > 0 ? `
        <section class="content-section">
            <h2>Content Headers</h2>
            ${card.headers.map(header => `<h3 style="color: ${primaryColor}; margin-bottom: 15px;">${header}</h3>`).join('')}
        </section>
        ` : ''}
        
        ${card.textContent && card.textContent.length > 0 ? `
        <section class="content-section">
            <h2>Content</h2>
            ${card.textContent.map(text => `<p style="margin-bottom: 15px; line-height: 1.7;">${text}</p>`).join('')}
        </section>
        ` : ''}
        
        ${card.buttons && card.buttons.length > 0 ? `
        <section class="content-section">
            <h2>Actions</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${card.buttons.map(button => `<button class="btn">${button.label || button}</button>`).join('')}
            </div>
        </section>
        ` : ''}
        
        ${card.forms && card.forms.length > 0 ? `
        <section class="content-section">
            <h2>Forms</h2>
            ${card.forms.map(form => `
                <div class="card">
                    <h3 style="margin-bottom: 20px;">${form.title || form}</h3>
                    ${form.fields ? form.fields.map(field => `
                        <div class="form-group">
                            <label>${field}</label>
                            <input type="text" placeholder="Enter ${field}">
                        </div>
                    `).join('') : ''}
                    <button class="btn">Submit ${form.title || 'Form'}</button>
                </div>
            `).join('')}
        </section>
        ` : ''}
        
        ${card.lists && card.lists.length > 0 ? `
        <section class="content-section">
            <h2>Data & Lists</h2>
            <div class="grid">
                ${card.lists.map(list => `
                    <div class="card">
                        <h3 style="margin-bottom: 15px;">${list.title || list}</h3>
                        ${list.items ? `
                            <ul class="list-items">
                                ${list.items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}
        
        ${card.navigation && card.navigation.length > 0 ? `
        <section class="content-section">
            <h2>Navigation</h2>
            <nav class="nav-links">
                ${card.navigation.map(nav => `<a href="#" onclick="navigateTo('${nav}')">${nav}</a>`).join('')}
            </nav>
        </section>
        ` : ''}
        
        ${card.additionalContent && card.additionalContent.length > 0 ? `
        <section class="content-section">
            <h2>Additional Information</h2>
            ${card.additionalContent.map(content => `<p style="margin-bottom: 15px; line-height: 1.7;">${content}</p>`).join('')}
        </section>
        ` : ''}
    </div>
    
    <script>
        // Interactive button effects with proper brand colors
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Ripple effect
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = \`
                    position: absolute;
                    width: \${size}px;
                    height: \${size}px;
                    left: \${x}px;
                    top: \${y}px;
                    background: rgba(255, 255, 255, 0.6);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                \`;
                
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                
                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                    }
                }, 600);
                
                // Show action feedback
                const originalText = this.textContent;
                this.textContent = '✓ ' + originalText;
                setTimeout(() => {
                    this.textContent = originalText;
                }, 1500);
            });
        });
        
        // Navigation function
        function navigateTo(section) {
            console.log('Navigating to:', section);
            alert('Navigating to: ' + section);
        }
        
        // Form interactions
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('focus', function() {
                this.style.borderColor = '${accentColor}';
                this.style.boxShadow = '0 0 0 3px rgba(255, 199, 44, 0.1)';
            });
            
            input.addEventListener('blur', function() {
                this.style.borderColor = '#e2e8f0';
                this.style.boxShadow = 'none';
            });
        });
        
        // Add ripple animation styles dynamically
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .btn:focus {
                outline: 2px solid ${accentColor};
                outline-offset: 2px;
            }
        \`;
        document.head.appendChild(style);
        
        // Add hover effects for cards
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.borderColor = '${accentColor}';
                this.style.transform = 'translateY(-3px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e2e8f0';
                this.style.transform = 'translateY(0)';
            });
        });
    </script>
</body>
</html>`;

        const wireframe = {
          id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pageName: card.pageName,
          htmlCode: htmlCode,
          cssCode: "// CSS embedded in HTML with brand colors",
          jsCode: "// Interactive JavaScript included in HTML",
          isEnhanced: true,
          lastUpdated: new Date().toISOString(),
          lastEnhancedElement: "Brand-Compliant Generator",
          enhancementExplanation: `Generated modern, responsive wireframe for ${card.pageName} using McDonald's brand guidelines`
        };

        newWireframes.push(wireframe);
      }

      // Save all new wireframes
      const existingWireframes = JSON.parse(localStorage.getItem('generated_wireframes') || '[]');
      const updatedWireframes = [...existingWireframes, ...newWireframes];
      localStorage.setItem('generated_wireframes', JSON.stringify(updatedWireframes));
      setGeneratedWireframes(updatedWireframes);

      toast({
        title: "Wireframes Generated Successfully",
        description: `Created ${newWireframes.length} brand-compliant wireframes with working CSS and JavaScript.`,
      });

    } catch (error) {
      console.error('Error generating brand-compliant wireframes:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate wireframes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingUnifiedHTML(false);
      setWireframeGenerationProgress({ current: 0, total: 0, currentPage: "" });
    }
  };

  // Handle element selection for targeted enhancement
  const handleElementSelection = (event: React.MouseEvent) => {
    if (!selectionMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as HTMLElement;
    
    // Create unique identifier for the element
    const uniqueId = `enhanced-${Date.now()}`;
    target.setAttribute('data-enhance-id', uniqueId);
    
    // Create user-friendly element description
    let elementInfo = '';
    const tagName = target.tagName.toLowerCase();
    const textContent = target.textContent?.trim().substring(0, 30) || '';
    
    // Simplify element identification
    if (tagName === 'button') {
      elementInfo = `Button: "${textContent}"`;
    } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
      elementInfo = `Header: "${textContent}"`;
    } else if (tagName === 'form') {
      elementInfo = 'Form section';
    } else if (tagName === 'input') {
      elementInfo = `Input field: ${target.getAttribute('placeholder') || 'text input'}`;
    } else if (tagName === 'nav') {
      elementInfo = 'Navigation menu';
    } else if (target.className.includes('button')) {
      elementInfo = `Button: "${textContent}"`;
    } else {
      elementInfo = textContent ? `${tagName}: "${textContent}"` : tagName;
    }
    
    // Store both display name and technical details
    setSelectedElement(JSON.stringify({
      displayName: elementInfo,
      tagName: tagName,
      className: target.className,
      id: target.id,
      uniqueId: uniqueId,
      textContent: textContent
    }));
    setSelectionMode(false);
    
    // Persistent visual selection with green border
    // Clear any previous selections
    const previousSelected = document.querySelector('[data-selected-for-enhancement="true"]');
    if (previousSelected) {
      previousSelected.removeAttribute('data-selected-for-enhancement');
      if (previousSelected instanceof HTMLElement) {
        previousSelected.style.outline = '';
        previousSelected.style.outlineOffset = '';
      }
    }
    
    // Mark current element as selected
    target.setAttribute('data-selected-for-enhancement', 'true');
    target.style.outline = '3px solid #10B981';
    target.style.outlineOffset = '2px';
    
    toast({
      title: "Element Selected",
      description: `Selected: ${elementInfo}`,
    });
  };

  // Handle selective element enhancement
  const handleEnhanceSelectedElement = async () => {
    if (!selectedPageCode || !selectedElement || !selectedElementPrompt.trim()) return;
    
    setIsEnhancing(true);
    
    try {
      const elementData = JSON.parse(selectedElement);
      const preciseEnhancer = createPreciseElementEnhancer();
      
      const request: PreciseElementRequest = {
        htmlCode: selectedPageCode.htmlCode,
        cssCode: selectedPageCode.cssCode,
        elementData: elementData,
        enhancementPrompt: selectedElementPrompt.trim(),
        pageName: selectedPageCode.pageName
      };

      const enhanced = await preciseEnhancer.enhanceElement(request);

      // Update the selected page code with enhanced versions
      const updatedPageCode = {
        pageName: selectedPageCode.pageName,
        htmlCode: enhanced.html,
        cssCode: enhanced.css,
        jsCode: enhanced.js
      };
      setSelectedPageCode(updatedPageCode);

      // Update storage with enhanced wireframe data using correct key
      const existingWireframes = storage.getItem('generated_wireframes') || [];
      console.log('Precise element enhancement - Looking for page:', selectedPageCode.pageName);
      
      const updatedWireframes = existingWireframes.map((wireframe: any) => {
        if (wireframe.pageName === selectedPageCode.pageName) {
          console.log('Found matching wireframe, updating with precise element enhancement...');
          return {
            ...wireframe,
            htmlCode: enhanced.html,
            cssCode: enhanced.css,
            jsCode: enhanced.js,
            isEnhanced: true,
            lastUpdated: new Date().toISOString(),
            lastEnhancedElement: elementData.displayName,
            enhancementExplanation: enhanced.explanation
          };
        }
        return wireframe;
      });
      
      storage.setItem('generated_wireframes', updatedWireframes);
      
      // Verify storage was updated correctly
      const verifyData = storage.getItem('generated_wireframes') || [];
      const verifyPage = verifyData.find((w: any) => w.pageName === selectedPageCode.pageName);
      console.log('Verification - Enhanced wireframe saved to storage:', {
        pageName: verifyPage?.pageName,
        isEnhanced: verifyPage?.isEnhanced,
        lastUpdated: verifyPage?.lastUpdated,
        lastEnhancedElement: verifyPage?.lastEnhancedElement,
        htmlLength: verifyPage?.htmlCode?.length,
        cssLength: verifyPage?.cssCode?.length
      });
      
      // Also update the current generated wireframes state
      setGeneratedWireframes(prev => prev.map(wireframe => {
        if (wireframe.pageName === selectedPageCode.pageName) {
          return {
            ...wireframe,
            htmlCode: enhanced.html,
            cssCode: enhanced.css,
            jsCode: enhanced.js
          };
        }
        return wireframe;
      }));

      // Clear selection after enhancement
      const selectedElementDOM = document.querySelector('[data-selected-for-enhancement="true"]');
      if (selectedElementDOM) {
        selectedElementDOM.removeAttribute('data-selected-for-enhancement');
        if (selectedElementDOM instanceof HTMLElement) {
          selectedElementDOM.style.outline = '';
          selectedElementDOM.style.outlineOffset = '';
        }
      }
      setSelectedElement(null);
      setSelectedElementPrompt('');

      toast({
        title: "Element Enhanced Successfully",
        description: enhanced.explanation,
      });
    } catch (err) {
      console.error("Error enhancing selected element:", err);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance the selected element. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Brand guideline extraction handler
  const handleBrandGuidelineUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setBrandExtractionError('Please select a valid PDF file');
      return;
    }

    setIsExtractingBrand(true);
    setBrandExtractionError('');

    try {
      const extractor = createBrandGuidelineExtractor();
      const guidelines = await extractor.extractFromPDF(file);
      
      // Generate a name for the brand guidelines based on file name
      const guidelineName = file.name.replace('.pdf', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Save to local storage with proper metadata
      const storedGuideline = BrandGuidelinesStorage.save(guidelines, guidelineName, file.name);
      
      // Update state
      setBrandGuidelines(guidelines);
      setStoredBrandGuidelines(BrandGuidelinesStorage.getAll());
      setSelectedStoredGuideline(storedGuideline.id);
      
      // Keep legacy localStorage for backward compatibility
      localStorage.setItem('brand_guidelines', JSON.stringify(guidelines));
      
      toast({
        title: "Brand Guidelines Saved",
        description: `Successfully extracted and saved "${guidelineName}" brand guidelines. They are now available for future use.`,
      });
      
      setShowBrandModal(true);
    } catch (error) {
      console.error('Brand extraction error:', error);
      setBrandExtractionError('Failed to extract brand guidelines. Please try again.');
      toast({
        title: "Extraction Failed",
        description: "Could not extract brand guidelines from the PDF file.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingBrand(false);
    }
  };

  // Handle selecting stored brand guidelines
  const handleStoredGuidelineSelection = (guidelineId: string) => {
    if (!guidelineId || guidelineId === "none") {
      setSelectedStoredGuideline("");
      setBrandGuidelines(null);
      return;
    }

    const selectedGuideline = BrandGuidelinesStorage.getById(guidelineId);
    if (selectedGuideline) {
      setBrandGuidelines(selectedGuideline);
      setSelectedStoredGuideline(guidelineId);
      
      toast({
        title: "Brand Guidelines Loaded",
        description: `Using "${selectedGuideline.name}" brand guidelines for wireframe generation.`,
      });
    }
  };

  // Delete stored brand guidelines
  const handleDeleteStoredGuideline = (guidelineId: string) => {
    const success = BrandGuidelinesStorage.delete(guidelineId);
    if (success) {
      setStoredBrandGuidelines(BrandGuidelinesStorage.getAll());
      
      if (selectedStoredGuideline === guidelineId) {
        setSelectedStoredGuideline("");
        setBrandGuidelines(null);
      }
      
      toast({
        title: "Guidelines Deleted",
        description: "Brand guidelines have been removed from storage.",
      });
    }
  };

  // Regenerate single wireframe with enhanced logo variants
  const regenerateWireframe = async (pageName: string) => {
    if (!brandGuidelines) {
      toast({
        title: "Brand Guidelines Required",
        description: "Please load brand guidelines first.",
        variant: "destructive",
      });
      return;
    }

    const pageCard = pageContentCards.find(card => card.pageName === pageName);
    if (!pageCard) {
      toast({
        title: "Page Not Found",
        description: "Could not find the page content to regenerate.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingWireframes(true);
    setWireframeGenerationProgress({ current: 1, total: 1, currentPage: pageName });

    try {
      const brandGenerator = createBrandAwareWireframeGenerator();
      const request: BrandedWireframeRequest = {
        pageContent: pageCard,
        designStyle: selectedDesignType,
        deviceType: selectedDeviceType,
        brandGuidelines
      };

      console.log('Regenerating wireframe with logo variants for:', pageName);
      const result = await brandGenerator.generateBrandedWireframe(request);
      
      const newWireframe = {
        id: `wireframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pageName: pageName,
        htmlCode: result.html,
        cssCode: result.css,
        jsCode: '',
        brandNotes: result.brandNotes || []
      };

      // Replace existing wireframe with same page name
      const updatedWireframes = generatedWireframes.filter(w => w.pageName !== pageName);
      updatedWireframes.push(newWireframe);
      setGeneratedWireframes(updatedWireframes);
      
      // Save to storage
      storage.setItem('generated_wireframes', JSON.stringify(updatedWireframes));
      
      toast({
        title: "Wireframe Regenerated",
        description: `${pageName} has been regenerated with enhanced logo variants.`,
      });
    } catch (error) {
      console.error('Error regenerating wireframe:', error);
      toast({
        title: "Regeneration Failed",
        description: "Could not regenerate the wireframe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWireframes(false);
      setWireframeGenerationProgress({ current: 0, total: 0, currentPage: "" });
    }
  };

  // Generate brand-aware wireframes
  const generateBrandAwareWireframes = async () => {
    if (!brandGuidelines || pageContentCards.length === 0) {
      toast({
        title: "Requirements Missing",
        description: "Please upload brand guidelines and generate page content first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingWireframes(true);
    setWireframeGenerationProgress({ current: 0, total: pageContentCards.length, currentPage: "" });

    try {
      const brandGenerator = createBrandAwareWireframeGenerator();
      const brandedWireframes: Array<{
        id: string;
        pageName: string;
        htmlCode: string;
        cssCode: string;
        jsCode: string;
        brandNotes: string[];
      }> = [];

      for (let i = 0; i < pageContentCards.length; i++) {
        const card = pageContentCards[i];
        setWireframeGenerationProgress({ 
          current: i + 1, 
          total: pageContentCards.length, 
          currentPage: card.pageName 
        });

        const request: BrandedWireframeRequest = {
          pageContent: card,
          designStyle: selectedDesignType,
          deviceType: selectedDeviceType,
          brandGuidelines
        };

        const result = await brandGenerator.generateBrandedWireframe(request);
        
        brandedWireframes.push({
          id: `wireframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pageName: card.pageName,
          htmlCode: result.html,
          cssCode: result.css,
          jsCode: generateWireframeJS(card, selectedDeviceType, selectedDesignType),
          brandNotes: result.brandNotes
        });

        // Add delay between generations
        if (i < pageContentCards.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setGeneratedWireframes(brandedWireframes);
      localStorage.setItem('generated_wireframes', JSON.stringify(brandedWireframes));

      toast({
        title: "Brand-Aware Wireframes Generated",
        description: `Successfully generated ${brandedWireframes.length} wireframes following your brand guidelines.`,
      });

      setCurrentStep("results");
    } catch (error) {
      console.error('Brand-aware wireframe generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate brand-aware wireframes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWireframes(false);
    }
  };

  const generateWireframeJS = (card: PageContentCard, deviceType: string, designType: string, layout: string = 'standard-header'): string => {
    const interactiveElements = [];
    
    // Add form validation
    if (card.forms && card.forms.length > 0) {
      interactiveElements.push(`
// Form validation and submission
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      console.log('Form submitted:', Object.fromEntries(formData));
      alert('Form submitted successfully!');
    });
  });
});`);
    }

    // Add button click handlers
    if (card.buttons && card.buttons.length > 0) {
      interactiveElements.push(`
// Button click handlers
document.addEventListener('DOMContentLoaded', function() {
  const buttons = document.querySelectorAll('button:not([type="submit"])');
  buttons.forEach(button => {
    button.addEventListener('click', function() {
      console.log('Button clicked:', this.textContent);
      this.style.transform = 'scale(0.98)';
      setTimeout(() => this.style.transform = 'scale(1)', 150);
    });
  });
});`);
    }

    return interactiveElements.join('\n\n');
  };

  const generatePageWireframe = async (card: PageContentCard): Promise<{ pageName: string; htmlCode: string; cssCode: string; jsCode: string }> => {
    const pageLayout = pageLayouts[card.id] || 'standard-header';
    const htmlCode = generateWireframeHTML(card, selectedDeviceType, selectedColorScheme, selectedDesignType, pageLayout);
    const cssCode = generateWireframeCSS(card, selectedDeviceType, selectedColorScheme, selectedDesignType, pageLayout);
    const jsCode = generateWireframeJS(card, selectedDeviceType, selectedDesignType, pageLayout);
    
    return {
      pageName: card.pageName,
      htmlCode,
      cssCode,
      jsCode
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
                            const bestVersion = getBestWireframeVersion(page.pageName);
                            if (bestVersion) {
                              console.log(`Loading ${bestVersion.isEnhanced ? 'enhanced' : 'original'} version for:`, page.pageName);
                              setSelectedPageCode(bestVersion);
                            } else {
                              // Final fallback to current page data
                              console.log('Loading fallback version for:', page.pageName);
                              setSelectedPageCode({
                                pageName: page.pageName,
                                htmlCode: page.htmlContent,
                                cssCode: page.cssStyles,
                                jsCode: '',
                                isEnhanced: false
                              });
                            }
                            setShowCodeModal(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Code
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                          onClick={() => {
                            // Find wireframe ID for this page
                            const wireframe = generatedWireframes.find(w => w.pageName === page.pageName);
                            const wireframeId = wireframe?.id || encodeURIComponent(page.pageName);
                            window.location.href = `/html-editor?id=${wireframeId}`;
                          }}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          HTML Editor
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
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveEditorData}
                        variant="outline"
                        className="flex-1 bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save HTML Editor Changes
                      </Button>
                      <Button
                        onClick={handleEnhanceCode}
                        disabled={isEnhancing || !enhancementPrompt.trim()}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
                  <TabsList className={selectedPageCode?.jsCode ? "grid grid-cols-4" : "grid grid-cols-3"}>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      Preview
                      {(() => {
                        const currentWireframe = generatedWireframes.find(w => w.pageName === selectedPageCode.pageName);
                        return currentWireframe?.isEnhanced ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Enhanced with AI"></div>
                        ) : null;
                      })()}
                    </TabsTrigger>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="css">CSS</TabsTrigger>
                    {selectedPageCode?.jsCode && <TabsTrigger value="javascript">JavaScript</TabsTrigger>}
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
                  
                  {selectedPageCode?.jsCode && (
                    <TabsContent value="javascript">
                      <div className="relative">
                        <Button
                          onClick={() => navigator.clipboard.writeText(selectedPageCode.jsCode || '')}
                          className="absolute top-2 right-2 z-10"
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                          <code>{selectedPageCode.jsCode}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  )}
                  
                  <TabsContent value="preview">
                    <div className="space-y-4">
                      {selectedPageCode?.jsCode && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              const combinedHtml = `${selectedPageCode.htmlCode}
<style>
${selectedPageCode.cssCode}
</style>
<script>
${selectedPageCode.jsCode}
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
${selectedPageCode.jsCode}
</script>`;
                              const blob = new Blob([combinedHtml], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${selectedPageCode.pageName.replace(/\s+/g, '_')}.html`;
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
                      
                      {/* Simplified Element Selection */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-800">Enhance Specific Elements</h4>
                          <Button
                            onClick={() => {
                              setSelectionMode(!selectionMode);
                              setSelectedElement(null);
                              setSelectedElementPrompt('');
                            }}
                            variant={selectionMode ? "destructive" : "default"}
                            size="sm"
                          >
                            {selectionMode ? "Cancel" : "Start Selecting"}
                          </Button>
                        </div>
                        {selectionMode ? (
                          <div className="space-y-2">
                            <p className="text-sm text-blue-700">
                              <span className="font-medium">Click any element below</span> to target it for enhancement
                            </p>
                            <div className="flex items-center gap-4 text-xs text-blue-600">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-1 bg-blue-400 rounded"></div>
                                <span>Basic elements</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-1 bg-green-500 rounded"></div>
                                <span>Interactive elements (buttons, forms, headers)</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-blue-600">
                            Target specific page elements for AI enhancement instead of the entire page
                          </p>
                        )}
                      </div>

                      {/* Selected Element Enhancement */}
                      {selectedElement && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-800">Selected Element</span>
                            <code className="bg-green-100 px-2 py-1 rounded text-xs text-green-700">
                              {(() => {
                                try {
                                  const elementData = JSON.parse(selectedElement);
                                  return elementData.displayName;
                                } catch {
                                  return selectedElement;
                                }
                              })()}
                            </code>
                          </div>
                          <div className="mb-3">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <span className="col-span-2 text-xs text-gray-600 mb-1">Quick enhancement options:</span>
                              {[
                                "Make it more modern",
                                "Add hover effects", 
                                "Improve colors",
                                "Better typography",
                                "Add subtle animations",
                                "Enhanced styling"
                              ].map((option) => (
                                <Button
                                  key={option}
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs justify-start"
                                  onClick={() => setSelectedElementPrompt(option)}
                                >
                                  {option}
                                </Button>
                              ))}
                            </div>
                            <Textarea
                              value={selectedElementPrompt}
                              onChange={(e) => setSelectedElementPrompt(e.target.value)}
                              placeholder="Describe enhancement or use quick options above"
                              className="text-sm min-h-[50px]"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleEnhanceSelectedElement}
                              disabled={isEnhancing || !selectedElementPrompt.trim()}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isEnhancing ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Enhancing...
                                </>
                              ) : (
                                "Enhance This Element"
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                // Clear visual selection
                                const selectedElementDOM = document.querySelector('[data-selected-for-enhancement="true"]');
                                if (selectedElementDOM) {
                                  selectedElementDOM.removeAttribute('data-selected-for-enhancement');
                                  if (selectedElementDOM instanceof HTMLElement) {
                                    selectedElementDOM.style.outline = '';
                                    selectedElementDOM.style.outlineOffset = '';
                                  }
                                }
                                setSelectedElement(null);
                                setSelectedElementPrompt('');
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Clear Selection
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="border rounded-lg overflow-hidden">
                        <style dangerouslySetInnerHTML={{ 
                          __html: selectedPageCode.cssCode + `
                            /* Selected Element Styling */
                            [data-selected-for-enhancement="true"] {
                              outline: 3px solid #10B981 !important;
                              outline-offset: 2px !important;
                              position: relative !important;
                            }
                            [data-selected-for-enhancement="true"]::before {
                              content: "Selected for Enhancement" !important;
                              position: absolute !important;
                              top: -30px !important;
                              left: 0 !important;
                              background: #10B981 !important;
                              color: white !important;
                              padding: 2px 8px !important;
                              border-radius: 4px !important;
                              font-size: 11px !important;
                              font-weight: 500 !important;
                              white-space: nowrap !important;
                              z-index: 1000 !important;
                              pointer-events: none !important;
                            }
                          ` + (selectionMode ? `
                            /* Precise Element Selection Mode */
                            .wireframe-container * {
                              cursor: pointer !important;
                              transition: all 0.2s ease !important;
                              position: relative !important;
                            }
                            .wireframe-container *:hover:not([data-selected-for-enhancement="true"]) {
                              outline: 2px dashed #3B82F6 !important;
                              outline-offset: 2px !important;
                              background-color: rgba(59, 130, 246, 0.05) !important;
                            }
                            .wireframe-container *:hover:not([data-selected-for-enhancement="true"])::after {
                              content: "Click to enhance this element" !important;
                              position: absolute !important;
                              top: -25px !important;
                              left: 0 !important;
                              background: #3B82F6 !important;
                              color: white !important;
                              padding: 2px 6px !important;
                              border-radius: 3px !important;
                              font-size: 10px !important;
                              white-space: nowrap !important;
                              z-index: 1000 !important;
                              pointer-events: none !important;
                            }
                            /* Enhanced targeting for interactive elements */
                            .wireframe-container button:hover:not([data-selected-for-enhancement="true"]),
                            .wireframe-container input:hover:not([data-selected-for-enhancement="true"]),
                            .wireframe-container textarea:hover:not([data-selected-for-enhancement="true"]),
                            .wireframe-container h1:hover:not([data-selected-for-enhancement="true"]),
                            .wireframe-container h2:hover:not([data-selected-for-enhancement="true"]),
                            .wireframe-container h3:hover:not([data-selected-for-enhancement="true"]) {
                              outline: 3px solid #10B981 !important;
                              background-color: rgba(16, 185, 129, 0.1) !important;
                            }
                          ` : '')
                        }} />
                        <div 
                          dangerouslySetInnerHTML={{ __html: selectedPageCode.htmlCode }}
                          className={selectionMode ? "cursor-pointer relative" : ""}
                          onClick={selectionMode ? handleElementSelection : undefined}
                        />
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
            
            
          </div>
        )}

        {/* Brand Guidelines Upload Section */}
        {pageContentCards.length > 0 && (
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
                      <Select value={selectedStoredGuideline} onValueChange={handleStoredGuidelineSelection}>
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
                          onClick={() => handleDeleteStoredGuideline(selectedStoredGuideline)}
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
                    {brandExtractionError && (
                      <p className="text-sm text-red-600 mt-1">{brandExtractionError}</p>
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
                      <div className="text-sm font-medium">{(brandGuidelines.colors?.primary?.length || 0) + (brandGuidelines.colors?.text?.length || 0)}</div>
                    </div>
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <div className="text-xs text-gray-500">Typography</div>
                      <div className="text-sm font-medium">{brandGuidelines.typography?.fonts?.length || 0} fonts</div>
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
        )}

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
                            className="h-7 w-7 p-0 hover:bg-blue-500/20 text-blue-600"
                            onClick={() => regenerateWireframe(wireframe.pageName)}
                            title="Regenerate with logo variants"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-gray-300/50 text-gray-600"
                            onClick={() => {
                              setSelectedPageCode({
                                pageName: wireframe.pageName,
                                htmlCode: wireframe.htmlCode,
                                cssCode: wireframe.cssCode,
                                jsCode: wireframe.jsCode
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
                    
                    <CardContent className="p-4 bg-[#f0f6ff]">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

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
                          {brandGuidelines.colors.primary.map((color, index) => (
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
                          {brandGuidelines.colors.secondary.map((color, index) => (
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
                        <h4 className="font-medium text-sm mb-2">Text Colors</h4>
                        <div className="flex flex-wrap gap-2">
                          {(brandGuidelines.colors?.text || []).map((color, index) => (
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
                        <h4 className="font-medium text-sm mb-2">Accent Colors</h4>
                        <div className="flex flex-wrap gap-2">
                          {brandGuidelines.colors.accent.map((color, index) => (
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
                        <h4 className="font-medium text-sm mb-2">Background Colors</h4>
                        <div className="flex flex-wrap gap-2">
                          {(brandGuidelines.colors?.background || []).map((color, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <div 
                                className="w-6 h-6 rounded border border-gray-300"
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
                        <Type className="h-4 w-4" />
                        Typography
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Fonts</h4>
                        <div className="space-y-1">
                          {brandGuidelines.typography.fonts.map((font, index) => (
                            <div key={index} className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                              {font}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Weights</h4>
                        <div className="flex flex-wrap gap-2">
                          {brandGuidelines.typography.weights.map((weight, index) => (
                            <Badge key={index} variant="outline">{weight}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Styles</h4>
                        <div className="space-y-1">
                          {brandGuidelines.typography.headingStyles.map((style, index) => (
                            <div key={index} className="text-xs text-gray-600">• {style}</div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Layout Guidelines */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layout className="h-4 w-4" />
                        Layout & Spacing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Spacing Values</h4>
                        <div className="flex flex-wrap gap-2">
                          {brandGuidelines.layout.spacing.map((space, index) => (
                            <Badge key={index} variant="secondary">{space}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Grid Systems</h4>
                        <div className="space-y-1">
                          {brandGuidelines.layout.gridSystems.map((grid, index) => (
                            <div key={index} className="text-xs text-gray-600">• {grid}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Breakpoints</h4>
                        <div className="flex flex-wrap gap-2">
                          {brandGuidelines.layout.breakpoints.map((breakpoint, index) => (
                            <Badge key={index} variant="outline">{breakpoint}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Logo Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-400 to-red-500"></div>
                        Logo Guidelines
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Primary Logo</h4>
                        {brandGuidelines.logos.images?.primary ? (
                          <div className="bg-gray-50 p-3 rounded border">
                            <img 
                              src={brandGuidelines.logos.images.primary} 
                              alt="Extracted Brand Logo" 
                              className="max-h-16 w-auto mx-auto mb-2"
                            />
                            <div className="text-xs text-green-600 text-center">✓ Logo extracted from PDF</div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {brandGuidelines.logos.primary}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Variations</h4>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {(brandGuidelines.logos?.variations || []).map((variation, index) => (
                              <Badge key={index} variant="outline">{variation}</Badge>
                            ))}
                          </div>
                          {brandGuidelines.logos.images && Object.keys(brandGuidelines.logos.images).length > 1 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                              {Object.entries(brandGuidelines.logos.images).map(([type, imageData], index) => (
                                type !== 'primary' && imageData && (
                                  <div key={index} className="bg-gray-50 p-2 rounded border text-center">
                                    <img 
                                      src={imageData} 
                                      alt={`${type} logo variant`} 
                                      className="max-h-8 w-auto mx-auto mb-1"
                                    />
                                    <div className="text-xs text-gray-500 capitalize">{type}</div>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Usage Rules</h4>
                        <div className="space-y-1">
                          {(brandGuidelines.logos?.usage || []).map((rule, index) => (
                            <div key={index} className="text-xs text-gray-600">• {rule}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Size & Spacing</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs font-medium">Min Size</div>
                            <div className="text-xs text-gray-600">{brandGuidelines.logos?.sizes?.[0] || "24px"}</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs font-medium">Clearance</div>
                            <div className="text-xs text-gray-600">{brandGuidelines.logos?.spacing?.[0] || "20px"}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Brand Voice & Personality */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Brand Voice
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Personality</h4>
                        <div className="flex flex-wrap gap-2">
                          {brandGuidelines.tone.personality.map((trait, index) => (
                            <Badge key={index} className="bg-blue-100 text-blue-800">{trait}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Voice Characteristics</h4>
                        <div className="flex flex-wrap gap-2">
                          {brandGuidelines.tone.voice.map((voice, index) => (
                            <Badge key={index} className="bg-purple-100 text-purple-800">{voice}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Key Messages</h4>
                        <div className="space-y-1">
                          {brandGuidelines.tone.messaging.map((message, index) => (
                            <div key={index} className="text-xs text-gray-600">• {message}</div>
                          ))}
                        </div>
                      </div>
                      {brandGuidelines.tone.doAndDont && brandGuidelines.tone.doAndDont.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Communication Guidelines</h4>
                          <div className="space-y-1">
                            {brandGuidelines.tone.doAndDont.map((guideline, index) => (
                              <div key={index} className="text-xs text-gray-600">• {guideline}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Brand Values & Accessibility */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-blue-500"></div>
                        Brand Values
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {(brandGuidelines.brandValues || []).map((value, index) => (
                          <Badge key={index} className="bg-green-100 text-green-800">{value}</Badge>
                        ))}
                      </div>
                      {brandGuidelines.designPrinciples && brandGuidelines.designPrinciples.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-sm mb-2">Design Principles</h4>
                          <div className="space-y-1">
                            {(brandGuidelines.designPrinciples || []).map((principle, index) => (
                              <div key={index} className="text-xs text-gray-600">• {principle}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-400 to-pink-500"></div>
                        Accessibility
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Contrast Requirements</h4>
                        <div className="flex flex-wrap gap-2">
                          {(brandGuidelines.accessibility?.contrast || []).map((contrast, index) => (
                            <Badge key={index} variant="secondary">{contrast}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Compliance Standards</h4>
                        <div className="space-y-1">
                          {(brandGuidelines.accessibility?.compliance || []).map((standard, index) => (
                            <div key={index} className="text-xs text-gray-600">• {standard}</div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Enhanced Brand Integration Status</h4>
                  <p className="text-sm text-green-700">
                    Comprehensive brand guidelines extracted including text colors, {brandGuidelines.logos?.images?.primary ? 'authentic logo images' : 'logo specifications'}, accessibility requirements, 
                    and brand values. The AI will use all extracted elements including {brandGuidelines.colors?.text?.length || 0} text colors, 
                    {brandGuidelines.logos?.variations?.length || 0} logo variations, {brandGuidelines.accessibility?.contrast?.length || 0} contrast requirements
                    {brandGuidelines.logos?.images?.primary ? ', and extracted logo images' : ''} 
                    to create wireframes that perfectly match your brand identity.
                  </p>
                  {brandGuidelines.logos?.images?.primary && (
                    <div className="mt-3 p-3 bg-white rounded border border-green-300">
                      <div className="flex items-center gap-3">
                        <img 
                          src={brandGuidelines.logos.images.primary} 
                          alt="Extracted Brand Logo" 
                          className="h-8 w-auto"
                        />
                        <div className="text-sm text-green-700">
                          <div className="font-medium">Authentic Logo Extracted</div>
                          <div className="text-xs">Logo will be used in generated wireframes for authentic brand representation</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
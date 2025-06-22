import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavigationBar } from "@/components/navigation-bar";
import { WorkflowProgress } from "@/components/workflow-progress";
import { DesignPromptForm } from "./design-prompt-form";
import { WireframeGallery } from "./wireframe-gallery";
import { BrandGuidelinesPanel } from "./brand-guidelines-panel";
import { CodeEnhancementModal } from "./code-enhancement-modal";
import { WireframeCustomizationPanel } from "./wireframe-customization-panel";
import { AnalysisResultsPanel } from "./analysis-results-panel";
import { createWireframeAnalysisAgent, type WireframeAnalysisResult } from "@/lib/wireframe-analysis-agent";
import { createHTMLWireframeGenerator, type DetailedPageContent } from "@/lib/html-wireframe-generator";
import { createAICodeEnhancer, type CodeEnhancementRequest, type EnhancedCodeResponse } from "@/lib/ai-code-enhancer";
import { createPreciseElementEnhancer, type PreciseElementRequest } from "@/lib/precise-element-enhancer";
import { createPageContentAgent, type PageContentCard } from "@/lib/page-content-agent";
import { createBrandGuidelineExtractor, type BrandGuideline } from "@/lib/brand-guideline-extractor";
import { createBrandAwareWireframeGenerator, type BrandedWireframeRequest } from "@/lib/brand-aware-wireframe-generator";
import { BrandGuidelinesStorage, type StoredBrandGuideline } from "@/lib/brand-guidelines-storage";
import { createMultimodalPDFExtractor, type ComprehensiveBrandReport } from "@/lib/multimodal-pdf-extractor";
import { createChunkedBrandAnalyzer, type FinalBrandReport } from "@/lib/chunked-brand-analyzer";
import { storage } from "@/lib/storage-utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Trash2,
  ArrowLeft
} from "lucide-react";

interface DesignPrompt {
  projectType: string;
  targetAudience: string;
  primaryFeatures: string[];
  colorPreference: string;
  designStyle: string;
  deviceType: string;
  screenTypes: string[];
}

interface WireframeData {
  id: string;
  pageName: string;
  htmlCode: string;
  cssCode: string;
  jsCode?: string;
  isEnhanced?: boolean;
  lastUpdated?: string;
  lastEnhancedElement?: string;
  enhancementExplanation?: string;
  lastEditorSync?: string;
}

// External API Brand Data Interface
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
    color?: string[];
    style?: string;
    usage?: string;
  };
  tiles?: {
    types?: string[];
    size?: string;
    alignment?: string;
    transparency?: string;
    max_number?: string;
  };
  logo?: string | null;
  logotype?: string;
  other_guidelines?: string[];
}

// Type guard to check if brandGuidelines is ExternalBrandData
function isExternalBrandData(data: any): data is ExternalBrandData {
  return data && typeof data === 'object' && 'brand_name' in data;
}

// Convert external brand data to BrandGuideline format for UI compatibility
function convertExternalToBrandGuideline(data: ExternalBrandData): BrandGuideline {
  const colors = data.color_palette ? Object.values(data.color_palette) : [];
  const fonts = [];
  if (data.typography?.primary_font) fonts.push(data.typography.primary_font);
  if (data.typography?.on_screen_font) fonts.push(data.typography.on_screen_font);
  if (data.typography?.print_font) fonts.push(data.typography.print_font);
  
  const brandGuideline: BrandGuideline = {
    colors: {
      primary: colors.slice(0, 3),
      secondary: colors.slice(3, 6),
      accent: colors.slice(6),
      neutral: ['#F8F9FA', '#E9ECEF'],
      text: ['#000000', '#333333', '#666666'],
      background: ['#FFFFFF', '#F8F9FA', '#F3F4F6'],
      error: ['#DC3545'],
      success: ['#28A745'],
      warning: ['#FFC107']
    },
    typography: {
      fonts: fonts,
      fontFamilies: {
        primary: data.typography?.primary_font,
        secondary: data.typography?.on_screen_font,
        heading: data.typography?.primary_font,
        body: data.typography?.on_screen_font
      },
      headingStyles: ['32px', '24px', '20px', '18px'],
      bodyStyles: ['16px', '14px', '12px'],
      weights: data.typography?.font_weights || ['Light', 'Regular', 'Semibold', 'Bold'],
      sizes: ['32px', '24px', '20px', '18px', '16px', '14px', '12px'],
      lineHeights: ['120%', '110%'],
      letterSpacing: ['normal', '-0.5px']
    },
    logos: {
      primary: data.logotype || data.brand_name || 'Logo',
      variations: [data.logotype || data.brand_name || 'Logo'],
      usage: [data.icons?.usage || 'Standard usage'],
      restrictions: ['No modifications', 'Maintain aspect ratio'],
      spacing: ['2x logo height clearance'],
      colors: colors.slice(0, 2),
      sizes: ['24px digital', '0.5 inch print'],
      formats: ['SVG', 'PNG'],
      images: {
        primary: data.logotype || undefined,
        horizontal: data.logotype || undefined,
        icon: data.logo || undefined
      }
    },
    layout: {
      spacing: [data.page_layout?.spacing || 'standard spacing'],
      gridSystems: [data.page_layout?.grid_system || 'base grid unit'],
      breakpoints: ['768px', '1024px', '1200px'],
      containers: ['responsive'],
      margins: [data.page_layout?.margins || 'standard margins'],
      padding: ['standard padding']
    },
    accessibility: {
      contrast: ['WCAG AA compliant'],
      guidelines: ['High contrast', 'Readable fonts'],
      compliance: ['WCAG 2.1 AA']
    },
    tone: {
      personality: data.photography?.style ? data.photography.style.split(',').map(s => s.trim()) : ['professional'],
      voice: ['consistent', 'clear'],
      messaging: ['user-focused'],
      doAndDont: data.other_guidelines || ['Keep it simple']
    },
    components: {
      buttons: {
        primary: 'Primary button',
        secondary: 'Secondary button', 
        ghost: 'Ghost button',
        sizes: ['sm', 'md', 'lg'],
        states: ['default', 'hover', 'active'],
        borderRadius: '6px',
        fontWeight: '500'
      },
      forms: {
        inputStyles: 'Standard inputs',
        labelStyles: 'Clear labels',
        validationStyles: 'Error states'
      },
      navigation: {
        primaryNav: 'Main navigation',
        styles: 'Clean navigation',
        breadcrumbs: 'Breadcrumb trails'
      },
      cards: {
        design: 'Card layouts',
        shadows: ['subtle shadows'],
        spacing: 'standard spacing'
      },
      tables: ['headers', 'rows', 'borders'],
      modals: ['overlay', 'content', 'actions'],
      badges: ['primary', 'secondary', 'status']
    },
    imagery: {
      style: data.photography?.style || 'Professional',
      guidelines: [data.illustration?.purpose || 'High quality'],
      restrictions: ['Brand consistent'],
      aspectRatios: ['16:9', '4:3'],
      treatments: ['Clean', 'Professional']
    },
    keyPoints: data.other_guidelines || [],
    keyClauses: [data.brand_name],
    keyHighlights: data.tiles?.types || [],
    compliance: {
      requirements: ['Brand compliance'],
      restrictions: ['Usage guidelines'],
      guidelines: ['Follow specifications']
    },
    brandValues: [data.brand_name],
    designPrinciples: data.tiles?.types || ['Professional design'],
    dosAndDonts: {
      dos: data.other_guidelines?.filter((_, i) => i % 2 === 0) || ['Follow brand guidelines'],
      donts: data.other_guidelines?.filter((_, i) => i % 2 === 1) || ['Avoid brand violations']
    },
    brandRules: data.other_guidelines || ['Maintain brand consistency'],
    usageGuidelines: {
      approved: [data.icons?.usage || 'Standard usage guidelines'],
      prohibited: ['Unauthorized modifications', 'Incorrect color usage'],
      context: ['Digital applications', 'Print materials', 'Web usage']
    },
    logoUsage: [data.icons?.usage || 'Standard logo usage guidelines']
  };
  
  return brandGuideline;
}

export default function WireframeDesignerMain() {
  const [currentStep, setCurrentStep] = useState<"input" | "analyzing" | "results">("input");
  const { toast } = useToast();
  const [error, setError] = useState("");
  
  // Design prompt state
  const [designPrompt, setDesignPrompt] = useState<DesignPrompt>({
    projectType: "",
    targetAudience: "",
    primaryFeatures: [],
    colorPreference: "",
    designStyle: "",
    deviceType: "desktop",
    screenTypes: []
  });

  // Analysis and content generation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<WireframeAnalysisResult | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [detailedWireframes, setDetailedWireframes] = useState<DetailedPageContent[]>([]);
  const [contentGenerationProgress, setContentGenerationProgress] = useState({ current: 0, total: 0, currentPage: "" });

  // Wireframe generation state
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);
  const [generatedWireframes, setGeneratedWireframes] = useState<WireframeData[]>([]);
  const [wireframeGenerationProgress, setWireframeGenerationProgress] = useState({ current: 0, total: 0, currentPage: "" });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Customization state
  const [selectedDeviceType, setSelectedDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>('modern-blue');
  const [selectedDesignType, setSelectedDesignType] = useState<string>('modern');
  const [selectedLayout, setSelectedLayout] = useState<string>('standard-header');

  // Brand guidelines state
  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuideline | null>(null);
  const [rawBrandData, setRawBrandData] = useState<ExternalBrandData | null>(null);
  const [isExtractingBrand, setIsExtractingBrand] = useState(false);
  const [brandExtractionError, setBrandExtractionError] = useState<string>('');
  const [storedBrandGuidelines, setStoredBrandGuidelines] = useState<StoredBrandGuideline[]>([]);
  const [selectedStoredGuideline, setSelectedStoredGuideline] = useState<string>("");

  // Code enhancement state
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
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedCode, setEnhancedCode] = useState<{ html: string; css: string; js: string; explanation: string; improvements: string[] } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedElementPrompt, setSelectedElementPrompt] = useState('');

  // Load stored data on component mount
  useEffect(() => {
    loadStoredData();
    loadStoredBrandGuidelines();
  }, []);

  const loadStoredData = () => {
    try {
      const stored = localStorage.getItem('generated_wireframes');
      if (stored) {
        const parsedWireframes = JSON.parse(stored);
        setGeneratedWireframes(parsedWireframes);
      }
    } catch (error) {
      console.error('Error loading stored wireframes:', error);
    }
  };

  const loadStoredBrandGuidelines = async () => {
    try {
      const brandStorage = new BrandGuidelinesStorage();
      const stored = await brandStorage.getAllGuidelines();
      setStoredBrandGuidelines(stored);
    } catch (error) {
      console.error('Error loading stored brand guidelines:', error);
    }
  };

  const handleAnalyzeRequirements = async () => {
    if (!designPrompt.projectType.trim()) {
      setError("Please provide a project type to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setCurrentStep("analyzing");

    try {
      const analysisAgent = createWireframeAnalysisAgent();
      const result = await analysisAgent.analyzeRequirements({
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

  const handleGenerateDetailedContent = async () => {
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

        const content = await contentAgent.generateDetailedPageContent({
          pageName: page.pageName,
          pageType: page.pageType,
          purpose: page.purpose,
          keyElements: page.keyElements,
          userActions: page.userActions,
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

  const handleGenerateWireframes = async () => {
    if (detailedWireframes.length === 0) return;

    setIsGeneratingWireframes(true);
    setWireframeGenerationProgress({ current: 0, total: detailedWireframes.length, currentPage: "" });

    try {
      const generator = brandGuidelines 
        ? createBrandAwareWireframeGenerator() 
        : createHTMLWireframeGenerator();
      
      const results: WireframeData[] = [];

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
              stakeholders: page.stakeholders || [],
              headers: page.headers || [],
              buttons: page.buttons || [],
              forms: page.forms || [],
              lists: page.lists || [],
              navigation: page.navigation || [],
              additionalContent: page.additionalContent || [],
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

        const wireframe: WireframeData = {
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
      const multimodalExtractor = createMultimodalPDFExtractor();
      const brandReport = await multimodalExtractor.extractComprehensiveBrandData(file);
      
      if (brandReport && brandReport.extractedData) {
        const brandData = brandReport.extractedData;
        
        if (isExternalBrandData(brandData)) {
          setRawBrandData(brandData);
          const convertedGuidelines = convertExternalToBrandGuideline(brandData);
          setBrandGuidelines(convertedGuidelines);
          
          // Store the guidelines
          const brandStorage = new BrandGuidelinesStorage();
          await brandStorage.storeGuideline({
            name: brandData.brand_name || 'Uploaded Guidelines',
            guidelines: convertedGuidelines,
            source: file.name
          });
          
          loadStoredBrandGuidelines();
          
          toast({
            title: "Brand Guidelines Extracted",
            description: `Successfully extracted guidelines for ${brandData.brand_name}`,
          });
        } else {
          setBrandExtractionError('Could not extract valid brand guidelines from this PDF.');
        }
      } else {
        setBrandExtractionError('No brand data could be extracted from this PDF.');
      }
    } catch (error) {
      console.error('Brand extraction error:', error);
      setBrandExtractionError('Failed to extract brand guidelines. Please try again.');
    } finally {
      setIsExtractingBrand(false);
    }
  };

  const handleStoredGuidelineSelect = async (id: string) => {
    setSelectedStoredGuideline(id);
    
    if (id) {
      try {
        const brandStorage = new BrandGuidelinesStorage();
        const guideline = await brandStorage.getGuideline(id);
        if (guideline) {
          setBrandGuidelines(guideline.guidelines);
          toast({
            title: "Brand Guidelines Loaded",
            description: `Loaded guidelines: ${guideline.name}`,
          });
        }
      } catch (error) {
        console.error('Error loading stored guideline:', error);
        toast({
          title: "Error",
          description: "Failed to load selected brand guidelines.",
          variant: "destructive"
        });
      }
    }
  };

  const handleStoredGuidelineDelete = async (id: string) => {
    try {
      const brandStorage = new BrandGuidelinesStorage();
      await brandStorage.deleteGuideline(id);
      loadStoredBrandGuidelines();
      
      if (selectedStoredGuideline === id) {
        setSelectedStoredGuideline("");
        setBrandGuidelines(null);
      }
      
      toast({
        title: "Guidelines Deleted",
        description: "Brand guidelines have been removed.",
      });
    } catch (error) {
      console.error('Error deleting guideline:', error);
      toast({
        title: "Error",
        description: "Failed to delete brand guidelines.",
        variant: "destructive"
      });
    }
  };

  const handleClearBrandGuidelines = () => {
    setBrandGuidelines(null);
    setRawBrandData(null);
    setSelectedStoredGuideline("");
    setBrandExtractionError('');
  };

  const handleWireframeViewCode = (wireframe: WireframeData) => {
    setSelectedPageCode({
      pageName: wireframe.pageName,
      htmlCode: wireframe.htmlCode,
      cssCode: wireframe.cssCode,
      jsCode: wireframe.jsCode,
      isEnhanced: wireframe.isEnhanced,
      lastEnhancedElement: wireframe.lastEnhancedElement,
      enhancementExplanation: wireframe.enhancementExplanation
    });
    setShowCodeModal(true);
  };

  const handleWireframeEdit = (wireframe: WireframeData) => {
    console.log('Edit button clicked for wireframe:', wireframe);
    console.log('Wireframe ID:', wireframe.id);
    if (!wireframe.id) {
      console.error('Wireframe ID is missing! Wireframe object:', wireframe);
    }
    window.location.href = `/html-editor?id=${wireframe.id}`;
  };

  const handleWireframePreview = (wireframe: WireframeData) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(wireframe.htmlCode);
      newWindow.document.close();
    }
  };

  const handleWireframeCopy = (wireframe: WireframeData) => {
    navigator.clipboard.writeText(wireframe.htmlCode);
    toast({
      title: "Copied",
      description: "HTML code copied to clipboard.",
    });
  };

  const handleWireframeDownload = (wireframe: WireframeData) => {
    const element = document.createElement('a');
    const file = new Blob([wireframe.htmlCode], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${wireframe.pageName.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleWireframeDelete = (wireframe: WireframeData) => {
    const updatedWireframes = generatedWireframes.filter(w => w.id !== wireframe.id);
    setGeneratedWireframes(updatedWireframes);
    localStorage.setItem('generated_wireframes', JSON.stringify(updatedWireframes));
    
    toast({
      title: "Wireframe Deleted",
      description: `${wireframe.pageName} has been removed.`,
    });
  };

  const handleEnhanceCode = async () => {
    if (!selectedPageCode || !enhancementPrompt.trim()) return;

    setIsEnhancing(true);
    setEnhancedCode(null);

    try {
      const enhancer = createAICodeEnhancer();
      const result = await enhancer.enhanceCode({
        htmlCode: selectedPageCode.htmlCode,
        cssCode: selectedPageCode.cssCode,
        prompt: enhancementPrompt,
        pageName: selectedPageCode.pageName
      });

      setEnhancedCode(result);
      toast({
        title: "Enhancement Complete",
        description: "Your code has been enhanced successfully.",
      });
    } catch (error) {
      console.error('Code enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance the code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleEnhancePreciseElement = async () => {
    if (!selectedPageCode || !selectedElement || !selectedElementPrompt.trim()) return;

    setIsEnhancing(true);
    setEnhancedCode(null);

    try {
      const enhancer = createPreciseElementEnhancer();
      const result = await enhancer.enhanceSpecificElement({
        htmlCode: selectedPageCode.htmlCode,
        cssCode: selectedPageCode.cssCode,
        targetElement: selectedElement,
        enhancementPrompt: selectedElementPrompt,
        pageName: selectedPageCode.pageName
      });

      setEnhancedCode({
        html: result.html,
        css: result.css,
        js: result.js,
        explanation: result.explanation,
        improvements: result.improvements
      });
      
      toast({
        title: "Element Enhanced",
        description: `Successfully enhanced ${selectedElement}`,
      });
    } catch (error) {
      console.error('Element enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance the element. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleApplyEnhancement = () => {
    if (!enhancedCode || !selectedPageCode) return;

    const updatedWireframes = generatedWireframes.map(wireframe => {
      if (wireframe.pageName === selectedPageCode.pageName) {
        return {
          ...wireframe,
          htmlCode: enhancedCode.html,
          cssCode: enhancedCode.css,
          jsCode: enhancedCode.js,
          isEnhanced: true,
          lastUpdated: new Date().toISOString(),
          lastEnhancedElement: selectedElement || 'General Enhancement',
          enhancementExplanation: enhancedCode.explanation
        };
      }
      return wireframe;
    });

    setGeneratedWireframes(updatedWireframes);
    localStorage.setItem('generated_wireframes', JSON.stringify(updatedWireframes));
    
    setSelectedPageCode({
      ...selectedPageCode,
      htmlCode: enhancedCode.html,
      cssCode: enhancedCode.css,
      jsCode: enhancedCode.js,
      isEnhanced: true,
      lastEnhancedElement: selectedElement || 'General Enhancement',
      enhancementExplanation: enhancedCode.explanation
    });

    toast({
      title: "Enhancement Applied",
      description: "The enhanced code has been saved to your wireframe.",
    });
  };

  const handleCopyCode = (type: 'html' | 'css' | 'js') => {
    if (!selectedPageCode && !enhancedCode) return;

    let code = '';
    if (enhancedCode) {
      code = enhancedCode[type];
    } else if (selectedPageCode) {
      code = type === 'html' ? selectedPageCode.htmlCode : 
             type === 'css' ? selectedPageCode.cssCode : 
             selectedPageCode.jsCode || '';
    }

    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: `${type.toUpperCase()} code copied to clipboard.`,
    });
  };

  const handleDownloadCode = () => {
    if (!enhancedCode) return;

    const zip = {
      'index.html': enhancedCode.html,
      'styles.css': enhancedCode.css,
      'script.js': enhancedCode.js
    };

    Object.entries(zip).forEach(([filename, content]) => {
      const element = document.createElement('a');
      const file = new Blob([content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    });

    toast({
      title: "Files Downloaded",
      description: "All code files have been downloaded.",
    });
  };

  const clearAllWireframes = () => {
    setGeneratedWireframes([]);
    localStorage.removeItem('generated_wireframes');
    toast({
      title: "All Cleared",
      description: "All wireframes have been removed.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NavigationBar title="Wireframe Designer" showBackButton={true} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <WorkflowProgress currentStep="wireframes" />

        {currentStep === "input" && (
          <div className="space-y-6">
            <DesignPromptForm
              designPrompt={designPrompt}
              onDesignPromptChange={setDesignPrompt}
              onAnalyzeRequirements={handleAnalyzeRequirements}
              isAnalyzing={isAnalyzing}
              error={error}
            />
          </div>
        )}

        {currentStep === "analyzing" && (
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="customization">Customization</TabsTrigger>
                <TabsTrigger value="brand">Brand Guidelines</TabsTrigger>
                <TabsTrigger value="wireframes">Wireframes</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-6">
                <AnalysisResultsPanel
                  analysisResult={analysisResult}
                  detailedWireframes={detailedWireframes}
                  isGeneratingContent={isGeneratingContent}
                  isGeneratingWireframes={isGeneratingWireframes}
                  contentGenerationProgress={contentGenerationProgress}
                  wireframeGenerationProgress={wireframeGenerationProgress}
                  onGenerateDetailedContent={handleGenerateDetailedContent}
                  onGenerateWireframes={handleGenerateWireframes}
                  onRefreshContent={() => setAnalysisResult(null)}
                />
              </TabsContent>

              <TabsContent value="customization" className="space-y-6">
                <WireframeCustomizationPanel
                  selectedDeviceType={selectedDeviceType}
                  selectedColorScheme={selectedColorScheme}
                  selectedDesignType={selectedDesignType}
                  selectedLayout={selectedLayout}
                  onDeviceTypeChange={setSelectedDeviceType}
                  onColorSchemeChange={setSelectedColorScheme}
                  onDesignTypeChange={setSelectedDesignType}
                  onLayoutChange={setSelectedLayout}
                />
              </TabsContent>

              <TabsContent value="brand" className="space-y-6">
                <BrandGuidelinesPanel
                  brandGuidelines={brandGuidelines}
                  storedBrandGuidelines={storedBrandGuidelines}
                  selectedStoredGuideline={selectedStoredGuideline}
                  isExtractingBrand={isExtractingBrand}
                  brandExtractionError={brandExtractionError}
                  onFileUpload={handleBrandFileUpload}
                  onStoredGuidelineSelect={handleStoredGuidelineSelect}
                  onStoredGuidelineDelete={handleStoredGuidelineDelete}
                  onClearBrandGuidelines={handleClearBrandGuidelines}
                />
              </TabsContent>

              <TabsContent value="wireframes" className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("input")}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Input
                  </Button>
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

                <WireframeGallery
                  wireframes={generatedWireframes}
                  isRefreshing={isRefreshing}
                  onWireframeEdit={handleWireframeEdit}
                  onWireframeDelete={handleWireframeDelete}
                  onWireframeRefresh={(wireframe) => {}}
                  onWireframeDownload={handleWireframeDownload}
                  onWireframeCopy={handleWireframeCopy}
                  onWireframePreview={handleWireframePreview}
                  onWireframeViewCode={handleWireframeViewCode}
                  selectedDeviceType={selectedDeviceType}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <CodeEnhancementModal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          selectedPageCode={selectedPageCode}
          enhancementPrompt={enhancementPrompt}
          onEnhancementPromptChange={setEnhancementPrompt}
          isEnhancing={isEnhancing}
          enhancedCode={enhancedCode}
          selectionMode={selectionMode}
          selectedElement={selectedElement}
          selectedElementPrompt={selectedElementPrompt}
          onSelectionModeToggle={() => setSelectionMode(!selectionMode)}
          onSelectedElementPromptChange={setSelectedElementPrompt}
          onEnhanceCode={handleEnhanceCode}
          onEnhancePreciseElement={handleEnhancePreciseElement}
          onApplyEnhancement={handleApplyEnhancement}
          onCopyCode={handleCopyCode}
          onDownloadCode={handleDownloadCode}
        />
      </div>
    </div>
  );
}
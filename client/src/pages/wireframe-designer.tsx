import { useState, useEffect } from "react";
import { NavigationBar } from "@/components/navigation-bar";
import { WorkflowProgress } from "@/components/workflow-progress";
import { BrandExtractionModal } from "@/components/brand-guidelines/brand-extraction-modal";
import { BrandDisplayPanel } from "@/components/brand-guidelines/brand-display-panel";
import { DesignSettingsPanel } from "@/components/design-controls/design-settings-panel";
import { WireframeGenerationPanel } from "@/components/wireframe/wireframe-generation-panel";
import { WireframeGallery } from "@/components/wireframe/wireframe-gallery";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/storage-utils";
import { convertExternalToBrandGuideline, type ExternalBrandData } from "@/lib/external-brand-converter";
import type { BrandGuideline } from "@/lib/brand-guideline-extractor";
import type { PageContentCard } from "@/lib/page-content-agent";

interface WireframeItem {
  id: string;
  pageName: string;
  html: string;
  css: string;
  timestamp: number;
  deviceType: string;
  designStyle: string;
  isEnhanced?: boolean;
}

export default function WireframeDesigner() {
  const { toast } = useToast();

  // Project state
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [pageContents, setPageContents] = useState<PageContentCard[]>([]);

  // Design settings state
  const [selectedDevice, setSelectedDevice] = useState("desktop");
  const [selectedColorScheme, setSelectedColorScheme] = useState("modern-blue");
  const [selectedDesignType, setSelectedDesignType] = useState("modern");
  const [selectedLayout, setSelectedLayout] = useState("standard-header");

  // Brand guidelines state
  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuideline | null>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [isExtractingBrand, setIsExtractingBrand] = useState(false);
  const [brandExtractionError, setBrandExtractionError] = useState("");
  const [extractionProgress, setExtractionProgress] = useState({ 
    current: 0, 
    total: 100, 
    currentStep: "" 
  });

  // Wireframe generation state
  const [wireframes, setWireframes] = useState<WireframeItem[]>([]);
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);
  const [wireframeProgress, setWireframeProgress] = useState({
    current: 0,
    total: 0,
    currentPage: ""
  });

  // Load existing wireframes on component mount
  useEffect(() => {
    loadExistingWireframes();
  }, []);

  const loadExistingWireframes = () => {
    try {
      const stored = storage.getWireframes();
      console.log("Loading generated wireframes from storage:", stored.length, "wireframes found");
      
      if (stored.length > 0) {
        console.log("All wireframes with IDs:", stored.map(w => ({ id: w.id, pageName: w.pageName })));
        setWireframes(stored);
      }
    } catch (error) {
      console.error("Error loading wireframes:", error);
    }
  };

  // Brand guidelines extraction handler
  const handleBrandGuidelineUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setBrandExtractionError('Please select a valid PDF file');
      return;
    }

    setIsExtractingBrand(true);
    setBrandExtractionError('');
    setExtractionProgress({ current: 0, total: 100, currentStep: "Preparing PDF for extraction..." });

    try {
      console.log('Starting external API PDF extraction for:', file.name);
      setExtractionProgress({ current: 20, total: 100, currentStep: "Uploading PDF to extraction service..." });
      
      const formData = new FormData();
      formData.append("file", file, file.name);

      const requestOptions = {
        method: 'POST',
        body: formData,
        redirect: 'follow' as RequestRedirect
      };

      setExtractionProgress({ current: 40, total: 100, currentStep: "Processing PDF with external service..." });

      const response = await fetch("http://127.0.0.1:5001/extract-guidelines", requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('External API error response:', errorText);
        throw new Error(`External API failed with status: ${response.status} - ${errorText}`);
      }

      const result = await response.text();
      console.log('External API response:', result);

      setExtractionProgress({ current: 70, total: 100, currentStep: "Processing extracted guidelines..." });

      let extractedData: ExternalBrandData;
      try {
        extractedData = JSON.parse(result);
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        throw new Error('Invalid response format from extraction service');
      }

      setExtractionProgress({ current: 85, total: 100, currentStep: "Converting brand data..." });

      // Convert external API data to BrandGuideline format
      const brandGuidelines = convertExternalToBrandGuideline(extractedData);
      setBrandGuidelines(brandGuidelines);
      
      setExtractionProgress({ current: 100, total: 100, currentStep: "Brand guidelines extraction complete!" });
      
      console.log('External API brand analysis completed:', {
        brandName: extractedData.brand_name || extractedData.brand,
        colorsFound: Object.keys(extractedData.color_palette || {}).length,
        typographyFound: extractedData.typography ? 'Yes' : 'No',
        processingTime: '3s'
      });
      
      toast({
        title: "Brand Guidelines Extracted",
        description: `Successfully extracted ${extractedData.brand_name || extractedData.brand || 'brand'} guidelines from PDF.`,
      });
      
      setShowBrandModal(true);
    } catch (error) {
      console.error('External API brand extraction error:', error);
      
      let errorMessage = 'Unknown error occurred';
      let userMessage = 'Could not extract brand guidelines from the PDF file.';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Connection failed - extraction service unavailable';
        userMessage = 'Cannot connect to the brand extraction service. Please ensure the external API service is running on http://127.0.0.1:5001';
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('NetworkError') || error.message.includes('ECONNREFUSED')) {
          userMessage = 'Network connection failed. Please verify the extraction service is accessible.';
        }
      }
      
      setBrandExtractionError(`Failed to extract brand guidelines: ${errorMessage}`);
      toast({
        title: "Extraction Service Unavailable",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsExtractingBrand(false);
      setExtractionProgress({ current: 0, total: 0, currentStep: "" });
    }
  };

  // Wireframe generation handler
  const handleGenerateWireframes = async () => {
    if (!projectName.trim() || pageContents.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a project name and at least one page to generate wireframes.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingWireframes(true);
    setWireframeProgress({ current: 0, total: pageContents.length, currentPage: "" });

    try {
      const generatedWireframes: WireframeItem[] = [];

      for (let i = 0; i < pageContents.length; i++) {
        const page = pageContents[i];
        setWireframeProgress({ 
          current: i, 
          total: pageContents.length, 
          currentPage: page.pageName 
        });

        // Generate wireframe for this page
        const wireframeHtml = generateBasicWireframeHTML(page);
        const wireframeCss = generateBasicWireframeCSS();

        const wireframe: WireframeItem = {
          id: `wireframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pageName: page.pageName,
          html: wireframeHtml,
          css: wireframeCss,
          timestamp: Date.now(),
          deviceType: selectedDevice,
          designStyle: selectedDesignType,
          isEnhanced: false
        };

        generatedWireframes.push(wireframe);
        
        // Save to storage
        storage.saveWireframe(wireframe);
      }

      setWireframes(prev => [...prev, ...generatedWireframes]);
      setWireframeProgress({ 
        current: pageContents.length, 
        total: pageContents.length, 
        currentPage: "Complete!" 
      });

      toast({
        title: "Wireframes Generated",
        description: `Successfully generated ${generatedWireframes.length} wireframes.`,
      });

    } catch (error) {
      console.error('Error generating wireframes:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate wireframes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWireframes(false);
    }
  };

  // Helper functions for basic wireframe generation
  const generateBasicWireframeHTML = (page: PageContentCard): string => {
    return `
      <div class="wireframe-container">
        <header class="wireframe-header">
          <h1>${page.pageName}</h1>
          <nav class="wireframe-nav">
            ${page.navigation.map(item => `<a href="#">${item}</a>`).join('')}
          </nav>
        </header>
        <main class="wireframe-main">
          ${page.headers.map(header => `<h2>${header}</h2>`).join('')}
          ${page.forms.map(form => `
            <form class="wireframe-form">
              <h3>${form.title}</h3>
              ${form.fields.map(field => `<input placeholder="${field}" />`).join('')}
              <button>${form.submitAction}</button>
            </form>
          `).join('')}
          ${page.buttons.map(button => `<button class="btn-${button.style}">${button.label}</button>`).join('')}
        </main>
      </div>
    `;
  };

  const generateBasicWireframeCSS = (): string => {
    return `
      .wireframe-container { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
      .wireframe-header { border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; }
      .wireframe-nav a { margin-right: 20px; text-decoration: none; color: #007bff; }
      .wireframe-main { line-height: 1.6; }
      .wireframe-form { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
      .wireframe-form input { display: block; margin: 10px 0; padding: 8px; width: 200px; }
      button { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; }
      .btn-primary { background: #007bff; color: white; }
      .btn-secondary { background: #6c757d; color: white; }
    `;
  };

  // Wireframe action handlers
  const handleWireframePreview = (wireframe: WireframeItem) => {
    // Preview is handled by the gallery component
  };

  const handleWireframeEdit = (wireframe: WireframeItem) => {
    toast({
      title: "Edit Feature",
      description: "Wireframe editing feature coming soon!",
    });
  };

  const handleWireframeDelete = (wireframeId: string) => {
    setWireframes(prev => prev.filter(w => w.id !== wireframeId));
    storage.deleteWireframe(wireframeId);
    toast({
      title: "Wireframe Deleted",
      description: "Wireframe has been removed.",
    });
  };

  const handleWireframeDownload = (wireframe: WireframeItem) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${wireframe.pageName}</title>
          <style>${wireframe.css}</style>
        </head>
        <body>
          ${wireframe.html}
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wireframe.pageName.replace(/\s+/g, '_')}_wireframe.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyToAll = () => {
    toast({
      title: "Settings Applied",
      description: "Design settings will be applied to all new wireframes.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar 
        title="Wireframe Designer" 
        showBackButton={true}
        showStartOverButton={true}
      />
      
      <WorkflowProgress 
        currentStep="wireframes" 
        completedSteps={["input", "research", "plan"]}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Brand Guidelines Panel */}
            {brandGuidelines && (
              <BrandDisplayPanel 
                brandGuidelines={brandGuidelines}
              />
            )}

            {/* Design Settings */}
            <DesignSettingsPanel
              selectedColorScheme={selectedColorScheme}
              onColorSchemeChange={setSelectedColorScheme}
              selectedDesignType={selectedDesignType}
              onDesignTypeChange={setSelectedDesignType}
              selectedLayout={selectedLayout}
              onLayoutChange={setSelectedLayout}
              selectedDevice={selectedDevice}
              onDeviceChange={setSelectedDevice}
              onApplyToAll={handleApplyToAll}
            />

            {/* Wireframe Generation */}
            <WireframeGenerationPanel
              projectName={projectName}
              onProjectNameChange={setProjectName}
              projectDescription={projectDescription}
              onProjectDescriptionChange={setProjectDescription}
              pageContents={pageContents}
              onPageContentsChange={setPageContents}
              onGenerateWireframes={handleGenerateWireframes}
              isGeneratingWireframes={isGeneratingWireframes}
              wireframeProgress={wireframeProgress}
            />
          </div>

          {/* Right Column - Wireframes Gallery */}
          <div className="lg:col-span-2">
            <WireframeGallery
              wireframes={wireframes}
              onPreview={handleWireframePreview}
              onEdit={handleWireframeEdit}
              onDelete={handleWireframeDelete}
              onDownload={handleWireframeDownload}
            />
          </div>
        </div>

        {/* Floating Brand Upload Button */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setShowBrandModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors"
            title="Upload Brand Guidelines"
          >
            🎨
          </button>
        </div>
      </div>

      {/* Brand Extraction Modal */}
      <BrandExtractionModal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        isExtracting={isExtractingBrand}
        extractionProgress={extractionProgress}
        extractionError={brandExtractionError}
        onFileUpload={handleBrandGuidelineUpload}
      />
    </div>
  );
}
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NavigationBar } from '@/components/navigation-bar';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Download, 
  Eye, 
  RefreshCw, 
  Palette, 
  Type, 
  Layout, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Search,
  Trash2,
  Plus,
  Settings,
  FileText,
  Edit,
  Save,
  X,
  Code,
  Globe,
  Zap,
  Sparkles,
  Target,
  Users,
  Star,
  Heart,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Filter,
  SortAsc,
  Grid,
  List,
  Maximize,
  Minimize,
  Copy,
  Share,
  BookOpen,
  Lightbulb,
  Wand2,
  Layers,
  Image,
  MousePointer,
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Link,
  ExternalLink,
  Home,
  Menu,
  User,
  ShoppingCart,
  MessageCircle,
  Bell,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  Camera,
  Video,
  Music,
  Play,
  Pause,
  Stop,
  Volume2,
  VolumeX
} from 'lucide-react';

// Import components
import { BrandGuidelinesModal } from '@/components/wireframe/brand-guidelines-modal';
import { BrandUploadSection } from '@/components/wireframe/brand-upload-section';
import { PageContentSelector } from '@/components/wireframe/page-content-selector';
import { PageContentEditor } from '@/components/wireframe/page-content-editor';
import { WireframeGenerationSection } from '@/components/wireframe/wireframe-generation-section';
import { WireframeResultsSection } from '@/components/wireframe/wireframe-results-section';

// Import types and utilities
import { 
  BrandGuideline, 
  BrandGuidelinesStorage,
  extractBrandGuidelinesFromPDF,
  multimodalBrandExtractionFromPDF
} from '@/lib/brand-guideline-extractor';

// Main wireframe designer component
export default function WireframeDesigner() {
  const { toast } = useToast();
  
  // Brand guidelines state
  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuideline | null>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [storedBrandGuidelines, setStoredBrandGuidelines] = useState<BrandGuideline[]>([]);
  const [selectedStoredGuideline, setSelectedStoredGuideline] = useState("");
  const [isExtractingBrand, setIsExtractingBrand] = useState(false);
  const [brandExtractionError, setBrandExtractionError] = useState<string>("");
  const [isPerformingMultimodalAnalysis, setIsPerformingMultimodalAnalysis] = useState(false);
  const [multimodalAnalysisProgress, setMultimodalAnalysisProgress] = useState({ current: 0, total: 0, currentStep: "" });

  // Page content state
  const [pageContentCards, setPageContentCards] = useState<PageContentCard[]>([]);
  const [selectedPageContent, setSelectedPageContent] = useState<PageContentCard | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Wireframe generation state
  const [selectedDevice, setSelectedDevice] = useState<string>('desktop');
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>('modern-blue');
  const [selectedDesignType, setSelectedDesignType] = useState<string>('modern');
  const [selectedLayout, setSelectedLayout] = useState<string>('standard-header');
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);
  const [generatedWireframes, setGeneratedWireframes] = useState<GeneratedWireframe[]>([]);
  const [selectedPageCode, setSelectedPageCode] = useState<{ pageName: string; htmlCode: string; cssCode: string; jsCode: string } | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Load stored brand guidelines on component mount
  useEffect(() => {
    setStoredBrandGuidelines(BrandGuidelinesStorage.getAll());
  }, []);

  // Update page content handler
  const updatePageContent = (updatedContent: PageContentCard) => {
    setSelectedPageContent(updatedContent);
    setPageContentCards(prev => prev.map(card => 
      card.id === updatedContent.id ? updatedContent : card
    ));
  };

  // Generate wireframe handler
  const handleGenerateWireframe = async () => {
    if (!selectedPageContent) return;
    
    setIsGeneratingWireframes(true);
    try {
      toast({
        title: "Wireframe Generated",
        description: `Generated wireframe for ${selectedPageContent.pageName}`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate wireframe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWireframes(false);
    }
  };

  // Handle stored brand guideline selection
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
        title: "Brand Guidelines Deleted",
        description: "The selected brand guidelines have been removed.",
      });
    }
  };

  // Download wireframe function
  const downloadWireframe = (pageName: string, htmlCode: string, cssCode: string) => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageName}</title>
    <style>
        ${cssCode}
    </style>
</head>
<body>
    ${htmlCode}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageName.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NavigationBar title="Wireframe Designer" showBackButton={true} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Brand Guidelines Upload Section */}
        <BrandUploadSection
          brandGuidelines={brandGuidelines}
          setBrandGuidelines={setBrandGuidelines}
          storedBrandGuidelines={storedBrandGuidelines}
          setStoredBrandGuidelines={setStoredBrandGuidelines}
          selectedStoredGuideline={selectedStoredGuideline}
          setSelectedStoredGuideline={setSelectedStoredGuideline}
          isExtractingBrand={isExtractingBrand}
          setIsExtractingBrand={setIsExtractingBrand}
          brandExtractionError={brandExtractionError}
          setBrandExtractionError={setBrandExtractionError}
          isPerformingMultimodalAnalysis={isPerformingMultimodalAnalysis}
          setIsPerformingMultimodalAnalysis={setIsPerformingMultimodalAnalysis}
          multimodalAnalysisProgress={multimodalAnalysisProgress}
          setMultimodalAnalysisProgress={setMultimodalAnalysisProgress}
          setShowBrandModal={setShowBrandModal}
          onStoredGuidelineSelect={handleStoredGuidelineSelection}
          onDeleteStoredGuideline={handleDeleteStoredGuideline}
        />

        {/* Page Content Selection and Wireframe Generation */}
        {pageContentCards.length > 0 && (
          <>
            <PageContentSelector
              availablePageContent={pageContentCards}
              selectedPageContent={selectedPageContent}
              onPageContentSelect={setSelectedPageContent}
            />

            <PageContentEditor
              selectedPageContent={selectedPageContent}
              onPageContentUpdate={updatePageContent}
            />

            <WireframeGenerationSection
              selectedDevice={selectedDevice}
              selectedColorScheme={selectedColorScheme}
              selectedDesignType={selectedDesignType}
              selectedLayout={selectedLayout}
              isGenerating={isGeneratingWireframes}
              brandGuidelines={brandGuidelines}
              onDeviceChange={setSelectedDevice}
              onColorSchemeChange={setSelectedColorScheme}
              onDesignTypeChange={setSelectedDesignType}
              onLayoutChange={setSelectedLayout}
              onGenerateWireframe={handleGenerateWireframe}
            />

            <WireframeResultsSection
              generatedWireframes={generatedWireframes.map(w => ({
                id: w.id,
                pageName: w.pageName,
                content: w.htmlCode,
                generatedAt: new Date(w.lastUpdated || Date.now()),
                deviceType: selectedDevice,
                designStyle: selectedDesignType,
                colorScheme: selectedColorScheme,
                layout: selectedLayout
              }))}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onViewWireframe={(wireframe) => {
                const original = generatedWireframes.find(w => w.id === wireframe.id);
                if (original) {
                  setSelectedPageCode({
                    pageName: original.pageName,
                    htmlCode: original.htmlCode,
                    cssCode: original.cssCode,
                    jsCode: original.jsCode
                  });
                  setShowCodeModal(true);
                }
              }}
              onEditWireframe={(wireframe) => {
                const original = generatedWireframes.find(w => w.id === wireframe.id);
                if (original) {
                  setSelectedPageCode({
                    pageName: original.pageName,
                    htmlCode: original.htmlCode,
                    cssCode: original.cssCode,
                    jsCode: original.jsCode
                  });
                  setShowCodeModal(true);
                }
              }}
              onDeleteWireframe={(wireframeId) => {
                setGeneratedWireframes(prev => prev.filter(w => w.id !== wireframeId));
              }}
              onDownloadWireframe={(wireframe) => {
                const original = generatedWireframes.find(w => w.id === wireframe.id);
                if (original) {
                  downloadWireframe(original.pageName, original.htmlCode, original.cssCode);
                }
              }}
            />
          </>
        )}

        {/* Brand Guidelines Modal */}
        <BrandGuidelinesModal
          showBrandModal={showBrandModal}
          setShowBrandModal={setShowBrandModal}
          brandGuidelines={brandGuidelines}
        />

        {/* Code Preview Modal */}
        <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPageCode?.pageName} - Generated Code
              </DialogTitle>
              <DialogDescription>
                Preview and download the generated wireframe code
              </DialogDescription>
            </DialogHeader>
            
            {selectedPageCode && (
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="css">CSS</TabsTrigger>
                  <TabsTrigger value="js">JavaScript</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg p-4 bg-white">
                    <iframe
                      srcDoc={`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${selectedPageCode.pageName}</title>
    <style>${selectedPageCode.cssCode}</style>
</head>
<body>
    ${selectedPageCode.htmlCode}
    <script>${selectedPageCode.jsCode}</script>
</body>
</html>`}
                      className="w-full h-96 border-0"
                      title="Wireframe Preview"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="html" className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      <code>{selectedPageCode.htmlCode}</code>
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="css" className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      <code>{selectedPageCode.cssCode}</code>
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="js" className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      <code>{selectedPageCode.jsCode}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCodeModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (selectedPageCode) {
                    downloadWireframe(selectedPageCode.pageName, selectedPageCode.htmlCode, selectedPageCode.cssCode);
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Type definitions
interface PageContentCard {
  id: string;
  pageName: string;
  pageType: string;
  purpose: string;
  stakeholders: string[];
  headers: string[];
  buttons: { label: string; action: string; style: string }[];
  forms: { title: string; fields: string[]; submitAction: string }[];
  lists: { title: string; items: string[]; type: string }[];
  navigation: string[];
  additionalContent: string[];
  isEdited: boolean;
}

interface GeneratedWireframe {
  id: string;
  pageName: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  lastUpdated?: string;
}
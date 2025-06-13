import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NavigationBar } from '@/components/navigation-bar';
import { WorkflowProgress } from '@/components/workflow-progress';
import { Frame, Download, Eye, Code, Edit, Trash2, Sparkles, Palette, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createPageContentAgent } from '@/lib/page-content-agent';
import { createWireframeAnalysisAgent } from '@/lib/wireframe-analysis-agent';
import { createAICodeEnhancer } from '@/lib/ai-code-enhancer';

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

interface WireframeData {
  id: string;
  pageName: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  designStyle: string;
  timestamp: string;
}

interface EnhancedWireframeData extends WireframeData {
  enhancedHtml?: string;
  enhancedCss?: string;
  enhancedJs?: string;
  enhancementHistory?: { prompt: string; timestamp: string }[];
}

export default function WireframeDesigner() {
  const { toast } = useToast();
  
  // State management
  const [pageContentCards, setPageContentCards] = useState<PageContentCard[]>([]);
  const [generatedWireframes, setGeneratedWireframes] = useState<EnhancedWireframeData[]>([]);
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [selectedDesignStyle, setSelectedDesignStyle] = useState('modern');
  const [selectedColorScheme, setSelectedColorScheme] = useState('blue');
  
  // Modal states
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPageCode, setSelectedPageCode] = useState<EnhancedWireframeData | null>(null);
  
  // Enhancement states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  
  // Progress tracking
  const [wireframeGenerationProgress, setWireframeGenerationProgress] = useState({
    current: 0,
    total: 0,
    currentPage: ''
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCards = localStorage.getItem('wireframe-page-content-cards');
    if (savedCards) {
      try {
        const cards = JSON.parse(savedCards);
        setPageContentCards(cards);
      } catch (error) {
        console.error('Error loading page content cards:', error);
      }
    }

    const savedWireframes = localStorage.getItem('enhanced-wireframes');
    if (savedWireframes) {
      try {
        const wireframes = JSON.parse(savedWireframes);
        setGeneratedWireframes(wireframes);
      } catch (error) {
        console.error('Error loading wireframes:', error);
      }
    }
  }, []);

  // Save wireframes to localStorage
  useEffect(() => {
    if (generatedWireframes.length > 0) {
      localStorage.setItem('enhanced-wireframes', JSON.stringify(generatedWireframes));
    }
  }, [generatedWireframes]);

  const generateWireframes = async () => {
    if (pageContentCards.length === 0) return;

    setIsGeneratingWireframes(true);
    setWireframeGenerationProgress({
      current: 0,
      total: pageContentCards.length,
      currentPage: ''
    });

    try {
      const newWireframes: EnhancedWireframeData[] = [];

      for (let i = 0; i < pageContentCards.length; i++) {
        const card = pageContentCards[i];
        setWireframeGenerationProgress({
          current: i + 1,
          total: pageContentCards.length,
          currentPage: card.pageName
        });

        try {
          const response = await fetch('/api/generate-wireframe-html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pageContent: card,
              designStyle: selectedDesignStyle,
              deviceType: selectedDeviceType
            })
          });

          if (response.ok) {
            const data = await response.json();
            const wireframe: EnhancedWireframeData = {
              id: `wireframe-${Date.now()}-${i}`,
              pageName: card.pageName,
              htmlCode: data.htmlCode || '',
              cssCode: data.cssCode || '',
              jsCode: data.jsCode || '',
              deviceType: selectedDeviceType,
              designStyle: selectedDesignStyle,
              timestamp: new Date().toISOString(),
              enhancementHistory: []
            };
            newWireframes.push(wireframe);
          }
        } catch (error) {
          console.error(`Error generating wireframe for ${card.pageName}:`, error);
        }
      }

      setGeneratedWireframes(prev => [...prev, ...newWireframes]);
      
      toast({
        title: "Wireframes Generated",
        description: `Successfully generated ${newWireframes.length} wireframes`,
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

  const enhanceWireframe = async (wireframe: EnhancedWireframeData, prompt: string) => {
    setIsEnhancing(true);
    
    try {
      const enhancer = createAICodeEnhancer();
      const enhanced = await enhancer.enhanceCode({
        htmlCode: wireframe.enhancedHtml || wireframe.htmlCode,
        cssCode: wireframe.enhancedCss || wireframe.cssCode,
        prompt: prompt,
        pageName: wireframe.pageName
      });

      const updatedWireframe: EnhancedWireframeData = {
        ...wireframe,
        enhancedHtml: enhanced.html,
        enhancedCss: enhanced.css,
        enhancedJs: enhanced.js,
        enhancementHistory: [
          ...(wireframe.enhancementHistory || []),
          { prompt, timestamp: new Date().toISOString() }
        ]
      };

      setGeneratedWireframes(prev => 
        prev.map(w => w.id === wireframe.id ? updatedWireframe : w)
      );

      toast({
        title: "Enhancement Complete",
        description: "Wireframe has been enhanced successfully",
      });
    } catch (error) {
      console.error('Error enhancing wireframe:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance wireframe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
      setEnhancementPrompt('');
    }
  };

  const deleteWireframe = (wireframeId: string) => {
    setGeneratedWireframes(prev => prev.filter(w => w.id !== wireframeId));
    toast({
      title: "Wireframe Deleted",
      description: "Wireframe has been removed successfully",
    });
  };

  const exportWireframe = (wireframe: EnhancedWireframeData) => {
    const htmlContent = wireframe.enhancedHtml || wireframe.htmlCode;
    const cssContent = wireframe.enhancedCss || wireframe.cssCode;
    const jsContent = wireframe.enhancedJs || wireframe.jsCode;
    
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${wireframe.pageName}</title>
    <style>${cssContent}</style>
</head>
<body>
    ${htmlContent}
    <script>${jsContent}</script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wireframe.pageName.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
                <Frame className="h-5 w-5 text-white" />
              </div>
              Wireframe Designer
            </h1>
            <p className="text-gray-600 mt-2">Transform your page content into interactive wireframes</p>
          </div>
        </div>

        {/* Page Content Cards Display */}
        {pageContentCards.length > 0 && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
              <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Generated Page Content ({pageContentCards.length})
              </h2>
              
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
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-800">{card.pageName}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{card.pageType}</p>
                        </div>
                        <Badge variant="outline" className="bg-purple-100 text-purple-700">
                          {card.stakeholders.length} stakeholders
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Purpose:</p>
                          <p className="text-xs text-gray-600">{card.purpose}</p>
                        </div>
                        
                        {card.headers.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Headers:</p>
                            <div className="flex flex-wrap gap-1">
                              {card.headers.slice(0, 3).map((header, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{header}</Badge>
                              ))}
                              {card.headers.length > 3 && (
                                <Badge variant="secondary" className="text-xs">+{card.headers.length - 3} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {card.buttons.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Buttons:</p>
                            <div className="flex flex-wrap gap-1">
                              {card.buttons.slice(0, 2).map((button, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{button.label}</Badge>
                              ))}
                              {card.buttons.length > 2 && (
                                <Badge variant="outline" className="text-xs">+{card.buttons.length - 2} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
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

                  {/* Design Style Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Design Style</Label>
                    <Select value={selectedDesignStyle} onValueChange={setSelectedDesignStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="minimalist">Minimalist</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
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
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Wireframes Button */}
                <div className="flex justify-center pt-4 border-t border-gray-200">
                  <Button
                    onClick={generateWireframes}
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
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            {wireframe.deviceType === 'mobile' && <Smartphone className="h-4 w-4" />}
                            {wireframe.deviceType === 'tablet' && <Tablet className="h-4 w-4" />}
                            {wireframe.deviceType === 'desktop' && <Monitor className="h-4 w-4" />}
                            {wireframe.pageName}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1 capitalize">
                            {wireframe.designStyle} • {wireframe.deviceType}
                          </p>
                          {wireframe.enhancementHistory && wireframe.enhancementHistory.length > 0 && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Enhanced {wireframe.enhancementHistory.length}x
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWireframe(wireframe.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Preview iframe */}
                        <div className="border rounded-lg bg-white p-2">
                          <iframe
                            srcDoc={`
                              <!DOCTYPE html>
                              <html>
                                <head>
                                  <style>${wireframe.enhancedCss || wireframe.cssCode}</style>
                                  <style>
                                    body { margin: 0; padding: 20px; transform: scale(0.8); transform-origin: top left; width: 125%; height: 125%; }
                                  </style>
                                </head>
                                <body>
                                  ${wireframe.enhancedHtml || wireframe.htmlCode}
                                  <script>${wireframe.enhancedJs || wireframe.jsCode}</script>
                                </body>
                              </html>
                            `}
                            className="w-full h-40 border-0 rounded"
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </div>

                        {/* Enhancement Section */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Quick Enhancements</Label>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => enhanceWireframe(wireframe, "Make it more modern with better typography and spacing")}
                              disabled={isEnhancing}
                              className="text-xs"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Modern
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => enhanceWireframe(wireframe, "Add hover effects and smooth animations")}
                              disabled={isEnhancing}
                              className="text-xs"
                            >
                              <Palette className="h-3 w-3 mr-1" />
                              Animate
                            </Button>
                          </div>
                          
                          <div className="flex gap-2">
                            <Input
                              placeholder="Custom enhancement..."
                              value={enhancementPrompt}
                              onChange={(e) => setEnhancementPrompt(e.target.value)}
                              className="text-sm"
                            />
                            <Button
                              onClick={() => enhanceWireframe(wireframe, enhancementPrompt)}
                              disabled={isEnhancing || !enhancementPrompt.trim()}
                              size="sm"
                            >
                              {isEnhancing ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                              ) : (
                                <Sparkles className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPageCode(wireframe);
                              setShowPreviewModal(true);
                            }}
                            className="flex-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPageCode(wireframe);
                              setShowCodeModal(true);
                            }}
                            className="flex-1"
                          >
                            <Code className="h-3 w-3 mr-1" />
                            Code
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportWireframe(wireframe)}
                            className="flex-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Code Modal */}
        <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Code for {selectedPageCode?.pageName}</DialogTitle>
            </DialogHeader>
            {selectedPageCode && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">HTML</Label>
                  <Textarea
                    value={selectedPageCode.enhancedHtml || selectedPageCode.htmlCode}
                    readOnly
                    className="h-40 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">CSS</Label>
                  <Textarea
                    value={selectedPageCode.enhancedCss || selectedPageCode.cssCode}
                    readOnly
                    className="h-40 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">JavaScript</Label>
                  <Textarea
                    value={selectedPageCode.enhancedJs || selectedPageCode.jsCode}
                    readOnly
                    className="h-40 font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Preview: {selectedPageCode?.pageName}</DialogTitle>
            </DialogHeader>
            {selectedPageCode && (
              <div className="w-full h-[70vh]">
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${selectedPageCode.pageName}</title>
                        <style>${selectedPageCode.enhancedCss || selectedPageCode.cssCode}</style>
                      </head>
                      <body>
                        ${selectedPageCode.enhancedHtml || selectedPageCode.htmlCode}
                        <script>${selectedPageCode.enhancedJs || selectedPageCode.jsCode}</script>
                      </body>
                    </html>
                  `}
                  className="w-full h-full border rounded-lg"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
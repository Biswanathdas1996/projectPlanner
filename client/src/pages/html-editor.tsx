import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { NavigationBar } from "@/components/navigation-bar";
import { useToast } from "@/hooks/use-toast";
import { createAICodeEnhancer } from "@/lib/ai-code-enhancer";
import { createPreciseElementEnhancer } from "@/lib/precise-element-enhancer";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Eye,
  Code,
  Palette,
  Zap,
  MousePointer,
  Download,
  Upload,
  Copy,
  Sparkles,
  Loader2,
  Settings,
  Play,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";

interface HTMLEditorData {
  id: string;
  pageName: string;
  htmlCode: string;
  cssCode: string;
  jsCode?: string;
}

interface EnhancedCodeResponse {
  html: string;
  css: string;
  js: string;
  explanation: string;
  improvements: string[];
}

function HTMLEditorComponent({ initialData }: { initialData?: HTMLEditorData }) {
  console.log('HTMLEditorComponent initialized with data:', {
    hasInitialData: !!initialData,
    id: initialData?.id,
    pageName: initialData?.pageName,
    htmlLength: initialData?.htmlCode?.length,
    cssLength: initialData?.cssCode?.length
  });

  const [htmlCode, setHtmlCode] = useState(initialData?.htmlCode || '');
  const [cssCode, setCssCode] = useState(initialData?.cssCode || '');
  const [jsCode, setJsCode] = useState(initialData?.jsCode || '');
  const [pageName, setPageName] = useState(initialData?.pageName || 'Untitled Page');
  const [wireframeId, setWireframeId] = useState(initialData?.id || '');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewLive, setIsPreviewLive] = useState(true);
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [selectedElementPrompt, setSelectedElementPrompt] = useState('');
  const [isElementEnhancing, setIsElementEnhancing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [enhancedCode, setEnhancedCode] = useState<EnhancedCodeResponse | null>(null);
  
  const previewRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !wireframeId) return;
    
    const saveTimer = setTimeout(() => {
      saveToLocalStorage();
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [htmlCode, cssCode, jsCode, pageName, wireframeId, autoSave]);

  // Load data from localStorage on mount
  useEffect(() => {
    if (!initialData?.id) return;
    
    const savedData = localStorage.getItem(`html_editor_${initialData.id}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setHtmlCode(parsed.htmlCode || initialData.htmlCode);
      setCssCode(parsed.cssCode || initialData.cssCode);
      setJsCode(parsed.jsCode || initialData.jsCode || '');
      setLastSaved(new Date(parsed.lastSaved));
    }
  }, [initialData]);

  const saveToLocalStorage = () => {
    if (!wireframeId) return;
    
    const editorData = {
      id: wireframeId,
      pageName,
      htmlCode,
      cssCode,
      jsCode,
      lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem(`html_editor_${wireframeId}`, JSON.stringify(editorData));
    
    // Also update the main wireframes data using ID
    const existingWireframes = JSON.parse(localStorage.getItem('generated_wireframes') || '[]');
    const updatedWireframes = existingWireframes.map((wireframe: any) => {
      if (wireframe.id === wireframeId) {
        return {
          ...wireframe,
          htmlCode,
          cssCode,
          jsCode,
          isEnhanced: true,
          lastUpdated: new Date().toISOString(),
          lastEnhancedElement: 'HTML Editor'
        };
      }
      return wireframe;
    });
    
    localStorage.setItem('generated_wireframes', JSON.stringify(updatedWireframes));
    setLastSaved(new Date());
    
    console.log('Auto-saved HTML editor data for wireframe ID:', wireframeId);
  };

  const updatePreview = () => {
    if (!previewRef.current || !isPreviewLive) return;
    
    const combinedHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pageName}</title>
        <style>
          ${cssCode}
          
          /* Responsive preview styles */
          body { margin: 0; padding: 0; }
          ${previewMode === 'mobile' ? `
            body { max-width: 375px; margin: 0 auto; }
          ` : previewMode === 'tablet' ? `
            body { max-width: 768px; margin: 0 auto; }
          ` : ''}
        </style>
      </head>
      <body>
        ${htmlCode}
        
        ${jsCode ? `<script>${jsCode}</script>` : ''}
        
        <script>
          // Element selection functionality
          let hoveredElement = null;
          let selectedElement = null;
          
          // Add CSS for hover and selection styles
          const style = document.createElement('style');
          style.textContent = \`
            .element-hover {
              outline: 2px dashed #10B981 !important;
              outline-offset: 2px !important;
              background-color: rgba(16, 185, 129, 0.05) !important;
              cursor: pointer !important;
            }
            .element-selected {
              outline: 3px solid #10B981 !important;
              outline-offset: 2px !important;
              background-color: rgba(16, 185, 129, 0.1) !important;
              position: relative !important;
            }
            .element-selected::after {
              content: "✓ Selected";
              position: absolute;
              top: -25px;
              left: 0;
              background: #10B981;
              color: white;
              padding: 2px 8px;
              font-size: 11px;
              border-radius: 4px;
              z-index: 10000;
              pointer-events: none;
            }
          \`;
          document.head.appendChild(style);
          
          if (window.parent && window.parent.postMessage) {
            // Hover highlighting
            document.addEventListener('mouseover', function(e) {
              if (e.target === document.body || e.target === document.documentElement) return;
              
              // Remove previous hover
              if (hoveredElement && hoveredElement !== selectedElement) {
                hoveredElement.classList.remove('element-hover');
              }
              
              hoveredElement = e.target;
              if (hoveredElement !== selectedElement) {
                hoveredElement.classList.add('element-hover');
              }
            });
            
            document.addEventListener('mouseout', function(e) {
              if (hoveredElement && hoveredElement !== selectedElement) {
                hoveredElement.classList.remove('element-hover');
              }
            });
            
            // Click selection
            document.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              
              // Remove previous selection
              if (selectedElement) {
                selectedElement.classList.remove('element-selected', 'element-hover');
              }
              
              selectedElement = e.target;
              selectedElement.classList.add('element-selected');
              selectedElement.classList.remove('element-hover');
              
              const elementInfo = {
                tagName: selectedElement.tagName.toLowerCase(),
                className: selectedElement.className.replace(/element-(hover|selected)/g, '').trim(),
                id: selectedElement.id,
                textContent: selectedElement.textContent?.substring(0, 50) || '',
                outerHTML: selectedElement.outerHTML?.substring(0, 200) || '',
                selector: generateSelector(selectedElement)
              };
              
              window.parent.postMessage({
                type: 'elementSelected',
                element: elementInfo
              }, '*');
            });
            
            // Generate CSS selector for element
            function generateSelector(element) {
              if (element.id) {
                return '#' + element.id;
              }
              
              let selector = element.tagName.toLowerCase();
              
              if (element.className) {
                const classes = element.className.split(' ')
                  .filter(cls => cls && !cls.startsWith('element-'))
                  .join('.');
                if (classes) {
                  selector += '.' + classes;
                }
              }
              
              return selector;
            }
          }
        </script>
      </body>
      </html>
    `;
    
    const doc = previewRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(combinedHtml);
      doc.close();
    }
  };

  useEffect(() => {
    if (isPreviewLive) {
      const timer = setTimeout(updatePreview, 500);
      return () => clearTimeout(timer);
    }
  }, [htmlCode, cssCode, jsCode, previewMode, isPreviewLive]);

  // Listen for element selection from preview
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementSelected') {
        const element = event.data.element;
        console.log('Element selection received:', element);
        
        setSelectedElement(element);
        setSelectionMode(false);
        
        const displayName = `${element.tagName}${element.className ? '.' + element.className.split(' ')[0] : ''}${element.id ? '#' + element.id : ''}`;
        
        toast({
          title: "Element Selected",
          description: `Selected: ${displayName}`,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  const handleFullPageEnhancement = async () => {
    if (!enhancementPrompt.trim()) {
      toast({
        title: "Enhancement Prompt Required",
        description: "Please enter a description of how you want to enhance the page.",
        variant: "destructive"
      });
      return;
    }

    setIsEnhancing(true);
    setEnhancedCode(null);

    try {
      const enhancer = createAICodeEnhancer();
      const enhanced = await enhancer.enhanceCode({
        htmlCode,
        cssCode,
        prompt: enhancementPrompt,
        pageName
      });

      setHtmlCode(enhanced.html);
      setCssCode(enhanced.css);
      setJsCode(enhanced.js);
      setEnhancedCode(enhanced);
      setEnhancementPrompt('');

      toast({
        title: "Enhancement Complete",
        description: "Your page has been enhanced with AI improvements.",
      });

    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance the page. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleElementEnhancement = async () => {
    if (!selectedElement || !selectedElementPrompt.trim()) {
      toast({
        title: "Selection Required",
        description: "Please select an element and enter enhancement instructions.",
        variant: "destructive"
      });
      return;
    }

    setIsElementEnhancing(true);

    try {
      const enhancer = createPreciseElementEnhancer();
      
      // Create display name for the element
      const displayName = `${selectedElement.tagName}${selectedElement.className ? '.' + selectedElement.className.split(' ')[0] : ''}${selectedElement.id ? '#' + selectedElement.id : ''}`;
      
      const enhanced = await enhancer.enhanceElement({
        htmlCode: htmlCode,
        cssCode: cssCode,
        elementData: {
          displayName: displayName,
          tagName: selectedElement.tagName,
          className: selectedElement.className || '',
          id: selectedElement.id || '',
          uniqueId: `element_${Date.now()}`,
          textContent: selectedElement.textContent || '',
          selector: selectedElement.selector || selectedElement.tagName
        },
        enhancementPrompt: selectedElementPrompt,
        pageName
      });

      setHtmlCode(enhanced.html);
      setCssCode(enhanced.css);
      if (enhanced.js) {
        setJsCode(enhanced.js);
      }
      
      setSelectedElementPrompt('');
      setSelectedElement(null);

      toast({
        title: "Element Enhanced",
        description: `Successfully enhanced ${displayName}`,
      });

    } catch (error) {
      console.error('Element enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance the selected element.",
        variant: "destructive"
      });
    } finally {
      setIsElementEnhancing(false);
    }
  };

  const downloadPage = () => {
    const combinedHtml = `<!DOCTYPE html>
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
${jsCode ? `
<script>
${jsCode}
</script>` : ''}
</body>
</html>`;

    const blob = new Blob([combinedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageName.replace(/\s+/g, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar title="HTML Editor" showBackButton />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Input
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              className="text-xl font-semibold border-none bg-transparent p-0 focus-visible:ring-0"
              placeholder="Enter page name..."
            />
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
                id="auto-save"
              />
              <Label htmlFor="auto-save" className="text-sm">Auto-save</Label>
            </div>
            
            <Button onClick={saveToLocalStorage} variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            
            <Button onClick={downloadPage} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Enhancement Success Message */}
        {enhancedCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
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
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor Panel */}
          <div className="space-y-6">
            {/* AI Enhancement Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Enhancement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Full Page Enhancement */}
                <div>
                  <Label htmlFor="enhancement-prompt">Full Page Enhancement</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="enhancement-prompt"
                      value={enhancementPrompt}
                      onChange={(e) => setEnhancementPrompt(e.target.value)}
                      placeholder="Describe how you want to enhance the page..."
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleFullPageEnhancement}
                      disabled={isEnhancing || !enhancementPrompt.trim()}
                    >
                      {isEnhancing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Element-Specific Enhancement */}
                <div>
                  <Label>Element-Specific Enhancement</Label>
                  <div className="space-y-3 mt-2">
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <MousePointer className="h-4 w-4" />
                        <span className="font-medium">How to select elements:</span>
                      </div>
                      <div className="ml-6">
                        • Hover over elements in the preview to highlight them
                        • Click any element to select it for enhancement
                        • Selected elements will show a green border and checkmark
                      </div>
                    </div>
                    
                    {selectedElement ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-800">Selected Element</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Tag:</span>
                              <code className="ml-1 bg-white px-1 py-0.5 rounded">{selectedElement.tagName}</code>
                            </div>
                            {selectedElement.className && (
                              <div>
                                <span className="text-gray-600">Class:</span>
                                <code className="ml-1 bg-white px-1 py-0.5 rounded text-xs">{selectedElement.className}</code>
                              </div>
                            )}
                            {selectedElement.id && (
                              <div>
                                <span className="text-gray-600">ID:</span>
                                <code className="ml-1 bg-white px-1 py-0.5 rounded">#{selectedElement.id}</code>
                              </div>
                            )}
                            {selectedElement.textContent && (
                              <div className="col-span-2">
                                <span className="text-gray-600">Content:</span>
                                <span className="ml-1 text-gray-800">"{selectedElement.textContent}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
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
                              className="h-8 px-2 text-xs justify-start"
                              onClick={() => setSelectedElementPrompt(option)}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            value={selectedElementPrompt}
                            onChange={(e) => setSelectedElementPrompt(e.target.value)}
                            placeholder="Describe how to enhance this element..."
                            className="flex-1"
                          />
                          <Button 
                            onClick={handleElementEnhancement}
                            disabled={isElementEnhancing || !selectedElementPrompt.trim()}
                            size="sm"
                          >
                            {isElementEnhancing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => setSelectedElement(null)}
                          variant="ghost"
                          size="sm"
                          className="w-full"
                        >
                          Clear Selection
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <MousePointer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Click on any element in the preview to select it for enhancement</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Code Tabs */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="html" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="css">CSS</TabsTrigger>
                    <TabsTrigger value="js">JavaScript</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="html">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>HTML Content</Label>
                        <Button
                          onClick={() => navigator.clipboard.writeText(htmlCode)}
                          variant="ghost"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={htmlCode}
                        onChange={(e) => setHtmlCode(e.target.value)}
                        className="font-mono text-sm min-h-[400px] resize-none"
                        placeholder="Enter your HTML code here..."
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="css">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>CSS Styles</Label>
                        <Button
                          onClick={() => navigator.clipboard.writeText(cssCode)}
                          variant="ghost"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={cssCode}
                        onChange={(e) => setCssCode(e.target.value)}
                        className="font-mono text-sm min-h-[400px] resize-none"
                        placeholder="Enter your CSS code here..."
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="js">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>JavaScript Code</Label>
                        <Button
                          onClick={() => navigator.clipboard.writeText(jsCode)}
                          variant="ghost"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={jsCode}
                        onChange={(e) => setJsCode(e.target.value)}
                        className="font-mono text-sm min-h-[400px] resize-none"
                        placeholder="Enter your JavaScript code here..."
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card className="flex-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                      <Button
                        variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewMode('desktop')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewMode('tablet')}
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewMode('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isPreviewLive}
                        onCheckedChange={setIsPreviewLive}
                        id="live-preview"
                      />
                      <Label htmlFor="live-preview" className="text-sm">Live</Label>
                    </div>
                    
                    {!isPreviewLive && (
                      <Button onClick={updatePreview} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white" 
                     style={{ width: getPreviewWidth(), margin: '0 auto' }}>
                  <iframe
                    ref={previewRef}
                    className="w-full h-[600px] border-0"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
                
                {selectionMode && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">Element Selection Mode Active</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Hold Ctrl/Cmd and click on any element in the preview above to select it for enhancement.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Route wrapper component that handles URL parameters
export default function HTMLEditor() {
  const params = useParams();
  const [location] = useLocation();
  
  // Extract wireframe data from localStorage using ID-based filtering
  const getInitialData = (): HTMLEditorData | undefined => {
    // Check for wireframe ID in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const wireframeId = params.wireframeId || urlParams.get('id');
    
    console.log('HTML Editor - Looking for wireframe ID:', wireframeId);
    console.log('HTML Editor - Current URL:', location);
    console.log('HTML Editor - URL search params:', window.location.search);
    console.log('HTML Editor - Extracted ID from params:', urlParams.get('id'));
    
    if (wireframeId) {
      // Try to load from localStorage first (saved editor data)
      const savedData = localStorage.getItem(`html_editor_${wireframeId}`);
      if (savedData) {
        console.log('HTML Editor - Found saved editor data for ID:', wireframeId);
        return JSON.parse(savedData);
      }
      
      // Try to load from generated wireframes using ID
      const wireframes = JSON.parse(localStorage.getItem('generated_wireframes') || '[]');
      console.log('HTML Editor - Checking', wireframes.length, 'wireframes for ID:', wireframeId);
      
      const wireframe = wireframes.find((w: any) => w.id === wireframeId);
      if (wireframe) {
        console.log('HTML Editor - Found wireframe data:', {
          id: wireframe.id,
          pageName: wireframe.pageName,
          htmlLength: wireframe.htmlCode?.length,
          cssLength: wireframe.cssCode?.length,
          isEnhanced: wireframe.isEnhanced
        });
        return {
          id: wireframe.id,
          pageName: wireframe.pageName,
          htmlCode: wireframe.htmlCode,
          cssCode: wireframe.cssCode,
          jsCode: wireframe.jsCode || ''
        };
      } else {
        console.log('HTML Editor - No wireframe found with ID:', wireframeId);
        console.log('HTML Editor - Available wireframe IDs:', wireframes.map((w: any) => `${w.id} (${w.pageName})`));
      }
    } else {
      console.log('HTML Editor - No wireframe ID found in URL');
    }
    
    return undefined;
  };

  return <HTMLEditorComponent initialData={getInitialData()} />;
}
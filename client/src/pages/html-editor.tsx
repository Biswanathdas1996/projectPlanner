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
import { storage } from "@/lib/storage-utils";
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
  Tablet,
  X
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
  const [selectedElementProperties, setSelectedElementProperties] = useState<{[key: string]: string}>({});
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  
  const previewRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // Extract CSS properties from selected element
  const extractElementProperties = (element: any) => {
    if (!element) return {};
    
    const properties: {[key: string]: string} = {};
    const elementClasses = element.className ? element.className.split(' ') : [];
    
    // Parse CSS to find rules for this element
    const cssRules = cssCode.split('}').map(rule => rule.trim() + '}').filter(rule => rule.length > 1);
    
    for (const rule of cssRules) {
      const selectorMatch = rule.match(/^([^{]+)\s*{/);
      if (!selectorMatch) continue;
      
      const selector = selectorMatch[1].trim();
      let matches = false;
      
      // Check if selector matches the element
      if (selector === element.tagName.toLowerCase()) matches = true;
      if (selector.includes('#') && selector.includes(element.id)) matches = true;
      if (selector.includes('.') && elementClasses.some((cls: string) => selector.includes('.' + cls))) matches = true;
      
      if (matches) {
        const cssContent = rule.match(/{([^}]*)}/)?.[1] || '';
        const declarations = cssContent.split(';').filter(decl => decl.trim());
        
        for (const declaration of declarations) {
          const [property, value] = declaration.split(':').map(s => s.trim());
          if (property && value) {
            properties[property] = value;
          }
        }
      }
    }
    
    return properties;
  };

  // Update CSS with new property values
  const updateElementProperty = (property: string, value: string) => {
    if (!selectedElement) return;
    
    const elementClasses = selectedElement.className ? selectedElement.className.split(' ') : [];
    const targetSelector = elementClasses.length > 0 ? '.' + elementClasses[0] : selectedElement.tagName.toLowerCase();
    
    // Find or create CSS rule for the element
    let updatedCss = cssCode;
    const ruleRegex = new RegExp(`(${targetSelector.replace('.', '\\.')}\\s*{[^}]*})`, 'g');
    const existingRule = updatedCss.match(ruleRegex)?.[0];
    
    if (existingRule) {
      // Update existing rule
      const newRule = existingRule.replace(/}$/, '').trim();
      const propertyRegex = new RegExp(`${property}\\s*:[^;]*;?`, 'g');
      
      if (newRule.includes(property + ':')) {
        // Update existing property
        const updatedRule = newRule.replace(propertyRegex, `${property}: ${value};`) + '}';
        updatedCss = updatedCss.replace(existingRule, updatedRule);
      } else {
        // Add new property
        const updatedRule = newRule + `\n  ${property}: ${value};\n}`;
        updatedCss = updatedCss.replace(existingRule, updatedRule);
      }
    } else {
      // Create new rule
      const newRule = `\n${targetSelector} {\n  ${property}: ${value};\n}`;
      updatedCss += newRule;
    }
    
    setCssCode(updatedCss);
    
    // Update local properties state
    setSelectedElementProperties(prev => ({
      ...prev,
      [property]: value
    }));
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !wireframeId) return;
    
    const saveTimer = setTimeout(() => {
      if (!wireframeId) return;
      
      const editorData = {
        id: wireframeId,
        pageName,
        htmlCode,
        cssCode,
        jsCode,
        lastSaved: new Date().toISOString()
      };
      
      storage.setItem(`html_editor_${wireframeId}`, editorData);
      
      // Also update the main wireframes data using ID
      const existingWireframes = storage.getItem('generated_wireframes') || [];
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
      
      storage.setItem('generated_wireframes', updatedWireframes);
      setLastSaved(new Date());
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [htmlCode, cssCode, jsCode, pageName, wireframeId, autoSave]);

  // Load data from storage on mount
  useEffect(() => {
    if (!initialData?.id) return;
    
    const savedData = storage.getItem(`html_editor_${initialData.id}`);
    if (savedData) {
      setHtmlCode(savedData.htmlCode || initialData.htmlCode);
      setCssCode(savedData.cssCode || initialData.cssCode);
      setJsCode(savedData.jsCode || initialData.jsCode || '');
      setLastSaved(new Date(savedData.lastSaved));
    }
  }, [initialData]);

  const saveToStorage = () => {
    if (!wireframeId) return;
    
    const editorData = {
      id: wireframeId,
      pageName,
      htmlCode,
      cssCode,
      jsCode,
      lastSaved: new Date().toISOString()
    };
    
    storage.setItem(`html_editor_${wireframeId}`, editorData);
    
    // Also update the main wireframes data using ID
    const existingWireframes = storage.getItem('generated_wireframes') || [];
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
    
    storage.setItem('generated_wireframes', updatedWireframes);
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
        
        ${selectionMode ? `
        <style id="element-selector-styles">
          .element-selector-hover { 
            outline: 2px dashed #3B82F6 !important; 
            cursor: pointer !important;
            background-color: rgba(59, 130, 246, 0.05) !important;
          }
          .element-selector-selected { 
            outline: 3px solid #10B981 !important; 
            background-color: rgba(16, 185, 129, 0.1) !important;
            position: relative !important;
          }
          .element-selector-selected::after {
            content: "✓ Selected";
            position: absolute;
            top: -25px;
            left: 0;
            background: #10B981;
            color: white;
            padding: 2px 6px;
            font-size: 11px;
            border-radius: 3px;
            z-index: 10000;
            pointer-events: none;
          }
        </style>
        <script>
          (function() {
            let currentHover = null;
            let isSelectionMode = true;
            
            function setupElementSelection() {
              document.addEventListener('mouseover', handleMouseOver);
              document.addEventListener('mouseout', handleMouseOut);
              document.addEventListener('click', handleClick);
            }
            
            function handleMouseOver(e) {
              if (!isSelectionMode || e.target.tagName === 'BODY' || e.target.tagName === 'HTML') return;
              
              if (currentHover && !currentHover.classList.contains('element-selector-selected')) {
                currentHover.classList.remove('element-selector-hover');
              }
              
              currentHover = e.target;
              if (!e.target.classList.contains('element-selector-selected')) {
                e.target.classList.add('element-selector-hover');
              }
            }
            
            function handleMouseOut(e) {
              if (currentHover && !currentHover.classList.contains('element-selector-selected')) {
                currentHover.classList.remove('element-selector-hover');
              }
            }
            
            function handleClick(e) {
              if (!isSelectionMode) return;
              
              e.preventDefault();
              e.stopPropagation();
              
              // Clear previous selections
              document.querySelectorAll('.element-selector-selected').forEach(el => {
                el.classList.remove('element-selector-selected');
              });
              
              // Remove hover state
              e.target.classList.remove('element-selector-hover');
              
              // Add selected state
              e.target.classList.add('element-selector-selected');
              
              // Get element info
              const elementInfo = {
                tagName: e.target.tagName.toLowerCase(),
                className: e.target.className.replace(/element-selector-(hover|selected)/g, '').trim(),
                id: e.target.id || '',
                textContent: e.target.textContent?.substring(0, 100) || ''
              };
              
              // Post message to parent
              if (window.parent) {
                window.parent.postMessage({
                  type: 'elementSelected',
                  element: elementInfo
                }, '*');
              }
            }
            
            // Initialize when DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', setupElementSelection);
            } else {
              setupElementSelection();
            }
          })();
        </script>
        ` : ''}
        
        ${jsCode ? `<script>${jsCode}</script>` : ''}
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

  // Update preview when selection mode changes
  useEffect(() => {
    updatePreview();
  }, [selectionMode]);

  // Initial preview load
  useEffect(() => {
    updatePreview();
  }, []);

  // Listen for element selection from preview
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementSelected' && event.origin === window.location.origin) {
        const element = event.data.element;
        console.log('Element selected:', element);
        
        setSelectedElement(element);
        
        // Extract CSS properties for the selected element
        const properties = extractElementProperties(element);
        setSelectedElementProperties(properties);
        setShowPropertiesPanel(true);
        
        const displayName = element.tagName + 
          (element.className ? '.' + element.className.split(' ')[0] : '') +
          (element.id ? '#' + element.id : '');
        
        toast({
          title: "Element Selected",
          description: `Selected: ${displayName}`,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, cssCode]);

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
          textContent: selectedElement.textContent || ''
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

  const handleDeleteElement = () => {
    if (!selectedElement) return;
    
    // Remove the element from HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlCode, 'text/html');
    
    // Find and remove the element
    let elementToRemove = null;
    
    if (selectedElement.id) {
      elementToRemove = doc.getElementById(selectedElement.id);
    } else if (selectedElement.className) {
      const elements = doc.getElementsByClassName(selectedElement.className.split(' ')[0]);
      if (elements.length > 0) {
        // Find the element with matching text content
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].textContent?.trim().includes(selectedElement.textContent.trim().substring(0, 50))) {
            elementToRemove = elements[i];
            break;
          }
        }
        if (!elementToRemove) elementToRemove = elements[0];
      }
    } else {
      // Search by tag name and text content
      const elements = doc.getElementsByTagName(selectedElement.tagName);
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].textContent?.trim().includes(selectedElement.textContent.trim().substring(0, 50))) {
          elementToRemove = elements[i];
          break;
        }
      }
    }
    
    if (elementToRemove) {
      elementToRemove.remove();
      
      // Update the HTML code
      const updatedHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${pageName}</title>\n    <style>\n        ${cssCode}\n    </style>\n</head>\n<body>\n    ${doc.body.innerHTML}\n</body>\n</html>`;
      
      setHtmlCode(updatedHtml);
      
      // Clear selection
      setSelectedElement(null);
      setSelectedElementPrompt('');
      
      toast({
        title: "Element Deleted",
        description: `Successfully removed ${selectedElement.tagName} element`,
      });
      
      console.log('Element deleted successfully');
    } else {
      toast({
        title: "Delete Failed",
        description: "Could not locate the element to delete",
        variant: "destructive"
      });
      console.warn('Could not find element to delete');
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
            
            <Button onClick={saveToStorage} variant="outline" size="sm">
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

        {/* Main Layout - Compact Design */}
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-160px)]">
          {/* Sidebar - Tools & Code */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            {/* Compact AI Enhancement Panel */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Page Enhancement Row */}
                <div className="flex gap-2">
                  <Input
                    value={enhancementPrompt}
                    onChange={(e) => setEnhancementPrompt(e.target.value)}
                    placeholder="Enhance page..."
                    className="flex-1 text-sm"
                  />
                  <Button 
                    onClick={handleFullPageEnhancement}
                    disabled={isEnhancing || !enhancementPrompt.trim()}
                    size="sm"
                  >
                    {isEnhancing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Element Enhancement */}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Element Tools</Label>
                    <Button
                      variant={selectionMode ? "destructive" : "default"}
                      onClick={() => {
                        setSelectionMode(!selectionMode);
                        if (!selectionMode) {
                          setSelectedElement(null);
                        }
                      }}
                      size="sm"
                    >
                      <MousePointer className="h-3 w-3 mr-1" />
                      {selectionMode ? "Exit" : "Select"}
                    </Button>
                  </div>
                  
                  {selectionMode && selectedElement && (
                    <div className="space-y-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="font-medium">{selectedElement.tagName} + children</span>
                        {selectedElement.className && (
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">.{selectedElement.className.split(' ')[0]}</code>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1">
                        {["Modern", "Animate", "Colors", "Hover", "Type", "Shadow"].map((preset) => (
                          <Button
                            key={preset}
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setSelectedElementPrompt(preset + " style")}
                          >
                            {preset}
                          </Button>
                        ))}
                      </div>
                      
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={handleDeleteElement}
                        >
                          Delete Element
                        </Button>
                      </div>
                      
                      <div className="flex gap-1">
                        <Input
                          value={selectedElementPrompt}
                          onChange={(e) => setSelectedElementPrompt(e.target.value)}
                          placeholder="Custom enhancement..."
                          className="flex-1 text-xs h-7"
                        />
                        <Button 
                          onClick={handleElementEnhancement}
                          disabled={isElementEnhancing || !selectedElementPrompt.trim()}
                          size="sm"
                          className="h-7"
                        >
                          {isElementEnhancing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Go"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {selectionMode && !selectedElement && (
                    <div className="text-center py-4 text-gray-500 border border-dashed border-gray-200 rounded text-xs">
                      <MousePointer className="h-4 w-4 mx-auto mb-1 opacity-50" />
                      <p>Click elements in preview</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Compact Code Editor */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Code
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-70px)]">
                <Tabs defaultValue="html" className="h-full">
                  <TabsList className="grid w-full grid-cols-3 mb-3">
                    <TabsTrigger value="html" className="text-xs">HTML</TabsTrigger>
                    <TabsTrigger value="css" className="text-xs">CSS</TabsTrigger>
                    <TabsTrigger value="js" className="text-xs">JS</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="html" className="h-[calc(100%-50px)]">
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs">HTML</Label>
                        <Button
                          onClick={() => navigator.clipboard.writeText(htmlCode)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={htmlCode}
                        onChange={(e) => setHtmlCode(e.target.value)}
                        className="font-mono text-xs flex-1 resize-none"
                        placeholder="HTML code..."
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="css" className="h-[calc(100%-50px)]">
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs">CSS</Label>
                        <Button
                          onClick={() => navigator.clipboard.writeText(cssCode)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={cssCode}
                        onChange={(e) => setCssCode(e.target.value)}
                        className="font-mono text-xs flex-1 resize-none"
                        placeholder="CSS styles..."
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="js" className="h-[calc(100%-50px)]">
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs">JavaScript</Label>
                        <Button
                          onClick={() => navigator.clipboard.writeText(jsCode)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={jsCode}
                        onChange={(e) => setJsCode(e.target.value)}
                        className="font-mono text-xs flex-1 resize-none"
                        placeholder="JavaScript code..."
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Properties Panel */}
          {showPropertiesPanel && selectedElement && (
            <div className="col-span-3 space-y-4 overflow-y-auto">
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Properties
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPropertiesPanel(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedElement.tagName}
                    {selectedElement.className && (
                      <span className="text-blue-600">.{selectedElement.className.split(' ')[0]}</span>
                    )}
                    {selectedElement.id && (
                      <span className="text-green-600">#{selectedElement.id}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.keys(selectedElementProperties).length > 0 ? (
                    Object.entries(selectedElementProperties).map(([property, value]) => (
                      <div key={property} className="space-y-1">
                        <Label className="text-xs font-medium capitalize">
                          {property.replace(/-/g, ' ')}
                        </Label>
                        <Input
                          value={value}
                          onChange={(e) => updateElementProperty(property, e.target.value)}
                          className="text-xs h-8"
                          placeholder={`Enter ${property} value...`}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No CSS properties found for this element.
                      <br />
                      You can add new properties below.
                    </div>
                  )}
                  
                  {/* Add New Property Section */}
                  <div className="border-t pt-3 mt-3">
                    <Label className="text-xs font-medium mb-2 block">Add New Property</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['color', 'background-color', 'font-size', 'margin', 'padding', 'border', 'width', 'height'].map((prop) => (
                        <Button
                          key={prop}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            if (!selectedElementProperties[prop]) {
                              updateElementProperty(prop, '');
                            }
                          }}
                        >
                          {prop}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview Panel */}
          <div className={showPropertiesPanel && selectedElement ? "col-span-6" : "col-span-9"}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Live Preview
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                      <Button
                        variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewMode('desktop')}
                        className="h-7 w-7 p-0"
                      >
                        <Monitor className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewMode('tablet')}
                        className="h-7 w-7 p-0"
                      >
                        <Tablet className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewMode('mobile')}
                        className="h-7 w-7 p-0"
                      >
                        <Smartphone className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isPreviewLive}
                        onCheckedChange={setIsPreviewLive}
                        id="live-preview"
                      />
                      <Label htmlFor="live-preview" className="text-xs">Live</Label>
                    </div>
                    
                    {!isPreviewLive && (
                      <Button onClick={updatePreview} variant="outline" size="sm" className="h-7">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <div className="h-full border rounded-lg overflow-hidden bg-white" 
                     style={{ width: getPreviewWidth(), margin: '0 auto' }}>
                  <iframe
                    ref={previewRef}
                    className="w-full h-full border-0"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
                
                {selectionMode && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">Element Selection Active</p>
                    <p className="text-xs text-blue-600">
                      Click any element above to select it for enhancement.
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
      // Try to load from storage first (saved editor data)
      const savedData = storage.getItem(`html_editor_${wireframeId}`);
      if (savedData) {
        console.log('HTML Editor - Found saved editor data for ID:', wireframeId);
        return savedData;
      }
      
      // Try to load from generated wireframes using ID
      const wireframesData = storage.getItem('generated_wireframes');
      const wireframes = Array.isArray(wireframesData) ? wireframesData : [];
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
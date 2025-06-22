import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  X, 
  Sparkles, 
  Loader2, 
  MousePointer, 
  Zap, 
  Code, 
  Copy,
  Download,
  CheckCircle
} from "lucide-react";

interface CodeEnhancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPageCode: {
    pageName: string;
    htmlCode: string;
    cssCode: string;
    jsCode?: string;
    isEnhanced?: boolean;
    lastEnhancedElement?: string;
    enhancementExplanation?: string;
  } | null;
  enhancementPrompt: string;
  onEnhancementPromptChange: (prompt: string) => void;
  isEnhancing: boolean;
  enhancedCode: {
    html: string;
    css: string;
    js: string;
    explanation: string;
    improvements: string[];
  } | null;
  selectionMode: boolean;
  selectedElement: string | null;
  selectedElementPrompt: string;
  onSelectionModeToggle: () => void;
  onSelectedElementPromptChange: (prompt: string) => void;
  onEnhanceCode: () => void;
  onEnhancePreciseElement: () => void;
  onApplyEnhancement: () => void;
  onCopyCode: (type: 'html' | 'css' | 'js') => void;
  onDownloadCode: () => void;
}

export function CodeEnhancementModal({
  isOpen,
  onClose,
  selectedPageCode,
  enhancementPrompt,
  onEnhancementPromptChange,
  isEnhancing,
  enhancedCode,
  selectionMode,
  selectedElement,
  selectedElementPrompt,
  onSelectionModeToggle,
  onSelectedElementPromptChange,
  onEnhanceCode,
  onEnhancePreciseElement,
  onApplyEnhancement,
  onCopyCode,
  onDownloadCode
}: CodeEnhancementModalProps) {
  if (!isOpen || !selectedPageCode) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Code Enhancement - {selectedPageCode.pageName}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {selectedPageCode.isEnhanced && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              This page has been enhanced
              {selectedPageCode.lastEnhancedElement && (
                <span className="text-gray-600">
                  (Last: {selectedPageCode.lastEnhancedElement})
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Enhancement Controls */}
          <div className="flex-shrink-0 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* General Enhancement */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">General Enhancement</Label>
                <Textarea
                  placeholder="Describe how you want to enhance this page (e.g., 'Make it more modern', 'Add animations', 'Improve accessibility')"
                  value={enhancementPrompt}
                  onChange={(e) => onEnhancementPromptChange(e.target.value)}
                  className="h-20 resize-none"
                />
                <Button
                  onClick={onEnhanceCode}
                  disabled={isEnhancing || !enhancementPrompt.trim()}
                  className="w-full"
                  size="sm"
                >
                  {isEnhancing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enhancing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Enhance Entire Page
                    </div>
                  )}
                </Button>
              </div>

              {/* Precise Element Enhancement */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Precise Element Enhancement</Label>
                <Button
                  onClick={onSelectionModeToggle}
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  className="w-full mb-2"
                >
                  <MousePointer className="h-4 w-4 mr-2" />
                  {selectionMode ? "Exit Selection Mode" : "Select Element to Enhance"}
                </Button>
                
                {selectedElement && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      Selected: {selectedElement}
                    </div>
                    <Textarea
                      placeholder="How do you want to enhance this specific element?"
                      value={selectedElementPrompt}
                      onChange={(e) => onSelectedElementPromptChange(e.target.value)}
                      className="h-16 resize-none"
                    />
                    <Button
                      onClick={onEnhancePreciseElement}
                      disabled={isEnhancing || !selectedElementPrompt.trim()}
                      className="w-full"
                      size="sm"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Enhance Element
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code Preview and Results */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="preview" className="h-full flex flex-col">
              <TabsList className="flex-shrink-0">
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
                {enhancedCode && <TabsTrigger value="enhanced">Enhanced Result</TabsTrigger>}
              </TabsList>

              <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
                <div className="h-full border rounded-lg bg-white">
                  <iframe
                    srcDoc={enhancedCode ? enhancedCode.html : selectedPageCode.htmlCode}
                    className="w-full h-full border-0 rounded-lg"
                    title={`Preview of ${selectedPageCode.pageName}`}
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
              </TabsContent>

              <TabsContent value="html" className="flex-1 overflow-hidden mt-4">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">HTML Code</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopyCode('html')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                    <pre>{enhancedCode ? enhancedCode.html : selectedPageCode.htmlCode}</pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="css" className="flex-1 overflow-hidden mt-4">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">CSS Code</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopyCode('css')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                    <pre>{enhancedCode ? enhancedCode.css : selectedPageCode.cssCode}</pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="js" className="flex-1 overflow-hidden mt-4">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">JavaScript Code</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopyCode('js')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                    <pre>{enhancedCode ? enhancedCode.js : (selectedPageCode.jsCode || '// No JavaScript code')}</pre>
                  </div>
                </div>
              </TabsContent>

              {enhancedCode && (
                <TabsContent value="enhanced" className="flex-1 overflow-hidden mt-4">
                  <div className="h-full flex flex-col space-y-4">
                    <div className="flex-shrink-0">
                      <h4 className="font-medium text-green-700 mb-2">Enhancement Results</h4>
                      <p className="text-sm text-gray-600 mb-3">{enhancedCode.explanation}</p>
                      
                      {enhancedCode.improvements.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Improvements Made:</span>
                          <div className="flex flex-wrap gap-1">
                            {enhancedCode.improvements.map((improvement, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {improvement}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={onApplyEnhancement}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Apply Enhancement
                      </Button>
                      <Button
                        variant="outline"
                        onClick={onDownloadCode}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Files
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
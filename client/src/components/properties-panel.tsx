import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, X, Clock, Sparkles, Loader2 } from 'lucide-react';
import type { ElementProperties } from '@shared/schema';
import { generateBpmnXml } from '@/lib/gemini';

interface PropertiesPanelProps {
  visible: boolean;
  selectedElement: ElementProperties | null;
  diagramXml: string;
  onClose: () => void;
  onUpdateElement: (properties: Partial<ElementProperties>) => void;
  onCopyXml: () => void;
  onDiagramUpdate?: (newXml: string) => Promise<void>;
}

export function PropertiesPanel({
  visible,
  selectedElement,
  diagramXml,
  onClose,
  onUpdateElement,
  onCopyXml,
  onDiagramUpdate,
}: PropertiesPanelProps) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  if (!visible) return null;

  const handlePropertyChange = (field: keyof ElementProperties, value: string) => {
    onUpdateElement({ [field]: value });
  };

  const handleAiPrompt = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsProcessingAi(true);
    setAiError('');
    
    try {
      // Combine current diagram context with user prompt
      const enhancedPrompt = `
Current BPMN diagram context:
${diagramXml}

User request: ${aiPrompt}

Please modify the BPMN diagram according to the user's request. You can:
- Add new elements (tasks, gateways, events)
- Modify existing elements
- Delete elements
- Change connections and flows
- Update element properties

Return the complete updated BPMN 2.0 XML.`;

      const updatedXml = await generateBpmnXml(enhancedPrompt);
      
      if (onDiagramUpdate) {
        await onDiagramUpdate(updatedXml);
      }
      
      setAiPrompt('');
    } catch (error) {
      console.error('AI diagram update error:', error);
      setAiError('Failed to process AI request. Please try again.');
    } finally {
      setIsProcessingAi(false);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 shadow-sm transition-all duration-300 h-full flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Properties</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Element Properties Section */}
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Element Type
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600 font-mono">
                  {selectedElement?.type || 'No element selected'}
                </span>
              </div>
            </div>

            {selectedElement && (
              <>
                <div>
                  <Label htmlFor="element-id" className="text-sm font-medium text-gray-700 mb-2 block">
                    Element ID
                  </Label>
                  <Input
                    id="element-id"
                    value={selectedElement.id}
                    onChange={(e) => handlePropertyChange('id', e.target.value)}
                    placeholder="task_001"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="element-name" className="text-sm font-medium text-gray-700 mb-2 block">
                    Name
                  </Label>
                  <Input
                    id="element-name"
                    value={selectedElement.name || ''}
                    onChange={(e) => handlePropertyChange('name', e.target.value)}
                    placeholder="Process Step Name"
                    className="text-sm"
                  />
                </div>

                {/* Time Duration Section */}
                <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-medium text-blue-800">Time Duration</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="element-duration" className="text-xs text-gray-600 mb-1 block">
                        Duration
                      </Label>
                      <Input
                        id="element-duration"
                        value={selectedElement.duration || ''}
                        onChange={(e) => handlePropertyChange('duration', e.target.value)}
                        placeholder="10"
                        type="number"
                        min="0"
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="element-duration-unit" className="text-xs text-gray-600 mb-1 block">
                        Unit
                      </Label>
                      <Select
                        value={selectedElement.durationUnit || 'minutes'}
                        onValueChange={(value) => handlePropertyChange('durationUnit', value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {selectedElement.duration && (
                    <div className="text-xs text-blue-700 font-medium">
                      Duration: {selectedElement.duration} {selectedElement.durationUnit || 'minutes'}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="element-documentation" className="text-sm font-medium text-gray-700 mb-2 block">
                    Documentation
                  </Label>
                  <Textarea
                    id="element-documentation"
                    value={selectedElement.documentation || ''}
                    onChange={(e) => handlePropertyChange('documentation', e.target.value)}
                    placeholder="Enter element description..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* AI-Powered Diagram Editor */}
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-medium text-gray-900">AI Diagram Editor</h3>
            </div>
            
            <div className="space-y-3">
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Tell AI how to modify your diagram... e.g., 'Add a user authentication task after login', 'Delete the approval gateway', 'Add error handling paths'"
                rows={4}
                className="text-sm resize-none"
                disabled={isProcessingAi}
              />
              
              {aiError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                  {aiError}
                </div>
              )}
              
              <Button
                onClick={handleAiPrompt}
                disabled={isProcessingAi || !aiPrompt.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm"
                size="sm"
              >
                {isProcessingAi ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply Changes
                  </>
                )}
              </Button>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium">Examples:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>"Add parallel gateway for concurrent approval"</li>
                  <li>"Insert error handling after payment task"</li>
                  <li>"Remove the review step and connect directly"</li>
                  <li>"Add swimlanes for different user roles"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* BPMN Script View */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">BPMN Script</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyXml}
              className="p-1 text-gray-400 hover:text-gray-600 h-auto"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <pre className="text-xs text-green-400 font-roboto-mono leading-relaxed max-h-64 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                {diagramXml}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

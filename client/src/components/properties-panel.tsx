import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy, X } from 'lucide-react';
import type { ElementProperties } from '@shared/schema';

interface PropertiesPanelProps {
  visible: boolean;
  selectedElement: ElementProperties | null;
  diagramJson: string;
  onClose: () => void;
  onUpdateElement: (properties: Partial<ElementProperties>) => void;
  onCopyJson: () => void;
}

export function PropertiesPanel({
  visible,
  selectedElement,
  diagramJson,
  onClose,
  onUpdateElement,
  onCopyJson,
}: PropertiesPanelProps) {
  if (!visible) return null;

  const handlePropertyChange = (field: keyof ElementProperties, value: string) => {
    onUpdateElement({ [field]: value });
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

        {/* Diagram JSON View */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Diagram JSON</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyJson}
              className="p-1 text-gray-400 hover:text-gray-600 h-auto"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <pre className="text-xs text-green-400 font-roboto-mono leading-relaxed max-h-64 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                {diagramJson}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

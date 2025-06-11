import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NotificationSystem } from '@/components/notification-system';
import { NavigationBar } from '@/components/navigation-bar';
import { useBpmnEditor } from '@/hooks/use-bpmn-editor';
import { Link } from 'wouter';
import {
  Save,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  FileText,
  Settings,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function BpmnEditor() {
  const [propertiesVisible, setPropertiesVisible] = useState(true);
  const [xmlViewVisible, setXmlViewVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    containerRef,
    selectedElement,
    diagramXml,
    isLoading,
    isModified,
    notifications,
    status,
    showNotification,
    removeNotification,
    createNewDiagram,
    saveDiagram,
    importDiagram,
    exportDiagram,
    zoomIn,
    zoomOut,
    zoomToFit,
    updateElementProperties,
  } = useBpmnEditor();

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const xml = e.target?.result as string;
        if (xml) {
          importDiagram(xml);
        }
      };
      reader.readAsText(file);
    }
  };

  // Status indicator component
  const StatusIndicator = () => {
    const getStatusColor = () => {
      if (isLoading) return 'bg-blue-500';
      if (isModified) return 'bg-orange-500';
      if (status === 'Saved' || status === 'Auto-saved') return 'bg-green-500';
      if (status === 'Error') return 'bg-red-500';
      return 'bg-gray-500';
    };

    const getStatusIcon = () => {
      if (isLoading) return <Loader2 className="h-3 w-3 animate-spin" />;
      if (isModified) return <AlertCircle className="h-3 w-3" />;
      if (status === 'Saved' || status === 'Auto-saved') return <CheckCircle className="h-3 w-3" />;
      return null;
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        {getStatusIcon()}
        <span className="text-xs text-gray-600">{status}</span>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <NavigationBar 
        title="BPMN Editor" 
        showBackButton={true}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4">
          <Button
            onClick={createNewDiagram}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            title="New Diagram"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={saveDiagram}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            title="Import"
          >
            <Upload className="h-4 w-4" />
          </Button>

          <Button
            onClick={exportDiagram}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            title="Export"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Separator className="w-8" />

          <Button
            onClick={zoomIn}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            onClick={zoomOut}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button
            onClick={zoomToFit}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            title="Fit to Screen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <Separator className="w-8" />

          <Button
            onClick={() => setPropertiesVisible(!propertiesVisible)}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            title="Toggle Properties"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setXmlViewVisible(!xmlViewVisible)}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            title="Toggle XML View"
          >
            {xmlViewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Status Bar */}
          <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
            <StatusIndicator />
            <div className="flex items-center gap-4">
              {selectedElement && (
                <Badge variant="outline" className="text-xs">
                  {selectedElement.name} ({selectedElement.type})
                </Badge>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm text-gray-600">Loading BPMN Editor...</span>
                </div>
              </div>
            )}
            
            {!isLoading && !selectedElement && (
              <div className="absolute top-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 z-10 max-w-sm">
                <p className="font-medium">Getting Started:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Use the palette on the left to add elements</li>
                  <li>• Click and drag elements to move them</li>
                  <li>• Click elements to select and edit properties</li>
                  <li>• Use context menu for quick actions</li>
                </ul>
              </div>
            )}
            
            <div 
              ref={containerRef}
              className="w-full h-full bg-white"
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>

        {/* Right Panels */}
        <div className="flex">
          {/* Properties Panel */}
          {propertiesVisible && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-sm">Properties</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {selectedElement ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="element-name" className="text-xs">Name</Label>
                      <Input
                        id="element-name"
                        value={selectedElement.name}
                        onChange={(e) => updateElementProperties({ name: e.target.value })}
                        className="mt-1"
                        placeholder="Element name"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Type</Label>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {selectedElement.type}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">ID</Label>
                      <div className="mt-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {selectedElement.id}
                        </code>
                      </div>
                    </div>

                    {selectedElement.documentation && (
                      <div>
                        <Label htmlFor="element-docs" className="text-xs">Documentation</Label>
                        <Textarea
                          id="element-docs"
                          value={selectedElement.documentation}
                          onChange={(e) => updateElementProperties({ documentation: e.target.value })}
                          className="mt-1"
                          rows={3}
                          placeholder="Element documentation"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm py-8">
                    Select an element to edit its properties
                  </div>
                )}
              </div>
            </div>
          )}

          {/* XML View Panel */}
          {xmlViewVisible && (
            <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-sm">BPMN XML</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                  <code>{diagramXml}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".bpmn,.xml"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Notifications */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}
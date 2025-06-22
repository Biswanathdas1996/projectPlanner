import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowDiagramViewer } from "@/components/flow-diagram-viewer";
import { 
  Workflow, 
  Code, 
  Eye, 
  Download, 
  ExternalLink,
  MapPin,
  Layers,
  Monitor,
  Smartphone
} from "lucide-react";

interface StoredFlow {
  id: string;
  title: string;
  flowData: any;
  createdAt: string;
}

interface StoredWireframe {
  id: string;
  pageName: string;
  htmlContent: string;
  createdAt: string;
}

interface FlowWireframeMapping {
  flowId: string;
  wireframeIds: string[];
  mappingConfidence: number;
}

export function FlowWireframeMappingPage() {
  const [storedFlows, setStoredFlows] = useState<StoredFlow[]>([]);
  const [storedWireframes, setStoredWireframes] = useState<StoredWireframe[]>([]);
  const [mappings, setMappings] = useState<FlowWireframeMapping[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<StoredFlow | null>(null);
  const [selectedWireframe, setSelectedWireframe] = useState<StoredWireframe | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = () => {
    try {
      // Load stored flows
      const flowsData = localStorage.getItem("storedFlowDiagrams");
      if (flowsData) {
        const flows = JSON.parse(flowsData);
        setStoredFlows(flows);
      }

      // Load stored wireframes
      const wireframesData = localStorage.getItem("generatedWireframes");
      if (wireframesData) {
        const wireframes = JSON.parse(wireframesData);
        setStoredWireframes(wireframes);
      }

      // Generate intelligent mappings based on content similarity
      generateFlowWireframeMappings();
    } catch (error) {
      console.error("Error loading stored data:", error);
    }
  };

  const generateFlowWireframeMappings = () => {
    const flowsData = localStorage.getItem("storedFlowDiagrams");
    const wireframesData = localStorage.getItem("generatedWireframes");
    
    if (!flowsData || !wireframesData) return;

    const flows = JSON.parse(flowsData);
    const wireframes = JSON.parse(wireframesData);
    
    const newMappings: FlowWireframeMapping[] = [];

    flows.forEach((flow: StoredFlow) => {
      const relatedWireframes: string[] = [];
      
      wireframes.forEach((wireframe: StoredWireframe) => {
        // Simple matching based on page name and flow title similarity
        const similarity = calculateSimilarity(flow.title, wireframe.pageName);
        if (similarity > 0.3) {
          relatedWireframes.push(wireframe.id);
        }
      });

      if (relatedWireframes.length > 0) {
        newMappings.push({
          flowId: flow.id,
          wireframeIds: relatedWireframes,
          mappingConfidence: relatedWireframes.length > 1 ? 0.8 : 0.6
        });
      }
    });

    setMappings(newMappings);
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    let commonWords = 0;
    words1.forEach(word => {
      if (words2.some(w => w.includes(word) || word.includes(w))) {
        commonWords++;
      }
    });

    return commonWords / Math.max(words1.length, words2.length);
  };

  const getMappedWireframes = (flowId: string): StoredWireframe[] => {
    const mapping = mappings.find(m => m.flowId === flowId);
    if (!mapping) return [];
    
    return storedWireframes.filter(w => mapping.wireframeIds.includes(w.id));
  };

  const downloadWireframe = (wireframe: StoredWireframe) => {
    const blob = new Blob([wireframe.htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${wireframe.pageName.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openWireframePreview = (wireframe: StoredWireframe) => {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(wireframe.htmlContent);
      newWindow.document.close();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MapPin className="h-8 w-8 text-blue-600" />
            Flow & Wireframe Mapping
          </h1>
          <p className="text-gray-600 mt-2">
            Visualize process flows alongside their corresponding wireframe implementations
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Workflow className="h-4 w-4" />
            {storedFlows.length} Flows
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            {storedWireframes.length} Wireframes
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            {mappings.length} Mappings
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-blue-600" />
              Process Flows
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {storedFlows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Workflow className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No process flows found</p>
                <p className="text-sm mt-1">Create flows in the BPMN Editor</p>
              </div>
            ) : (
              storedFlows.map((flow) => {
                const mappedWireframes = getMappedWireframes(flow.id);
                const isSelected = selectedFlow?.id === flow.id;
                
                return (
                  <div
                    key={flow.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedFlow(flow)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {flow.title}
                      </h4>
                      {mappedWireframes.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {mappedWireframes.length} UI{mappedWireframes.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(flow.createdAt).toLocaleDateString()}
                    </p>
                    {mappedWireframes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mappedWireframes.map((wireframe) => (
                          <span
                            key={wireframe.id}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {wireframe.pageName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Flow Visualization & Wireframe Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedFlow ? (
            <>
              {/* Flow Diagram */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-blue-600" />
                    {selectedFlow.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 border rounded-lg">
                    <FlowDiagramViewer
                      flowData={selectedFlow.flowData}
                      title={selectedFlow.title}
                      className="h-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mapped Wireframes */}
              {(() => {
                const mappedWireframes = getMappedWireframes(selectedFlow.id);
                
                return mappedWireframes.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Code className="h-5 w-5 text-green-600" />
                          Mapped Wireframes ({mappedWireframes.length})
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant={viewMode === "desktop" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("desktop")}
                          >
                            <Monitor className="h-4 w-4 mr-1" />
                            Desktop
                          </Button>
                          <Button
                            variant={viewMode === "mobile" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("mobile")}
                          >
                            <Smartphone className="h-4 w-4 mr-1" />
                            Mobile
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue={mappedWireframes[0]?.id}>
                        <TabsList className="grid w-full grid-cols-auto">
                          {mappedWireframes.map((wireframe) => (
                            <TabsTrigger key={wireframe.id} value={wireframe.id}>
                              {wireframe.pageName}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        
                        {mappedWireframes.map((wireframe) => (
                          <TabsContent key={wireframe.id} value={wireframe.id}>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {wireframe.pageName}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Generated: {new Date(wireframe.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openWireframePreview(wireframe)}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Preview
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadWireframe(wireframe)}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Wireframe Preview */}
                              <div className={`border rounded-lg ${
                                viewMode === "mobile" 
                                  ? "max-w-sm mx-auto" 
                                  : "w-full"
                              }`}>
                                <iframe
                                  srcDoc={wireframe.htmlContent}
                                  className={`w-full border-0 rounded-lg ${
                                    viewMode === "mobile" 
                                      ? "h-96" 
                                      : "h-[500px]"
                                  }`}
                                  title={wireframe.pageName}
                                />
                              </div>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-gray-500">
                        <Code className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No wireframes mapped to this flow</p>
                        <p className="text-sm mt-1">
                          Generate wireframes in the Wireframe Designer to see them here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a process flow to view details</p>
                  <p className="text-sm mt-1">
                    Choose from the flows on the left to see mapped wireframes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            Mapping Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{storedFlows.length}</div>
              <div className="text-sm text-blue-700">Process Flows</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{storedWireframes.length}</div>
              <div className="text-sm text-green-700">Generated Wireframes</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{mappings.length}</div>
              <div className="text-sm text-purple-700">Active Mappings</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {mappings.reduce((sum, m) => sum + m.wireframeIds.length, 0)}
              </div>
              <div className="text-sm text-orange-700">Total Connections</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
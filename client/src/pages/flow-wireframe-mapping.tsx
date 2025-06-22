import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowDiagramViewer } from "@/components/flow-diagram-viewer";
import { WorkflowProgress } from "@/components/workflow-progress";
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

interface StoredProject {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  projectData: any;
}

interface StoredUserStory {
  id: string;
  title: string;
  stories: any[];
  createdAt: string;
}

interface StoredMarketResearch {
  id: string;
  title: string;
  researchData: any;
  createdAt: string;
}

interface StoredBrandGuideline {
  id: string;
  name: string;
  brandData: any;
  extractedAt: string;
  pdfFileName?: string;
}

interface FlowWireframeMapping {
  flowId: string;
  wireframeIds: string[];
  projectIds: string[];
  storyIds: string[];
  mappingConfidence: number;
}

interface LocalStorageData {
  flows: StoredFlow[];
  wireframes: StoredWireframe[];
  projects: StoredProject[];
  userStories: StoredUserStory[];
  marketResearch: StoredMarketResearch[];
  brandGuidelines: StoredBrandGuideline[];
}

export function FlowWireframeMappingPage() {
  const [allData, setAllData] = useState<LocalStorageData>({
    flows: [],
    wireframes: [],
    projects: [],
    userStories: [],
    marketResearch: [],
    brandGuidelines: []
  });
  const [mappings, setMappings] = useState<FlowWireframeMapping[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<StoredFlow | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // Determine workflow progress based on available data
  const getWorkflowProgress = () => {
    const completedSteps: string[] = [];
    let currentStep: "input" | "research" | "plan" | "diagram" | "wireframes" | "stories" | "code" | undefined;

    // Check for completed steps based on available data
    if (allData.flows.length > 0) {
      completedSteps.push("input", "research", "plan", "diagram");
      currentStep = "wireframes";
    }
    
    if (allData.wireframes.length > 0) {
      if (!completedSteps.includes("wireframes")) completedSteps.push("wireframes");
      currentStep = "stories";
    }
    
    if (allData.userStories.length > 0) {
      if (!completedSteps.includes("stories")) completedSteps.push("stories");
      currentStep = "code";
    }
    
    if (allData.projects.length > 0 && !completedSteps.includes("input")) {
      completedSteps.push("input", "research", "plan");
    }
    
    if (allData.marketResearch.length > 0 && !completedSteps.includes("research")) {
      completedSteps.push("research");
    }

    // If no data available, start from input
    if (completedSteps.length === 0) {
      currentStep = "input";
    }

    return { currentStep, completedSteps };
  };

  useEffect(() => {
    loadAllStoredData();
  }, []);

  const loadAllStoredData = () => {
    try {
      const data: LocalStorageData = {
        flows: [],
        wireframes: [],
        projects: [],
        userStories: [],
        marketResearch: [],
        brandGuidelines: []
      };

      // Debug: Log all localStorage keys
      console.log("All localStorage keys:", Object.keys(localStorage));
      
      // Load all localStorage data with proper parsing
      const loadFromStorage = (key: string) => {
        try {
          const item = localStorage.getItem(key);
          if (!item) return [];
          
          const parsed = JSON.parse(item);
          console.log(`${key}:`, parsed);
          
          // Handle different data structures
          if (Array.isArray(parsed)) {
            return parsed;
          } else if (typeof parsed === 'object' && parsed !== null) {
            // Handle object structures like flowDiagrams
            return Object.values(parsed);
          }
          return [];
        } catch (error) {
          console.warn(`Error parsing ${key}:`, error);
          return [];
        }
      };

      // Load flows from flowDiagrams (stored as object with flow names as keys)
      const flowDiagramsRaw = localStorage.getItem("flowDiagrams");
      if (flowDiagramsRaw) {
        try {
          const flowDiagrams = JSON.parse(flowDiagramsRaw);
          if (flowDiagrams && typeof flowDiagrams === 'object' && !Array.isArray(flowDiagrams)) {
            data.flows = Object.entries(flowDiagrams).map(([title, flowData]) => ({
              id: title.replace(/\s+/g, '-').toLowerCase(),
              title,
              flowData,
              createdAt: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.warn("Error parsing flowDiagrams:", error);
        }
      }
      
      // Load wireframes (may be nested in data property)
      const wireframesRaw = localStorage.getItem("generated_wireframes");
      if (wireframesRaw) {
        try {
          const wireframeParsed = JSON.parse(wireframesRaw);
          if (wireframeParsed?.data && Array.isArray(wireframeParsed.data)) {
            data.wireframes = wireframeParsed.data.map((wireframe: any) => ({
              id: wireframe.id || `wireframe-${Date.now()}`,
              pageName: wireframe.pageName || 'Untitled Page',
              htmlContent: wireframe.htmlCode || wireframe.htmlContent || '',
              createdAt: new Date().toISOString()
            }));
          } else if (Array.isArray(wireframeParsed)) {
            data.wireframes = wireframeParsed;
          }
        } catch (error) {
          console.warn("Error parsing wireframes:", error);
        }
      }
      
      // Load section flows as projects
      const sectionFlows = loadFromStorage("sectionFlowDiagrams");
      if (sectionFlows && typeof sectionFlows === 'object' && !Array.isArray(sectionFlows)) {
        data.projects = Object.entries(sectionFlows).map(([title, projectData]) => ({
          id: title.replace(/\s+/g, '-').toLowerCase(),
          title,
          description: `Section flow diagram for ${title}`,
          projectData,
          createdAt: new Date().toISOString()
        }));
      }
      
      // Load other data types
      data.userStories = loadFromStorage("userStories") || 
                         loadFromStorage("generatedUserStories") || [];
      
      data.marketResearch = loadFromStorage("marketResearch") || 
                            loadFromStorage("marketResearchResults") || [];
      
      data.brandGuidelines = loadFromStorage("brand_guidelines_storage") || 
                             loadFromStorage("brandGuidelines") || [];

      console.log("Final loaded data:", data);
      setAllData(data);
      generateComprehensiveMappings(data);
    } catch (error) {
      console.error("Error loading stored data:", error);
    }
  };

  const generateComprehensiveMappings = (data: LocalStorageData) => {
    const newMappings: FlowWireframeMapping[] = [];

    data.flows.forEach((flow: StoredFlow) => {
      const relatedWireframes: string[] = [];
      const relatedProjects: string[] = [];
      const relatedStories: string[] = [];
      
      // Map wireframes by content similarity
      data.wireframes.forEach((wireframe: StoredWireframe) => {
        const similarity = calculateSimilarity(flow.title, wireframe.pageName);
        if (similarity > 0.2) {
          relatedWireframes.push(wireframe.id);
        }
      });

      // Map projects by title similarity
      data.projects.forEach((project: StoredProject) => {
        const similarity = calculateSimilarity(flow.title, project.title);
        if (similarity > 0.3) {
          relatedProjects.push(project.id);
        }
      });

      // Map user stories by title similarity
      data.userStories.forEach((story: StoredUserStory) => {
        const similarity = calculateSimilarity(flow.title, story.title);
        if (similarity > 0.2) {
          relatedStories.push(story.id);
        }
      });

      // Create mapping if any relationships found
      if (relatedWireframes.length > 0 || relatedProjects.length > 0 || relatedStories.length > 0) {
        const totalRelations = relatedWireframes.length + relatedProjects.length + relatedStories.length;
        newMappings.push({
          flowId: flow.id,
          wireframeIds: relatedWireframes,
          projectIds: relatedProjects,
          storyIds: relatedStories,
          mappingConfidence: Math.min(0.9, 0.4 + (totalRelations * 0.15))
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
    
    return allData.wireframes.filter(w => mapping.wireframeIds.includes(w.id));
  };

  const getMappedProjects = (flowId: string): StoredProject[] => {
    const mapping = mappings.find(m => m.flowId === flowId);
    if (!mapping) return [];
    
    return allData.projects.filter(p => mapping.projectIds.includes(p.id));
  };

  const getMappedStories = (flowId: string): StoredUserStory[] => {
    const mapping = mappings.find(m => m.flowId === flowId);
    if (!mapping) return [];
    
    return allData.userStories.filter(s => mapping.storyIds.includes(s.id));
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

  const { currentStep, completedSteps } = getWorkflowProgress();

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            Flow & Wireframe Mapping
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Visualize process flows alongside their wireframe implementations
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="flex items-center gap-1 h-7 px-2">
            <Workflow className="h-3 w-3" />
            {allData.flows.length} Flows
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 h-7 px-2">
            <Code className="h-3 w-3" />
            {allData.wireframes.length} UIs
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 h-7 px-2">
            <Layers className="h-3 w-3" />
            {mappings.length} Maps
          </Badge>
        </div>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Compact Flow Selection Panel */}
        <Card className="lg:col-span-1 border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Workflow className="h-4 w-4 text-blue-600" />
              Process Flows
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {allData.flows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Workflow className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No process flows found</p>
                <p className="text-sm mt-1">Create flows in the BPMN Editor</p>
              </div>
            ) : (
              allData.flows.map((flow) => {
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
        <div className="lg:col-span-2 space-y-4">
          {selectedFlow ? (
            <>
              {/* Compact Flow Diagram */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Workflow className="h-4 w-4 text-blue-600" />
                    {selectedFlow.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80 border rounded-md overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                    <FlowDiagramViewer
                      flowData={selectedFlow.flowData}
                      title={selectedFlow.title}
                      className="h-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Compact Mapped Wireframes */}
              {(() => {
                const mappedWireframes = getMappedWireframes(selectedFlow.id);
                
                return mappedWireframes.length > 0 ? (
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Code className="h-4 w-4 text-green-600" />
                          UI Implementations ({mappedWireframes.length})
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant={viewMode === "desktop" ? "default" : "outline"}
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => setViewMode("desktop")}
                          >
                            <Monitor className="h-3 w-3 mr-1" />
                            Desktop
                          </Button>
                          <Button
                            variant={viewMode === "mobile" ? "default" : "outline"}
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => setViewMode("mobile")}
                          >
                            <Smartphone className="h-3 w-3 mr-1" />
                            Mobile
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Tabs defaultValue={mappedWireframes[0]?.id}>
                        <TabsList className="grid w-full grid-cols-auto mb-3">
                          {mappedWireframes.map((wireframe) => (
                            <TabsTrigger key={wireframe.id} value={wireframe.id} className="text-xs">
                              {wireframe.pageName}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        
                        {mappedWireframes.map((wireframe) => (
                          <TabsContent key={wireframe.id} value={wireframe.id} className="space-y-3">
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                              <div>
                                <h4 className="font-medium text-sm text-gray-900">
                                  {wireframe.pageName}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {new Date(wireframe.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3"
                                  onClick={() => openWireframePreview(wireframe)}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3"
                                  onClick={() => downloadWireframe(wireframe)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                            
                            {/* Compact Wireframe Preview */}
                            <div className={`border rounded-lg overflow-hidden shadow-sm ${
                              viewMode === "mobile" 
                                ? "max-w-xs mx-auto" 
                                : "w-full"
                            }`}>
                              <iframe
                                srcDoc={wireframe.htmlContent}
                                className={`w-full border-0 ${
                                  viewMode === "mobile" 
                                    ? "h-80" 
                                    : "h-96"
                                }`}
                                title={wireframe.pageName}
                              />
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-l-4 border-l-gray-300">
                    <CardContent className="py-8">
                      <div className="text-center text-gray-500">
                        <Code className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No wireframes mapped to this flow</p>
                        <p className="text-xs mt-1 text-gray-400">
                          Generate wireframes to see them here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </>
          ) : (
            <Card className="border-l-4 border-l-gray-300">
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Select a process flow to view details</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Choose from the flows on the left
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Compact Summary Statistics */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-4 w-4 text-purple-600" />
            Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="text-xl font-bold text-blue-600">{allData.flows.length}</div>
              <div className="text-xs text-blue-700">Flows</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-xl font-bold text-green-600">{allData.wireframes.length}</div>
              <div className="text-xs text-green-700">Wireframes</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="text-xl font-bold text-purple-600">{allData.projects.length}</div>
              <div className="text-xs text-purple-700">Projects</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
              <div className="text-xl font-bold text-indigo-600">{allData.userStories.length}</div>
              <div className="text-xs text-indigo-700">Stories</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200">
              <div className="text-xl font-bold text-teal-600">{allData.brandGuidelines.length}</div>
              <div className="text-xs text-teal-700">Brands</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="text-xl font-bold text-orange-600">{mappings.length}</div>
              <div className="text-xs text-orange-700">Mappings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
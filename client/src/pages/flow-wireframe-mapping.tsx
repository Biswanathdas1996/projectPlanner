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
  Smartphone,
  FileText
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const [isExporting, setIsExporting] = useState(false);

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

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title Page
      pdf.setFontSize(24);
      pdf.text('Flow & Wireframe Mapping Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Project Overview
      pdf.setFontSize(16);
      pdf.text('Project Overview', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Process Flows: ${allData.flows.length}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Wireframes: ${allData.wireframes.length}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Active Mappings: ${mappings.length}`, 20, yPosition);
      yPosition += 15;

      // Process Flows Section - Export ALL flows
      for (let i = 0; i < allData.flows.length; i++) {
        const flow = allData.flows[i];
        
        // New page for each flow
        if (i > 0) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.text(`Process Flow: ${flow.title}`, 20, yPosition);
        yPosition += 15;

        // Temporarily select this flow to capture its diagram
        const originalSelection = selectedFlow;
        setSelectedFlow(flow);
        
        // Wait for React to re-render
        await new Promise(resolve => setTimeout(resolve, 500));

        // Capture flow diagram with exact colors and full dimensions
        const flowElement = document.querySelector('.react-flow') as HTMLElement;
        if (flowElement) {
          try {
            console.log('Attempting to capture flow diagram for:', flow.title);
            
            // Wait for the flow to fully render and stabilize
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if flow elements exist
            const nodeElements = flowElement.querySelectorAll('.react-flow__node');
            const edgeElements = flowElement.querySelectorAll('.react-flow__edge');
            
            console.log(`Found ${nodeElements.length} nodes and ${edgeElements.length} edges`);
            console.log('Flow element dimensions:', flowElement.offsetWidth, 'x', flowElement.offsetHeight);
            console.log('Flow element visibility:', window.getComputedStyle(flowElement).visibility);
            console.log('Flow element display:', window.getComputedStyle(flowElement).display);
            
            if (nodeElements.length === 0) {
              console.warn('No flow nodes found, adding fallback text');
              pdf.setFontSize(10);
              pdf.text(`Flow diagram for "${flow.title}" - Visual representation not captured`, 20, yPosition);
              yPosition += 10;
              pdf.text(`This flow contains the process visualization that would appear here.`, 20, yPosition);
              yPosition += 15;
            } else {
              // Ensure the element is visible and has dimensions
              const rect = flowElement.getBoundingClientRect();
              console.log('Element bounding rect:', rect);
              
              if (rect.width === 0 || rect.height === 0) {
                console.warn('Flow element has zero dimensions, forcing size');
                flowElement.style.width = '800px';
                flowElement.style.height = '600px';
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
              // Use a more reliable capture approach
              const canvas = await html2canvas(flowElement, {
                scale: 1,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                foreignObjectRendering: false,
                removeContainer: false,
                imageTimeout: 5000,
                width: Math.max(flowElement.scrollWidth, 800),
                height: Math.max(flowElement.scrollHeight, 600)
              });
              
              console.log(`Canvas captured: ${canvas.width}x${canvas.height}`);
              
              if (canvas.width > 10 && canvas.height > 10) {
                const imgData = canvas.toDataURL('image/png', 0.9);
                
                // Test if the image actually contains content
                const testImg = new Image();
                testImg.onload = () => {
                  console.log('Image loaded successfully, dimensions:', testImg.width, 'x', testImg.height);
                };
                testImg.src = imgData;
                
                // Calculate size for PDF
                const maxPdfWidth = pageWidth - 40;
                const maxPdfHeight = pageHeight - 100;
                
                let imgWidth = Math.min(maxPdfWidth, canvas.width * 0.5);
                let imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // If height exceeds page, scale down
                if (imgHeight > maxPdfHeight) {
                  imgHeight = maxPdfHeight;
                  imgWidth = (canvas.width * imgHeight) / canvas.height;
                }
                
                // Check if we need a new page
                if (yPosition + imgHeight > pageHeight - 20) {
                  pdf.addPage();
                  yPosition = 20;
                }
                
                // Center the image
                const xPosition = (pageWidth - imgWidth) / 2;
                pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 20;
                
                console.log(`Flow diagram added to PDF: ${imgWidth}x${imgHeight} at position ${xPosition}, ${yPosition - imgHeight - 20}`);
              } else {
                console.warn('Canvas capture failed or has minimal content');
                pdf.setFontSize(10);
                pdf.text(`Flow diagram for "${flow.title}" - Capture failed`, 20, yPosition);
                yPosition += 10;
                pdf.text(`Technical note: Flow visualization present but not exportable`, 20, yPosition);
                yPosition += 15;
              }
            }
          } catch (error) {
            console.warn('Could not capture flow diagram:', error);
            pdf.setFontSize(10);
            pdf.text('Flow diagram could not be captured', 20, yPosition);
            yPosition += 15;
          }
        }

        // Restore original selection
        setSelectedFlow(originalSelection);

        // Mapped wireframes with images
        const mappedWireframes = getMappedWireframes(flow.id);
        if (mappedWireframes.length > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(14);
          pdf.text(`Associated Wireframes (${mappedWireframes.length}):`, 20, yPosition);
          yPosition += 15;

          for (const wireframe of mappedWireframes) {
            // Check if we need a new page
            if (yPosition > pageHeight - 80) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.setFontSize(12);
            pdf.text(wireframe.pageName, 20, yPosition);
            yPosition += 5;
            
            pdf.setFontSize(9);
            pdf.text(`Generated: ${new Date(wireframe.createdAt).toLocaleDateString()}`, 20, yPosition);
            yPosition += 10;

            // Create wireframe preview with exact colors
            try {
              // Create a hidden iframe to render the wireframe
              const iframe = document.createElement('iframe');
              iframe.style.width = '1200px';
              iframe.style.height = '800px';
              iframe.style.position = 'absolute';
              iframe.style.left = '-9999px';
              iframe.style.border = 'none';
              iframe.srcdoc = wireframe.htmlContent;
              document.body.appendChild(iframe);

              // Wait for iframe to fully load and render
              await new Promise((resolve) => {
                iframe.onload = () => {
                  setTimeout(resolve, 1000); // Extra time for CSS/fonts to load
                };
                setTimeout(resolve, 2000); // Fallback timeout
              });

              // Capture the wireframe with exact colors
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              if (iframeDoc && iframeDoc.body) {
                const wireframeCanvas = await html2canvas(iframeDoc.body, {
                  scale: 1.5,
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: '#ffffff',
                  logging: false,
                  height: iframeDoc.body.scrollHeight,
                  width: iframeDoc.body.scrollWidth
                });

                document.body.removeChild(iframe);

                const wireframeImgData = wireframeCanvas.toDataURL('image/png', 1.0);
                const wireframeImgWidth = Math.min(160, pageWidth - 40);
                const wireframeImgHeight = (wireframeCanvas.height * wireframeImgWidth) / wireframeCanvas.width;

                // Check if we need a new page for the wireframe
                if (yPosition + wireframeImgHeight > pageHeight - 20) {
                  pdf.addPage();
                  yPosition = 20;
                }

                pdf.addImage(wireframeImgData, 'PNG', 20, yPosition, wireframeImgWidth, wireframeImgHeight);
                yPosition += wireframeImgHeight + 15;
              } else {
                document.body.removeChild(iframe);
                pdf.setFontSize(9);
                pdf.text('Wireframe preview not available', 25, yPosition);
                yPosition += 10;
              }
            } catch (error) {
              console.warn('Could not capture wireframe:', error);
              pdf.setFontSize(9);
              pdf.text('Wireframe image could not be captured', 25, yPosition);
              yPosition += 10;
            }
          }
        } else {
          // No wireframes mapped
          pdf.setFontSize(12);
          pdf.text('No wireframes mapped to this flow', 20, yPosition);
          yPosition += 15;
        }
      }

      // Summary page
      pdf.addPage();
      yPosition = 20;

      pdf.setFontSize(16);
      pdf.text('Summary', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.text(`This comprehensive report contains ${allData.flows.length} process flows with their corresponding flow diagrams.`, 20, yPosition);
      yPosition += 5;
      pdf.text(`${allData.wireframes.length} wireframes are included with exact colors and visual elements.`, 20, yPosition);
      yPosition += 5;
      pdf.text(`${mappings.length} intelligent mappings connect flows to their UI implementations.`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Generated from Flow & Wireframe Mapping analysis on ${new Date().toLocaleDateString()}.`, 20, yPosition);

      // Save the PDF
      pdf.save(`flow-wireframe-mapping-complete-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
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
          <Button
            onClick={exportToPDF}
            variant="outline"
            size="sm"
            className="h-7 px-3"
            disabled={allData.flows.length === 0 || isExporting}
          >
            {isExporting ? (
              <>
                <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-3 w-3 mr-1" />
                Export PDF
              </>
            )}
          </Button>
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

              {/* Modern Mapped Wireframes */}
              {(() => {
                const mappedWireframes = getMappedWireframes(selectedFlow.id);
                
                return mappedWireframes.length > 0 ? (
                  <Card className="border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4 bg-white/80 backdrop-blur-sm rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Code className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <span className="text-gray-900">UI Implementations</span>
                            <div className="text-sm font-normal text-green-600">
                              {mappedWireframes.length} wireframe{mappedWireframes.length !== 1 ? 's' : ''} connected
                            </div>
                          </div>
                        </CardTitle>
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                          <Button
                            variant={viewMode === "desktop" ? "default" : "ghost"}
                            size="sm"
                            className={`h-9 px-4 transition-all duration-200 ${
                              viewMode === "desktop" 
                                ? "bg-white shadow-sm" 
                                : "hover:bg-white/50"
                            }`}
                            onClick={() => setViewMode("desktop")}
                          >
                            <Monitor className="h-4 w-4 mr-2" />
                            Desktop
                          </Button>
                          <Button
                            variant={viewMode === "mobile" ? "default" : "ghost"}
                            size="sm"
                            className={`h-9 px-4 transition-all duration-200 ${
                              viewMode === "mobile" 
                                ? "bg-white shadow-sm" 
                                : "hover:bg-white/50"
                            }`}
                            onClick={() => setViewMode("mobile")}
                          >
                            <Smartphone className="h-4 w-4 mr-2" />
                            Mobile
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Tabs defaultValue={mappedWireframes[0]?.id} className="space-y-6">
                        <div className="relative">
                          <TabsList className="grid w-full bg-gradient-to-r from-gray-50 to-slate-50 backdrop-blur-sm p-1.5 rounded-xl shadow-md border border-gray-200/50 relative overflow-hidden" style={{gridTemplateColumns: `repeat(${mappedWireframes.length}, 1fr)`}}>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-purple-50/30 rounded-xl"></div>
                            {mappedWireframes.map((wireframe, index) => (
                              <TabsTrigger 
                                key={wireframe.id} 
                                value={wireframe.id} 
                                className="relative text-sm font-medium px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:z-10 hover:bg-white/50 group"
                              >
                                <div className="flex items-center gap-2.5 relative z-10">
                                  <div className="relative">
                                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 shadow-sm group-data-[state=active]:shadow-md transition-all duration-300"></div>
                                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-pulse opacity-0 group-data-[state=active]:opacity-50"></div>
                                  </div>
                                  <span className="text-gray-700 group-data-[state=active]:text-gray-900 group-data-[state=active]:font-semibold transition-all duration-300 truncate">
                                    {wireframe.pageName}
                                  </span>
                                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                                </div>
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </div>
                        
                        {mappedWireframes.map((wireframe) => (
                          <TabsContent key={wireframe.id} value={wireframe.id} className="space-y-6">
                            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                              
                              <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                                      <ExternalLink className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full shadow-sm animate-pulse"></div>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-900 transition-colors duration-300">
                                      {wireframe.pageName}
                                    </h4>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full shadow-sm"></div>
                                        <span className="font-medium">Active</span>
                                      </div>
                                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                      <span>Created {new Date(wireframe.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <Button
                                    variant="outline"
                                    size="default"
                                    className="h-11 px-6 bg-white/80 backdrop-blur-sm border-blue-200/70 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                                    onClick={() => openWireframePreview(wireframe)}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Preview
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="default"
                                    className="h-11 px-6 bg-white/80 backdrop-blur-sm border-emerald-200/70 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                                    onClick={() => downloadWireframe(wireframe)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Enhanced Modern Wireframe Preview */}
                              <div className={`relative group ${
                                viewMode === "mobile" 
                                  ? "max-w-sm mx-auto" 
                                  : "w-full"
                              }`}>
                                {/* Animated background glow */}
                                <div className="absolute -inset-4 bg-gradient-to-r from-blue-200/20 via-purple-200/20 to-indigo-200/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                                
                                {/* Device frame */}
                                <div className={`relative bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl p-3 shadow-2xl hover:shadow-3xl transition-all duration-500 group-hover:scale-[1.02] ${
                                  viewMode === "mobile" 
                                    ? "aspect-[9/19]" 
                                    : "aspect-[16/11]"
                                }`}>
                                  {/* Device chrome/bezel */}
                                  <div className="relative w-full h-full bg-black rounded-xl p-1 shadow-inner">
                                    {/* Screen area */}
                                    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-lg">
                                      {/* Browser header */}
                                      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center px-4 z-10">
                                        <div className="flex items-center gap-2 mr-4">
                                          <div className="w-3 h-3 bg-gradient-to-br from-red-400 to-red-500 rounded-full shadow-sm"></div>
                                          <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-sm"></div>
                                          <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full shadow-sm"></div>
                                        </div>
                                        <div className="flex-1 bg-white rounded-md h-6 flex items-center px-3 shadow-inner">
                                          <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                                          <div className="text-xs text-gray-500 font-mono">{wireframe.pageName.toLowerCase().replace(/\s+/g, '-')}.html</div>
                                        </div>
                                        <div className="ml-4 flex gap-1">
                                          <div className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 transition-colors duration-200"></div>
                                          <div className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 transition-colors duration-200"></div>
                                        </div>
                                      </div>
                                      
                                      {/* Wireframe content */}
                                      <div className="absolute inset-0 pt-10">
                                        <iframe
                                          srcDoc={wireframe.htmlContent}
                                          className="w-full h-full border-0 bg-white"
                                          title={wireframe.pageName}
                                        />
                                      </div>
                                      
                                      {/* Subtle overlay for depth */}
                                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                    
                                    {/* Device reflection */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-xl pointer-events-none"></div>
                                  </div>
                                  
                                  {/* Device shadow */}
                                  <div className="absolute inset-0 bg-black/20 rounded-2xl blur-sm -z-10 translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-gray-300 transition-all duration-300">
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                          <Code className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No wireframes mapped
                        </h3>
                        <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                          This process flow doesn't have any UI wireframes connected yet. Generate wireframes to see them here.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          Generate Wireframes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </>
          ) : (
            <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-slate-50 to-gray-50 hover:border-gray-300 transition-all duration-300">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-fit mx-auto">
                      <MapPin className="h-10 w-10 text-blue-400" />
                    </div>
                    <div className="absolute top-0 right-0 w-3 h-3 bg-blue-200 rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Ready to explore your flows
                  </h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto leading-relaxed">
                    Select any process flow from the left panel to view its details, diagrams, and connected wireframes.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <span>Choose a flow to get started</span>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modern Summary Statistics */}
      <Card className="border border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-4 bg-white/90 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <span className="text-gray-900">Project Analytics</span>
              <div className="text-sm font-normal text-purple-600">
                Comprehensive project overview
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="group relative overflow-hidden bg-white rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md hover:border-blue-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-bl-3xl opacity-50"></div>
              <div className="relative">
                <div className="text-2xl font-bold text-blue-600 mb-1 group-hover:scale-110 transition-transform duration-200">
                  {allData.flows.length}
                </div>
                <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                  Process Flows
                </div>
                <div className="mt-2 h-1 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out" style={{width: `${Math.min(100, (allData.flows.length / 10) * 100)}%`}}></div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md hover:border-green-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-bl-3xl opacity-50"></div>
              <div className="relative">
                <div className="text-2xl font-bold text-green-600 mb-1 group-hover:scale-110 transition-transform duration-200">
                  {allData.wireframes.length}
                </div>
                <div className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  UI Wireframes
                </div>
                <div className="mt-2 h-1 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out" style={{width: `${Math.min(100, (allData.wireframes.length / 10) * 100)}%`}}></div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-xl p-4 shadow-sm border border-purple-100 hover:shadow-md hover:border-purple-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-bl-3xl opacity-50"></div>
              <div className="relative">
                <div className="text-2xl font-bold text-purple-600 mb-1 group-hover:scale-110 transition-transform duration-200">
                  {allData.projects.length}
                </div>
                <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  Projects
                </div>
                <div className="mt-2 h-1 bg-purple-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-1000 ease-out" style={{width: `${Math.min(100, (allData.projects.length / 5) * 100)}%`}}></div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-xl p-4 shadow-sm border border-indigo-100 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-bl-3xl opacity-50"></div>
              <div className="relative">
                <div className="text-2xl font-bold text-indigo-600 mb-1 group-hover:scale-110 transition-transform duration-200">
                  {allData.userStories.length}
                </div>
                <div className="text-xs font-medium text-indigo-700 uppercase tracking-wide">
                  User Stories
                </div>
                <div className="mt-2 h-1 bg-indigo-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-1000 ease-out" style={{width: `${Math.min(100, (allData.userStories.length / 5) * 100)}%`}}></div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-xl p-4 shadow-sm border border-teal-100 hover:shadow-md hover:border-teal-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-bl-3xl opacity-50"></div>
              <div className="relative">
                <div className="text-2xl font-bold text-teal-600 mb-1 group-hover:scale-110 transition-transform duration-200">
                  {allData.brandGuidelines.length}
                </div>
                <div className="text-xs font-medium text-teal-700 uppercase tracking-wide">
                  Brand Guides
                </div>
                <div className="mt-2 h-1 bg-teal-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-1000 ease-out" style={{width: `${Math.min(100, (allData.brandGuidelines.length / 3) * 100)}%`}}></div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-xl p-4 shadow-sm border border-orange-100 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-bl-3xl opacity-50"></div>
              <div className="relative">
                <div className="text-2xl font-bold text-orange-600 mb-1 group-hover:scale-110 transition-transform duration-200">
                  {mappings.length}
                </div>
                <div className="text-xs font-medium text-orange-700 uppercase tracking-wide">
                  Flow Mappings
                </div>
                <div className="mt-2 h-1 bg-orange-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000 ease-out" style={{width: `${Math.min(100, (mappings.length / 5) * 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
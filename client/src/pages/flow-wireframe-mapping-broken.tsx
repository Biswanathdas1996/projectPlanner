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

        // Create custom flow diagram visualization directly on canvas
        try {
          console.log('Creating custom flow diagram for:', flow.title);
          
          if (flow.flowData && flow.flowData.nodes && flow.flowData.nodes.length > 0) {
            // Create a canvas to draw the flow diagram
            const diagramCanvas = document.createElement('canvas');
            const ctx = diagramCanvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            
            // Calculate diagram dimensions
            const nodes = flow.flowData.nodes;
            const edges = flow.flowData.edges || [];
            
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            nodes.forEach((node: any) => {
              minX = Math.min(minX, node.position.x);
              maxX = Math.max(maxX, node.position.x + 150); // node width
              minY = Math.min(minY, node.position.y);
              maxY = Math.max(maxY, node.position.y + 50); // node height
            });
            
            const padding = 50;
            const diagramWidth = maxX - minX + padding * 2;
            const diagramHeight = maxY - minY + padding * 2;
            
            diagramCanvas.width = diagramWidth;
            diagramCanvas.height = diagramHeight;
            
            // Set canvas background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, diagramWidth, diagramHeight);
            
            // Draw edges first (so they appear behind nodes)
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            edges.forEach((edge: any) => {
              const sourceNode = nodes.find((n: any) => n.id === edge.source);
              const targetNode = nodes.find((n: any) => n.id === edge.target);
              
              if (sourceNode && targetNode) {
                const startX = sourceNode.position.x - minX + padding + 75; // center of node
                const startY = sourceNode.position.y - minY + padding + 25;
                const endX = targetNode.position.x - minX + padding + 75;
                const endY = targetNode.position.y - minY + padding + 25;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                
                // Draw with arrow if animated
                if (edge.animated) {
                  ctx.setLineDash([5, 5]);
                } else {
                  ctx.setLineDash([]);
                }
                
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                // Draw arrow head
                const angle = Math.atan2(endY - startY, endX - startX);
                const arrowLength = 10;
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX - arrowLength * Math.cos(angle - Math.PI / 6), endY - arrowLength * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX - arrowLength * Math.cos(angle + Math.PI / 6), endY - arrowLength * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
              }
            });
            
            // Draw nodes
            nodes.forEach((node: any) => {
              const x = node.position.x - minX + padding;
              const y = node.position.y - minY + padding;
              const width = 150;
              const height = 50;
              
              // Get node style
              const backgroundColor = node.style?.backgroundColor || '#e2e8f0';
              const textColor = node.style?.color || '#000000';
              const borderColor = node.style?.border?.includes('#') ? 
                node.style.border.match(/#[0-9a-fA-F]{6}/)?.[0] || '#cbd5e1' : '#cbd5e1';
              
              // Draw node shape
              if (node.style?.shape === 'diamond') {
                // Diamond shape for decision nodes
                ctx.fillStyle = backgroundColor;
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + width / 2, y);
                ctx.lineTo(x + width, y + height / 2);
                ctx.lineTo(x + width / 2, y + height);
                ctx.lineTo(x, y + height / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
              } else {
                // Rectangle shape for regular nodes
                ctx.fillStyle = backgroundColor;
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 2;
                ctx.fillRect(x, y, width, height);
                ctx.strokeRect(x, y, width, height);
              }
              
              // Draw node text
              ctx.fillStyle = textColor;
              ctx.font = '12px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Wrap text if needed
              const text = node.data.label || node.id;
              const maxTextWidth = width - 20;
              const words = text.split(' ');
              let lines: string[] = [];
              let currentLine = '';
              
              words.forEach((word: any) => {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxTextWidth && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              });
              if (currentLine) lines.push(currentLine);
              
              // Draw text lines
              const lineHeight = 14;
              const totalTextHeight = lines.length * lineHeight;
              const startY = y + height / 2 - totalTextHeight / 2 + lineHeight / 2;
              
              lines.forEach((line, index) => {
                ctx.fillText(line, x + width / 2, startY + index * lineHeight);
              });
            });
            
            // Convert canvas to image data
            const imgData = diagramCanvas.toDataURL('image/png', 1.0);
            
            // Calculate size for PDF
            const maxPdfWidth = pageWidth - 40;
            const maxPdfHeight = pageHeight - 100;
            const aspectRatio = diagramWidth / diagramHeight;
            
            let imgWidth = Math.min(maxPdfWidth, diagramWidth * 0.5);
            let imgHeight = imgWidth / aspectRatio;
            
            // If height exceeds page, scale down
            if (imgHeight > maxPdfHeight) {
              imgHeight = maxPdfHeight;
              imgWidth = imgHeight * aspectRatio;
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
            
            console.log(`Custom flow diagram added to PDF: ${imgWidth}x${imgHeight}`);
          } else {
            console.warn('No flow data available');
            pdf.setFontSize(10);
            pdf.text(`Flow diagram for "${flow.title}" - No flow data available`, 20, yPosition);
            yPosition += 15;
          }
        } catch (error) {
          console.error('Failed to create custom flow diagram:', error);
          pdf.setFontSize(10);
          pdf.text(`Flow diagram for "${flow.title}" - Custom rendering failed`, 20, yPosition);
          yPosition += 15;
        }

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

  // Determine workflow progress based on available data
  const currentStep = allData.flows.length > 0 ? 
    (allData.wireframes.length > 0 ? 'wireframes' : 'diagram') : 'input';
  const completedSteps = [
    ...(allData.flows.length > 0 ? ['input', 'plan', 'diagram'] : []),
    ...(allData.wireframes.length > 0 ? ['wireframes'] : []),
  ];

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
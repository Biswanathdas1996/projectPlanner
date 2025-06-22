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
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    try {
      console.log('All localStorage keys:', Object.keys(localStorage));
      
      const data: LocalStorageData = {
        flows: [],
        wireframes: [],
        projects: [],
        userStories: [],
        marketResearch: [],
        brandGuidelines: []
      };

      // Load flows from multiple possible sources
      const flowDiagrams = localStorage.getItem('flowDiagrams');
      if (flowDiagrams) {
        try {
          const parsedFlows = JSON.parse(flowDiagrams);
          if (typeof parsedFlows === 'object' && parsedFlows !== null) {
            Object.entries(parsedFlows).forEach(([id, flowData]: [string, any]) => {
              if (flowData && typeof flowData === 'object') {
                data.flows.push({
                  id,
                  title: flowData.title || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  flowData: flowData,
                  createdAt: flowData.createdAt || new Date().toISOString()
                });
              }
            });
          }
        } catch (e) {
          console.error('Error parsing flowDiagrams:', e);
        }
      }

      // Load wireframes
      const wireframes = localStorage.getItem('generated_wireframes');
      if (wireframes) {
        try {
          const parsedWireframes = JSON.parse(wireframes);
          if (Array.isArray(parsedWireframes)) {
            data.wireframes = parsedWireframes.map((w: any) => ({
              id: w.id || `wireframe-${Date.now()}`,
              pageName: w.pageName || w.name || 'Unnamed Page',
              htmlContent: w.htmlContent || w.content || '',
              createdAt: w.createdAt || new Date().toISOString()
            }));
          } else if (typeof parsedWireframes === 'object') {
            Object.entries(parsedWireframes).forEach(([key, value]: [string, any]) => {
              if (value && typeof value === 'object') {
                if (Array.isArray(value)) {
                  value.forEach((w: any) => {
                    data.wireframes.push({
                      id: w.id || `wireframe-${Date.now()}`,
                      pageName: w.pageName || w.name || 'Unnamed Page',
                      htmlContent: w.htmlContent || w.content || '',
                      createdAt: w.createdAt || new Date().toISOString()
                    });
                  });
                } else {
                  data.wireframes.push({
                    id: value.id || `wireframe-${Date.now()}`,
                    pageName: value.pageName || value.name || 'Unnamed Page',
                    htmlContent: value.htmlContent || value.content || '',
                    createdAt: value.createdAt || new Date().toISOString()
                  });
                }
              }
            });
          }
        } catch (e) {
          console.error('Error parsing wireframes:', e);
        }
      }

      console.log('Final loaded data:', data);
      setAllData(data);
      generateComprehensiveMappings(data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateComprehensiveMappings = (data: LocalStorageData) => {
    const newMappings: FlowWireframeMapping[] = [];

    data.flows.forEach((flow: StoredFlow) => {
      const relatedWireframes: string[] = [];
      
      data.wireframes.forEach((wireframe: StoredWireframe) => {
        const flowTitle = flow.title.toLowerCase();
        const wireframeName = wireframe.pageName.toLowerCase();
        
        const hasCommonTerms = flowTitle.split(' ').some(term => 
          term.length > 3 && wireframeName.includes(term)
        ) || wireframeName.split(' ').some(term => 
          term.length > 3 && flowTitle.includes(term)
        );
        
        if (hasCommonTerms) {
          relatedWireframes.push(wireframe.id);
        }
      });

      const relatedProjects: string[] = [];
      data.projects.forEach((project: StoredProject) => {
        const projectTitle = project.title.toLowerCase();
        const flowTitle = flow.title.toLowerCase();
        
        const hasSharedWords = projectTitle.split(' ').some(word => 
          word.length > 3 && flowTitle.includes(word)
        );
        
        if (hasSharedWords) {
          relatedProjects.push(project.id);
        }
      });

      const relatedStories: string[] = [];
      data.userStories.forEach((story: StoredUserStory) => {
        const storyTitle = story.title.toLowerCase();
        const flowTitle = flow.title.toLowerCase();
        
        const hasConnection = storyTitle.split(' ').some(word => 
          word.length > 3 && flowTitle.includes(word)
        );
        
        if (hasConnection) {
          relatedStories.push(story.id);
        }
      });

      if (relatedWireframes.length > 0 || relatedProjects.length > 0 || relatedStories.length > 0) {
        newMappings.push({
          flowId: flow.id,
          wireframeIds: relatedWireframes,
          projectIds: relatedProjects,
          storyIds: relatedStories,
          mappingConfidence: Math.min(0.95, 
            (relatedWireframes.length * 0.4 + relatedProjects.length * 0.3 + relatedStories.length * 0.3)
          )
        });
      }
    });

    setMappings(newMappings);
  };

  const getMappedWireframes = (flowId: string): StoredWireframe[] => {
    const mapping = mappings.find(m => m.flowId === flowId);
    if (!mapping) return [];
    
    return mapping.wireframeIds
      .map(id => allData.wireframes.find(w => w.id === id))
      .filter(Boolean) as StoredWireframe[];
  };

  const downloadWireframe = (wireframe: StoredWireframe) => {
    const blob = new Blob([wireframe.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wireframe.pageName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
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

      // Export each flow with its diagram and wireframes
      for (let i = 0; i < allData.flows.length; i++) {
        const flow = allData.flows[i];
        
        if (i > 0) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.text(`Process Flow: ${flow.title}`, 20, yPosition);
        yPosition += 15;

        // Create custom flow diagram
        if (flow.flowData && flow.flowData.nodes && flow.flowData.nodes.length > 0) {
          try {
            const diagramCanvas = document.createElement('canvas');
            const ctx = diagramCanvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            
            const nodes = flow.flowData.nodes;
            const edges = flow.flowData.edges || [];
            
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            nodes.forEach((node: any) => {
              minX = Math.min(minX, node.position.x);
              maxX = Math.max(maxX, node.position.x + 150);
              minY = Math.min(minY, node.position.y);
              maxY = Math.max(maxY, node.position.y + 50);
            });
            
            const padding = 50;
            const diagramWidth = maxX - minX + padding * 2;
            const diagramHeight = maxY - minY + padding * 2;
            
            diagramCanvas.width = diagramWidth;
            diagramCanvas.height = diagramHeight;
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, diagramWidth, diagramHeight);
            
            // Draw edges
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            edges.forEach((edge: any) => {
              const sourceNode = nodes.find((n: any) => n.id === edge.source);
              const targetNode = nodes.find((n: any) => n.id === edge.target);
              
              if (sourceNode && targetNode) {
                const startX = sourceNode.position.x - minX + padding + 75;
                const startY = sourceNode.position.y - minY + padding + 25;
                const endX = targetNode.position.x - minX + padding + 75;
                const endY = targetNode.position.y - minY + padding + 25;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                // Arrow head
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
              
              const backgroundColor = node.style?.backgroundColor || '#e2e8f0';
              const textColor = node.style?.color || '#000000';
              const borderColor = node.style?.border?.includes('#') ? 
                node.style.border.match(/#[0-9a-fA-F]{6}/)?.[0] || '#cbd5e1' : '#cbd5e1';
              
              ctx.fillStyle = backgroundColor;
              ctx.strokeStyle = borderColor;
              ctx.lineWidth = 2;
              ctx.fillRect(x, y, width, height);
              ctx.strokeRect(x, y, width, height);
              
              ctx.fillStyle = textColor;
              ctx.font = '12px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const text = node.data.label || node.id;
              ctx.fillText(text, x + width / 2, y + height / 2);
            });
            
            const imgData = diagramCanvas.toDataURL('image/png', 1.0);
            
            const maxPdfWidth = pageWidth - 40;
            const maxPdfHeight = pageHeight - 100;
            const aspectRatio = diagramWidth / diagramHeight;
            
            let imgWidth = Math.min(maxPdfWidth, diagramWidth * 0.5);
            let imgHeight = imgWidth / aspectRatio;
            
            if (imgHeight > maxPdfHeight) {
              imgHeight = maxPdfHeight;
              imgWidth = imgHeight * aspectRatio;
            }
            
            if (yPosition + imgHeight > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            
            const xPosition = (pageWidth - imgWidth) / 2;
            pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 20;
            
          } catch (error) {
            console.error('Failed to create flow diagram:', error);
            pdf.setFontSize(10);
            pdf.text(`Flow diagram for "${flow.title}" - Custom rendering failed`, 20, yPosition);
            yPosition += 15;
          }
        }

        // Add wireframes with visual captures
        const mappedWireframes = getMappedWireframes(flow.id);
        if (mappedWireframes.length > 0) {
          pdf.setFontSize(14);
          pdf.text(`Associated Wireframes (${mappedWireframes.length}):`, 20, yPosition);
          yPosition += 15;

          for (const wireframe of mappedWireframes) {
            // Check if we need a new page
            if (yPosition > pageHeight - 150) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.setFontSize(12);
            pdf.text(wireframe.pageName, 20, yPosition);
            yPosition += 5;
            
            pdf.setFontSize(9);
            pdf.text(`Generated: ${new Date(wireframe.createdAt).toLocaleDateString()}`, 20, yPosition);
            yPosition += 10;

            // Create wireframe preview using a more reliable approach
            try {
              console.log(`Attempting to capture wireframe: ${wireframe.pageName}`);
              
              // Create a visible temporary container for better rendering
              const tempContainer = document.createElement('div');
              tempContainer.style.position = 'fixed';
              tempContainer.style.top = '0';
              tempContainer.style.left = '0';
              tempContainer.style.width = '1200px';
              tempContainer.style.height = '800px';
              tempContainer.style.zIndex = '-1000';
              tempContainer.style.backgroundColor = '#ffffff';
              tempContainer.style.overflow = 'hidden';
              tempContainer.innerHTML = wireframe.htmlContent;
              
              // Add to document for rendering
              document.body.appendChild(tempContainer);
              
              // Wait for rendering to complete
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Capture using html2canvas with improved settings
              const canvas = await html2canvas(tempContainer, {
                width: 1200,
                height: 800,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 0.6,
                logging: true,
                foreignObjectRendering: true,
                removeContainer: false,
                onclone: (clonedDoc, element) => {
                  // Ensure all styles are preserved in clone
                  const clonedContainer = clonedDoc.querySelector('div');
                  if (clonedContainer) {
                    clonedContainer.style.position = 'static';
                    clonedContainer.style.width = '1200px';
                    clonedContainer.style.height = '800px';
                    clonedContainer.style.backgroundColor = '#ffffff';
                  }
                }
              });

              // Clean up temporary container
              document.body.removeChild(tempContainer);

              console.log(`Canvas captured for ${wireframe.pageName}: ${canvas.width}x${canvas.height}`);

              if (canvas.width > 100 && canvas.height > 100) {
                const imgData = canvas.toDataURL('image/png', 0.95);
                
                // Calculate optimal size for PDF
                const maxWireframeWidth = pageWidth - 40;
                const maxWireframeHeight = 120;
                const aspectRatio = canvas.width / canvas.height;
                
                let imgWidth = Math.min(maxWireframeWidth, 160); // Fixed reasonable width
                let imgHeight = imgWidth / aspectRatio;
                
                // Ensure height doesn't exceed limit
                if (imgHeight > maxWireframeHeight) {
                  imgHeight = maxWireframeHeight;
                  imgWidth = imgHeight * aspectRatio;
                }
                
                // Center the wireframe image
                const xPosition = (pageWidth - imgWidth) / 2;
                pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 20;
                
                console.log(`✓ Wireframe "${wireframe.pageName}" added to PDF: ${imgWidth}x${imgHeight}`);
              } else {
                console.warn(`Canvas too small for ${wireframe.pageName}: ${canvas.width}x${canvas.height}`);
                pdf.setFontSize(9);
                pdf.text('Wireframe preview could not be generated (canvas too small)', 25, yPosition);
                yPosition += 15;
              }
            } catch (error) {
              console.error('Wireframe capture failed:', error);
              pdf.setFontSize(9);
              pdf.text(`Wireframe preview failed: ${error.message || 'Unknown error'}`, 25, yPosition);
              yPosition += 15;
            }
          }
        } else {
          // No wireframes mapped
          pdf.setFontSize(12);
          pdf.text('No wireframes mapped to this flow', 20, yPosition);
          yPosition += 15;
        }
      }

      pdf.save(`flow-wireframe-mapping-complete-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const currentStep = allData.flows.length > 0 ? 
    (allData.wireframes.length > 0 ? 'wireframes' : 'diagram') : 'input';
  const completedSteps = [
    ...(allData.flows.length > 0 ? ['input', 'plan', 'diagram'] : []),
    ...(allData.wireframes.length > 0 ? ['wireframes'] : []),
  ];

  return (
    <div className="container mx-auto p-4 space-y-4">
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
              {allData.wireframes.length} Wireframes
            </Badge>
          </div>
          <Button 
            onClick={exportToPDF} 
            disabled={isExporting || allData.flows.length === 0}
            size="sm"
            className="h-8 px-3"
          >
            <FileText className="h-3 w-3 mr-1.5" />
            {isExporting ? 'Generating...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <WorkflowProgress 
        currentStep={currentStep as any} 
        completedSteps={completedSteps} 
      />

      {allData.flows.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-gray-500">No process flows found. Create flows first to see mappings.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {allData.flows.map((flow) => (
            <Card key={flow.id} className="border-l-4 border-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{flow.title}</CardTitle>
                  <Badge variant="outline">
                    {getMappedWireframes(flow.id).length} wireframe(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Flow Diagram</h4>
                    <FlowDiagramViewer
                      flowData={flow.flowData}
                      title={flow.title}
                      className="h-64 border rounded"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Associated Wireframes</h4>
                    {getMappedWireframes(flow.id).map((wireframe) => (
                      <div key={wireframe.id} className="border rounded p-3 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{wireframe.pageName}</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openWireframePreview(wireframe)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadWireframe(wireframe)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <iframe
                          srcDoc={wireframe.htmlContent}
                          className="w-full h-32 border rounded"
                          title={wireframe.pageName}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{allData.flows.length}</div>
              <div className="text-xs text-blue-700">Flows</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{allData.wireframes.length}</div>
              <div className="text-xs text-green-700">Wireframes</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">{allData.projects.length}</div>
              <div className="text-xs text-purple-700">Projects</div>
            </div>
            <div>
              <div className="text-xl font-bold text-indigo-600">{allData.userStories.length}</div>
              <div className="text-xs text-indigo-700">User Stories</div>
            </div>
            <div>
              <div className="text-xl font-bold text-teal-600">{allData.brandGuidelines.length}</div>
              <div className="text-xs text-teal-700">Brand Guidelines</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">{mappings.length}</div>
              <div className="text-xs text-orange-700">Mappings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
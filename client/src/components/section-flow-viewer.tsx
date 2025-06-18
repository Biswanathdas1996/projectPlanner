import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlowDiagramViewer } from './flow-diagram-viewer';
import { createAIFlowDiagramGenerator, FlowDiagramData } from '@/lib/ai-flow-diagram-generator';
import { Loader2, Navigation, Eye, EyeOff, Sparkles } from 'lucide-react';

interface SectionFlowViewerProps {
  sectionTitle: string;
  sectionContent: string;
  sectionId: string;
  className?: string;
}

export function SectionFlowViewer({ 
  sectionTitle, 
  sectionContent, 
  sectionId, 
  className = "" 
}: SectionFlowViewerProps) {
  const [flowDiagram, setFlowDiagram] = useState<FlowDiagramData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string>("");

  // Load saved flow diagram from localStorage
  useEffect(() => {
    const savedDiagrams = localStorage.getItem('sectionFlowDiagrams');
    if (savedDiagrams) {
      try {
        const diagrams = JSON.parse(savedDiagrams);
        if (diagrams[sectionId]) {
          setFlowDiagram(diagrams[sectionId]);
        }
      } catch (error) {
        console.error('Error loading saved section flow diagrams:', error);
      }
    }
  }, [sectionId]);

  const generateSectionFlowDiagram = async () => {
    setIsGenerating(true);
    setError("");

    try {
      // Parse section content to extract flow details
      const flowDetails = parseSectionContent(sectionContent, sectionTitle);
      
      const flowDiagramGenerator = createAIFlowDiagramGenerator();
      const diagramData = await flowDiagramGenerator.generateFlowDiagram(
        flowDetails,
        "System",
        sectionTitle
      );

      setFlowDiagram(diagramData);
      
      // Save to localStorage
      const savedDiagrams = localStorage.getItem('sectionFlowDiagrams');
      const diagrams = savedDiagrams ? JSON.parse(savedDiagrams) : {};
      diagrams[sectionId] = diagramData;
      localStorage.setItem('sectionFlowDiagrams', JSON.stringify(diagrams));
      
      setIsVisible(true);
    } catch (error) {
      console.error('Error generating section flow diagram:', error);
      setError('Failed to generate flow diagram. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const parseSectionContent = (content: string, title: string) => {
    // Extract key information from section content
    const lines = content.split('\n').filter(line => line.trim());
    
    // Extract activities/steps from bullet points or numbered lists
    const activities = lines
      .filter(line => line.match(/^\s*[-*•]\s+|^\s*\d+\.\s+/))
      .map(line => line.replace(/^\s*[-*•]\s+|^\s*\d+\.\s+/, '').trim())
      .slice(0, 8); // Limit to 8 activities

    // Extract participants from content
    const participants = extractParticipants(content);
    
    // Generate trigger based on section title
    const trigger = `${title} process initiated`;
    
    // Extract decision points
    const decisionPoints = lines
      .filter(line => 
        line.toLowerCase().includes('if ') || 
        line.toLowerCase().includes('when ') ||
        line.toLowerCase().includes('decide') ||
        line.toLowerCase().includes('choose')
      )
      .slice(0, 3);

    return {
      processDescription: `${title} workflow process`,
      participants: participants.length > 0 ? participants : ['User', 'System', 'Administrator'],
      trigger,
      activities: activities.length > 0 ? activities : [`Execute ${title}`, 'Process data', 'Generate output'],
      decisionPoints: decisionPoints.length > 0 ? decisionPoints : [`Validate ${title} requirements`],
      endEvent: `${title} process completed successfully`,
      additionalElements: [`Notification: ${title} completion alert`, `Data: ${title} process record`]
    };
  };

  const extractParticipants = (content: string): string[] => {
    const commonParticipants = [
      'user', 'admin', 'administrator', 'system', 'client', 'customer', 
      'manager', 'developer', 'analyst', 'reviewer', 'approver'
    ];
    
    const foundParticipants = commonParticipants.filter(participant =>
      content.toLowerCase().includes(participant)
    );
    
    return foundParticipants.length > 0 ? foundParticipants : ['User', 'System'];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Flow Diagram Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={generateSectionFlowDiagram}
            disabled={isGenerating}
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            Generate Flow
          </Button>
          
          {flowDiagram && (
            <Button
              onClick={() => setIsVisible(!isVisible)}
              variant="outline"
              size="sm"
            >
              {isVisible ? (
                <EyeOff className="h-3 w-3 mr-1" />
              ) : (
                <Eye className="h-3 w-3 mr-1" />
              )}
              {isVisible ? 'Hide' : 'Show'} Diagram
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Flow Diagram Display */}
      {isVisible && flowDiagram && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Navigation className="h-5 w-5 mr-2 text-emerald-600" />
              {sectionTitle} Flow Diagram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FlowDiagramViewer
              flowData={flowDiagram}
              title={`${sectionTitle} Process Flow`}
              className="bg-white rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Placeholder when no diagram */}
      {!flowDiagram && !isGenerating && (
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
          <Navigation className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Click "Generate Flow" to create an interactive diagram for this section</p>
        </div>
      )}
    </div>
  );
}
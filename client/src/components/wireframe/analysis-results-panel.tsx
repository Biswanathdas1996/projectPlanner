import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Lightbulb, 
  Users, 
  Target, 
  Briefcase, 
  CheckCircle, 
  ArrowRight,
  Loader2,
  RefreshCw
} from "lucide-react";
import { WireframeAnalysisResult } from "@/lib/wireframe-analysis-agent";
import { DetailedPageContent } from "@/lib/html-wireframe-generator";

interface AnalysisResultsPanelProps {
  analysisResult: WireframeAnalysisResult | null;
  detailedWireframes: DetailedPageContent[];
  isGeneratingContent: boolean;
  isGeneratingWireframes: boolean;
  contentGenerationProgress: { current: number; total: number; currentPage: string };
  wireframeGenerationProgress: { current: number; total: number; currentPage: string };
  onGenerateDetailedContent: () => void;
  onGenerateWireframes: () => void;
  onRefreshContent: () => void;
}

// Helper function to safely render content
const safeRenderContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (typeof content === 'number' || typeof content === 'boolean') return String(content);
  if (content === null || content === undefined) return '';
  if (Array.isArray(content)) return content.map(item => safeRenderContent(item)).join(', ');
  if (typeof content === 'object') {
    try {
      return Object.entries(content).map(([key, value]) => `${key}: ${safeRenderContent(value)}`).join(', ');
    } catch {
      return JSON.stringify(content);
    }
  }
  return String(content);
};

export function AnalysisResultsPanel({
  analysisResult,
  detailedWireframes,
  isGeneratingContent,
  isGeneratingWireframes,
  contentGenerationProgress,
  wireframeGenerationProgress,
  onGenerateDetailedContent,
  onGenerateWireframes,
  onRefreshContent
}: AnalysisResultsPanelProps) {
  if (!analysisResult) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Project Analysis Results
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshContent}
            disabled={isGeneratingContent}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="stakeholders">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Project Summary
                </h4>
                <p className="text-sm text-gray-600">{analysisResult.projectSummary}</p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  Target Users
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analysisResult.targetUsers?.map((user, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {safeRenderContent(user)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {analysisResult.keyInsights && analysisResult.keyInsights.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Key Insights</h4>
                <div className="space-y-2">
                  {analysisResult.keyInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{safeRenderContent(insight)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">
                Recommended Pages ({analysisResult.pageRequirements?.length || 0})
              </h4>
              <div className="flex gap-2">
                <Button
                  onClick={onGenerateDetailedContent}
                  disabled={isGeneratingContent}
                  size="sm"
                  variant="outline"
                >
                  {isGeneratingContent ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Content...
                    </div>
                  ) : (
                    "Generate Detailed Content"
                  )}
                </Button>
                <Button
                  onClick={onGenerateWireframes}
                  disabled={isGeneratingWireframes || detailedWireframes.length === 0}
                  size="sm"
                >
                  {isGeneratingWireframes ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Wireframes...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Generate Wireframes
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {isGeneratingContent && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="font-medium text-blue-800">Generating Content</span>
                </div>
                <div className="text-sm text-blue-700">
                  {contentGenerationProgress.currentPage && (
                    <div>Current: {contentGenerationProgress.currentPage}</div>
                  )}
                  <div>Progress: {contentGenerationProgress.current} / {contentGenerationProgress.total}</div>
                </div>
              </div>
            )}

            {isGeneratingWireframes && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                  <span className="font-medium text-green-800">Generating Wireframes</span>
                </div>
                <div className="text-sm text-green-700">
                  {wireframeGenerationProgress.currentPage && (
                    <div>Current: {wireframeGenerationProgress.currentPage}</div>
                  )}
                  <div>Progress: {wireframeGenerationProgress.current} / {wireframeGenerationProgress.total}</div>
                </div>
              </div>
            )}

            <Accordion type="single" collapsible className="w-full">
              {analysisResult.pageRequirements?.map((page, index) => (
                <AccordionItem key={index} value={`page-${index}`}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <span>{safeRenderContent(page.pageName || page.name)}</span>
                      <Badge variant="outline" className="text-xs">
                        {safeRenderContent(page.pageType || 'Page')}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm">
                      <p className="text-gray-600">
                        {safeRenderContent(page.purpose || page.description)}
                      </p>
                      
                      {page.keyElements && (
                        <div>
                          <span className="font-medium text-gray-800">Key Elements:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(page.keyElements) ? page.keyElements.map((element, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {safeRenderContent(element)}
                              </Badge>
                            )) : (
                              <Badge variant="secondary" className="text-xs">
                                {safeRenderContent(page.keyElements)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {page.userActions && (
                        <div>
                          <span className="font-medium text-gray-800">User Actions:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(page.userActions) ? page.userActions.map((action, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {safeRenderContent(action)}
                              </Badge>
                            )) : (
                              <Badge variant="outline" className="text-xs">
                                {safeRenderContent(page.userActions)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <h4 className="font-medium text-gray-800">Required Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.requiredFeatures?.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{safeRenderContent(feature)}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stakeholders" className="space-y-4">
            <h4 className="font-medium text-gray-800">Stakeholder Analysis</h4>
            <div className="space-y-3">
              {analysisResult.stakeholderNeeds?.map((stakeholder, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-800">
                      {safeRenderContent(stakeholder.role || stakeholder.name)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {safeRenderContent(stakeholder.needs || stakeholder.description)}
                  </p>
                  {stakeholder.goals && (
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(stakeholder.goals) ? stakeholder.goals.map((goal, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {safeRenderContent(goal)}
                        </Badge>
                      )) : (
                        <Badge variant="outline" className="text-xs">
                          {safeRenderContent(stakeholder.goals)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
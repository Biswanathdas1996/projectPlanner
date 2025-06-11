import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Zap, CheckCircle, Clock, Award, Target } from "lucide-react";

interface BpmnGenerationGuideProps {
  visible: boolean;
  onClose: () => void;
}

export function BpmnGenerationGuide({ visible, onClose }: BpmnGenerationGuideProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">BPMN 2.0 Generation Methods</CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm">✕</Button>
          </div>
          <p className="text-sm text-gray-600">
            Choose the best approach for generating professional BPMN diagrams from your 7-element workflow data
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comparison">Method Comparison</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                
                {/* AI BPMN */}
                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <CardTitle className="text-sm">AI BPMN</CardTitle>
                    </div>
                    <Badge className="w-fit bg-blue-100 text-blue-700 border-blue-200">
                      Intelligent Generation
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-1">How it works:</h4>
                      <p className="text-xs text-gray-600">
                        Uses Gemini AI to understand your 7-element structure and generate contextually aware BPMN diagrams with intelligent swimlane layouts
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Strengths:</h4>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        <li>• Complex decision logic interpretation</li>
                        <li>• Contextual swimlane organization</li>
                        <li>• Natural language understanding</li>
                        <li>• Advanced gateway positioning</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-orange-700 mb-1">Considerations:</h4>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        <li>• Requires AI API connection</li>
                        <li>• Generation time varies</li>
                        <li>• Output may need validation</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Direct BPMN */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-gray-600" />
                      <CardTitle className="text-sm">Direct BPMN</CardTitle>
                    </div>
                    <Badge className="w-fit bg-gray-100 text-gray-700 border-gray-200">
                      Template-Based
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-1">How it works:</h4>
                      <p className="text-xs text-gray-600">
                        Converts your structured data directly to BPMN 2.0 XML using predefined templates and logical flow patterns
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Strengths:</h4>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        <li>• Instant generation (no API calls)</li>
                        <li>• Consistent, reliable output</li>
                        <li>• Predictable structure</li>
                        <li>• No external dependencies</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-orange-700 mb-1">Considerations:</h4>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        <li>• Limited to template patterns</li>
                        <li>• Less contextual intelligence</li>
                        <li>• Standard layout only</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Best Practice BPMN */}
                <Card className="border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <CardTitle className="text-sm">Best Practice</CardTitle>
                    </div>
                    <Badge className="w-fit bg-green-100 text-green-700 border-green-200">
                      Hybrid Validation
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-1">How it works:</h4>
                      <p className="text-xs text-gray-600">
                        Attempts AI generation first, validates output quality, and falls back to proven templates if needed
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Strengths:</h4>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        <li>• Best of both approaches</li>
                        <li>• Built-in quality validation</li>
                        <li>• Automatic fallback protection</li>
                        <li>• Production-ready output</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Recommended for:</h4>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        <li>• Business process documentation</li>
                        <li>• Professional presentations</li>
                        <li>• Compliance requirements</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-4">
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-600" />
                      <CardTitle className="text-sm text-green-800">Recommended: Best Practice Method</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-700 mb-3">
                      For most business workflows, the Best Practice method provides optimal results by combining AI intelligence with reliability validation.
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-semibold text-green-800 mb-1">Perfect for:</h4>
                        <ul className="text-xs text-green-700 space-y-0.5">
                          <li>• Complex business processes</li>
                          <li>• Multi-stakeholder workflows</li>
                          <li>• Decision-heavy processes</li>
                          <li>• Professional documentation</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-green-800 mb-1">Ensures:</h4>
                        <ul className="text-xs text-green-700 space-y-0.5">
                          <li>• BPMN 2.0 compliance</li>
                          <li>• Proper element relationships</li>
                          <li>• Valid XML structure</li>
                          <li>• Professional visualization</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-3 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <CardTitle className="text-sm">Quick Prototyping</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600 mb-2">
                        For rapid prototyping and testing workflow concepts:
                      </p>
                      <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                        Use Direct BPMN
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        <CardTitle className="text-sm">Creative Workflows</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600 mb-2">
                        For innovative processes requiring creative interpretation:
                      </p>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        Use AI BPMN
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="best-practices" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">7-Element Structure Quality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">High-Quality Input:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li>• Clear, specific process descriptions</li>
                          <li>• Well-defined participant roles</li>
                          <li>• Actionable activity statements</li>
                          <li>• Logical decision point conditions</li>
                          <li>• Measurable end events</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">BPMN 2.0 Standards:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li>• Proper namespace declarations</li>
                          <li>• Unique element identifiers</li>
                          <li>• Valid sequence flow references</li>
                          <li>• Compliant visual positioning</li>
                          <li>• Executable process definitions</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Validation Checklist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs">All participants have defined swimlanes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs">Decision gateways include Yes/No paths</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs">Start and end events are clearly defined</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs">Activities follow logical sequence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs">XML validates against BPMN 2.0 schema</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Your Workflow Data</h3>
            <p className="text-xs text-blue-700">
              All three methods work with your 7-element structure: Process Description, Participants, Trigger, Activities, Decision Points, End Event, and Additional Elements. Choose the method that best fits your current needs and quality requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
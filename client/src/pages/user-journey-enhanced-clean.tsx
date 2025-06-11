import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Plus, 
  Edit3, 
  Save, 
  X, 
  Sparkles, 
  Zap, 
  CheckCircle, 
  Loader2,
  Download,
  Workflow
} from "lucide-react";
import { SimpleBpmnViewer } from "@/components/simple-bpmn-viewer";
import {
  generateCustomSuggestions,
  generateUserJourneyFlows,
  generatePersonaBpmnFlowWithType,
  generateBpmnXmlClient,
  generateSwimlaneXml
} from "@/lib/gemini";
import { generateStructuredBpmn } from "@/lib/structured-bpmn-generator";
import { createAIBpmnAgent, COMPLEXITY_PRESETS } from "@/lib/ai-bpmn-agent";
import { BPMN_GENERATION_STRATEGIES } from "@/lib/bpmn-best-practices";

interface StakeholderFlow {
  stakeholder: string;
  flowType: string;
  bpmnXml: string;
  customPrompt: string;
}

interface FlowDetails {
  description: string;
  processDescription: string;
  participants: string[];
  trigger: string;
  activities: string[];
  decisionPoints: string[];
  endEvent: string;
  additionalElements: string[];
}

export default function UserJourneyEnhanced() {
  const [projectDescription, setProjectDescription] = useState("");
  const [stakeholders, setStakeholders] = useState<string[]>([]);
  const [flowTypesByStakeholder, setFlowTypesByStakeholder] = useState<Record<string, string[]>>({});
  const [flowDetails, setFlowDetails] = useState<Record<string, FlowDetails>>({});
  const [stakeholderFlows, setStakeholderFlows] = useState<StakeholderFlow[]>([]);
  const [isGeneratingStakeholders, setIsGeneratingStakeholders] = useState(false);
  const [isGeneratingFlowDetails, setIsGeneratingFlowDetails] = useState<Record<string, boolean>>({});
  const [isGeneratingBpmn, setIsGeneratingBpmn] = useState<Record<string, boolean>>({});
  const [editingFlowDetails, setEditingFlowDetails] = useState<string | null>(null);
  const [editedFlowDetails, setEditedFlowDetails] = useState<FlowDetails | null>(null);

  const generateStakeholdersAndFlows = async () => {
    if (!projectDescription.trim()) return;

    setIsGeneratingStakeholders(true);
    try {
      const result = await generateUserJourneyFlows(projectDescription);
      
      if (result.stakeholders && Array.isArray(result.stakeholders)) {
        setStakeholders(result.stakeholders);
        setFlowTypesByStakeholder(result.flowTypesByStakeholder || {});
      }
    } catch (error) {
      console.error("Error generating stakeholders:", error);
    } finally {
      setIsGeneratingStakeholders(false);
    }
  };

  const generateFlowDetailsForStakeholder = async (stakeholder: string, flowType: string) => {
    const flowKey = `${stakeholder}-${flowType}`;
    
    setIsGeneratingFlowDetails(prev => ({ ...prev, [flowKey]: true }));
    
    try {
      const result = await generatePersonaBpmnFlowWithType(
        projectDescription,
        stakeholder,
        flowType
      );
      
      const flowDetails: FlowDetails = {
        description: result.flowContent || "",
        processDescription: result.processDescription || `${flowType} process for ${stakeholder}`,
        participants: result.participants || [stakeholder],
        trigger: result.trigger || "Process initiated",
        activities: result.activities || ["Complete task"],
        decisionPoints: result.decisionPoints || [],
        endEvent: result.endEvent || "Process completed",
        additionalElements: result.additionalElements || []
      };
      
      setFlowDetails(prev => ({ ...prev, [flowKey]: flowDetails }));
    } catch (error) {
      console.error("Error generating flow details:", error);
    } finally {
      setIsGeneratingFlowDetails(prev => ({ ...prev, [flowKey]: false }));
    }
  };

  const generateBpmnWithAI = async (stakeholder: string, flowType: string) => {
    const flowKey = `${stakeholder}-${flowType}`;
    const details = flowDetails[flowKey];
    
    if (!details) return;
    
    setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: true }));
    
    try {
      const bpmnXml = await generateBpmnXmlClient(
        details.description,
        stakeholder,
        flowType
      );
      
      const newFlow: StakeholderFlow = {
        stakeholder,
        flowType,
        bpmnXml,
        customPrompt: details.description
      };
      
      setStakeholderFlows(prev => {
        const filtered = prev.filter(f => !(f.stakeholder === stakeholder && f.flowType === flowType));
        return [...filtered, newFlow];
      });
    } catch (error) {
      console.error("Error generating BPMN:", error);
    } finally {
      setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: false }));
    }
  };

  const generateStructuredBpmn = async (stakeholder: string, flowType: string) => {
    const flowKey = `${stakeholder}-${flowType}`;
    const details = flowDetails[flowKey];
    
    if (!details) return;
    
    setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: true }));
    
    try {
      const bpmnXml = await generateSwimlaneXml(details);
      
      const newFlow: StakeholderFlow = {
        stakeholder,
        flowType,
        bpmnXml,
        customPrompt: details.description
      };
      
      setStakeholderFlows(prev => {
        const filtered = prev.filter(f => !(f.stakeholder === stakeholder && f.flowType === flowType));
        return [...filtered, newFlow];
      });
    } catch (error) {
      console.error("Error generating structured BPMN:", error);
    } finally {
      setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: false }));
    }
  };

  const generateBestPracticeBpmn = async (stakeholder: string, flowType: string) => {
    const flowKey = `${stakeholder}-${flowType}`;
    const details = flowDetails[flowKey];
    
    if (!details) return;
    
    setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: true }));
    
    try {
      const aiAgent = createAIBpmnAgent();
      const bpmnXml = await aiAgent.generateLargeBpmn(details, COMPLEXITY_PRESETS.standard);
      
      const newFlow: StakeholderFlow = {
        stakeholder,
        flowType,
        bpmnXml,
        customPrompt: details.description
      };
      
      setStakeholderFlows(prev => {
        const filtered = prev.filter(f => !(f.stakeholder === stakeholder && f.flowType === flowType));
        return [...filtered, newFlow];
      });
    } catch (error) {
      console.error("Error generating best practice BPMN:", error);
    } finally {
      setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: false }));
    }
  };

  const addNewFlow = (stakeholder: string) => {
    const newFlowType = `Custom Flow ${Date.now()}`;
    setFlowTypesByStakeholder(prev => ({
      ...prev,
      [stakeholder]: [...(prev[stakeholder] || []), newFlowType]
    }));
  };

  const startEditingFlowDetails = (flowKey: string) => {
    const details = flowDetails[flowKey];
    if (details) {
      setEditingFlowDetails(flowKey);
      setEditedFlowDetails({ ...details });
    }
  };

  const saveFlowDetailsEdit = () => {
    if (editingFlowDetails && editedFlowDetails) {
      setFlowDetails(prev => ({
        ...prev,
        [editingFlowDetails]: editedFlowDetails
      }));
      setEditingFlowDetails(null);
      setEditedFlowDetails(null);
    }
  };

  const cancelFlowDetailsEdit = () => {
    setEditingFlowDetails(null);
    setEditedFlowDetails(null);
  };

  const updateEditedField = (field: keyof FlowDetails, value: any) => {
    if (editedFlowDetails) {
      setEditedFlowDetails(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const addItemToField = (field: keyof FlowDetails, item: string) => {
    if (editedFlowDetails && Array.isArray(editedFlowDetails[field])) {
      updateEditedField(field, [...(editedFlowDetails[field] as string[]), item]);
    }
  };

  const updateItemInField = (field: keyof FlowDetails, index: number, value: string) => {
    if (editedFlowDetails && Array.isArray(editedFlowDetails[field])) {
      const updatedArray = [...(editedFlowDetails[field] as string[])];
      updatedArray[index] = value;
      updateEditedField(field, updatedArray);
    }
  };

  const removeItemFromField = (field: keyof FlowDetails, index: number) => {
    if (editedFlowDetails && Array.isArray(editedFlowDetails[field])) {
      const updatedArray = (editedFlowDetails[field] as string[]).filter((_, i) => i !== index);
      updateEditedField(field, updatedArray);
    }
  };

  const openInEditor = (stakeholder: string, flowType: string) => {
    const flow = stakeholderFlows.find(f => f.stakeholder === stakeholder && f.flowType === flowType);
    if (flow) {
      window.location.href = `/bpmn-editor?xml=${encodeURIComponent(flow.bpmnXml)}`;
    }
  };

  const colorVariants = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600", 
    "from-green-500 to-green-600",
    "from-orange-500 to-orange-600",
    "from-red-500 to-red-600",
    "from-teal-500 to-teal-600"
  ];

  const bgVariants = [
    "from-blue-50 to-blue-100",
    "from-purple-50 to-purple-100",
    "from-green-50 to-green-100", 
    "from-orange-50 to-orange-100",
    "from-red-50 to-red-100",
    "from-teal-50 to-teal-100"
  ];

  const borderVariants = [
    "border-blue-200",
    "border-purple-200",
    "border-green-200",
    "border-orange-200", 
    "border-red-200",
    "border-teal-200"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              Enhanced User Journey Flow Generator
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Generate comprehensive stakeholder flows and BPMN diagrams with AI-powered analysis
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder={`Describe your project... (e.g., "${getRandomSuggestion()}")`}
                  className="min-h-[100px] resize-none"
                />
              </div>
              <Button
                onClick={generateStakeholdersAndFlows}
                disabled={!projectDescription.trim() || isGeneratingStakeholders}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {isGeneratingStakeholders ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Project...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Stakeholder Flows
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stakeholder Analysis */}
        {stakeholders.length > 0 && (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  Stakeholder Flow Analysis ({stakeholders.length})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stakeholders.map((stakeholder, stakeholderIndex) => {
                  const flowTypes = flowTypesByStakeholder[stakeholder] || [];
                  const colorClass = colorVariants[stakeholderIndex % colorVariants.length];
                  const bgClass = bgVariants[stakeholderIndex % bgVariants.length];
                  const borderClass = borderVariants[stakeholderIndex % borderVariants.length];

                  return (
                    <div
                      key={stakeholder}
                      className={`border ${borderClass} rounded-xl p-4 bg-gradient-to-br ${bgClass} h-fit`}
                    >
                      {/* Stakeholder Header - Compact */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center shadow-sm`}
                          >
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">
                              {stakeholder}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {flowTypes.length} workflows
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => addNewFlow(stakeholder)}
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1 h-6 border-gray-300 hover:bg-white/80"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Flow Types - Compact Cards */}
                      <div className="space-y-3">
                        {flowTypes.map((flowType, flowIndex) => {
                          const flowKey = `${stakeholder}-${flowType}`;
                          const details = flowDetails[flowKey];
                          const existingFlow = stakeholderFlows.find(
                            (f) => f.stakeholder === stakeholder && f.flowType === flowType,
                          );

                          return (
                            <div
                              key={flowIndex}
                              className="bg-white/95 backdrop-blur-sm border border-white/80 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {/* Flow Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                                  <h4 className="text-sm font-semibold text-gray-800">
                                    {flowType}
                                  </h4>
                                  {details && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200">
                                      <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                      Ready
                                    </Badge>
                                  )}
                                </div>
                                {details && (
                                  <Button
                                    onClick={() => startEditingFlowDetails(flowKey)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-blue-50"
                                  >
                                    <Edit3 className="h-3 w-3 text-gray-500" />
                                  </Button>
                                )}
                              </div>

                              {/* Compact Summary */}
                              {details && (
                                <div className="space-y-2 mb-3">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="font-medium text-gray-600">Participants:</span>
                                      <span className="text-gray-800 ml-1">{details.participants?.length || 0}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-600">Activities:</span>
                                      <span className="text-gray-800 ml-1">{details.activities?.length || 0}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600 line-clamp-2">
                                    {details.processDescription || details.trigger}
                                  </div>
                                </div>
                              )}

                              {/* Generate Details Button */}
                              {!details && (
                                <div className="mb-3">
                                  <Button
                                    onClick={() => generateFlowDetailsForStakeholder(stakeholder, flowType)}
                                    disabled={isGeneratingFlowDetails[flowKey]}
                                    size="sm"
                                    className="w-full text-xs py-1 h-6 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
                                  >
                                    {isGeneratingFlowDetails[flowKey] ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Generating Details...
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-3 w-3 mr-1" />
                                        Generate Flow Details
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}

                              {/* Editing Interface */}
                              {editingFlowDetails === flowKey && editedFlowDetails && (
                                <div className="space-y-2 p-2 bg-blue-50/50 rounded border border-blue-200 mb-3">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-medium text-blue-800">
                                      Edit Details
                                    </h5>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        onClick={saveFlowDetailsEdit}
                                        size="sm"
                                        className="h-5 px-1.5 bg-green-500 hover:bg-green-600 text-white text-xs"
                                      >
                                        <Save className="h-2.5 w-2.5 mr-0.5" />
                                        Save
                                      </Button>
                                      <Button
                                        onClick={cancelFlowDetailsEdit}
                                        variant="outline"
                                        size="sm"
                                        className="h-5 px-1.5 border-gray-300 text-xs"
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Compact Edit Fields */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-xs font-medium text-gray-600 mb-0.5 block">
                                        Description
                                      </label>
                                      <Textarea
                                        value={editedFlowDetails.processDescription}
                                        onChange={(e) => updateEditedField("processDescription", e.target.value)}
                                        className="text-xs h-16 resize-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-600 mb-0.5 block">
                                        Trigger
                                      </label>
                                      <Textarea
                                        value={editedFlowDetails.trigger}
                                        onChange={(e) => updateEditedField("trigger", e.target.value)}
                                        className="text-xs h-16 resize-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons - Compact Row */}
                              <div className="flex items-center gap-1 flex-wrap">
                                <Button
                                  onClick={() => generateBpmnWithAI(stakeholder, flowType)}
                                  disabled={isGeneratingBpmn[flowKey] || !details}
                                  size="sm"
                                  className={`text-xs px-2 py-1 h-6 bg-gradient-to-r ${colorClass} hover:opacity-90 text-white`}
                                >
                                  {isGeneratingBpmn[flowKey] ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <Sparkles className="h-3 w-3 mr-1" />
                                  )}
                                  AI
                                </Button>
                                <Button
                                  onClick={() => generateStructuredBpmn(stakeholder, flowType)}
                                  disabled={isGeneratingBpmn[flowKey] || !details}
                                  size="sm"
                                  className="text-xs px-2 py-1 h-6 bg-gray-600 hover:bg-gray-700 text-white"
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  Structured
                                </Button>
                                <Button
                                  onClick={() => generateBestPracticeBpmn(stakeholder, flowType)}
                                  disabled={isGeneratingBpmn[flowKey] || !details}
                                  size="sm"
                                  className="text-xs px-2 py-1 h-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Best Practice
                                </Button>
                                {existingFlow?.bpmnXml && (
                                  <Button
                                    onClick={() => openInEditor(stakeholder, flowType)}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs px-2 py-1 h-6 border-purple-300 hover:bg-purple-50 text-purple-600"
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              </div>

                              {/* Expanded Details Toggle */}
                              {details && editingFlowDetails !== flowKey && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <Button
                                    onClick={() => startEditingFlowDetails(flowKey)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 w-full justify-start p-1"
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    View & Edit Details
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced BPMN Viewer */}
        {stakeholderFlows.length > 0 && (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Workflow className="h-4 w-4 text-white" />
                  </div>
                  Generated BPMN Diagrams ({stakeholderFlows.length})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {stakeholderFlows.map((flow, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800">
                            {flow.stakeholder} - {flow.flowType}
                          </h4>
                          <p className="text-xs text-gray-600">BPMN 2.0 Process Diagram</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => openInEditor(flow.stakeholder, flow.flowType)}
                            variant="outline"
                            size="sm"
                            className="text-xs px-2 py-1 h-6"
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => {
                              const blob = new Blob([flow.bpmnXml], { type: 'application/xml' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${flow.stakeholder}-${flow.flowType}.bpmn`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs px-2 py-1 h-6"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <SimpleBpmnViewer
                        bpmnXml={flow.bpmnXml}
                        height="300px"
                        title={`${flow.stakeholder} ${flow.flowType}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function getRandomSuggestion(): string {
  const suggestions = [
    "E-commerce Platform with Order Management",
    "Customer Support Ticketing System", 
    "Employee Onboarding Workflow",
    "Project Management Dashboard",
    "Invoice Processing System",
    "Social Media Content Management",
    "Real Estate Property Management",
    "Healthcare Patient Management",
    "Restaurant Order & Delivery System",
    "Learning Management System"
  ];
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  generateUserJourneyFlows,
  extractStakeholdersFromProject,
  generatePersonaBpmnFlowWithType,
  generateCustomSuggestions,
  generateFlowAnalysis,
} from "@/lib/gemini";
import { STORAGE_KEYS } from "@/lib/bpmn-utils";
import { generateStructuredBpmn } from "@/lib/structured-bpmn-generator";
import { BPMN_GENERATION_STRATEGIES, RECOMMENDED_STRATEGY } from "@/lib/bpmn-best-practices";
import { SimpleBpmnViewer } from "@/components/simple-bpmn-viewer";
import { NavigationBar } from "@/components/navigation-bar";
import { WorkflowProgress } from "@/components/workflow-progress";
import { Link } from "wouter";
import {
  Users,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  Copy,
  Eye,
  EyeOff,
  Navigation,
  Workflow,
  User,
  Settings,
  Shield,
  Activity,
  Plus,
  BookOpen,
  Edit3,
  X,
  Save,
  UserPlus,
  Sparkles,
  Zap,
  FileText,
  UserCheck,
  Play,
  GitBranch,
  StopCircle,
  Cog,
} from "lucide-react";

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
  const [projectPlan, setProjectPlan] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [userJourneyFlows, setUserJourneyFlows] = useState<string>("");
  const [stakeholderFlows, setStakeholderFlows] = useState<StakeholderFlow[]>(
    [],
  );
  const [isGeneratingFlows, setIsGeneratingFlows] = useState(false);
  const [isGeneratingBpmn, setIsGeneratingBpmn] = useState<
    Record<string, boolean>
  >({});
  const [isExtractingStakeholders, setIsExtractingStakeholders] =
    useState(false);
  const [error, setError] = useState("");
  const [showFlowDetails, setShowFlowDetails] = useState(false);
  const [autoGenerationStatus, setAutoGenerationStatus] = useState<string>("");
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);
  const [extractedStakeholders, setExtractedStakeholders] = useState<string[]>(
    [],
  );
  const [personaFlowTypes, setPersonaFlowTypes] = useState<
    Record<string, string[]>
  >({});

  // Stakeholder management state
  const [newStakeholderName, setNewStakeholderName] = useState("");
  const [editingStakeholder, setEditingStakeholder] = useState<string | null>(
    null,
  );
  const [editedStakeholderName, setEditedStakeholderName] = useState("");

  // Flow type management state
  const [newFlowType, setNewFlowType] = useState<Record<string, string>>({});
  const [editingFlowType, setEditingFlowType] = useState<string | null>(null);
  const [editedFlowTypeName, setEditedFlowTypeName] = useState("");

  // Flow details generation state
  const [isGeneratingFlowDetails, setIsGeneratingFlowDetails] = useState(false);
  const [flowDetails, setFlowDetails] = useState<Record<string, FlowDetails>>(
    {},
  );
  const [flowGenerationProgress, setFlowGenerationProgress] = useState<{
    current: number;
    total: number;
    currentFlow: string;
    completedFlows: string[];
    status: string;
  }>({
    current: 0,
    total: 0,
    currentFlow: '',
    completedFlows: [],
    status: ''
  });

  // Flow editing state
  const [editingFlow, setEditingFlow] = useState<string | null>(null);
  const [editedFlowDetails, setEditedFlowDetails] =
    useState<FlowDetails | null>(null);

  // Load data from localStorage when component mounts
  useEffect(() => {
    const savedProjectDescription = localStorage.getItem(
      STORAGE_KEYS.PROJECT_DESCRIPTION,
    );
    const savedProjectPlan = localStorage.getItem(STORAGE_KEYS.PROJECT_PLAN);
    const savedUserJourneyFlows = localStorage.getItem(
      STORAGE_KEYS.USER_JOURNEY_FLOWS,
    );
    const savedStakeholders = localStorage.getItem(
      STORAGE_KEYS.EXTRACTED_STAKEHOLDERS,
    );
    const savedFlowTypes = localStorage.getItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
    );
    const savedStakeholderFlows = localStorage.getItem(
      STORAGE_KEYS.STAKEHOLDER_FLOWS,
    );

    if (savedProjectDescription) {
      setProjectDescription(savedProjectDescription);
    }
    if (savedProjectPlan) {
      setProjectPlan(savedProjectPlan);
    }
    if (savedUserJourneyFlows) {
      setUserJourneyFlows(savedUserJourneyFlows);
    }
    if (savedStakeholders) {
      try {
        setExtractedStakeholders(JSON.parse(savedStakeholders));
      } catch (error) {
        console.error("Error parsing saved stakeholders:", error);
      }
    }
    if (savedFlowTypes) {
      try {
        setPersonaFlowTypes(JSON.parse(savedFlowTypes));
      } catch (error) {
        console.error("Error parsing saved flow types:", error);
      }
    }
    if (savedStakeholderFlows) {
      try {
        setStakeholderFlows(JSON.parse(savedStakeholderFlows));
      } catch (error) {
        console.error("Error parsing saved stakeholder flows:", error);
      }
    }

    // Load saved flow details
    const savedFlowDetails = localStorage.getItem("flowDetails");
    if (savedFlowDetails) {
      try {
        setFlowDetails(JSON.parse(savedFlowDetails));
      } catch (error) {
        console.error("Error parsing saved flow details:", error);
      }
    }

    setIsLoadingFromStorage(false);

    // Auto-extract stakeholders if we have a project plan
    const planContent = savedProjectPlan || savedProjectDescription;
    if (planContent && !savedStakeholders) {
      setAutoGenerationStatus("Extracting stakeholders from project plan...");
      extractProjectStakeholders().finally(() => {
        setAutoGenerationStatus("");
      });
    }
  }, []);

  // Save stakeholder flows to localStorage
  const saveStakeholderFlowsToStorage = (flows: StakeholderFlow[]) => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.STAKEHOLDER_FLOWS,
        JSON.stringify(flows),
      );
    } catch (error) {
      console.error("Error saving stakeholder flows to localStorage:", error);
    }
  };

  // Update stakeholder flows and save to localStorage
  const updateStakeholderFlows = (newFlows: StakeholderFlow[]) => {
    setStakeholderFlows(newFlows);
    saveStakeholderFlowsToStorage(newFlows);
  };

  // Extract stakeholders from project plan
  const extractProjectStakeholders = async () => {
    const planContent = projectPlan || projectDescription;
    if (!planContent.trim()) {
      setError(
        "No project plan available. Please generate a project plan first.",
      );
      return;
    }

    setIsExtractingStakeholders(true);
    setError("");

    try {
      const stakeholders = await extractStakeholdersFromProject(planContent);
      if (stakeholders && stakeholders.length > 0) {
        setExtractedStakeholders(stakeholders);
        localStorage.setItem(
          STORAGE_KEYS.EXTRACTED_STAKEHOLDERS,
          JSON.stringify(stakeholders),
        );

        // Initialize persona flow types for each stakeholder
        const initialFlowTypes: Record<string, string[]> = {};
        stakeholders.forEach((stakeholder) => {
          initialFlowTypes[stakeholder] = ["Core Process"];
        });
        setPersonaFlowTypes(initialFlowTypes);
        localStorage.setItem(
          STORAGE_KEYS.PERSONA_FLOW_TYPES,
          JSON.stringify(initialFlowTypes),
        );
      } else {
        setError("No stakeholders found in the project plan.");
      }
    } catch (error) {
      console.error("Error extracting stakeholders:", error);
      setError("Failed to extract stakeholders from project plan.");
    } finally {
      setIsExtractingStakeholders(false);
    }
  };

  // Generate comprehensive flow details for all stakeholder flows
  const generateAllFlowDetails = async () => {
    if (Object.keys(personaFlowTypes).length === 0) {
      setError("No stakeholders available. Please extract stakeholders first.");
      return;
    }

    setIsGeneratingFlowDetails(true);
    setError("");

    // Calculate total flows
    let totalFlows = 0;
    Object.values(personaFlowTypes).forEach(flowTypes => {
      totalFlows += flowTypes.length;
    });

    setFlowGenerationProgress({
      current: 0,
      total: totalFlows,
      currentFlow: '',
      completedFlows: [],
      status: 'Initializing flow detail generation...'
    });

    const newFlowDetails: Record<string, FlowDetails> = { ...flowDetails };
    let currentFlowIndex = 0;

    try {
      for (const [stakeholder, flowTypes] of Object.entries(personaFlowTypes)) {
        for (const flowType of flowTypes) {
          const flowKey = `${stakeholder}-${flowType}`;
          currentFlowIndex++;

          setFlowGenerationProgress(prev => ({
            ...prev,
            current: currentFlowIndex,
            currentFlow: `${stakeholder} - ${flowType}`,
            status: `Analyzing ${stakeholder} ${flowType} workflow...`
          }));

          // Generate comprehensive flow analysis
          const analysisPrompt = `
**Project Context:** ${projectDescription || projectPlan || 'Software Development Project'}

**Stakeholder:** ${stakeholder}
**Flow Type:** ${flowType}

Generate a comprehensive workflow analysis for this stakeholder flow. Provide detailed information about:

1. **Process Description** (2-3 sentences describing the overall process)
2. **Participants** (all roles/systems involved)
3. **Trigger** (what initiates this process)
4. **Activities** (5-8 main activities in sequence)
5. **Decision Points** (2-4 key decisions or gateways)
6. **End Event** (how the process concludes)
7. **Additional Elements** (any special considerations, exceptions, or sub-processes)

Focus on creating realistic, actionable workflow components that could be implemented in a real system.

Please structure your response as follows:
PROCESS_DESCRIPTION: [description]
PARTICIPANTS: [participant1, participant2, participant3]
TRIGGER: [trigger description]
ACTIVITIES: [activity1, activity2, activity3, activity4, activity5]
DECISION_POINTS: [decision1, decision2, decision3]
END_EVENT: [end event description]
ADDITIONAL_ELEMENTS: [element1, element2, element3]
`;

          try {
            const response = await generateFlowAnalysis(analysisPrompt);
            
            // Parse the structured response
            const flowDetails: FlowDetails = {
              description: `${stakeholder} ${flowType} workflow process`,
              processDescription: extractField(response, 'PROCESS_DESCRIPTION') || `Comprehensive ${flowType} process for ${stakeholder}`,
              participants: parseListField(response, 'PARTICIPANTS') || [stakeholder, 'System', 'Administrator'],
              trigger: extractField(response, 'TRIGGER') || `${stakeholder} initiates ${flowType}`,
              activities: parseListField(response, 'ACTIVITIES') || [
                'Initialize process',
                'Validate requirements', 
                'Execute main task',
                'Review results',
                'Finalize process'
              ],
              decisionPoints: parseListField(response, 'DECISION_POINTS') || [
                'Validate input data',
                'Check authorization',
                'Confirm completion'
              ],
              endEvent: extractField(response, 'END_EVENT') || 'Process completed successfully',
              additionalElements: parseListField(response, 'ADDITIONAL_ELEMENTS') || [
                'Error handling',
                'Notification system',
                'Audit trail'
              ]
            };

            newFlowDetails[flowKey] = flowDetails;

            setFlowGenerationProgress(prev => ({
              ...prev,
              completedFlows: [...prev.completedFlows, flowKey],
              status: `Completed ${stakeholder} ${flowType} analysis`
            }));

          } catch (error) {
            console.error(`Error analyzing ${flowKey}:`, error);
            
            // Create fallback flow details
            const fallbackDetails: FlowDetails = {
              description: `${stakeholder} ${flowType} workflow process`,
              processDescription: `Standard ${flowType} process executed by ${stakeholder} to achieve specific business objectives through systematic workflow steps.`,
              participants: [stakeholder, 'System Administrator', 'Support Team'],
              trigger: `${stakeholder} needs to complete ${flowType} task`,
              activities: [
                'Access system',
                'Authenticate credentials',
                'Navigate to workflow',
                'Complete required steps',
                'Submit for processing',
                'Receive confirmation'
              ],
              decisionPoints: [
                'Validate user permissions',
                'Check data completeness',
                'Confirm final submission'
              ],
              endEvent: `${flowType} process completed successfully`,
              additionalElements: [
                'Error handling procedures',
                'Progress tracking',
                'Notification system'
              ]
            };

            newFlowDetails[flowKey] = fallbackDetails;
          }

          // Small delay to prevent API overload
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Save all flow details
      setFlowDetails(newFlowDetails);
      localStorage.setItem(STORAGE_KEYS.FLOW_DETAILS, JSON.stringify(newFlowDetails));

      setFlowGenerationProgress(prev => ({
        ...prev,
        status: `Generated details for ${totalFlows} flows successfully!`
      }));

      // Clear progress after delay
      setTimeout(() => {
        setFlowGenerationProgress({
          current: 0,
          total: 0,
          currentFlow: '',
          completedFlows: [],
          status: ''
        });
      }, 3000);

    } catch (error) {
      console.error('Error generating flow details:', error);
      setError('Failed to generate flow details. Please try again.');
    } finally {
      setIsGeneratingFlowDetails(false);
    }
  };

  // Helper functions for parsing structured responses
  const extractField = (text: string, fieldName: string): string => {
    const regex = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const parseListField = (text: string, fieldName: string): string[] => {
    const content = extractField(text, fieldName);
    if (!content) return [];
    
    return content
      .split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 8); // Limit to reasonable number
  };

  // Add new stakeholder
  const addStakeholder = () => {
    if (!newStakeholderName.trim()) return;

    const updatedStakeholders = [...extractedStakeholders, newStakeholderName.trim()];
    setExtractedStakeholders(updatedStakeholders);
    localStorage.setItem(
      STORAGE_KEYS.EXTRACTED_STAKEHOLDERS,
      JSON.stringify(updatedStakeholders),
    );

    // Add default flow type for new stakeholder
    const updatedFlowTypes = {
      ...personaFlowTypes,
      [newStakeholderName.trim()]: ["Core Process"],
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
      JSON.stringify(updatedFlowTypes),
    );

    setNewStakeholderName("");
  };

  // Edit stakeholder name
  const editStakeholder = (oldName: string) => {
    setEditingStakeholder(oldName);
    setEditedStakeholderName(oldName);
  };

  const saveStakeholderEdit = () => {
    if (!editingStakeholder || !editedStakeholderName.trim()) return;

    // Update stakeholders list
    const updatedStakeholders = extractedStakeholders.map((s) =>
      s === editingStakeholder ? editedStakeholderName.trim() : s,
    );
    setExtractedStakeholders(updatedStakeholders);
    localStorage.setItem(
      STORAGE_KEYS.EXTRACTED_STAKEHOLDERS,
      JSON.stringify(updatedStakeholders),
    );

    // Update flow types
    const updatedFlowTypes = { ...personaFlowTypes };
    if (editingStakeholder in updatedFlowTypes) {
      updatedFlowTypes[editedStakeholderName.trim()] =
        updatedFlowTypes[editingStakeholder];
      delete updatedFlowTypes[editingStakeholder];
    }
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
      JSON.stringify(updatedFlowTypes),
    );

    // Update stakeholder flows
    const updatedStakeholderFlows = stakeholderFlows.map((flow) =>
      flow.stakeholder === editingStakeholder
        ? { ...flow, stakeholder: editedStakeholderName.trim() }
        : flow,
    );
    updateStakeholderFlows(updatedStakeholderFlows);

    setEditingStakeholder(null);
    setEditedStakeholderName("");
  };

  // Delete stakeholder
  const deleteStakeholder = (stakeholder: string) => {
    const updatedStakeholders = extractedStakeholders.filter(
      (s) => s !== stakeholder,
    );
    setExtractedStakeholders(updatedStakeholders);
    localStorage.setItem(
      STORAGE_KEYS.EXTRACTED_STAKEHOLDERS,
      JSON.stringify(updatedStakeholders),
    );

    // Remove from flow types
    const updatedFlowTypes = { ...personaFlowTypes };
    delete updatedFlowTypes[stakeholder];
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
      JSON.stringify(updatedFlowTypes),
    );

    // Remove stakeholder flows
    const updatedStakeholderFlows = stakeholderFlows.filter(
      (flow) => flow.stakeholder !== stakeholder,
    );
    updateStakeholderFlows(updatedStakeholderFlows);
  };

  // Add new flow type for stakeholder
  const addFlowType = (stakeholder: string) => {
    const flowType = newFlowType[stakeholder]?.trim();
    if (!flowType) return;

    const updatedFlowTypes = {
      ...personaFlowTypes,
      [stakeholder]: [...(personaFlowTypes[stakeholder] || []), flowType],
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
      JSON.stringify(updatedFlowTypes),
    );

    setNewFlowType({ ...newFlowType, [stakeholder]: "" });
  };

  // Edit flow type
  const editFlowType = (stakeholder: string, flowType: string) => {
    setEditingFlowType(`${stakeholder}-${flowType}`);
    setEditedFlowTypeName(flowType);
  };

  const saveFlowTypeEdit = (stakeholder: string, oldFlowType: string) => {
    if (!editedFlowTypeName.trim()) return;

    const updatedFlowTypes = {
      ...personaFlowTypes,
      [stakeholder]: personaFlowTypes[stakeholder].map((ft) =>
        ft === oldFlowType ? editedFlowTypeName.trim() : ft,
      ),
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
      JSON.stringify(updatedFlowTypes),
    );

    // Update stakeholder flows
    const updatedStakeholderFlows = stakeholderFlows.map((flow) =>
      flow.stakeholder === stakeholder && flow.flowType === oldFlowType
        ? { ...flow, flowType: editedFlowTypeName.trim() }
        : flow,
    );
    updateStakeholderFlows(updatedStakeholderFlows);

    setEditingFlowType(null);
    setEditedFlowTypeName("");
  };

  // Delete flow type
  const deleteFlowType = (stakeholder: string, flowType: string) => {
    const updatedFlowTypes = {
      ...personaFlowTypes,
      [stakeholder]: personaFlowTypes[stakeholder].filter(
        (ft) => ft !== flowType,
      ),
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
      JSON.stringify(updatedFlowTypes),
    );

    // Remove related stakeholder flows
    const updatedStakeholderFlows = stakeholderFlows.filter(
      (flow) => !(flow.stakeholder === stakeholder && flow.flowType === flowType),
    );
    updateStakeholderFlows(updatedStakeholderFlows);
  };

  if (isLoadingFromStorage) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading user journey data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar title="Stakeholder Journey Builder" />
      <div className="max-w-[1400px] mx-auto p-6">
        <WorkflowProgress />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-lg p-4 shadow-sm">
          <div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Enhanced User Journey & BPMN Flows
              </h1>
              <p className="text-gray-600 mt-1">
                Stakeholder-based BPMN workflow generation with multiple flows
                per persona
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/user-stories">
              <Button className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white">
                <FileText className="h-4 w-4 mr-2" />
                Generate User Stories
              </Button>
            </Link>
          </div>
        </div>

        {/* Auto-generation Status */}
        {autoGenerationStatus && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <p className="text-blue-800">{autoGenerationStatus}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Context */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Project Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter your project description..."
                  className="min-h-[100px]"
                />
              </div>
              {projectPlan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated Project Plan
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {projectPlan.substring(0, 500)}
                      {projectPlan.length > 500 && "..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stakeholder Management */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                Stakeholders & Flow Types
              </div>
              <Button
                onClick={extractProjectStakeholders}
                disabled={isExtractingStakeholders}
                variant="outline"
                size="sm"
              >
                {isExtractingStakeholders ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isExtractingStakeholders ? "Extracting..." : "Extract from Plan"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {extractedStakeholders.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No Stakeholders Found
                </h3>
                <p className="text-gray-500 mb-4">
                  Add stakeholders manually or extract them from your project plan
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {extractedStakeholders.map((stakeholder, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {editingStakeholder === stakeholder ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={editedStakeholderName}
                              onChange={(e) =>
                                setEditedStakeholderName(e.target.value)
                              }
                              className="w-48"
                            />
                            <Button
                              onClick={saveStakeholderEdit}
                              size="sm"
                              variant="outline"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => setEditingStakeholder(null)}
                              size="sm"
                              variant="outline"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <User className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-semibold text-gray-800">
                              {stakeholder}
                            </h3>
                            <Button
                              onClick={() => editStakeholder(stakeholder)}
                              size="sm"
                              variant="ghost"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                      <Button
                        onClick={() => deleteStakeholder(stakeholder)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Flow Types for this stakeholder */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Flow Types:
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(personaFlowTypes[stakeholder] || []).map(
                          (flowType, flowIndex) => (
                            <div
                              key={flowIndex}
                              className="flex items-center space-x-1"
                            >
                              {editingFlowType === `${stakeholder}-${flowType}` ? (
                                <div className="flex items-center space-x-1">
                                  <Input
                                    value={editedFlowTypeName}
                                    onChange={(e) =>
                                      setEditedFlowTypeName(e.target.value)
                                    }
                                    className="w-32 h-8"
                                  />
                                  <Button
                                    onClick={() =>
                                      saveFlowTypeEdit(stakeholder, flowType)
                                    }
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => setEditingFlowType(null)}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="flex items-center space-x-1"
                                >
                                  <span>{flowType}</span>
                                  <Button
                                    onClick={() =>
                                      editFlowType(stakeholder, flowType)
                                    }
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0 ml-1"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      deleteFlowType(stakeholder, flowType)
                                    }
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0 text-red-500"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              )}
                            </div>
                          ),
                        )}
                      </div>

                      {/* Add new flow type */}
                      <div className="flex items-center space-x-2">
                        <Input
                          value={newFlowType[stakeholder] || ""}
                          onChange={(e) =>
                            setNewFlowType({
                              ...newFlowType,
                              [stakeholder]: e.target.value,
                            })
                          }
                          placeholder="Add flow type..."
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") addFlowType(stakeholder);
                          }}
                        />
                        <Button
                          onClick={() => addFlowType(stakeholder)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new stakeholder */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Input
                  value={newStakeholderName}
                  onChange={(e) => setNewStakeholderName(e.target.value)}
                  placeholder="Add new stakeholder..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") addStakeholder();
                  }}
                />
                <Button onClick={addStakeholder} variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Stakeholder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow Details Generation */}
        {Object.keys(personaFlowTypes).length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div>
                  <Activity className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Generate Flow Details
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Create comprehensive workflow analysis for all stakeholder flows.
                    This will generate detailed process information needed for BPMN creation and user story generation.
                  </p>
                </div>

                {/* Generation Progress */}
                {isGeneratingFlowDetails && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-700">
                          {flowGenerationProgress.status}
                        </span>
                        <span className="text-purple-600">
                          {flowGenerationProgress.current} / {flowGenerationProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              (flowGenerationProgress.current / Math.max(flowGenerationProgress.total, 1)) * 100
                            }%`,
                          }}
                        />
                      </div>
                      {flowGenerationProgress.currentFlow && (
                        <p className="text-sm text-purple-600">
                          Current: {flowGenerationProgress.currentFlow}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={generateAllFlowDetails}
                  disabled={isGeneratingFlowDetails}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-2"
                >
                  {isGeneratingFlowDetails ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  {isGeneratingFlowDetails ? "Generating..." : "Generate Flow Details"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show Generated Flow Details */}
        {Object.values(flowDetails).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Flow Details Generated
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setShowFlowDetails(!showFlowDetails)}
                    variant="outline"
                    size="sm"
                  >
                    {showFlowDetails ? (
                      <EyeOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {showFlowDetails ? "Hide" : "Show"} Flow Details
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showFlowDetails && (
                <div className="space-y-4">
                  {Object.entries(flowDetails).map(([flowKey, details]) => {
                    const [stakeholder, flowType] = flowKey.split('-');
                    return (
                      <div key={flowKey} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-800">
                            {stakeholder} - {flowType}
                          </h4>
                          <Badge variant="outline">{details.participants.length} participants</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Process Description:</p>
                            <p className="text-gray-600 mb-3">{details.processDescription}</p>
                            
                            <p className="font-medium text-gray-700 mb-1">Trigger:</p>
                            <p className="text-gray-600 mb-3">{details.trigger}</p>
                            
                            <p className="font-medium text-gray-700 mb-1">End Event:</p>
                            <p className="text-gray-600">{details.endEvent}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Participants:</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {details.participants.map((participant, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {participant}
                                </Badge>
                              ))}
                            </div>
                            
                            <p className="font-medium text-gray-700 mb-1">Activities:</p>
                            <ul className="text-gray-600 text-xs space-y-1 mb-3">
                              {details.activities.slice(0, 4).map((activity, idx) => (
                                <li key={idx}>• {activity}</li>
                              ))}
                              {details.activities.length > 4 && (
                                <li className="text-gray-500">... and {details.activities.length - 4} more</li>
                              )}
                            </ul>
                            
                            <p className="font-medium text-gray-700 mb-1">Decision Points:</p>
                            <ul className="text-gray-600 text-xs space-y-1">
                              {details.decisionPoints.map((decision, idx) => (
                                <li key={idx}>• {decision}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
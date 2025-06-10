import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { generateUserJourneyFlows, extractStakeholdersFromProject, generatePersonaBpmnFlowWithType } from '@/lib/gemini';
import { STORAGE_KEYS } from '@/lib/bpmn-utils';
import { InlineBpmnViewer } from '@/components/inline-bpmn-viewer';
import { NavigationBar } from '@/components/navigation-bar';
import { WorkflowProgress } from '@/components/workflow-progress';
import { Link } from 'wouter';
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
  Trash2,
  BookOpen
} from 'lucide-react';

interface StakeholderFlow {
  stakeholder: string;
  flowType: string;
  bpmnXml: string;
  customPrompt: string;
}

export default function UserJourneyEnhanced() {
  const [projectPlan, setProjectPlan] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [userJourneyFlows, setUserJourneyFlows] = useState<string>('');
  const [stakeholderFlows, setStakeholderFlows] = useState<StakeholderFlow[]>([]);
  const [isGeneratingFlows, setIsGeneratingFlows] = useState(false);
  const [isGeneratingBpmn, setIsGeneratingBpmn] = useState<Record<string, boolean>>({});
  const [isExtractingStakeholders, setIsExtractingStakeholders] = useState(false);
  const [error, setError] = useState('');
  const [showFlowDetails, setShowFlowDetails] = useState(false);
  const [autoGenerationStatus, setAutoGenerationStatus] = useState<string>('');
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);
  const [extractedStakeholders, setExtractedStakeholders] = useState<string[]>([]);
  const [personaFlowTypes, setPersonaFlowTypes] = useState<Record<string, string[]>>({});

  // Load data from localStorage when component mounts
  useEffect(() => {
    const savedProjectDescription = localStorage.getItem(STORAGE_KEYS.PROJECT_DESCRIPTION);
    const savedProjectPlan = localStorage.getItem(STORAGE_KEYS.PROJECT_PLAN);
    const savedUserJourneyFlows = localStorage.getItem(STORAGE_KEYS.USER_JOURNEY_FLOWS);
    const savedStakeholders = localStorage.getItem(STORAGE_KEYS.EXTRACTED_STAKEHOLDERS);
    const savedFlowTypes = localStorage.getItem(STORAGE_KEYS.PERSONA_FLOW_TYPES);
    const savedStakeholderFlows = localStorage.getItem(STORAGE_KEYS.STAKEHOLDER_FLOWS);

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
        console.error('Error parsing saved stakeholders:', error);
      }
    }
    if (savedFlowTypes) {
      try {
        setPersonaFlowTypes(JSON.parse(savedFlowTypes));
      } catch (error) {
        console.error('Error parsing saved flow types:', error);
      }
    }
    if (savedStakeholderFlows) {
      try {
        setStakeholderFlows(JSON.parse(savedStakeholderFlows));
      } catch (error) {
        console.error('Error parsing saved stakeholder flows:', error);
      }
    }

    setIsLoadingFromStorage(false);

    // Auto-extract stakeholders if we have a project plan
    const planContent = savedProjectPlan || savedProjectDescription;
    if (planContent && !savedStakeholders) {
      setAutoGenerationStatus('Extracting stakeholders from project plan...');
      extractProjectStakeholders().finally(() => {
        setAutoGenerationStatus('');
      });
    }
  }, []);

  // Save stakeholder flows to localStorage
  const saveStakeholderFlowsToStorage = (flows: StakeholderFlow[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.STAKEHOLDER_FLOWS, JSON.stringify(flows));
    } catch (error) {
      console.error('Error saving stakeholder flows to localStorage:', error);
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
      setError('No project plan available. Please generate a project plan first.');
      return;
    }

    setIsExtractingStakeholders(true);
    setError('');

    try {
      const { stakeholders, flowTypes } = await extractStakeholdersFromProject(planContent);
      setExtractedStakeholders(stakeholders);
      setPersonaFlowTypes(flowTypes);
      
      // Initialize stakeholder flows based on extracted data
      const initialFlows: StakeholderFlow[] = [];
      stakeholders.forEach(stakeholder => {
        flowTypes[stakeholder]?.forEach(flowType => {
          initialFlows.push({
            stakeholder,
            flowType,
            bpmnXml: '',
            customPrompt: ''
          });
        });
      });
      updateStakeholderFlows(initialFlows);
      
      localStorage.setItem(STORAGE_KEYS.EXTRACTED_STAKEHOLDERS, JSON.stringify(stakeholders));
      localStorage.setItem(STORAGE_KEYS.PERSONA_FLOW_TYPES, JSON.stringify(flowTypes));
    } catch (error) {
      console.error('Error extracting stakeholders:', error);
      setError('Failed to extract stakeholders from project plan. Please try again.');
    } finally {
      setIsExtractingStakeholders(false);
    }
  };

  // Generate user journey flows overview
  const generateFlows = async () => {
    const planContent = projectPlan || projectDescription;
    if (!planContent.trim()) {
      setError('No project plan available. Please generate a project plan first.');
      return;
    }

    setIsGeneratingFlows(true);
    setError('');

    try {
      const flows = await generateUserJourneyFlows(planContent);
      setUserJourneyFlows(flows);
      localStorage.setItem(STORAGE_KEYS.USER_JOURNEY_FLOWS, flows);
    } catch (error) {
      console.error('Error generating user journey flows:', error);
      setError('Failed to generate user journey flows. Please try again.');
    } finally {
      setIsGeneratingFlows(false);
    }
  };

  // Generate BPMN for a specific stakeholder flow
  const generateStakeholderBpmn = async (stakeholder: string, flowType: string, customPrompt?: string) => {
    const planContent = projectPlan || projectDescription;
    if (!planContent.trim()) {
      setError('No project plan available. Please generate a project plan first.');
      return;
    }

    const flowKey = `${stakeholder}-${flowType}`;
    setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: true }));
    setError('');

    try {
      const bpmn = await generatePersonaBpmnFlowWithType(planContent, stakeholder, flowType, customPrompt);
      
      const updatedFlows = stakeholderFlows.map(flow => 
        flow.stakeholder === stakeholder && flow.flowType === flowType
          ? { ...flow, bpmnXml: bpmn }
          : flow
      );
      updateStakeholderFlows(updatedFlows);
      
      // Save the latest generated BPMN to localStorage for editor
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmn);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmn);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error(`Error generating ${stakeholder} ${flowType} BPMN:`, error);
      setError(`Failed to generate ${stakeholder} ${flowType} BPMN diagram. Please try again.`);
    } finally {
      setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: false }));
    }
  };

  // Generate all BPMN diagrams
  const generateAllBpmn = async () => {
    for (const flow of stakeholderFlows) {
      await generateStakeholderBpmn(flow.stakeholder, flow.flowType, flow.customPrompt);
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  // Add a new flow type for a stakeholder
  const addNewFlow = (stakeholder: string) => {
    const newFlowType = `Custom Flow ${Date.now()}`;
    const updatedFlows = [
      ...stakeholderFlows,
      {
        stakeholder,
        flowType: newFlowType,
        bpmnXml: '',
        customPrompt: ''
      }
    ];
    updateStakeholderFlows(updatedFlows);
  };

  // Remove a flow
  const removeFlow = (stakeholder: string, flowType: string) => {
    const updatedFlows = stakeholderFlows.filter(flow => 
      !(flow.stakeholder === stakeholder && flow.flowType === flowType)
    );
    updateStakeholderFlows(updatedFlows);
  };

  // Update custom prompt for a flow
  const updateCustomPrompt = (stakeholder: string, flowType: string, prompt: string) => {
    const updatedFlows = stakeholderFlows.map(flow => 
      flow.stakeholder === stakeholder && flow.flowType === flowType
        ? { ...flow, customPrompt: prompt }
        : flow
    );
    updateStakeholderFlows(updatedFlows);
  };

  // Download user journeys
  const downloadUserJourneys = () => {
    if (!userJourneyFlows) {
      setError('No user journey flows available to download');
      return;
    }

    const blob = new Blob([userJourneyFlows], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const projectName = projectDescription.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    
    link.href = url;
    link.download = `user-journey-flows-${projectName}-${timestamp}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export all stakeholder data with BPMN XML
  const exportAllData = () => {
    const exportData = {
      extractedStakeholders,
      personaFlowTypes,
      stakeholderFlows,
      userJourneyFlows,
      projectDescription,
      projectPlan,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `stakeholder-bpmn-data-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy XML to clipboard
  const copyXmlToClipboard = (xml: string) => {
    navigator.clipboard.writeText(xml).then(() => {
      // Show success feedback
    }).catch(err => {
      console.error('Failed to copy XML:', err);
    });
  };

  // Navigate to editor with specific diagram
  const openInEditor = (bpmnXml: string) => {
    if (bpmnXml) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    }
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
      <div className="max-w-7xl mx-auto p-6">
        <WorkflowProgress />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-lg p-4 shadow-sm">
          <div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enhanced User Journey & BPMN Flows</h1>
              <p className="text-gray-600 mt-1">Stakeholder-based BPMN workflow generation with multiple flows per persona</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/user-stories">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                <BookOpen className="h-4 w-4 mr-2" />
                User Stories
              </Button>
            </Link>
            <Link href="/bpmn-editor">
              <Button variant="outline">
                <Navigation className="h-4 w-4 mr-2" />
                BPMN Editor
              </Button>
            </Link>
          </div>
        </div>

        {/* Auto-generation Status */}
        {autoGenerationStatus && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-blue-800 font-medium">{autoGenerationStatus}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Plan Summary */}
        {(projectPlan || projectDescription) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Workflow className="h-5 w-5 mr-2" />
                Project Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {projectPlan || projectDescription}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stakeholder Extraction Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Stakeholder Analysis
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={exportAllData}
                  disabled={stakeholderFlows.length === 0}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button 
                  onClick={extractProjectStakeholders}
                  disabled={isExtractingStakeholders || !projectPlan && !projectDescription}
                  size="sm"
                >
                  {isExtractingStakeholders ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  Extract Stakeholders
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {extractedStakeholders.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Identified Stakeholders</h4>
                  <div className="flex flex-wrap gap-2">
                    {extractedStakeholders.map((stakeholder, index) => (
                      <Badge key={index} variant="secondary">
                        {stakeholder}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Flow Types per Stakeholder</h4>
                  {Object.entries(personaFlowTypes).map(([stakeholder, flowTypes]) => (
                    <div key={stakeholder} className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm text-gray-700 mb-1">{stakeholder}</div>
                      <div className="flex flex-wrap gap-1">
                        {flowTypes.map((flowType, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {flowType}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Extract stakeholders from your project plan to see persona-based workflow analysis
              </p>
            )}
          </CardContent>
        </Card>

        {/* User Journey Flows Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Workflow className="h-5 w-5 mr-2" />
                User Journey Flows Overview
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={generateFlows}
                  disabled={isGeneratingFlows || !projectPlan && !projectDescription}
                  size="sm"
                >
                  {isGeneratingFlows ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Workflow className="h-4 w-4 mr-2" />
                  )}
                  Generate Overview
                </Button>
                {userJourneyFlows && (
                  <Button onClick={downloadUserJourneys} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userJourneyFlows ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFlowDetails(!showFlowDetails)}
                  >
                    {showFlowDetails ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Details
                      </>
                    )}
                  </Button>
                </div>
                {showFlowDetails && (
                  <div 
                    className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: userJourneyFlows }}
                  />
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Generate user journey flows overview to see comprehensive workflow analysis
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stakeholder-Based BPMN Diagrams */}
        {stakeholderFlows.length > 0 && (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  Stakeholder-Based BPMN Diagrams
                </div>
                <Button 
                  onClick={generateAllBpmn}
                  disabled={Object.values(isGeneratingBpmn).some(Boolean)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                >
                  {Object.values(isGeneratingBpmn).some(Boolean) ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Activity className="h-3 w-3 mr-1" />
                  )}
                  Generate All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {extractedStakeholders.map((stakeholder, stakeholderIndex) => {
                  const colorVariants = [
                    'from-blue-500 to-cyan-600',
                    'from-emerald-500 to-teal-600', 
                    'from-orange-500 to-red-600',
                    'from-purple-500 to-pink-600',
                    'from-indigo-500 to-blue-600',
                    'from-green-500 to-emerald-600'
                  ];
                  const bgVariants = [
                    'from-blue-50 to-cyan-50',
                    'from-emerald-50 to-teal-50',
                    'from-orange-50 to-red-50', 
                    'from-purple-50 to-pink-50',
                    'from-indigo-50 to-blue-50',
                    'from-green-50 to-emerald-50'
                  ];
                  const borderVariants = [
                    'border-blue-200',
                    'border-emerald-200',
                    'border-orange-200',
                    'border-purple-200', 
                    'border-indigo-200',
                    'border-green-200'
                  ];
                  
                  const colorClass = colorVariants[stakeholderIndex % colorVariants.length];
                  const bgClass = bgVariants[stakeholderIndex % bgVariants.length];
                  const borderClass = borderVariants[stakeholderIndex % borderVariants.length];
                  
                  return (
                    <div key={stakeholder} className={`border-2 ${borderClass} rounded-xl p-4 bg-gradient-to-br ${bgClass}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 bg-gradient-to-r ${colorClass} rounded-md flex items-center justify-center`}>
                            <User className="h-3 w-3 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-800">{stakeholder}</h3>
                        </div>
                        <Button
                          onClick={() => addNewFlow(stakeholder)}
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1 h-7 border-gray-300 hover:bg-white"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {stakeholderFlows
                          .filter(flow => flow.stakeholder === stakeholder)
                          .map((flow, index) => (
                            <div key={`${flow.stakeholder}-${flow.flowType}-${index}`} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-medium text-gray-700 truncate max-w-[150px]">{flow.flowType}</h4>
                                <div className="flex items-center gap-1">
                                  <Button
                                    onClick={() => generateStakeholderBpmn(flow.stakeholder, flow.flowType, flow.customPrompt)}
                                    disabled={isGeneratingBpmn[`${flow.stakeholder}-${flow.flowType}`]}
                                    size="sm"
                                    className={`text-xs px-2 py-1 h-6 bg-gradient-to-r ${colorClass} hover:opacity-90 text-white`}
                                  >
                                    {isGeneratingBpmn[`${flow.stakeholder}-${flow.flowType}`] ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      'Generate'
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => removeFlow(flow.stakeholder, flow.flowType)}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs px-1.5 py-1 h-6 border-gray-300 hover:bg-red-50 hover:border-red-300 text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            
                              <div className="mb-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Custom Requirements (Optional)
                                </label>
                                <Textarea
                                  value={flow.customPrompt}
                                  onChange={(e) => updateCustomPrompt(flow.stakeholder, flow.flowType, e.target.value)}
                                  placeholder="Describe specific requirements for this flow..."
                                  className="text-xs min-h-[60px] resize-none"
                                  rows={2}
                                />
                              </div>

                              {flow.bpmnXml && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Generated
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        onClick={() => copyXmlToClipboard(flow.bpmnXml)}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs px-2 py-1 h-6 border-gray-300"
                                      >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy
                                      </Button>
                                      <Link href="/bpmn-editor">
                                        <Button
                                          onClick={() => openInEditor(flow.bpmnXml)}
                                          size="sm"
                                          className="text-xs px-2 py-1 h-6 bg-gray-600 hover:bg-gray-700 text-white"
                                        >
                                          <Navigation className="h-3 w-3 mr-1" />
                                          Editor
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                  <InlineBpmnViewer
                                    bpmnXml={flow.bpmnXml}
                                    title={`${flow.stakeholder} - ${flow.flowType}`}
                                    height="280px"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  BookOpen,
  Edit3,
  X,
  Save,
  UserPlus
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
  
  // Stakeholder management state
  const [newStakeholderName, setNewStakeholderName] = useState('');
  const [editingStakeholder, setEditingStakeholder] = useState<string | null>(null);
  const [editedStakeholderName, setEditedStakeholderName] = useState('');
  
  // Flow type management state
  const [newFlowType, setNewFlowType] = useState<Record<string, string>>({});
  const [editingFlowType, setEditingFlowType] = useState<string | null>(null);
  const [editedFlowTypeName, setEditedFlowTypeName] = useState('');
  
  // Flow details generation state
  const [isGeneratingFlowDetails, setIsGeneratingFlowDetails] = useState(false);
  const [flowDetails, setFlowDetails] = useState<Record<string, { description: string; keyComponents: string[]; processes: string[] }>>({});

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

    // Load saved flow details
    const savedFlowDetails = localStorage.getItem('flowDetails');
    if (savedFlowDetails) {
      try {
        setFlowDetails(JSON.parse(savedFlowDetails));
      } catch (error) {
        console.error('Error parsing saved flow details:', error);
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

  // Stakeholder Management Functions
  const addStakeholder = () => {
    const trimmedName = newStakeholderName.trim();
    if (!trimmedName) {
      setError('Stakeholder name cannot be empty');
      return;
    }
    
    if (extractedStakeholders.includes(trimmedName)) {
      setError('Stakeholder already exists');
      return;
    }
    
    const updatedStakeholders = [...extractedStakeholders, trimmedName];
    setExtractedStakeholders(updatedStakeholders);
    localStorage.setItem(STORAGE_KEYS.EXTRACTED_STAKEHOLDERS, JSON.stringify(updatedStakeholders));
    
    // Add default flow types for new stakeholder
    const updatedFlowTypes = {
      ...personaFlowTypes,
      [trimmedName]: ['Registration Process', 'Main Workflow', 'Support Process']
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(STORAGE_KEYS.PERSONA_FLOW_TYPES, JSON.stringify(updatedFlowTypes));
    
    setNewStakeholderName('');
    setError('');
  };

  const startEditingStakeholder = (stakeholder: string) => {
    setEditingStakeholder(stakeholder);
    setEditedStakeholderName(stakeholder);
  };

  const saveStakeholderEdit = () => {
    const trimmedName = editedStakeholderName.trim();
    if (!trimmedName) {
      setError('Stakeholder name cannot be empty');
      return;
    }
    
    if (trimmedName !== editingStakeholder && extractedStakeholders.includes(trimmedName)) {
      setError('Stakeholder name already exists');
      return;
    }
    
    if (editingStakeholder) {
      // Update stakeholders list
      const updatedStakeholders = extractedStakeholders.map(s => 
        s === editingStakeholder ? trimmedName : s
      );
      setExtractedStakeholders(updatedStakeholders);
      localStorage.setItem(STORAGE_KEYS.EXTRACTED_STAKEHOLDERS, JSON.stringify(updatedStakeholders));
      
      // Update flow types
      const updatedFlowTypes = { ...personaFlowTypes };
      if (updatedFlowTypes[editingStakeholder]) {
        updatedFlowTypes[trimmedName] = updatedFlowTypes[editingStakeholder];
        if (trimmedName !== editingStakeholder) {
          delete updatedFlowTypes[editingStakeholder];
        }
      }
      setPersonaFlowTypes(updatedFlowTypes);
      localStorage.setItem(STORAGE_KEYS.PERSONA_FLOW_TYPES, JSON.stringify(updatedFlowTypes));
      
      // Update stakeholder flows
      const updatedFlows = stakeholderFlows.map(flow => 
        flow.stakeholder === editingStakeholder 
          ? { ...flow, stakeholder: trimmedName }
          : flow
      );
      updateStakeholderFlows(updatedFlows);
    }
    
    setEditingStakeholder(null);
    setEditedStakeholderName('');
    setError('');
  };

  const cancelStakeholderEdit = () => {
    setEditingStakeholder(null);
    setEditedStakeholderName('');
  };

  const deleteStakeholder = (stakeholder: string) => {
    // Remove from stakeholders list
    const updatedStakeholders = extractedStakeholders.filter(s => s !== stakeholder);
    setExtractedStakeholders(updatedStakeholders);
    localStorage.setItem(STORAGE_KEYS.EXTRACTED_STAKEHOLDERS, JSON.stringify(updatedStakeholders));
    
    // Remove from flow types
    const updatedFlowTypes = { ...personaFlowTypes };
    delete updatedFlowTypes[stakeholder];
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(STORAGE_KEYS.PERSONA_FLOW_TYPES, JSON.stringify(updatedFlowTypes));
    
    // Remove from stakeholder flows
    const updatedFlows = stakeholderFlows.filter(flow => flow.stakeholder !== stakeholder);
    updateStakeholderFlows(updatedFlows);
  };

  // Flow Type Management Functions
  const addFlowType = (stakeholder: string) => {
    const trimmedFlowType = newFlowType[stakeholder]?.trim();
    if (!trimmedFlowType) {
      setError('Flow type name cannot be empty');
      return;
    }
    
    const currentFlowTypes = personaFlowTypes[stakeholder] || [];
    if (currentFlowTypes.includes(trimmedFlowType)) {
      setError('Flow type already exists for this stakeholder');
      return;
    }
    
    const updatedFlowTypes = {
      ...personaFlowTypes,
      [stakeholder]: [...currentFlowTypes, trimmedFlowType]
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(STORAGE_KEYS.PERSONA_FLOW_TYPES, JSON.stringify(updatedFlowTypes));
    
    setNewFlowType(prev => ({ ...prev, [stakeholder]: '' }));
    setError('');
  };

  const startEditingFlowType = (stakeholder: string, flowType: string) => {
    const key = `${stakeholder}-${flowType}`;
    setEditingFlowType(key);
    setEditedFlowTypeName(flowType);
  };

  const saveFlowTypeEdit = (stakeholder: string, originalFlowType: string) => {
    const trimmedName = editedFlowTypeName.trim();
    if (!trimmedName) {
      setError('Flow type name cannot be empty');
      return;
    }
    
    const currentFlowTypes = personaFlowTypes[stakeholder] || [];
    if (trimmedName !== originalFlowType && currentFlowTypes.includes(trimmedName)) {
      setError('Flow type already exists for this stakeholder');
      return;
    }
    
    const updatedFlowTypes = {
      ...personaFlowTypes,
      [stakeholder]: currentFlowTypes.map(ft => ft === originalFlowType ? trimmedName : ft)
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(STORAGE_KEYS.PERSONA_FLOW_TYPES, JSON.stringify(updatedFlowTypes));
    
    // Update stakeholder flows with new flow type name
    const updatedFlows = stakeholderFlows.map(flow => 
      flow.stakeholder === stakeholder && flow.flowType === originalFlowType
        ? { ...flow, flowType: trimmedName }
        : flow
    );
    updateStakeholderFlows(updatedFlows);
    
    setEditingFlowType(null);
    setEditedFlowTypeName('');
    setError('');
  };

  const cancelFlowTypeEdit = () => {
    setEditingFlowType(null);
    setEditedFlowTypeName('');
  };

  const deleteFlowType = (stakeholder: string, flowType: string) => {
    const updatedFlowTypes = {
      ...personaFlowTypes,
      [stakeholder]: (personaFlowTypes[stakeholder] || []).filter(ft => ft !== flowType)
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(STORAGE_KEYS.PERSONA_FLOW_TYPES, JSON.stringify(updatedFlowTypes));
    
    // Remove from stakeholder flows
    const updatedFlows = stakeholderFlows.filter(
      flow => !(flow.stakeholder === stakeholder && flow.flowType === flowType)
    );
    updateStakeholderFlows(updatedFlows);
  };

  // Generate detailed flow analysis for all stakeholder flows
  const generateFlowDetails = async () => {
    if (!projectPlan && !projectDescription) {
      setError('Please provide a project description or plan first');
      return;
    }

    setIsGeneratingFlowDetails(true);
    setError('');

    try {
      const allFlows: { stakeholder: string; flowType: string }[] = [];
      
      // Collect all stakeholder-flow combinations
      Object.entries(personaFlowTypes).forEach(([stakeholder, flowTypes]) => {
        flowTypes.forEach(flowType => {
          allFlows.push({ stakeholder, flowType });
        });
      });

      const details: Record<string, { description: string; keyComponents: string[]; processes: string[] }> = {};

      // Generate details for each flow
      for (const flow of allFlows) {
        const key = `${flow.stakeholder}-${flow.flowType}`;
        
        try {
          const prompt = `Based on this project context:
${projectPlan || projectDescription}

Generate detailed analysis for the "${flow.flowType}" flow for stakeholder "${flow.stakeholder}":

1. Flow Description: A clear 2-3 sentence description of what this flow encompasses
2. Key Components: List 4-6 specific components, features, or elements involved in this flow  
3. Core Processes: List 3-5 main processes or steps that occur in this flow

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"description": "description here", "keyComponents": ["component1", "component2", "component3", "component4"], "processes": ["process1", "process2", "process3"]}`;

          const response = await fetch('/api/gemini/generate-project-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: prompt })
          });

          if (!response.ok) throw new Error('Failed to generate flow details');

          const result = await response.text();
          console.log(`Response for ${key}:`, result);
          
          // Clean and parse the response
          let cleanedResult = result.trim();
          
          // Remove markdown code blocks if present
          cleanedResult = cleanedResult.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          
          // Remove any extra text before or after JSON
          const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanedResult = jsonMatch[0];
          }
          
          try {
            const flowData = JSON.parse(cleanedResult);
            
            // Validate the structure
            if (flowData.description && flowData.keyComponents && flowData.processes) {
              details[key] = {
                description: flowData.description,
                keyComponents: Array.isArray(flowData.keyComponents) ? flowData.keyComponents : [],
                processes: Array.isArray(flowData.processes) ? flowData.processes : []
              };
            } else {
              throw new Error('Invalid response structure');
            }
          } catch (parseError) {
            console.error(`Failed to parse response for ${key}:`, parseError, 'Raw response:', result);
            
            // Generate contextual fallback based on flow type and stakeholder
            const flowTypeWords = flow.flowType.toLowerCase().split(' ');
            const stakeholderWords = flow.stakeholder.toLowerCase().split(' ');
            
            details[key] = {
              description: `This flow manages ${flow.flowType.toLowerCase()} activities for ${flow.stakeholder}. It encompasses the core processes and interactions required to successfully complete ${flowTypeWords[0]}-related tasks. The system ensures proper validation, processing, and completion of all ${flowTypeWords[0]} operations.`,
              keyComponents: [
                `${flow.flowType} Dashboard`,
                `${flowTypeWords[0] ? flowTypeWords[0].charAt(0).toUpperCase() + flowTypeWords[0].slice(1) : 'Process'} Engine`,
                'Authentication Module',
                'Data Validation Layer',
                'Notification System',
                'Audit & Logging'
              ],
              processes: [
                `Initiate ${flow.flowType}`,
                'Authenticate & Authorize',
                `Process ${flowTypeWords[0] || 'Request'}`,
                'Validate Results',
                'Complete & Notify'
              ]
            };
          }
        } catch (err) {
          console.error(`Failed to generate details for ${key}:`, err);
        }
      }

      setFlowDetails(details);
      localStorage.setItem('flowDetails', JSON.stringify(details));
      
    } catch (err) {
      console.error('Error generating flow details:', err);
      setError('Failed to generate flow details. Please try again.');
    } finally {
      setIsGeneratingFlowDetails(false);
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
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
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
          <CardContent className="pt-4">
            {extractedStakeholders.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 text-sm">Identified Stakeholders ({extractedStakeholders.length})</h4>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newStakeholderName}
                        onChange={(e) => setNewStakeholderName(e.target.value)}
                        placeholder="Add stakeholder..."
                        className="text-xs h-8 w-32"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addStakeholder();
                          }
                        }}
                      />
                      <Button
                        onClick={addStakeholder}
                        size="sm"
                        className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {extractedStakeholders.map((stakeholder, index) => (
                      <div key={index} className="relative group">
                        {editingStakeholder === stakeholder ? (
                          <div className="flex items-center gap-1 bg-white border border-blue-300 rounded-lg px-2 py-1">
                            <Input
                              value={editedStakeholderName}
                              onChange={(e) => setEditedStakeholderName(e.target.value)}
                              className="text-xs h-6 w-24 border-0 p-0 focus:ring-0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveStakeholderEdit();
                                } else if (e.key === 'Escape') {
                                  cancelStakeholderEdit();
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              onClick={saveStakeholderEdit}
                              size="sm"
                              className="h-5 w-5 p-0 bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={cancelStakeholderEdit}
                              size="sm"
                              variant="outline"
                              className="h-5 w-5 p-0 border-gray-300"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Badge 
                            variant="secondary" 
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 pr-1 cursor-pointer"
                          >
                            <Users className="h-3 w-3 mr-1" />
                            {stakeholder}
                            <div className="ml-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => startEditingStakeholder(stakeholder)}
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 hover:bg-blue-200"
                              >
                                <Edit3 className="h-2.5 w-2.5" />
                              </Button>
                              <Button
                                onClick={() => deleteStakeholder(stakeholder)}
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 hover:bg-red-200 text-red-600"
                              >
                                <X className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">Flow Types Management</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(personaFlowTypes).map(([stakeholder, flowTypes], stakeholderIndex) => {
                      const colorVariants = [
                        { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', accent: 'bg-blue-500', text: 'text-blue-800' },
                        { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', accent: 'bg-emerald-500', text: 'text-emerald-800' },
                        { bg: 'from-purple-50 to-pink-50', border: 'border-purple-200', accent: 'bg-purple-500', text: 'text-purple-800' },
                        { bg: 'from-orange-50 to-red-50', border: 'border-orange-200', accent: 'bg-orange-500', text: 'text-orange-800' },
                        { bg: 'from-cyan-50 to-blue-50', border: 'border-cyan-200', accent: 'bg-cyan-500', text: 'text-cyan-800' },
                        { bg: 'from-green-50 to-emerald-50', border: 'border-green-200', accent: 'bg-green-500', text: 'text-green-800' }
                      ];
                      const variant = colorVariants[stakeholderIndex % colorVariants.length];
                      
                      return (
                        <div key={stakeholder} className={`border ${variant.border} rounded-lg p-3 bg-gradient-to-br ${variant.bg} shadow-sm`}>
                          {/* Stakeholder Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 ${variant.accent} rounded-full`}></div>
                              <span className={`font-medium text-sm ${variant.text}`}>{stakeholder}</span>
                            </div>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-white/80">
                              {flowTypes.length}
                            </Badge>
                          </div>
                        
                          {/* Add Flow Type */}
                          <div className="flex items-center gap-1 mb-2">
                            <Input
                              value={newFlowType[stakeholder] || ''}
                              onChange={(e) => setNewFlowType(prev => ({ ...prev, [stakeholder]: e.target.value }))}
                              placeholder="Add flow type..."
                              className="text-xs h-6 flex-1 bg-white/80 border-white/50"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addFlowType(stakeholder);
                                }
                              }}
                            />
                            <Button
                              onClick={() => addFlowType(stakeholder)}
                              size="sm"
                              className="h-6 px-2 bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        
                          {/* Flow Types Grid */}
                          <div className="flex flex-wrap gap-1">
                            {flowTypes.map((flowType, index) => {
                              const editKey = `${stakeholder}-${flowType}`;
                              const isEditing = editingFlowType === editKey;
                              
                              return (
                                <div key={index} className="relative group">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1 bg-white border border-blue-300 rounded px-1.5 py-0.5">
                                      <Input
                                        value={editedFlowTypeName}
                                        onChange={(e) => setEditedFlowTypeName(e.target.value)}
                                        className="text-xs h-4 w-16 border-0 p-0 focus:ring-0"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            saveFlowTypeEdit(stakeholder, flowType);
                                          } else if (e.key === 'Escape') {
                                            cancelFlowTypeEdit();
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <Button
                                        onClick={() => saveFlowTypeEdit(stakeholder, flowType)}
                                        size="sm"
                                        className="h-3 w-3 p-0 bg-green-500 hover:bg-green-600"
                                      >
                                        <Save className="h-2 w-2" />
                                      </Button>
                                      <Button
                                        onClick={cancelFlowTypeEdit}
                                        size="sm"
                                        variant="outline"
                                        className="h-3 w-3 p-0 border-gray-300"
                                      >
                                        <X className="h-2 w-2" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs px-1.5 py-0.5 bg-white/90 border-white/60 cursor-pointer hover:bg-white pr-1 group"
                                    >
                                      <span>{flowType}</span>
                                      <div className="ml-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          onClick={() => startEditingFlowType(stakeholder, flowType)}
                                          size="sm"
                                          variant="ghost"
                                          className="h-3 w-3 p-0 hover:bg-blue-200"
                                        >
                                          <Edit3 className="h-2 w-2" />
                                        </Button>
                                        <Button
                                          onClick={() => deleteFlowType(stakeholder, flowType)}
                                          size="sm"
                                          variant="ghost"
                                          className="h-3 w-3 p-0 hover:bg-red-200 text-red-600"
                                        >
                                          <X className="h-2 w-2" />
                                        </Button>
                                      </div>
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">
                  Extract stakeholders from your project plan or add them manually
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    value={newStakeholderName}
                    onChange={(e) => setNewStakeholderName(e.target.value)}
                    placeholder="Enter stakeholder name..."
                    className="text-sm h-9 w-48"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addStakeholder();
                      }
                    }}
                  />
                  <Button
                    onClick={addStakeholder}
                    size="sm"
                    className="h-9 px-3 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Stakeholder
                  </Button>
                </div>
              </div>
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
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={userJourneyFlows}
                      className="w-full h-96 border-0"
                      title="User Journey Flows"
                      sandbox="allow-same-origin"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Generate user journey flows overview to see comprehensive workflow analysis
              </p>
            )}
          </CardContent>
        </Card>

        {/* Generate Flow Details Button */}
        {Object.keys(personaFlowTypes).length > 0 && Object.values(flowDetails).length === 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <div className="space-y-4">
                <div>
                  <Activity className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Generate Flow Analysis</h3>
                  <p className="text-gray-600 text-sm">
                    Generate detailed analysis for all stakeholder flows including descriptions, key components, and processes
                  </p>
                </div>
                <Button 
                  onClick={generateFlowDetails}
                  disabled={isGeneratingFlowDetails}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2"
                >
                  {isGeneratingFlowDetails ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  Generate Flow Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stakeholder Flow Analysis */}
        {Object.values(flowDetails).length > 0 && (
          <Card className="border-0 shadow-sm bg-white mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  Stakeholder Flow Analysis
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
                  Generate BPMN Diagrams
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(personaFlowTypes).map(([stakeholder, flowTypes], stakeholderIndex) => {
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
                    <div key={stakeholder} className={`border-2 ${borderClass} rounded-xl p-5 bg-gradient-to-br ${bgClass}`}>
                      {/* Stakeholder Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center`}>
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{stakeholder}</h3>
                            <p className="text-xs text-gray-600">{flowTypes.length} flow types</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => addNewFlow(stakeholder)}
                          variant="outline"
                          size="sm"
                          className="text-xs px-3 py-1 h-8 border-gray-300 hover:bg-white"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Flow
                        </Button>
                      </div>
                      
                      {/* Flow Types */}
                      <div className="space-y-4">
                        {flowTypes.map((flowType, flowIndex) => {
                          const flowKey = `${stakeholder}-${flowType}`;
                          const details = flowDetails[flowKey];
                          const existingFlow = stakeholderFlows.find(f => f.stakeholder === stakeholder && f.flowType === flowType);
                          
                          return (
                            <div key={flowIndex} className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-lg p-4 shadow-sm">
                              {/* Flow Header */}
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">{flowType}</h4>
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => generateStakeholderBpmn(stakeholder, flowType, existingFlow?.customPrompt || '')}
                                    disabled={isGeneratingBpmn[flowKey]}
                                    size="sm"
                                    className={`text-xs px-3 py-1 h-7 bg-gradient-to-r ${colorClass} hover:opacity-90 text-white`}
                                  >
                                    {isGeneratingBpmn[flowKey] ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      'Generate BPMN'
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => removeFlow(stakeholder, flowType)}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs px-2 py-1 h-7 border-gray-300 hover:bg-red-50 hover:border-red-300 text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Flow Details */}
                              {details && (
                                <div className="space-y-3 mb-3">
                                  {/* Description */}
                                  <div>
                                    <p className="text-xs text-gray-700 leading-relaxed">{details.description}</p>
                                  </div>

                                  {/* Key Components */}
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-600 mb-1">Key Components</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {details.keyComponents?.map((component, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                          {component}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Core Processes */}
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-600 mb-1">Core Processes</h5>
                                    <div className="space-y-1">
                                      {details.processes?.map((process, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                          <span className="text-xs text-gray-600">{process}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Custom Requirements */}
                              <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Custom Requirements (Optional)
                                </label>
                                <Textarea
                                  value={existingFlow?.customPrompt || ''}
                                  onChange={(e) => updateCustomPrompt(stakeholder, flowType, e.target.value)}
                                  placeholder="Describe specific requirements for this flow..."
                                  className="text-xs min-h-[60px] resize-none bg-white/80"
                                  rows={2}
                                />
                              </div>

                              {/* BPMN Diagram */}
                              {existingFlow?.bpmnXml && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      BPMN Generated
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        onClick={() => copyXmlToClipboard(existingFlow.bpmnXml)}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs px-2 py-1 h-6 border-gray-300"
                                      >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy
                                      </Button>
                                      <Link href="/bpmn-editor">
                                        <Button
                                          onClick={() => openInEditor(existingFlow.bpmnXml)}
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
                                    bpmnXml={existingFlow.bpmnXml}
                                    title={`${stakeholder} - ${flowType}`}
                                    height="280px"
                                  />
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

        {/* Navigation Button at Bottom */}
        <div className="mt-8 flex justify-center">
          <Link href="/user-stories">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg">
              <BookOpen className="h-5 w-5 mr-3" />
              Continue to User Stories
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
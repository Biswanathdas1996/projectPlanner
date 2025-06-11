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
  const [flowDetails, setFlowDetails] = useState<Record<string, FlowDetails>>({});
  
  // Flow details editing state
  const [editingFlowDetails, setEditingFlowDetails] = useState<string | null>(null);
  const [editedFlowDetails, setEditedFlowDetails] = useState<FlowDetails | null>(null);

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

      const details: Record<string, FlowDetails> = {};

      // Generate details for each flow
      for (const flow of allFlows) {
        const key = `${flow.stakeholder}-${flow.flowType}`;
        
        try {
          const prompt = `Generate comprehensive BPMN 2.0 flow analysis for ${flow.stakeholder} - ${flow.flowType} with fine granular details for perfect BPMN diagram generation:

PROJECT CONTEXT:
${projectPlan || projectDescription}

Create detailed BPMN-focused analysis with specific, actionable elements:

✅ 1. Process Name and Description
- Clear process name: "${flow.stakeholder} ${flow.flowType} Process"
- Business purpose and value proposition
- Process scope and boundaries
- Key objectives and success criteria
- Integration points with other processes

✅ 2. Participants (Swimlanes / Pools and Lanes)
Create detailed swimlane structure with specific roles:
- Primary Actor: ${flow.stakeholder} (main responsible party)
- Supporting Roles: specific job titles, departments, teams
- IT Systems: databases, APIs, applications, services (name each system)
- External Entities: customers, vendors, partners, regulatory bodies
- Service Providers: payment processors, notification services, cloud providers
Minimum 4-6 distinct participants for comprehensive swimlanes.

✅ 3. Trigger (Start Event)
Define precise, actionable trigger:
- Specific triggering action or event
- Pre-conditions that must be satisfied
- Input data or parameters required
- Event source (user interface, scheduled job, API call, message)
- Business context that necessitates this process

✅ 4. Sequence of Activities (Tasks / Actions)
Provide 6-8 detailed, sequential activities:
- Use clear action verbs (Submit, Validate, Process, Generate, Send, Update)
- Specify responsible participant for each task
- Define task type (User Task, Service Task, Script Task, Manual Task)
- Include input requirements and expected outputs
- Add realistic time estimates
- Specify any dependencies or prerequisites

✅ 5. Decision Points (Gateways)
Include 3-5 specific decision points with business rules:
- Gateway type (Exclusive OR, Inclusive OR, Parallel AND)
- Clear decision criteria with specific conditions
- Branching logic with detailed outcomes
- Error handling scenarios
- Escalation rules and timeouts
- Business rule specifications

✅ 6. End Event
Define comprehensive completion scenarios:
- Primary success end event with completion criteria
- Alternative end events for different outcomes
- Error end events for failure scenarios
- Data state at completion
- Notifications and confirmations required
- Process artifacts created or updated

✅ 7. Additional Elements
Include specific BPMN elements with implementation details:

**Messages:**
- "Email notification sent to ${flow.stakeholder} with [specific content]"
- "API request sent to [system name] with [data payload]"
- "SMS alert triggered for [specific condition]"

**Timers:**
- "Business timer: Wait [X hours/days] for [specific response]"
- "Escalation timer: If no action within [timeframe], then [escalation action]"
- "Scheduled timer: Execute at [specific time/interval]"

**Data Objects:**
- "[FormName] data object containing [specific fields]"
- "[DocumentType] generated with [content specifications]"
- "[RecordType] updated in [system name] database"

**Error Events:**
- "Handle [ErrorType] when [specific condition occurs]"
- "Catch timeout exception if [system] doesn't respond within [timeframe]"
- "Manage validation errors for [specific data requirements]"

**Sub-processes:**
- "Call [SubProcessName] for [specific functionality]"
- "Invoke [ExternalService] integration process"

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"description": "✅ 1. Process Name and Description\\n[detailed description]\\n\\n✅ 2. Participants (Swimlanes)\\n[detailed participants list]\\n\\n✅ 3. Trigger (Start Event)\\n[detailed trigger description]\\n\\n✅ 4. Sequence of Activities\\n[detailed activities list]\\n\\n✅ 5. Decision Points (Gateways)\\n[detailed decision points]\\n\\n✅ 6. End Event\\n[detailed end event description]\\n\\n✅ 7. Additional Elements\\n[detailed additional elements]", "participants": ["${flow.stakeholder}", "System Administrator", "Database System", "External API", "Notification Service", "Additional Role"], "activities": ["Activity 1: Detailed action description", "Activity 2: Detailed action description", "Activity 3: Detailed action description", "Activity 4: Detailed action description", "Activity 5: Detailed action description", "Activity 6: Detailed action description"], "trigger": "Detailed trigger description with specific conditions", "decisionPoints": ["Exclusive Gateway: If condition A, then path 1; otherwise path 2", "Parallel Gateway: Execute both task X and task Y simultaneously", "Inclusive Gateway: Based on criteria, execute one or more of the following paths"], "endEvent": "Detailed end event description with completion criteria", "additionalElements": ["Messages: Specific message details", "Timers: Specific timer configurations", "Data: Specific data object details", "Errors: Specific error handling"]}`;

          // Call Gemini API directly from client-side only
          console.log(`Starting flow analysis for ${key}...`);
          const { generateFlowAnalysis } = await import('../lib/gemini');
          
          const result = await generateFlowAnalysis(prompt);
          console.log(`Gemini response for ${key}:`, result);
          
          if (!result || result.trim().length === 0) {
            throw new Error(`Empty response from Gemini API for ${key}`);
          }
          
          // Clean and parse the response
          let cleanedResult = result.trim();
          
          // Remove markdown code blocks more aggressively
          cleanedResult = cleanedResult.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
          cleanedResult = cleanedResult.replace(/^json\s*\n?/gi, '');
          
          // Extract JSON from the response - find the outermost braces
          const startBrace = cleanedResult.indexOf('{');
          const endBrace = cleanedResult.lastIndexOf('}');
          
          if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
            cleanedResult = cleanedResult.substring(startBrace, endBrace + 1);
          }
          
          // Final cleanup - remove any remaining non-JSON text
          cleanedResult = cleanedResult.trim();
          
          try {
            console.log(`Attempting to parse JSON for ${key}:`, cleanedResult);
            const flowData = JSON.parse(cleanedResult);
            console.log(`Successfully parsed JSON for ${key}:`, flowData);
            
            // Enhanced structure parsing with direct field extraction
            const flowDetails: FlowDetails = {
              description: flowData.description || `Comprehensive ${flow.flowType} process analysis for ${flow.stakeholder}`,
              processDescription: flowData.processDescription || `${flow.stakeholder} ${flow.flowType} Process`,
              participants: Array.isArray(flowData.participants) ? flowData.participants : 
                [flow.stakeholder, "System Administrator", "Database System", "External API", "Notification Service"],
              trigger: flowData.trigger || `${flow.stakeholder} initiates ${flow.flowType} process`,
              activities: Array.isArray(flowData.activities) ? flowData.activities : [
                `${flow.stakeholder} submits ${flow.flowType} request`,
                "System validates input data and permissions",
                "Backend processes request with business logic",
                "Database updates records and maintains data integrity",
                "System generates response and confirmation",
                "Notification service sends status update"
              ],
              decisionPoints: Array.isArray(flowData.decisionPoints) ? flowData.decisionPoints : [
                "Exclusive Gateway: If validation passes, continue to processing; otherwise return error",
                "Parallel Gateway: Execute data update and audit logging simultaneously",
                "Inclusive Gateway: Based on request type, trigger additional notifications or workflows"
              ],
              endEvent: flowData.endEvent || `${flow.flowType} process completes successfully with all data updated`,
              additionalElements: Array.isArray(flowData.additionalElements) ? flowData.additionalElements : [
                "Messages: Email confirmation sent to stakeholder with process results",
                "Timers: Business timer set for 24-hour response window",
                "Data: ProcessRecord data object created with transaction details",
                "Errors: Handle ValidationError and SystemTimeout exceptions"
              ]
            };

            // Parse description sections if available for backward compatibility
            if (flowData.description && typeof flowData.description === 'string') {
              const desc = flowData.description;
              
              const processDescMatch = desc.match(/✅ 1\. Process Name and Description[^✅]*\n([^✅]*)/);
              const participantsMatch = desc.match(/✅ 2\. Participants[^✅]*\n([^✅]*)/);
              const triggerMatch = desc.match(/✅ 3\. Trigger[^✅]*\n([^✅]*)/);
              const activitiesMatch = desc.match(/✅ 4\. Sequence of Activities[^✅]*\n([^✅]*)/);
              const decisionMatch = desc.match(/✅ 5\. Decision Points[^✅]*\n([^✅]*)/);
              const endEventMatch = desc.match(/✅ 6\. End Event[^✅]*\n([^✅]*)/);
              const additionalMatch = desc.match(/✅ 7\. Additional Elements[^$]*/);
              
              // Override with parsed content if found
              if (processDescMatch) flowDetails.processDescription = processDescMatch[1].trim();
              if (triggerMatch) flowDetails.trigger = triggerMatch[1].trim();
              if (endEventMatch) flowDetails.endEvent = endEventMatch[1].trim();
              
              if (participantsMatch) {
                const parsedParticipants = participantsMatch[1].trim()
                  .split('\n')
                  .filter((p: string) => p.trim() && (p.includes('-') || p.includes('*') || p.includes(':')))
                  .map((p: string) => p.replace(/^[-*:]\s*/, '').replace(/^Primary Actor:\s*/i, '').replace(/^Supporting Roles:\s*/i, '').replace(/^IT Systems:\s*/i, '').replace(/^External Entities:\s*/i, '').trim())
                  .filter((p: string) => p.length > 0);
                if (parsedParticipants.length > 0) flowDetails.participants = parsedParticipants;
              }
              
              if (activitiesMatch) {
                const parsedActivities = activitiesMatch[1].trim()
                  .split('\n')
                  .filter((a: string) => a.trim())
                  .map((a: string) => a.replace(/^[-*\d.]\s*/, '').replace(/^Activity \d+:\s*/i, '').trim())
                  .filter((a: string) => a.length > 0);
                if (parsedActivities.length > 0) flowDetails.activities = parsedActivities;
              }
              
              if (decisionMatch) {
                const parsedDecisions = decisionMatch[1].trim()
                  .split('\n')
                  .filter((d: string) => d.trim() && (d.includes('Gateway') || d.includes('If') || d.includes('condition')))
                  .map((d: string) => d.replace(/^[-*]\s*/, '').trim())
                  .filter((d: string) => d.length > 0);
                if (parsedDecisions.length > 0) flowDetails.decisionPoints = parsedDecisions;
              }
              
              if (additionalMatch) {
                const parsedAdditional = additionalMatch[0].replace(/✅ 7\. Additional Elements[^:]*:\s*/i, '').trim()
                  .split('\n')
                  .filter((e: string) => e.trim() && (e.includes('Messages:') || e.includes('Timers:') || e.includes('Data:') || e.includes('Errors:')))
                  .map((e: string) => e.replace(/^[-*]\s*/, '').trim())
                  .filter((e: string) => e.length > 0);
                if (parsedAdditional.length > 0) flowDetails.additionalElements = parsedAdditional;
              }
            }

            details[key] = flowDetails;
          } catch (parseError) {
            console.error(`Failed to parse response for ${key}:`, parseError, 'Raw response:', result);
            console.error('Cleaned result that failed:', cleanedResult);
            
            // Generate structured fallback with comprehensive BPMN format
            const flowTypeWords = flow.flowType.toLowerCase().split(' ');
            const mainAction = flowTypeWords[0] || 'process';
            
            const keyComponents = [
              `${flow.stakeholder}`,
              "System Backend", 
              "Database Service",
              "Authentication Module",
              "Notification Service",
              "External Services"
            ];
            
            const processes = [
              `${flow.stakeholder} authenticates and accesses system`,
              `System validates ${mainAction} request and permissions`,
              `Backend processes ${mainAction} with business logic`,
              "Database updates records and maintains integrity",
              "System generates confirmation and audit trail",
              `Notification service sends confirmation to ${flow.stakeholder}`
            ];

            details[key] = {
              description: `✅ 1. Process Name and Description
${flow.flowType} Process for ${flow.stakeholder}

This process starts when ${flow.stakeholder} initiates ${flow.flowType.toLowerCase()} and ends when all ${mainAction} activities are completed successfully with proper validation and confirmation.

✅ 2. Participants (Swimlanes / Pools and Lanes)
${flow.stakeholder}, System Backend, Database Service, Authentication Module, Notification Service, External Services

✅ 3. Trigger (Start Event)
${flow.stakeholder} initiates ${flow.flowType} request through the application interface or system entry point.

✅ 4. Sequence of Activities (Tasks / Actions)
1. ${flow.stakeholder} authenticates and accesses the system
2. System validates ${mainAction} request and permissions
3. Backend processes ${mainAction} with business logic validation
4. Database updates records and maintains data integrity
5. System generates confirmation and audit trail
6. Notification service sends confirmation to ${flow.stakeholder}

✅ 5. Decision Points (Gateways)
If authentication fails, redirect to login; otherwise proceed to ${mainAction} validation.
If ${mainAction} requires approval, route to supervisor workflow; otherwise auto-approve and continue.
If validation errors occur, return to ${flow.stakeholder} for correction; otherwise complete process.

✅ 6. End Event
Process concludes when ${flow.stakeholder} receives confirmation notification and all system records are successfully updated with audit trail completed.

✅ 7. Additional Elements
Messages: Confirmation email sent to ${flow.stakeholder}, Error notifications for validation failures
Timers: Session timeout after 30 minutes of inactivity, ${mainAction} processing timeout
Data Objects: ${flow.flowType} form data, User session data, Audit log entries, Confirmation receipt`,
              processDescription: `${flow.flowType} Process for ${flow.stakeholder}. This process starts when ${flow.stakeholder} initiates ${flow.flowType.toLowerCase()} and ends when all ${mainAction} activities are completed successfully.`,
              participants: [
                flow.stakeholder,
                "System Backend",
                "Database Service", 
                "Authentication Module",
                "Notification Service",
                "External Services"
              ],
              trigger: `${flow.stakeholder} initiates ${flow.flowType} request through the application interface or system entry point.`,
              activities: [
                `${flow.stakeholder} authenticates and accesses the system`,
                `System validates ${mainAction} request and permissions`,
                `Backend processes ${mainAction} with business logic validation`,
                `Database updates records and maintains data integrity`,
                `System generates confirmation and audit trail`,
                `Notification service sends confirmation to ${flow.stakeholder}`
              ],
              decisionPoints: [
                `If authentication fails, redirect to login; otherwise proceed to ${mainAction} validation.`,
                `If ${mainAction} requires approval, route to supervisor workflow; otherwise auto-approve and continue.`,
                `If validation errors occur, return to ${flow.stakeholder} for correction; otherwise complete process.`
              ],
              endEvent: `Process concludes when ${flow.stakeholder} receives confirmation notification and all system records are successfully updated with audit trail completed.`,
              additionalElements: [
                `Messages: Confirmation email sent to ${flow.stakeholder}, Error notifications for validation failures`,
                `Timers: Session timeout after 30 minutes of inactivity, ${mainAction} processing timeout`,
                `Data Objects: ${flow.flowType} form data, User session data, Audit log entries, Confirmation receipt`
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

  // Flow details editing functions
  const startEditingFlowDetails = (flowKey: string) => {
    const details = flowDetails[flowKey];
    if (details) {
      setEditingFlowDetails(flowKey);
      setEditedFlowDetails({
        description: details.description,
        processDescription: details.processDescription || '',
        participants: [...(details.participants || [])],
        trigger: details.trigger || '',
        activities: [...(details.activities || [])],
        decisionPoints: [...(details.decisionPoints || [])],
        endEvent: details.endEvent || '',
        additionalElements: [...(details.additionalElements || [])]
      });
    }
  };

  const saveFlowDetailsEdit = () => {
    if (editingFlowDetails && editedFlowDetails) {
      const updatedFlowDetails = {
        ...flowDetails,
        [editingFlowDetails]: editedFlowDetails
      };
      setFlowDetails(updatedFlowDetails);
      localStorage.setItem('flowDetails', JSON.stringify(updatedFlowDetails));
      setEditingFlowDetails(null);
      setEditedFlowDetails(null);
    }
  };

  const cancelFlowDetailsEdit = () => {
    setEditingFlowDetails(null);
    setEditedFlowDetails(null);
  };

  const updateEditedDescription = (description: string) => {
    if (editedFlowDetails) {
      setEditedFlowDetails({ ...editedFlowDetails, description });
    }
  };

  // Individual section editing functions
  const updateEditedField = (field: keyof FlowDetails, value: string) => {
    if (!editedFlowDetails) return;
    setEditedFlowDetails(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const addItemToField = (field: 'participants' | 'activities' | 'decisionPoints' | 'additionalElements', defaultValue: string) => {
    if (!editedFlowDetails) return;
    setEditedFlowDetails(prev => ({
      ...prev!,
      [field]: [...(prev![field] || []), defaultValue]
    }));
  };

  const updateItemInField = (field: 'participants' | 'activities' | 'decisionPoints' | 'additionalElements', index: number, value: string) => {
    if (!editedFlowDetails) return;
    setEditedFlowDetails(prev => {
      const newArray = [...(prev![field] || [])];
      newArray[index] = value;
      return {
        ...prev!,
        [field]: newArray
      };
    });
  };

  const removeItemFromField = (field: 'participants' | 'activities' | 'decisionPoints' | 'additionalElements', index: number) => {
    if (!editedFlowDetails) return;
    setEditedFlowDetails(prev => ({
      ...prev!,
      [field]: (prev![field] || []).filter((_, i) => i !== index)
    }));
  };



  // Generate swimlane BPMN from flow details using client-side Gemini API
  const generateSwimlaneFromDetails = async (stakeholder: string, flowType: string) => {
    const flowKey = `${stakeholder}-${flowType}`;
    const details = flowDetails[flowKey];
    
    if (!details) {
      setError('Flow details not found. Please generate flow details first.');
      return;
    }

    setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: true }));
    setError('');

    try {
      // Call Gemini API directly from client
      const { generateSwimlaneXml } = await import('../lib/gemini');
      const bpmnXml = await generateSwimlaneXml(stakeholder, flowType, details);
      
      // Update stakeholder flows with generated BPMN
      const updatedFlows = [...stakeholderFlows];
      const existingFlowIndex = updatedFlows.findIndex(
        flow => flow.stakeholder === stakeholder && flow.flowType === flowType
      );

      if (existingFlowIndex >= 0) {
        updatedFlows[existingFlowIndex] = {
          ...updatedFlows[existingFlowIndex],
          bpmnXml
        };
      } else {
        updatedFlows.push({
          stakeholder,
          flowType,
          bpmnXml,
          customPrompt: ''
        });
      }

      updateStakeholderFlows(updatedFlows);

    } catch (err) {
      console.error('Error generating swimlane BPMN:', err);
      
      // Generate fallback BPMN on error
      console.log('Generating fallback BPMN for:', flowKey);
      const fallbackBpmn = generateFallbackBpmn(stakeholder, flowType, details);
      
      const updatedFlows = [...stakeholderFlows];
      const existingFlowIndex = updatedFlows.findIndex(
        flow => flow.stakeholder === stakeholder && flow.flowType === flowType
      );

      if (existingFlowIndex >= 0) {
        updatedFlows[existingFlowIndex] = {
          ...updatedFlows[existingFlowIndex],
          bpmnXml: fallbackBpmn
        };
      } else {
        updatedFlows.push({
          stakeholder,
          flowType,
          bpmnXml: fallbackBpmn,
          customPrompt: ''
        });
      }

      updateStakeholderFlows(updatedFlows);
      
    } finally {
      setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: false }));
    }
  };

  // Generate BPMN XML directly from flow content box
  const generateBpmnFromContent = async (stakeholder: string, flowType: string) => {
    const flowKey = `${stakeholder}-${flowType}`;
    const details = flowDetails[flowKey];
    
    if (!details) {
      setError('Flow details not found. Please generate flow details first.');
      return;
    }

    setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: true }));
    setError('');

    try {
      // Create structured content from flow details
      const structuredContent = {
        processName: `${stakeholder} - ${flowType}`,
        processDescription: details.processDescription || details.description,
        participants: details.participants || [],
        trigger: details.trigger || 'Process starts',
        activities: details.activities || [],
        decisionPoints: details.decisionPoints || [],
        endEvent: details.endEvent || 'Process completes',
        additionalElements: details.additionalElements || []
      };

      // Generate BPMN XML using Gemini API with structured content
      const { generateBpmnXml } = await import('../lib/gemini');
      
      // Create a comprehensive prompt from the structured content
      const contentPrompt = `
Process: ${structuredContent.processName}
Description: ${structuredContent.processDescription}

Participants/Swimlanes: ${structuredContent.participants.join(', ')}
Trigger: ${structuredContent.trigger}
Activities: ${structuredContent.activities.join('; ')}
Decision Points: ${structuredContent.decisionPoints.join('; ')}
End Event: ${structuredContent.endEvent}
Additional Elements: ${structuredContent.additionalElements.join('; ')}

Generate a complete BPMN 2.0 XML diagram with proper swimlanes, start/end events, tasks, and gateways.
      `.trim();

      let bpmnXml;
      try {
        bpmnXml = await generateBpmnXml(contentPrompt);
        console.log('Successfully generated BPMN XML:', bpmnXml.substring(0, 200) + '...');
      } catch (bpmnError) {
        console.error('Gemini BPMN generation failed, creating fallback:', bpmnError);
        
        // Create fallback BPMN XML directly from structured content
        const cleanStakeholder = stakeholder.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanFlowType = flowType.replace(/[^a-zA-Z0-9]/g, '_');
        
        const processId = `Process_${cleanStakeholder}_${cleanFlowType}`;
        const poolId = `Pool_${cleanStakeholder}`;
        
        // Generate task elements from activities
        const taskElements = structuredContent.activities.map((activity, index) => {
          const taskId = `Task_${index + 1}`;
          return `    <bpmn2:userTask id="${taskId}" name="${activity.replace(/"/g, '&quot;')}" />`;
        }).join('\n');
        
        // Generate sequence flows
        const flowElements = [];
        structuredContent.activities.forEach((_, index) => {
          if (index === 0) {
            flowElements.push(`    <bpmn2:sequenceFlow id="Flow_start_${index + 1}" sourceRef="StartEvent_1" targetRef="Task_${index + 1}" />`);
          }
          if (index < structuredContent.activities.length - 1) {
            flowElements.push(`    <bpmn2:sequenceFlow id="Flow_${index + 1}_${index + 2}" sourceRef="Task_${index + 1}" targetRef="Task_${index + 2}" />`);
          } else {
            flowElements.push(`    <bpmn2:sequenceFlow id="Flow_${index + 1}_end" sourceRef="Task_${index + 1}" targetRef="EndEvent_1" />`);
          }
        });
        
        // Generate visual elements
        const taskShapes = structuredContent.activities.map((activity, index) => {
          const x = 200 + (index * 150);
          return `      <bpmndi:BPMNShape id="Task_${index + 1}_di" bpmnElement="Task_${index + 1}">
        <dc:Bounds x="${x}" y="140" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
        }).join('\n');
        
        const flowEdges = [];
        structuredContent.activities.forEach((_, index) => {
          if (index === 0) {
            flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_start_${index + 1}_di" bpmnElement="Flow_start_${index + 1}">
        <di:waypoint x="148" y="180" />
        <di:waypoint x="200" y="180" />
      </bpmndi:BPMNEdge>`);
          }
          if (index < structuredContent.activities.length - 1) {
            const x1 = 300 + (index * 150);
            const x2 = 200 + ((index + 1) * 150);
            flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_${index + 1}_${index + 2}_di" bpmnElement="Flow_${index + 1}_${index + 2}">
        <di:waypoint x="${x1}" y="180" />
        <di:waypoint x="${x2}" y="180" />
      </bpmndi:BPMNEdge>`);
          } else {
            const x1 = 300 + (index * 150);
            const x2 = x1 + 100;
            flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_${index + 1}_end_di" bpmnElement="Flow_${index + 1}_end">
        <di:waypoint x="${x1}" y="180" />
        <di:waypoint x="${x2}" y="180" />
      </bpmndi:BPMNEdge>`);
          }
        });
        
        bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:collaboration id="Collaboration_1">
    <bpmn2:participant id="${poolId}" name="${stakeholder}" processRef="${processId}" />
  </bpmn2:collaboration>
  <bpmn2:process id="${processId}" isExecutable="true">
    <bpmn2:startEvent id="StartEvent_1" name="${structuredContent.trigger.substring(0, 50)}..." />
${taskElements}
    <bpmn2:endEvent id="EndEvent_1" name="${structuredContent.endEvent.substring(0, 50)}..." />
${flowElements.join('\n')}
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="${poolId}_di" bpmnElement="${poolId}" isHorizontal="true">
        <dc:Bounds x="80" y="80" width="${200 + (structuredContent.activities.length * 150)}" height="250" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="112" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
${taskShapes}
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="${200 + (structuredContent.activities.length * 150) + 20}" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
${flowEdges.join('\n')}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;
      }
      
      // Update stakeholder flows with generated BPMN
      const updatedFlows = [...stakeholderFlows];
      const existingFlowIndex = updatedFlows.findIndex(
        flow => flow.stakeholder === stakeholder && flow.flowType === flowType
      );

      if (existingFlowIndex >= 0) {
        updatedFlows[existingFlowIndex] = {
          ...updatedFlows[existingFlowIndex],
          bpmnXml
        };
      } else {
        updatedFlows.push({
          stakeholder,
          flowType,
          bpmnXml,
          customPrompt: ''
        });
      }

      updateStakeholderFlows(updatedFlows);
      
      // Save the latest generated BPMN to localStorage for editor
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error(`Error generating BPMN from content for ${stakeholder} ${flowType}:`, error);
      setError(`Failed to generate BPMN diagram from content. Please try again.`);
    } finally {
      setIsGeneratingBpmn(prev => ({ ...prev, [flowKey]: false }));
    }
  };

  // Generate fallback BPMN when API fails
  const generateFallbackBpmn = (stakeholder: string, flowType: string, details: { description: string; participants: string[]; activities: string[] }) => {
    // Create valid XML IDs by removing special characters
    const cleanStakeholder = stakeholder.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const cleanFlowType = flowType.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    
    const processId = `Process_${cleanStakeholder}_${cleanFlowType}`;
    const poolId = `Pool_${cleanStakeholder}`;
    
    // Generate process elements based on activities
    const processElements = details.activities.map((activity, index) => {
      const taskId = `Activity_${index + 1}`;
      return `
    <bpmn:serviceTask id="${taskId}" name="${activity}" />`;
    }).join('');

    // Generate sequence flows between activities
    const sequenceFlows = details.activities.map((_, index) => {
      if (index === 0) {
        return `
    <bpmn:sequenceFlow id="Flow_start_${index + 1}" sourceRef="StartEvent_1" targetRef="Activity_${index + 1}" />`;
      } else if (index === details.activities.length - 1) {
        return `
    <bpmn:sequenceFlow id="Flow_${index}_end" sourceRef="Activity_${index + 1}" targetRef="EndEvent_1" />`;
      } else {
        return `
    <bpmn:sequenceFlow id="Flow_${index}_${index + 1}" sourceRef="Activity_${index + 1}" targetRef="Activity_${index + 2}" />`;
      }
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="${poolId}" name="${stakeholder}" processRef="${processId}" />
  </bpmn:collaboration>
  <bpmn:process id="${processId}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start ${flowType}" />
    ${processElements}
    <bpmn:endEvent id="EndEvent_1" name="End ${flowType}" />
    ${sequenceFlows}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="${poolId}_di" bpmnElement="${poolId}" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="800" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="212" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="208" y="205" width="44" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      ${details.activities.map((activity, index) => `
      <bpmndi:BPMNShape id="Activity_${index + 1}_di" bpmnElement="Activity_${index + 1}">
        <dc:Bounds x="${300 + (index * 150)}" y="140" width="100" height="80" />
      </bpmndi:BPMNShape>`).join('')}
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="${320 + (details.activities.length * 150)}" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="324" y="205" width="28" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      ${details.activities.map((_, index) => {
        if (index === 0) {
          return `
      <bpmndi:BPMNEdge id="Flow_start_${index + 1}_di" bpmnElement="Flow_start_${index + 1}">
        <di:waypoint x="248" y="180" />
        <di:waypoint x="${300 + (index * 150)}" y="180" />
      </bpmndi:BPMNEdge>`;
        } else if (index === details.activities.length - 1) {
          return `
      <bpmndi:BPMNEdge id="Flow_${index}_end_di" bpmnElement="Flow_${index}_end">
        <di:waypoint x="${400 + (index * 150)}" y="180" />
        <di:waypoint x="${320 + (details.activities.length * 150)}" y="180" />
      </bpmndi:BPMNEdge>`;
        } else {
          return `
      <bpmndi:BPMNEdge id="Flow_${index}_${index + 1}_di" bpmnElement="Flow_${index}_${index + 1}">
        <di:waypoint x="${400 + (index * 150)}" y="180" />
        <di:waypoint x="${300 + ((index + 1) * 150)}" y="180" />
      </bpmndi:BPMNEdge>`;
        }
      }).join('')}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  };

  // Generate all swimlane diagrams
  const generateAllSwimlanes = async () => {
    const allFlows: { stakeholder: string; flowType: string }[] = [];
    
    // Collect all stakeholder-flow combinations that have details
    Object.entries(personaFlowTypes).forEach(([stakeholder, flowTypes]) => {
      flowTypes.forEach(flowType => {
        const flowKey = `${stakeholder}-${flowType}`;
        if (flowDetails[flowKey]) {
          allFlows.push({ stakeholder, flowType });
        }
      });
    });

    if (allFlows.length === 0) {
      setError('No flow details available. Please generate flow details first.');
      return;
    }

    // Generate swimlanes for all flows sequentially
    for (const flow of allFlows) {
      await generateSwimlaneFromDetails(flow.stakeholder, flow.flowType);
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
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
                  onClick={generateAllSwimlanes}
                  disabled={Object.values(isGeneratingBpmn).some(Boolean)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                >
                  {Object.values(isGeneratingBpmn).some(Boolean) ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Activity className="h-3 w-3 mr-1" />
                  )}
                  Generate All Swimlanes
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
                                  {details && editingFlowDetails !== flowKey && (
                                    <Button
                                      onClick={() => startEditingFlowDetails(flowKey)}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs px-2 py-1 h-7 border-gray-300 hover:bg-blue-50"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => generateBpmnFromContent(stakeholder, flowType)}
                                    disabled={isGeneratingBpmn[flowKey] || !details}
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
                                  {editingFlowDetails === flowKey && editedFlowDetails ? (
                                    /* Edit Mode */
                                    <div className="space-y-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="text-xs font-semibold text-blue-800">Editing Flow Details</h5>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            onClick={saveFlowDetailsEdit}
                                            size="sm"
                                            className="h-6 px-2 bg-green-500 hover:bg-green-600 text-white"
                                          >
                                            <Save className="h-3 w-3 mr-1" />
                                            Save
                                          </Button>
                                          <Button
                                            onClick={cancelFlowDetailsEdit}
                                            variant="outline"
                                            size="sm"
                                            className="h-6 px-2 border-gray-300"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Edit Process Description */}
                                      <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">Process Description</label>
                                        <Textarea
                                          ref={(textarea) => {
                                            if (textarea) {
                                              // Auto-size on initial render
                                              textarea.style.height = 'auto';
                                              textarea.style.height = Math.max(60, textarea.scrollHeight) + 'px';
                                            }
                                          }}
                                          value={editedFlowDetails.processDescription}
                                          onChange={(e) => {
                                            updateEditedField('processDescription', e.target.value);
                                            // Auto-expand textarea
                                            const target = e.target;
                                            target.style.height = 'auto';
                                            target.style.height = Math.max(60, target.scrollHeight) + 'px';
                                          }}
                                          className="text-xs min-h-[60px] resize-none overflow-hidden"
                                        />
                                      </div>

                                      {/* Edit Participants */}
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-xs font-medium text-gray-600">Participants (Swimlanes)</label>
                                          <Button
                                            onClick={() => addItemToField('participants', 'New Participant')}
                                            size="sm"
                                            variant="outline"
                                            className="h-5 px-1.5 text-xs"
                                          >
                                            <Plus className="h-2.5 w-2.5" />
                                          </Button>
                                        </div>
                                        <div className="space-y-1">
                                          {editedFlowDetails.participants.map((participant, idx) => (
                                            <div key={idx} className="flex items-center gap-1">
                                              <Input
                                                value={participant}
                                                onChange={(e) => updateItemInField('participants', idx, e.target.value)}
                                                className="text-xs h-6 flex-1"
                                              />
                                              <Button
                                                onClick={() => removeItemFromField('participants', idx)}
                                                size="sm"
                                                variant="outline"
                                                className="h-6 w-6 p-0 border-red-300 hover:bg-red-50 text-red-600"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Edit Trigger */}
                                      <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">Trigger (Start Event)</label>
                                        <Textarea
                                          ref={(textarea) => {
                                            if (textarea) {
                                              // Auto-size on initial render
                                              textarea.style.height = 'auto';
                                              textarea.style.height = Math.max(40, textarea.scrollHeight) + 'px';
                                            }
                                          }}
                                          value={editedFlowDetails.trigger}
                                          onChange={(e) => {
                                            updateEditedField('trigger', e.target.value);
                                            // Auto-expand textarea
                                            const target = e.target;
                                            target.style.height = 'auto';
                                            target.style.height = Math.max(40, target.scrollHeight) + 'px';
                                          }}
                                          className="text-xs min-h-[40px] resize-none overflow-hidden"
                                        />
                                      </div>

                                      {/* Edit Activities */}
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-xs font-medium text-gray-600">Activities (Tasks)</label>
                                          <Button
                                            onClick={() => addItemToField('activities', 'New Activity')}
                                            size="sm"
                                            variant="outline"
                                            className="h-5 px-1.5 text-xs"
                                          >
                                            <Plus className="h-2.5 w-2.5" />
                                          </Button>
                                        </div>
                                        <div className="space-y-1">
                                          {editedFlowDetails.activities.map((activity, idx) => (
                                            <div key={idx} className="flex items-center gap-1">
                                              <Input
                                                value={activity}
                                                onChange={(e) => updateItemInField('activities', idx, e.target.value)}
                                                className="text-xs h-6 flex-1"
                                              />
                                              <Button
                                                onClick={() => removeItemFromField('activities', idx)}
                                                size="sm"
                                                variant="outline"
                                                className="h-6 w-6 p-0 border-red-300 hover:bg-red-50 text-red-600"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Edit Decision Points */}
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-xs font-medium text-gray-600">Decision Points (Gateways)</label>
                                          <Button
                                            onClick={() => addItemToField('decisionPoints', 'If condition, then action; otherwise alternative')}
                                            size="sm"
                                            variant="outline"
                                            className="h-5 px-1.5 text-xs"
                                          >
                                            <Plus className="h-2.5 w-2.5" />
                                          </Button>
                                        </div>
                                        <div className="space-y-1">
                                          {editedFlowDetails.decisionPoints.map((decision, idx) => (
                                            <div key={idx} className="flex items-center gap-1">
                                              <Input
                                                value={decision}
                                                onChange={(e) => updateItemInField('decisionPoints', idx, e.target.value)}
                                                className="text-xs h-6 flex-1"
                                              />
                                              <Button
                                                onClick={() => removeItemFromField('decisionPoints', idx)}
                                                size="sm"
                                                variant="outline"
                                                className="h-6 w-6 p-0 border-red-300 hover:bg-red-50 text-red-600"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Edit End Event */}
                                      <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">End Event</label>
                                        <Textarea
                                          ref={(textarea) => {
                                            if (textarea) {
                                              // Auto-size on initial render
                                              textarea.style.height = 'auto';
                                              textarea.style.height = Math.max(40, textarea.scrollHeight) + 'px';
                                            }
                                          }}
                                          value={editedFlowDetails.endEvent}
                                          onChange={(e) => {
                                            updateEditedField('endEvent', e.target.value);
                                            // Auto-expand textarea
                                            const target = e.target;
                                            target.style.height = 'auto';
                                            target.style.height = Math.max(40, target.scrollHeight) + 'px';
                                          }}
                                          className="text-xs min-h-[40px] resize-none overflow-hidden"
                                        />
                                      </div>

                                      {/* Edit Additional Elements */}
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-xs font-medium text-gray-600">Additional Elements</label>
                                          <Button
                                            onClick={() => addItemToField('additionalElements', 'Messages: New notification')}
                                            size="sm"
                                            variant="outline"
                                            className="h-5 px-1.5 text-xs"
                                          >
                                            <Plus className="h-2.5 w-2.5" />
                                          </Button>
                                        </div>
                                        <div className="space-y-1">
                                          {editedFlowDetails.additionalElements.map((element, idx) => (
                                            <div key={idx} className="flex items-center gap-1">
                                              <Input
                                                value={element}
                                                onChange={(e) => updateItemInField('additionalElements', idx, e.target.value)}
                                                className="text-xs h-6 flex-1"
                                              />
                                              <Button
                                                onClick={() => removeItemFromField('additionalElements', idx)}
                                                size="sm"
                                                variant="outline"
                                                className="h-6 w-6 p-0 border-red-300 hover:bg-red-50 text-red-600"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                    </div>
                                  ) : (
                                    /* Display Mode */
                                    <>
                                      {/* BPMN Flow Analysis - 7 Section Structure */}
                                      <div className="space-y-3">
                                        {/* Section 1: Process Description */}
                                        <div className="group">
                                          <div className="flex items-center justify-between mb-1">
                                            <Badge className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 border-0">
                                              ✅ 1. Process & Description
                                            </Badge>
                                            <Button
                                              onClick={() => startEditingFlowDetails(flowKey)}
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <p className="text-xs text-gray-700 leading-relaxed pl-2 border-l-2 border-purple-200">
                                            {details.processDescription || details.description.split('\n\n✅ 2.')[0].replace('✅ 1. Process Name and Description\n', '')}
                                          </p>
                                        </div>

                                        {/* Section 2: Participants (Swimlanes) - Editable */}
                                        <div className="group">
                                          <div className="flex items-center justify-between mb-1">
                                            <Badge className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border-0">
                                              ✅ 2. Participants (Swimlanes)
                                            </Badge>
                                            <Button
                                              onClick={() => startEditingFlowDetails(flowKey)}
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {details.participants?.map((participant, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                                {participant}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Section 3: Trigger (Start Event) */}
                                        <div className="group">
                                          <div className="flex items-center justify-between mb-1">
                                            <Badge className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border-0">
                                              ✅ 3. Trigger (Start Event)
                                            </Badge>
                                            <Button
                                              onClick={() => startEditingFlowDetails(flowKey)}
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <p className="text-xs text-gray-600 pl-2 border-l-2 border-green-200">
                                            {details.trigger || (() => {
                                              const triggerSection = details.description.match(/✅ 3\. Trigger \(Start Event\)\n([^✅]*)/);
                                              return triggerSection ? triggerSection[1].trim() : 'Process initiates when conditions are met';
                                            })()}
                                          </p>
                                        </div>

                                        {/* Section 4: Activities - Editable */}
                                        <div className="group">
                                          <div className="flex items-center justify-between mb-1">
                                            <Badge className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 border-0">
                                              ✅ 4. Activities (Tasks)
                                            </Badge>
                                            <Button
                                              onClick={() => startEditingFlowDetails(flowKey)}
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <div className="space-y-1">
                                            {details.activities?.map((activity, idx) => (
                                              <div key={idx} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                                                <span className="text-xs text-gray-600">{activity}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Section 5: Decision Points - Editable */}
                                        <div className="group">
                                          <div className="flex items-center justify-between mb-1">
                                            <Badge className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 border-0">
                                              ✅ 5. Decision Points (Gateways)
                                            </Badge>
                                            <Button
                                              onClick={() => startEditingFlowDetails(flowKey)}
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <div className="text-xs text-gray-600 pl-2 border-l-2 border-yellow-200 space-y-1">
                                            {(details.decisionPoints && details.decisionPoints.length > 0) ? 
                                              details.decisionPoints.map((decision, idx) => (
                                                <div key={idx} className="flex items-start gap-2">
                                                  <div className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                  <span>{decision.trim()}</span>
                                                </div>
                                              )) : 
                                              (() => {
                                                const decisionSection = details.description.match(/✅ 5\. Decision Points \(Gateways\)\n([^✅]*)/);
                                                if (decisionSection) {
                                                  return decisionSection[1].trim().split('\n').map((decision, idx) => (
                                                    <div key={idx} className="flex items-start gap-2">
                                                      <div className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                      <span>{decision.trim()}</span>
                                                    </div>
                                                  ));
                                                }
                                                return <span>Standard validation and approval gates</span>;
                                              })()
                                            }
                                          </div>
                                        </div>

                                        {/* Section 6: End Event */}
                                        <div className="group">
                                          <div className="flex items-center justify-between mb-1">
                                            <Badge className="text-xs px-2 py-0.5 bg-red-100 text-red-700 border-0">
                                              ✅ 6. End Event
                                            </Badge>
                                            <Button
                                              onClick={() => startEditingFlowDetails(flowKey)}
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <p className="text-xs text-gray-600 pl-2 border-l-2 border-red-200">
                                            {details.endEvent || (() => {
                                              const endSection = details.description.match(/✅ 6\. End Event\n([^✅]*)/);
                                              return endSection ? endSection[1].trim() : 'Process completes when all objectives are met';
                                            })()}
                                          </p>
                                        </div>

                                        {/* Section 7: Additional Elements - Editable */}
                                        <div className="group">
                                          <div className="flex items-center justify-between mb-1">
                                            <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 border-0">
                                              ✅ 7. Additional Elements
                                            </Badge>
                                            <Button
                                              onClick={() => startEditingFlowDetails(flowKey)}
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <div className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
                                            <div className="grid grid-cols-1 gap-1">
                                              {(details.additionalElements && details.additionalElements.length > 0) ?
                                                details.additionalElements.map((element, idx) => {
                                                  if (element.includes('Messages:')) {
                                                    return (
                                                      <div key={idx} className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 border-blue-200">
                                                          📧 Messages
                                                        </Badge>
                                                        <span>{element.replace('Messages:', '').trim()}</span>
                                                      </div>
                                                    );
                                                  } else if (element.includes('Timers:')) {
                                                    return (
                                                      <div key={idx} className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-600 border-orange-200">
                                                          ⏱️ Timers
                                                        </Badge>
                                                        <span>{element.replace('Timers:', '').trim()}</span>
                                                      </div>
                                                    );
                                                  } else if (element.includes('Data')) {
                                                    return (
                                                      <div key={idx} className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 border-green-200">
                                                          📄 Data
                                                        </Badge>
                                                        <span>{element.replace('Data Objects:', '').trim()}</span>
                                                      </div>
                                                    );
                                                  }
                                                  return (
                                                    <div key={idx} className="flex items-center gap-2">
                                                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200">
                                                        📋 Element
                                                      </Badge>
                                                      <span>{element}</span>
                                                    </div>
                                                  );
                                                }) : 
                                                (() => {
                                                  const additionalSection = details.description.match(/✅ 7\. Additional Elements\n([^$]*)/);
                                                  if (additionalSection) {
                                                    const elements = additionalSection[1].trim().split('\n');
                                                    return elements.map((element, idx) => {
                                                      if (element.includes('Messages:')) {
                                                        return (
                                                          <div key={idx} className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 border-blue-200">
                                                              📧 Messages
                                                            </Badge>
                                                            <span>{element.replace('Messages:', '').trim()}</span>
                                                          </div>
                                                        );
                                                      } else if (element.includes('Timers:')) {
                                                        return (
                                                          <div key={idx} className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-600 border-orange-200">
                                                              ⏱️ Timers
                                                            </Badge>
                                                            <span>{element.replace('Timers:', '').trim()}</span>
                                                          </div>
                                                        );
                                                      } else if (element.includes('Data')) {
                                                        return (
                                                          <div key={idx} className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 border-green-200">
                                                              📄 Data
                                                            </Badge>
                                                            <span>{element.replace('Data Objects:', '').trim()}</span>
                                                          </div>
                                                        );
                                                      }
                                                      return null;
                                                    });
                                                  }
                                                  return (
                                                    <div className="flex items-center gap-2">
                                                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200">
                                                        📋 Standard
                                                      </Badge>
                                                      <span>Forms, notifications, and system logs</span>
                                                    </div>
                                                  );
                                                })()
                                              }
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                              

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
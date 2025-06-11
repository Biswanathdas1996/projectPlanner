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
  Trash2,
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
  Star,
  Target,
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

  // Flow details editing state
  const [editingFlowDetails, setEditingFlowDetails] = useState<string | null>(
    null,
  );
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
      const { stakeholders, flowTypes } =
        await extractStakeholdersFromProject(planContent);
      setExtractedStakeholders(stakeholders);
      setPersonaFlowTypes(flowTypes);

      // Initialize stakeholder flows based on extracted data
      const initialFlows: StakeholderFlow[] = [];
      stakeholders.forEach((stakeholder) => {
        flowTypes[stakeholder]?.forEach((flowType) => {
          initialFlows.push({
            stakeholder,
            flowType,
            bpmnXml: "",
            customPrompt: "",
          });
        });
      });
      updateStakeholderFlows(initialFlows);

      localStorage.setItem(
        STORAGE_KEYS.EXTRACTED_STAKEHOLDERS,
        JSON.stringify(stakeholders),
      );
      localStorage.setItem(
        STORAGE_KEYS.PERSONA_FLOW_TYPES,
        JSON.stringify(flowTypes),
      );
    } catch (error) {
      console.error("Error extracting stakeholders:", error);
      setError(
        "Failed to extract stakeholders from project plan. Please try again.",
      );
    } finally {
      setIsExtractingStakeholders(false);
    }
  };

  // Generate user journey flows overview
  const generateFlows = async () => {
    const planContent = projectPlan || projectDescription;
    if (!planContent.trim()) {
      setError(
        "No project plan available. Please generate a project plan first.",
      );
      return;
    }

    setIsGeneratingFlows(true);
    setError("");

    try {
      const flows = await generateUserJourneyFlows(planContent);
      setUserJourneyFlows(flows);
      localStorage.setItem(STORAGE_KEYS.USER_JOURNEY_FLOWS, flows);
    } catch (error) {
      console.error("Error generating user journey flows:", error);
      setError("Failed to generate user journey flows. Please try again.");
    } finally {
      setIsGeneratingFlows(false);
    }
  };

  // Generate BPMN for a specific stakeholder flow
  const generateStakeholderBpmn = async (
    stakeholder: string,
    flowType: string,
    customPrompt?: string,
  ) => {
    const planContent = projectPlan || projectDescription;
    if (!planContent.trim()) {
      setError(
        "No project plan available. Please generate a project plan first.",
      );
      return;
    }

    const flowKey = `${stakeholder}-${flowType}`;
    setIsGeneratingBpmn((prev) => ({ ...prev, [flowKey]: true }));
    setError("");

    try {
      const bpmn = await generatePersonaBpmnFlowWithType(
        planContent,
        stakeholder,
        flowType,
        customPrompt,
      );

      const updatedFlows = stakeholderFlows.map((flow) =>
        flow.stakeholder === stakeholder && flow.flowType === flowType
          ? { ...flow, bpmnXml: bpmn }
          : flow,
      );
      updateStakeholderFlows(updatedFlows);

      // Save the latest generated BPMN to localStorage for editor
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmn);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmn);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error(`Error generating ${stakeholder} ${flowType} BPMN:`, error);
      setError(
        `Failed to generate ${stakeholder} ${flowType} BPMN diagram. Please try again.`,
      );
    } finally {
      setIsGeneratingBpmn((prev) => ({ ...prev, [flowKey]: false }));
    }
  };

  // Generate all BPMN diagrams
  const generateAllBpmn = async () => {
    for (const flow of stakeholderFlows) {
      await generateStakeholderBpmn(
        flow.stakeholder,
        flow.flowType,
        flow.customPrompt,
      );
      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
        bpmnXml: "",
        customPrompt: "",
      },
    ];
    updateStakeholderFlows(updatedFlows);
  };

  // Remove a flow with confirmation
  const removeFlow = (stakeholder: string, flowType: string) => {
    if (window.confirm(`Are you sure you want to delete the BPMN flow for "${stakeholder} - ${flowType}"? This action cannot be undone.`)) {
      const updatedFlows = stakeholderFlows.filter(
        (flow) =>
          !(flow.stakeholder === stakeholder && flow.flowType === flowType),
      );
      updateStakeholderFlows(updatedFlows);
    }
  };

  // Update custom prompt for a flow
  const updateCustomPrompt = (
    stakeholder: string,
    flowType: string,
    prompt: string,
  ) => {
    const updatedFlows = stakeholderFlows.map((flow) =>
      flow.stakeholder === stakeholder && flow.flowType === flowType
        ? { ...flow, customPrompt: prompt }
        : flow,
    );
    updateStakeholderFlows(updatedFlows);
  };

  // Download user journeys
  const downloadUserJourneys = () => {
    if (!userJourneyFlows) {
      setError("No user journey flows available to download");
      return;
    }

    const blob = new Blob([userJourneyFlows], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const projectName = projectDescription
      .substring(0, 50)
      .replace(/[^a-zA-Z0-9]/g, "_");
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
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const timestamp = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `stakeholder-bpmn-data-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy XML to clipboard
  const copyXmlToClipboard = (xml: string) => {
    navigator.clipboard
      .writeText(xml)
      .then(() => {
        // Show success feedback
      })
      .catch((err) => {
        console.error("Failed to copy XML:", err);
      });
  };

  // Navigate to editor with specific diagram
  const openInEditor = (stakeholderOrXml: string, flowType?: string) => {
    let bpmnXml = '';
    
    if (flowType) {
      // Called with stakeholder and flowType
      const existingFlow = stakeholderFlows.find(
        (f) => f.stakeholder === stakeholderOrXml && f.flowType === flowType,
      );
      bpmnXml = existingFlow?.bpmnXml || '';
    } else {
      // Called with just bpmnXml
      bpmnXml = stakeholderOrXml;
    }

    if (bpmnXml) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
      
      // Navigate to BPMN editor
      window.location.href = '/bpmn-editor';
    } else {
      setError("No BPMN diagram found to edit. Please generate a diagram first.");
    }
  };

  // Stakeholder Management Functions
  const addStakeholder = () => {
    const trimmedName = newStakeholderName.trim();
    if (!trimmedName) {
      setError("Stakeholder name cannot be empty");
      return;
    }

    if (extractedStakeholders.includes(trimmedName)) {
      setError("Stakeholder already exists");
      return;
    }

    const updatedStakeholders = [...extractedStakeholders, trimmedName];
    setExtractedStakeholders(updatedStakeholders);
    localStorage.setItem(
      STORAGE_KEYS.EXTRACTED_STAKEHOLDERS,
      JSON.stringify(updatedStakeholders),
    );

    // Add default flow types for new stakeholder
    const updatedFlowTypes = {
      ...personaFlowTypes,
      [trimmedName]: [
        "Registration Process",
        "Main Workflow",
        "Support Process",
      ],
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
      JSON.stringify(updatedFlowTypes),
    );

    setNewStakeholderName("");
    setError("");
  };

  const startEditingStakeholder = (stakeholder: string) => {
    setEditingStakeholder(stakeholder);
    setEditedStakeholderName(stakeholder);
  };

  const saveStakeholderEdit = () => {
    const trimmedName = editedStakeholderName.trim();
    if (!trimmedName) {
      setError("Stakeholder name cannot be empty");
      return;
    }

    if (
      trimmedName !== editingStakeholder &&
      extractedStakeholders.includes(trimmedName)
    ) {
      setError("Stakeholder name already exists");
      return;
    }

    if (editingStakeholder) {
      // Update stakeholders list
      const updatedStakeholders = extractedStakeholders.map((s) =>
        s === editingStakeholder ? trimmedName : s,
      );
      setExtractedStakeholders(updatedStakeholders);
      localStorage.setItem(
        STORAGE_KEYS.EXTRACTED_STAKEHOLDERS,
        JSON.stringify(updatedStakeholders),
      );

      // Update flow types
      const updatedFlowTypes = { ...personaFlowTypes };
      if (updatedFlowTypes[editingStakeholder]) {
        updatedFlowTypes[trimmedName] = updatedFlowTypes[editingStakeholder];
        if (trimmedName !== editingStakeholder) {
          delete updatedFlowTypes[editingStakeholder];
        }
      }
      setPersonaFlowTypes(updatedFlowTypes);
      localStorage.setItem(
        STORAGE_KEYS.PERSONA_FLOW_TYPES,
        JSON.stringify(updatedFlowTypes),
      );

      // Update stakeholder flows
      const updatedFlows = stakeholderFlows.map((flow) =>
        flow.stakeholder === editingStakeholder
          ? { ...flow, stakeholder: trimmedName }
          : flow,
      );
      updateStakeholderFlows(updatedFlows);
    }

    setEditingStakeholder(null);
    setEditedStakeholderName("");
    setError("");
  };

  const cancelStakeholderEdit = () => {
    setEditingStakeholder(null);
    setEditedStakeholderName("");
  };

  const deleteStakeholder = (stakeholder: string) => {
    // Remove from stakeholders list
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

    // Remove from stakeholder flows
    const updatedFlows = stakeholderFlows.filter(
      (flow) => flow.stakeholder !== stakeholder,
    );
    updateStakeholderFlows(updatedFlows);
  };

  // Flow Type Management Functions
  const addFlowType = (stakeholder: string) => {
    const trimmedFlowType = newFlowType[stakeholder]?.trim();
    if (!trimmedFlowType) {
      setError("Flow type name cannot be empty");
      return;
    }

    const currentFlowTypes = personaFlowTypes[stakeholder] || [];
    if (currentFlowTypes.includes(trimmedFlowType)) {
      setError("Flow type already exists for this stakeholder");
      return;
    }

    const updatedFlowTypes = {
      ...personaFlowTypes,
      [stakeholder]: [...currentFlowTypes, trimmedFlowType],
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
      JSON.stringify(updatedFlowTypes),
    );

    setNewFlowType((prev) => ({ ...prev, [stakeholder]: "" }));
    setError("");
  };

  const startEditingFlowType = (stakeholder: string, flowType: string) => {
    const key = `${stakeholder}-${flowType}`;
    setEditingFlowType(key);
    setEditedFlowTypeName(flowType);
  };

  const saveFlowTypeEdit = (stakeholder: string, originalFlowType: string) => {
    const trimmedName = editedFlowTypeName.trim();
    if (!trimmedName) {
      setError("Flow type name cannot be empty");
      return;
    }

    const currentFlowTypes = personaFlowTypes[stakeholder] || [];
    if (
      trimmedName !== originalFlowType &&
      currentFlowTypes.includes(trimmedName)
    ) {
      setError("Flow type already exists for this stakeholder");
      return;
    }

    const updatedFlowTypes = {
      ...personaFlowTypes,
      [stakeholder]: currentFlowTypes.map((ft) =>
        ft === originalFlowType ? trimmedName : ft,
      ),
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
      JSON.stringify(updatedFlowTypes),
    );

    // Update stakeholder flows with new flow type name
    const updatedFlows = stakeholderFlows.map((flow) =>
      flow.stakeholder === stakeholder && flow.flowType === originalFlowType
        ? { ...flow, flowType: trimmedName }
        : flow,
    );
    updateStakeholderFlows(updatedFlows);

    setEditingFlowType(null);
    setEditedFlowTypeName("");
    setError("");
  };

  const cancelFlowTypeEdit = () => {
    setEditingFlowType(null);
    setEditedFlowTypeName("");
  };

  const deleteFlowType = (stakeholder: string, flowType: string) => {
    const updatedFlowTypes = {
      ...personaFlowTypes,
      [stakeholder]: (personaFlowTypes[stakeholder] || []).filter(
        (ft) => ft !== flowType,
      ),
    };
    setPersonaFlowTypes(updatedFlowTypes);
    localStorage.setItem(
      STORAGE_KEYS.PERSONA_FLOW_TYPES,
      JSON.stringify(updatedFlowTypes),
    );

    // Remove from stakeholder flows
    const updatedFlows = stakeholderFlows.filter(
      (flow) =>
        !(flow.stakeholder === stakeholder && flow.flowType === flowType),
    );
    updateStakeholderFlows(updatedFlows);
  };

  // Generate detailed flow analysis for all stakeholder flows
  const generateFlowDetails = async () => {
    if (!projectPlan && !projectDescription) {
      setError("Please provide a project description or plan first");
      return;
    }

    setIsGeneratingFlowDetails(true);
    setError("");

    try {
      const allFlows: { stakeholder: string; flowType: string }[] = [];

      // Collect all stakeholder-flow combinations
      Object.entries(personaFlowTypes).forEach(([stakeholder, flowTypes]) => {
        flowTypes.forEach((flowType) => {
          allFlows.push({ stakeholder, flowType });
        });
      });

      // Initialize progress tracking
      setFlowGenerationProgress({
        current: 0,
        total: allFlows.length,
        currentFlow: '',
        completedFlows: [],
        status: 'Preparing flow analysis...'
      });

      const details: Record<string, FlowDetails> = {};

      // Generate details for each flow
      for (let i = 0; i < allFlows.length; i++) {
        const flow = allFlows[i];
        const key = `${flow.stakeholder}-${flow.flowType}`;

        // Update progress
        setFlowGenerationProgress(prev => ({
          ...prev,
          current: i + 1,
          currentFlow: `${flow.stakeholder} - ${flow.flowType}`,
          status: `Analyzing ${flow.stakeholder} ${flow.flowType} process...`
        }));

        try {
          console.log(
            `Generating flow details for ${flow.stakeholder} - ${flow.flowType} (${i + 1}/${allFlows.length})`,
          );
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
Define SHORT, precise trigger (1-2 sentences max):
- Specific triggering action or event
- Event source (UI, API, scheduled, message)
- Keep descriptions concise and BPMN-focused

✅ 4. Sequence of Activities (Tasks / Actions)
Provide 6-8 sequential activities using SHORT, BPMN-compliant names:
- Use concise action verbs: Submit, Validate, Process, Generate, Send, Update
- Activity names should be 2-4 words maximum
- Follow BPMN naming conventions: "Verb + Object" format
- Examples: "Submit Request", "Validate Data", "Process Payment", "Send Notification"
- Avoid long descriptive sentences
- Use standard BPMN task naming patterns

✅ 5. Decision Points (Gateways)
Include 2-3 SHORT decision points with CONCISE rules:
- Gateway type (Exclusive OR, Inclusive OR, Parallel AND)
- Brief decision criteria (1 sentence each)
- Simple branching logic
- Keep gateway descriptions short and BPMN-focused

✅ 6. End Event
Define SHORT completion scenario (1-2 sentences max):
- Primary success end event with brief completion criteria
- Keep end event descriptions concise and BPMN-focused

✅ 7. Additional Elements
Include SHORT, specific BPMN elements (1-2 words each):

**Messages:**
- "Notification sent", "Confirmation email", "Status update"

**Timers:**
- "Wait 24 hours", "Escalation timer", "Daily check"

**Data Objects:**
- "Request form", "User profile", "Transaction record"

**Error Events:**
- "Validation error", "Network timeout", "Access denied"
**Sub-processes:**
- "Authentication flow", "Payment process", "Approval workflow"

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"description": "✅ 1. Process Name and Description\\n[short process name and brief description]\\n\\n✅ 2. Participants (Swimlanes)\\n[participant list]\\n\\n✅ 3. Trigger (Start Event)\\n[brief trigger description]\\n\\n✅ 4. Sequence of Activities\\n[short activity names]\\n\\n✅ 5. Decision Points (Gateways)\\n[brief decision points]\\n\\n✅ 6. End Event\\n[short end event description]\\n\\n✅ 7. Additional Elements\\n[short element descriptions]", "participants": ["${flow.stakeholder}", "System Administrator", "Database System", "External API", "Notification Service", "Additional Role"], "activities": ["Submit Request", "Validate Data", "Process Transaction", "Update Records", "Send Notification", "Generate Report"], "trigger": "Brief trigger with event source", "decisionPoints": ["If valid, approve; else reject", "If urgent, escalate; else normal flow"], "endEvent": "Process completed successfully", "additionalElements": ["Messages: Notification sent", "Timers: Wait 24 hours", "Data: Request form", "Errors: Validation error"]}`;

          // Call Gemini API directly from client-side only
          console.log(`Starting flow analysis for ${key}...`);
          const { generateFlowAnalysis } = await import("../lib/gemini");

          console.log(
            `Calling Gemini API with prompt length: ${prompt.length}`,
          );
          const result = await generateFlowAnalysis(prompt);
          console.log(`Raw Gemini response for ${key}:`, result);

          if (!result || result.trim().length === 0) {
            console.error(`Empty response from Gemini API for ${key}`);
            throw new Error(`Empty response from Gemini API for ${key}`);
          }

          // Clean and parse the response
          let cleanedResult = result.trim();

          // Remove markdown code blocks more aggressively
          cleanedResult = cleanedResult
            .replace(/```json\n?/gi, "")
            .replace(/```\n?/g, "");
          cleanedResult = cleanedResult.replace(/^json\s*\n?/gi, "");

          // Extract JSON from the response - find the outermost braces
          const startBrace = cleanedResult.indexOf("{");
          const endBrace = cleanedResult.lastIndexOf("}");

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
              description:
                flowData.description ||
                `Comprehensive ${flow.flowType} process analysis for ${flow.stakeholder}`,
              processDescription:
                flowData.processDescription ||
                `${flow.stakeholder} ${flow.flowType} Process`,
              participants: Array.isArray(flowData.participants)
                ? flowData.participants
                : [
                    flow.stakeholder,
                    "System Administrator",
                    "Database System",
                    "External API",
                    "Notification Service",
                  ],
              trigger:
                flowData.trigger ||
                `${flow.stakeholder} initiates ${flow.flowType} process`,
              activities: Array.isArray(flowData.activities)
                ? flowData.activities
                : [
                    `${flow.stakeholder} submits ${flow.flowType} request`,
                    "System validates input data and permissions",
                    "Backend processes request with business logic",
                    "Database updates records and maintains data integrity",
                    "System generates response and confirmation",
                    "Notification service sends status update",
                  ],
              decisionPoints: Array.isArray(flowData.decisionPoints)
                ? flowData.decisionPoints
                : [
                    "Exclusive Gateway: If validation passes, continue to processing; otherwise return error",
                    "Parallel Gateway: Execute data update and audit logging simultaneously",
                    "Inclusive Gateway: Based on request type, trigger additional notifications or workflows",
                  ],
              endEvent:
                flowData.endEvent ||
                `${flow.flowType} process completes successfully with all data updated`,
              additionalElements: Array.isArray(flowData.additionalElements)
                ? flowData.additionalElements
                : [
                    "Messages: Email confirmation sent to stakeholder with process results",
                    "Timers: Business timer set for 24-hour response window",
                    "Data: ProcessRecord data object created with transaction details",
                    "Errors: Handle ValidationError and SystemTimeout exceptions",
                  ],
            };

            // Parse description sections if available for backward compatibility
            if (
              flowData.description &&
              typeof flowData.description === "string"
            ) {
              const desc = flowData.description;

              const processDescMatch = desc.match(
                /✅ 1\. Process Name and Description[^✅]*\n([^✅]*)/,
              );
              const participantsMatch = desc.match(
                /✅ 2\. Participants[^✅]*\n([^✅]*)/,
              );
              const triggerMatch = desc.match(/✅ 3\. Trigger[^✅]*\n([^✅]*)/);
              const activitiesMatch = desc.match(
                /✅ 4\. Sequence of Activities[^✅]*\n([^✅]*)/,
              );
              const decisionMatch = desc.match(
                /✅ 5\. Decision Points[^✅]*\n([^✅]*)/,
              );
              const endEventMatch = desc.match(
                /✅ 6\. End Event[^✅]*\n([^✅]*)/,
              );
              const additionalMatch = desc.match(
                /✅ 7\. Additional Elements[^$]*/,
              );

              // Override with parsed content if found
              if (processDescMatch)
                flowDetails.processDescription = processDescMatch[1].trim();
              if (triggerMatch) flowDetails.trigger = triggerMatch[1].trim();
              if (endEventMatch) flowDetails.endEvent = endEventMatch[1].trim();

              if (participantsMatch) {
                const parsedParticipants = participantsMatch[1]
                  .trim()
                  .split("\n")
                  .filter(
                    (p: string) =>
                      p.trim() &&
                      (p.includes("-") || p.includes("*") || p.includes(":")),
                  )
                  .map((p: string) =>
                    p
                      .replace(/^[-*:]\s*/, "")
                      .replace(/^Primary Actor:\s*/i, "")
                      .replace(/^Supporting Roles:\s*/i, "")
                      .replace(/^IT Systems:\s*/i, "")
                      .replace(/^External Entities:\s*/i, "")
                      .trim(),
                  )
                  .filter((p: string) => p.length > 0);
                if (parsedParticipants.length > 0)
                  flowDetails.participants = parsedParticipants;
              }

              if (activitiesMatch) {
                const parsedActivities = activitiesMatch[1]
                  .trim()
                  .split("\n")
                  .filter((a: string) => a.trim())
                  .map((a: string) =>
                    a
                      .replace(/^[-*\d.]\s*/, "")
                      .replace(/^Activity \d+:\s*/i, "")
                      .trim(),
                  )
                  .filter((a: string) => a.length > 0);
                if (parsedActivities.length > 0)
                  flowDetails.activities = parsedActivities;
              }

              if (decisionMatch) {
                const parsedDecisions = decisionMatch[1]
                  .trim()
                  .split("\n")
                  .filter(
                    (d: string) =>
                      d.trim() &&
                      (d.includes("Gateway") ||
                        d.includes("If") ||
                        d.includes("condition")),
                  )
                  .map((d: string) => d.replace(/^[-*]\s*/, "").trim())
                  .filter((d: string) => d.length > 0);
                if (parsedDecisions.length > 0)
                  flowDetails.decisionPoints = parsedDecisions;
              }

              if (additionalMatch) {
                const parsedAdditional = additionalMatch[0]
                  .replace(/✅ 7\. Additional Elements[^:]*:\s*/i, "")
                  .trim()
                  .split("\n")
                  .filter(
                    (e: string) =>
                      e.trim() &&
                      (e.includes("Messages:") ||
                        e.includes("Timers:") ||
                        e.includes("Data:") ||
                        e.includes("Errors:")),
                  )
                  .map((e: string) => e.replace(/^[-*]\s*/, "").trim())
                  .filter((e: string) => e.length > 0);
                if (parsedAdditional.length > 0)
                  flowDetails.additionalElements = parsedAdditional;
              }
            }

            details[key] = flowDetails;
            
            // Update progress with completion
            setFlowGenerationProgress(prev => ({
              ...prev,
              completedFlows: [...prev.completedFlows, key],
              status: `Completed ${flow.stakeholder} ${flow.flowType} - ${prev.completedFlows.length + 1}/${allFlows.length} flows done`
            }));
            
          } catch (parseError) {
            console.error(
              `Failed to parse response for ${key}:`,
              parseError,
              "Raw response:",
              result,
            );
            console.error("Cleaned result that failed:", cleanedResult);

            // Generate structured fallback with comprehensive BPMN format
            const flowTypeWords = flow.flowType.toLowerCase().split(" ");
            const mainAction = flowTypeWords[0] || "process";

            const keyComponents = [
              `${flow.stakeholder}`,
              "System Backend",
              "Database Service",
              "Authentication Module",
              "Notification Service",
              "External Services",
            ];

            const processes = [
              `${flow.stakeholder} authenticates and accesses system`,
              `System validates ${mainAction} request and permissions`,
              `Backend processes ${mainAction} with business logic`,
              "Database updates records and maintains integrity",
              "System generates confirmation and audit trail",
              `Notification service sends confirmation to ${flow.stakeholder}`,
            ];

            details[key] = {
              description: `✅ 1. Process Name and Description
${flow.flowType} Process

${flow.stakeholder} ${mainAction} workflow with validation and confirmation.

✅ 2. Participants (Swimlanes / Pools and Lanes)
${flow.stakeholder}, System Backend, Database Service, Notification Service

✅ 3. Trigger (Start Event)
${flow.stakeholder} initiates ${flow.flowType} via UI.

✅ 4. Sequence of Activities (Tasks / Actions)
1. Authenticate User
2. Validate Request
3. Process ${mainAction}
4. Update Records
5. Generate Confirmation
6. Send Notification

✅ 5. Decision Points (Gateways)
If valid, approve; else reject.
If urgent, escalate; else normal flow.

✅ 6. End Event
Process completed successfully.

✅ 7. Additional Elements
Messages: Notification sent
Timers: Wait 24 hours
Data Objects: Request form, User profile`,
              processDescription: `${flow.flowType} Process for ${flow.stakeholder}. This process starts when ${flow.stakeholder} initiates ${flow.flowType.toLowerCase()} and ends when all ${mainAction} activities are completed successfully.`,
              participants: [
                flow.stakeholder,
                "System Backend",
                "Database Service",
                "Authentication Module",
                "Notification Service",
                "External Services",
              ],
              trigger: `${flow.stakeholder} initiates ${flow.flowType} via UI.`,
              activities: [
                "Authenticate User",
                "Validate Request",
                `Process ${mainAction}`,
                "Update Records",
                "Generate Confirmation",
                "Send Notification",
              ],
              decisionPoints: [
                `If valid, approve; else reject`,
                `If urgent, escalate; else normal flow`,
              ],
              endEvent: `Process completed successfully`,
              additionalElements: [
                `Messages: Notification sent`,
                `Timers: Wait 24 hours`,
                `Data Objects: Request form, User profile`,
              ],
            };
            
            // Update progress with fallback completion
            setFlowGenerationProgress(prev => ({
              ...prev,
              completedFlows: [...prev.completedFlows, key],
              status: `Completed ${flow.stakeholder} ${flow.flowType} (fallback) - ${prev.completedFlows.length + 1}/${allFlows.length} flows done`
            }));
          }
        } catch (err) {
          console.error(`Failed to generate details for ${key}:`, err);
          // Even on error, mark as attempted
          setFlowGenerationProgress(prev => ({
            ...prev,
            completedFlows: [...prev.completedFlows, key],
            status: `Error in ${flow.stakeholder} ${flow.flowType} - ${prev.completedFlows.length + 1}/${allFlows.length} flows processed`
          }));
        }
      }

      // Final completion status
      setFlowGenerationProgress(prev => ({
        ...prev,
        status: `All flow details generated successfully! ${allFlows.length} flows completed.`
      }));

      setFlowDetails(details);
      localStorage.setItem("flowDetails", JSON.stringify(details));
    } catch (err) {
      console.error("Error generating flow details:", err);
      setError("Failed to generate flow details. Please try again.");
      setFlowGenerationProgress(prev => ({
        ...prev,
        status: "Error occurred during flow generation"
      }));
    } finally {
      setIsGeneratingFlowDetails(false);
      // Reset progress after a delay
      setTimeout(() => {
        setFlowGenerationProgress({
          current: 0,
          total: 0,
          currentFlow: '',
          completedFlows: [],
          status: ''
        });
      }, 3000);
    }
  };

  // Flow details editing functions
  const startEditingFlowDetails = (flowKey: string) => {
    const details = flowDetails[flowKey];
    if (details) {
      console.log("🔧 Starting edit for flow:", flowKey);
      console.log("📋 Flow details:", details);
      
      setEditingFlowDetails(flowKey);
      
      // Extract processDescription and trigger from description if not directly available
      let processDescription = details.processDescription || "";
      let trigger = details.trigger || "";
      
      console.log("🔍 Initial processDescription:", processDescription);
      console.log("🔍 Initial trigger:", trigger);
      
      if (!processDescription && details.description) {
        console.log("🔍 Trying to extract processDescription from description...");
        
        // Try multiple patterns for process description
        const patterns = [
          /✅ 1\. Process Name and Description[\s\S]*?\n([\s\S]+?)(?=\n\n✅|$)/,
          /✅ 1\. Process Name and Description\s*\n([\s\S]+?)(?=\n✅|$)/,
          /Process Name and Description[^:]*:?\s*\n([\s\S]+?)(?=\n✅|$)/
        ];
        
        for (const pattern of patterns) {
          const match = details.description.match(pattern);
          if (match) {
            processDescription = match[1].trim();
            console.log("✅ Found processDescription:", processDescription);
            break;
          }
        }
        
        // Final fallback: extract everything before section 2
        if (!processDescription) {
          const sections = details.description.split(/\n\n?✅ 2\./);
          if (sections.length > 1) {
            processDescription = sections[0]
              .replace(/✅ 1\. Process Name and Description\s*\n?/i, '')
              .trim();
            console.log("🔄 Fallback processDescription:", processDescription);
          }
        }
      }
      
      if (!trigger && details.description) {
        console.log("🔍 Trying to extract trigger from description...");
        
        const triggerPatterns = [
          /✅ 3\. Trigger \(Start Event\)\s*\n([\s\S]+?)(?=\n\n?✅|$)/,
          /✅ 3\. Trigger[\s\S]*?\n([\s\S]+?)(?=\n\n?✅|$)/,
          /Trigger[^:]*:?\s*\n([\s\S]+?)(?=\n✅|$)/
        ];
        
        for (const pattern of triggerPatterns) {
          const match = details.description.match(pattern);
          if (match) {
            trigger = match[1].trim();
            console.log("✅ Found trigger:", trigger);
            break;
          }
        }
      }
      
      const editData = {
        description: details.description,
        processDescription: processDescription,
        participants: [...(details.participants || [])],
        trigger: trigger,
        activities: [...(details.activities || [])],
        decisionPoints: [...(details.decisionPoints || [])],
        endEvent: details.endEvent || "",
        additionalElements: [...(details.additionalElements || [])],
      };
      
      console.log("📝 Final edit data:", editData);
      setEditedFlowDetails(editData);
    }
  };

  const saveFlowDetailsEdit = () => {
    if (editingFlowDetails && editedFlowDetails) {
      const updatedFlowDetails = {
        ...flowDetails,
        [editingFlowDetails]: editedFlowDetails,
      };
      setFlowDetails(updatedFlowDetails);
      localStorage.setItem("flowDetails", JSON.stringify(updatedFlowDetails));
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
    setEditedFlowDetails((prev) => ({
      ...prev!,
      [field]: value,
    }));
  };

  const addItemToField = (
    field:
      | "participants"
      | "activities"
      | "decisionPoints"
      | "additionalElements",
    defaultValue: string,
  ) => {
    if (!editedFlowDetails) return;
    setEditedFlowDetails((prev) => ({
      ...prev!,
      [field]: [...(prev![field] || []), defaultValue],
    }));
  };

  const updateItemInField = (
    field:
      | "participants"
      | "activities"
      | "decisionPoints"
      | "additionalElements",
    index: number,
    value: string,
  ) => {
    if (!editedFlowDetails) return;
    setEditedFlowDetails((prev) => {
      const newArray = [...(prev![field] || [])];
      newArray[index] = value;
      return {
        ...prev!,
        [field]: newArray,
      };
    });
  };

  const removeItemFromField = (
    field:
      | "participants"
      | "activities"
      | "decisionPoints"
      | "additionalElements",
    index: number,
  ) => {
    if (!editedFlowDetails) return;
    setEditedFlowDetails((prev) => ({
      ...prev!,
      [field]: (prev![field] || []).filter((_, i) => i !== index),
    }));
  };

  // Generate swimlane BPMN from flow details using client-side Gemini API
  const generateSwimlaneFromDetails = async (
    stakeholder: string,
    flowType: string,
  ) => {
    const flowKey = `${stakeholder}-${flowType}`;
    const details = flowDetails[flowKey];

    if (!details) {
      setError("Flow details not found. Please generate flow details first.");
      return;
    }

    setIsGeneratingBpmn((prev) => ({ ...prev, [flowKey]: true }));
    setError("");

    try {
      // Call Gemini API directly from client
      const { generateSwimlaneXml } = await import("../lib/gemini");
      const bpmnXml = await generateSwimlaneXml(stakeholder, flowType, details);

      // Update stakeholder flows with generated BPMN
      const updatedFlows = [...stakeholderFlows];
      const existingFlowIndex = updatedFlows.findIndex(
        (flow) =>
          flow.stakeholder === stakeholder && flow.flowType === flowType,
      );

      if (existingFlowIndex >= 0) {
        updatedFlows[existingFlowIndex] = {
          ...updatedFlows[existingFlowIndex],
          bpmnXml,
        };
      } else {
        updatedFlows.push({
          stakeholder,
          flowType,
          bpmnXml,
          customPrompt: "",
        });
      }

      updateStakeholderFlows(updatedFlows);
    } catch (err) {
      console.error("Error generating swimlane BPMN:", err);

      // Generate fallback BPMN on error
      console.log("Generating fallback BPMN for:", flowKey);
      const fallbackBpmn = generateFallbackBpmn(stakeholder, flowType, details);

      const updatedFlows = [...stakeholderFlows];
      const existingFlowIndex = updatedFlows.findIndex(
        (flow) =>
          flow.stakeholder === stakeholder && flow.flowType === flowType,
      );

      if (existingFlowIndex >= 0) {
        updatedFlows[existingFlowIndex] = {
          ...updatedFlows[existingFlowIndex],
          bpmnXml: fallbackBpmn,
        };
      } else {
        updatedFlows.push({
          stakeholder,
          flowType,
          bpmnXml: fallbackBpmn,
          customPrompt: "",
        });
      }

      updateStakeholderFlows(updatedFlows);
    } finally {
      setIsGeneratingBpmn((prev) => ({ ...prev, [flowKey]: false }));
    }
  };

  // Generate large-scale BPMN XML using advanced AI agent
  const generateBpmnWithAI = async (
    stakeholder: string,
    flowType: string,
  ) => {
    const flowKey = `${stakeholder}-${flowType}`;
    const details = flowDetails[flowKey];

    if (!details) {
      setError("Flow details not found. Please generate flow details first.");
      return;
    }

    setIsGeneratingBpmn((prev) => ({ ...prev, [flowKey]: true }));
    setError("");

    try {
      // Create structured workflow data for AI agent
      const workflowData = {
        processName: `${stakeholder} - ${flowType}`,
        processDescription: details.processDescription || details.description,
        participants: details.participants || [],
        trigger: details.trigger || "Process starts",
        activities: details.activities || [],
        decisionPoints: details.decisionPoints || [],
        endEvent: details.endEvent || "Process completes",
        additionalElements: details.additionalElements || [],
      };

      console.log("AI Agent processing 7-element workflow structure:", {
        "1. Process & Description": workflowData.processName,
        "2. Participants": workflowData.participants,
        "3. Trigger": workflowData.trigger,
        "4. Activities": workflowData.activities,
        "5. Decision Points": workflowData.decisionPoints,
        "6. End Event": workflowData.endEvent,
        "7. Additional Elements": workflowData.additionalElements,
      });

      // Determine complexity based on workflow characteristics
      const complexity = determineComplexity(workflowData);
      
      // Configure AI agent options
      const agentOptions = {
        complexity,
        includeSubProcesses: workflowData.activities.length > 8,
        includeMessageFlows: workflowData.participants.length > 2,
        includeTimerEvents: workflowData.additionalElements.some(el => 
          el.toLowerCase().includes('timer') || el.toLowerCase().includes('timeout')
        ),
        includeErrorHandling: workflowData.decisionPoints.length > 1,
        swimlaneLayout: 'horizontal' as const
      };

      console.log(`AI Agent configuration: ${complexity} complexity with advanced features`);

      // Initialize and run AI BPMN agent
      const { createAIBpmnAgent } = await import("../lib/ai-bpmn-agent");
      const aiAgent = createAIBpmnAgent();
      const bpmnXml = await aiAgent.generateLargeBpmn(workflowData, agentOptions);

      // Update stakeholder flows with generated BPMN
      const updatedFlows = [...stakeholderFlows];
      const existingFlowIndex = updatedFlows.findIndex(
        (flow) =>
          flow.stakeholder === stakeholder && flow.flowType === flowType,
      );

      if (existingFlowIndex >= 0) {
        updatedFlows[existingFlowIndex] = {
          ...updatedFlows[existingFlowIndex],
          bpmnXml,
        };
      } else {
        updatedFlows.push({
          stakeholder,
          flowType,
          bpmnXml,
          customPrompt: "",
        });
      }

      updateStakeholderFlows(updatedFlows);

      // Save the latest generated BPMN to localStorage for editor
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error(`Error generating AI BPMN for ${stakeholder} ${flowType}:`, error);
      setError(`Failed to generate AI BPMN diagram. Please try again.`);
    } finally {
      setIsGeneratingBpmn((prev) => ({ ...prev, [flowKey]: false }));
    }
  };

  // Helper function to determine process complexity
  const determineComplexity = (data: any): 'simple' | 'standard' | 'complex' | 'enterprise' => {
    const activityCount = data.activities.length;
    const participantCount = data.participants.length;
    const decisionCount = data.decisionPoints.length;
    const additionalCount = data.additionalElements.length;
    
    const complexityScore = activityCount + (participantCount * 2) + (decisionCount * 3) + additionalCount;
    
    if (complexityScore >= 25) return 'enterprise';
    if (complexityScore >= 15) return 'complex';
    if (complexityScore >= 8) return 'standard';
    return 'simple';
  };

  // Generate BPMN XML directly from structured data (No AI)
  const generateStructuredBpmn = async (
    stakeholder: string,
    flowType: string,
  ) => {
    const flowKey = `${stakeholder}-${flowType}`;
    const details = flowDetails[flowKey];

    if (!details) {
      setError("Flow details not found. Please generate flow details first.");
      return;
    }

    setIsGeneratingBpmn((prev) => ({ ...prev, [flowKey]: true }));
    setError("");

    try {
      // Create structured content from flow details
      const structuredContent = {
        processName: `${stakeholder} - ${flowType}`,
        processDescription: details.processDescription || details.description,
        participants: details.participants || [],
        trigger: details.trigger || "Process starts",
        activities: details.activities || [],
        decisionPoints: details.decisionPoints || [],
        endEvent: details.endEvent || "Process completes",
        additionalElements: details.additionalElements || [],
      };

      console.log("Generating BPMN using structured data converter...");

      // Generate BPMN XML using structured generator (no AI required)
      const { generateStructuredBpmn } = await import("../lib/structured-bpmn-generator");

      // Generate BPMN directly from structured content without AI
      const bpmnXml = generateStructuredBpmn(structuredContent);

      console.log(bpmnXml);

      // Update stakeholder flows with generated BPMN
      const updatedFlows = [...stakeholderFlows];
      const existingFlowIndex = updatedFlows.findIndex(
        (flow) =>
          flow.stakeholder === stakeholder && flow.flowType === flowType,
      );

      if (existingFlowIndex >= 0) {
        updatedFlows[existingFlowIndex] = {
          ...updatedFlows[existingFlowIndex],
          bpmnXml,
        };
      } else {
        updatedFlows.push({
          stakeholder,
          flowType,
          bpmnXml,
          customPrompt: "",
        });
      }

      updateStakeholderFlows(updatedFlows);

      // Save the latest generated BPMN to localStorage for editor
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error(`Error generating structured BPMN for ${stakeholder} ${flowType}:`, error);
      setError(`Failed to generate structured BPMN diagram. Please try again.`);
    } finally {
      setIsGeneratingBpmn((prev) => ({ ...prev, [flowKey]: false }));
    }
  };

  // Generate BPMN using best practices (Hybrid Validation Strategy)
  const generateBestPracticeBpmn = async (
    stakeholder: string,
    flowType: string,
  ) => {
    const flowKey = `${stakeholder}-${flowType}`;
    const details = flowDetails[flowKey];

    if (!details) {
      setError("Flow details not found. Please generate flow details first.");
      return;
    }

    setIsGeneratingBpmn((prev) => ({ ...prev, [flowKey]: true }));
    setError("");

    try {
      // Create structured content from flow details
      const structuredContent = {
        processName: `${stakeholder} - ${flowType}`,
        processDescription: details.processDescription || details.description,
        participants: details.participants || [],
        trigger: details.trigger || "Process starts",
        activities: details.activities || [],
        decisionPoints: details.decisionPoints || [],
        endEvent: details.endEvent || "Process completes",
        additionalElements: details.additionalElements || [],
      };

      console.log("Generating BPMN using best practice hybrid validation strategy...");

      // Use the recommended best practice strategy
      const strategies = BPMN_GENERATION_STRATEGIES;
      const bestStrategy = strategies.find(s => s.name === "Hybrid Validation");
      
      if (!bestStrategy) {
        throw new Error("Best practice strategy not found");
      }

      const bpmnXml = await bestStrategy.implementation(structuredContent);

      // Update stakeholder flows with generated BPMN
      const updatedFlows = [...stakeholderFlows];
      const existingFlowIndex = updatedFlows.findIndex(
        (flow) =>
          flow.stakeholder === stakeholder && flow.flowType === flowType,
      );

      if (existingFlowIndex >= 0) {
        updatedFlows[existingFlowIndex] = {
          ...updatedFlows[existingFlowIndex],
          bpmnXml,
        };
      } else {
        updatedFlows.push({
          stakeholder,
          flowType,
          bpmnXml,
          customPrompt: "",
        });
      }

      updateStakeholderFlows(updatedFlows);

      // Save the latest generated BPMN to localStorage for editor
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error(`Error generating best practice BPMN for ${stakeholder} ${flowType}:`, error);
      setError(`Failed to generate best practice BPMN diagram. Please try again.`);
    } finally {
      setIsGeneratingBpmn((prev) => ({ ...prev, [flowKey]: false }));
    }
  };



  // Generate fallback BPMN when API fails
  const generateFallbackBpmn = (
    stakeholder: string,
    flowType: string,
    details: {
      description: string;
      participants: string[];
      activities: string[];
    },
  ) => {
    // Create valid XML IDs by removing special characters
    const cleanStakeholder = stakeholder
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_");
    const cleanFlowType = flowType
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_");

    const processId = `Process_${cleanStakeholder}_${cleanFlowType}`;
    const poolId = `Pool_${cleanStakeholder}`;

    // Generate process elements based on activities
    const processElements = details.activities
      .map((activity, index) => {
        const taskId = `Activity_${index + 1}`;
        return `
    <bpmn:serviceTask id="${taskId}" name="${activity}" />`;
      })
      .join("");

    // Generate sequence flows between activities
    const sequenceFlows = details.activities
      .map((_, index) => {
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
      })
      .join("");

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
      ${details.activities
        .map(
          (activity, index) => `
      <bpmndi:BPMNShape id="Activity_${index + 1}_di" bpmnElement="Activity_${index + 1}">
        <dc:Bounds x="${300 + index * 150}" y="140" width="100" height="80" />
      </bpmndi:BPMNShape>`,
        )
        .join("")}
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="${320 + details.activities.length * 150}" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="324" y="205" width="28" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      ${details.activities
        .map((_, index) => {
          if (index === 0) {
            return `
      <bpmndi:BPMNEdge id="Flow_start_${index + 1}_di" bpmnElement="Flow_start_${index + 1}">
        <di:waypoint x="248" y="180" />
        <di:waypoint x="${300 + index * 150}" y="180" />
      </bpmndi:BPMNEdge>`;
          } else if (index === details.activities.length - 1) {
            return `
      <bpmndi:BPMNEdge id="Flow_${index}_end_di" bpmnElement="Flow_${index}_end">
        <di:waypoint x="${400 + index * 150}" y="180" />
        <di:waypoint x="${320 + details.activities.length * 150}" y="180" />
      </bpmndi:BPMNEdge>`;
          } else {
            return `
      <bpmndi:BPMNEdge id="Flow_${index}_${index + 1}_di" bpmnElement="Flow_${index}_${index + 1}">
        <di:waypoint x="${400 + index * 150}" y="180" />
        <di:waypoint x="${300 + (index + 1) * 150}" y="180" />
      </bpmndi:BPMNEdge>`;
          }
        })
        .join("")}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  };

  // Generate all swimlane diagrams
  const generateAllSwimlanes = async () => {
    const allFlows: { stakeholder: string; flowType: string }[] = [];

    // Collect all stakeholder-flow combinations that have details
    Object.entries(personaFlowTypes).forEach(([stakeholder, flowTypes]) => {
      flowTypes.forEach((flowType) => {
        const flowKey = `${stakeholder}-${flowType}`;
        if (flowDetails[flowKey]) {
          allFlows.push({ stakeholder, flowType });
        }
      });
    });

    if (allFlows.length === 0) {
      setError(
        "No flow details available. Please generate flow details first.",
      );
      return;
    }

    // Generate swimlanes for all flows sequentially
    for (const flow of allFlows) {
      await generateSwimlaneFromDetails(flow.stakeholder, flow.flowType);
      // Small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 100));
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
          <div className="flex items-center space-x-2"></div>
        </div>

        {/* Auto-generation Status */}
        {autoGenerationStatus && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-blue-800 font-medium">
                  {autoGenerationStatus}
                </span>
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
                  disabled={
                    isExtractingStakeholders ||
                    (!projectPlan && !projectDescription)
                  }
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
                <div className="space-y-3">
                  {/* Stakeholder Header with Inline Add */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Stakeholders ({extractedStakeholders.length})
                    </h4>
                  </div>
                  
                  {/* Add Stakeholder Input */}
                  <div className="flex gap-2">
                    <Input
                      value={newStakeholderName}
                      onChange={(e) => setNewStakeholderName(e.target.value)}
                      placeholder="Add stakeholder..."
                      className="text-xs h-7 flex-1 bg-gray-50 border-gray-200"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addStakeholder();
                        }
                      }}
                    />
                    <Button
                      onClick={addStakeholder}
                      size="sm"
                      className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {/* Enhanced Stakeholder Tags */}
                  <div className="flex flex-wrap gap-2">
                    {extractedStakeholders.map((stakeholder, index) => {
                      const stakeholderIcons = [User, Shield, Star, Target, Activity, Settings];
                      const StakeholderIcon = stakeholderIcons[index % stakeholderIcons.length];
                      
                      return (
                        <div key={index} className="group">
                          {editingStakeholder === stakeholder ? (
                            <div className="flex items-center gap-2 bg-white border-2 border-blue-300 rounded-lg px-3 py-2 shadow-sm">
                              <User className="h-3 w-3 text-blue-500" />
                              <Input
                                value={editedStakeholderName}
                                onChange={(e) => setEditedStakeholderName(e.target.value)}
                                className="text-sm h-5 w-28 border-0 p-0 focus:ring-0"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveStakeholderEdit();
                                  } else if (e.key === "Escape") {
                                    cancelStakeholderEdit();
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                onClick={saveStakeholderEdit}
                                size="sm"
                                className="h-5 w-5 p-0 bg-green-500 hover:bg-green-600"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={cancelStakeholderEdit}
                                size="sm"
                                variant="outline"
                                className="h-5 w-5 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer transition-all group pr-1 px-3 py-1.5 text-sm"
                            >
                              <StakeholderIcon className="h-3 w-3 mr-1.5" />
                              <span className="mr-2">{stakeholder}</span>
                              <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  onClick={() => startEditingStakeholder(stakeholder)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 hover:bg-blue-200 rounded"
                                >
                                  <Edit3 className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  onClick={() => deleteStakeholder(stakeholder)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 hover:bg-red-200 text-red-500 rounded"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <Workflow className="h-4 w-4 text-indigo-600" />
                      Flow Types Management
                    </h4>
                    <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700">
                      {Object.keys(personaFlowTypes).length} stakeholders
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(personaFlowTypes).map(
                      ([stakeholder, flowTypes], stakeholderIndex) => {
                        const colors = [
                          { bg: "bg-blue-50", border: "border-blue-200", accent: "bg-blue-500", text: "text-blue-700", icon: "User" },
                          { bg: "bg-emerald-50", border: "border-emerald-200", accent: "bg-emerald-500", text: "text-emerald-700", icon: "Shield" },
                          { bg: "bg-purple-50", border: "border-purple-200", accent: "bg-purple-500", text: "text-purple-700", icon: "Star" },
                          { bg: "bg-orange-50", border: "border-orange-200", accent: "bg-orange-500", text: "text-orange-700", icon: "Crown" },
                          { bg: "bg-cyan-50", border: "border-cyan-200", accent: "bg-cyan-500", text: "text-cyan-700", icon: "Target" },
                          { bg: "bg-green-50", border: "border-green-200", accent: "bg-green-500", text: "text-green-700", icon: "Briefcase" },
                        ];
                        const color = colors[stakeholderIndex % colors.length];
                        
                        const IconComponent = {
                          User: User,
                          Shield: Shield,
                          Star: Star,
                          Crown: User, // Crown not available, using User as fallback
                          Target: Target,
                          Briefcase: User, // Briefcase not available, using User as fallback
                        }[color.icon] || User;

                        return (
                          <div
                            key={stakeholder}
                            className={`${color.bg} ${color.border} border rounded-xl p-5 transition-all hover:shadow-md hover:scale-[1.01]`}
                          >
                            {/* Enhanced Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 ${color.accent} rounded-lg flex items-center justify-center shadow-sm`}>
                                  <IconComponent className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <span className={`font-semibold text-base ${color.text}`}>
                                    {stakeholder}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs h-5 px-2 bg-white/80 border-white/60">
                                      <Activity className="h-2.5 w-2.5 mr-1" />
                                      {flowTypes.length} flows
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => deleteStakeholder(stakeholder)}
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-white/60 hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Enhanced Flow Input */}
                            <div className="flex gap-2 mb-4">
                              <div className="relative flex-1">
                                <FileText className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <Input
                                  value={newFlowType[stakeholder] || ""}
                                  onChange={(e) =>
                                    setNewFlowType((prev) => ({
                                      ...prev,
                                      [stakeholder]: e.target.value,
                                    }))
                                  }
                                  placeholder="Add new flow type..."
                                  className="text-sm h-8 pl-7 bg-white/90 border-white/60 placeholder:text-gray-400"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      addFlowType(stakeholder);
                                    }
                                  }}
                                />
                              </div>
                              <Button
                                onClick={() => addFlowType(stakeholder)}
                                size="sm"
                                className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>

                            {/* Enhanced Flow Tags */}
                            <div className="flex flex-wrap gap-2">
                              {flowTypes.map((flowType, index) => {
                                const editKey = `${stakeholder}-${flowType}`;
                                const isEditing = editingFlowType === editKey;

                                return (
                                  <div key={index} className="group">
                                    {isEditing ? (
                                      <div className="flex items-center gap-2 bg-white border-2 border-blue-300 rounded-lg px-3 py-2">
                                        <Input
                                          value={editedFlowTypeName}
                                          onChange={(e) => setEditedFlowTypeName(e.target.value)}
                                          className="text-sm h-5 w-28 border-0 p-0 focus:ring-0"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              saveFlowTypeEdit(stakeholder, flowType);
                                            } else if (e.key === "Escape") {
                                              cancelFlowTypeEdit();
                                            }
                                          }}
                                          autoFocus
                                        />
                                        <Button
                                          onClick={() => saveFlowTypeEdit(stakeholder, flowType)}
                                          size="sm"
                                          className="h-5 w-5 p-0 bg-green-500"
                                        >
                                          <Save className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          onClick={cancelFlowTypeEdit}
                                          size="sm"
                                          variant="outline"
                                          className="h-5 w-5 p-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-sm px-3 py-1.5 bg-white/90 hover:bg-white cursor-pointer transition-all group border border-white/60 hover:border-white"
                                      >
                                        <Zap className="h-3 w-3 mr-1.5 text-gray-500" />
                                        <span className="mr-2">{flowType}</span>
                                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            onClick={() => startEditingFlowType(stakeholder, flowType)}
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0 hover:bg-blue-100 rounded"
                                          >
                                            <Edit3 className="h-2.5 w-2.5" />
                                          </Button>
                                          <Button
                                            onClick={() => deleteFlowType(stakeholder, flowType)}
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0 hover:bg-red-100 text-red-500 rounded"
                                          >
                                            <X className="h-2.5 w-2.5" />
                                          </Button>
                                        </div>
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                              
                              {/* Quick Add Flow Button */}
                              {flowTypes.length === 0 && (
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <ArrowRight className="h-3 w-3" />
                                  <span>Add your first flow type above</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-xs mb-3">
                  Extract stakeholders from your project plan or add manually
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    value={newStakeholderName}
                    onChange={(e) => setNewStakeholderName(e.target.value)}
                    placeholder="Enter stakeholder name..."
                    className="text-xs h-7 w-40 bg-gray-50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addStakeholder();
                      }
                    }}
                  />
                  <Button
                    onClick={addStakeholder}
                    size="sm"
                    className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        

        {/* Generate Flow Details Button */}
        {Object.keys(personaFlowTypes).length > 0 &&
          Object.values(flowDetails).length === 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6 text-center">
                <div className="space-y-4">
                  <div>
                    <Activity className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Generate Flow Analysis
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Generate detailed analysis for all stakeholder flows
                      including descriptions, key components, and processes
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

        {/* Flow Generation Progress Indicator */}
        {isGeneratingFlowDetails && flowGenerationProgress.total > 0 && (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50 mb-6">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Generating Flow Details</h3>
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    {flowGenerationProgress.current} / {flowGenerationProgress.total}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${(flowGenerationProgress.current / flowGenerationProgress.total) * 100}%` 
                    }}
                  ></div>
                </div>
                
                {/* Current Flow and Status */}
                <div className="space-y-1">
                  {flowGenerationProgress.currentFlow && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-blue-700">Current:</span>
                      <span className="text-gray-700">{flowGenerationProgress.currentFlow}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    {flowGenerationProgress.status}
                  </div>
                </div>
                
                {/* Completed Flows List */}
                {flowGenerationProgress.completedFlows.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Completed Flows ({flowGenerationProgress.completedFlows.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {flowGenerationProgress.completedFlows.slice(-6).map((flowKey, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />
                          {flowKey.replace('-', ' - ')}
                        </Badge>
                      ))}
                      {flowGenerationProgress.completedFlows.length > 6 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600">
                          +{flowGenerationProgress.completedFlows.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
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
                <div className="flex items-center gap-2">
                  <Button
                    onClick={generateFlowDetails}
                    disabled={isGeneratingFlowDetails}
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    {isGeneratingFlowDetails ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Activity className="h-3 w-3 mr-1" />
                    )}
                    Re-generate Details
                  </Button>
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
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(personaFlowTypes).map(
                  ([stakeholder, flowTypes], stakeholderIndex) => {
                    const colorVariants = [
                      "from-blue-500 to-cyan-600",
                      "from-emerald-500 to-teal-600",
                      "from-orange-500 to-red-600",
                      "from-purple-500 to-pink-600",
                      "from-indigo-500 to-blue-600",
                      "from-green-500 to-emerald-600",
                    ];
                    const bgVariants = [
                      "from-blue-50 to-cyan-50",
                      "from-emerald-50 to-teal-50",
                      "from-orange-50 to-red-50",
                      "from-purple-50 to-pink-50",
                      "from-indigo-50 to-blue-50",
                      "from-green-50 to-emerald-50",
                    ];
                    const borderVariants = [
                      "border-blue-200",
                      "border-emerald-200",
                      "border-orange-200",
                      "border-purple-200",
                      "border-indigo-200",
                      "border-green-200",
                    ];

                    const colorClass =
                      colorVariants[stakeholderIndex % colorVariants.length];
                    const bgClass =
                      bgVariants[stakeholderIndex % bgVariants.length];
                    const borderClass =
                      borderVariants[stakeholderIndex % borderVariants.length];

                    return (
                      <div
                        key={stakeholder}
                        className={`border ${borderClass} rounded-lg p-3 bg-gradient-to-br ${bgClass}`}
                      >
                        {/* Stakeholder Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 bg-gradient-to-r ${colorClass} rounded-md flex items-center justify-center`}
                            >
                              <User className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-800">
                                {stakeholder}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {flowTypes.length} flows
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => addNewFlow(stakeholder)}
                            variant="outline"
                            size="sm"
                            className="text-xs px-2 py-1 h-6 border-gray-300 hover:bg-white"
                          >
                            <Plus className="h-2.5 w-2.5 mr-1" />
                            Add
                          </Button>
                        </div>
                        {/* Flow Types */}
                        <div className="space-y-2">
                          {flowTypes.map((flowType, flowIndex) => {
                            const flowKey = `${stakeholder}-${flowType}`;
                            const details = flowDetails[flowKey];
                            const existingFlow = stakeholderFlows.find(
                              (f) =>
                                f.stakeholder === stakeholder &&
                                f.flowType === flowType,
                            );

                            return (
                              <div
                                key={flowIndex}
                                className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-md p-2 shadow-sm mt-[20px] mb-[20px]"
                              >
                                {/* Flow Header - Compact */}
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-gray-800 flex-1 mr-2 text-[16px] font-bold">
                                    {flowType}
                                  </h4>
                                  <div className="flex items-center gap-1">
                                    {details && editingFlowDetails !== flowKey && (
                                      <Button
                                        onClick={() => startEditingFlowDetails(flowKey)}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs px-1 py-0.5 h-5 border-gray-300 hover:bg-blue-50"
                                      >
                                        <Edit3 className="h-2.5 w-2.5" />
                                      </Button>
                                    )}
                                    <Button
                                      onClick={() => generateBpmnWithAI(stakeholder, flowType)}
                                      disabled={isGeneratingBpmn[flowKey] || !details}
                                      size="sm"
                                      className={`text-xs px-2 py-0.5 h-5 bg-gradient-to-r ${colorClass} hover:opacity-90 text-white`}
                                    >
                                      {isGeneratingBpmn[flowKey] ? (
                                        <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                                      ) : (
                                        <Sparkles className="h-2.5 w-2.5 mr-1" />
                                      )}
                                      AI
                                    </Button>
                                    <Button
                                      onClick={() => generateStructuredBpmn(stakeholder, flowType)}
                                      disabled={isGeneratingBpmn[flowKey] || !details}
                                      size="sm"
                                      className="text-xs px-2 py-0.5 h-5 bg-gradient-to-r from-gray-600 to-gray-700 hover:opacity-90 text-white"
                                    >
                                      {isGeneratingBpmn[flowKey] ? (
                                        <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                                      ) : (
                                        <Zap className="h-2.5 w-2.5 mr-1" />
                                      )}
                                      Template
                                    </Button>
                                    
                                    {existingFlow?.bpmnXml && (
                                      <>
                                        <Button
                                          onClick={() => openInEditor(stakeholder, flowType)}
                                          variant="outline"
                                          size="sm"
                                          className="text-xs px-2 py-0.5 h-5 border-purple-300 hover:bg-purple-50 text-purple-600"
                                        >
                                          <Edit3 className="h-2.5 w-2.5 mr-1" />
                                          Editor
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {/* Flow Details */}
                                {details && (
                                  <div className="space-y-2 mb-2">
                                    {editingFlowDetails === flowKey &&
                                    editedFlowDetails ? (
                                      /* Edit Mode - Compact */
                                      (<div className="space-y-2 p-2 bg-blue-50/50 rounded border border-blue-200">
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
                                        {/* Participants - Compact */}
                                        <div>
                                          <div className="flex items-center justify-between mb-0.5">
                                            <label className="text-xs font-medium text-gray-600">Participants</label>
                                            <Button
                                              onClick={() => addItemToField("participants", "New Participant")}
                                              size="sm"
                                              variant="outline"
                                              className="h-4 px-1 text-xs"
                                            >
                                              <Plus className="h-2 w-2" />
                                            </Button>
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {editedFlowDetails.participants.map((participant, idx) => (
                                              <div key={idx} className="flex items-center gap-0.5 bg-gray-100 rounded px-1 py-0.5">
                                                <Input
                                                  value={participant}
                                                  onChange={(e) => updateItemInField("participants", idx, e.target.value)}
                                                  className="text-xs h-4 w-20 border-0 bg-transparent p-0"
                                                />
                                                <Button
                                                  onClick={() => removeItemFromField("participants", idx)}
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-3 w-3 p-0 text-red-500 hover:bg-red-100"
                                                >
                                                  <X className="h-2 w-2" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        {/* Activities - Compact */}
                                        <div>
                                          <div className="flex items-center justify-between mb-0.5">
                                            <label className="text-xs font-medium text-gray-600">Activities</label>
                                            <Button
                                              onClick={() => addItemToField("activities", "New Activity")}
                                              size="sm"
                                              variant="outline"
                                              className="h-4 px-1 text-xs"
                                            >
                                              <Plus className="h-2 w-2" />
                                            </Button>
                                          </div>
                                          <div className="space-y-0.5">
                                            {editedFlowDetails.activities.map((activity, idx) => (
                                              <div key={idx} className="flex items-center gap-1">
                                                <Input
                                                  value={activity}
                                                  onChange={(e) => updateItemInField("activities", idx, e.target.value)}
                                                  className="text-xs h-5 flex-1"
                                                />
                                                <Button
                                                  onClick={() => removeItemFromField("activities", idx)}
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-5 w-5 p-0 border-red-300 hover:bg-red-50 text-red-600"
                                                >
                                                  <X className="h-2 w-2" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        {/* Edit Additional Elements */}
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-medium text-gray-600">
                                              Additional Elements
                                            </label>
                                            <Button
                                              onClick={() =>
                                                addItemToField(
                                                  "additionalElements",
                                                  "Messages: New notification",
                                                )
                                              }
                                              size="sm"
                                              variant="outline"
                                              className="h-5 px-1.5 text-xs"
                                            >
                                              <Plus className="h-2.5 w-2.5" />
                                            </Button>
                                          </div>
                                          <div className="space-y-1">
                                            {editedFlowDetails.additionalElements.map(
                                              (element, idx) => (
                                                <div
                                                  key={idx}
                                                  className="flex items-center gap-1"
                                                >
                                                  <Input
                                                    value={element}
                                                    onChange={(e) =>
                                                      updateItemInField(
                                                        "additionalElements",
                                                        idx,
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="text-xs h-6 flex-1"
                                                  />
                                                  <Button
                                                    onClick={() =>
                                                      removeItemFromField(
                                                        "additionalElements",
                                                        idx,
                                                      )
                                                    }
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 w-6 p-0 border-red-300 hover:bg-red-50 text-red-600"
                                                  >
                                                    <X className="h-2.5 w-2.5" />
                                                  </Button>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      </div>)
                                    ) : (
                                      /* Display Mode */
                                      (<>
                                        {/* BPMN Flow Analysis - 7 Section Structure */}
                                        <div className="space-y-3">
                                          {/* Section 1: Process Description */}
                                          <div className="group">
                                            <div className="flex items-center justify-between mb-1">
                                              <Badge className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 border-0 flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                1. Process & Description
                                              </Badge>
                                              <Button
                                                onClick={() =>
                                                  startEditingFlowDetails(
                                                    flowKey,
                                                  )
                                                }
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Edit3 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <p className="text-xs text-gray-700 leading-relaxed pl-2 border-l-2 border-purple-200">
                                              {details.processDescription ||
                                                details.description
                                                  .split("\n\n✅ 2.")[0]
                                                  .replace(
                                                    "✅ 1. Process Name and Description\n",
                                                    "",
                                                  )}
                                            </p>
                                          </div>

                                          {/* Section 2: Participants (Swimlanes) - Editable */}
                                          <div className="group">
                                            <div className="flex items-center justify-between mb-1">
                                              <Badge className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border-0 flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                2. Participants (Swimlanes)
                                              </Badge>
                                              <Button
                                                onClick={() =>
                                                  startEditingFlowDetails(
                                                    flowKey,
                                                  )
                                                }
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Edit3 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                              {details.participants?.map(
                                                (participant, idx) => (
                                                  <Badge
                                                    key={idx}
                                                    variant="outline"
                                                    className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
                                                  >
                                                    {participant}
                                                  </Badge>
                                                ),
                                              )}
                                            </div>
                                          </div>

                                          {/* Section 3: Trigger (Start Event) */}
                                          <div className="group">
                                            <div className="flex items-center justify-between mb-1">
                                              <Badge className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border-0 flex items-center gap-1">
                                                <Play className="h-3 w-3" />
                                                3. Trigger (Start Event)
                                              </Badge>
                                              <Button
                                                onClick={() =>
                                                  startEditingFlowDetails(
                                                    flowKey,
                                                  )
                                                }
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Edit3 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <p className="text-xs text-gray-600 pl-2 border-l-2 border-green-200">
                                              {details.trigger ||
                                                (() => {
                                                  const triggerSection =
                                                    details.description.match(
                                                      /✅ 3\. Trigger \(Start Event\)\n([^✅]*)/,
                                                    );
                                                  return triggerSection
                                                    ? triggerSection[1].trim()
                                                    : "Process initiates when conditions are met";
                                                })()}
                                            </p>
                                          </div>

                                          {/* Section 4: Activities - Editable */}
                                          <div className="group">
                                            <div className="flex items-center justify-between mb-1">
                                              <Badge className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 border-0 flex items-center gap-1">
                                                <Activity className="h-3 w-3" />
                                                4. Activities (Tasks)
                                              </Badge>
                                              <Button
                                                onClick={() =>
                                                  startEditingFlowDetails(
                                                    flowKey,
                                                  )
                                                }
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Edit3 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <div className="space-y-1">
                                              {details.activities?.map(
                                                (activity, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="flex items-center gap-2"
                                                  >
                                                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                                                    <span className="text-xs text-gray-600">
                                                      {activity}
                                                    </span>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>

                                          {/* Section 5: Decision Points - Editable */}
                                          <div className="group">
                                            <div className="flex items-center justify-between mb-1">
                                              <Badge className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 border-0 flex items-center gap-1">
                                                <GitBranch className="h-3 w-3" />
                                                5. Decision Points (Gateways)
                                              </Badge>
                                              <Button
                                                onClick={() =>
                                                  startEditingFlowDetails(
                                                    flowKey,
                                                  )
                                                }
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Edit3 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <div className="text-xs text-gray-600 pl-2 border-l-2 border-yellow-200 space-y-1">
                                              {details.decisionPoints &&
                                              details.decisionPoints.length > 0
                                                ? details.decisionPoints.map(
                                                    (decision, idx) => (
                                                      <div
                                                        key={idx}
                                                        className="flex items-start gap-2"
                                                      >
                                                        <div className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                        <span>
                                                          {decision.trim()}
                                                        </span>
                                                      </div>
                                                    ),
                                                  )
                                                : (() => {
                                                    const decisionSection =
                                                      details.description.match(
                                                        /✅ 5\. Decision Points \(Gateways\)\n([^✅]*)/,
                                                      );
                                                    if (decisionSection) {
                                                      return decisionSection[1]
                                                        .trim()
                                                        .split("\n")
                                                        .map(
                                                          (decision, idx) => (
                                                            <div
                                                              key={idx}
                                                              className="flex items-start gap-2"
                                                            >
                                                              <div className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                              <span>
                                                                {decision.trim()}
                                                              </span>
                                                            </div>
                                                          ),
                                                        );
                                                    }
                                                    return (
                                                      <span>
                                                        Standard validation and
                                                        approval gates
                                                      </span>
                                                    );
                                                  })()}
                                            </div>
                                          </div>

                                          {/* Section 6: End Event */}
                                          <div className="group">
                                            <div className="flex items-center justify-between mb-1">
                                              <Badge className="text-xs px-2 py-0.5 bg-red-100 text-red-700 border-0 flex items-center gap-1">
                                                <StopCircle className="h-3 w-3" />
                                                6. End Event
                                              </Badge>
                                              <Button
                                                onClick={() =>
                                                  startEditingFlowDetails(
                                                    flowKey,
                                                  )
                                                }
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Edit3 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <p className="text-xs text-gray-600 pl-2 border-l-2 border-red-200">
                                              {details.endEvent ||
                                                (() => {
                                                  const endSection =
                                                    details.description.match(
                                                      /✅ 6\. End Event\n([^✅]*)/,
                                                    );
                                                  return endSection
                                                    ? endSection[1].trim()
                                                    : "Process completes when all objectives are met";
                                                })()}
                                            </p>
                                          </div>

                                          {/* Section 7: Additional Elements - Editable */}
                                          <div className="group">
                                            <div className="flex items-center justify-between mb-1">
                                              <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 border-0 flex items-center gap-1">
                                                <Cog className="h-3 w-3" />
                                                7. Additional Elements
                                              </Badge>
                                              <Button
                                                onClick={() =>
                                                  startEditingFlowDetails(
                                                    flowKey,
                                                  )
                                                }
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Edit3 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <div className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
                                              <div className="grid grid-cols-1 gap-1">
                                                {details.additionalElements &&
                                                details.additionalElements
                                                  .length > 0
                                                  ? details.additionalElements.map(
                                                      (element, idx) => {
                                                        if (
                                                          element.includes(
                                                            "Messages:",
                                                          )
                                                        ) {
                                                          return (
                                                            <div
                                                              key={idx}
                                                              className="flex items-center gap-2"
                                                            >
                                                              <Badge
                                                                variant="outline"
                                                                className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 border-blue-200"
                                                              >
                                                                📧 Messages
                                                              </Badge>
                                                              <span>
                                                                {element
                                                                  .replace(
                                                                    "Messages:",
                                                                    "",
                                                                  )
                                                                  .trim()}
                                                              </span>
                                                            </div>
                                                          );
                                                        } else if (
                                                          element.includes(
                                                            "Timers:",
                                                          )
                                                        ) {
                                                          return (
                                                            <div
                                                              key={idx}
                                                              className="flex items-center gap-2"
                                                            >
                                                              <Badge
                                                                variant="outline"
                                                                className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-600 border-orange-200"
                                                              >
                                                                ⏱️ Timers
                                                              </Badge>
                                                              <span>
                                                                {element
                                                                  .replace(
                                                                    "Timers:",
                                                                    "",
                                                                  )
                                                                  .trim()}
                                                              </span>
                                                            </div>
                                                          );
                                                        } else if (
                                                          element.includes(
                                                            "Data",
                                                          )
                                                        ) {
                                                          return (
                                                            <div
                                                              key={idx}
                                                              className="flex items-center gap-2"
                                                            >
                                                              <Badge
                                                                variant="outline"
                                                                className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 border-green-200"
                                                              >
                                                                📄 Data
                                                              </Badge>
                                                              <span>
                                                                {element
                                                                  .replace(
                                                                    "Data Objects:",
                                                                    "",
                                                                  )
                                                                  .trim()}
                                                              </span>
                                                            </div>
                                                          );
                                                        }
                                                        return (
                                                          <div
                                                            key={idx}
                                                            className="flex items-center gap-2"
                                                          >
                                                            <Badge
                                                              variant="outline"
                                                              className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200"
                                                            >
                                                              📋 Element
                                                            </Badge>
                                                            <span>
                                                              {element}
                                                            </span>
                                                          </div>
                                                        );
                                                      },
                                                    )
                                                  : (() => {
                                                      const additionalSection =
                                                        details.description.match(
                                                          /✅ 7\. Additional Elements\n([^$]*)/,
                                                        );
                                                      if (additionalSection) {
                                                        const elements =
                                                          additionalSection[1]
                                                            .trim()
                                                            .split("\n");
                                                        return elements.map(
                                                          (element, idx) => {
                                                            if (
                                                              element.includes(
                                                                "Messages:",
                                                              )
                                                            ) {
                                                              return (
                                                                <div
                                                                  key={idx}
                                                                  className="flex items-center gap-2"
                                                                >
                                                                  <Badge
                                                                    variant="outline"
                                                                    className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 border-blue-200"
                                                                  >
                                                                    📧 Messages
                                                                  </Badge>
                                                                  <span>
                                                                    {element
                                                                      .replace(
                                                                        "Messages:",
                                                                        "",
                                                                      )
                                                                      .trim()}
                                                                  </span>
                                                                </div>
                                                              );
                                                            } else if (
                                                              element.includes(
                                                                "Timers:",
                                                              )
                                                            ) {
                                                              return (
                                                                <div
                                                                  key={idx}
                                                                  className="flex items-center gap-2"
                                                                >
                                                                  <Badge
                                                                    variant="outline"
                                                                    className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-600 border-orange-200"
                                                                  >
                                                                    ⏱️ Timers
                                                                  </Badge>
                                                                  <span>
                                                                    {element
                                                                      .replace(
                                                                        "Timers:",
                                                                        "",
                                                                      )
                                                                      .trim()}
                                                                  </span>
                                                                </div>
                                                              );
                                                            } else if (
                                                              element.includes(
                                                                "Data",
                                                              )
                                                            ) {
                                                              return (
                                                                <div
                                                                  key={idx}
                                                                  className="flex items-center gap-2"
                                                                >
                                                                  <Badge
                                                                    variant="outline"
                                                                    className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 border-green-200"
                                                                  >
                                                                    📄 Data
                                                                  </Badge>
                                                                  <span>
                                                                    {element
                                                                      .replace(
                                                                        "Data Objects:",
                                                                        "",
                                                                      )
                                                                      .trim()}
                                                                  </span>
                                                                </div>
                                                              );
                                                            }
                                                            return null;
                                                          },
                                                        );
                                                      }
                                                      return (
                                                        <div className="flex items-center gap-2">
                                                          <Badge
                                                            variant="outline"
                                                            className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200"
                                                          >
                                                            📋 Standard
                                                          </Badge>
                                                          <span>
                                                            Forms,
                                                            notifications, and
                                                            system logs
                                                          </span>
                                                        </div>
                                                      );
                                                    })()}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </>)
                                    )}
                                  </div>
                                )}
                                {/* BPMN Script Display */}
                                {existingFlow?.bpmnXml && (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-blue-100 text-blue-700"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        BPMN Script Generated
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          onClick={() =>
                                            copyXmlToClipboard(
                                              existingFlow.bpmnXml,
                                            )
                                          }
                                          variant="outline"
                                          size="sm"
                                          className="text-xs px-2 py-1 h-6 border-gray-300"
                                        >
                                          <Copy className="h-3 w-3 mr-1" />
                                          Copy Script
                                        </Button>
                                        <Link href="/bpmn-editor">
                                          <Button
                                            onClick={() =>
                                              openInEditor(existingFlow.bpmnXml)
                                            }
                                            size="sm"
                                            className="text-xs px-2 py-1 h-6 bg-gray-600 hover:bg-gray-700 text-white"
                                          >
                                            <Navigation className="h-3 w-3 mr-1" />
                                            Editor
                                          </Button>
                                        </Link>
                                      </div>
                                    </div>
                                    
                                    {/* BPMN Tabbed View */}
                                    <Tabs defaultValue="diagram" className="w-full">
                                      <TabsList className="grid w-full grid-cols-2 bg-gray-100 mb-3">
                                        <TabsTrigger value="diagram" className="text-xs">
                                          📊 Visual Diagram
                                        </TabsTrigger>
                                        <TabsTrigger value="script" className="text-xs">
                                          📄 XML Script
                                        </TabsTrigger>
                                      </TabsList>

                                      <TabsContent value="diagram" className="mt-0">
                                        <div className="bg-white rounded-lg border w-full">
                                          <SimpleBpmnViewer
                                            bpmnXml={existingFlow.bpmnXml}
                                            title={`${stakeholder} - ${flowType}`}
                                            height="450px"
                                          />
                                        </div>
                                      </TabsContent>

                                      <TabsContent value="script" className="mt-0">
                                        <div className="bg-gray-50 rounded-lg border">
                                          <div className="px-3 py-2 border-b bg-gray-100 rounded-t-lg">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <p className="text-xs font-medium text-gray-700">
                                                  BPMN 2.0 XML Script - {stakeholder} {flowType}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  {existingFlow.bpmnXml.length} characters
                                                </p>
                                              </div>
                                              <Button
                                                onClick={() =>
                                                  copyXmlToClipboard(
                                                    existingFlow.bpmnXml,
                                                  )
                                                }
                                                variant="outline"
                                                size="sm"
                                                className="text-xs px-2 py-1 h-6 border-gray-300"
                                              >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="p-3">
                                            <pre className="text-xs text-gray-800 overflow-auto whitespace-pre-wrap bg-white rounded border p-3 max-h-96 font-mono leading-relaxed">
                                              {existingFlow.bpmnXml}
                                            </pre>
                                          </div>
                                        </div>
                                      </TabsContent>
                                    </Tabs>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  },
                )}
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

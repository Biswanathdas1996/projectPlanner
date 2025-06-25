import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NavigationBar } from "@/components/navigation-bar";
import { WorkflowProgress } from "@/components/workflow-progress";
import {
  createAICodeGenerator,
  type CodeGenerationConfig,
  type ProjectStructure,
  type GenerationProgress,
} from "@/lib/ai-code-generator";
import { STORAGE_KEYS } from "@/lib/bpmn-utils";
import {
  Code,
  Database,
  FolderTree,
  FileText,
  Download,
  Copy,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Layers,
  Server,
  Globe,
  Settings,
  Zap,
  BookOpen,
  GitBranch,
  Package,
  Activity,
  Clock,
} from "lucide-react";
import { FlowDiagramViewer } from "@/components/flow-diagram-viewer";

interface ProjectFlow {
  id: string;
  title: string;
  description: string;
  flowData: any;
  category: "onboarding" | "core" | "management";
  priority: "high" | "medium" | "low";
  createdAt: string;
}

export default function CodeGenerator() {
  const [projectPlan, setProjectPlan] = useState("");
  const [stakeholderFlows, setStakeholderFlows] = useState("");
  const [config, setConfig] = useState<CodeGenerationConfig>({
    projectName: "",
    framework: "react",
    backend: "node",
    database: "postgresql",
    styling: "tailwind",
    features: [],
    deployment: "vercel",
  });
  const [generatedProject, setGeneratedProject] =
    useState<ProjectStructure | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] =
    useState<GenerationProgress>({
      current: 0,
      total: 0,
      status: "",
      currentTask: "",
    });
  const [codeGenerator, setCodeGenerator] = useState<any>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [flows, setFlows] = useState<ProjectFlow[]>([]);
  const [consolidatedFlow, setConsolidatedFlow] = useState<ProjectFlow | null>(
    null
  );
  const [isGeneratingConsolidatedFlow, setIsGeneratingConsolidatedFlow] =
    useState(false);

  // Download combined localStorage data
  const downloadProjectData = () => {
    try {
      // Get data from localStorage
      const projectDescription = localStorage.getItem("bpmn-project-description") || "No project description found";
      const projectFlowData = localStorage.getItem("project-flow-data-intrim") || "No project flow data found";
      const pageContentCards = localStorage.getItem("page_content_cards") || "No page content cards found";
      const brandGuidelines = localStorage.getItem("brand-guidelines-external") || "No brand guidelines found";

      // Parse JSON data safely
      const parseJsonSafely = (data: string, fallback: string) => {
        try {
          return JSON.stringify(JSON.parse(data), null, 2);
        } catch {
          return data;
        }
      };

      // Combine all data into a single text format
      const combinedData = `
PROJECT DATA EXPORT
===================
Generated: ${new Date().toISOString()}

1. PROJECT DESCRIPTION (bpmn-project-description)
================================================
${parseJsonSafely(projectDescription, projectDescription)}

2. PROJECT FLOW DATA (project-flow-data-intrim)
===============================================
${parseJsonSafely(projectFlowData, projectFlowData)}

3. PAGE CONTENT CARDS (page_content_cards)
==========================================
${parseJsonSafely(pageContentCards, pageContentCards)}

4. BRAND GUIDELINES (brand-guidelines-external)
===============================================
${parseJsonSafely(brandGuidelines, brandGuidelines)}

===============================================
End of Project Data Export
===============================================
`;

      // Create and download the file
      const blob = new Blob([combinedData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-data-export-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Project data downloaded successfully');
    } catch (error) {
      console.error('Error downloading project data:', error);
    }
  };

  // Load data from localStorage
  useEffect(() => {
    // Load project plan from multiple possible sources
    const projectPlanSources = [
      localStorage.getItem(STORAGE_KEYS.PROJECT_PLAN),
      localStorage.getItem(STORAGE_KEYS.PROJECT_DESCRIPTION),
      localStorage.getItem("project-plan"),
    ];
    const savedProjectPlan = projectPlanSources.find(
      (plan) => plan && plan.trim()
    );

    // Load stakeholder flows from multiple possible sources
    const stakeholderFlowSources = [
      localStorage.getItem(STORAGE_KEYS.STAKEHOLDER_FLOWS),
      localStorage.getItem(STORAGE_KEYS.STAKEHOLDER_FLOW_DATA),
      localStorage.getItem("stakeholder-flow-data"),
      localStorage.getItem("stakeholder_analysis"),
      localStorage.getItem("flow_details"),
    ];
    const savedStakeholderData = stakeholderFlowSources.find(
      (data) => data && data.trim()
    );

    // Load ALL flows from localStorage - comprehensive workflow extraction
    const loadedFlows: ProjectFlow[] = [];

    // Get all localStorage keys that might contain workflow data
    const allKeys = Object.keys(localStorage);
    const workflowKeys = allKeys.filter(
      (key) =>
        key.includes("flow") ||
        key.includes("Flow") ||
        key.includes("diagram") ||
        key.includes("Diagram") ||
        key.includes("workflow") ||
        key.includes("Workflow") ||
        key.includes("process") ||
        key.includes("Process")
    );

    console.log("Found workflow keys in localStorage:", workflowKeys);

    workflowKeys.forEach((key) => {
      try {
        const rawData = localStorage.getItem(key);
        if (!rawData || rawData.trim() === "") return;

        const data = JSON.parse(rawData);
        console.log(`Processing ${key}:`, data);

        // Handle different data structures
        if (typeof data === "object" && data !== null) {
          // Case 1: Direct flow data with nodes/edges
          if (data.nodes && data.edges) {
            loadedFlows.push(createFlowFromData(key, data));
          }
          // Case 2: Object containing multiple flows
          else if (typeof data === "object") {
            Object.keys(data).forEach((subKey) => {
              const flowData = data[subKey];
              if (flowData && typeof flowData === "object") {
                // Check if it has flow structure
                if (flowData.nodes || flowData.flowData || flowData.title) {
                  loadedFlows.push(
                    createFlowFromData(`${key}-${subKey}`, flowData)
                  );
                }
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error parsing ${key}:`, error);
      }
    });

    console.log("Total flows loaded:", loadedFlows.length);
    setFlows(loadedFlows);

    // Load consolidated master flow from localStorage
    const consolidatedFlowData = localStorage.getItem("consolidatedMasterFlow");
    if (consolidatedFlowData) {
      try {
        const parsedConsolidatedFlow = JSON.parse(consolidatedFlowData);
        setConsolidatedFlow(parsedConsolidatedFlow);
        console.log("✅ Loaded consolidated master flow from localStorage");
      } catch (error) {
        console.error("Error parsing consolidated master flow:", error);
      }
    }

    if (savedProjectPlan) {
      setProjectPlan(savedProjectPlan);
    }
    if (savedStakeholderData) {
      setStakeholderFlows(savedStakeholderData);
    }

    setDataLoaded(true);
  }, []);

  const createFlowFromData = (key: string, data: any): ProjectFlow => {
    return {
      id: `project-${key}`,
      title:
        data.title ||
        key
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase()),
      description: data.description || `Process workflow for ${key}`,
      flowData: data.flowData || data,
      category: determineCategory(key),
      priority: determinePriority(key),
      createdAt: new Date().toISOString(),
    };
  };

  const determineCategory = (
    key: string
  ): "onboarding" | "core" | "management" => {
    if (
      key.includes("onboard") ||
      key.includes("register") ||
      key.includes("setup")
    )
      return "onboarding";
    if (
      key.includes("manage") ||
      key.includes("admin") ||
      key.includes("settings")
    )
      return "management";
    return "core";
  };

  const determinePriority = (key: string): "high" | "medium" | "low" => {
    if (
      key.includes("critical") ||
      key.includes("main") ||
      key.includes("primary")
    )
      return "high";
    if (key.includes("secondary") || key.includes("optional")) return "low";
    return "medium";
  };

  const generateConsolidatedFlow = async () => {
    if (flows.length === 0) return;

    setIsGeneratingConsolidatedFlow(true);

    try {
      // Use Gemini AI to analyze and consolidate all flows
      const masterFlow = await generateAIConsolidatedFlow(flows);
      const consolidatedFlowData: ProjectFlow = {
        id: "ai-consolidated-master-flow",
        title: masterFlow.title,
        description: masterFlow.description,
        flowData: masterFlow.flowData,
        category: "core",
        priority: "high",
        createdAt: new Date().toISOString(),
      };
      setConsolidatedFlow(consolidatedFlowData);

      // Save to localStorage
      localStorage.setItem(
        "consolidatedMasterFlow",
        JSON.stringify(consolidatedFlowData)
      );
      console.log("✅ Saved AI-generated master flow to localStorage");
    } catch (error) {
      console.error("Error generating AI consolidated flow:", error);
      // Fallback to manual consolidation if AI fails
      const fallbackFlow = createFallbackConsolidatedFlow(flows);
      const fallbackFlowData: ProjectFlow = {
        id: "fallback-master-flow",
        title: fallbackFlow.title,
        description: fallbackFlow.description,
        flowData: fallbackFlow.flowData,
        category: "core",
        priority: "high",
        createdAt: new Date().toISOString(),
      };
      setConsolidatedFlow(fallbackFlowData);

      // Save fallback to localStorage
      localStorage.setItem(
        "consolidatedMasterFlow",
        JSON.stringify(fallbackFlowData)
      );
      console.log("✅ Saved fallback master flow to localStorage");
    } finally {
      setIsGeneratingConsolidatedFlow(false);
    }
  };

  const generateAIConsolidatedFlow = async (flows: ProjectFlow[]) => {
    const API_KEY = "AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg";

    // Prepare flow data for AI analysis
    const flowSummaries = flows.map((flow) => ({
      id: flow.id,
      title: flow.title,
      description: flow.description,
      category: flow.category,
      priority: flow.priority,
      nodeCount: flow.flowData?.nodes?.length || 0,
      edgeCount: flow.flowData?.edges?.length || 0,
      nodes:
        flow.flowData?.nodes?.map((node: any) => ({
          id: node.id,
          label: node.data?.label,
          type: node.type,
          position: node.position,
        })) || [],
      edges:
        flow.flowData?.edges?.map((edge: any) => ({
          source: edge.source,
          target: edge.target,
          id: edge.id,
        })) || [],
    }));

    const prompt = `Analyze these ${
      flows.length
    } application workflows and create a single comprehensive master flow diagram that consolidates ALL processes into one unified, detailed workflow.

INPUT WORKFLOWS:
${JSON.stringify(flowSummaries, null, 2)}

CRITICAL REQUIREMENTS - CREATE 30-40 DETAILED GRANULAR NODES:

PHASE 1 - INITIAL REGISTRATION & ONBOARDING (8-10 nodes):
- Patient/User arrival and initial registration
- Personal information collection (name, DOB, address)
- Contact details validation (email, phone)
- Insurance information capture
- Identity verification process
- Document upload and validation
- Emergency contact setup
- Initial profile creation

PHASE 2 - AUTHENTICATION & VERIFICATION (6-8 nodes):
- Login credential setup
- Multi-factor authentication
- Identity document verification
- Insurance eligibility verification
- Medical history intake
- Consent forms completion
- Privacy policy acceptance
- Account activation

PHASE 3 - PLATFORM SELECTION & ACCESS (4-6 nodes):
- Platform choice (mobile vs web)
- Mobile app download and setup
- Web portal dashboard access
- Feature navigation tutorial
- Preference settings configuration
- Notification setup

PHASE 4 - CORE HEALTHCARE SERVICES (8-12 nodes):
- Provider search and selection
- Appointment scheduling interface
- Calendar integration
- Appointment confirmation
- Pre-visit questionnaire
- Telemedicine setup and testing
- Video call initiation
- Virtual consultation session
- Post-visit follow-up
- Prescription management
- Lab results viewing

PHASE 5 - ADMINISTRATIVE & BILLING (6-8 nodes):
- Insurance claim preparation
- Claim submission to provider
- Payment processing
- Bill generation
- Payment confirmation
- Receipt delivery
- Billing reconciliation
- Financial reporting

PHASE 6 - COMMUNICATION & SUPPORT (4-6 nodes):
- Secure messaging system
- Provider communication
- Support ticket creation
- Incident management
- Feedback collection
- Rating and review system

COLOR CODING AND POSITIONING:
- Position nodes in logical rows: y=50 (registration), y=150 (verification), y=250 (platform), y=350 (services), y=450 (billing), y=550 (communication)
- X positions: start at 50, increment by 180-200 for horizontal flow
- Use specific colors:
  * Registration: #10B981 (green)
  * Verification: #1E88E5 (blue)
  * Platform Setup: #9C27B0 (purple)
  * Decision Points: #FFC107 (yellow with black text)
  * Healthcare Services: #FF6B35 (orange)
  * Mobile Features: #E91E63 (pink)
  * Web Features: #2196F3 (blue)
  * Billing/Admin: #795548 (brown)
  * Communication: #607D8B (blue-grey)
  * Completion: #4CAF50 (green)

MANDATORY ELEMENTS TO INCLUDE:
- Every stakeholder type: Patient, Provider, Administrator, Billing Staff, Insurance Provider
- All major flow types: Account Creation, Appointment Scheduling, Telemedicine, Claims, Billing
- Decision gates for validation, authentication, platform choice
- Parallel processing paths for mobile vs web
- Error handling and retry mechanisms
- Notification and communication touchpoints

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "title": "Comprehensive Master Application Flow",
  "description": "Unified workflow consolidating all application processes and user journeys",
  "flowData": {
    "nodes": [
      {
        "id": "unique-node-id",
        "position": {"x": number, "y": number},
        "data": {"label": "Specific Action Description"},
        "type": "input|default|output",
        "style": {"backgroundColor": "#colorcode", "color": "white|black"}
      }
    ],
    "edges": [
      {
        "id": "unique-edge-id",
        "source": "source-node-id",
        "target": "target-node-id"
      }
    ]
  }
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response from Gemini AI");
    }

    // Clean and parse the AI response
    const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, "").trim();
    let parsedResponse;

    try {
      parsedResponse = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanResponse);
      throw new Error("Invalid JSON response from AI");
    }

    // Validate the response structure
    if (
      !parsedResponse.flowData ||
      !parsedResponse.flowData.nodes ||
      !parsedResponse.flowData.edges
    ) {
      throw new Error("Invalid flow structure from AI");
    }

    // Ensure all nodes have proper IDs and edges have valid connections
    const nodeIds = new Set(
      parsedResponse.flowData.nodes.map((node: any) => node.id)
    );
    const validEdges = parsedResponse.flowData.edges.filter(
      (edge: any) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    return {
      title: parsedResponse.title,
      description: parsedResponse.description,
      flowData: {
        nodes: parsedResponse.flowData.nodes,
        edges: validEdges,
      },
    };
  };

  const createFallbackConsolidatedFlow = (flows: ProjectFlow[]) => {
    // Create comprehensive detailed master flow with 35+ nodes
    const nodes = [
      // PHASE 1 - INITIAL REGISTRATION & ONBOARDING (y=50)
      {
        id: "start",
        position: { x: 50, y: 50 },
        data: { label: "Patient Arrival" },
        type: "input",
        style: { backgroundColor: "#10B981", color: "white" },
      },
      {
        id: "personal-info",
        position: { x: 250, y: 50 },
        data: { label: "Personal Information Collection" },
        type: "default",
        style: { backgroundColor: "#10B981", color: "white" },
      },
      {
        id: "contact-validation",
        position: { x: 450, y: 50 },
        data: { label: "Contact Details Validation" },
        type: "default",
        style: { backgroundColor: "#10B981", color: "white" },
      },
      {
        id: "insurance-capture",
        position: { x: 650, y: 50 },
        data: { label: "Insurance Information Capture" },
        type: "default",
        style: { backgroundColor: "#10B981", color: "white" },
      },
      {
        id: "document-upload",
        position: { x: 850, y: 50 },
        data: { label: "Document Upload & Validation" },
        type: "default",
        style: { backgroundColor: "#10B981", color: "white" },
      },
      {
        id: "emergency-contact",
        position: { x: 1050, y: 50 },
        data: { label: "Emergency Contact Setup" },
        type: "default",
        style: { backgroundColor: "#10B981", color: "white" },
      },
      {
        id: "initial-profile",
        position: { x: 1250, y: 50 },
        data: { label: "Initial Profile Creation" },
        type: "default",
        style: { backgroundColor: "#10B981", color: "white" },
      },

      // PHASE 2 - AUTHENTICATION & VERIFICATION (y=150)
      {
        id: "credential-setup",
        position: { x: 50, y: 150 },
        data: { label: "Login Credential Setup" },
        type: "default",
        style: { backgroundColor: "#1E88E5", color: "white" },
      },
      {
        id: "mfa-setup",
        position: { x: 250, y: 150 },
        data: { label: "Multi-Factor Authentication" },
        type: "default",
        style: { backgroundColor: "#1E88E5", color: "white" },
      },
      {
        id: "identity-verification",
        position: { x: 450, y: 150 },
        data: { label: "Identity Document Verification" },
        type: "default",
        style: { backgroundColor: "#1E88E5", color: "white" },
      },
      {
        id: "insurance-eligibility",
        position: { x: 650, y: 150 },
        data: { label: "Insurance Eligibility Check" },
        type: "default",
        style: { backgroundColor: "#1E88E5", color: "white" },
      },
      {
        id: "medical-history",
        position: { x: 850, y: 150 },
        data: { label: "Medical History Intake" },
        type: "default",
        style: { backgroundColor: "#1E88E5", color: "white" },
      },
      {
        id: "consent-forms",
        position: { x: 1050, y: 150 },
        data: { label: "Consent Forms Completion" },
        type: "default",
        style: { backgroundColor: "#1E88E5", color: "white" },
      },
      {
        id: "account-activation",
        position: { x: 1250, y: 150 },
        data: { label: "Account Activation" },
        type: "default",
        style: { backgroundColor: "#1E88E5", color: "white" },
      },

      // PHASE 3 - PLATFORM SELECTION & ACCESS (y=250)
      {
        id: "platform-choice",
        position: { x: 200, y: 250 },
        data: { label: "Platform Choice Decision" },
        type: "default",
        style: { backgroundColor: "#FFC107", color: "black" },
      },
      {
        id: "mobile-download",
        position: { x: 50, y: 350 },
        data: { label: "Mobile App Download" },
        type: "default",
        style: { backgroundColor: "#E91E63", color: "white" },
      },
      {
        id: "mobile-setup",
        position: { x: 250, y: 350 },
        data: { label: "Mobile Setup & Configuration" },
        type: "default",
        style: { backgroundColor: "#E91E63", color: "white" },
      },
      {
        id: "web-dashboard",
        position: { x: 450, y: 350 },
        data: { label: "Web Portal Dashboard Access" },
        type: "default",
        style: { backgroundColor: "#2196F3", color: "white" },
      },
      {
        id: "feature-tutorial",
        position: { x: 650, y: 350 },
        data: { label: "Feature Navigation Tutorial" },
        type: "default",
        style: { backgroundColor: "#9C27B0", color: "white" },
      },
      {
        id: "notification-setup",
        position: { x: 850, y: 350 },
        data: { label: "Notification Setup" },
        type: "default",
        style: { backgroundColor: "#9C27B0", color: "white" },
      },

      // PHASE 4 - CORE HEALTHCARE SERVICES (y=450)
      {
        id: "provider-search",
        position: { x: 50, y: 450 },
        data: { label: "Provider Search & Selection" },
        type: "default",
        style: { backgroundColor: "#FF6B35", color: "white" },
      },
      {
        id: "appointment-scheduling",
        position: { x: 250, y: 450 },
        data: { label: "Appointment Scheduling Interface" },
        type: "default",
        style: { backgroundColor: "#FF6B35", color: "white" },
      },
      {
        id: "calendar-integration",
        position: { x: 450, y: 450 },
        data: { label: "Calendar Integration" },
        type: "default",
        style: { backgroundColor: "#FF6B35", color: "white" },
      },
      {
        id: "appointment-confirmation",
        position: { x: 650, y: 450 },
        data: { label: "Appointment Confirmation" },
        type: "default",
        style: { backgroundColor: "#FF6B35", color: "white" },
      },
      {
        id: "pre-visit-questionnaire",
        position: { x: 850, y: 450 },
        data: { label: "Pre-Visit Questionnaire" },
        type: "default",
        style: { backgroundColor: "#FF6B35", color: "white" },
      },
      {
        id: "telemedicine-setup",
        position: { x: 1050, y: 450 },
        data: { label: "Telemedicine Setup & Testing" },
        type: "default",
        style: { backgroundColor: "#FF6B35", color: "white" },
      },
      {
        id: "video-consultation",
        position: { x: 1250, y: 450 },
        data: { label: "Virtual Consultation Session" },
        type: "default",
        style: { backgroundColor: "#FF6B35", color: "white" },
      },
      {
        id: "prescription-management",
        position: { x: 1450, y: 450 },
        data: { label: "Prescription Management" },
        type: "default",
        style: { backgroundColor: "#FF6B35", color: "white" },
      },

      // PHASE 5 - ADMINISTRATIVE & BILLING (y=550)
      {
        id: "claim-preparation",
        position: { x: 50, y: 550 },
        data: { label: "Insurance Claim Preparation" },
        type: "default",
        style: { backgroundColor: "#795548", color: "white" },
      },
      {
        id: "claim-submission",
        position: { x: 250, y: 550 },
        data: { label: "Claim Submission to Provider" },
        type: "default",
        style: { backgroundColor: "#795548", color: "white" },
      },
      {
        id: "payment-processing",
        position: { x: 450, y: 550 },
        data: { label: "Payment Processing" },
        type: "default",
        style: { backgroundColor: "#795548", color: "white" },
      },
      {
        id: "bill-generation",
        position: { x: 650, y: 550 },
        data: { label: "Bill Generation" },
        type: "default",
        style: { backgroundColor: "#795548", color: "white" },
      },
      {
        id: "payment-confirmation",
        position: { x: 850, y: 550 },
        data: { label: "Payment Confirmation" },
        type: "default",
        style: { backgroundColor: "#795548", color: "white" },
      },
      {
        id: "billing-reconciliation",
        position: { x: 1050, y: 550 },
        data: { label: "Billing Reconciliation" },
        type: "default",
        style: { backgroundColor: "#795548", color: "white" },
      },

      // PHASE 6 - COMMUNICATION & SUPPORT (y=650)
      {
        id: "secure-messaging",
        position: { x: 200, y: 650 },
        data: { label: "Secure Messaging System" },
        type: "default",
        style: { backgroundColor: "#607D8B", color: "white" },
      },
      {
        id: "provider-communication",
        position: { x: 400, y: 650 },
        data: { label: "Provider Communication" },
        type: "default",
        style: { backgroundColor: "#607D8B", color: "white" },
      },
      {
        id: "support-ticket",
        position: { x: 600, y: 650 },
        data: { label: "Support Ticket Creation" },
        type: "default",
        style: { backgroundColor: "#607D8B", color: "white" },
      },
      {
        id: "feedback-collection",
        position: { x: 800, y: 650 },
        data: { label: "Feedback Collection" },
        type: "default",
        style: { backgroundColor: "#607D8B", color: "white" },
      },
      {
        id: "completion",
        position: { x: 1000, y: 650 },
        data: { label: "Process Complete" },
        type: "output",
        style: { backgroundColor: "#4CAF50", color: "white" },
      },
    ];

    // Create comprehensive edge connections
    const edges = [
      // Phase 1 connections
      { id: "e1", source: "start", target: "personal-info" },
      { id: "e2", source: "personal-info", target: "contact-validation" },
      { id: "e3", source: "contact-validation", target: "insurance-capture" },
      { id: "e4", source: "insurance-capture", target: "document-upload" },
      { id: "e5", source: "document-upload", target: "emergency-contact" },
      { id: "e6", source: "emergency-contact", target: "initial-profile" },

      // Phase 2 connections
      { id: "e7", source: "initial-profile", target: "credential-setup" },
      { id: "e8", source: "credential-setup", target: "mfa-setup" },
      { id: "e9", source: "mfa-setup", target: "identity-verification" },
      {
        id: "e10",
        source: "identity-verification",
        target: "insurance-eligibility",
      },
      { id: "e11", source: "insurance-eligibility", target: "medical-history" },
      { id: "e12", source: "medical-history", target: "consent-forms" },
      { id: "e13", source: "consent-forms", target: "account-activation" },

      // Phase 3 connections
      { id: "e14", source: "account-activation", target: "platform-choice" },
      { id: "e15", source: "platform-choice", target: "mobile-download" },
      { id: "e16", source: "platform-choice", target: "web-dashboard" },
      { id: "e17", source: "mobile-download", target: "mobile-setup" },
      { id: "e18", source: "mobile-setup", target: "feature-tutorial" },
      { id: "e19", source: "web-dashboard", target: "feature-tutorial" },
      { id: "e20", source: "feature-tutorial", target: "notification-setup" },

      // Phase 4 connections
      { id: "e21", source: "notification-setup", target: "provider-search" },
      {
        id: "e22",
        source: "provider-search",
        target: "appointment-scheduling",
      },
      {
        id: "e23",
        source: "appointment-scheduling",
        target: "calendar-integration",
      },
      {
        id: "e24",
        source: "calendar-integration",
        target: "appointment-confirmation",
      },
      {
        id: "e25",
        source: "appointment-confirmation",
        target: "pre-visit-questionnaire",
      },
      {
        id: "e26",
        source: "pre-visit-questionnaire",
        target: "telemedicine-setup",
      },
      { id: "e27", source: "telemedicine-setup", target: "video-consultation" },
      {
        id: "e28",
        source: "video-consultation",
        target: "prescription-management",
      },

      // Phase 5 connections
      {
        id: "e29",
        source: "prescription-management",
        target: "claim-preparation",
      },
      { id: "e30", source: "claim-preparation", target: "claim-submission" },
      { id: "e31", source: "claim-submission", target: "payment-processing" },
      { id: "e32", source: "payment-processing", target: "bill-generation" },
      { id: "e33", source: "bill-generation", target: "payment-confirmation" },
      {
        id: "e34",
        source: "payment-confirmation",
        target: "billing-reconciliation",
      },

      // Phase 6 connections
      {
        id: "e35",
        source: "billing-reconciliation",
        target: "secure-messaging",
      },
      {
        id: "e36",
        source: "secure-messaging",
        target: "provider-communication",
      },
      { id: "e37", source: "provider-communication", target: "support-ticket" },
      { id: "e38", source: "support-ticket", target: "feedback-collection" },
      { id: "e39", source: "feedback-collection", target: "completion" },

      // Alternative pathways
      { id: "e40", source: "video-consultation", target: "secure-messaging" },
      {
        id: "e41",
        source: "appointment-confirmation",
        target: "support-ticket",
      },
      { id: "e42", source: "mobile-setup", target: "provider-search" },
      { id: "e43", source: "web-dashboard", target: "provider-search" },
    ];

    return {
      title: "Comprehensive Master Healthcare Application Flow",
      description:
        "Detailed workflow covering all 35+ process steps from patient registration through completion, including all stakeholder flows",
      flowData: { nodes, edges },
    };
  };

  const downloadProjectBundle = async () => {
    try {
      // Get master flow data
      const masterFlowData = consolidatedFlow
        ? {
            title: consolidatedFlow.title,
            description: consolidatedFlow.description,
            flowData: consolidatedFlow.flowData,
            metadata: {
              totalNodes: consolidatedFlow.flowData.nodes?.length || 0,
              totalEdges: consolidatedFlow.flowData.edges?.length || 0,
              sourceFlows: flows.length,
              generatedAt: new Date().toISOString(),
            },
          }
        : null;

      // Get brand guidelines data
      const brandGuidelinesData = localStorage.getItem("brand_guidelines");

      // Create project plan PDF content
      const projectPlanContent = `
# Comprehensive Project Plan

## Project Overview
${projectPlan}

## Stakeholder Flows
${stakeholderFlows}

## Master Flow Summary
- Total Process Nodes: ${consolidatedFlow?.flowData.nodes?.length || 0}
- Total Connections: ${consolidatedFlow?.flowData.edges?.length || 0}
- Source Flows Consolidated: ${flows.length}

## Generated Data Quality
- Master Flow: ${masterFlowData ? "Available" : "Not Generated"}
- Brand Guidelines: ${brandGuidelinesData ? "Available" : "Not Available"}
- Project Plan: ${projectPlan ? "Available" : "Not Available"}

## Export Information
Generated on: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
      `.trim();

      // Create downloadable files
      const files = [];

      // Add master flow JSON
      if (masterFlowData) {
        const masterFlowBlob = new Blob(
          [JSON.stringify(masterFlowData, null, 2)],
          { type: "application/json" }
        );
        files.push({ name: "master-flow.json", blob: masterFlowBlob });
      }

      // Add brand guidelines JSON
      if (brandGuidelinesData) {
        const brandGuidelinesBlob = new Blob([brandGuidelinesData], {
          type: "application/json",
        });
        files.push({
          name: "brand-guidelines.json",
          blob: brandGuidelinesBlob,
        });
      }

      // Add project plan as text file
      const projectPlanBlob = new Blob([projectPlanContent], {
        type: "text/plain",
      });
      files.push({ name: "project-plan.txt", blob: projectPlanBlob });

      // Download files individually with sequential delays
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const url = URL.createObjectURL(file.blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Small delay between downloads
          if (i < files.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        alert(
          `Successfully downloaded ${files.length} files:\n${files
            .map((f) => f.name)
            .join("\n")}`
        );
      } else {
        alert(
          "No data available to download. Please generate master flow and ensure project data is available."
        );
      }
    } catch (error) {
      console.error("Error downloading project bundle:", error);
      alert("Error creating download bundle. Please try again.");
    }
  };

  const generateProjectCode = async () => {
    if (!projectPlan.trim()) {
      alert(
        "Please ensure you have a project plan. Visit the Project Planner page first."
      );
      return;
    }

    if (!config.projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    // API key is now embedded directly in the code generator

    setIsGenerating(true);
    setGenerationProgress({
      current: 0,
      total: 7,
      status: "Initializing AI code generation...",
      currentTask: "Preparing",
    });

    try {
      // Always create a fresh generator to ensure proper Gemini configuration
      const activeGenerator = createAICodeGenerator();

      const projectStructure = await activeGenerator.generateCompleteProject(
        projectPlan,
        stakeholderFlows,
        config,
        (progress: GenerationProgress) => {
          setGenerationProgress(progress);
        }
      );

      setGeneratedProject(projectStructure);
    } catch (error) {
      console.error("Error generating project:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate project code";

      if (errorMessage.includes("API key")) {
        alert(
          "Gemini API key is required for code generation. Please check your environment variables."
        );
      } else {
        alert(`Code generation failed: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadProject = () => {
    if (!generatedProject) return;

    const projectData = {
      ...generatedProject,
      config,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.projectName || "generated-project"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar title="Code Generator" showBackButton={true} />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Workflow Progress */}
        <WorkflowProgress
          currentStep="code"
          completedSteps={["input", "plan", "diagram", "stories"]}
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            AI Code Generator
          </h1>
          <p className="text-gray-600">
            Generate complete React project code based on your project plan and
            stakeholder analysis
          </p>
        </div>

        {/* Project Data Export Section */}
        <Card className="border-emerald-200 bg-emerald-50/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-600" />
              Project Data Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Download a comprehensive text file containing all your project data from localStorage including project description, flow data, page content cards, and brand guidelines.
              </p>
              <Button 
                onClick={downloadProjectData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Project Data (.txt)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Loading Status */}
        <div className="mb-6">
          {dataLoaded && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                {projectPlan ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Project Plan Loaded
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      No Project Plan Found
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {stakeholderFlows ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Stakeholder Data Loaded
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      No Stakeholder Data Found
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Configuration */}
        <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Project Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Project Name */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <Label
                  htmlFor="projectName"
                  className="flex items-center gap-2 text-gray-700 font-medium mb-2"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  value={config.projectName}
                  onChange={(e) =>
                    setConfig({ ...config, projectName: e.target.value })
                  }
                  placeholder="my-awesome-app"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              {/* Frontend Framework */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <Label
                  htmlFor="framework"
                  className="flex items-center gap-2 text-gray-700 font-medium mb-2"
                >
                  <Globe className="h-4 w-4 text-green-600" />
                  Frontend Framework
                </Label>
                <Select
                  value={config.framework}
                  onValueChange={(value) =>
                    setConfig({ ...config, framework: value })
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="react">⚛️ React</SelectItem>
                    <SelectItem value="nextjs">▲ Next.js</SelectItem>
                    <SelectItem value="vue">🟢 Vue.js</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Backend */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <Label
                  htmlFor="backend"
                  className="flex items-center gap-2 text-gray-700 font-medium mb-2"
                >
                  <Server className="h-4 w-4 text-orange-600" />
                  Backend
                </Label>
                <Select
                  value={config.backend}
                  onValueChange={(value) =>
                    setConfig({ ...config, backend: value })
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="node">🟢 Node.js/Express</SelectItem>
                    <SelectItem value="python">🐍 Python/FastAPI</SelectItem>
                    <SelectItem value="go">🔵 Go/Gin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Database */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <Label
                  htmlFor="database"
                  className="flex items-center gap-2 text-gray-700 font-medium mb-2"
                >
                  <Database className="h-4 w-4 text-purple-600" />
                  Database
                </Label>
                <Select
                  value={config.database}
                  onValueChange={(value) =>
                    setConfig({ ...config, database: value })
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">🐘 PostgreSQL</SelectItem>
                    <SelectItem value="mysql">🐬 MySQL</SelectItem>
                    <SelectItem value="mongodb">🍃 MongoDB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Styling */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <Label
                  htmlFor="styling"
                  className="flex items-center gap-2 text-gray-700 font-medium mb-2"
                >
                  <Layers className="h-4 w-4 text-pink-600" />
                  Styling
                </Label>
                <Select
                  value={config.styling}
                  onValueChange={(value) =>
                    setConfig({ ...config, styling: value })
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-pink-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tailwind">🌊 Tailwind CSS</SelectItem>
                    <SelectItem value="styled">💅 Styled Components</SelectItem>
                    <SelectItem value="css">📦 CSS Modules</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Deployment */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <Label
                  htmlFor="deployment"
                  className="flex items-center gap-2 text-gray-700 font-medium mb-2"
                >
                  <Zap className="h-4 w-4 text-indigo-600" />
                  Deployment
                </Label>
                <Select
                  value={config.deployment}
                  onValueChange={(value) =>
                    setConfig({ ...config, deployment: value })
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-indigo-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vercel">▲ Vercel</SelectItem>
                    <SelectItem value="netlify">🌐 Netlify</SelectItem>
                    <SelectItem value="aws">☁️ AWS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        

        {/* Input Data */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Project Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={projectPlan}
                onChange={(e) => setProjectPlan(e.target.value)}
                placeholder="Paste your project plan here..."
                rows={8}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-6">
          <Button
            onClick={generateProjectCode}
            disabled={isGenerating || !projectPlan.trim()}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-5 w-5 mr-2" />
            )}
            Generate Project Code
          </Button>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Generating Project Code</h3>
                  <span className="text-sm text-gray-600">
                    {generationProgress.current} / {generationProgress.total}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (generationProgress.current /
                          generationProgress.total) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <p className="text-sm text-gray-600">
                  {generationProgress.status}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        

        {/* Generated Project */}
        {generatedProject && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Generated Project Code
                </div>
                <Button onClick={downloadProject} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Project
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="structure" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="structure">
                    <FolderTree className="h-4 w-4 mr-1" />
                    Structure
                  </TabsTrigger>
                  <TabsTrigger value="frontend">
                    <Globe className="h-4 w-4 mr-1" />
                    Frontend
                  </TabsTrigger>
                  <TabsTrigger value="backend">
                    <Server className="h-4 w-4 mr-1" />
                    Backend
                  </TabsTrigger>
                  <TabsTrigger value="database">
                    <Database className="h-4 w-4 mr-1" />
                    Database
                  </TabsTrigger>
                  <TabsTrigger value="config">
                    <Package className="h-4 w-4 mr-1" />
                    Config
                  </TabsTrigger>
                  <TabsTrigger value="docs">
                    <FileText className="h-4 w-4 mr-1" />
                    Docs
                  </TabsTrigger>
                  <TabsTrigger value="development">
                    <Code className="h-4 w-4 mr-1" />
                    Development
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="structure" className="mt-4">
                  <div className="relative">
                    <Button
                      onClick={() =>
                        copyToClipboard(generatedProject.folderStructure)
                      }
                      className="absolute top-2 right-2 z-10"
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm">
                      {generatedProject.folderStructure}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="frontend" className="mt-4">
                  <div className="space-y-4">
                    {Object.entries(generatedProject.frontendFiles).map(
                      ([filename, content]) => (
                        <div key={filename} className="border rounded-lg">
                          <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">
                            <span className="font-mono text-sm">
                              {filename}
                            </span>
                            <Button
                              onClick={() => copyToClipboard(content)}
                              size="sm"
                              variant="outline"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <pre className="p-4 overflow-auto text-sm bg-gray-900 text-gray-100">
                            {content}
                          </pre>
                        </div>
                      )
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="backend" className="mt-4">
                  <div className="space-y-4">
                    {Object.entries(generatedProject.backendFiles).map(
                      ([filename, content]) => (
                        <div key={filename} className="border rounded-lg">
                          <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">
                            <span className="font-mono text-sm">
                              {filename}
                            </span>
                            <Button
                              onClick={() => copyToClipboard(content)}
                              size="sm"
                              variant="outline"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <pre className="p-4 overflow-auto text-sm bg-gray-900 text-gray-100">
                            {content}
                          </pre>
                        </div>
                      )
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="database" className="mt-4">
                  <div className="relative">
                    <Button
                      onClick={() =>
                        copyToClipboard(generatedProject.databaseSchema)
                      }
                      className="absolute top-2 right-2 z-10"
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-auto text-sm">
                      {generatedProject.databaseSchema}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="config" className="mt-4">
                  <div className="relative">
                    <Button
                      onClick={() =>
                        copyToClipboard(generatedProject.packageJson)
                      }
                      className="absolute top-2 right-2 z-10"
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <pre className="bg-gray-900 text-yellow-400 p-4 rounded-lg overflow-auto text-sm">
                      {generatedProject.packageJson}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="docs" className="mt-4">
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(generatedProject.readme)}
                      className="absolute top-2 right-2 z-10"
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm">
                      {generatedProject.readme}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="development" className="mt-4">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                          <Code className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Start Development
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Use the integrated Replit environment below to start
                        developing your project. You can create a new Repl and
                        copy the generated code structure.
                      </p>
                      <div className="flex gap-3 mb-4">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          <Server className="h-3 w-3 mr-1" />
                          Live Environment
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700"
                        >
                          <GitBranch className="h-3 w-3 mr-1" />
                          Version Control
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Instant Deploy
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-lg">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            Replit Development Environment
                          </h4>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                // Copy all generated code to clipboard for easy pasting in Replit
                                const allCode = [
                                  "=== FOLDER STRUCTURE ===",
                                  generatedProject?.folderStructure || "",
                                  "\n=== FRONTEND FILES ===",
                                  Object.entries(
                                    generatedProject?.frontendFiles || {}
                                  )
                                    .map(
                                      ([name, content]) =>
                                        `--- ${name} ---\n${content}`
                                    )
                                    .join("\n\n"),
                                  "\n=== BACKEND FILES ===",
                                  Object.entries(
                                    generatedProject?.backendFiles || {}
                                  )
                                    .map(
                                      ([name, content]) =>
                                        `--- ${name} ---\n${content}`
                                    )
                                    .join("\n\n"),
                                  "\n=== DATABASE SCHEMA ===",
                                  generatedProject?.databaseSchema || "",
                                  "\n=== PACKAGE.JSON ===",
                                  generatedProject?.packageJson || "",
                                ].join("\n\n");

                                navigator.clipboard.writeText(allCode);
                              }}
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy All Code
                            </Button>
                            <a
                              href="https://replit.com/new/nodejs"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                            >
                              Generate Code ↗
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="relative bg-black">
                        <iframe
                          src="https://replit.com/@daspapun21/projectPlanner?embed=true&output=1"
                          width="100%"
                          height="500"
                          frameBorder="0"
                          scrolling="no"
                          allowFullScreen
                          title="Project Planner - Replit Development Environment"
                          className="w-full"
                          sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation"
                        />
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            Copy your code above, then create files in the
                            embedded editor
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FolderTree className="h-4 w-4" />
                            Quick Start Guide
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                              1
                            </div>
                            <span>
                              Create a new Repl with your chosen framework
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                              2
                            </div>
                            <span>Copy the generated project structure</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                              3
                            </div>
                            <span>Install dependencies from package.json</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                              4
                            </div>
                            <span>Start coding and deploy instantly</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Development Tips
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>
                              Use the generated database schema for setup
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>
                              Follow the folder structure recommendations
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>
                              Implement features from your project plan
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>Test deployment early and iterate</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

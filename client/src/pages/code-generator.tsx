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
  category: 'onboarding' | 'core' | 'management';
  priority: 'high' | 'medium' | 'low';
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
  const [consolidatedFlow, setConsolidatedFlow] = useState<ProjectFlow | null>(null);
  const [isGeneratingConsolidatedFlow, setIsGeneratingConsolidatedFlow] = useState(false);

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

    // Load flows from localStorage
    const flowKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('flowDiagrams') || key.startsWith('sectionFlowDiagrams')
    );
    
    const loadedFlows: ProjectFlow[] = [];
    
    flowKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (typeof data === 'object' && data !== null) {
          Object.keys(data).forEach(subKey => {
            const flowData = data[subKey];
            if (flowData && typeof flowData === 'object') {
              loadedFlows.push(createFlowFromData(subKey, flowData));
            }
          });
        }
      } catch (error) {
        console.error(`Error parsing ${key}:`, error);
      }
    });

    setFlows(loadedFlows);

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
      title: data.title || key.replace(/[-_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      description: data.description || `Process workflow for ${key}`,
      flowData: data.flowData || data,
      category: determineCategory(key),
      priority: determinePriority(key),
      createdAt: new Date().toISOString()
    };
  };

  const determineCategory = (key: string): 'onboarding' | 'core' | 'management' => {
    if (key.includes('onboard') || key.includes('register') || key.includes('setup')) return 'onboarding';
    if (key.includes('manage') || key.includes('admin') || key.includes('settings')) return 'management';
    return 'core';
  };

  const determinePriority = (key: string): 'high' | 'medium' | 'low' => {
    if (key.includes('critical') || key.includes('main') || key.includes('primary')) return 'high';
    if (key.includes('secondary') || key.includes('optional')) return 'low';
    return 'medium';
  };

  const generateConsolidatedFlow = async () => {
    if (flows.length === 0) return;

    setIsGeneratingConsolidatedFlow(true);
    
    try {
      const masterFlow = createFallbackConsolidatedFlow(flows);
      const consolidatedFlowData: ProjectFlow = {
        id: 'consolidated-master-flow',
        title: masterFlow.title,
        description: masterFlow.description,
        flowData: masterFlow.flowData,
        category: 'core',
        priority: 'high',
        createdAt: new Date().toISOString()
      };
      setConsolidatedFlow(consolidatedFlowData);
    } catch (error) {
      console.error('Error generating consolidated flow:', error);
      const fallbackFlow = createFallbackConsolidatedFlow(flows);
      const fallbackFlowData: ProjectFlow = {
        id: 'fallback-master-flow',
        title: fallbackFlow.title,
        description: fallbackFlow.description,
        flowData: fallbackFlow.flowData,
        category: 'core',
        priority: 'high',
        createdAt: new Date().toISOString()
      };
      setConsolidatedFlow(fallbackFlowData);
    } finally {
      setIsGeneratingConsolidatedFlow(false);
    }
  };

  const createFallbackConsolidatedFlow = (flows: ProjectFlow[]) => {
    const nodes = [
      {
        id: 'start',
        position: { x: 50, y: 50 },
        data: { label: 'User Arrives' },
        type: 'input',
        style: { backgroundColor: '#10B981', color: 'white' }
      },
      {
        id: 'account-setup',
        position: { x: 200, y: 50 },
        data: { label: 'Account Setup' },
        type: 'default',
        style: { backgroundColor: '#1E88E5', color: 'white' }
      },
      {
        id: 'profile-creation',
        position: { x: 350, y: 50 },
        data: { label: 'Profile Creation' },
        type: 'default',
        style: { backgroundColor: '#1E88E5', color: 'white' }
      },
      {
        id: 'verification',
        position: { x: 500, y: 50 },
        data: { label: 'Verification Process' },
        type: 'default',
        style: { backgroundColor: '#FF6B35', color: 'white' }
      },
      {
        id: 'platform-choice',
        position: { x: 650, y: 50 },
        data: { label: 'Platform Selection' },
        type: 'default',
        style: { backgroundColor: '#FFC107', color: 'black' }
      },
      {
        id: 'mobile-app',
        position: { x: 500, y: 150 },
        data: { label: 'Mobile Application' },
        type: 'default',
        style: { backgroundColor: '#E91E63', color: 'white' }
      },
      {
        id: 'web-portal',
        position: { x: 800, y: 150 },
        data: { label: 'Web Portal' },
        type: 'default',
        style: { backgroundColor: '#2196F3', color: 'white' }
      },
      {
        id: 'service-request',
        position: { x: 650, y: 250 },
        data: { label: 'Service Request' },
        type: 'default',
        style: { backgroundColor: '#795548', color: 'white' }
      },
      {
        id: 'completion',
        position: { x: 650, y: 350 },
        data: { label: 'Process Complete' },
        type: 'output',
        style: { backgroundColor: '#4CAF50', color: 'white' }
      }
    ];

    const edges = [
      { id: 'e1', source: 'start', target: 'account-setup' },
      { id: 'e2', source: 'account-setup', target: 'profile-creation' },
      { id: 'e3', source: 'profile-creation', target: 'verification' },
      { id: 'e4', source: 'verification', target: 'platform-choice' },
      { id: 'e5', source: 'platform-choice', target: 'mobile-app' },
      { id: 'e6', source: 'platform-choice', target: 'web-portal' },
      { id: 'e7', source: 'mobile-app', target: 'service-request' },
      { id: 'e8', source: 'web-portal', target: 'service-request' },
      { id: 'e9', source: 'service-request', target: 'completion' }
    ];

    return {
      title: "Master Application Flow",
      description: "Comprehensive workflow combining all application processes and user journeys",
      flowData: { nodes, edges }
    };
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

          {/* Data Loading Status */}
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

        {/* Consolidated Master Flow Section */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-purple-600" />
                AI-Generated Master Flow Diagram
              </div>
              <Button 
                onClick={generateConsolidatedFlow}
                disabled={isGeneratingConsolidatedFlow || flows.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGeneratingConsolidatedFlow ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Consolidating Flows...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Generate Master Flow
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!consolidatedFlow && !isGeneratingConsolidatedFlow && (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  Consolidate all individual flows into a single comprehensive master workflow diagram using AI analysis.
                </div>
                <div className="text-sm text-gray-400">
                  {flows.length === 0 
                    ? "No flows available to consolidate. Please generate some flows first."
                    : `Ready to consolidate ${flows.length} flows into a master diagram.`
                  }
                </div>
              </div>
            )}
            
            {isGeneratingConsolidatedFlow && (
              <div className="text-center py-8">
                <div className="text-purple-600 mb-4">
                  AI is analyzing and consolidating all flows into a master workflow...
                </div>
                <div className="text-sm text-gray-500">
                  This may take a moment as we merge {flows.length} individual flows.
                </div>
              </div>
            )}

            {consolidatedFlow && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">{consolidatedFlow.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">{consolidatedFlow.description}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-2 mb-4">
                    <FlowDiagramViewer
                      flowData={consolidatedFlow.flowData}
                      title="Master Application Flow"
                      className="h-96"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <div className="font-medium text-green-800">Process Nodes</div>
                      <div className="text-green-600">{consolidatedFlow.flowData.nodes?.length || 0} steps</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="font-medium text-blue-800">Connections</div>
                      <div className="text-blue-600">{consolidatedFlow.flowData.edges?.length || 0} transitions</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded border border-purple-200">
                      <div className="font-medium text-purple-800">Source Flows</div>
                      <div className="text-purple-600">{flows.length} consolidated</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Stakeholder Flows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={stakeholderFlows}
                onChange={(e) => setStakeholderFlows(e.target.value)}
                placeholder="Stakeholder flow analysis data..."
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

        {/* Standalone Development Environment */}
        {!generatedProject && !isGenerating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-600" />
                Start Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <p className="text-gray-700 mb-4">
                    Jump straight into development with the integrated Replit
                    environment below. Create a new project and start coding
                    immediately.
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
                        <a
                          href="https://replit.com/new/nodejs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Generate Code ↗
                        </a>
                        <a
                          href="https://replit.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Open Replit ↗
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="relative bg-black">
                    <iframe
                      src="https://replit.com/@cvbiswanath/vivek?embed=true&output=1"
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
                        Start coding immediately - if embed doesn't load, click
                        "Generate Code" above
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FolderTree className="h-4 w-4" />
                        Getting Started
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                          1
                        </div>
                        <span>Choose your preferred framework and stack</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                          2
                        </div>
                        <span>Create a new Repl from templates</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                          3
                        </div>
                        <span>Start coding with live preview</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                          4
                        </div>
                        <span>Deploy with one click</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Pro Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Use project plans from the planning phase</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Implement user stories and wireframes</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Test features as you build them</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Share and collaborate in real-time</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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

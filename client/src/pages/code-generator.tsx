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
} from "lucide-react";

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

  // Load data from localStorage
  useEffect(() => {
    // Load project plan from multiple possible sources
    const projectPlanSources = [
      localStorage.getItem(STORAGE_KEYS.PROJECT_PLAN),
      localStorage.getItem(STORAGE_KEYS.PROJECT_DESCRIPTION),
      localStorage.getItem("project-plan"),
    ];
    const savedProjectPlan = projectPlanSources.find(
      (plan) => plan && plan.trim(),
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
      (data) => data && data.trim(),
    );

    if (savedProjectPlan) {
      setProjectPlan(savedProjectPlan);
    }
    if (savedStakeholderData) {
      setStakeholderFlows(savedStakeholderData);
    }

    setDataLoaded(true);
  }, []);

  const generateProjectCode = async () => {
    if (!projectPlan.trim()) {
      alert(
        "Please ensure you have a project plan. Visit the Project Planner page first.",
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
        },
      );

      setGeneratedProject(projectStructure);
    } catch (error) {
      console.error("Error generating project:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate project code";
      
      if (errorMessage.includes("API key")) {
        alert("Gemini API key is required for code generation. Please check your environment variables.");
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
        <WorkflowProgress currentStep="code" completedSteps={['input', 'plan', 'diagram', 'stories']} />
        
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
                <Label htmlFor="projectName" className="flex items-center gap-2 text-gray-700 font-medium mb-2">
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
                <Label htmlFor="framework" className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                  <Monitor className="h-4 w-4 text-green-600" />
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
                <Label htmlFor="backend" className="flex items-center gap-2 text-gray-700 font-medium mb-2">
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
                <Label htmlFor="database" className="flex items-center gap-2 text-gray-700 font-medium mb-2">
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
                <Label htmlFor="styling" className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                  <Palette className="h-4 w-4 text-pink-600" />
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
                <Label htmlFor="deployment" className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                  <Cloud className="h-4 w-4 text-indigo-600" />
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
                      width: `${(generationProgress.current / generationProgress.total) * 100}%`,
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
                <TabsList className="grid w-full grid-cols-6">
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
                      ),
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
                      ),
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
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

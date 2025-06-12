import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavigationBar } from "@/components/navigation-bar";
import { WorkflowProgress } from "@/components/workflow-progress";
import { createWireframeAnalysisAgent, type PageRequirement, type WireframeAnalysisResult, type ContentElement } from "@/lib/wireframe-analysis-agent";
import { Link } from "wouter";
import {
  Palette,
  Smartphone,
  Monitor,
  Tablet,
  Layers,
  Grid,
  Type,
  Image,
  Square,
  Circle,
  ArrowRight,
  Download,
  Copy,
  Eye,
  Settings,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Layout,
  MousePointer,
  Zap,
  Paintbrush,
  Frame,
  Component,
  Users,
  ShoppingCart,
  Calendar,
  MessageSquare,
  Home,
  User,
  Search,
  Bell,
  Menu,
  Plus,
  Edit3,
  Trash2,
  Save,
  RefreshCw,
  Upload,
  FileText,
  Star,
  Heart,
  Share2,
  Play,
  Pause,
  Volume2,
  Camera,
  Video,
  Map,
  Clock,
  Filter,
  SortAsc,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Target,
  Lightbulb,
  Briefcase,
  Shield,
  Activity
} from "lucide-react";

interface WireframeData {
  id: string;
  name: string;
  description: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenType: string;
  components: WireframeComponent[];
  colorScheme: string;
  style: string;
  timestamp: string;
}

interface WireframeComponent {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: Record<string, string>;
  content?: string;
}

interface DesignPrompt {
  projectType: string;
  targetAudience: string;
  primaryFeatures: string[];
  colorPreference: string;
  designStyle: string;
  deviceType: string;
  screenTypes: string[];
}

export default function WireframeDesigner() {
  const [projectInput, setProjectInput] = useState("");
  const [designPrompt, setDesignPrompt] = useState<DesignPrompt>({
    projectType: "",
    targetAudience: "",
    primaryFeatures: [],
    colorPreference: "blue",
    designStyle: "modern",
    deviceType: "mobile",
    screenTypes: []
  });
  const [wireframes, setWireframes] = useState<WireframeData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWireframe, setSelectedWireframe] = useState<WireframeData | null>(null);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState<"input" | "analyzing" | "generating" | "results">("input");
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, status: "" });
  const [analysisResult, setAnalysisResult] = useState<WireframeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load saved data and stakeholder flows
  useEffect(() => {
    const savedWireframes = localStorage.getItem('wireframe_designs');
    if (savedWireframes) {
      setWireframes(JSON.parse(savedWireframes));
    }

    // Load stakeholder flow data to populate screen types
    const stakeholderFlowData = localStorage.getItem('bpmn-stakeholder-flow-data');
    const personaFlowTypes = localStorage.getItem('bpmn-persona-flow-types');
    const projectDescription = localStorage.getItem('bpmn-project-description') || localStorage.getItem('bpmn-project-plan');
    
    if (stakeholderFlowData && personaFlowTypes) {
      const flowData = JSON.parse(stakeholderFlowData);
      const flowTypes = JSON.parse(personaFlowTypes);
      
      // Extract screen types from stakeholder flows
      const availableScreenTypes: string[] = [];
      Object.entries(flowTypes).forEach(([stakeholder, flows]: [string, any]) => {
        if (Array.isArray(flows)) {
          flows.forEach(flow => {
            if (!availableScreenTypes.includes(flow)) {
              availableScreenTypes.push(flow);
            }
          });
        }
      });

      // Auto-populate design prompt with stakeholder data
      setDesignPrompt(prev => ({
        ...prev,
        screenTypes: availableScreenTypes.slice(0, 8), // Limit to 8 screens initially
      }));

      // Auto-populate project input if available
      if (projectDescription) {
        setProjectInput(projectDescription);
      }
    }
  }, []);

  // Device type options
  const deviceTypes = [
    { value: "mobile", label: "Mobile", icon: Smartphone },
    { value: "tablet", label: "Tablet", icon: Tablet },
    { value: "desktop", label: "Desktop", icon: Monitor }
  ];

  // Screen type options by category
  const screenTypesByCategory = {
    "E-commerce": ["Product List", "Product Detail", "Shopping Cart", "Checkout", "User Profile", "Search Results"],
    "Social Media": ["Feed", "Profile", "Messages", "Stories", "Notifications", "Settings"],
    "Business/SaaS": ["Dashboard", "Analytics", "User Management", "Settings", "Reports", "Onboarding"],
    "Content/Blog": ["Article List", "Article Detail", "Author Profile", "Categories", "Search", "Comments"],
    "Health/Fitness": ["Workout Plans", "Progress Tracking", "Nutrition", "Goals", "Community", "Profile"],
    "Finance": ["Account Overview", "Transactions", "Budgeting", "Investments", "Goals", "Reports"],
    "Education": ["Course List", "Lesson Detail", "Progress", "Assignments", "Discussion", "Profile"],
    "Travel": ["Destination Search", "Booking", "Itinerary", "Reviews", "Profile", "Maps"],
    "Food/Restaurant": ["Menu", "Order", "Delivery Tracking", "Reviews", "Profile", "Favorites"],
    "Generic": ["Landing Page", "Login", "Registration", "Profile", "Settings", "About"]
  };

  // Color schemes
  const colorSchemes = [
    { value: "blue", label: "Professional Blue", colors: ["#3B82F6", "#1E40AF", "#60A5FA"] },
    { value: "green", label: "Nature Green", colors: ["#10B981", "#059669", "#34D399"] },
    { value: "purple", label: "Creative Purple", colors: ["#8B5CF6", "#7C3AED", "#A78BFA"] },
    { value: "orange", label: "Energetic Orange", colors: ["#F59E0B", "#D97706", "#FBBF24"] },
    { value: "teal", label: "Modern Teal", colors: ["#14B8A6", "#0D9488", "#5EEAD4"] },
    { value: "red", label: "Bold Red", colors: ["#EF4444", "#DC2626", "#F87171"] },
    { value: "gray", label: "Minimal Gray", colors: ["#6B7280", "#4B5563", "#9CA3AF"] }
  ];

  // Design styles
  const designStyles = [
    { value: "modern", label: "Modern & Clean" },
    { value: "minimal", label: "Minimalist" },
    { value: "playful", label: "Playful & Colorful" },
    { value: "professional", label: "Professional" },
    { value: "creative", label: "Creative & Artistic" },
    { value: "corporate", label: "Corporate" }
  ];

  const analyzeStakeholderFlows = async () => {
    setIsAnalyzing(true);
    setError("");
    setCurrentStep("analyzing");
    setGenerationProgress({ current: 0, total: 1, status: "Analyzing stakeholder flows..." });

    try {
      const analysisAgent = createWireframeAnalysisAgent();
      const result = await analysisAgent.analyzeStakeholderFlows();
      
      setAnalysisResult(result);
      setCurrentStep("input");
      setGenerationProgress({ current: 0, total: 0, status: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze stakeholder flows");
      setCurrentStep("input");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateWireframes = async () => {
    // Get stakeholder flow data from local storage
    const stakeholderFlowData = localStorage.getItem('bpmn-stakeholder-flow-data');
    const personaFlowTypes = localStorage.getItem('bpmn-persona-flow-types');
    const projectDescription = localStorage.getItem('bpmn-project-description') || localStorage.getItem('bpmn-project-plan');
    
    // Use stakeholder data if available, otherwise require manual input
    let screenTypesToGenerate = designPrompt.screenTypes;
    let projectContext = projectInput;
    
    if (stakeholderFlowData && personaFlowTypes) {
      const flowTypes = JSON.parse(personaFlowTypes);
      
      // Extract all unique screen types from stakeholder flows
      const extractedScreenTypes: string[] = [];
      Object.entries(flowTypes).forEach(([stakeholder, flows]: [string, any]) => {
        if (Array.isArray(flows)) {
          flows.forEach(flow => {
            if (!extractedScreenTypes.includes(flow)) {
              extractedScreenTypes.push(flow);
            }
          });
        }
      });

      if (extractedScreenTypes.length > 0) {
        screenTypesToGenerate = extractedScreenTypes;
      }

      // Use project description from stakeholder analysis
      if (projectDescription) {
        projectContext = projectDescription;
      }
    } else if (!projectInput.trim() || !designPrompt.projectType || designPrompt.screenTypes.length === 0) {
      setError("Please complete the Stakeholder Flow Analysis first, or manually fill in all required fields");
      return;
    }

    setIsGenerating(true);
    setError("");
    setCurrentStep("generating");
    setGenerationProgress({ current: 0, total: screenTypesToGenerate.length, status: "Analyzing stakeholder flows..." });

    try {
      const newWireframes: WireframeData[] = [];

      for (let i = 0; i < screenTypesToGenerate.length; i++) {
        const screenType = screenTypesToGenerate[i];
        setGenerationProgress({ 
          current: i + 1, 
          total: screenTypesToGenerate.length, 
          status: `Generating ${screenType} wireframe...` 
        });

        // Simulate AI generation with realistic delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

        const wireframe = generateWireframeData(screenType, i);
        
        // Update wireframe description with project context
        if (projectContext) {
          wireframe.description = `${screenType} interface for: ${projectContext.substring(0, 100)}${projectContext.length > 100 ? '...' : ''}`;
        }
        
        newWireframes.push(wireframe);
      }

      setWireframes(prev => [...prev, ...newWireframes]);
      localStorage.setItem('wireframe_designs', JSON.stringify([...wireframes, ...newWireframes]));
      setCurrentStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate wireframes");
      setCurrentStep("input");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWireframeData = (screenType: string, index: number): WireframeData => {
    const id = `wireframe_${Date.now()}_${index}`;
    const components = generateComponentsForScreenType(screenType, designPrompt.deviceType);

    return {
      id,
      name: `${screenType} - ${designPrompt.deviceType}`,
      description: `${screenType} screen for ${designPrompt.projectType} application`,
      deviceType: designPrompt.deviceType as 'mobile' | 'tablet' | 'desktop',
      screenType,
      components,
      colorScheme: designPrompt.colorPreference,
      style: designPrompt.designStyle,
      timestamp: new Date().toISOString()
    };
  };

  const generateComponentsForScreenType = (screenType: string, deviceType: string): WireframeComponent[] => {
    const baseComponents: WireframeComponent[] = [];
    const isDesktop = deviceType === 'desktop';
    const isMobile = deviceType === 'mobile';

    // Get stakeholder flow details for this screen type
    const stakeholderFlowData = localStorage.getItem('bpmn-stakeholder-flow-data');
    let flowDetails: any = null;
    
    if (stakeholderFlowData) {
      try {
        const flowData = JSON.parse(stakeholderFlowData);
        // Find flow details for this screen type
        Object.values(flowData).forEach((details: any) => {
          if (details && details.processDescription && 
              details.processDescription.toLowerCase().includes(screenType.toLowerCase())) {
            flowDetails = details;
          }
        });
      } catch (error) {
        console.warn('Error parsing stakeholder flow data:', error);
      }
    }

    // Common header/navigation
    if (isDesktop) {
      baseComponents.push({
        id: 'header',
        type: 'header',
        label: 'Navigation Header',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 8 },
        style: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }
      });
    } else {
      baseComponents.push({
        id: 'mobile-header',
        type: 'mobile-header',
        label: 'Mobile Header',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 12 },
        style: { backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }
      });
    }

    // Generate components based on flow details
    if (flowDetails && typeof flowDetails === 'object') {
      let yPosition = isDesktop ? 15 : 20;
      
      // Add trigger component if available
      if (flowDetails.trigger && typeof flowDetails.trigger === 'string') {
        baseComponents.push({
          id: 'trigger-section',
          type: 'trigger',
          label: 'Trigger Section',
          position: { x: 5, y: yPosition },
          size: { width: 90, height: 15 },
          content: flowDetails.trigger
        });
        yPosition += 20;
      }

      // Add activities as interactive elements
      if (flowDetails.activities && Array.isArray(flowDetails.activities)) {
        const activitiesPerRow = isMobile ? 1 : isDesktop ? 3 : 2;
        const componentWidth = isMobile ? 90 : isDesktop ? 28 : 42;
        
        flowDetails.activities.slice(0, 6).forEach((activity: string, index: number) => {
          const row = Math.floor(index / activitiesPerRow);
          const col = index % activitiesPerRow;
          const xPos = 5 + (col * (componentWidth + 5));
          const yPos = yPosition + (row * 25);
          
          baseComponents.push({
            id: `activity-${index}`,
            type: 'activity-card',
            label: `Activity ${index + 1}`,
            position: { x: xPos, y: yPos },
            size: { width: componentWidth, height: 20 },
            content: activity && typeof activity === 'string' && activity.length > 30 ? activity.substring(0, 30) + '...' : activity
          });
        });
        yPosition += Math.ceil(flowDetails.activities.length / activitiesPerRow) * 25 + 10;
      }

      // Add decision points as interactive elements
      if (flowDetails.decisionPoints && Array.isArray(flowDetails.decisionPoints)) {
        flowDetails.decisionPoints.slice(0, 3).forEach((decision: string, index: number) => {
          baseComponents.push({
            id: `decision-${index}`,
            type: 'decision-point',
            label: `Decision ${index + 1}`,
            position: { x: 5 + (index * 30), y: yPosition },
            size: { width: 25, height: 15 },
            content: decision && typeof decision === 'string' && decision.length > 20 ? decision.substring(0, 20) + '...' : decision,
            style: { backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }
          });
        });
        yPosition += 20;
      }

      // Add participants as user elements
      if (flowDetails.participants && Array.isArray(flowDetails.participants)) {
        baseComponents.push({
          id: 'participants-section',
          type: 'participants',
          label: 'Stakeholders',
          position: { x: 5, y: yPosition },
          size: { width: 90, height: 12 },
          content: `Involved: ${flowDetails.participants.slice(0, 3).join(', ')}`
        });
        yPosition += 17;
      }

      // Add end event
      if (flowDetails.endEvent && typeof flowDetails.endEvent === 'string') {
        baseComponents.push({
          id: 'end-section',
          type: 'end-event',
          label: 'Completion',
          position: { x: 5, y: yPosition },
          size: { width: 90, height: 10 },
          content: flowDetails.endEvent,
          style: { backgroundColor: '#dcfce7', border: '1px solid #16a34a' }
        });
      }
    } else {
      // Fallback to generic components based on screen type name
      const screenTypeLower = screenType.toLowerCase();
      
      if (screenTypeLower.includes('dashboard') || screenTypeLower.includes('analytics')) {
        baseComponents.push(
          {
            id: 'stats-grid',
            type: 'stats-grid',
            label: 'Key Metrics',
            position: { x: 5, y: isDesktop ? 15 : 20 },
            size: { width: 90, height: 25 },
            content: 'Statistics and KPIs'
          },
          {
            id: 'chart-area',
            type: 'chart',
            label: 'Data Visualization',
            position: { x: 5, y: isDesktop ? 45 : 50 },
            size: { width: isMobile ? 90 : 60, height: 30 },
            content: 'Charts and Graphs'
          }
        );
      } else if (screenTypeLower.includes('approval') || screenTypeLower.includes('review')) {
        baseComponents.push(
          {
            id: 'approval-form',
            type: 'form',
            label: 'Approval Form',
            position: { x: 5, y: isDesktop ? 15 : 20 },
            size: { width: 90, height: 40 },
            content: 'Approval workflow interface'
          },
          {
            id: 'action-buttons',
            type: 'actions',
            label: 'Action Buttons',
            position: { x: 5, y: isDesktop ? 60 : 65 },
            size: { width: 90, height: 15 },
            content: 'Approve, Reject, Request Changes'
          }
        );
      } else if (screenTypeLower.includes('management') || screenTypeLower.includes('admin')) {
        baseComponents.push(
          {
            id: 'management-grid',
            type: 'data-grid',
            label: 'Management Grid',
            position: { x: 5, y: isDesktop ? 15 : 20 },
            size: { width: 90, height: 50 },
            content: 'Data management interface'
          },
          {
            id: 'management-controls',
            type: 'controls',
            label: 'Management Controls',
            position: { x: 5, y: isDesktop ? 70 : 75 },
            size: { width: 90, height: 15 },
            content: 'Add, Edit, Delete, Export'
          }
        );
      } else {
        baseComponents.push({
          id: 'main-content',
          type: 'content-area',
          label: 'Main Content',
          position: { x: 5, y: isDesktop ? 15 : 20 },
          size: { width: 90, height: 70 },
          content: `${screenType} Interface`
        });
      }
    }

    return baseComponents;
  };

  const handleFeatureToggle = (feature: string) => {
    setDesignPrompt(prev => ({
      ...prev,
      primaryFeatures: prev.primaryFeatures.includes(feature)
        ? prev.primaryFeatures.filter(f => f !== feature)
        : [...prev.primaryFeatures, feature]
    }));
  };

  const handleScreenTypeToggle = (screenType: string) => {
    setDesignPrompt(prev => ({
      ...prev,
      screenTypes: prev.screenTypes.includes(screenType)
        ? prev.screenTypes.filter(s => s !== screenType)
        : [...prev.screenTypes, screenType]
    }));
  };

  const exportWireframe = (wireframe: WireframeData) => {
    const dataStr = JSON.stringify(wireframe, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${wireframe.name.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  const clearAllWireframes = () => {
    setWireframes([]);
    localStorage.removeItem('wireframe_designs');
  };

  const commonFeatures = [
    "User Authentication", "Search Functionality", "Notifications", "User Profile",
    "Settings/Preferences", "Data Visualization", "File Upload", "Social Sharing",
    "Comments/Reviews", "Favorites/Bookmarks", "Chat/Messaging", "Payment Integration",
    "Multi-language Support", "Dark Mode", "Offline Support", "Push Notifications"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NavigationBar title="Wireframe Designer" showBackButton={true} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <WorkflowProgress currentStep="diagram" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-lg p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Layout className="h-5 w-5 text-white" />
              </div>
              AI Wireframe Designer
            </h1>
            <p className="text-gray-600 mt-2">
              Generate Figma-like wireframes and screen designs with AI
            </p>
          </div>
          {wireframes.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {wireframes.length} wireframes
              </Badge>
              <Button
                onClick={clearAllWireframes}
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Design Input Form */}
        {currentStep === "input" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5" />
                Design Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Description */}
              <div>
                <Label htmlFor="project-input" className="text-sm font-medium mb-2 block">
                  Project Description *
                </Label>
                <Textarea
                  id="project-input"
                  value={projectInput}
                  onChange={(e) => setProjectInput(e.target.value)}
                  placeholder="Describe your project, app, or website. Include the purpose, target users, and key functionality..."
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Type */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Project Type *
                  </Label>
                  <Select
                    value={designPrompt.projectType}
                    onValueChange={(value) => setDesignPrompt(prev => ({ ...prev, projectType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(screenTypesByCategory).map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Audience */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Target Audience
                  </Label>
                  <Input
                    value={designPrompt.targetAudience}
                    onChange={(e) => setDesignPrompt(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="e.g., Business professionals, Students, General consumers"
                  />
                </div>
              </div>

              {/* Device Type */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Device Type *
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {deviceTypes.map(device => {
                    const Icon = device.icon;
                    return (
                      <Button
                        key={device.value}
                        variant={designPrompt.deviceType === device.value ? "default" : "outline"}
                        onClick={() => setDesignPrompt(prev => ({ ...prev, deviceType: device.value }))}
                        className="h-20 flex-col"
                      >
                        <Icon className="h-6 w-6 mb-2" />
                        {device.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Screen Types */}
              {designPrompt.projectType && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Screen Types to Generate * ({designPrompt.screenTypes.length} selected)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {screenTypesByCategory[designPrompt.projectType as keyof typeof screenTypesByCategory]?.map(screenType => (
                      <Button
                        key={screenType}
                        variant={designPrompt.screenTypes.includes(screenType) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleScreenTypeToggle(screenType)}
                        className="justify-start"
                      >
                        <CheckCircle className={`h-3 w-3 mr-2 ${designPrompt.screenTypes.includes(screenType) ? 'text-white' : 'text-gray-400'}`} />
                        {screenType}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Design Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Color Scheme */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Color Scheme
                  </Label>
                  <div className="space-y-2">
                    {colorSchemes.map(scheme => (
                      <Button
                        key={scheme.value}
                        variant={designPrompt.colorPreference === scheme.value ? "default" : "outline"}
                        onClick={() => setDesignPrompt(prev => ({ ...prev, colorPreference: scheme.value }))}
                        className="w-full justify-between"
                        size="sm"
                      >
                        <span>{scheme.label}</span>
                        <div className="flex gap-1">
                          {scheme.colors.map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded-full border border-white"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Design Style */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Design Style
                  </Label>
                  <div className="space-y-2">
                    {designStyles.map(style => (
                      <Button
                        key={style.value}
                        variant={designPrompt.designStyle === style.value ? "default" : "outline"}
                        onClick={() => setDesignPrompt(prev => ({ ...prev, designStyle: style.value }))}
                        className="w-full justify-start"
                        size="sm"
                      >
                        {style.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary Features */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Primary Features ({designPrompt.primaryFeatures.length} selected)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {commonFeatures.map(feature => (
                    <Button
                      key={feature}
                      variant={designPrompt.primaryFeatures.includes(feature) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFeatureToggle(feature)}
                      className="justify-start text-xs"
                    >
                      <Plus className={`h-3 w-3 mr-1 ${designPrompt.primaryFeatures.includes(feature) ? 'text-white' : 'text-gray-400'}`} />
                      {feature}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={generateWireframes}
                  disabled={!projectInput.trim() || !designPrompt.projectType || designPrompt.screenTypes.length === 0}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 py-3"
                  size="lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Wireframes ({designPrompt.screenTypes.length} screens)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generation Progress */}
        {isGenerating && (
          <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Generating Wireframes</h3>
                      <p className="text-sm text-gray-600">{generationProgress.status}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    {generationProgress.current} / {generationProgress.total}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(generationProgress.current / generationProgress.total) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Wireframes */}
        {wireframes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Frame className="h-5 w-5" />
                  Generated Wireframes ({wireframes.length})
                </div>
                {currentStep === "results" && (
                  <Button
                    onClick={() => setCurrentStep("input")}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create More
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wireframes.map((wireframe, index) => (
                  <div key={wireframe.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    {/* Wireframe Preview */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 aspect-[3/4] relative overflow-hidden">
                      <div className="absolute inset-0 bg-white m-2 rounded shadow-sm">
                        {/* Render wireframe components */}
                        {wireframe.components.map(component => (
                          <div
                            key={component.id}
                            className="absolute bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-xs text-gray-600"
                            style={{
                              left: `${component.position.x}%`,
                              top: `${component.position.y}%`,
                              width: `${component.size.width}%`,
                              height: `${component.size.height}%`,
                              ...component.style
                            }}
                          >
                            <span className="text-center px-1">
                              {component.content || component.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Device Frame */}
                      {wireframe.deviceType === 'mobile' && (
                        <div className="absolute inset-0 border-4 border-gray-800 rounded-xl pointer-events-none" />
                      )}
                    </div>

                    {/* Wireframe Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-800">{wireframe.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {wireframe.deviceType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {wireframe.description}
                      </p>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          onClick={() => setSelectedWireframe(wireframe)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          onClick={() => exportWireframe(wireframe)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wireframe Detail Modal */}
        {selectedWireframe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{selectedWireframe.name}</h2>
                <Button
                  onClick={() => setSelectedWireframe(null)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wireframe Preview */}
                <div>
                  <div className="bg-gray-50 rounded-lg p-6 aspect-[3/4] relative">
                    <div className="absolute inset-4 bg-white rounded shadow-sm">
                      {selectedWireframe.components.map(component => (
                        <div
                          key={component.id}
                          className="absolute bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-sm text-gray-600"
                          style={{
                            left: `${component.position.x}%`,
                            top: `${component.position.y}%`,
                            width: `${component.size.width}%`,
                            height: `${component.size.height}%`,
                            ...component.style
                          }}
                        >
                          <span className="text-center px-2">
                            {component.content || component.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Wireframe Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedWireframe.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Specifications</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Device Type:</span>
                        <span className="capitalize">{selectedWireframe.deviceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Screen Type:</span>
                        <span>{selectedWireframe.screenType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Components:</span>
                        <span>{selectedWireframe.components.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Color Scheme:</span>
                        <span className="capitalize">{selectedWireframe.colorScheme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Style:</span>
                        <span className="capitalize">{selectedWireframe.style}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Components</h3>
                    <div className="space-y-2">
                      {selectedWireframe.components.map(component => (
                        <div key={component.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <span>{component.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {component.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => exportWireframe(selectedWireframe)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedWireframe, null, 2));
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        {wireframes.length > 0 && (
          <div className="flex justify-center">
            <Link href="/code-generator">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3">
                <ArrowRight className="h-5 w-5 mr-2" />
                Continue to Code Generation
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
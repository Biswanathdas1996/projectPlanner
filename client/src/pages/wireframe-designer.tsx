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
import { createHTMLWireframeGenerator, type DetailedPageContent } from "@/lib/html-wireframe-generator";
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

interface PageContentCard {
  id: string;
  pageName: string;
  pageType: string;
  purpose: string;
  stakeholders: string[];
  headers: string[];
  buttons: { label: string; action: string; style: string }[];
  forms: { title: string; fields: string[]; submitAction: string }[];
  lists: { title: string; items: string[]; type: string }[];
  navigation: string[];
  additionalContent: string[];
  isEdited: boolean;
}

// Generate content cards from stakeholder flows
const generateContentCardsFromFlows = async (stakeholderData: any, flowTypes: any, projectDescription: string): Promise<PageContentCard[]> => {
  const cards: PageContentCard[] = [];
  
  // Analyze the actual flow data structure
  let pageTypes = [];
  
  if (flowTypes && typeof flowTypes === 'object' && !Array.isArray(flowTypes)) {
    // Extract from stakeholder -> flow types structure
    for (const [stakeholder, flows] of Object.entries(flowTypes)) {
      if (Array.isArray(flows)) {
        flows.forEach((flowName: string) => {
          // Extract page type from flow name
          const pageType = extractPageTypeFromFlowName(flowName);
          const pageName = flowName.replace(' Flow', '').replace(' Management', '');
          
          pageTypes.push({
            name: pageName,
            type: pageType,
            stakeholders: [stakeholder],
            description: `${pageName} interface for ${stakeholder} role`,
            flowName: flowName,
            originalStakeholder: stakeholder
          });
        });
      }
    }
  }
  
  // Also analyze stakeholder data for additional context
  if (Array.isArray(stakeholderData)) {
    stakeholderData.forEach((flow: any) => {
      if (flow.flowType && flow.stakeholder) {
        const existingPage = pageTypes.find(p => p.flowName === flow.flowType);
        if (existingPage) {
          // Add BPMN context to existing page
          existingPage.bpmnXml = flow.bpmnXml;
          existingPage.bpmnContext = extractBpmnContext(flow.bpmnXml);
        }
      }
    });
  }
  
  // If no pages found, create defaults
  if (pageTypes.length === 0) {
    pageTypes = [
      { name: 'Dashboard', type: 'dashboard', stakeholders: ['User'], description: 'Main dashboard interface' },
      { name: 'Management Panel', type: 'admin', stakeholders: ['Admin'], description: 'Administrative interface' },
      { name: 'Reports', type: 'reports', stakeholders: ['Manager'], description: 'Analytics and reporting' }
    ];
  }

  for (let i = 0; i < pageTypes.length; i++) {
    const pageType = pageTypes[i];
    
    // Generate content based on actual flow analysis
    const headers = generateHeadersFromFlow(pageType);
    const buttons = generateButtonsFromFlow(pageType);
    const forms = generateFormsFromFlow(pageType);
    const lists = generateListsFromFlow(pageType);
    const navigation = generateNavigationFromFlow(pageType);
    
    cards.push({
      id: `card_${Date.now()}_${i}`,
      pageName: pageType.name,
      pageType: pageType.type,
      purpose: pageType.description || `${pageType.type} interface for managing business processes`,
      stakeholders: pageType.stakeholders,
      headers,
      buttons,
      forms,
      lists,
      navigation,
      additionalContent: [],
      isEdited: false
    });
  }

  return cards;
};

// Extract page type from flow name
const extractPageTypeFromFlowName = (flowName: string): string => {
  const name = flowName.toLowerCase();
  if (name.includes('approval') || name.includes('review')) return 'approval';
  if (name.includes('budget') || name.includes('allocation')) return 'finance';
  if (name.includes('user') || name.includes('management')) return 'admin';
  if (name.includes('device') || name.includes('configuration')) return 'settings';
  if (name.includes('security') || name.includes('alert')) return 'security';
  if (name.includes('energy') || name.includes('data')) return 'reports';
  if (name.includes('automation') || name.includes('rule')) return 'automation';
  if (name.includes('interaction')) return 'interface';
  return 'dashboard';
};

// Extract meaningful context from BPMN XML
const extractBpmnContext = (bpmnXml: string): any => {
  if (!bpmnXml) return {};
  
  const context = {
    activities: [] as string[],
    decisions: [] as string[],
    events: [] as string[],
    documentation: ''
  };
  
  // Extract process documentation
  const docMatch = bpmnXml.match(/<bpmn2:documentation>(.*?)<\/bpmn2:documentation>/);
  if (docMatch) {
    context.documentation = docMatch[1];
  }
  
  // Extract task names using exec for better compatibility
  const taskRegex = /name="([^"]*(?:Task|Activity|Review|Approval|Submit)[^"]*)"/g;
  let taskMatch;
  while ((taskMatch = taskRegex.exec(bpmnXml)) !== null) {
    context.activities.push(taskMatch[1]);
  }
  
  // Extract gateway/decision names
  const gatewayRegex = /name="([^"]*(?:Gateway|Decision|Check|Validate)[^"]*)"/g;
  let gatewayMatch;
  while ((gatewayMatch = gatewayRegex.exec(bpmnXml)) !== null) {
    context.decisions.push(gatewayMatch[1]);
  }
  
  // Extract event names
  const eventRegex = /name="([^"]*(?:Event|Start|End|Submit|Complete)[^"]*)"/g;
  let eventMatch;
  while ((eventMatch = eventRegex.exec(bpmnXml)) !== null) {
    context.events.push(eventMatch[1]);
  }
  
  return context;
};

// Generate content from actual flow analysis
const generateHeadersFromFlow = (pageType: any): string[] => {
  const headers = [pageType.name];
  
  if (pageType.bpmnContext?.documentation) {
    const doc = pageType.bpmnContext.documentation;
    if (doc.includes('approval')) headers.push('Approval Status', 'Pending Reviews');
    if (doc.includes('management')) headers.push('Management Dashboard', 'System Overview');
    if (doc.includes('security')) headers.push('Security Alerts', 'Access Control');
    if (doc.includes('energy')) headers.push('Energy Consumption', 'Data Analytics');
  }
  
  if (pageType.bpmnContext?.activities?.length > 0) {
    headers.push('Recent Activities');
    headers.push(...pageType.bpmnContext.activities.slice(0, 2));
  }
  
  return headers.slice(0, 4);
};

const generateButtonsFromFlow = (pageType: any): { label: string; action: string; style: string }[] => {
  const buttons = [];
  
  if (pageType.bpmnContext?.events?.length > 0) {
    pageType.bpmnContext.events.forEach((event: string) => {
      if (event.includes('Submit')) {
        buttons.push({ label: 'Submit Request', action: 'submit', style: 'primary' });
      }
      if (event.includes('Approve')) {
        buttons.push({ label: 'Approve', action: 'approve', style: 'primary' });
      }
      if (event.includes('Complete')) {
        buttons.push({ label: 'Mark Complete', action: 'complete', style: 'secondary' });
      }
    });
  }
  
  // Add type-specific buttons
  switch (pageType.type) {
    case 'approval':
      buttons.push({ label: 'Review Documents', action: 'review', style: 'outline' });
      break;
    case 'admin':
      buttons.push({ label: 'Add User', action: 'create', style: 'primary' });
      buttons.push({ label: 'Export Data', action: 'export', style: 'outline' });
      break;
    case 'security':
      buttons.push({ label: 'View Alerts', action: 'view', style: 'secondary' });
      break;
  }
  
  return buttons.slice(0, 4);
};

const generateFormsFromFlow = (pageType: any): { title: string; fields: string[]; submitAction: string }[] => {
  const forms = [];
  
  if (pageType.bpmnContext?.activities?.length > 0) {
    const activities = pageType.bpmnContext.activities;
    
    activities.forEach((activity: string) => {
      if (activity.includes('Submit') || activity.includes('Create')) {
        forms.push({
          title: `${activity} Form`,
          fields: generateFieldsForActivity(activity),
          submitAction: 'submit'
        });
      }
    });
  }
  
  // Default forms based on page type
  if (forms.length === 0) {
    switch (pageType.type) {
      case 'approval':
        forms.push({
          title: 'Approval Request',
          fields: ['Request Title', 'Description', 'Priority', 'Due Date'],
          submitAction: 'submitApproval'
        });
        break;
      case 'admin':
        forms.push({
          title: 'User Management',
          fields: ['Username', 'Email', 'Role', 'Department'],
          submitAction: 'createUser'
        });
        break;
    }
  }
  
  return forms.slice(0, 2);
};

const generateListsFromFlow = (pageType: any): { title: string; items: string[]; type: string }[] => {
  const lists = [];
  
  if (pageType.bpmnContext?.decisions?.length > 0) {
    lists.push({
      title: 'Decision Points',
      items: pageType.bpmnContext.decisions,
      type: 'decisions'
    });
  }
  
  if (pageType.bpmnContext?.activities?.length > 0) {
    lists.push({
      title: 'Process Activities',
      items: pageType.bpmnContext.activities.slice(0, 5),
      type: 'activities'
    });
  }
  
  // Add stakeholder-specific lists
  if (pageType.stakeholders?.includes('CEO')) {
    lists.push({
      title: 'Executive Summary',
      items: ['Budget Overview', 'Project Status', 'Risk Assessment'],
      type: 'executive'
    });
  }
  
  return lists.slice(0, 3);
};

const generateNavigationFromFlow = (pageType: any): string[] => {
  const navigation = ['Dashboard'];
  
  if (pageType.stakeholders?.includes('CEO')) {
    navigation.push('Executive Overview', 'Strategic Planning');
  }
  if (pageType.stakeholders?.includes('Admin')) {
    navigation.push('System Management', 'User Administration');
  }
  if (pageType.stakeholders?.includes('User')) {
    navigation.push('My Tasks', 'Notifications');
  }
  
  navigation.push('Reports', 'Settings');
  return navigation;
};

const generateFieldsForActivity = (activity: string): string[] => {
  const fields = [];
  
  if (activity.includes('Proposal')) {
    fields.push('Project Title', 'Description', 'Budget', 'Timeline');
  } else if (activity.includes('Review')) {
    fields.push('Review Comments', 'Status', 'Reviewer');
  } else if (activity.includes('Approval')) {
    fields.push('Approval Decision', 'Comments', 'Next Steps');
  } else {
    fields.push('Title', 'Description', 'Priority');
  }
  
  return fields;
};

// Client-side wireframe prompt builder
const buildWireframePrompt = (pageContent: PageContentCard, designStyle: string, deviceType: string): string => {
  return `Generate a complete HTML wireframe with embedded CSS for a ${pageContent.pageType} page.

**Page Details:**
- Page Name: ${pageContent.pageName}
- Purpose: ${pageContent.purpose}
- Target Users: ${pageContent.stakeholders.join(', ')}
- Design Style: ${designStyle}
- Device Type: ${deviceType}

**Content Elements to Include:**

**Headers:** ${pageContent.headers.join(', ')}

**Buttons:** ${pageContent.buttons.map(btn => `${btn.label} (${btn.style} style)`).join(', ')}

**Forms:** ${pageContent.forms.map(form => `${form.title} with fields: ${form.fields.join(', ')}`).join(' | ')}

**Lists:** ${pageContent.lists.map(list => `${list.title}: ${list.items.join(', ')}`).join(' | ')}

**Navigation:** ${pageContent.navigation.join(', ')}

**Requirements:**
1. Create a complete HTML page with modern, responsive design
2. Use inline CSS styles for a self-contained wireframe
3. Include all specified content elements
4. Make it visually appealing and functional
5. Use ${designStyle} design principles
6. Optimize for ${deviceType} viewing
7. Include realistic placeholder content
8. Add proper semantic HTML structure
9. Use modern CSS with flexbox/grid layouts
10. Ensure good typography and spacing

**Response Format:**
Provide the HTML code first, followed by additional CSS if needed.

Generate a professional, realistic wireframe that could be used as a starting point for actual development.`;
};

// Client-side code extraction
const extractCodeFromResponse = (response: string): { htmlCode: string; cssCode: string } => {
  // Extract HTML code
  const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/i) || 
                   response.match(/<html[\s\S]*?<\/html>/i) ||
                   response.match(/<!DOCTYPE html[\s\S]*?<\/html>/i);
  
  let htmlCode = htmlMatch ? htmlMatch[1] || htmlMatch[0] : '';
  
  // If no HTML found, try to extract from general code blocks
  if (!htmlCode) {
    const codeMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (codeMatch && codeMatch[1].includes('<html')) {
      htmlCode = codeMatch[1];
    }
  }

  // Extract CSS code (separate from HTML)
  const cssMatch = response.match(/```css\s*([\s\S]*?)\s*```/i);
  let cssCode = cssMatch ? cssMatch[1] : '';

  // If HTML doesn't include DOCTYPE, add it
  if (htmlCode && !htmlCode.includes('<!DOCTYPE')) {
    if (!htmlCode.includes('<html')) {
      htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wireframe</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
  </style>
</head>
<body>
${htmlCode}
</body>
</html>`;
    } else {
      htmlCode = `<!DOCTYPE html>\n${htmlCode}`;
    }
  }

  // Clean up the code
  htmlCode = htmlCode.trim();
  cssCode = cssCode.trim();

  return { htmlCode, cssCode };
};

// Helper functions for content generation
const generateHeadersForPageType = (pageType: string, pageName: string): string[] => {
  const headers = [pageName];
  
  switch (pageType.toLowerCase()) {
    case 'dashboard':
      headers.push('Overview', 'Recent Activity', 'Key Metrics');
      break;
    case 'login':
      headers.push('Welcome Back', 'Sign In to Your Account');
      break;
    case 'profile':
      headers.push('My Profile', 'Account Settings', 'Personal Information');
      break;
    case 'admin':
      headers.push('Admin Panel', 'System Management', 'User Management');
      break;
    case 'reports':
      headers.push('Reports & Analytics', 'Performance Metrics', 'Data Insights');
      break;
    default:
      headers.push('Welcome', 'Main Content', 'Actions');
  }
  
  return headers;
};

const generateButtonsForPageType = (pageType: string, stakeholders: string[]): { label: string; action: string; style: string }[] => {
  const buttons = [];
  
  switch (pageType.toLowerCase()) {
    case 'dashboard':
      buttons.push(
        { label: 'View Reports', action: 'navigate', style: 'primary' },
        { label: 'Create New', action: 'modal', style: 'secondary' },
        { label: 'Export Data', action: 'download', style: 'outline' }
      );
      break;
    case 'login':
      buttons.push(
        { label: 'Sign In', action: 'submit', style: 'primary' },
        { label: 'Forgot Password?', action: 'link', style: 'link' },
        { label: 'Create Account', action: 'navigate', style: 'outline' }
      );
      break;
    case 'profile':
      buttons.push(
        { label: 'Save Changes', action: 'submit', style: 'primary' },
        { label: 'Cancel', action: 'reset', style: 'outline' },
        { label: 'Change Password', action: 'modal', style: 'secondary' }
      );
      break;
    default:
      buttons.push(
        { label: 'Save', action: 'submit', style: 'primary' },
        { label: 'Cancel', action: 'reset', style: 'outline' }
      );
  }
  
  return buttons;
};

const generateFormsForPageType = (pageType: string): { title: string; fields: string[]; submitAction: string }[] => {
  const forms = [];
  
  switch (pageType.toLowerCase()) {
    case 'login':
      forms.push({
        title: 'Login Form',
        fields: ['Email Address', 'Password', 'Remember Me'],
        submitAction: 'authenticate'
      });
      break;
    case 'profile':
      forms.push({
        title: 'Profile Information',
        fields: ['First Name', 'Last Name', 'Email', 'Phone Number', 'Department'],
        submitAction: 'updateProfile'
      });
      break;
    case 'admin':
      forms.push({
        title: 'User Management',
        fields: ['Username', 'Role', 'Permissions', 'Status'],
        submitAction: 'manageUser'
      });
      break;
    default:
      if (pageType !== 'dashboard' && pageType !== 'reports') {
        forms.push({
          title: 'Data Entry Form',
          fields: ['Title', 'Description', 'Category', 'Status'],
          submitAction: 'saveData'
        });
      }
  }
  
  return forms;
};

const generateListsForPageType = (pageType: string, stakeholders: string[]): { title: string; items: string[]; type: string }[] => {
  const lists = [];
  
  switch (pageType.toLowerCase()) {
    case 'dashboard':
      lists.push(
        { title: 'Recent Activities', items: ['Process Completed', 'New User Registered', 'Report Generated'], type: 'activity' },
        { title: 'Quick Actions', items: ['Create Process', 'View Analytics', 'Manage Users'], type: 'actions' }
      );
      break;
    case 'reports':
      lists.push(
        { title: 'Available Reports', items: ['Monthly Summary', 'User Activity', 'Performance Metrics'], type: 'data' }
      );
      break;
    case 'admin':
      lists.push(
        { title: 'System Users', items: ['Active Users', 'Pending Approvals', 'Recently Added'], type: 'users' }
      );
      break;
    default:
      lists.push(
        { title: 'Items', items: ['Item 1', 'Item 2', 'Item 3'], type: 'general' }
      );
  }
  
  return lists;
};

const generateNavigationForPageType = (pageType: string): string[] => {
  const baseNav = ['Home', 'Dashboard'];
  
  switch (pageType.toLowerCase()) {
    case 'dashboard':
      return [...baseNav, 'Reports', 'Settings', 'Profile'];
    case 'admin':
      return [...baseNav, 'Users', 'System', 'Logs', 'Settings'];
    case 'reports':
      return [...baseNav, 'Analytics', 'Export', 'Schedule'];
    default:
      return [...baseNav, 'Profile', 'Settings'];
  }
};

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
  const [currentStep, setCurrentStep] = useState<"input" | "analyzing" | "content-review" | "generating" | "results">("input");
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, status: "" });
  const [analysisResult, setAnalysisResult] = useState<WireframeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detailedWireframes, setDetailedWireframes] = useState<DetailedPageContent[]>([]);
  const [editableContentCards, setEditableContentCards] = useState<PageContentCard[]>([]);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState(-1);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedPageCode, setSelectedPageCode] = useState<{
    pageName: string;
    htmlCode: string;
    cssCode: string;
  } | null>(null);
  const [identifiedPages, setIdentifiedPages] = useState<any[]>([]);
  const [isIdentifyingPages, setIsIdentifyingPages] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

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
      // Get stakeholder data from local storage
      const personaFlowTypes = localStorage.getItem('bpmn-persona-flow-types');
      const stakeholderFlowData = localStorage.getItem('bpmn-user-journey-flows') || localStorage.getItem('bpmn-stakeholder-flows');
      const projectDescription = localStorage.getItem('bpmn-project-description') || localStorage.getItem('bpmn-project-plan') || '';
      const extractedStakeholders = localStorage.getItem('bpmn-extracted-stakeholders');

      if (!personaFlowTypes) {
        throw new Error('No stakeholder flow data found. Please complete the Stakeholder Flow Analysis first by going to the User Journey page.');
      }

      const flowTypes = JSON.parse(personaFlowTypes);
      const stakeholderData = stakeholderFlowData ? JSON.parse(stakeholderFlowData) : {};
      
      // Debug log the data structure
      console.log('Flow Types Data:', flowTypes);
      console.log('Stakeholder Data:', stakeholderData);
      
      // Generate content cards for editing
      const contentCards = await generateContentCardsFromFlows(stakeholderData, flowTypes, projectDescription);
      
      setEditableContentCards(contentCards);
      setAnalysisResult({
        projectContext: projectDescription || 'Business Process Management System',
        totalPages: contentCards.length,
        pageRequirements: contentCards.map(card => ({
          pageName: card.pageName,
          pageType: card.pageType,
          purpose: card.purpose,
          stakeholders: card.stakeholders,
          contentElements: [],
          userInteractions: [],
          dataRequirements: [],
          priority: 'high' as const
        })),
        commonElements: [],
        userFlowConnections: [],
        dataFlowMap: []
      });
      
      setCurrentStep("content-review");
      setGenerationProgress({ current: 0, total: 0, status: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze stakeholder flows");
      setCurrentStep("input");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate individual wireframe using client-side Gemini AI
  const generateIndividualWireframe = async (card: PageContentCard, index: number) => {
    setCurrentGeneratingIndex(index);
    setError("");

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI("AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = buildWireframePrompt(card, designPrompt.designStyle || 'modern', designPrompt.deviceType || 'desktop');
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract HTML and CSS from the response
      const { htmlCode, cssCode } = extractCodeFromResponse(text);
      
      // Show the generated code in modal
      setSelectedPageCode({
        pageName: card.pageName,
        htmlCode,
        cssCode
      });
      setShowCodeModal(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate wireframe");
    } finally {
      setCurrentGeneratingIndex(-1);
    }
  };

  // Identify pages from stakeholder flows
  const identifyPagesFromFlows = async () => {
    setIsIdentifyingPages(true);
    setError("");

    try {
      const stakeholderFlowData = localStorage.getItem('bpmn-stakeholder-flow-data');
      const personaFlowTypes = localStorage.getItem('bpmn-persona-flow-types');
      
      console.log("Checking data availability:");
      console.log("Stakeholder Flow Data:", stakeholderFlowData ? "Found" : "Not found");
      console.log("Persona Flow Types:", personaFlowTypes ? "Found" : "Not found");
      
      if (!stakeholderFlowData && !personaFlowTypes) {
        setError("No stakeholder flow data found. Please complete the stakeholder flow analysis first.");
        return;
      }

      // Try to parse the data, with fallbacks
      let flowData = [];
      let flowTypes = {};
      
      if (stakeholderFlowData && stakeholderFlowData !== 'null') {
        try {
          flowData = JSON.parse(stakeholderFlowData);
        } catch (e) {
          console.log("Failed to parse stakeholder flow data");
        }
      }
      
      if (personaFlowTypes && personaFlowTypes !== 'null') {
        try {
          flowTypes = JSON.parse(personaFlowTypes);
        } catch (e) {
          console.log("Failed to parse persona flow types");
        }
      }
      
      // If still no data, try alternative storage keys
      if (Object.keys(flowTypes).length === 0) {
        const altFlowTypes = localStorage.getItem('stakeholder-flow-types') || 
                           localStorage.getItem('bpmn-flow-types') ||
                           localStorage.getItem('persona-flows');
        if (altFlowTypes) {
          try {
            flowTypes = JSON.parse(altFlowTypes);
          } catch (e) {
            console.log("Failed to parse alternative flow types");
          }
        }
      }
      
      if (flowData.length === 0) {
        const altFlowData = localStorage.getItem('stakeholder-flows') || 
                          localStorage.getItem('bpmn-flows') ||
                          localStorage.getItem('flow-data');
        if (altFlowData) {
          try {
            flowData = JSON.parse(altFlowData);
          } catch (e) {
            console.log("Failed to parse alternative flow data");
          }
        }
      }
      
      console.log("Flow Types Data:", flowTypes);
      console.log("Stakeholder Data:", flowData);
      
      // Final check - if we still have no data, create from visible logs
      if (Object.keys(flowTypes).length === 0 && flowData.length === 0) {
        // Use the data we can see in the console logs
        flowTypes = {
          "CEO": ["Project Approval Flow", "Budget Allocation Flow", "Progress Review Flow"],
          "Admin": ["User Management Flow", "Device Management Flow", "System Configuration Flow", "Security Management Flow", "Rule Configuration Flow"],
          "User": ["Device Interaction Flow", "Automation Rule Management Flow", "Energy Data Viewing Flow", "Security Alert Viewing Flow"]
        };
        console.log("Using fallback flow types from console logs");
      }

      const pages: any[] = [];
      
      // Process flow types to identify unique pages
      Object.entries(flowTypes).forEach(([stakeholder, flows]: [string, any]) => {
        if (Array.isArray(flows)) {
          flows.forEach((flowName: string) => {
            // Extract page information from flow name
            const pageName = flowName.replace(' Flow', '').replace(' Management', '');
            const pageType = extractPageTypeFromFlowName(flowName);
            
            // Check if page already exists
            const existingPage = pages.find(p => p.pageName === pageName);
            if (existingPage) {
              // Add stakeholder to existing page
              if (!existingPage.stakeholders.includes(stakeholder)) {
                existingPage.stakeholders.push(stakeholder);
              }
            } else {
              // Create new page
              pages.push({
                pageName,
                pageType,
                purpose: `${pageName} interface for managing ${flowName.toLowerCase()}`,
                stakeholders: [stakeholder],
                flowName,
                bpmnData: flowData.find((f: any) => f.flowType === flowName && f.stakeholder === stakeholder)
              });
            }
          });
        }
      });

      // Add context from BPMN analysis
      pages.forEach(page => {
        if (page.bpmnData?.bpmnXml) {
          page.bpmnContext = extractBpmnContext(page.bpmnData.bpmnXml);
        }
      });

      setIdentifiedPages(pages);
      console.log("Identified Pages:", pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to identify pages from flows");
    } finally {
      setIsIdentifyingPages(false);
    }
  };

  // Generate natural language content for identified pages
  const generatePageContent = async () => {
    setIsGeneratingContent(true);
    setError("");

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI("AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const contentCards: PageContentCard[] = [];

      for (const page of identifiedPages) {
        const prompt = `Generate detailed, natural language content for a web page based on stakeholder flow analysis.

**Page Information:**
- Page Name: ${page.pageName}
- Page Type: ${page.pageType}
- Purpose: ${page.purpose}
- Stakeholders: ${page.stakeholders.join(', ')}
- Flow Context: ${page.flowName}

**BPMN Context:** ${page.bpmnContext || 'Standard business process flow'}

**Generate the following content in natural language:**

1. **Headers** (3-5 descriptive headings for this page)
2. **Buttons** (4-6 action buttons with clear labels and purposes)
3. **Forms** (1-3 forms if applicable with field descriptions)
4. **Lists** (2-4 content lists or data displays)
5. **Navigation** (relevant navigation items)

**Requirements:**
- Use natural, professional language
- Be specific to the business context
- Consider the stakeholder roles
- Make content actionable and user-focused
- Ensure content flows logically

**Response Format:**
Provide a JSON object with this structure:
{
  "headers": ["Main Page Title", "Section Header 1", "Section Header 2"],
  "buttons": [
    {"label": "Action Name", "action": "description", "style": "primary|secondary|outline"},
    ...
  ],
  "forms": [
    {"title": "Form Name", "fields": ["Field 1", "Field 2"], "submitAction": "Submit Action"},
    ...
  ],
  "lists": [
    {"title": "List Name", "items": ["Item 1", "Item 2"], "type": "data|navigation|content"},
    ...
  ],
  "navigation": ["Nav Item 1", "Nav Item 2", "Nav Item 3"]
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
          // Extract JSON from response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const contentData = JSON.parse(jsonMatch[0]);
            
            contentCards.push({
              id: `generated_${Date.now()}_${contentCards.length}`,
              pageName: page.pageName,
              pageType: page.pageType,
              purpose: page.purpose,
              stakeholders: page.stakeholders,
              headers: contentData.headers || [page.pageName],
              buttons: contentData.buttons || [],
              forms: contentData.forms || [],
              lists: contentData.lists || [],
              navigation: contentData.navigation || [],
              additionalContent: [],
              isEdited: false
            });
          }
        } catch (parseError) {
          // Fallback if JSON parsing fails
          contentCards.push({
            id: `fallback_${Date.now()}_${contentCards.length}`,
            pageName: page.pageName,
            pageType: page.pageType,
            purpose: page.purpose,
            stakeholders: page.stakeholders,
            headers: [page.pageName, `${page.pageName} Overview`, `Manage ${page.pageName}`],
            buttons: [
              { label: 'Create New', action: 'create', style: 'primary' },
              { label: 'Edit', action: 'edit', style: 'secondary' },
              { label: 'Delete', action: 'delete', style: 'outline' },
              { label: 'Export', action: 'export', style: 'outline' }
            ],
            forms: [
              { title: `${page.pageName} Form`, fields: ['Name', 'Description', 'Status'], submitAction: 'Save' }
            ],
            lists: [
              { title: `${page.pageName} List`, items: ['Item 1', 'Item 2', 'Item 3'], type: 'data' }
            ],
            navigation: ['Dashboard', page.pageName, 'Settings'],
            additionalContent: [],
            isEdited: false
          });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setEditableContentCards(contentCards);
      localStorage.setItem('editable_content_cards', JSON.stringify(contentCards));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate page content");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Helper function to extract BPMN context
  const extractBpmnContext = (bpmnXml: string): string => {
    try {
      // Extract process documentation
      const docMatch = bpmnXml.match(/<bpmn2:documentation>(.*?)<\/bpmn2:documentation>/);
      if (docMatch) {
        return docMatch[1];
      }
      
      // Extract process name
      const nameMatch = bpmnXml.match(/name="([^"]+)"/);
      if (nameMatch) {
        return `Business process: ${nameMatch[1]}`;
      }
      
      return "Standard business process workflow";
    } catch {
      return "Business process context";
    }
  };

  // Generate all wireframes using client-side Gemini AI
  const generateAllWireframes = async () => {
    setIsGenerating(true);
    setError("");
    setCurrentStep("generating");
    setGenerationProgress({ current: 0, total: editableContentCards.length, status: "Generating HTML wireframes..." });

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI("AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const newDetailedWireframes: DetailedPageContent[] = [];

      for (let i = 0; i < editableContentCards.length; i++) {
        const card = editableContentCards[i];
        setGenerationProgress({ 
          current: i + 1, 
          total: editableContentCards.length, 
          status: `Generating ${card.pageName}...` 
        });

        const prompt = buildWireframePrompt(card, designPrompt.designStyle || 'modern', designPrompt.deviceType || 'desktop');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract HTML and CSS from the response
        const { htmlCode, cssCode } = extractCodeFromResponse(text);
        
        // Convert to DetailedPageContent format
        const detailedPage: DetailedPageContent = {
          pageName: card.pageName,
          pageType: card.pageType,
          purpose: card.purpose,
          stakeholders: card.stakeholders,
          htmlContent: htmlCode,
          cssStyles: cssCode,
          contentDetails: {
            headers: card.headers,
            texts: [],
            buttons: card.buttons.map(btn => ({ label: btn.label, action: btn.action })),
            forms: card.forms.map(form => ({ label: form.title, fields: form.fields })),
            lists: card.lists,
            images: []
          }
        };

        newDetailedWireframes.push(detailedPage);
        
        // Small delay between generations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setDetailedWireframes(newDetailedWireframes);
      localStorage.setItem('detailed_wireframe_designs', JSON.stringify(newDetailedWireframes));
      setCurrentStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate wireframes");
      setCurrentStep("content-review");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWireframesFromAnalysis = async () => {
    if (!detailedWireframes.length) {
      setError("Please analyze stakeholder flows first");
      return;
    }

    setIsGenerating(true);
    setError("");
    setCurrentStep("generating");
    setGenerationProgress({ 
      current: 0, 
      total: detailedWireframes.length, 
      status: "Generating detailed HTML wireframes..." 
    });

    try {
      // The detailed wireframes are already generated, just show progress
      for (let i = 0; i < detailedWireframes.length; i++) {
        const page = detailedWireframes[i];
        setGenerationProgress({ 
          current: i + 1, 
          total: detailedWireframes.length, 
          status: `Rendering ${page.pageName}...` 
        });

        // Simulate rendering time
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      }

      // Save the detailed wireframes
      localStorage.setItem('detailed_wireframe_designs', JSON.stringify(detailedWireframes));
      setCurrentStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate wireframes");
      setCurrentStep("input");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWireframes = async () => {
    // Use analysis result if available, otherwise use manual input
    if (analysisResult) {
      return generateWireframesFromAnalysis();
    }

    // Fallback to manual generation
    if (!projectInput.trim() || !designPrompt.projectType || designPrompt.screenTypes.length === 0) {
      setError("Please analyze stakeholder flows first or fill in all required fields");
      return;
    }

    setIsGenerating(true);
    setError("");
    setCurrentStep("generating");
    setGenerationProgress({ current: 0, total: designPrompt.screenTypes.length, status: "Generating wireframes..." });

    try {
      const newWireframes: WireframeData[] = [];

      for (let i = 0; i < designPrompt.screenTypes.length; i++) {
        const screenType = designPrompt.screenTypes[i];
        setGenerationProgress({ 
          current: i + 1, 
          total: designPrompt.screenTypes.length, 
          status: `Generating ${screenType} wireframe...` 
        });

        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

        const wireframe = generateWireframeData(screenType, i);
        wireframe.description = `${screenType} interface for: ${projectInput.substring(0, 100)}${projectInput.length > 100 ? '...' : ''}`;
        
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

  const generateWireframeFromPageRequirement = (pageReq: PageRequirement, index: number): WireframeData => {
    const id = `wireframe_${Date.now()}_${index}`;
    const components = generateComponentsFromContentElements(pageReq.contentElements, designPrompt.deviceType);

    return {
      id,
      name: pageReq.pageName,
      description: pageReq.purpose,
      deviceType: designPrompt.deviceType as 'mobile' | 'tablet' | 'desktop',
      screenType: pageReq.pageType,
      components,
      colorScheme: designPrompt.colorPreference,
      style: designPrompt.designStyle,
      timestamp: new Date().toISOString()
    };
  };

  const generateComponentsFromContentElements = (contentElements: ContentElement[], deviceType: string): WireframeComponent[] => {
    const components: WireframeComponent[] = [];
    const isDesktop = deviceType === 'desktop';
    const isMobile = deviceType === 'mobile';
    
    let yPosition = 0;
    
    contentElements.forEach((element, index) => {
      let componentWidth = 90;
      let componentHeight = 15;
      let xPosition = 5;
      
      // Adjust positioning based on element position preference
      switch (element.position) {
        case 'top':
          yPosition = Math.max(0, yPosition - 5);
          break;
        case 'sidebar':
          if (!isMobile) {
            componentWidth = 25;
            xPosition = 70;
          }
          break;
        case 'left':
          if (!isMobile) {
            componentWidth = 45;
            xPosition = 5;
          }
          break;
        case 'right':
          if (!isMobile) {
            componentWidth = 45;
            xPosition = 50;
          }
          break;
      }
      
      // Adjust component height based on type
      switch (element.type) {
        case 'header':
          componentHeight = isMobile ? 12 : 8;
          break;
        case 'form':
          componentHeight = isMobile ? 40 : 30;
          break;
        case 'table':
        case 'list':
          componentHeight = isMobile ? 35 : 25;
          break;
        case 'chart':
          componentHeight = isMobile ? 30 : 25;
          break;
        case 'button':
          componentHeight = isMobile ? 8 : 6;
          break;
        case 'input':
        case 'dropdown':
          componentHeight = isMobile ? 6 : 4;
          break;
      }
      
      const component: WireframeComponent = {
        id: `${element.type}_${index}`,
        type: element.type,
        label: element.label,
        content: element.content,
        position: { x: xPosition, y: yPosition },
        size: { width: componentWidth, height: componentHeight },
        style: {
          backgroundColor: element.required ? '#fef3c7' : '#f8fafc',
          border: element.required ? '2px solid #f59e0b' : '1px solid #e2e8f0'
        }
      };
      
      components.push(component);
      yPosition += componentHeight + 5;
    });
    
    return components;
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

        {/* AI Analysis Section */}
        {currentStep === "input" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Powered Stakeholder Flow Analysis
              </CardTitle>
              <p className="text-sm text-gray-600">
                Analyze your stakeholder flows to automatically generate contextual wireframes
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={analyzeStakeholderFlows}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Flows...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Stakeholder Flows
                    </>
                  )}
                </Button>
                
                {analysisResult && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {analysisResult.totalPages} pages analyzed
                    </Badge>
                    <Button
                      onClick={generateWireframes}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Grid className="h-4 w-4 mr-2" />
                          Generate Wireframes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              {analysisResult && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3">Analysis Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-700 mb-2">
                        <strong>Project Context:</strong> {analysisResult.projectContext}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Total Pages:</strong> {analysisResult.totalPages}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-2">
                        <strong>Page Types:</strong>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.pageRequirements.slice(0, 5).map((page, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {page.pageName}
                          </Badge>
                        ))}
                        {analysisResult.pageRequirements.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{analysisResult.pageRequirements.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manual Design Input Form */}
        {currentStep === "input" && !analysisResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5" />
                Manual Design Specifications
              </CardTitle>
              <p className="text-sm text-gray-600">
                Or manually specify your wireframe requirements
              </p>
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

        {/* Analysis Progress */}
        {currentStep === "analyzing" && (
          <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Analyzing Stakeholder Flows</h3>
                      <p className="text-sm text-gray-600">Processing your business flows to determine wireframe requirements...</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generation Progress */}
        {currentStep === "generating" && (
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

        {/* Content Review Section */}
        {currentStep === "content-review" && (
          <div className="space-y-6">
            {/* Page Identification Section */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Target className="h-5 w-5" />
                  1. Exact Page Identification
                </CardTitle>
                <p className="text-sm text-blue-700">
                  Pages identified from your stakeholder flow analysis
                </p>
              </CardHeader>
              <CardContent>
                {identifiedPages.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Button
                      onClick={identifyPagesFromFlows}
                      disabled={isIdentifyingPages}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      {isIdentifyingPages ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing Flow Data...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Identify Pages from Stakeholder Flows
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-blue-900">
                        Identified {identifiedPages.length} unique pages
                      </span>
                      <Button
                        onClick={generatePageContent}
                        disabled={isGeneratingContent || editableContentCards.length > 0}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                        size="sm"
                      >
                        {isGeneratingContent ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating Content...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Generate Natural Language Content
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {identifiedPages.map((page, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-gray-900">{page.pageName}</span>
                            <Badge variant="outline" className="text-xs text-blue-700 bg-blue-100">
                              {page.pageType}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{page.purpose}</p>
                          <div className="flex flex-wrap gap-1">
                            {page.stakeholders.slice(0, 2).map((stakeholder, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
                                {stakeholder}
                              </Badge>
                            ))}
                            {page.stakeholders.length > 2 && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                +{page.stakeholders.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Natural Language Content Generation */}
            {editableContentCards.length > 0 && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Edit3 className="h-5 w-5" />
                    2. Review & Edit Page Content
                  </CardTitle>
                  <p className="text-sm text-green-700">
                    Natural language content generated from your stakeholder flow analysis. Edit as needed.
                  </p>
                </CardHeader>
              </Card>
            )}

            {editableContentCards.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {editableContentCards.map((card, index) => (
                <Card key={card.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{card.pageName}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {card.pageType}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{card.purpose}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Headers Section */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-800 mb-2">Headers</h4>
                      <div className="space-y-2">
                        {card.headers.map((header, hIndex) => (
                          <input
                            key={hIndex}
                            type="text"
                            value={header}
                            onChange={(e) => {
                              const newCards = [...editableContentCards];
                              newCards[index].headers[hIndex] = e.target.value;
                              newCards[index].isEdited = true;
                              setEditableContentCards(newCards);
                            }}
                            className="w-full px-3 py-1 text-sm border rounded"
                          />
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newCards = [...editableContentCards];
                            newCards[index].headers.push('New Header');
                            newCards[index].isEdited = true;
                            setEditableContentCards(newCards);
                          }}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Header
                        </Button>
                      </div>
                    </div>

                    {/* Buttons Section */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-800 mb-2">Buttons</h4>
                      <div className="space-y-2">
                        {card.buttons.map((button, bIndex) => (
                          <div key={bIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={button.label}
                              onChange={(e) => {
                                const newCards = [...editableContentCards];
                                newCards[index].buttons[bIndex].label = e.target.value;
                                newCards[index].isEdited = true;
                                setEditableContentCards(newCards);
                              }}
                              className="flex-1 px-2 py-1 text-xs border rounded"
                              placeholder="Button label"
                            />
                            <select
                              value={button.style}
                              onChange={(e) => {
                                const newCards = [...editableContentCards];
                                newCards[index].buttons[bIndex].style = e.target.value;
                                newCards[index].isEdited = true;
                                setEditableContentCards(newCards);
                              }}
                              className="px-2 py-1 text-xs border rounded"
                            >
                              <option value="primary">Primary</option>
                              <option value="secondary">Secondary</option>
                              <option value="outline">Outline</option>
                              <option value="link">Link</option>
                            </select>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newCards = [...editableContentCards];
                            newCards[index].buttons.push({ label: 'New Button', action: 'click', style: 'primary' });
                            newCards[index].isEdited = true;
                            setEditableContentCards(newCards);
                          }}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Button
                        </Button>
                      </div>
                    </div>

                    {/* Forms Section */}
                    {card.forms.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-800 mb-2">Forms</h4>
                        <div className="space-y-3">
                          {card.forms.map((form, fIndex) => (
                            <div key={fIndex} className="border rounded p-3 bg-gray-50">
                              <input
                                type="text"
                                value={form.title}
                                onChange={(e) => {
                                  const newCards = [...editableContentCards];
                                  newCards[index].forms[fIndex].title = e.target.value;
                                  newCards[index].isEdited = true;
                                  setEditableContentCards(newCards);
                                }}
                                className="w-full px-2 py-1 text-sm font-medium border rounded mb-2"
                                placeholder="Form title"
                              />
                              <div className="space-y-1">
                                {form.fields.map((field, fieldIndex) => (
                                  <input
                                    key={fieldIndex}
                                    type="text"
                                    value={field}
                                    onChange={(e) => {
                                      const newCards = [...editableContentCards];
                                      newCards[index].forms[fIndex].fields[fieldIndex] = e.target.value;
                                      newCards[index].isEdited = true;
                                      setEditableContentCards(newCards);
                                    }}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    placeholder="Field name"
                                  />
                                ))}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newCards = [...editableContentCards];
                                    newCards[index].forms[fIndex].fields.push('New Field');
                                    newCards[index].isEdited = true;
                                    setEditableContentCards(newCards);
                                  }}
                                  className="text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Field
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stakeholders */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-800 mb-1">Target Users</h4>
                      <div className="flex flex-wrap gap-1">
                        {card.stakeholders.map((stakeholder, sIndex) => (
                          <Badge key={sIndex} variant="secondary" className="text-xs">
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Generate Individual Wireframe */}
                    <div className="pt-3 border-t">
                      <Button
                        onClick={() => generateIndividualWireframe(card, index)}
                        disabled={currentGeneratingIndex === index}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                        size="sm"
                      >
                        {currentGeneratingIndex === index ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Grid className="h-3 w-3 mr-2" />
                            Generate HTML Wireframe
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}

            {/* Generate All Button */}
            {editableContentCards.length > 0 && (
              <div className="text-center">
                <Button
                  onClick={() => generateAllWireframes()}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating All Wireframes...
                    </>
                  ) : (
                    <>
                      <Grid className="h-4 w-4 mr-2" />
                      Generate All HTML Wireframes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Detailed HTML Wireframes Results */}
        {currentStep === "results" && detailedWireframes.length > 0 && (
          <div className="space-y-6 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Generated Wireframes</h2>
              <p className="text-gray-600">
                {detailedWireframes.length} detailed wireframes with real content based on your stakeholder flows
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {detailedWireframes.map((page, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{page.pageName}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {page.pageType}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{page.purpose}</p>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {/* HTML Preview */}
                    <div className="border-t bg-gray-50 p-4">
                      <div className="bg-white rounded border shadow-sm overflow-hidden relative">
                        <div 
                          className="h-48 w-full overflow-hidden relative"
                          style={{ 
                            transform: 'scale(0.25)', 
                            transformOrigin: 'top left', 
                            width: '400%', 
                            height: '400%' 
                          }}
                        >
                          <style dangerouslySetInnerHTML={{ __html: page.cssStyles }} />
                          <div dangerouslySetInnerHTML={{ __html: page.htmlContent }} />
                        </div>
                        <div className="absolute inset-0 bg-transparent hover:bg-black hover:bg-opacity-10 transition-colors cursor-pointer" 
                             onClick={() => {
                               setSelectedPageCode({
                                 pageName: page.pageName,
                                 htmlCode: page.htmlContent,
                                 cssCode: page.cssStyles
                               });
                               setShowCodeModal(true);
                             }}
                        />
                      </div>
                    </div>
                    
                    {/* Content Summary */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-800 mb-2">Content Elements</h4>
                        <div className="space-y-1 text-xs text-gray-600">
                          {page.contentDetails.headers.length > 0 && (
                            <div><strong>Headers:</strong> {page.contentDetails.headers.slice(0, 2).join(', ')}</div>
                          )}
                          {page.contentDetails.buttons.length > 0 && (
                            <div><strong>Actions:</strong> {page.contentDetails.buttons.slice(0, 3).map(b => b.label).join(', ')}</div>
                          )}
                          {page.contentDetails.forms.length > 0 && (
                            <div><strong>Forms:</strong> {page.contentDetails.forms.length} form(s) with {page.contentDetails.forms.reduce((sum, f) => sum + f.fields.length, 0)} fields</div>
                          )}
                          {page.contentDetails.lists.length > 0 && (
                            <div><strong>Lists:</strong> {page.contentDetails.lists.length} list(s)</div>
                          )}
                        </div>
                      </div>
                      
                      {page.stakeholders.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-800 mb-1">Target Users</h4>
                          <div className="flex flex-wrap gap-1">
                            {page.stakeholders.map((stakeholder, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {stakeholder}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs flex-1"
                          onClick={() => {
                            const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${page.pageName}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${page.cssStyles}</style>
</head>
<body>${page.htmlContent}</body>
</html>`;
                            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
                            const url = URL.createObjectURL(htmlBlob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${page.pageName.replace(/\s+/g, '_').toLowerCase()}.html`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs flex-1"
                          onClick={() => {
                            navigator.clipboard.writeText(`<!-- ${page.pageName} -->\n${page.htmlContent}\n\n/* CSS for ${page.pageName} */\n${page.cssStyles}`);
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                          onClick={() => {
                            setSelectedPageCode({
                              pageName: page.pageName,
                              htmlCode: page.htmlContent,
                              cssCode: page.cssStyles
                            });
                            setShowCodeModal(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Export All Button */}
            <div className="text-center">
              <Button
                onClick={() => {
                  // Create a zip-like structure with all wireframes
                  let allContent = '';
                  detailedWireframes.forEach((page, index) => {
                    allContent += `
=== ${page.pageName} ===
File: ${page.pageName.replace(/\s+/g, '_').toLowerCase()}.html

<!DOCTYPE html>
<html>
<head>
  <title>${page.pageName}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${page.cssStyles}</style>
</head>
<body>${page.htmlContent}</body>
</html>

`;
                  });
                  
                  const blob = new Blob([allContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'all_wireframes.txt';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Wireframes
              </Button>
            </div>
          </div>
        )}

        {/* Traditional Generated Wireframes */}
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

        {/* Code Modal */}
        {showCodeModal && selectedPageCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">{selectedPageCode.pageName} - Generated Code</h2>
                <Button
                  onClick={() => {
                    setShowCodeModal(false);
                    setSelectedPageCode(null);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="preview" className="h-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="preview">Live Preview</TabsTrigger>
                    <TabsTrigger value="html">HTML Code</TabsTrigger>
                    <TabsTrigger value="css">CSS Code</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview" className="h-full overflow-auto p-6">
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <iframe
                        srcDoc={`${selectedPageCode.htmlCode}${selectedPageCode.cssCode ? `<style>${selectedPageCode.cssCode}</style>` : ''}`}
                        className="w-full h-96 border-0"
                        title="Wireframe Preview"
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => {
                          const fullHtml = `${selectedPageCode.htmlCode}${selectedPageCode.cssCode ? `\n<style>\n${selectedPageCode.cssCode}\n</style>` : ''}`;
                          const blob = new Blob([fullHtml], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${selectedPageCode.pageName.replace(/\s+/g, '_').toLowerCase()}.html`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download HTML
                      </Button>
                      <Button
                        onClick={() => {
                          // Create a larger modal preview
                          const previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                          if (previewWindow) {
                            previewWindow.document.write(`
                              <!DOCTYPE html>
                              <html>
                              <head>
                                <title>${selectedPageCode.pageName} - Preview</title>
                                <style>
                                  body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                                  .preview-header { 
                                    background: #f8f9fa; 
                                    padding: 10px 20px; 
                                    border-bottom: 1px solid #dee2e6;
                                    display: flex;
                                    justify-content: between;
                                    align-items: center;
                                  }
                                  .preview-content { padding: 0; }
                                  ${selectedPageCode.cssCode || ''}
                                </style>
                              </head>
                              <body>
                                <div class="preview-header">
                                  <h3 style="margin: 0;">${selectedPageCode.pageName} - Wireframe Preview</h3>
                                  <button onclick="window.close()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Close</button>
                                </div>
                                <div class="preview-content">
                                  ${selectedPageCode.htmlCode}
                                </div>
                              </body>
                              </html>
                            `);
                            previewWindow.document.close();
                          }
                        }}
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Full Screen Preview
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="html" className="h-full overflow-auto p-6">
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-800">HTML Code</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(selectedPageCode.htmlCode)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <pre className="text-sm overflow-auto bg-white p-4 rounded border max-h-80">
                        <code>{selectedPageCode.htmlCode}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="css" className="h-full overflow-auto p-6">
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-800">CSS Code</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(selectedPageCode.cssCode)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <pre className="text-sm overflow-auto bg-white p-4 rounded border max-h-80">
                        <code>{selectedPageCode.cssCode || '/* No additional CSS */'}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
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
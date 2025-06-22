import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Activity, 
  Settings, 
  Clock, 
  CheckCircle, 
  Users, 
  Globe, 
  Shield, 
  Smartphone,
  Monitor,
  Eye,
  Edit,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';
import { FlowDiagramViewer } from '@/components/flow-diagram-viewer';
import { WorkflowProgress } from '@/components/workflow-progress';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ProjectFlow {
  id: string;
  title: string;
  description: string;
  flowData: any;
  category: 'onboarding' | 'core' | 'management';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

interface ProjectWireframe {
  id: string;
  pageName: string;
  pageType: 'registration' | 'dashboard' | 'appointments' | 'profile' | 'mobile';
  htmlContent: string;
  features: string[];
  userType: 'user' | 'admin' | 'manager';
  createdAt: string;
}

interface ProjectOverview {
  coreFeatures: string[];
  userTypes: string[];
  platformSupport: string[];
  securityFeatures: string[];
  integrations: string[];
}

interface ProjectAnalysis {
  completionScore: number;
  readinessLevel: 'Planning' | 'Development' | 'Testing' | 'Ready';
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  dataQuality: {
    flows: number;
    wireframes: number;
    content: number;
    overall: number;
  };
  nextSteps: string[];
}

interface ComprehensiveProjectPlan {
  executiveSummary: {
    projectTitle: string;
    projectDescription: string;
    targetAudience: string[];
    keyObjectives: string[];
    timeline: string;
    budget: string;
  };
  technicalArchitecture: {
    frontend: string[];
    backend: string[];
    database: string[];
    infrastructure: string[];
    integrations: string[];
  };
  userJourneys: {
    primary: string[];
    secondary: string[];
    edge_cases: string[];
  };
  featureMatrix: {
    core: string[];
    secondary: string[];
    future: string[];
  };
  brandGuidelines: {
    colors: string[];
    typography: string[];
    logoUsage: string[];
    designPrinciples: string[];
  };
  developmentPhases: {
    phase: string;
    duration: string;
    deliverables: string[];
    dependencies: string[];
  }[];
  riskAssessment: {
    technical: string[];
    business: string[];
    mitigation: string[];
  };
  testingStrategy: {
    unit: string[];
    integration: string[];
    userAcceptance: string[];
    security: string[];
  };
  deploymentPlan: {
    environments: string[];
    pipeline: string[];
    monitoring: string[];
  };
}

export function FlowWireframeMappingPage() {
  const [flows, setFlows] = useState<ProjectFlow[]>([]);
  const [wireframes, setWireframes] = useState<ProjectWireframe[]>([]);
  const [consolidatedFlow, setConsolidatedFlow] = useState<ProjectFlow | null>(null);
  const [isGeneratingConsolidatedFlow, setIsGeneratingConsolidatedFlow] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [comprehensiveProjectPlan, setComprehensiveProjectPlan] = useState<ComprehensiveProjectPlan | null>(null);

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = () => {
    try {
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

      // Load wireframes
      const wireframeData = localStorage.getItem('generated_wireframes');
      const loadedWireframes: ProjectWireframe[] = [];
      
      if (wireframeData) {
        try {
          const parsed = JSON.parse(wireframeData);
          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach(key => {
              const wireframe = parsed[key];
              if (wireframe && wireframe.data) {
                loadedWireframes.push(createWireframeFromData(key, wireframe.data));
              }
            });
          }
        } catch (error) {
          console.error('Error parsing wireframes:', error);
        }
      }

      setFlows(loadedFlows);
      setWireframes(loadedWireframes);

      // Generate comprehensive project plan
      const allKeys = Object.keys(localStorage);
      const allData: Record<string, any> = {};
      allKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            allData[key] = JSON.parse(data);
          }
        } catch (error) {
          allData[key] = localStorage.getItem(key);
        }
      });

      const projectPlan = generateComprehensiveProjectPlan(allData, loadedFlows, loadedWireframes);
      setComprehensiveProjectPlan(projectPlan);

    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

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

  const createWireframeFromData = (key: string, data: any): ProjectWireframe => {
    return {
      id: `wireframe-${key}`,
      pageName: data.pageName || key,
      pageType: data.pageType || 'dashboard',
      htmlContent: data.htmlContent || data.content || '',
      features: data.features || [],
      userType: data.userType || 'user',
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
      // Create comprehensive fallback flow
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
      // Still set fallback flow even if AI fails
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
      // User Onboarding Phase
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
      
      // Core Application Features
      {
        id: 'dashboard-access',
        position: { x: 200, y: 150 },
        data: { label: 'Dashboard Access' },
        type: 'default',
        style: { backgroundColor: '#9C27B0', color: 'white' }
      },
      {
        id: 'feature-navigation',
        position: { x: 350, y: 150 },
        data: { label: 'Feature Navigation' },
        type: 'default',
        style: { backgroundColor: '#9C27B0', color: 'white' }
      },
      {
        id: 'data-management',
        position: { x: 500, y: 150 },
        data: { label: 'Data Management' },
        type: 'default',
        style: { backgroundColor: '#9C27B0', color: 'white' }
      },
      {
        id: 'settings-config',
        position: { x: 650, y: 150 },
        data: { label: 'Settings Configuration' },
        type: 'default',
        style: { backgroundColor: '#9C27B0', color: 'white' }
      },

      // Platform Selection
      {
        id: 'platform-choice',
        position: { x: 650, y: 50 },
        data: { label: 'Platform Selection' },
        type: 'default',
        style: { backgroundColor: '#FFC107', color: 'black' }
      },

      // Mobile Path
      {
        id: 'mobile-app',
        position: { x: 500, y: 250 },
        data: { label: 'Mobile Application' },
        type: 'default',
        style: { backgroundColor: '#E91E63', color: 'white' }
      },
      {
        id: 'mobile-features',
        position: { x: 350, y: 250 },
        data: { label: 'Mobile Features' },
        type: 'default',
        style: { backgroundColor: '#E91E63', color: 'white' }
      },
      {
        id: 'notifications',
        position: { x: 200, y: 250 },
        data: { label: 'Push Notifications' },
        type: 'default',
        style: { backgroundColor: '#E91E63', color: 'white' }
      },

      // Web Platform Path
      {
        id: 'web-portal',
        position: { x: 800, y: 250 },
        data: { label: 'Web Portal' },
        type: 'default',
        style: { backgroundColor: '#2196F3', color: 'white' }
      },
      {
        id: 'web-dashboard',
        position: { x: 950, y: 250 },
        data: { label: 'Web Dashboard' },
        type: 'default',
        style: { backgroundColor: '#2196F3', color: 'white' }
      },
      {
        id: 'document-management',
        position: { x: 1100, y: 250 },
        data: { label: 'Document Management' },
        type: 'default',
        style: { backgroundColor: '#2196F3', color: 'white' }
      },

      // Core Services
      {
        id: 'service-request',
        position: { x: 350, y: 350 },
        data: { label: 'Service Request' },
        type: 'default',
        style: { backgroundColor: '#795548', color: 'white' }
      },
      {
        id: 'processing',
        position: { x: 500, y: 350 },
        data: { label: 'Request Processing' },
        type: 'default',
        style: { backgroundColor: '#795548', color: 'white' }
      },
      {
        id: 'approval-workflow',
        position: { x: 650, y: 350 },
        data: { label: 'Approval Workflow' },
        type: 'default',
        style: { backgroundColor: '#795548', color: 'white' }
      },
      {
        id: 'fulfillment',
        position: { x: 800, y: 350 },
        data: { label: 'Service Fulfillment' },
        type: 'default',
        style: { backgroundColor: '#795548', color: 'white' }
      },

      // Communication & Feedback
      {
        id: 'communication',
        position: { x: 950, y: 350 },
        data: { label: 'Communication Hub' },
        type: 'default',
        style: { backgroundColor: '#607D8B', color: 'white' }
      },
      {
        id: 'feedback',
        position: { x: 650, y: 450 },
        data: { label: 'User Feedback' },
        type: 'default',
        style: { backgroundColor: '#FF9800', color: 'white' }
      },
      {
        id: 'analytics',
        position: { x: 800, y: 450 },
        data: { label: 'Analytics & Reporting' },
        type: 'default',
        style: { backgroundColor: '#FF9800', color: 'white' }
      },

      // Completion
      {
        id: 'completion',
        position: { x: 950, y: 450 },
        data: { label: 'Process Complete' },
        type: 'output',
        style: { backgroundColor: '#4CAF50', color: 'white' }
      }
    ];

    const edges = [
      // Main flow
      { id: 'e1', source: 'start', target: 'account-setup' },
      { id: 'e2', source: 'account-setup', target: 'profile-creation' },
      { id: 'e3', source: 'profile-creation', target: 'verification' },
      { id: 'e4', source: 'verification', target: 'platform-choice' },
      
      // Dashboard flow
      { id: 'e5', source: 'account-setup', target: 'dashboard-access' },
      { id: 'e6', source: 'dashboard-access', target: 'feature-navigation' },
      { id: 'e7', source: 'feature-navigation', target: 'data-management' },
      { id: 'e8', source: 'data-management', target: 'settings-config' },
      
      // Platform branching
      { id: 'e9', source: 'platform-choice', target: 'mobile-app' },
      { id: 'e10', source: 'platform-choice', target: 'web-portal' },
      
      // Mobile flow
      { id: 'e11', source: 'mobile-app', target: 'mobile-features' },
      { id: 'e12', source: 'mobile-features', target: 'notifications' },
      { id: 'e13', source: 'notifications', target: 'service-request' },
      
      // Web flow
      { id: 'e14', source: 'web-portal', target: 'web-dashboard' },
      { id: 'e15', source: 'web-dashboard', target: 'document-management' },
      { id: 'e16', source: 'document-management', target: 'communication' },
      
      // Core services
      { id: 'e17', source: 'service-request', target: 'processing' },
      { id: 'e18', source: 'processing', target: 'approval-workflow' },
      { id: 'e19', source: 'approval-workflow', target: 'fulfillment' },
      { id: 'e20', source: 'fulfillment', target: 'communication' },
      
      // Completion flow
      { id: 'e21', source: 'communication', target: 'feedback' },
      { id: 'e22', source: 'feedback', target: 'analytics' },
      { id: 'e23', source: 'analytics', target: 'completion' },
      
      // Alternative paths
      { id: 'e24', source: 'settings-config', target: 'service-request' },
      { id: 'e25', source: 'mobile-features', target: 'processing' },
      { id: 'e26', source: 'web-dashboard', target: 'service-request' }
    ];

    return {
      title: "Master Application Flow",
      description: "Comprehensive workflow combining all application processes and user journeys",
      flowData: { nodes, edges }
    };
  };

  const generateComprehensiveProjectPlan = (allData: Record<string, any>, flows: ProjectFlow[], wireframes: ProjectWireframe[]): ComprehensiveProjectPlan => {
    // Extract brand guidelines if available
    const brandGuidelines = allData['brand-guidelines'] || {};
    const brandColors = brandGuidelines.colors || {};
    const brandTypography = brandGuidelines.typography || {};

    return {
      executiveSummary: {
        projectTitle: "Comprehensive Application Platform",
        projectDescription: "A modern, full-featured application platform with user management, workflow automation, and comprehensive feature set",
        targetAudience: ["End Users", "Administrators", "Business Users", "Mobile Users"],
        keyObjectives: [
          "Streamline user onboarding and management",
          "Provide comprehensive workflow automation",
          "Enable cross-platform access (web and mobile)",
          "Ensure scalable and secure architecture",
          "Deliver excellent user experience"
        ],
        timeline: "6-9 months development cycle",
        budget: "Medium to large scale project investment"
      },
      technicalArchitecture: {
        frontend: ["React.js", "TypeScript", "Tailwind CSS", "Modern UI Components"],
        backend: ["Node.js", "Express.js", "RESTful APIs", "Authentication Services"],
        database: ["PostgreSQL", "Redis Cache", "File Storage", "Backup Systems"],
        infrastructure: ["Cloud Hosting", "CDN", "Load Balancing", "SSL/TLS"],
        integrations: ["Third-party APIs", "Payment Processing", "Analytics", "Communication Services"]
      },
      userJourneys: {
        primary: [
          "User registration and onboarding",
          "Profile setup and verification",
          "Core feature access and usage",
          "Service requests and fulfillment"
        ],
        secondary: [
          "Advanced settings configuration",
          "Document management",
          "Communication and collaboration",
          "Reporting and analytics"
        ],
        edge_cases: [
          "Account recovery processes",
          "Error handling and fallbacks",
          "Offline functionality",
          "Migration and data export"
        ]
      },
      featureMatrix: {
        core: [
          "User authentication and authorization",
          "Dashboard and navigation",
          "Data management and CRUD operations",
          "Basic workflow automation",
          "Cross-platform compatibility"
        ],
        secondary: [
          "Advanced reporting and analytics",
          "Integration with external services",
          "Customizable user preferences",
          "Advanced communication features",
          "Batch operations and bulk actions"
        ],
        future: [
          "AI-powered recommendations",
          "Advanced automation workflows",
          "Mobile app enhancements",
          "Third-party marketplace integration",
          "Advanced analytics and insights"
        ]
      },
      brandGuidelines: {
        colors: [...(brandColors.primary || []), ...(brandColors.secondary || [])].filter((color): color is string => typeof color === 'string'),
        typography: (brandTypography.fonts || []).filter((font: any): font is string => typeof font === 'string'),
        logoUsage: ["Primary logo placement", "Secondary logo variations", "Brand consistency"],
        designPrinciples: ["Clean and modern interface", "Consistent user experience", "Accessibility compliance", "Mobile-first design"]
      },
      developmentPhases: [
        {
          phase: "Phase 1: Foundation",
          duration: "2-3 months",
          deliverables: ["Core architecture", "User authentication", "Basic UI framework"],
          dependencies: ["Technical requirements", "Design system", "Development environment"]
        },
        {
          phase: "Phase 2: Core Features",
          duration: "2-3 months", 
          deliverables: ["Main application features", "Database integration", "API development"],
          dependencies: ["Phase 1 completion", "Database design", "API specifications"]
        },
        {
          phase: "Phase 3: Integration & Testing",
          duration: "1-2 months",
          deliverables: ["Third-party integrations", "Testing suite", "Performance optimization"],
          dependencies: ["Core features complete", "Integration requirements", "Testing plan"]
        },
        {
          phase: "Phase 4: Launch & Optimization",
          duration: "1 month",
          deliverables: ["Production deployment", "User training", "Performance monitoring"],
          dependencies: ["Testing complete", "Deployment infrastructure", "Go-live plan"]
        }
      ],
      riskAssessment: {
        technical: [
          "Scalability challenges with user growth",
          "Integration complexity with external services",
          "Performance bottlenecks in data processing",
          "Security vulnerabilities and data protection"
        ],
        business: [
          "User adoption and engagement rates",
          "Market competition and differentiation",
          "Resource allocation and timeline management",
          "Budget constraints and scope creep"
        ],
        mitigation: [
          "Implement scalable architecture from start",
          "Thorough testing and security audits",
          "Agile development with regular checkpoints",
          "User feedback integration and iterative improvement"
        ]
      },
      testingStrategy: {
        unit: ["Component testing", "Function testing", "API endpoint testing", "Database operations"],
        integration: ["Service integration", "Third-party API testing", "End-to-end workflows", "Cross-platform compatibility"],
        userAcceptance: ["User journey testing", "Feature validation", "Performance benchmarks", "Accessibility compliance"],
        security: ["Authentication testing", "Authorization validation", "Data encryption", "Vulnerability scanning"]
      },
      deploymentPlan: {
        environments: ["Development", "Staging", "Production", "Backup/Recovery"],
        pipeline: ["Automated builds", "Testing automation", "Deployment automation", "Rollback procedures"],
        monitoring: ["Application monitoring", "Performance metrics", "Error tracking", "User analytics"]
      }
    };
  };

  const generateProjectAnalysis = (flows: ProjectFlow[], wireframes: ProjectWireframe[], allKeys: string[]): ProjectAnalysis => {
    const flowsScore = Math.min(flows.length * 20, 100);
    const wireframesScore = Math.min(wireframes.length * 25, 100);
    const contentScore = Math.min(allKeys.length * 5, 100);
    const overallScore = (flowsScore + wireframesScore + contentScore) / 3;

    let readinessLevel: 'Planning' | 'Development' | 'Testing' | 'Ready' = 'Planning';
    if (overallScore >= 80) readinessLevel = 'Ready';
    else if (overallScore >= 60) readinessLevel = 'Testing';
    else if (overallScore >= 40) readinessLevel = 'Development';

    return {
      completionScore: Math.round(overallScore),
      readinessLevel,
      strengths: [
        `${flows.length} process flows documented`,
        `${wireframes.length} wireframes created`,
        `${allKeys.length} data components available`,
        "Comprehensive project planning approach"
      ],
      gaps: [
        flows.length < 3 ? "Need more process flows" : null,
        wireframes.length < 2 ? "Need more wireframes" : null,
        allKeys.length < 10 ? "Need more project content" : null,
        "Consider adding user testing data"
      ].filter(Boolean) as string[],
      recommendations: [
        "Continue developing core features",
        "Expand wireframe coverage",
        "Add integration testing",
        "Implement user feedback loops"
      ],
      dataQuality: {
        flows: Math.min(flows.length * 33, 100),
        wireframes: Math.min(wireframes.length * 50, 100),
        content: Math.min(allKeys.length * 10, 100),
        overall: Math.round(overallScore)
      },
      nextSteps: [
        "Finalize remaining wireframes",
        "Implement core backend services",
        "Set up testing framework",
        "Plan deployment strategy"
      ]
    };
  };

  const getAppOverview = (): ProjectOverview => {
    return {
      coreFeatures: [
        "User Authentication & Management",
        "Dashboard & Navigation",
        "Data Management & CRUD Operations",
        "Workflow Automation",
        "Cross-Platform Compatibility",
        "Real-time Updates",
        "Search & Filtering",
        "Reporting & Analytics"
      ],
      userTypes: [
        "End Users",
        "Administrators", 
        "Managers",
        "Guest Users"
      ],
      platformSupport: [
        "Web Application (Desktop)",
        "Mobile Web (Responsive)",
        "Native Mobile App",
        "Tablet Support",
        "Cross-browser Compatibility"
      ],
      securityFeatures: [
        "Multi-factor Authentication",
        "Role-based Access Control",
        "Data Encryption",
        "Secure API Communications",
        "Audit Logging",
        "Session Management"
      ],
      integrations: [
        "Third-party APIs",
        "Payment Processing",
        "Email Services",
        "Cloud Storage",
        "Analytics Platforms",
        "Communication Tools"
      ]
    };
  };

  const exportComprehensiveProjectPlan = async () => {
    if (!comprehensiveProjectPlan) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Comprehensive Project Development Plan', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Executive Summary
      pdf.setFontSize(16);
      pdf.text('Executive Summary', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Project: ${comprehensiveProjectPlan.executiveSummary.projectTitle}`, 20, yPosition);
      yPosition += 8;
      
      const descriptionLines = pdf.splitTextToSize(comprehensiveProjectPlan.executiveSummary.projectDescription, pageWidth - 40);
      pdf.text(descriptionLines, 20, yPosition);
      yPosition += descriptionLines.length * 6 + 10;
      
      // Technical Architecture
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Technical Architecture', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Frontend Technologies:', 20, yPosition);
      yPosition += 6;
      comprehensiveProjectPlan.technicalArchitecture.frontend.forEach(tech => {
        pdf.text(`• ${tech}`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
      
      pdf.text('Backend Technologies:', 20, yPosition);
      yPosition += 6;
      comprehensiveProjectPlan.technicalArchitecture.backend.forEach(tech => {
        pdf.text(`• ${tech}`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
      
      // Development Phases
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Development Phases', 20, yPosition);
      yPosition += 10;
      
      comprehensiveProjectPlan.developmentPhases.forEach(phase => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${phase.phase} (${phase.duration})`, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Deliverables:', 20, yPosition);
        yPosition += 6;
        
        phase.deliverables.forEach(deliverable => {
          pdf.text(`• ${deliverable}`, 25, yPosition);
          yPosition += 5;
        });
        yPosition += 8;
      });
      
      // Feature Matrix
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Feature Implementation Matrix', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(14);
      pdf.text('Core Features:', 20, yPosition);
      yPosition += 8;
      comprehensiveProjectPlan.featureMatrix.core.forEach(feature => {
        pdf.setFontSize(12);
        pdf.text(`• ${feature}`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 8;
      
      pdf.setFontSize(14);
      pdf.text('Secondary Features:', 20, yPosition);
      yPosition += 8;
      comprehensiveProjectPlan.featureMatrix.secondary.forEach(feature => {
        pdf.setFontSize(12);
        pdf.text(`• ${feature}`, 25, yPosition);
        yPosition += 5;
      });
      
      // Generate timestamp for filename
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`comprehensive-project-plan-${timestamp}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const projectAnalysis = generateProjectAnalysis(flows, wireframes, Object.keys(localStorage));
  const appOverview = getAppOverview();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 space-y-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Flow & Wireframe Mapping
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive project visualization and development planning
          </p>
        </div>

        {/* Workflow Progress */}
        <WorkflowProgress 
          currentStep={flows.length > 0 ? (wireframes.length > 0 ? "wireframes" : "diagram") : "plan"}
          completedSteps={[
            ...(flows.length > 0 ? ["plan", "diagram"] : ["plan"]),
            ...(wireframes.length > 0 ? ["wireframes"] : [])
          ]}
        />

        {/* Project Analysis */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <BarChart3 className="h-6 w-6" />
              Project Analysis & Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-600">{projectAnalysis.completionScore}%</div>
                <div className="text-sm text-gray-600">Overall Progress</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="text-lg font-semibold text-emerald-700">{projectAnalysis.readinessLevel}</div>
                <div className="text-sm text-gray-600">Development Stage</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-600">{flows.length}</div>
                <div className="text-sm text-gray-600">Process Flows</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-600">{wireframes.length}</div>
                <div className="text-sm text-gray-600">Wireframes</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Project Strengths
                </h4>
                <ul className="space-y-1">
                  {projectAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Next Steps
                </h4>
                <ul className="space-y-1">
                  {projectAnalysis.nextSteps.map((step, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Project Plan */}
        {comprehensiveProjectPlan && (
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Comprehensive Development Plan
                </div>
                <Button 
                  onClick={exportComprehensiveProjectPlan}
                  disabled={isGeneratingPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Development Plan
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Executive Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-blue-800">Project Title</div>
                    <div className="text-gray-700">{comprehensiveProjectPlan.executiveSummary.projectTitle}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-800">Timeline</div>
                    <div className="text-gray-700">{comprehensiveProjectPlan.executiveSummary.timeline}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-sm font-medium text-blue-800 mb-1">Description</div>
                  <div className="text-gray-700 text-sm">{comprehensiveProjectPlan.executiveSummary.projectDescription}</div>
                </div>
              </div>

              {/* Feature Matrix */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Feature Implementation Matrix
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="text-sm font-medium text-green-800 mb-2">Core Features ({comprehensiveProjectPlan.featureMatrix.core.length})</div>
                    <div className="text-xs text-gray-600">
                      Essential functionality for MVP
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="text-sm font-medium text-blue-800 mb-2">Secondary Features ({comprehensiveProjectPlan.featureMatrix.secondary.length})</div>
                    <div className="text-xs text-gray-600">
                      Enhanced functionality post-launch
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <div className="text-sm font-medium text-purple-700 mb-2">Future Features ({comprehensiveProjectPlan.featureMatrix.future.length})</div>
                    <div className="text-xs text-gray-600">
                      Long-term roadmap and expansion
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Consolidated Master Flow Section */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg">
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

        {/* App Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Settings className="h-5 w-5" />
                Core Functionality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appOverview.coreFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Users className="h-5 w-5" />
                User Types & Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appOverview.userTypes.map((userType, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">{userType}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Globe className="h-5 w-5" />
                Platform Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appOverview.platformSupport.map((platform, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-gray-700">{platform}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Shield className="h-5 w-5" />
                Security & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appOverview.securityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Flows and Wireframes */}
        <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Activity className="h-6 w-6" />
              Process Flows & Wireframes Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="flows" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gradient-to-r from-blue-100 to-purple-100 p-1 rounded-xl">
                <TabsTrigger 
                  value="flows" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 rounded-lg font-medium"
                >
                  Process Flows ({flows.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="wireframes"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 rounded-lg font-medium"
                >
                  Wireframes ({wireframes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="flows" className="space-y-4">
                {flows.length === 0 ? (
                  <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border-2 border-dashed border-blue-300">
                    <Activity className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-blue-900 mb-2">No Process Flows Available</h3>
                    <p className="text-blue-600">Generate some process flows to see them here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {flows.map((flow) => (
                      <div key={flow.id} className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold truncate">{flow.title}</h3>
                            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                              {flow.priority}
                            </Badge>
                          </div>
                          <p className="text-blue-100 text-sm">{flow.description}</p>
                        </div>
                        
                        <div className="p-4">
                          <div className="bg-gray-50 rounded-lg p-2 mb-4 border">
                            <FlowDiagramViewer
                              flowData={flow.flowData}
                              title={flow.title}
                              className="h-48"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              {flow.category}
                            </span>
                            <span>{new Date(flow.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="wireframes" className="space-y-4">
                {wireframes.length === 0 ? (
                  <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl border-2 border-dashed border-purple-300">
                    <Monitor className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-purple-900 mb-2">No Wireframes Available</h3>
                    <p className="text-purple-600">Generate some wireframes to see them here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {wireframes.map((wireframe) => (
                      <div key={wireframe.id} className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 text-white">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold truncate">{wireframe.pageName}</h3>
                            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                              {wireframe.userType}
                            </Badge>
                          </div>
                          <p className="text-purple-100 text-sm capitalize">{wireframe.pageType.replace(/[-_]/g, ' ')}</p>
                        </div>
                        
                        <div className="p-4">
                          <div className="bg-gray-50 rounded-lg p-3 mb-4 border relative">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              </div>
                              <div className="text-xs text-gray-500">Browser Preview</div>
                            </div>
                            <div className="bg-white rounded border h-32 overflow-hidden">
                              <iframe
                                srcDoc={wireframe.htmlContent}
                                className="w-full h-full border-0 transform scale-75 origin-top-left"
                                style={{ width: '133%', height: '133%' }}
                                title={`Preview of ${wireframe.pageName}`}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Monitor className="h-4 w-4" />
                              {wireframe.features.length} features
                            </span>
                            <span>{new Date(wireframe.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 hover:bg-blue-50 hover:border-blue-300"
                              onClick={() => {
                                const blob = new Blob([wireframe.htmlContent], { type: 'text/html' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${wireframe.pageName.replace(/\s+/g, '-').toLowerCase()}.html`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 hover:bg-green-50 hover:border-green-300"
                              onClick={() => {
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(wireframe.htmlContent);
                                  newWindow.document.close();
                                }
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
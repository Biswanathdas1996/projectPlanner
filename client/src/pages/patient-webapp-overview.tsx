import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowDiagramViewer } from "@/components/flow-diagram-viewer";
import { 
  Heart, 
  User, 
  Calendar, 
  FileText, 
  Shield, 
  Smartphone,
  Monitor,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  UserPlus,
  Activity,
  Settings
} from "lucide-react";

interface PatientFlow {
  id: string;
  title: string;
  description: string;
  flowData: any;
  category: 'onboarding' | 'core' | 'management';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

interface PatientWireframe {
  id: string;
  pageName: string;
  pageType: 'registration' | 'dashboard' | 'appointments' | 'profile' | 'mobile';
  htmlContent: string;
  features: string[];
  userType: 'patient' | 'provider' | 'admin';
  createdAt: string;
}

interface PatientAppOverview {
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

export function PatientWebappOverviewPage() {
  const [flows, setFlows] = useState<PatientFlow[]>([]);
  const [wireframes, setWireframes] = useState<PatientWireframe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectAnalysis | null>(null);

  useEffect(() => {
    loadPatientAppData();
  }, []);

  const loadPatientAppData = () => {
    console.log('Loading all localStorage data for comprehensive analysis...');
    
    // Get all localStorage keys for comprehensive analysis
    const allKeys = Object.keys(localStorage);
    console.log('All localStorage keys:', allKeys);

    const loadedFlows: PatientFlow[] = [];
    const loadedWireframes: PatientWireframe[] = [];

    // Process ALL data sources from localStorage
    allKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (!data) return;

        const parsedData = JSON.parse(data);
        console.log(`Processing ${key}:`, parsedData);

        // Handle different data structures
        if (key.includes('flow') || key.includes('Flow')) {
          processFlowData(key, parsedData, loadedFlows);
        }
        
        if (key.includes('wireframe') || key.includes('Wireframe') || key.includes('html')) {
          processWireframeData(key, parsedData, loadedWireframes);
        }

        if (key.includes('page_content') || key.includes('page_layouts')) {
          processPageData(key, parsedData, loadedFlows, loadedWireframes);
        }

        if (key.includes('brand-guidelines') || key.includes('analysis_result')) {
          processBrandData(key, parsedData, loadedFlows);
        }

        if (key.includes('project_sections') || key.includes('enhanced_plan')) {
          processProjectData(key, parsedData, loadedFlows);
        }

        if (key.includes('stakeholder') || key.includes('persona')) {
          processStakeholderData(key, parsedData, loadedFlows);
        }

      } catch (error) {
        console.error(`Error processing ${key}:`, error);
      }
    });

    console.log('Final loaded flows:', loadedFlows);
    console.log('Final loaded wireframes:', loadedWireframes);

    // Generate comprehensive project analysis
    const analysis = generateProjectAnalysis(loadedFlows, loadedWireframes, allKeys);
    setProjectAnalysis(analysis);

    setFlows(loadedFlows);
    setWireframes(loadedWireframes);
  };

  const processFlowData = (key: string, data: any, flows: PatientFlow[]) => {
    if (typeof data === 'object' && data !== null) {
      // Handle object with multiple flows
      if (data.nodes && data.edges) {
        // Single flow data
        flows.push(createFlowFromData(key, data));
      } else {
        // Multiple flows in object
        Object.entries(data).forEach(([subKey, subValue]: [string, any]) => {
          if (subValue && typeof subValue === 'object' && (subValue.nodes || subValue.title)) {
            flows.push(createFlowFromData(`${key}-${subKey}`, subValue));
          }
        });
      }
    }
  };

  const processWireframeData = (key: string, data: any, wireframes: PatientWireframe[]) => {
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.pageName && item.htmlContent) {
          wireframes.push(createWireframeFromData(key, item));
        }
      });
    } else if (data && typeof data === 'object' && data.htmlContent) {
      wireframes.push(createWireframeFromData(key, data));
    }
  };

  const processPageData = (key: string, data: any, flows: PatientFlow[], wireframes: PatientWireframe[]) => {
    if (Array.isArray(data)) {
      data.forEach((item: any, index: number) => {
        if (item.pageName || item.pageType) {
          // Create a flow representation of page content
          flows.push({
            id: `page-${key}-${index}`,
            title: item.pageName || `Page ${index + 1}`,
            description: `Page content structure: ${item.purpose || 'Content page'}`,
            flowData: createFlowFromPageContent(item),
            category: 'core',
            priority: 'medium',
            createdAt: new Date().toISOString()
          });
        }
      });
    }
  };

  const processBrandData = (key: string, data: any, flows: PatientFlow[]) => {
    if (data && typeof data === 'object') {
      flows.push({
        id: `brand-${key}`,
        title: 'Brand Guidelines Analysis',
        description: `Brand analysis results from ${key}`,
        flowData: createFlowFromBrandData(data),
        category: 'management',
        priority: 'low',
        createdAt: new Date().toISOString()
      });
    }
  };

  const processProjectData = (key: string, data: any, flows: PatientFlow[]) => {
    if (Array.isArray(data)) {
      data.forEach((section: any, index: number) => {
        if (section.title || section.name) {
          flows.push({
            id: `project-${key}-${index}`,
            title: section.title || section.name || `Project Section ${index + 1}`,
            description: section.description || 'Project planning section',
            flowData: createFlowFromProjectSection(section),
            category: 'management',
            priority: section.enabled ? 'high' : 'low',
            createdAt: new Date().toISOString()
          });
        }
      });
    }
  };

  const processStakeholderData = (key: string, data: any, flows: PatientFlow[]) => {
    if (Array.isArray(data)) {
      data.forEach((stakeholder: any, index: number) => {
        flows.push({
          id: `stakeholder-${key}-${index}`,
          title: stakeholder.title || stakeholder.name || `Stakeholder ${index + 1}`,
          description: stakeholder.description || 'Stakeholder analysis',
          flowData: createFlowFromStakeholder(stakeholder),
          category: 'onboarding',
          priority: 'medium',
          createdAt: new Date().toISOString()
        });
      });
    }
  };

  const createFlowFromData = (key: string, data: any): PatientFlow => {
    return {
      id: key,
      title: data.title || key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getFlowDescription(key) || data.description || 'Process flow analysis',
      flowData: data,
      category: categorizeFlow(key),
      priority: getFlowPriority(key),
      createdAt: data.createdAt || new Date().toISOString()
    };
  };

  const createWireframeFromData = (key: string, data: any): PatientWireframe => {
    return {
      id: data.id || `wireframe-${key}-${Date.now()}`,
      pageName: data.pageName || key,
      pageType: categorizeWireframe(data.pageName || key),
      htmlContent: data.htmlContent || '',
      features: extractWireframeFeatures(data.htmlContent || ''),
      userType: determineUserType(data.pageName || key),
      createdAt: data.createdAt || new Date().toISOString()
    };
  };

  const createFlowFromPageContent = (pageData: any) => {
    const nodes = [
      {
        id: 'page-start',
        position: { x: 50, y: 50 },
        data: { label: `Page: ${pageData.pageName || 'Content Page'}` },
        type: 'input'
      }
    ];

    const edges: any[] = [];
    let yPos = 150;

    if (pageData.headers && Array.isArray(pageData.headers)) {
      pageData.headers.forEach((header: string, index: number) => {
        nodes.push({
          id: `header-${index}`,
          position: { x: 250, y: yPos },
          data: { label: `Header: ${header}` },
          type: 'default'
        });
        edges.push({
          id: `edge-header-${index}`,
          source: index === 0 ? 'page-start' : `header-${index - 1}`,
          target: `header-${index}`
        });
        yPos += 100;
      });
    }

    return { nodes, edges };
  };

  const createFlowFromBrandData = (brandData: any) => {
    const nodes = [
      {
        id: 'brand-start',
        position: { x: 50, y: 50 },
        data: { label: 'Brand Guidelines' },
        type: 'input'
      }
    ];

    if (brandData.colors) {
      nodes.push({
        id: 'brand-colors',
        position: { x: 250, y: 50 },
        data: { label: 'Color Palette' },
        type: 'default'
      });
    }

    if (brandData.typography || brandData.fonts) {
      nodes.push({
        id: 'brand-typography',
        position: { x: 450, y: 50 },
        data: { label: 'Typography' },
        type: 'default'
      });
    }

    const edges: any[] = [
      { id: 'brand-edge-1', source: 'brand-start', target: 'brand-colors' },
      { id: 'brand-edge-2', source: 'brand-colors', target: 'brand-typography' }
    ].filter(edge => nodes.find(n => n.id === edge.target));

    return { nodes, edges };
  };

  const createFlowFromProjectSection = (section: any) => {
    const nodes = [
      {
        id: 'section-start',
        position: { x: 50, y: 50 },
        data: { label: section.title || 'Project Section' },
        type: 'input'
      }
    ];

    if (section.description) {
      nodes.push({
        id: 'section-desc',
        position: { x: 250, y: 50 },
        data: { label: 'Description' },
        type: 'default'
      });
    }

    if (section.enabled !== undefined) {
      nodes.push({
        id: 'section-status',
        position: { x: 450, y: 50 },
        data: { label: section.enabled ? 'Enabled' : 'Disabled' },
        type: 'default'
      });
    }

    const edges = [];
    for (let i = 1; i < nodes.length; i++) {
      edges.push({
        id: `section-edge-${i}`,
        source: nodes[i - 1].id,
        target: nodes[i].id
      });
    }

    return { nodes, edges };
  };

  const createFlowFromStakeholder = (stakeholder: any) => {
    const nodes = [
      {
        id: 'stakeholder-start',
        position: { x: 50, y: 50 },
        data: { label: stakeholder.name || 'Stakeholder' },
        type: 'input'
      }
    ];

    if (stakeholder.role || stakeholder.type) {
      nodes.push({
        id: 'stakeholder-role',
        position: { x: 250, y: 50 },
        data: { label: stakeholder.role || stakeholder.type },
        type: 'default'
      });
    }

    if (stakeholder.goals || stakeholder.needs) {
      nodes.push({
        id: 'stakeholder-goals',
        position: { x: 450, y: 50 },
        data: { label: 'Goals & Needs' },
        type: 'default'
      });
    }

    const edges: any[] = [];
    for (let i = 1; i < nodes.length; i++) {
      edges.push({
        id: `stakeholder-edge-${i}`,
        source: nodes[i - 1].id,
        target: nodes[i].id
      });
    }

    return { nodes, edges };
  };

  const generateProjectAnalysis = (flows: PatientFlow[], wireframes: PatientWireframe[], allKeys: string[]): ProjectAnalysis => {
    // Calculate completion metrics
    const flowsScore = Math.min(100, flows.length * 20);
    const wireframesScore = Math.min(100, wireframes.length * 25);
    const contentScore = Math.min(100, allKeys.length * 5);
    
    const overallScore = Math.round((flowsScore + wireframesScore + contentScore) / 3);

    // Determine readiness level
    let readinessLevel: 'Planning' | 'Development' | 'Testing' | 'Ready' = 'Planning';
    if (overallScore >= 80) readinessLevel = 'Ready';
    else if (overallScore >= 60) readinessLevel = 'Testing';
    else if (overallScore >= 40) readinessLevel = 'Development';

    // Analyze strengths
    const strengths: string[] = [];
    if (flows.length >= 2) strengths.push('Multiple process flows defined');
    if (wireframes.length >= 1) strengths.push('UI wireframes created');
    if (allKeys.some(k => k.includes('brand'))) strengths.push('Brand guidelines established');
    if (allKeys.some(k => k.includes('stakeholder'))) strengths.push('Stakeholder analysis completed');
    if (flows.some(f => f.category === 'onboarding')) strengths.push('User onboarding flows designed');

    // Identify gaps
    const gaps: string[] = [];
    if (flows.length < 3) gaps.push('Limited process flow coverage');
    if (wireframes.length < 2) gaps.push('Insufficient UI wireframes');
    if (!allKeys.some(k => k.includes('security'))) gaps.push('Security requirements not defined');
    if (!allKeys.some(k => k.includes('test'))) gaps.push('Testing strategy missing');
    if (!flows.some(f => f.priority === 'high')) gaps.push('Critical user journeys not prioritized');

    // Generate recommendations
    const recommendations: string[] = [];
    if (wireframes.length < flows.length) recommendations.push('Create wireframes for each process flow');
    if (!allKeys.some(k => k.includes('mobile'))) recommendations.push('Develop mobile-specific user experiences');
    if (overallScore < 70) recommendations.push('Complete core feature documentation');
    recommendations.push('Implement user feedback collection mechanisms');
    recommendations.push('Plan accessibility compliance testing');

    // Define next steps
    const nextSteps: string[] = [];
    if (readinessLevel === 'Planning') {
      nextSteps.push('Complete process flow documentation');
      nextSteps.push('Create comprehensive wireframe library');
    } else if (readinessLevel === 'Development') {
      nextSteps.push('Begin frontend development');
      nextSteps.push('Set up backend infrastructure');
    } else if (readinessLevel === 'Testing') {
      nextSteps.push('Conduct user acceptance testing');
      nextSteps.push('Perform security audits');
    } else {
      nextSteps.push('Prepare for production deployment');
      nextSteps.push('Set up monitoring and analytics');
    }

    return {
      completionScore: overallScore,
      readinessLevel,
      strengths,
      gaps,
      recommendations,
      dataQuality: {
        flows: flowsScore,
        wireframes: wireframesScore,
        content: contentScore,
        overall: overallScore
      },
      nextSteps
    };
  };

  const getFlowDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'patient-account-creation-flow': 'Complete patient registration and account setup process including identity verification and payment processing',
      'mobile-app-usage-flow': 'Mobile application user journey covering core features and patient interactions',
      'provider-account-creation': 'Healthcare provider registration and credential verification workflow',
      'appointment-scheduling': 'Patient appointment booking and management system flow'
    };
    return descriptions[key] || 'Healthcare application workflow process';
  };

  const categorizeFlow = (key: string): 'onboarding' | 'core' | 'management' => {
    if (key.includes('account') || key.includes('registration')) return 'onboarding';
    if (key.includes('appointment') || key.includes('usage')) return 'core';
    return 'management';
  };

  const getFlowPriority = (key: string): 'high' | 'medium' | 'low' => {
    if (key.includes('patient') || key.includes('account')) return 'high';
    if (key.includes('mobile') || key.includes('appointment')) return 'medium';
    return 'low';
  };

  const categorizeWireframe = (pageName: string): 'registration' | 'dashboard' | 'appointments' | 'profile' | 'mobile' => {
    const name = pageName.toLowerCase();
    if (name.includes('registration') || name.includes('signup') || name.includes('account')) return 'registration';
    if (name.includes('dashboard') || name.includes('home')) return 'dashboard';
    if (name.includes('appointment') || name.includes('booking')) return 'appointments';
    if (name.includes('profile') || name.includes('settings')) return 'profile';
    if (name.includes('mobile') || name.includes('app')) return 'mobile';
    return 'dashboard';
  };

  const extractWireframeFeatures = (htmlContent: string): string[] => {
    const features = [];
    const content = htmlContent.toLowerCase();
    
    if (content.includes('form') || content.includes('input')) features.push('Data Input');
    if (content.includes('calendar') || content.includes('schedule')) features.push('Scheduling');
    if (content.includes('button') || content.includes('submit')) features.push('Interactive Elements');
    if (content.includes('navigation') || content.includes('menu')) features.push('Navigation');
    if (content.includes('profile') || content.includes('account')) features.push('User Management');
    if (content.includes('medical') || content.includes('health')) features.push('Healthcare Features');
    
    return features.length > 0 ? features : ['Basic Layout'];
  };

  const determineUserType = (pageName: string): 'patient' | 'provider' | 'admin' => {
    const name = pageName.toLowerCase();
    if (name.includes('provider') || name.includes('doctor')) return 'provider';
    if (name.includes('admin') || name.includes('management')) return 'admin';
    return 'patient';
  };

  const getAppOverview = (): PatientAppOverview => {
    return {
      coreFeatures: [
        'Patient Account Creation & Management',
        'Appointment Scheduling System',
        'Medical Records Access',
        'Provider Communication Portal',
        'Mobile App Integration',
        'Payment Processing',
        'Identity Verification'
      ],
      userTypes: [
        'Patients - Primary end users seeking healthcare services',
        'Healthcare Providers - Medical professionals managing patient care',
        'Administrators - System managers handling operations'
      ],
      platformSupport: [
        'Responsive Web Application',
        'Mobile-First Design',
        'Cross-Browser Compatibility',
        'Progressive Web App (PWA) Features'
      ],
      securityFeatures: [
        'HIPAA Compliance Framework',
        'Multi-Factor Authentication',
        'Encrypted Data Transmission',
        'Secure Payment Processing',
        'Identity Verification Systems'
      ],
      integrations: [
        'Electronic Health Records (EHR)',
        'Payment Gateways',
        'SMS/Email Notifications',
        'Calendar Systems',
        'Insurance Verification APIs'
      ]
    };
  };

  const filteredFlows = selectedCategory === 'all' 
    ? flows 
    : flows.filter(flow => flow.category === selectedCategory);

  const appOverview = getAppOverview();

  const downloadWireframe = (wireframe: PatientWireframe) => {
    const blob = new Blob([wireframe.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wireframe.pageName.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openWireframePreview = (wireframe: PatientWireframe) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(wireframe.htmlContent);
      newWindow.document.close();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
            <Heart className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Healthcare WebApp Analysis</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Comprehensive evaluation of all project data including flows, wireframes, content, and readiness assessment.
        </p>
      </div>

      {/* Project Analysis Dashboard */}
      {projectAnalysis && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
                Project Readiness Analysis
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={projectAnalysis.readinessLevel === 'Ready' ? 'default' : 
                           projectAnalysis.readinessLevel === 'Testing' ? 'secondary' : 
                           projectAnalysis.readinessLevel === 'Development' ? 'outline' : 'destructive'}
                  className="text-sm"
                >
                  {projectAnalysis.readinessLevel}
                </Badge>
                <div className="text-2xl font-bold text-emerald-600">
                  {projectAnalysis.completionScore}%
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Quality Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="text-sm text-gray-600 mb-1">Process Flows</div>
                <div className="text-xl font-bold text-emerald-600">{projectAnalysis.dataQuality.flows}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${projectAnalysis.dataQuality.flows}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">UI Wireframes</div>
                <div className="text-xl font-bold text-blue-600">{projectAnalysis.dataQuality.wireframes}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${projectAnalysis.dataQuality.wireframes}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Content Data</div>
                <div className="text-xl font-bold text-purple-600">{projectAnalysis.dataQuality.content}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${projectAnalysis.dataQuality.content}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-300">
                <div className="text-sm text-gray-600 mb-1">Overall Quality</div>
                <div className="text-xl font-bold text-gray-700">{projectAnalysis.dataQuality.overall}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${projectAnalysis.dataQuality.overall}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Analysis Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Project Strengths
                </h4>
                <div className="space-y-2">
                  {projectAnalysis.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">{strength}</span>
                    </div>
                  ))}
                  {projectAnalysis.strengths.length === 0 && (
                    <div className="text-sm text-gray-500 italic">No major strengths identified yet.</div>
                  )}
                </div>
              </div>

              {/* Gaps */}
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Areas for Improvement
                </h4>
                <div className="space-y-2">
                  {projectAnalysis.gaps.map((gap, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700">{gap}</span>
                    </div>
                  ))}
                  {projectAnalysis.gaps.length === 0 && (
                    <div className="text-sm text-gray-500 italic">No critical gaps identified.</div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Strategic Recommendations
                </h4>
                <div className="space-y-2">
                  {projectAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Immediate Next Steps
                </h4>
                <div className="space-y-2">
                  {projectAnalysis.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <User className="h-5 w-5" />
              User Types & Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Target Users:</h4>
                <div className="space-y-1">
                  {appOverview.userTypes.map((userType, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      • {userType}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Platform Support:</h4>
                <div className="flex flex-wrap gap-2">
                  {appOverview.platformSupport.map((platform, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Flows Section */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Patient Application Flows
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Flows
              </Button>
              <Button
                variant={selectedCategory === 'onboarding' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('onboarding')}
              >
                Onboarding
              </Button>
              <Button
                variant={selectedCategory === 'core' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('core')}
              >
                Core Features
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFlows.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredFlows.map((flow) => (
                <div key={flow.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{flow.title}</h3>
                        <Badge 
                          variant={flow.priority === 'high' ? 'destructive' : flow.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {flow.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{flow.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        Created {new Date(flow.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Flow Diagram */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <FlowDiagramViewer
                      flowData={flow.flowData}
                      title={flow.title}
                      className="h-64"
                      flowKey={flow.id}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {flow.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {flow.flowData?.nodes?.length || 0} steps
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Process Flows Found</h3>
              <p className="text-gray-600">No patient application flows are currently available.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wireframes Section */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-indigo-600" />
              UI Wireframes & Prototypes
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('desktop')}
              >
                <Monitor className="h-4 w-4 mr-1" />
                Desktop
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Mobile
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wireframes.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {wireframes.map((wireframe) => (
                <div key={wireframe.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{wireframe.pageName}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {wireframe.pageType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {wireframe.userType}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {wireframe.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Wireframe Preview */}
                  <div className={`relative bg-gray-100 rounded-lg p-2 mb-4 ${
                    viewMode === 'mobile' ? 'max-w-xs mx-auto aspect-[9/16]' : 'w-full aspect-[16/10]'
                  }`}>
                    <div className="w-full h-full bg-white rounded-md overflow-hidden shadow-inner">
                      <iframe
                        srcDoc={wireframe.htmlContent}
                        className="w-full h-full border-0"
                        title={wireframe.pageName}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Created {new Date(wireframe.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openWireframePreview(wireframe)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadWireframe(wireframe)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Wireframes Available</h3>
              <p className="text-gray-600">UI wireframes and prototypes will appear here once generated.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & Integration Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Shield className="h-5 w-5" />
              Security & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appOverview.securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <FileText className="h-5 w-5" />
              System Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appOverview.integrations.map((integration, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-700">{integration}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
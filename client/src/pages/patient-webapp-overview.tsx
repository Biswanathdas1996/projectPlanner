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

export function PatientWebappOverviewPage() {
  const [flows, setFlows] = useState<PatientFlow[]>([]);
  const [wireframes, setWireframes] = useState<PatientWireframe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    loadPatientAppData();
  }, []);

  const loadPatientAppData = () => {
    // Load flow diagrams from localStorage
    const flowDiagrams = localStorage.getItem('flowDiagrams');
    const sectionFlowDiagrams = localStorage.getItem('sectionFlowDiagrams');
    const generatedWireframes = localStorage.getItem('generated_wireframes');

    const loadedFlows: PatientFlow[] = [];
    const loadedWireframes: PatientWireframe[] = [];

    // Process flow diagrams
    if (flowDiagrams) {
      try {
        const flowData = JSON.parse(flowDiagrams);
        Object.entries(flowData).forEach(([key, value]: [string, any]) => {
          if (key.includes('patient') || key.includes('account')) {
            loadedFlows.push({
              id: key,
              title: value.title || key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: getFlowDescription(key),
              flowData: value,
              category: categorizeFlow(key),
              priority: getFlowPriority(key),
              createdAt: value.createdAt || new Date().toISOString()
            });
          }
        });
      } catch (error) {
        console.error('Error parsing flow diagrams:', error);
      }
    }

    // Process section flow diagrams
    if (sectionFlowDiagrams) {
      try {
        const sectionData = JSON.parse(sectionFlowDiagrams);
        Object.entries(sectionData).forEach(([key, value]: [string, any]) => {
          if (key.includes('patient') || key.includes('mobile') || key.includes('account')) {
            loadedFlows.push({
              id: `section-${key}`,
              title: value.title || key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: getFlowDescription(key),
              flowData: value,
              category: categorizeFlow(key),
              priority: getFlowPriority(key),
              createdAt: value.createdAt || new Date().toISOString()
            });
          }
        });
      } catch (error) {
        console.error('Error parsing section flow diagrams:', error);
      }
    }

    // Process wireframes
    if (generatedWireframes) {
      try {
        const wireframeData = JSON.parse(generatedWireframes);
        if (Array.isArray(wireframeData)) {
          wireframeData.forEach((wireframe: any) => {
            if (wireframe.pageName && wireframe.htmlContent) {
              loadedWireframes.push({
                id: wireframe.id || `wireframe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                pageName: wireframe.pageName,
                pageType: categorizeWireframe(wireframe.pageName),
                htmlContent: wireframe.htmlContent,
                features: extractWireframeFeatures(wireframe.htmlContent),
                userType: determineUserType(wireframe.pageName),
                createdAt: wireframe.createdAt || new Date().toISOString()
              });
            }
          });
        }
      } catch (error) {
        console.error('Error parsing wireframes:', error);
      }
    }

    setFlows(loadedFlows);
    setWireframes(loadedWireframes);
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
          <h1 className="text-3xl font-bold text-gray-900">Patient Healthcare WebApp</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Comprehensive patient-centered healthcare application with account management, 
          appointment scheduling, and mobile-first design for optimal user experience.
        </p>
      </div>

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
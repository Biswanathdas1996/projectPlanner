import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateUserJourneyFlows, generateUserJourneyBpmn } from '@/lib/gemini';
import { STORAGE_KEYS } from '@/lib/bpmn-utils';
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
  Activity
} from 'lucide-react';

export default function UserJourney() {
  const [projectPlan, setProjectPlan] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [userJourneyFlows, setUserJourneyFlows] = useState<string>('');
  const [userJourneyBpmn, setUserJourneyBpmn] = useState<string>('');
  const [isGeneratingFlows, setIsGeneratingFlows] = useState(false);
  const [isGeneratingBpmn, setIsGeneratingBpmn] = useState(false);
  const [error, setError] = useState('');
  const [showFlowDetails, setShowFlowDetails] = useState(false);

  // Load data from localStorage when component mounts
  useEffect(() => {
    const savedProjectDescription = localStorage.getItem(STORAGE_KEYS.PROJECT_DESCRIPTION);
    const savedProjectPlan = localStorage.getItem(STORAGE_KEYS.PROJECT_PLAN);

    if (savedProjectDescription) {
      setProjectDescription(savedProjectDescription);
    }
    if (savedProjectPlan) {
      setProjectPlan(savedProjectPlan);
    }
  }, []);

  const generateUserJourneys = async () => {
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
    } catch (error) {
      console.error('Error generating user journey flows:', error);
      setError('Failed to generate user journey flows. Please try again.');
    } finally {
      setIsGeneratingFlows(false);
    }
  };

  const generateUserJourneyBpmnDiagram = async () => {
    const planContent = projectPlan || projectDescription;
    if (!planContent.trim()) {
      setError('No project plan available. Please generate a project plan first.');
      return;
    }

    setIsGeneratingBpmn(true);
    setError('');

    try {
      const bpmn = await generateUserJourneyBpmn(planContent);
      setUserJourneyBpmn(bpmn);
      
      // Save to localStorage for use in BPMN editor
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmn);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmn);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('Error generating user journey BPMN:', error);
      setError('Failed to generate user journey BPMN diagram. Please try again.');
    } finally {
      setIsGeneratingBpmn(false);
    }
  };

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
    const filename = `user_journey_flows_${projectName}_${timestamp}.html`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadBpmn = () => {
    if (!userJourneyBpmn) {
      setError('No BPMN diagram available to download');
      return;
    }

    const blob = new Blob([userJourneyBpmn], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const projectName = projectDescription.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `user_journey_bpmn_${projectName}_${timestamp}.xml`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyUserJourneys = async () => {
    if (!userJourneyFlows) {
      setError('No user journey flows available to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(userJourneyFlows);
    } catch (error) {
      console.error('Error copying user journey flows:', error);
      setError('Failed to copy user journey flows to clipboard');
    }
  };

  const copyBpmn = async () => {
    if (!userJourneyBpmn) {
      setError('No BPMN diagram available to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(userJourneyBpmn);
    } catch (error) {
      console.error('Error copying BPMN diagram:', error);
      setError('Failed to copy BPMN diagram to clipboard');
    }
  };

  const renderUserJourneyContent = () => {
    if (!userJourneyFlows) return null;
    
    const cleanedContent = userJourneyFlows.trim();
    
    // Check if it's HTML content
    const isHtmlContent = cleanedContent.startsWith('<!DOCTYPE html>') || 
                        cleanedContent.startsWith('<html') || 
                        cleanedContent.startsWith('<div') || 
                        cleanedContent.includes('<style>');
    
    if (isHtmlContent) {
      return (
        <div className="w-full">
          <div 
            className="user-journey-content"
            dangerouslySetInnerHTML={{ __html: cleanedContent }}
            style={{
              minHeight: '500px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '0'
            }}
          />
        </div>
      );
    }
    
    // If not HTML, render as formatted text
    return (
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6">
        <div className="prose prose-gray max-w-none">
          <div className="text-gray-800 leading-relaxed">
            {cleanedContent.split('\n').map((line, index) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return null;
              
              return (
                <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                  {trimmedLine}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/plan">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plan
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="text-white h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">User Journey Flows</h1>
            </div>
            <div className="flex-1"></div>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Detailed flow diagrams showing each user journey step-by-step as defined in your project plan. 
            Visualize how different user types navigate through your application.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Journey Types Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4 text-center">
              <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">End User Journey</h3>
              <p className="text-sm text-blue-700">Primary user interactions</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Admin Journey</h3>
              <p className="text-sm text-green-700">Administrative workflows</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-4 text-center">
              <Settings className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Setup Journey</h3>
              <p className="text-sm text-purple-700">Configuration flows</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-900">Error Journey</h3>
              <p className="text-sm text-orange-700">Exception handling</p>
            </CardContent>
          </Card>
        </div>

        {/* Generate User Journey Flows */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Navigation className="h-5 w-5 text-white" />
                </div>
                User Journey Flow Generation
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                Generate comprehensive flow diagrams for each user journey identified in your project plan. 
                Each journey will show step-by-step navigation, decision points, and user interactions.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={generateUserJourneys}
                  disabled={isGeneratingFlows || (!projectPlan && !projectDescription)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  {isGeneratingFlows ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Flows...
                    </>
                  ) : (
                    <>
                      <Workflow className="h-4 w-4 mr-2" />
                      Generate User Journey Flows
                    </>
                  )}
                </Button>

                {userJourneyFlows && (
                  <>
                    <Button
                      onClick={() => {
                        console.log('View Details clicked, current state:', showFlowDetails);
                        setShowFlowDetails(!showFlowDetails);
                      }}
                      variant="outline"
                      size="sm"
                      className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                    >
                      {showFlowDetails ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={copyUserJourneys}
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      onClick={downloadUserJourneys}
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </>
                )}
              </div>

              {!projectPlan && !projectDescription && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    <strong>No project plan found.</strong> Please go back and generate a project plan first.
                  </p>
                  <Link href="/plan">
                    <Button variant="outline" size="sm" className="mt-2">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Go to Project Plan
                    </Button>
                  </Link>
                </div>
              )}

              {(projectPlan || projectDescription) && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    <strong>Project plan loaded successfully.</strong> You can now generate user journey flows based on your project requirements.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generate BPMN Diagram */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                BPMN 2.0 Swimlane Diagram Generation
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                Generate a comprehensive BPMN 2.0 XML diagram with swimlanes for user journey flows. 
                The diagram will include different actors (User, System, Admin, External Services) with proper sequence flows and decision gateways.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={generateUserJourneyBpmnDiagram}
                  disabled={isGeneratingBpmn || (!projectPlan && !projectDescription)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {isGeneratingBpmn ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating BPMN...
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 mr-2" />
                      Generate BPMN Diagram
                    </>
                  )}
                </Button>

                {userJourneyBpmn && (
                  <>
                    <Link href="/diagram">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View in Editor
                      </Button>
                    </Link>
                    
                    <Button
                      onClick={downloadBpmn}
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download XML
                    </Button>
                    
                    <Button
                      onClick={copyBpmn}
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy XML
                    </Button>
                  </>
                )}
              </div>

              {userJourneyBpmn && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-emerald-800 font-medium mb-2">
                    ✓ BPMN 2.0 diagram generated successfully
                  </p>
                  <p className="text-emerald-700 text-sm">
                    The swimlane-enabled BPMN diagram has been saved and is ready to view in the visual editor. 
                    Click "View in Editor" to see the interactive diagram with swimlanes for different user roles.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Journey Flows Display */}
        {userJourneyFlows && showFlowDetails && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Generated User Journey Flows
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Comprehensive flow diagrams showing each user journey with decision points, 
                  interactions, and navigation paths through your application.
                </p>
                
                {renderUserJourneyContent()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateUserJourneyFlows, generatePersonaBpmnFlow } from '@/lib/gemini';
import { STORAGE_KEYS } from '@/lib/bpmn-utils';
import { InlineBpmnViewer } from '@/components/inline-bpmn-viewer';
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
  const [personaBpmnFlows, setPersonaBpmnFlows] = useState<Record<string, string>>({});
  const [isGeneratingFlows, setIsGeneratingFlows] = useState(false);
  const [isGeneratingPersonaBpmn, setIsGeneratingPersonaBpmn] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [showFlowDetails, setShowFlowDetails] = useState(false);
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [autoGenerationStatus, setAutoGenerationStatus] = useState<string>('');
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);
  const [personaPrompts, setPersonaPrompts] = useState<Record<string, string>>({
    guest: '',
    'logged-in': '',
    admin: '',
    power: '',
    mobile: ''
  });

  // Load data from localStorage when component mounts and auto-generate BPMN
  useEffect(() => {
    const savedProjectDescription = localStorage.getItem(STORAGE_KEYS.PROJECT_DESCRIPTION);
    const savedProjectPlan = localStorage.getItem(STORAGE_KEYS.PROJECT_PLAN);
    const savedUserJourneyFlows = localStorage.getItem(STORAGE_KEYS.USER_JOURNEY_FLOWS);
    const savedPersonaBpmnFlows = localStorage.getItem(STORAGE_KEYS.PERSONA_BPMN_FLOWS);
    const savedPersonaPrompts = localStorage.getItem(STORAGE_KEYS.PERSONA_PROMPTS);

    if (savedProjectDescription) {
      setProjectDescription(savedProjectDescription);
    }
    if (savedProjectPlan) {
      setProjectPlan(savedProjectPlan);
    }
    if (savedUserJourneyFlows) {
      setUserJourneyFlows(savedUserJourneyFlows);
    }
    if (savedPersonaBpmnFlows) {
      try {
        setPersonaBpmnFlows(JSON.parse(savedPersonaBpmnFlows));
      } catch (error) {
        console.error('Error parsing saved persona BPMN flows:', error);
      }
    }
    if (savedPersonaPrompts) {
      try {
        setPersonaPrompts(JSON.parse(savedPersonaPrompts));
      } catch (error) {
        console.error('Error parsing saved persona prompts:', error);
      }
    }
      
      // Only auto-generate if we have a project plan but no existing persona BPMN flows
      if (savedProjectPlan && !savedPersonaBpmnFlows) {
        // Auto-generate all persona BPMN diagrams
        const autoGeneratePersonaBpmn = async () => {
          const personas: ('guest' | 'logged-in' | 'admin' | 'power' | 'mobile')[] = ['guest', 'logged-in', 'admin', 'power', 'mobile'];
          
          setAutoGenerationStatus('Starting automatic generation of persona BPMN diagrams...');
          
          for (let i = 0; i < personas.length; i++) {
            const persona = personas[i];
            try {
              setAutoGenerationStatus(`Generating ${persona.charAt(0).toUpperCase() + persona.slice(1)} user BPMN (${i + 1}/${personas.length})...`);
              await generatePersonaBpmn(persona);
              
              if (i < personas.length - 1) {
                setAutoGenerationStatus(`Generated ${persona.charAt(0).toUpperCase() + persona.slice(1)} user BPMN. Preparing next diagram...`);
                // Add delay between generations to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
            } catch (error) {
              console.error(`Failed to auto-generate ${persona} BPMN:`, error);
              setAutoGenerationStatus(`Error generating ${persona} BPMN. Continuing with other personas...`);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          setAutoGenerationStatus('All persona BPMN diagrams generated successfully!');
          // Clear status after 3 seconds
          setTimeout(() => setAutoGenerationStatus(''), 3000);
        };
        
        // Trigger auto-generation after a short delay
        setTimeout(autoGeneratePersonaBpmn, 1000);
      }
    
    // Set loading complete
    setIsLoadingFromStorage(false);
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
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.USER_JOURNEY_FLOWS, flows);
    } catch (error) {
      console.error('Error generating user journey flows:', error);
      setError('Failed to generate user journey flows. Please try again.');
    } finally {
      setIsGeneratingFlows(false);
    }
  };

  const generatePersonaBpmn = async (personaType: 'guest' | 'logged-in' | 'admin' | 'power' | 'mobile', customPrompt?: string) => {
    const planContent = projectPlan || projectDescription;
    if (!planContent.trim()) {
      setError('No project plan available. Please generate a project plan first.');
      return;
    }

    setIsGeneratingPersonaBpmn(prev => ({ ...prev, [personaType]: true }));
    setError('');

    try {
      // Combine project plan with custom prompt if provided
      const enhancedPrompt = customPrompt 
        ? `${planContent}\n\nAdditional Requirements for ${personaType} user: ${customPrompt}`
        : planContent;
        
      const bpmn = await generatePersonaBpmnFlow(enhancedPrompt, personaType);
      setPersonaBpmnFlows(prev => {
        const updated = { ...prev, [personaType]: bpmn };
        // Save persona BPMN flows to localStorage
        localStorage.setItem(STORAGE_KEYS.PERSONA_BPMN_FLOWS, JSON.stringify(updated));
        return updated;
      });
      
      // Save the latest generated BPMN to localStorage
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmn);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmn);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error(`Error generating ${personaType} BPMN:`, error);
      setError(`Failed to generate ${personaType} user BPMN diagram. Please try again.`);
    } finally {
      setIsGeneratingPersonaBpmn(prev => ({ ...prev, [personaType]: false }));
    }
  };

  const generateAllPersonaBpmn = async () => {
    const personas: ('guest' | 'logged-in' | 'admin' | 'power' | 'mobile')[] = ['guest', 'logged-in', 'admin', 'power', 'mobile'];
    
    for (const persona of personas) {
      await generatePersonaBpmn(persona);
      // Add a small delay between generations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  const downloadPersonaBpmn = (personaType: string) => {
    const bpmn = personaBpmnFlows[personaType];
    if (!bpmn) {
      setError(`No ${personaType} BPMN diagram available to download`);
      return;
    }

    const blob = new Blob([bpmn], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const projectName = projectDescription.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${personaType}_user_journey_${projectName}_${timestamp}.xml`;
    
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

  const copyPersonaBpmn = async (personaType: string) => {
    const bpmn = personaBpmnFlows[personaType];
    if (!bpmn) {
      setError(`No ${personaType} BPMN diagram available to copy`);
      return;
    }

    try {
      await navigator.clipboard.writeText(bpmn);
    } catch (error) {
      console.error(`Error copying ${personaType} BPMN diagram:`, error);
      setError(`Failed to copy ${personaType} BPMN diagram to clipboard`);
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

        {/* Auto-Generation Status */}
        {autoGenerationStatus && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <p className="text-blue-700 font-medium">{autoGenerationStatus}</p>
            </div>
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

              {isLoadingFromStorage ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    <p className="text-blue-700">Loading project data...</p>
                  </div>
                </div>
              ) : !projectPlan && !projectDescription ? (
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
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    <strong>Project plan loaded successfully.</strong> You can now generate user journey flows based on your project requirements.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Persona-Based BPMN Generation */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                Persona-Based BPMN 2.0 Diagrams
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <p className="text-gray-600">
                Generate individual BPMN 2.0 diagrams with swimlanes for each user persona. 
                Each diagram shows specific workflows, decision points, and interactions tailored to different user types.
              </p>
              
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={generateAllPersonaBpmn}
                  disabled={Object.values(isGeneratingPersonaBpmn).some(Boolean) || (!projectPlan && !projectDescription)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {Object.values(isGeneratingPersonaBpmn).some(Boolean) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating All Personas...
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 mr-2" />
                      Generate All Persona BPMN
                    </>
                  )}
                </Button>
              </div>

              {/* Individual Persona Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                  { type: 'guest', title: 'Guest User', icon: '👤', color: 'blue', description: 'Unauthenticated exploration & registration' },
                  { type: 'logged-in', title: 'Logged-in User', icon: '👥', color: 'green', description: 'Core features & profile management' },
                  { type: 'admin', title: 'Admin User', icon: '👑', color: 'purple', description: 'User management & system configuration' },
                  { type: 'power', title: 'Power User', icon: '⚡', color: 'orange', description: 'Advanced features & bulk operations' },
                  { type: 'mobile', title: 'Mobile User', icon: '📱', color: 'pink', description: 'Mobile-specific interactions & offline sync' }
                ].map((persona) => (
                  <Card key={persona.type} className="border border-gray-200">
                    <CardHeader className={`bg-gradient-to-r from-${persona.color}-50 to-${persona.color}-100 border-b`}>
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <span className="text-2xl">{persona.icon}</span>
                        <div>
                          <div className="font-semibold">{persona.title}</div>
                          <div className="text-sm font-normal text-gray-600">{persona.description}</div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Custom Prompt Input */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Custom Requirements (Optional)
                          </label>
                          <textarea
                            value={personaPrompts[persona.type] || ''}
                            onChange={(e) => setPersonaPrompts(prev => {
                              const updated = { 
                                ...prev, 
                                [persona.type]: e.target.value 
                              };
                              // Save persona prompts to localStorage
                              localStorage.setItem(STORAGE_KEYS.PERSONA_PROMPTS, JSON.stringify(updated));
                              return updated;
                            })}
                            placeholder={`Add specific requirements for ${persona.title.toLowerCase()}... e.g., "Include security verification steps", "Add mobile-specific gestures", "Include offline capabilities"`}
                            className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            disabled={isGeneratingPersonaBpmn[persona.type]}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => generatePersonaBpmn(
                              persona.type as any, 
                              personaPrompts[persona.type]?.trim() || undefined
                            )}
                            disabled={isGeneratingPersonaBpmn[persona.type] || (!projectPlan && !projectDescription)}
                            size="sm"
                            className={`bg-gradient-to-r from-${persona.color}-500 to-${persona.color}-600`}
                          >
                            {isGeneratingPersonaBpmn[persona.type] ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Activity className="h-3 w-3 mr-2" />
                                {personaPrompts[persona.type]?.trim() ? 'Generate Extended' : 'Generate'}
                              </>
                            )}
                          </Button>
                          
                          {personaBpmnFlows[persona.type] && (
                            <>
                              <Link href="/editor">
                                <Button
                                  onClick={() => {
                                    // Save the current persona BPMN to localStorage for the editor
                                    localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, personaBpmnFlows[persona.type]);
                                    localStorage.setItem(STORAGE_KEYS.DIAGRAM, personaBpmnFlows[persona.type]);
                                    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="bg-indigo-50 border-indigo-300 text-indigo-600 hover:bg-indigo-100"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View in Editor
                                </Button>
                              </Link>
                              <Button
                                onClick={() => downloadPersonaBpmn(persona.type)}
                                variant="outline"
                                size="sm"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                onClick={() => copyPersonaBpmn(persona.type)}
                                variant="outline"
                                size="sm"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </>
                          )}
                        </div>
                        
                        {personaBpmnFlows[persona.type] && (
                          <InlineBpmnViewer 
                            bpmnXml={personaBpmnFlows[persona.type]}
                            title={persona.title}
                            height="300px"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
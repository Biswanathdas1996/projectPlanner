import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateProjectPlan, generateBpmnJson } from '@/lib/gemini';
import { STORAGE_KEYS } from '@/lib/bpmn-utils';
import { Link, useLocation } from 'wouter';
import {
  Sparkles,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Workflow,
  ArrowLeft,
  Plus,
  Edit,
  Save,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Type,
} from 'lucide-react';

export default function ProjectPlanner() {
  const [projectInput, setProjectInput] = useState('');
  const [projectPlan, setProjectPlan] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingBpmn, setIsGeneratingBpmn] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'plan' | 'diagram'>('input');
  const [error, setError] = useState('');
  const [generatedBpmnJson, setGeneratedBpmnJson] = useState<any>(null);
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editedPlanContent, setEditedPlanContent] = useState('');

  const [, setLocation] = useLocation();

  const handleGenerateProjectPlan = async () => {
    if (!projectInput.trim()) {
      setError('Please enter a project description');
      return;
    }

    setIsGeneratingPlan(true);
    setError('');

    try {
      const plan = await generateProjectPlan(projectInput);
      setProjectPlan(plan);
      setCurrentStep('plan');
    } catch (err) {
      setError('Failed to generate project plan. Please check your API key and try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateBpmnDiagram = async () => {
    if (!projectPlan) {
      setError('No project plan available');
      return;
    }

    setIsGeneratingBpmn(true);
    setError('');

    try {
      const bpmnJson = await generateBpmnJson(projectPlan);
      setGeneratedBpmnJson(bpmnJson);
      
      // Store the generated BPMN JSON in localStorage
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, JSON.stringify(bpmnJson));
      localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, projectPlan);
      localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, projectInput);
      
      setCurrentStep('diagram');
    } catch (err) {
      setError('Failed to generate BPMN diagram. Please try again.');
      console.error('BPMN generation error:', err);
    } finally {
      setIsGeneratingBpmn(false);
    }
  };

  const navigateToEditor = () => {
    if (generatedBpmnJson) {
      // Ensure the BPMN JSON is stored before navigation
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, JSON.stringify(generatedBpmnJson));
      localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, projectPlan);
      localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, projectInput);
    }
    setLocation('/editor');
  };

  const enhanceProjectPlan = async () => {
    if (!enhancementPrompt.trim()) {
      setError('Please enter enhancement details');
      return;
    }

    setIsEnhancing(true);
    setError('');

    try {
      const enhancementRequest = `
Based on the existing project plan below, enhance it by adding the following requirements:

ENHANCEMENT REQUEST: "${enhancementPrompt}"

EXISTING PROJECT PLAN:
${projectPlan}

INSTRUCTIONS:
- Keep all existing content and structure
- Add the new requirements/features seamlessly
- Update architecture diagrams to include new components
- Modify user flows to incorporate new features
- Update development timeline and resource estimates
- Maintain the same HTML format with embedded CSS
- Ensure all new content is properly integrated

Return the complete enhanced project plan as HTML with all existing content plus the new enhancements.`;

      const enhancedPlan = await generateProjectPlan(enhancementRequest);
      setProjectPlan(enhancedPlan);
      setEnhancementPrompt('');
    } catch (err) {
      console.error('Enhancement error:', err);
      setError('Failed to enhance project plan. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const startEditingPlan = () => {
    setEditedPlanContent(projectPlan);
    setIsEditingPlan(true);
  };

  const saveEditedPlan = () => {
    setProjectPlan(editedPlanContent);
    setIsEditingPlan(false);
    setEditedPlanContent('');
  };

  const cancelEditingPlan = () => {
    setIsEditingPlan(false);
    setEditedPlanContent('');
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const insertHeading = (level: number) => {
    executeCommand('formatBlock', `h${level}`);
  };

  const resetPlanner = () => {
    setProjectInput('');
    setProjectPlan('');
    setEnhancementPrompt('');
    setIsEditingPlan(false);
    setEditedPlanContent('');
    setCurrentStep('input');
    setError('');
  };

  const getStepStatus = (step: string) => {
    if (step === 'input') return currentStep === 'input' ? 'active' : currentStep === 'plan' || currentStep === 'diagram' ? 'completed' : 'pending';
    if (step === 'plan') return currentStep === 'plan' ? 'active' : currentStep === 'diagram' ? 'completed' : 'pending';
    if (step === 'diagram') return currentStep === 'diagram' ? 'completed' : 'pending';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">


        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AI Project Planner</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform your project ideas into structured BPMN workflows. 
            Describe your project and let AI create a visual process diagram for you.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getStepStatus('input') === 'completed' ? 'bg-green-500 text-white' :
                getStepStatus('input') === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {getStepStatus('input') === 'completed' ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-sm font-medium text-gray-700">Describe Project</span>
            </div>
            
            <ArrowRight className="h-4 w-4 text-gray-400" />
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getStepStatus('plan') === 'completed' ? 'bg-green-500 text-white' :
                getStepStatus('plan') === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {getStepStatus('plan') === 'completed' ? <CheckCircle className="h-4 w-4" /> : '2'}
              </div>
              <span className="text-sm font-medium text-gray-700">Generate Plan</span>
            </div>
            
            <ArrowRight className="h-4 w-4 text-gray-400" />
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getStepStatus('diagram') === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {getStepStatus('diagram') === 'completed' ? <CheckCircle className="h-4 w-4" /> : '3'}
              </div>
              <span className="text-sm font-medium text-gray-700">Create Diagram</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Step 1: Project Input */}
        {currentStep === 'input' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Describe Your Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: Create an e-commerce website with user registration, product catalog, shopping cart, payment processing, and order management. Include admin features for inventory management and analytics."
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                className="min-h-32 text-sm"
                disabled={isGeneratingPlan}
              />
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {projectInput.length}/1000 characters
                </div>
                <Button
                  onClick={handleGenerateProjectPlan}
                  disabled={!projectInput.trim() || isGeneratingPlan}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isGeneratingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Project Plan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Project Plan */}
        {currentStep === 'plan' && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <CardTitle className="flex items-center justify-between text-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Generated Project Plan
                </div>
                <Button
                  onClick={startEditingPlan}
                  variant="outline"
                  size="sm"
                  disabled={isEditingPlan || isEnhancing || isGeneratingBpmn}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Plan
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Editing Mode */}
              {isEditingPlan ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Edit Project Plan</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={saveEditedPlan}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        onClick={cancelEditingPlan}
                        variant="outline"
                        size="sm"
                        className="border-gray-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                  
                  {/* Formatting Toolbar */}
                  <div className="border border-gray-300 rounded-t-lg p-3 bg-gray-50 border-b-0">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeCommand('bold')}
                        className="h-8 px-2"
                        type="button"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeCommand('italic')}
                        className="h-8 px-2"
                        type="button"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeCommand('underline')}
                        className="h-8 px-2"
                        type="button"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertHeading(1)}
                        className="h-8 px-3 text-xs"
                        type="button"
                      >
                        H1
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertHeading(2)}
                        className="h-8 px-3 text-xs"
                        type="button"
                      >
                        H2
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertHeading(3)}
                        className="h-8 px-3 text-xs"
                        type="button"
                      >
                        H3
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeCommand('insertUnorderedList')}
                        className="h-8 px-2"
                        type="button"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeCommand('insertOrderedList')}
                        className="h-8 px-2"
                        type="button"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeCommand('formatBlock', 'blockquote')}
                        className="h-8 px-2"
                        type="button"
                      >
                        <Quote className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeCommand('undo')}
                        className="h-8 px-3 text-xs"
                        type="button"
                      >
                        Undo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeCommand('redo')}
                        className="h-8 px-3 text-xs"
                        type="button"
                      >
                        Redo
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-300 rounded-b-lg border-t-0">
                    <div 
                      contentEditable
                      suppressContentEditableWarning={true}
                      className="min-h-[600px] p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 prose prose-gray max-w-none"
                      style={{
                        lineHeight: '1.6',
                        fontSize: '14px'
                      }}
                      dangerouslySetInnerHTML={{ __html: editedPlanContent }}
                      onInput={(e) => {
                        const target = e.target as HTMLDivElement;
                        setEditedPlanContent(target.innerHTML);
                      }}
                      onBlur={(e) => {
                        const target = e.target as HTMLDivElement;
                        setEditedPlanContent(target.innerHTML);
                      }}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-500 flex justify-between">
                    <span>Visual HTML editor - use toolbar buttons to format content</span>
                    <span>{editedPlanContent.replace(/<[^>]*>/g, '').length} characters (text only)</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* HTML Project Plan Content with Architecture Diagrams */}
                  {(projectPlan.trim().startsWith('<!DOCTYPE html>') || projectPlan.trim().startsWith('<html') || projectPlan.trim().startsWith('<div') || projectPlan.includes('<style>')) ? (
                    <div className="w-full">
                      <div 
                        className="project-plan-content"
                        dangerouslySetInnerHTML={{ __html: projectPlan }}
                        style={{
                          minHeight: '500px',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          padding: '0'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 mb-6">
                      <div className="prose prose-gray max-w-none">
                        <div className="text-gray-800 leading-relaxed">
                          {projectPlan.split('\n').map((line, index) => {
                        const trimmedLine = line.trim();
                        
                        // Clean markdown symbols and format content
                        let cleanLine = trimmedLine
                          .replace(/\*\*/g, '') // Remove ** bold markers
                          .replace(/\*/g, '') // Remove * italic markers
                          .replace(/^#+\s*/, '') // Remove # headers
                          .replace(/^[-•]\s*/, '') // Remove bullet markers
                          .replace(/^\d+\.\s*/, '') // Remove number markers for processing
                          .trim();

                        // Skip empty lines
                        if (!cleanLine) {
                          return <div key={index} className="h-3"></div>;
                        }

                        // Format headers (lines that were originally ## or #)
                        if (trimmedLine.startsWith('##') || trimmedLine.startsWith('# ')) {
                          return (
                            <div key={index} className="mt-6 mb-4 first:mt-0">
                              <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                                <h3 className="text-xl font-bold text-blue-800">{cleanLine}</h3>
                              </div>
                            </div>
                          );
                        }
                        
                        // Format bullet points
                        if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                          return (
                            <div key={index} className="flex items-start gap-3 mb-3 ml-4">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-700 leading-relaxed">{cleanLine}</span>
                            </div>
                          );
                        }
                        
                        // Format numbered lists
                        if (trimmedLine.match(/^\d+\./)) {
                          const number = trimmedLine.match(/^(\d+)/)?.[1];
                          return (
                            <div key={index} className="flex items-start gap-4 mb-4 ml-2">
                              <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
                                {number}
                              </div>
                              <div className="flex-1">
                                <span className="text-gray-800 font-medium leading-relaxed">{cleanLine}</span>
                              </div>
                            </div>
                          );
                        }
                      
                      // Format key-value pairs or important statements
                      if (cleanLine.includes(':') && cleanLine.length < 100) {
                        const [key, ...valueParts] = cleanLine.split(':');
                        const value = valueParts.join(':').trim();
                        return (
                          <div key={index} className="mb-3 p-3 bg-white rounded-lg border-l-4 border-blue-400">
                            <span className="font-semibold text-blue-800">{key.trim()}:</span>
                            {value && <span className="text-gray-700 ml-2">{value}</span>}
                          </div>
                        );
                      }
                      
                      // Regular paragraphs
                      return (
                        <p key={index} className="text-gray-700 mb-4 leading-relaxed text-justify">
                          {cleanLine}
                        </p>
                      );
                    })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Enhancement Section */}
              <div className="border-t border-gray-200 p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-600" />
                    Enhance Project Plan
                  </h3>
                  <p className="text-sm text-gray-600">
                    Add specific requirements, features, or modifications to enhance your existing project plan.
                  </p>
                  
                  <div className="space-y-3">
                    <Textarea
                      value={enhancementPrompt}
                      onChange={(e) => setEnhancementPrompt(e.target.value)}
                      placeholder="e.g., Add user authentication system, Include mobile app requirements, Add payment gateway integration, Include security audit section..."
                      className="min-h-[100px] resize-y border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isEnhancing}
                    />
                    
                    <Button
                      onClick={enhanceProjectPlan}
                      disabled={isEnhancing || !enhancementPrompt.trim()}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                    >
                      {isEnhancing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enhancing Plan...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Enhance Project Plan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={resetPlanner}
                  disabled={isGeneratingBpmn || isEnhancing}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
                <Button
                  onClick={handleGenerateBpmnDiagram}
                  disabled={isGeneratingBpmn || isEnhancing}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg"
                >
                  {isGeneratingBpmn ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Visual Diagram...
                    </>
                  ) : (
                    <>
                      <Workflow className="h-4 w-4 mr-2" />
                      Create Visual Diagram
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {currentStep === 'diagram' && (
          <Card className="mb-6">
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                BPMN Diagram Created!
              </h3>
              <p className="text-gray-600 mb-6">
                Your project workflow has been generated and loaded into the BPMN editor.
                You can now edit, refine, and export your process diagram.
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={resetPlanner}
                >
                  Create Another Project
                </Button>
                <Button 
                  onClick={navigateToEditor}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  Edit in BPMN Editor
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Example Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Example Project Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "E-commerce Platform",
                  description: "Online store with user accounts, product catalog, shopping cart, payment processing, and order fulfillment."
                },
                {
                  title: "Employee Onboarding",
                  description: "HR process for new employee recruitment, documentation, training, and integration into the organization."
                },
                {
                  title: "Software Development",
                  description: "Agile development process including requirements gathering, design, development, testing, and deployment."
                },
                {
                  title: "Customer Support",
                  description: "Support ticket system with ticket creation, assignment, escalation, resolution, and customer feedback."
                }
              ].map((example, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setProjectInput(example.description)}
                >
                  <h4 className="font-medium text-gray-900 mb-1">{example.title}</h4>
                  <p className="text-sm text-gray-600">{example.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
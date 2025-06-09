import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateProjectPlan, generateBpmnJson } from '@/lib/gemini';
import { useBpmn } from '@/hooks/use-bpmn';
import { Link } from 'wouter';
import {
  Sparkles,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Workflow,
  ArrowLeft,
} from 'lucide-react';

export default function ProjectPlanner() {
  const [projectInput, setProjectInput] = useState('');
  const [projectPlan, setProjectPlan] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingBpmn, setIsGeneratingBpmn] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'plan' | 'diagram'>('input');
  const [error, setError] = useState('');

  const { importFromJson } = useBpmn();

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
      await importFromJson(bpmnJson);
      setCurrentStep('diagram');
    } catch (err) {
      setError('Failed to generate BPMN diagram. Please try again.');
      console.error('BPMN generation error:', err);
    } finally {
      setIsGeneratingBpmn(false);
    }
  };

  const resetPlanner = () => {
    setProjectInput('');
    setProjectPlan('');
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Project Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {projectPlan}
                </pre>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetPlanner}
                  disabled={isGeneratingBpmn}
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleGenerateBpmnDiagram}
                  disabled={isGeneratingBpmn}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  {isGeneratingBpmn ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Diagram...
                    </>
                  ) : (
                    <>
                      <Workflow className="h-4 w-4 mr-2" />
                      Create BPMN Diagram
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
                <Link href="/editor">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Workflow className="h-4 w-4 mr-2" />
                    Edit in BPMN Editor
                  </Button>
                </Link>
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
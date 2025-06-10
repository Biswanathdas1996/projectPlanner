import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { generateProjectPlan, generateBpmnXml, generateCustomSuggestions, generateSitemapXml } from '@/lib/gemini';
import { STORAGE_KEYS } from '@/lib/bpmn-utils';
import { NavigationBar } from '@/components/navigation-bar';
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
  Download,
  Edit,
  Save,
  X,
  Users,
  Code,
  EyeOff,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote
} from 'lucide-react';
import { InlineBpmnViewer } from '@/components/inline-bpmn-viewer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Landing() {
  const [projectInput, setProjectInput] = useState('');
  const [projectPlan, setProjectPlan] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'plan' | 'diagram'>('input');
  const [isGeneratingBpmn, setIsGeneratingBpmn] = useState(false);
  const [error, setError] = useState('');
  const [generatedBpmnXml, setGeneratedBpmnXml] = useState<string>('');
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editedPlanContent, setEditedPlanContent] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generatedSitemapXml, setGeneratedSitemapXml] = useState<string>('');
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showBpmnScript, setShowBpmnScript] = useState(false);
  const [isEditingBpmn, setIsEditingBpmn] = useState(false);
  const [editedBpmnScript, setEditedBpmnScript] = useState('');

  const [location, setLocation] = useLocation();

  // Load data from localStorage when component mounts or route changes
  useEffect(() => {
    const savedProjectDescription = localStorage.getItem(STORAGE_KEYS.PROJECT_DESCRIPTION);
    const savedProjectPlan = localStorage.getItem(STORAGE_KEYS.PROJECT_PLAN);
    const savedDiagram = localStorage.getItem(STORAGE_KEYS.CURRENT_DIAGRAM);

    if (savedProjectDescription) {
      setProjectInput(savedProjectDescription);
    }
    if (savedProjectPlan) {
      setProjectPlan(savedProjectPlan);
    }
    if (savedDiagram) {
      setGeneratedBpmnXml(savedDiagram);
    }

    // Determine current step based on available data
    if (savedDiagram) {
      setCurrentStep('diagram');
    } else if (savedProjectPlan) {
      setCurrentStep('plan');
    } else {
      setCurrentStep('input');
    }
  }, [location]);

  const getStepStatus = (step: 'input' | 'plan' | 'diagram') => {
    if (step === 'input') {
      return projectInput ? 'completed' : (currentStep === 'input' ? 'active' : 'pending');
    } else if (step === 'plan') {
      return projectPlan ? 'completed' : (currentStep === 'plan' ? 'active' : 'pending');
    } else if (step === 'diagram') {
      return generatedBpmnXml ? 'completed' : (currentStep === 'diagram' ? 'active' : 'pending');
    }
    return 'pending';
  };

  const resetPlanner = () => {
    setProjectInput('');
    setProjectPlan('');
    setGeneratedBpmnXml('');
    setCurrentStep('input');
    setError('');
    setIsEditingPlan(false);
    setEditedPlanContent('');
    setShowSuggestions(false);
    setSelectedSuggestions([]);
    setSuggestions([]);
    setShowBpmnScript(false);
    setIsEditingBpmn(false);
    setEditedBpmnScript('');
    
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.PROJECT_DESCRIPTION);
    localStorage.removeItem(STORAGE_KEYS.PROJECT_PLAN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_DIAGRAM);
  };

  const handleGenerateProjectPlan = async () => {
    if (!projectInput.trim()) {
      setError('Please enter a project description');
      return;
    }

    setIsGeneratingSuggestions(true);
    setError('');

    try {
      // Generate suggestions first
      const generatedSuggestions = await generateCustomSuggestions(projectInput);
      setSuggestions(generatedSuggestions);
      setIsGeneratingSuggestions(false);
      setShowSuggestions(true);
      
      // Store project description
      localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, projectInput);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError('Failed to generate suggestions. Please try again.');
      setIsGeneratingSuggestions(false);
    }
  };

  const handleGenerateWithSuggestions = async () => {
    setIsGeneratingPlan(true);
    setShowSuggestions(false);

    try {
      const enhancedPrompt = selectedSuggestions.length > 0 
        ? `${projectInput}\n\nAdditional Requirements:\n${selectedSuggestions.map(s => `• ${s}`).join('\n')}`
        : projectInput;

      const plan = await generateProjectPlan(enhancedPrompt);
      setProjectPlan(plan);
      setCurrentStep('plan');
      
      // Store project plan
      localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, plan);
      
      // Auto-generate BPMN diagram
      await handleGenerateBpmnDiagram(plan);
    } catch (error) {
      console.error('Error generating project plan:', error);
      setError('Failed to generate project plan. Please try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateBpmnDiagram = async (planContent?: string) => {
    const contentToUse = planContent || projectPlan;
    if (!contentToUse) {
      setError('No project plan available for diagram generation');
      return;
    }

    setIsGeneratingBpmn(true);
    setError('');

    try {
      const bpmnXml = await generateBpmnXml(contentToUse);
      setGeneratedBpmnXml(bpmnXml);
      setCurrentStep('diagram');
      
      // Store generated diagram
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmnXml);
    } catch (error) {
      console.error('Error generating BPMN diagram:', error);
      setError('Failed to generate BPMN diagram. Please try again.');
    } finally {
      setIsGeneratingBpmn(false);
    }
  };

  const toggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestion) 
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
    );
  };

  const startEditingPlan = () => {
    setIsEditingPlan(true);
    setEditedPlanContent(projectPlan);
  };

  const saveEditedPlan = () => {
    setProjectPlan(editedPlanContent);
    setIsEditingPlan(false);
    localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, editedPlanContent);
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

  const downloadPDF = async () => {
    setIsDownloadingPdf(true);
    try {
      const element = document.getElementById('project-plan-content');
      if (!element) {
        throw new Error('Project plan content not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const projectName = projectInput.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`project-plan-${projectName}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const renderProjectPlan = () => {
    if (!projectPlan) return null;

    const lines = projectPlan.split('\n');
    
    return (
      <div id="project-plan-content" className="space-y-4 leading-relaxed">
        <div className="prose prose-gray max-w-none">
          {lines.map((line, index) => {
            const cleanLine = line.trim();
            
            if (!cleanLine) {
              return <div key={index} className="h-4"></div>;
            }
            
            if (cleanLine.startsWith('# ')) {
              return (
                <h1 key={index} className="text-2xl font-bold text-gray-900 mb-4 mt-6 border-b-2 border-blue-200 pb-2">
                  {cleanLine.substring(2).trim()}
                </h1>
              );
            }
            
            if (cleanLine.startsWith('## ')) {
              return (
                <h2 key={index} className="text-xl font-semibold text-gray-800 mb-3 mt-5">
                  {cleanLine.substring(3).trim()}
                </h2>
              );
            }
            
            if (cleanLine.startsWith('### ')) {
              return (
                <h3 key={index} className="text-lg font-medium text-gray-700 mb-2 mt-4">
                  {cleanLine.substring(4).trim()}
                </h3>
              );
            }
            
            if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
              return (
                <li key={index} className="text-gray-700 mb-2 ml-4 list-disc list-inside">
                  {cleanLine.substring(2).trim()}
                </li>
              );
            }
            
            if (cleanLine.match(/^\d+\.\s/)) {
              return (
                <li key={index} className="text-gray-700 mb-2 ml-4 list-decimal list-inside">
                  {cleanLine.replace(/^\d+\.\s/, '').trim()}
                </li>
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
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NavigationBar title="AI Project Planner" showBackButton={false} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white h-5 w-5" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Transform ideas into comprehensive workflows</p>
            </div>
          </div>
        </div>

        {/* Compact Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                getStepStatus('input') === 'active' ? 'bg-blue-100 text-blue-700 shadow-sm' :
                getStepStatus('input') === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-500'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  getStepStatus('input') === 'active' ? 'bg-blue-500 text-white' :
                  getStepStatus('input') === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                }`}>
                  {getStepStatus('input') === 'completed' ? <CheckCircle className="h-3 w-3" /> : '1'}
                </div>
                Input
              </div>
              
              <ArrowRight className="h-3 w-3 text-gray-300" />
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                getStepStatus('plan') === 'active' ? 'bg-blue-100 text-blue-700 shadow-sm' :
                getStepStatus('plan') === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-500'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  getStepStatus('plan') === 'active' ? 'bg-blue-500 text-white' :
                  getStepStatus('plan') === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                }`}>
                  {getStepStatus('plan') === 'completed' ? <CheckCircle className="h-3 w-3" /> : '2'}
                </div>
                Plan
              </div>
              
              <ArrowRight className="h-3 w-3 text-gray-300" />
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                getStepStatus('diagram') === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-500'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  getStepStatus('diagram') === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                }`}>
                  {getStepStatus('diagram') === 'completed' ? <CheckCircle className="h-3 w-3" /> : '3'}
                </div>
                Diagram
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Suggestions Modal */}
        {showSuggestions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  Customize Your Project Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-6">
                  Select additional features and requirements to include in your project plan. These will be integrated into the comprehensive architecture and development timeline.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {suggestions.map((suggestion) => {
                    const isChecked = selectedSuggestions.includes(suggestion);
                    return (
                      <div key={suggestion} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id={`suggestion-${suggestion.replace(/\s+/g, '-')}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            toggleSuggestion(suggestion);
                          }}
                          className="h-5 w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-2 border-gray-300"
                        />
                        <label
                          htmlFor={`suggestion-${suggestion.replace(/\s+/g, '-')}`}
                          className="text-sm text-gray-700 cursor-pointer flex-1 leading-relaxed"
                          onClick={() => toggleSuggestion(suggestion)}
                        >
                          {suggestion}
                        </label>
                      </div>
                    );
                  })}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-800 mb-2">Selected Requirements ({selectedSuggestions.length})</h4>
                  {selectedSuggestions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSuggestions.map((suggestion) => (
                        <Badge key={suggestion} variant="outline" className="bg-white border-blue-300 text-blue-700">
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-600 text-sm">No additional requirements selected</p>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowSuggestions(false)}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateWithSuggestions}
                    disabled={isGeneratingPlan}
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
                        Generate Enhanced Plan
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 1: Project Input */}
        {currentStep === 'input' && (
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                Describe Your Project
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <p className="text-gray-600">
                Provide a detailed description of your project. Include features, requirements, and any specific goals you want to achieve.
              </p>
              
              <Textarea
                placeholder="Example: Create an e-commerce website with user registration, product catalog, shopping cart, payment processing, and order management. Include admin features for inventory management and analytics."
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                className="min-h-32 text-sm"
                disabled={isGeneratingPlan}
              />
              
              {/* Compact Example Projects Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Quick Start Examples
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="bg-white rounded-md p-2 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                       onClick={() => setProjectInput("Create a comprehensive social media platform with user profiles, real-time messaging, content sharing (posts, photos, videos), news feed with personalized algorithms, friend connections, groups, events management, notifications system, and mobile app compatibility. Include admin dashboard for content moderation and analytics.")}>
                    <h5 className="font-medium text-gray-800 text-xs mb-0.5">Social Media</h5>
                    <p className="text-xs text-gray-500">Profiles, messaging, content sharing</p>
                  </div>
                  
                  <div className="bg-white rounded-md p-2 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                       onClick={() => setProjectInput("Build a complete project management application with task tracking, team collaboration, time logging, file sharing, project timelines (Gantt charts), resource allocation, budget tracking, reporting dashboard, and integrations with third-party tools. Support multiple project types and user roles.")}>
                    <h5 className="font-medium text-gray-800 text-xs mb-0.5">Project Management</h5>
                    <p className="text-xs text-gray-500">Tasks, collaboration, timelines</p>
                  </div>
                  
                  <div className="bg-white rounded-md p-2 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                       onClick={() => setProjectInput("Develop an online learning management system with course creation, video streaming, interactive quizzes, student progress tracking, certification system, discussion forums, assignment submissions, grade management, and payment processing for course purchases. Include mobile app for offline learning.")}>
                    <h5 className="font-medium text-gray-800 text-xs mb-0.5">Learning Platform</h5>
                    <p className="text-xs text-gray-500">Courses, quizzes, certifications</p>
                  </div>
                  
                  <div className="bg-white rounded-md p-2 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                       onClick={() => setProjectInput("Create a fintech application for personal finance management with bank account integration, expense tracking, budget planning, investment portfolio tracking, bill reminders, financial goal setting, credit score monitoring, and AI-powered financial advice. Ensure bank-level security and compliance.")}>
                    <h5 className="font-medium text-gray-800 text-xs mb-0.5">Finance App</h5>
                    <p className="text-xs text-gray-500">Expense tracking, investments</p>
                  </div>
                  
                  <div className="bg-white rounded-md p-2 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                       onClick={() => setProjectInput("Build a healthcare management platform with patient records, appointment scheduling, telemedicine video calls, prescription management, medical history tracking, insurance integration, billing system, and provider dashboard. Include patient mobile app and compliance with healthcare regulations.")}>
                    <h5 className="font-medium text-gray-800 text-xs mb-0.5">Healthcare Platform</h5>
                    <p className="text-xs text-gray-500">Records, telemedicine, billing</p>
                  </div>
                  
                  <div className="bg-white rounded-md p-2 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                       onClick={() => setProjectInput("Develop a smart home IoT platform with device management, automation rules, energy monitoring, security system integration, voice control, mobile app, real-time alerts, usage analytics, and machine learning for predictive automation. Support multiple device protocols and brands.")}>
                    <h5 className="font-medium text-gray-800 text-xs mb-0.5">IoT Platform</h5>
                    <p className="text-xs text-gray-500">Smart devices, automation</p>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-3">Click any example to use it as a starting point, then customize as needed.</p>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="text-xs text-gray-400">
                  {projectInput.length}/1000 characters
                </div>
                <Button
                  onClick={handleGenerateProjectPlan}
                  disabled={!projectInput.trim() || isGeneratingPlan || isGeneratingSuggestions}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-sm"
                >
                  {isGeneratingSuggestions ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : isGeneratingPlan ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-2" />
                      Generate Plan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Landing Page Content */}
        {currentStep === 'input' && !projectInput && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Project Planner</h1>
                <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
                  Transform your ideas into comprehensive project plans with AI-powered insights, visual diagrams, and stakeholder workflows
                </p>
                <div className="flex justify-center">
                  <Button 
                    onClick={() => document.getElementById('start-section')?.scrollIntoView({ behavior: 'smooth' })}
                    size="lg" 
                    className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3"
                  >
                    Get Started
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Planning</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Generate comprehensive project plans with 10 mandatory sections including technical architecture, development methodology, and risk management using advanced AI.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Stakeholder Journeys</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Create detailed BPMN workflows for each stakeholder persona with customizable flow types and automated diagram generation.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">User Stories & JIRA</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Generate user stories in Gherkin format with acceptance criteria and export directly to JIRA for seamless project management.
                </p>
              </div>
            </div>

            {/* Process Flow Infographic */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Complete Workflow Process</h2>
              
              <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-6">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Edit className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900">1. Describe Project</h3>
                  <p className="text-sm text-gray-600">Enter your project idea with features and requirements</p>
                </div>

                <ArrowRight className="h-6 w-6 text-gray-400 hidden md:block" />

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900">2. AI Generation</h3>
                  <p className="text-sm text-gray-600">AI creates comprehensive plans with visual elements</p>
                </div>

                <ArrowRight className="h-6 w-6 text-gray-400 hidden md:block" />

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900">3. Stakeholder Flows</h3>
                  <p className="text-sm text-gray-600">Generate BPMN diagrams for each user persona</p>
                </div>

                <ArrowRight className="h-6 w-6 text-gray-400 hidden md:block" />

                {/* Step 4 */}
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
                    <Download className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900">4. Export & Deploy</h3>
                  <p className="text-sm text-gray-600">Export to PDF, JIRA, or feature files</p>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-xl font-semibold mb-4 text-blue-900">Visual Project Planning</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800">Flow diagrams for every section</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800">Tabular data representation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800">Timeline visualization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800">Tree view sitemap</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <h3 className="text-xl font-semibold mb-4 text-purple-900">Advanced Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="text-purple-800">Persistent localStorage</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="text-purple-800">BPMN 2.0 compliance</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="text-purple-800">Gherkin test scenarios</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="text-purple-800">Data export/import</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">Explore Platform Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/plan">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Project Planner</h4>
                    <p className="text-xs text-gray-600">Generate AI-powered project plans</p>
                  </div>
                </Link>

                <Link href="/user-journey">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">User Journey</h4>
                    <p className="text-xs text-gray-600">Create stakeholder BPMN flows</p>
                  </div>
                </Link>

                <Link href="/user-stories">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">User Stories</h4>
                    <p className="text-xs text-gray-600">Generate Gherkin format stories</p>
                  </div>
                </Link>

                <Link href="/editor">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                      <Edit className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">BPMN Editor</h4>
                    <p className="text-xs text-gray-600">Visual diagram editor</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* CTA Section */}
            <div id="start-section" className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Ideas?</h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Start with a simple project description and watch AI create comprehensive plans, stakeholder workflows, and user stories in minutes.
              </p>
              <Button 
                onClick={() => {
                  const textarea = document.querySelector('textarea');
                  textarea?.focus();
                  textarea?.scrollIntoView({ behavior: 'smooth' });
                }}
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3"
              >
                Start Building Now
                <Sparkles className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
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
  Download,
  Code,
  Copy,
  Eye,
  EyeOff,
  Users,
} from 'lucide-react';

export default function ProjectPlanner() {
  const [projectInput, setProjectInput] = useState('');
  const [projectPlan, setProjectPlan] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingBpmn, setIsGeneratingBpmn] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'plan' | 'diagram'>(() => {
    const path = window.location.pathname;
    if (path === '/plan') return 'plan';
    if (path === '/diagram') return 'diagram';
    return 'input';
  });
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

    // Update current step based on route and available data
    const path = window.location.pathname;
    if (path === '/plan' && savedProjectPlan) {
      setCurrentStep('plan');
    } else if (path === '/diagram' && savedDiagram) {
      setCurrentStep('diagram');
    } else if (savedProjectDescription || savedProjectPlan || savedDiagram) {
      // If we have data but are on the wrong route, redirect to appropriate step
      if (savedDiagram) {
        setCurrentStep('diagram');
        setLocation('/diagram');
      } else if (savedProjectPlan) {
        setCurrentStep('plan');
        setLocation('/plan');
      } else {
        setCurrentStep('input');
        setLocation('/');
      }
    }
  }, [location, setLocation]);

  const handleGenerateProjectPlan = async () => {
    if (!projectInput.trim()) {
      setError('Please enter a project description');
      return;
    }

    setIsGeneratingSuggestions(true);
    setError('');

    try {
      // Generate custom suggestions based on user input
      const customSuggestions = await generateCustomSuggestions(projectInput);
      setSuggestions(customSuggestions);
      setShowSuggestions(true);
      setSelectedSuggestions([]);
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleGenerateWithSuggestions = async () => {
    setIsGeneratingPlan(true);
    setError('');
    setShowSuggestions(false);

    try {
      let enhancedInput = projectInput;
      
      if (selectedSuggestions.length > 0) {
        enhancedInput = `${projectInput}

Additional Requirements:
${selectedSuggestions.map(suggestion => `- ${suggestion}`).join('\n')}

Please ensure the project plan addresses all the selected requirements above and includes comprehensive architecture diagrams, user flows, and technical specifications.`;
      }

      const plan = await generateProjectPlan(enhancedInput);
      setProjectPlan(plan);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, plan);
      localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, projectInput);
      
      setCurrentStep('plan');
      setLocation('/plan');
    } catch (err) {
      console.error('Project plan generation error:', err);
      setError('Failed to generate project plan. Please try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateBpmnDiagram = async () => {
    if (!projectPlan.trim()) {
      setError('No project plan available to convert');
      return;
    }

    setIsGeneratingBpmn(true);
    setError('');

    try {
      const bpmnXml = await generateBpmnXml(projectPlan);
      setGeneratedBpmnXml(bpmnXml);
      setCurrentStep('diagram');
      
      // Save to localStorage and navigate to diagram route
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.GENERATED_BPMN_XML, bpmnXml);
      localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, projectPlan);
      localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, projectInput);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
      setLocation('/diagram');
    } catch (err) {
      console.error('BPMN generation error:', err);
      setError('Failed to generate BPMN diagram. Please try again.');
    } finally {
      setIsGeneratingBpmn(false);
    }
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

  const toggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions(prev => {
      if (prev.includes(suggestion)) {
        return prev.filter(s => s !== suggestion);
      } else {
        return [...prev, suggestion];
      }
    });
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
    setGeneratedBpmnXml('');
    setGeneratedSitemapXml('');
    setEnhancementPrompt('');
    setIsEditingPlan(false);
    setEditedPlanContent('');
    setCurrentStep('input');
    setError('');
    setShowSuggestions(false);
    setSelectedSuggestions([]);
    setSuggestions([]);
    setShowBpmnScript(false);
    setIsEditingBpmn(false);
    setEditedBpmnScript('');
    
    // Clear localStorage and navigate to home
    localStorage.removeItem(STORAGE_KEYS.PROJECT_DESCRIPTION);
    localStorage.removeItem(STORAGE_KEYS.PROJECT_PLAN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_DIAGRAM);
    setLocation('/');
  };

  const downloadPDF = async () => {
    setIsDownloadingPdf(true);
    
    try {
      // Import libraries dynamically
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      // Find the project plan content element
      const element = document.querySelector('.project-plan-content');
      if (!element) {
        setError('No project plan content found to download');
        return;
      }

      // Create a temporary container for PDF generation
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '1200px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '40px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Clone the content
      const clonedElement = element.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      // Generate canvas from the content
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1200,
        height: tempContainer.scrollHeight
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const projectName = projectInput.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `project_plan_${projectName}_${timestamp}.pdf`;

      // Download PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const downloadBpmnScript = () => {
    if (!generatedBpmnXml) {
      setError('No BPMN script available to download');
      return;
    }

    const blob = new Blob([generatedBpmnXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const projectName = projectInput.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `bpmn_diagram_${projectName}_${timestamp}.bpmn`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyBpmnScript = async () => {
    if (!generatedBpmnXml) {
      setError('No BPMN script available to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedBpmnXml);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy BPMN script:', error);
      setError('Failed to copy BPMN script to clipboard');
    }
  };

  const generateSitemap = async () => {
    if (!projectInput.trim()) {
      setError('Please enter a project description first');
      return;
    }

    setIsGeneratingSitemap(true);
    setError('');

    try {
      const sitemapXml = await generateSitemapXml(projectInput);
      setGeneratedSitemapXml(sitemapXml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      setError('Failed to generate sitemap. Please try again.');
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  const downloadSitemapXml = () => {
    if (!generatedSitemapXml) {
      setError('No sitemap XML available to download');
      return;
    }

    const blob = new Blob([generatedSitemapXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const projectName = projectInput.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `sitemap_${projectName}_${timestamp}.xml`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copySitemapXml = async () => {
    if (!generatedSitemapXml) {
      setError('No sitemap XML available to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedSitemapXml);
    } catch (error) {
      console.error('Error copying sitemap XML:', error);
      setError('Failed to copy sitemap XML to clipboard');
    }
  };

  const saveBpmnEdits = () => {
    try {
      // Basic XML validation - check if it starts and ends with proper XML tags
      const trimmedScript = editedBpmnScript.trim();
      if (!trimmedScript.startsWith('<?xml') && !trimmedScript.startsWith('<bpmn:definitions')) {
        throw new Error('Invalid BPMN XML format');
      }
      
      setGeneratedBpmnXml(editedBpmnScript);
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, editedBpmnScript);
      setIsEditingBpmn(false);
      setEditedBpmnScript('');
    } catch (error) {
      setError('Invalid BPMN XML format. Please check your script syntax.');
    }
  };

  const startEditingBpmn = () => {
    if (generatedBpmnXml) {
      setEditedBpmnScript(generatedBpmnXml);
      setIsEditingBpmn(true);
    }
  };

  const cancelBpmnEditing = () => {
    setIsEditingBpmn(false);
    setEditedBpmnScript('');
  };

  const getStepStatus = (step: string) => {
    if (step === 'input') return currentStep === 'input' ? 'active' : currentStep === 'plan' || currentStep === 'diagram' ? 'completed' : 'pending';
    if (step === 'plan') return currentStep === 'plan' ? 'active' : currentStep === 'diagram' ? 'completed' : 'pending';
    if (step === 'diagram') return currentStep === 'diagram' ? 'completed' : 'pending';
    return 'pending';
  };

  const renderProjectPlan = () => {
    // Clean the project plan content to remove code block markers
    let cleanedContent = projectPlan.trim();
    
    // Remove ```html and ``` markers if present
    if (cleanedContent.startsWith('```html')) {
      cleanedContent = cleanedContent.replace(/^```html\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Check if it's HTML content
    const isHtmlContent = cleanedContent.startsWith('<!DOCTYPE html>') || 
                        cleanedContent.startsWith('<html') || 
                        cleanedContent.startsWith('<div') || 
                        cleanedContent.includes('<style>');
    
    if (isHtmlContent) {
      return (
        <div className="w-full">
          <div 
            className="project-plan-content"
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
    
    // If not HTML, render as markdown
    return (
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 mb-6">
        <div className="prose prose-gray max-w-none">
          <div className="text-gray-800 leading-relaxed">
            {cleanedContent.split('\n').map((line, index) => {
              const trimmedLine = line.trim();
              
              // Clean markdown symbols and format content
              let cleanLine = trimmedLine
                .replace(/^\*\s+/, '')
                .replace(/^\-\s+/, '')
                .replace(/^#+\s+/, '')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1');
              
              if (!cleanLine) return null;
              
              // Format section headers
              if (trimmedLine.startsWith('#')) {
                const level = (trimmedLine.match(/^#+/) || [''])[0].length;
                const HeaderTag = `h${Math.min(level + 1, 6)}` as keyof JSX.IntrinsicElements;
                return (
                  <HeaderTag key={index} className="text-blue-800 font-bold mb-4 mt-6">
                    {cleanLine}
                  </HeaderTag>
                );
              }
              
              // Format bullet points
              if (trimmedLine.match(/^[\*\-]\s+/)) {
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

        {/* Step 2: Project Plan */}
        {currentStep === 'plan' && (
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  Generated Project Plan
                </div>
                <div className="flex gap-1.5">
                  <Button
                    onClick={downloadPDF}
                    variant="outline"
                    size="sm"
                    disabled={isDownloadingPdf || isEditingPlan || isEnhancing || isGeneratingBpmn}
                    className="border-green-200 text-green-600 hover:bg-green-50 text-xs px-2 py-1"
                  >
                    {isDownloadingPdf ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </>
                    )}
                  </Button>
                  {generatedBpmnXml && (
                    <Button
                      onClick={() => setShowBpmnScript(!showBpmnScript)}
                      variant="outline"
                      size="sm"
                      disabled={isEditingPlan || isEnhancing || isGeneratingBpmn}
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 text-xs px-2 py-1"
                    >
                      {showBpmnScript ? (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Code className="h-3 w-3 mr-1" />
                          BPMN
                        </>
                      )}
                    </Button>
                  )}
                  <Link href="/user-journey">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isEditingPlan || isEnhancing || isGeneratingBpmn || isDownloadingPdf}
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs px-2 py-1"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Journey
                    </Button>
                  </Link>
                  <Link href="/user-stories">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isEditingPlan || isEnhancing || isGeneratingBpmn || isDownloadingPdf}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50 text-xs px-2 py-1"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Stories
                    </Button>
                  </Link>
                  <Button
                    onClick={startEditingPlan}
                    variant="outline"
                    size="sm"
                    disabled={isEditingPlan || isEnhancing || isGeneratingBpmn || isDownloadingPdf}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs px-2 py-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
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
                renderProjectPlan()
              )}

              {/* BPMN Script Section */}
              {showBpmnScript && generatedBpmnXml && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        BPMN 2.0 Script
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={copyBpmnScript}
                          variant="outline"
                          size="sm"
                          className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Script
                        </Button>
                        <Button
                          onClick={downloadBpmnScript}
                          variant="outline"
                          size="sm"
                          className="border-green-300 text-green-600 hover:bg-green-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download JSON
                        </Button>
                        <Button
                          onClick={startEditingBpmn}
                          variant="outline"
                          size="sm"
                          disabled={isEditingBpmn}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Script
                        </Button>
                      </div>
                    </div>
                    
                    {isEditingBpmn ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-purple-700">
                            Edit the BPMN JSON script. Ensure proper JSON syntax before saving.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={saveBpmnEdits}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button
                              onClick={cancelBpmnEditing}
                              variant="outline"
                              size="sm"
                              className="border-gray-300"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                        
                        <Textarea
                          value={editedBpmnScript}
                          onChange={(e) => setEditedBpmnScript(e.target.value)}
                          className="min-h-[400px] font-mono text-sm bg-gray-50 border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                          placeholder="Edit BPMN JSON script..."
                        />
                        
                        <div className="text-sm text-gray-500">
                          {editedBpmnScript.length} characters | Make sure to maintain valid JSON structure
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-purple-700">
                          This is the generated BPMN 2.0 script that powers your visual workflow diagram. You can copy, download, or edit this script.
                        </p>
                        
                        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                          <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                            {generatedBpmnXml}
                          </pre>
                        </div>
                        
                        <div className="text-sm text-gray-500 flex justify-between">
                          <span>BPMN 2.0 XML format with swimlanes</span>
                          <span>{generatedBpmnXml.length} characters total</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/user-journey">
                    <Button
                      variant="outline"
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      User Journey Flows
                    </Button>
                  </Link>
                  
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {currentStep === 'diagram' && (
          <Card className="mb-6">
            <CardContent className="py-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Visual Diagram Created Successfully!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your project plan has been converted into a comprehensive BPMN diagram with process flows and decision points.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/editor">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <Workflow className="h-4 w-4 mr-2" />
                      View & Edit Diagram
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={resetPlanner}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Another Project
                  </Button>
                </div>
              </div>

              {/* BPMN Script Management Section */}
              {generatedBpmnXml && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        BPMN 2.0 Script Management
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => setShowBpmnScript(!showBpmnScript)}
                          variant="outline"
                          size="sm"
                          className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        >
                          {showBpmnScript ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide Script
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              View Script
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={copyBpmnScript}
                          variant="outline"
                          size="sm"
                          className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          onClick={downloadBpmnScript}
                          variant="outline"
                          size="sm"
                          className="border-green-300 text-green-600 hover:bg-green-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-purple-700 mb-4">
                      Access and manage the underlying BPMN 2.0 JSON script that powers your visual workflow diagram. 
                      This script can be imported into any BPMN-compatible editor or system.
                    </p>

                    {showBpmnScript && (
                      <div className="space-y-4">
                        {isEditingBpmn ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-purple-700">
                                Edit the BPMN JSON script. Ensure proper JSON syntax before saving.
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  onClick={saveBpmnEdits}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </Button>
                                <Button
                                  onClick={cancelBpmnEditing}
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                            
                            <Textarea
                              value={editedBpmnScript}
                              onChange={(e) => setEditedBpmnScript(e.target.value)}
                              className="min-h-[400px] font-mono text-sm bg-gray-50 border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                              placeholder="Edit BPMN XML script..."
                            />
                            
                            <div className="text-sm text-gray-500">
                              {editedBpmnScript.length} characters | Make sure to maintain valid BPMN XML structure
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                <span>BPMN 2.0 XML format with swimlanes</span>
                                <span className="ml-4">{generatedBpmnXml.length} characters total</span>
                              </div>
                              <Button
                                onClick={startEditingBpmn}
                                variant="outline"
                                size="sm"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Script
                              </Button>
                            </div>
                            
                            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                              <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                                {generatedBpmnXml}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sitemap XML Generation Section */}
              <div className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
                    <CardTitle className="flex items-center justify-between text-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        Sitemap XML Generator
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Generate a comprehensive XML sitemap for your project including all suggested pages, 
                        content hierarchy, SEO metadata, and navigation structure.
                      </p>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={generateSitemap}
                          disabled={isGeneratingSitemap || !projectInput.trim()}
                          className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                        >
                          {isGeneratingSitemap ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating Sitemap...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Sitemap XML
                            </>
                          )}
                        </Button>

                        {generatedSitemapXml && (
                          <>
                            <Button
                              onClick={copySitemapXml}
                              variant="outline"
                              size="sm"
                              className="border-teal-300 text-teal-600 hover:bg-teal-50"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy XML
                            </Button>
                            <Button
                              onClick={downloadSitemapXml}
                              variant="outline"
                              size="sm"
                              className="border-green-300 text-green-600 hover:bg-green-50"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download XML
                            </Button>
                          </>
                        )}
                      </div>

                      {generatedSitemapXml && (
                        <div className="mt-6">
                          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-teal-800 mb-3 flex items-center gap-2">
                              <Code className="h-5 w-5" />
                              Generated Sitemap XML
                            </h4>
                            <p className="text-sm text-teal-700 mb-4">
                              Complete XML sitemap with all application pages, URLs, priorities, and SEO metadata. 
                              Ready for implementation and search engine submission.
                            </p>
                            
                            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                                {generatedSitemapXml}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { generateProjectPlan, generateBpmnXml, generateCustomSuggestions, generateSitemapXml } from '@/lib/gemini';
import { createAIProjectPlannerAgent, ProjectRequirements, ComprehensiveProjectPlan } from '@/lib/ai-project-planner';
import { 
  createDynamicProjectPlanner, 
  DEFAULT_PROJECT_SECTIONS, 
  ProjectSection, 
  ProjectPlanConfig,
  ProjectPlanResult 
} from '@/lib/dynamic-project-planner';
import { STORAGE_KEYS } from '@/lib/bpmn-utils';
import { hasMarketResearchData } from '@/lib/storage-utils';
import { NavigationBar } from '@/components/navigation-bar';
import { WorkflowProgress } from '@/components/workflow-progress';
import { Link, useLocation } from 'wouter';
import {
  Sparkles,
  FileText,
  ArrowRight,
  ArrowDown,
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
  BookOpen,
  TrendingUp,
} from 'lucide-react';

export default function ProjectPlanner() {
  const [projectInput, setProjectInput] = useState('');
  const [projectPlan, setProjectPlan] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingBpmn, setIsGeneratingBpmn] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'plan' | 'diagram'>('input');
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
  const [progressSteps, setProgressSteps] = useState<{step: string; completed: boolean; current: boolean}[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentProgressStep, setCurrentProgressStep] = useState('');
  const [useAdvancedAgent, setUseAdvancedAgent] = useState(false);
  const [comprehensivePlan, setComprehensivePlan] = useState<ComprehensiveProjectPlan | null>(null);
  const [projectRequirements, setProjectRequirements] = useState<Partial<ProjectRequirements>>({});
  const [isGeneratingComprehensive, setIsGeneratingComprehensive] = useState(false);

  // Dynamic project planner state
  const [projectSections, setProjectSections] = useState<ProjectSection[]>(DEFAULT_PROJECT_SECTIONS);
  const [isGeneratingDynamic, setIsGeneratingDynamic] = useState(false);
  const [dynamicPlanResult, setDynamicPlanResult] = useState<ProjectPlanResult | null>(null);
  const [currentGeneratingSection, setCurrentGeneratingSection] = useState<string>('');
  const [sectionProgress, setSectionProgress] = useState<{current: number, total: number}>({current: 0, total: 0});

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

    // Set current step based on route
    if (location === '/plan') {
      setCurrentStep('plan');
    } else if (location === '/diagram') {
      setCurrentStep('diagram');
    } else {
      setCurrentStep('input');
    }

    // Clear any previous progress states when component loads
    setProgressSteps([]);
    setOverallProgress(0);
    setCurrentProgressStep('');
  }, [location]);

  const initializeProgressSteps = (includeAllSteps = false) => {
    const steps = [
      { step: 'Analyzing project requirements', completed: false, current: false },
      { step: 'Generating enhancement suggestions', completed: false, current: false },
    ];
    
    if (includeAllSteps) {
      steps.push(
        { step: 'Creating comprehensive project plan', completed: false, current: false },
        { step: 'Saving project data', completed: false, current: false },
        { step: 'Finalizing setup', completed: false, current: false }
      );
    }
    
    setProgressSteps(steps);
    setOverallProgress(0);
    setCurrentProgressStep('');
  };

  const updateProgress = (stepIndex: number, isCompleted = false, isCurrent = false) => {
    setProgressSteps(prev => {
      const updated = prev.map((step, index) => ({
        ...step,
        completed: index < stepIndex || (index === stepIndex && isCompleted),
        current: index === stepIndex && isCurrent && !isCompleted
      }));
      
      const completedCount = updated.filter(s => s.completed).length;
      const progressPercentage = (completedCount / updated.length) * 100;
      setOverallProgress(progressPercentage);
      
      const currentStep = updated.find(s => s.current);
      setCurrentProgressStep(currentStep ? currentStep.step : '');
      
      return updated;
    });
  };

  const handleGenerateProjectPlan = async () => {
    if (!projectInput.trim()) {
      setError('Please enter a project description');
      return;
    }

    // Generate plan directly using dynamic multi-call approach
    setIsGeneratingDynamic(true);
    setError('');
    setCurrentGeneratingSection('');
    setSectionProgress({current: 0, total: 0});

    try {
      const planner = createDynamicProjectPlanner();
      
      const config: ProjectPlanConfig = {
        sections: projectSections,
        projectDescription: projectInput,
        additionalContext: undefined
      };

      const result = await planner.generateProjectPlan(
        config,
        (sectionTitle: string, current: number, total: number) => {
          setCurrentGeneratingSection(sectionTitle);
          setSectionProgress({current, total});
          const progressPercentage = (current / total) * 100;
          setOverallProgress(progressPercentage);
        }
      );

      setDynamicPlanResult(result);
      setProjectPlan(result.htmlContent);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, result.htmlContent);
      localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, projectInput);
      localStorage.setItem('dynamic_plan_result', JSON.stringify(result));
      localStorage.setItem('project_sections_config', JSON.stringify(projectSections));
      
      setCurrentStep('plan');
      setLocation('/plan');
    } catch (err) {
      console.error('Dynamic plan generation error:', err);
      setError('Failed to generate project plan. Please try again.');
    } finally {
      setIsGeneratingDynamic(false);
      setOverallProgress(0);
      setCurrentProgressStep('');
      setCurrentGeneratingSection('');
      setSectionProgress({current: 0, total: 0});
    }
  };

  const handleGenerateWithSuggestions = async () => {
    if (useAdvancedAgent) {
      await handleGenerateComprehensivePlan();
      return;
    }

    initializeProgressSteps(true);
    setIsGeneratingPlan(true);
    setError('');
    setShowSuggestions(false);

    try {
      updateProgress(0, false, true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateProgress(1, false, true);
      await new Promise(resolve => setTimeout(resolve, 300));
      updateProgress(1, true);
      
      updateProgress(2, false, true);
      let enhancedInput = projectInput;
      
      if (selectedSuggestions.length > 0) {
        enhancedInput = `${projectInput}

Additional Requirements:
${selectedSuggestions.map(suggestion => `- ${suggestion}`).join('\n')}

Please ensure the project plan addresses all the selected requirements above and includes comprehensive architecture diagrams, user flows, and technical specifications.`;
      }

      const plan = await generateProjectPlan(enhancedInput);
      setProjectPlan(plan);
      updateProgress(2, true);
      
      updateProgress(3, false, true);
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, plan);
      localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, projectInput);
      await new Promise(resolve => setTimeout(resolve, 400));
      updateProgress(3, true);
      
      updateProgress(4, false, true);
      await new Promise(resolve => setTimeout(resolve, 300));
      updateProgress(4, true);
      
      setOverallProgress(100);
      setCurrentProgressStep('');
      
      // Small delay before redirect for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep('plan');
      setLocation('/plan');
    } catch (err) {
      console.error('Project plan generation error:', err);
      setError('Failed to generate project plan. Please try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateComprehensivePlan = async () => {
    setIsGeneratingComprehensive(true);
    setError('');
    setShowSuggestions(false);

    try {
      const agent = createAIProjectPlannerAgent();
      
      let enhancedInput = projectInput;
      if (selectedSuggestions.length > 0) {
        enhancedInput = `${projectInput}

Additional Requirements:
${selectedSuggestions.map(suggestion => `- ${suggestion}`).join('\n')}`;
      }

      const plan = await agent.generateComprehensiveProjectPlan(
        enhancedInput,
        projectRequirements,
        (step: string, progress: number) => {
          setCurrentProgressStep(step);
          setOverallProgress(progress);
        }
      );

      setComprehensivePlan(plan);
      
      // Convert comprehensive plan to HTML format for display
      const htmlPlan = formatComprehensivePlanAsHtml(plan);
      setProjectPlan(htmlPlan);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, htmlPlan);
      localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, projectInput);
      localStorage.setItem('comprehensive_plan', JSON.stringify(plan));
      
      setCurrentStep('plan');
      setLocation('/plan');
    } catch (err) {
      console.error('Comprehensive plan generation error:', err);
      setError('Failed to generate comprehensive project plan. Please try again.');
    } finally {
      setIsGeneratingComprehensive(false);
      setOverallProgress(0);
      setCurrentProgressStep('');
    }
  };

  const handleGenerateDynamicPlan = async () => {
    setIsGeneratingDynamic(true);
    setError('');
    setShowSuggestions(false);
    setCurrentGeneratingSection('');
    setSectionProgress({current: 0, total: 0});

    try {
      const planner = createDynamicProjectPlanner();
      
      let enhancedInput = projectInput;
      if (selectedSuggestions.length > 0) {
        enhancedInput = `${projectInput}

Additional Requirements:
${selectedSuggestions.map(suggestion => `- ${suggestion}`).join('\n')}`;
      }

      const config: ProjectPlanConfig = {
        sections: projectSections,
        projectDescription: enhancedInput,
        additionalContext: selectedSuggestions.length > 0 ? 
          `Focus on: ${selectedSuggestions.join(', ')}` : undefined
      };

      const result = await planner.generateProjectPlan(
        config,
        (sectionTitle: string, current: number, total: number) => {
          setCurrentGeneratingSection(sectionTitle);
          setSectionProgress({current, total});
          const progressPercentage = (current / total) * 100;
          setOverallProgress(progressPercentage);
        }
      );

      setDynamicPlanResult(result);
      setProjectPlan(result.htmlContent);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, result.htmlContent);
      localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, projectInput);
      localStorage.setItem('dynamic_plan_result', JSON.stringify(result));
      localStorage.setItem('project_sections_config', JSON.stringify(projectSections));
      
      setCurrentStep('plan');
      setLocation('/plan');
    } catch (err) {
      console.error('Dynamic plan generation error:', err);
      setError('Failed to generate dynamic project plan. Please try again.');
    } finally {
      setIsGeneratingDynamic(false);
      setOverallProgress(0);
      setCurrentProgressStep('');
      setCurrentGeneratingSection('');
      setSectionProgress({current: 0, total: 0});
    }
  };

  const formatComprehensivePlanAsHtml = (plan: ComprehensiveProjectPlan): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Project Plan</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 30px; }
        h2 { color: #1e40af; margin-top: 40px; margin-bottom: 20px; padding-left: 10px; border-left: 4px solid #3b82f6; }
        h3 { color: #1e3a8a; margin-top: 25px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .summary-card { background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .summary-card h4 { margin: 0 0 10px 0; color: #1e40af; }
        .summary-card p { margin: 0; font-weight: 600; color: #475569; }
        .phase { background: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0; }
        .priority-critical { border-left: 4px solid #dc2626; }
        .priority-high { border-left: 4px solid #ea580c; }
        .priority-medium { border-left: 4px solid #ca8a04; }
        .priority-low { border-left: 4px solid #16a34a; }
        .critical-path { background: #fef2f2; border: 2px solid #fca5a5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .hours-estimate { background: #eff6ff; padding: 10px; border-radius: 6px; margin: 10px 0; font-weight: 600; color: #1d4ed8; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .section-content { margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Comprehensive Project Plan</h1>
        
        <div class="summary-grid">
            <div class="summary-card">
                <h4>Total Estimated Hours</h4>
                <p>${plan.totalEstimatedHours.toLocaleString()} hours</p>
            </div>
            <div class="summary-card">
                <h4>Estimated Cost</h4>
                <p>$${plan.totalEstimatedCost.toLocaleString()}</p>
            </div>
            <div class="summary-card">
                <h4>Development Phases</h4>
                <p>${plan.developmentPhases.length} phases</p>
            </div>
            <div class="summary-card">
                <h4>Critical Path Items</h4>
                <p>${plan.criticalPath.length} items</p>
            </div>
        </div>

        <div class="critical-path">
            <h3>🎯 Critical Path</h3>
            <ul>
                ${plan.criticalPath.map(item => `<li><strong>${item}</strong></li>`).join('')}
            </ul>
        </div>

        <div class="section-content priority-${plan.projectOverview.priority}">
            <h2>${plan.projectOverview.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.projectOverview.estimatedHours}</div>
            ${plan.projectOverview.content}
        </div>

        <div class="section-content priority-${plan.technicalArchitecture.priority}">
            <h2>${plan.technicalArchitecture.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.technicalArchitecture.estimatedHours}</div>
            ${plan.technicalArchitecture.content}
        </div>

        <h2>Development Phases</h2>
        ${plan.developmentPhases.map(phase => `
            <div class="phase priority-${phase.priority}">
                <h3>${phase.title}</h3>
                <div class="hours-estimate">Estimated Hours: ${phase.estimatedHours}</div>
                ${phase.content}
            </div>
        `).join('')}

        <div class="section-content priority-${plan.riskManagement.priority}">
            <h2>${plan.riskManagement.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.riskManagement.estimatedHours}</div>
            ${plan.riskManagement.content}
        </div>

        <div class="section-content priority-${plan.qualityAssurance.priority}">
            <h2>${plan.qualityAssurance.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.qualityAssurance.estimatedHours}</div>
            ${plan.qualityAssurance.content}
        </div>

        <div class="section-content priority-${plan.deployment.priority}">
            <h2>${plan.deployment.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.deployment.estimatedHours}</div>
            ${plan.deployment.content}
        </div>

        <div class="section-content priority-${plan.maintenance.priority}">
            <h2>${plan.maintenance.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.maintenance.estimatedHours}</div>
            ${plan.maintenance.content}
        </div>

        <div class="section-content priority-${plan.budgetBreakdown.priority}">
            <h2>${plan.budgetBreakdown.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.budgetBreakdown.estimatedHours}</div>
            ${plan.budgetBreakdown.content}
        </div>

        <div class="section-content priority-${plan.timelineDetails.priority}">
            <h2>${plan.timelineDetails.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.timelineDetails.estimatedHours}</div>
            ${plan.timelineDetails.content}
        </div>

        <div class="section-content priority-${plan.teamStructure.priority}">
            <h2>${plan.teamStructure.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.teamStructure.estimatedHours}</div>
            ${plan.teamStructure.content}
        </div>

        <div class="section-content priority-${plan.stakeholderMatrix.priority}">
            <h2>${plan.stakeholderMatrix.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.stakeholderMatrix.estimatedHours}</div>
            ${plan.stakeholderMatrix.content}
        </div>

        <div class="section-content priority-${plan.complianceRequirements.priority}">
            <h2>${plan.complianceRequirements.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.complianceRequirements.estimatedHours}</div>
            ${plan.complianceRequirements.content}
        </div>

        <div class="section-content priority-${plan.scalabilityPlan.priority}">
            <h2>${plan.scalabilityPlan.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.scalabilityPlan.estimatedHours}</div>
            ${plan.scalabilityPlan.content}
        </div>

        <div class="section-content priority-${plan.securityFramework.priority}">
            <h2>${plan.securityFramework.title}</h2>
            <div class="hours-estimate">Estimated Hours: ${plan.securityFramework.estimatedHours}</div>
            ${plan.securityFramework.content}
        </div>
    </div>
</body>
</html>`;
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
    if (!projectPlan) {
      setError('No project plan available to download');
      return;
    }

    setIsDownloadingPdf(true);
    setError('');
    
    try {
      // Import libraries dynamically
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
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
        // For HTML content, create a temporary iframe to properly render it
        const tempIframe = document.createElement('iframe');
        tempIframe.style.position = 'absolute';
        tempIframe.style.top = '-9999px';
        tempIframe.style.left = '-9999px';
        tempIframe.style.width = '1200px';
        tempIframe.style.height = '8000px';
        tempIframe.style.border = 'none';
        tempIframe.style.backgroundColor = '#ffffff';
        
        document.body.appendChild(tempIframe);

        // Write content to iframe
        const iframeDoc = tempIframe.contentDocument || tempIframe.contentWindow?.document;
        if (!iframeDoc) {
          throw new Error('Cannot access iframe document');
        }

        iframeDoc.open();
        iframeDoc.write(cleanedContent);
        iframeDoc.close();

        // Wait for content to render
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the actual content height
        const body = iframeDoc.body;
        const html = iframeDoc.documentElement;
        const contentHeight = Math.max(
          body?.scrollHeight || 0,
          body?.offsetHeight || 0,
          html?.scrollHeight || 0,
          html?.offsetHeight || 0
        );

        // Adjust iframe height to content
        tempIframe.style.height = `${contentHeight + 100}px`;

        // Wait for final rendering
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate canvas from iframe content
        const canvas = await html2canvas(iframeDoc.body, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1200,
          height: contentHeight
        });

        // Remove temporary iframe
        document.body.removeChild(tempIframe);

        // Create PDF with proper page handling
        const imgData = canvas.toDataURL('image/png', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 190; // A4 width in mm with margins
        const pageHeight = 277; // A4 height in mm with margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Generate filename
        const projectName = projectInput.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `project_plan_${projectName}_${timestamp}.pdf`;

        // Download PDF
        pdf.save(filename);

      } else {
        // For non-HTML content, create a styled container
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '1200px';
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.padding = '40px';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        tempContainer.style.fontSize = '14px';
        tempContainer.style.lineHeight = '1.6';
        tempContainer.style.color = '#333333';

        // Convert text content to HTML with proper formatting
        const formattedContent = cleanedContent
          .split('\n')
          .map(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return '<br>';
            
            // Format headers
            if (trimmedLine.startsWith('#')) {
              const level = (trimmedLine.match(/^#+/) || [''])[0].length;
              const text = trimmedLine.replace(/^#+\s*/, '');
              return `<h${Math.min(level, 6)} style="color: #2563eb; margin: 1.5em 0 0.5em 0;">${text}</h${Math.min(level, 6)}>`;
            }
            
            // Format bullet points
            if (trimmedLine.match(/^[\*\-]\s+/)) {
              const text = trimmedLine.replace(/^[\*\-]\s+/, '');
              return `<div style="margin: 0.5em 0; padding-left: 20px;">• ${text}</div>`;
            }
            
            // Format numbered lists
            if (trimmedLine.match(/^\d+\./)) {
              return `<div style="margin: 0.5em 0; padding-left: 20px;">${trimmedLine}</div>`;
            }
            
            // Regular paragraphs
            return `<p style="margin: 1em 0;">${trimmedLine}</p>`;
          })
          .join('');

        tempContainer.innerHTML = formattedContent;
        document.body.appendChild(tempContainer);

        // Generate canvas from the content
        const canvas = await html2canvas(tempContainer, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1200,
          height: tempContainer.scrollHeight
        });

        // Remove temporary container
        document.body.removeChild(tempContainer);

        // Create PDF
        const imgData = canvas.toDataURL('image/png', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 190; // A4 width in mm with margins
        const pageHeight = 277; // A4 height in mm with margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Generate filename
        const projectName = projectInput.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `project_plan_${projectName}_${timestamp}.pdf`;

        // Download PDF
        pdf.save(filename);
      }
      
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
      // Create a blob URL for the iframe content
      const blob = new Blob([cleanedContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      return (
        <div className="w-full">
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Project Plan Preview</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <iframe
              src={blobUrl}
              className="project-plan-content w-full min-h-[800px]"
              style={{
                border: 'none',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                height: '1200px' // Start with larger default height
              }}
              title="Project Plan Content"
              sandbox="allow-same-origin allow-scripts"
              onLoad={(e) => {
                const iframe = e.target as HTMLIFrameElement;
                
                const adjustHeight = () => {
                  try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                      const body = iframeDoc.body;
                      const html = iframeDoc.documentElement;
                      
                      // Multiple attempts to get accurate height
                      const measurements = [
                        body?.scrollHeight || 0,
                        body?.offsetHeight || 0,
                        html?.scrollHeight || 0,
                        html?.offsetHeight || 0,
                        html?.clientHeight || 0
                      ];
                      
                      // Get the maximum measurement
                      const contentHeight = Math.max(...measurements);
                      
                      // Calculate final height with generous padding
                      const finalHeight = Math.max(contentHeight + 100, 800);
                      
                      // Apply the height
                      iframe.style.height = `${finalHeight}px`;
                      
                      // Ensure content doesn't get cut off
                      if (body) {
                        body.style.overflow = 'visible';
                        body.style.margin = '0';
                        body.style.padding = '20px';
                        body.style.minHeight = 'auto';
                      }
                      if (html) {
                        html.style.overflow = 'visible';
                        html.style.minHeight = 'auto';
                      }
                      
                      console.log('Iframe height adjusted to:', finalHeight, 'Content measurements:', measurements);
                    }
                  } catch (error) {
                    console.error('Height adjustment failed:', error);
                    // More generous fallback height
                    iframe.style.height = '1500px';
                  }
                };
                
                // Multiple timing attempts for height adjustment
                setTimeout(adjustHeight, 100);
                setTimeout(adjustHeight, 500);
                setTimeout(adjustHeight, 1000);
                
                // Clean up blob URL after iframe loads
                setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
              }}
            />
          </div>
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        

        <WorkflowProgress currentStep={currentStep} />

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

                {/* AI Agent Selection */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-purple-800 mb-1">Plan Generation Method</h4>
                      <p className="text-sm text-purple-600">Choose between standard, comprehensive, or dynamic section-based planning</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="advanced-agent"
                          checked={useAdvancedAgent}
                          onCheckedChange={(checked) => setUseAdvancedAgent(checked as boolean)}
                        />
                        <label htmlFor="advanced-agent" className="text-sm font-medium text-purple-700 cursor-pointer">
                          Advanced AI Agent
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {useAdvancedAgent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-purple-200">
                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">Project Scope</label>
                        <select 
                          className="w-full text-xs p-2 border border-purple-200 rounded"
                          value={projectRequirements.scope || 'medium'}
                          onChange={(e) => setProjectRequirements(prev => ({...prev, scope: e.target.value as any}))}
                        >
                          <option value="small">Small (1-3 months)</option>
                          <option value="medium">Medium (3-6 months)</option>
                          <option value="large">Large (6-12 months)</option>
                          <option value="enterprise">Enterprise (12+ months)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">Technical Complexity</label>
                        <select 
                          className="w-full text-xs p-2 border border-purple-200 rounded"
                          value={projectRequirements.technicalComplexity || 'medium'}
                          onChange={(e) => setProjectRequirements(prev => ({...prev, technicalComplexity: e.target.value as any}))}
                        >
                          <option value="low">Low - Basic CRUD</option>
                          <option value="medium">Medium - Standard Features</option>
                          <option value="high">High - Advanced Features</option>
                          <option value="expert">Expert - Cutting Edge</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">Industry</label>
                        <select 
                          className="w-full text-xs p-2 border border-purple-200 rounded"
                          value={projectRequirements.industry || 'technology'}
                          onChange={(e) => setProjectRequirements(prev => ({...prev, industry: e.target.value}))}
                        >
                          <option value="technology">Technology</option>
                          <option value="healthcare">Healthcare</option>
                          <option value="finance">Finance</option>
                          <option value="education">Education</option>
                          <option value="retail">Retail</option>
                          <option value="manufacturing">Manufacturing</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">Team Size</label>
                        <select 
                          className="w-full text-xs p-2 border border-purple-200 rounded"
                          value={projectRequirements.teamSize || '5-8 developers'}
                          onChange={(e) => setProjectRequirements(prev => ({...prev, teamSize: e.target.value}))}
                        >
                          <option value="1-2 developers">1-2 developers</option>
                          <option value="3-5 developers">3-5 developers</option>
                          <option value="5-8 developers">5-8 developers</option>
                          <option value="8-15 developers">8-15 developers</option>
                          <option value="15+ developers">15+ developers</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 p-3 bg-white/60 rounded border border-purple-100">
                    <div className="text-xs text-purple-700">
                      {useAdvancedAgent ? (
                        <div>
                          <strong>Advanced AI Agent:</strong> Generates comprehensive 18-section project plan including technical architecture, risk management, compliance, scalability, security framework, detailed timelines, cost estimates, and critical path analysis.
                        </div>
                      ) : (
                        <div>
                          <strong>Standard Generation:</strong> Creates focused project plan with core requirements, basic timeline, and development phases.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar for Plan Generation */}
                {(isGeneratingPlan || isGeneratingComprehensive) && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-blue-800">
                        {useAdvancedAgent ? 'Generating Comprehensive Project Plan' : 'Creating Project Plan'}
                      </h4>
                      <span className="text-sm text-blue-600 font-medium">{Math.round(overallProgress)}%</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-3 mb-4 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
                        style={{ width: `${overallProgress}%` }}
                      ></div>
                    </div>
                    {currentProgressStep && (
                      <div className="flex items-center text-sm text-blue-700 mb-3 font-medium">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {currentProgressStep}
                      </div>
                    )}
                    
                    {useAdvancedAgent && isGeneratingComprehensive && (
                      <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded mb-3">
                        Advanced AI Agent is generating 18 comprehensive sections including technical architecture, 
                        risk management, compliance requirements, scalability planning, and detailed cost analysis.
                      </div>
                    )}
                    
                    {progressSteps.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {progressSteps.map((step, index) => (
                          <div key={index} className="flex items-center text-sm bg-white/40 rounded-md p-2">
                            {step.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            ) : step.current ? (
                              <Loader2 className="h-4 w-4 text-blue-500 mr-2 animate-spin flex-shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-300 mr-2 flex-shrink-0"></div>
                            )}
                            <span className={`${step.completed ? 'text-green-700 font-medium' : step.current ? 'text-blue-700 font-medium' : 'text-gray-500'} truncate`}>
                              {step.step}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Dynamic Section Configuration */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-green-800 mb-3">Dynamic Project Plan Sections</h4>
                  <p className="text-sm text-green-600 mb-4">Configure which sections to include in your project plan. Each section will be generated with individual API calls for maximum quality.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {projectSections.map((section) => (
                      <div key={section.id} className="flex items-center space-x-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                        <Checkbox
                          id={section.id}
                          checked={section.enabled}
                          onCheckedChange={(checked) => {
                            setProjectSections(prev => prev.map(s => 
                              s.id === section.id ? { ...s, enabled: checked as boolean } : s
                            ));
                          }}
                          className="h-4 w-4 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <div className="flex-1">
                          <label htmlFor={section.id} className="text-sm font-medium text-green-800 cursor-pointer block">
                            {section.title}
                          </label>
                          <p className="text-xs text-green-600 mt-1">{section.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{section.estimatedHours}h</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              section.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              section.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              section.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {section.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-white/60 rounded border border-green-100 p-3">
                    <div className="text-xs text-green-700">
                      <strong>Selected:</strong> {projectSections.filter(s => s.enabled).length} sections 
                      <span className="mx-2">•</span>
                      <strong>Estimated:</strong> {projectSections.filter(s => s.enabled).reduce((total, s) => total + (s.estimatedHours || 0), 0)} hours
                    </div>
                  </div>
                </div>

                {/* Progress Bar for Dynamic Plan Generation */}
                {isGeneratingDynamic && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-green-800">Generating Dynamic Project Plan</h4>
                      <span className="text-sm text-green-600 font-medium">{Math.round(overallProgress)}%</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-3 mb-4 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
                        style={{ width: `${overallProgress}%` }}
                      ></div>
                    </div>
                    {currentGeneratingSection && (
                      <div className="flex items-center text-sm text-green-700 mb-3 font-medium">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating: {currentGeneratingSection} ({sectionProgress.current}/{sectionProgress.total})
                      </div>
                    )}
                    
                    <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                      Making individual API calls for each selected section to ensure maximum quality and detail.
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowSuggestions(false)}
                    className="border-gray-300 hover:bg-gray-50"
                    disabled={isGeneratingPlan || isGeneratingComprehensive || isGeneratingDynamic}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateDynamicPlan}
                    disabled={isGeneratingPlan || isGeneratingComprehensive || isGeneratingDynamic || projectSections.filter(s => s.enabled).length === 0}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {isGeneratingDynamic ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Sections...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Dynamic Plan ({projectSections.filter(s => s.enabled).length} sections)
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGenerateWithSuggestions}
                    disabled={isGeneratingPlan || isGeneratingComprehensive || isGeneratingDynamic}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isGeneratingPlan || isGeneratingComprehensive ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {useAdvancedAgent ? 'Generating Comprehensive Plan...' : 'Generating Plan...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {useAdvancedAgent ? 'Generate Comprehensive Plan' : 'Generate Enhanced Plan'}
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
              
              {/* Progress Bar for Dynamic Generation */}
              {isGeneratingDynamic && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-green-800">Generating Project Plan - Individual API Calls</h4>
                    <span className="text-sm text-green-600 font-medium">{Math.round(overallProgress)}%</span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-3 mb-4 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
                      style={{ width: `${overallProgress}%` }}
                    ></div>
                  </div>
                  {currentGeneratingSection && (
                    <div className="flex items-center text-sm text-green-700 mb-3 font-medium">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Currently generating: {currentGeneratingSection} ({sectionProgress.current}/{sectionProgress.total})
                    </div>
                  )}
                  
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                    Each section is generated with a separate API call for maximum quality and detail. 
                    Total sections: {projectSections.filter(s => s.enabled).length}
                  </div>
                </div>
              )}

              {/* Progress Bar for Initial Generation */}
              {isGeneratingSuggestions && progressSteps.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-800 text-sm">Analyzing Project Requirements</h4>
                    <span className="text-xs text-blue-600">{Math.round(overallProgress)}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2 mb-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${overallProgress}%` }}
                    ></div>
                  </div>
                  {currentProgressStep && (
                    <div className="flex items-center text-xs text-blue-700">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      {currentProgressStep}
                    </div>
                  )}
                  <div className="mt-2 space-y-1">
                    {progressSteps.map((step, index) => (
                      <div key={index} className="flex items-center text-xs">
                        {step.completed ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        ) : step.current ? (
                          <Loader2 className="h-3 w-3 text-blue-500 mr-2 animate-spin" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300 mr-2"></div>
                        )}
                        <span className={step.completed ? 'text-green-700' : step.current ? 'text-blue-700' : 'text-gray-500'}>
                          {step.step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <div className="text-xs text-gray-400">
                  {projectInput.length}/1000 characters
                </div>
                <Button
                  onClick={handleGenerateProjectPlan}
                  disabled={!projectInput.trim() || isGeneratingDynamic || isGeneratingPlan || isGeneratingSuggestions}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-sm"
                >
                  {isGeneratingDynamic ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Generating {currentGeneratingSection ? `${currentGeneratingSection}...` : 'Sections...'}
                    </>
                  ) : isGeneratingSuggestions ? (
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
                      Generate Plan ({projectSections.filter(s => s.enabled).length} sections)
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
                  <Link href="/market-research">
                    <Button
                      variant="outline"
                      className={`${hasMarketResearchData() 
                        ? 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
                      } text-white border-0 shadow-lg relative`}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Market Research
                      {hasMarketResearchData() && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                      )}
                    </Button>
                  </Link>
                  
                  <Link href="/user-journey">
                    <Button
                      variant="outline"
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      User Journey Flows
                    </Button>
                  </Link>
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
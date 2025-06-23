import React, { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateProjectPlan, generateBpmnXml, generateCustomSuggestions, generateSitemapXml } from '@/lib/gemini';
import { createAIProjectPlannerAgent, ProjectRequirements, ComprehensiveProjectPlan } from '@/lib/ai-project-planner';
import { 
  createDynamicProjectPlanner, 
  DEFAULT_PROJECT_SECTIONS, 
  ProjectSection, 
  ProjectPlanConfig,
  ProjectPlanResult 
} from '@/lib/dynamic-project-planner';
import { 
  createEnhancedProjectPlanner,
  ProjectPlanSection,
  ProjectPlanProgress,
  EnhancedProjectPlanConfig
} from '@/lib/enhanced-project-planner';
import { EnhancedProgressTracker } from '@/components/enhanced-progress-tracker';
import { ProjectSectionsSettings, loadProjectSectionsSettings, ProjectSection as SettingsProjectSection } from '@/components/project-sections-settings';
import { SectionFlowViewer } from '@/components/section-flow-viewer';
import { FlowDiagramViewer } from '@/components/flow-diagram-viewer';
import { createAIFlowDiagramGenerator, FlowDiagramData } from '@/lib/ai-flow-diagram-generator';
import { STORAGE_KEYS } from '@/lib/bpmn-utils';
import { hasMarketResearchData } from '@/lib/storage-utils';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function to get enhanced plan sections from localStorage
const getEnhancedPlanSections = (): ProjectPlanSection[] => {
  const savedEnhancedSections = localStorage.getItem('enhanced_plan_sections');
  if (savedEnhancedSections) {
    try {
      const parsed = JSON.parse(savedEnhancedSections);
      console.log('✅ Successfully loaded enhanced plan sections from localStorage:', parsed.length, 'sections');
      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse enhanced plan sections:', error);
    }
  } else {
    console.log('ℹ️ No enhanced plan sections found in localStorage');
  }
  return [];
};

// Helper function to save enhanced plan sections to localStorage
const saveEnhancedPlanSections = (sections: ProjectPlanSection[]) => {
  try {
    const jsonString = JSON.stringify(sections);
    localStorage.setItem('enhanced_plan_sections', jsonString);
    console.log('✅ Successfully saved enhanced plan sections to localStorage:', sections.length, 'sections');
    
    // Verify the save worked
    const verification = localStorage.getItem('enhanced_plan_sections');
    if (verification) {
      console.log('✅ Verification: Data exists in localStorage');
    } else {
      console.error('❌ Verification failed: No data found in localStorage');
    }
  } catch (error) {
    console.error('❌ Failed to save enhanced plan sections:', error);
  }
};

// Helper function to get plan content for external use (BPMN, etc.)
const getPlanContentForExternalUse = (projectPlan: string): string => {
  const savedSections = getEnhancedPlanSections();
  if (savedSections.length > 0) {
    return savedSections.map(section => 
      `${section.title}:\n${section.content.replace(/<[^>]*>/g, ' ').trim()}`
    ).join('\n\n');
  }
  return projectPlan;
};
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
  Target,
  Settings,
  Shield,
  Zap,
  Clock,
  Database,
  Globe,
  Briefcase,
  BarChart3,
  Layout,
  Rocket,
  Palette,
  TestTube,
  Cloud,
  AlertCircle,
  Wand2,
  RefreshCw,
  Trash2
} from 'lucide-react';

// Helper function to get icon and description for section types
const getSectionIconAndDescription = (title: string) => {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('executive') || titleLower.includes('summary')) {
    return { icon: Target, description: 'Overview & Goals' };
  }
  if (titleLower.includes('technical') || titleLower.includes('architecture')) {
    return { icon: Settings, description: 'Tech Stack & Design' };
  }
  if (titleLower.includes('feature') || titleLower.includes('specification')) {
    return { icon: Zap, description: 'Features & Requirements' };
  }
  if (titleLower.includes('development') || titleLower.includes('methodology')) {
    return { icon: Code, description: 'Process & Timeline' };
  }
  if (titleLower.includes('user') || titleLower.includes('interface') || titleLower.includes('experience')) {
    return { icon: Layout, description: 'Design & UX' };
  }
  if (titleLower.includes('quality') || titleLower.includes('testing')) {
    return { icon: TestTube, description: 'QA & Testing' };
  }
  if (titleLower.includes('deployment') || titleLower.includes('devops')) {
    return { icon: Cloud, description: 'Launch & Operations' };
  }
  if (titleLower.includes('risk') || titleLower.includes('management')) {
    return { icon: Shield, description: 'Risk & Mitigation' };
  }
  if (titleLower.includes('stakeholder')) {
    return { icon: Users, description: 'People & Roles' };
  }
  if (titleLower.includes('post-launch') || titleLower.includes('strategy')) {
    return { icon: Rocket, description: 'Growth & Future' };
  }
  if (titleLower.includes('budget') || titleLower.includes('cost')) {
    return { icon: BarChart3, description: 'Financial Planning' };
  }
  if (titleLower.includes('timeline') || titleLower.includes('schedule')) {
    return { icon: Clock, description: 'Time Management' };
  }
  if (titleLower.includes('security')) {
    return { icon: Shield, description: 'Safety & Protection' };
  }
  if (titleLower.includes('database') || titleLower.includes('data')) {
    return { icon: Database, description: 'Data & Storage' };
  }
  
  // Default fallback
  return { icon: FileText, description: 'Project Content' };
};

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
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editedSectionContent, setEditedSectionContent] = useState('');
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
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

  // Enhanced 10-section planner state
  const [enhancedSections, setEnhancedSections] = useState<ProjectPlanSection[]>([]);
  const [isGeneratingEnhanced, setIsGeneratingEnhanced] = useState(false);
  const [enhancedProgress, setEnhancedProgress] = useState<ProjectPlanProgress>({
    currentSection: 0,
    totalSections: 10,
    currentSectionTitle: '',
    overallProgress: 0,
    isGenerating: false
  });

  // Custom prompt regeneration state
  const [customPromptSectionId, setCustomPromptSectionId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [useEnhancedPlanner, setUseEnhancedPlanner] = useState(true);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);

  // Flow diagram generation state
  const [generatedFlowDiagram, setGeneratedFlowDiagram] = useState<{title: string, description: string, flowData: FlowDiagramData} | null>(null);
  const [isGeneratingFlowDiagram, setIsGeneratingFlowDiagram] = useState(false);
  const [showFlowDiagramEditor, setShowFlowDiagramEditor] = useState(false);

  // Stakeholder analysis state - simplified to just names
  const [stakeholderNames, setStakeholderNames] = useState<string[]>([]);
  const [isGeneratingStakeholders, setIsGeneratingStakeholders] = useState(false);
  const [newStakeholderName, setNewStakeholderName] = useState('');
  const [editingStakeholderIndex, setEditingStakeholderIndex] = useState<number | null>(null);
  const [editingStakeholderName, setEditingStakeholderName] = useState('');

  // Project sections settings state
  const [projectSectionsSettings, setProjectSectionsSettings] = useState<SettingsProjectSection[]>([]);

  const [location, setLocation] = useLocation();

  // Load data from localStorage when component mounts or route changes
  useEffect(() => {
    const savedProjectDescription = localStorage.getItem(STORAGE_KEYS.PROJECT_DESCRIPTION);
    const savedProjectPlan = localStorage.getItem(STORAGE_KEYS.PROJECT_PLAN);
    const savedDiagram = localStorage.getItem(STORAGE_KEYS.CURRENT_DIAGRAM);
    const savedEnhancedSections = localStorage.getItem('enhanced_plan_sections');

    if (savedProjectDescription) {
      setProjectInput(savedProjectDescription);
    }
    if (savedProjectPlan) {
      setProjectPlan(savedProjectPlan);
    }
    if (savedDiagram) {
      setGeneratedBpmnXml(savedDiagram);
    }

    // Load enhanced plan sections if available
    const savedSections = getEnhancedPlanSections();
    if (savedSections.length > 0) {
      console.log('🔄 Setting enhanced sections from localStorage:', savedSections.length, 'sections');
      setEnhancedSections(savedSections);
    } else {
      console.log('🔄 No saved sections found, keeping empty state');
    }

    // Load project sections settings
    const sectionsSettings = loadProjectSectionsSettings();
    setProjectSectionsSettings(sectionsSettings);

    // Load saved stakeholder names if available
    const savedStakeholderNames = localStorage.getItem('stakeholder-names');
    if (savedStakeholderNames) {
      try {
        const parsedNames = JSON.parse(savedStakeholderNames);
        setStakeholderNames(parsedNames);
      } catch (error) {
        console.error('Failed to parse saved stakeholder names:', error);
      }
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

    // Always navigate to plan page first
    setCurrentStep('plan');
    setLocation('/plan');

    // Use enhanced planner by default for individual section generation
    await handleGenerateEnhancedPlan();
    return;

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

  const handleGenerateEnhancedPlan = async () => {
    if (!projectInput.trim()) {
      setError('Please enter a project description');
      return;
    }

    setIsGeneratingEnhanced(true);
    setError('');
    setShowSuggestions(false);
    
    try {
      const planner = createEnhancedProjectPlanner();
      
      // Use enabled sections from settings
      const enabledSections = projectSectionsSettings.filter(s => s.enabled).sort((a, b) => a.order - b.order);
      
      // Initialize sections with project plan section format
      const initialSections = enabledSections.map(section => ({
        id: section.id,
        title: section.title,
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: section.order
      }));
      
      setEnhancedSections(initialSections);
      
      const config: EnhancedProjectPlanConfig = {
        projectDescription: projectInput,
        additionalRequirements: selectedSuggestions.length > 0 ? selectedSuggestions : undefined
      };

      // Generate sections one by one with progress tracking
      const generatedSections: ProjectPlanSection[] = [];
      const totalSections = enabledSections.length;

      for (let i = 0; i < enabledSections.length; i++) {
        const section = enabledSections[i];
        
        // Update progress - starting generation
        setEnhancedProgress({
          currentSection: i + 1,
          totalSections,
          currentSectionTitle: section.title,
          overallProgress: (i / totalSections) * 100,
          isGenerating: true
        });

        // Update sections state to show current generating
        setEnhancedSections(current => current.map((s, index) => ({
          ...s,
          isGenerating: index === i,
          isCompleted: index < i
        })));

        try {
          // Generate content for this section using configured AI prompts
          console.log(`Generating section ${i + 1}/${totalSections}: ${section.title}`);
          const content = await planner.generateSection(section.title, config, {
            id: section.id,
            aiPrompts: section.aiPrompts
          });
          
          const generatedSection: ProjectPlanSection = {
            id: section.id,
            title: section.title,
            content,
            isGenerating: false,
            isCompleted: true,
            order: section.order
          };
          
          generatedSections.push(generatedSection);
          
          // Update sections with generated content
          setEnhancedSections(current => current.map((s, index) => 
            index === i 
              ? { ...s, content, isGenerating: false, isCompleted: true }
              : s
          ));
          
          // Update progress
          setEnhancedProgress({
            currentSection: i + 1,
            totalSections,
            currentSectionTitle: section.title,
            overallProgress: ((i + 1) / totalSections) * 100,
            isGenerating: i < totalSections - 1
          });
          
        } catch (error) {
          console.error(`Failed to generate section ${section.title}:`, error);
          generatedSections.push({
            id: section.id,
            title: section.title,
            content: `<div class="error-section"><h3>Error Generating ${section.title}</h3><p>Failed to generate content for this section. Please try again.</p></div>`,
            isGenerating: false,
            isCompleted: false,
            order: section.order
          });
        }

        // Delay between sections to prevent rate limiting
        if (i < totalSections - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // Generate combined HTML report
      const htmlReport = planner.generateHtmlReport(generatedSections);
      setProjectPlan(htmlReport);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, htmlReport);
      localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, projectInput);
      saveEnhancedPlanSections(generatedSections);
      
      // Final progress update
      setEnhancedProgress({
        currentSection: totalSections,
        totalSections,
        currentSectionTitle: 'Complete',
        overallProgress: 100,
        isGenerating: false
      });
      
    } catch (err) {
      console.error('Enhanced plan generation error:', err);
      setError('Failed to generate enhanced project plan. Please try again.');
    } finally {
      setIsGeneratingEnhanced(false);
    }
  };

  const handleGenerateWithSuggestions = async () => {
    if (useEnhancedPlanner) {
      await handleGenerateEnhancedPlan();
      return;
    }
    
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
    const planContent = getPlanContentForExternalUse(projectPlan);

    if (!planContent.trim()) {
      setError('No project plan available to convert');
      return;
    }

    setIsGeneratingBpmn(true);
    setError('');

    try {
      const bpmnXml = await generateBpmnXml(planContent);
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
      const existingPlan = getPlanContentForExternalUse(projectPlan);

      const enhancementRequest = `
Based on the existing project plan below, enhance it by adding the following requirements:

ENHANCEMENT REQUEST: "${enhancementPrompt}"

EXISTING PROJECT PLAN:
${existingPlan}

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

  const generateStakeholders = async () => {
    if (!projectInput.trim()) {
      setError('Please enter project description first');
      return;
    }

    setIsGeneratingStakeholders(true);
    setError('');

    try {
      // Use AI to analyze project and identify stakeholder names
      const gemini = new GoogleGenerativeAI("AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM");
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

      const planContent = projectPlan ? getPlanContentForExternalUse(projectPlan) : '';
      
      const stakeholderAnalysisPrompt = `
Analyze this project and identify ALL relevant stakeholder names/roles. Generate ONLY the names/titles.

PROJECT DESCRIPTION: ${projectInput}

${planContent ? `EXISTING PROJECT PLAN CONTEXT: ${planContent}` : ''}

INSTRUCTIONS:
1. Identify 8-15 distinct stakeholder names/roles for this specific project
2. Include stakeholders across these categories:
   - End users (different user types like "Premium Users", "Basic Users", "Mobile Users")
   - Business stakeholders (like "CEO", "Product Manager", "Marketing Director") 
   - Technical stakeholders (like "Lead Developer", "QA Engineer", "DevOps Engineer")
   - External stakeholders (like "Customers", "Partners", "Vendors", "Regulators")
   - Support stakeholders (like "Customer Support", "Sales Team", "Content Writers")

3. Make stakeholder names specific to the project domain and requirements
4. Use clear, descriptive role names that are easy to understand

Return ONLY a JSON array of stakeholder name strings:
["End Users", "Product Manager", "Development Team", "QA Engineers", "Business Owner", "Customers", "IT Operations", "Customer Support"]`;

      const response = await model.generateContent(stakeholderAnalysisPrompt);
      const responseText = response.response.text();
      
      // Clean and parse the response
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      try {
        const parsedNames = JSON.parse(cleanedResponse);
        setStakeholderNames(parsedNames);
        
        // Save to localStorage
        localStorage.setItem('stakeholder-names', JSON.stringify(parsedNames));
        
      } catch (parseError) {
        console.error('Failed to parse stakeholder response:', parseError);
        // Fallback stakeholder names for any project
        const fallbackNames = [
          "End Users",
          "Product Manager", 
          "Development Team",
          "Business Owner",
          "QA Team",
          "Customers",
          "IT Operations",
          "Customer Support"
        ];
        setStakeholderNames(fallbackNames);
        localStorage.setItem('stakeholder-names', JSON.stringify(fallbackNames));
      }
      
    } catch (err) {
      console.error('Stakeholder generation error:', err);
      setError('Failed to generate stakeholder analysis. Please try again.');
    } finally {
      setIsGeneratingStakeholders(false);
    }
  };

  // Add stakeholder name functions
  const addStakeholder = () => {
    if (newStakeholderName.trim() && !stakeholderNames.includes(newStakeholderName.trim())) {
      const updatedNames = [...stakeholderNames, newStakeholderName.trim()];
      setStakeholderNames(updatedNames);
      localStorage.setItem('stakeholder-names', JSON.stringify(updatedNames));
      setNewStakeholderName('');
    }
  };

  const deleteStakeholder = (index: number) => {
    const updatedNames = stakeholderNames.filter((_, i) => i !== index);
    setStakeholderNames(updatedNames);
    localStorage.setItem('stakeholder-names', JSON.stringify(updatedNames));
  };

  const startEditingStakeholder = (index: number) => {
    setEditingStakeholderIndex(index);
    setEditingStakeholderName(stakeholderNames[index]);
  };

  const saveEditingStakeholder = () => {
    if (editingStakeholderIndex !== null && editingStakeholderName.trim()) {
      const updatedNames = [...stakeholderNames];
      updatedNames[editingStakeholderIndex] = editingStakeholderName.trim();
      setStakeholderNames(updatedNames);
      localStorage.setItem('stakeholder-names', JSON.stringify(updatedNames));
      setEditingStakeholderIndex(null);
      setEditingStakeholderName('');
    }
  };

  const cancelEditingStakeholder = () => {
    setEditingStakeholderIndex(null);
    setEditingStakeholderName('');
  };

  const generateProjectFlowDiagram = async () => {
    if (!projectInput.trim()) {
      setError('Please enter project description first');
      return;
    }

    // Check if we have stakeholders from the stakeholder analysis section
    if (stakeholderNames.length === 0) {
      setError('Please add stakeholders in the Stakeholder Analysis section above first');
      return;
    }

    setIsGeneratingFlowDiagram(true);
    setError('');

    try {
      // Load any existing flow from localStorage
      const savedFlowDiagram = localStorage.getItem('project-flow-diagram');
      if (savedFlowDiagram) {
        try {
          const parsed = JSON.parse(savedFlowDiagram);
          setGeneratedFlowDiagram(parsed);
          setIsGeneratingFlowDiagram(false);
          return;
        } catch (error) {
          console.error('Error parsing saved flow diagram:', error);
        }
      }

      // Use AI to analyze project plan and create flows for EXISTING stakeholders only
      const gemini = new GoogleGenerativeAI("AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM");
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

      const planContent = projectPlan ? getPlanContentForExternalUse(projectPlan) : '';
      
      const flowAnalysisPrompt = `
Create DETAILED user journey flows for the EXACT stakeholders provided below. Do NOT add any new stakeholders or miss any of these stakeholders:

EXISTING STAKEHOLDERS (use ONLY these): ${stakeholderNames.join(', ')}

PROJECT DESCRIPTION: ${projectInput}

PROJECT PLAN CONTENT: ${planContent}

Create detailed step-by-step flows for EACH of the stakeholders listed above. For each stakeholder, show their complete journey from discovery to goal completion.

Return a JSON object with stakeholder-specific detailed activities:
{
  "processDescription": "User journey flows for the specified stakeholders",
  "participants": ${JSON.stringify(stakeholderNames)},
  "trigger": "Each stakeholder type needs to accomplish their specific goals",
  "activities": [
    ${stakeholderNames.map(name => `"${name}: [Create detailed step-by-step flow for ${name} - e.g., discovers app → registers → verifies → completes onboarding → performs main tasks → achieves goals]"`).join(',\n    ')}
  ],
  "decisionPoints": [
    ${stakeholderNames.map(name => `"${name} decision point (e.g., ${name} chooses their preferred action/path?)"`).join(',\n    ')}
  ],
  "endEvent": "All stakeholders successfully complete their specific objectives",
  "additionalElements": [
    ${stakeholderNames.map(name => `"${name}-specific support features and tools"`).join(',\n    ')}
  ]
}

IMPORTANT: Use ONLY the stakeholders provided: ${stakeholderNames.join(', ')}. Do not add, remove, or modify these stakeholder names.`;

      const response = await model.generateContent(flowAnalysisPrompt);
      const responseText = response.response.text();
      
      let flowDetails;
      try {
        // Parse AI response to get project-specific flow details
        const cleanResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        flowDetails = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.log('Using fallback flow details with existing stakeholders:', parseError);
        // Fallback using existing stakeholders
        flowDetails = {
          processDescription: `User journey flows for: ${stakeholderNames.join(', ')}`,
          participants: [...stakeholderNames],
          trigger: "Each stakeholder type needs to accomplish their specific goals",
          activities: stakeholderNames.map(name => 
            `${name}: Discovers application → Creates account/accesses system → Completes authentication → Navigates to relevant section → Performs key tasks → Reviews results → Completes objectives`
          ),
          decisionPoints: stakeholderNames.map(name => 
            `${name} chooses their preferred workflow path?`
          ),
          endEvent: "All stakeholders successfully complete their specific workflows",
          additionalElements: stakeholderNames.map(name => 
            `${name}-specific interface and support tools`
          )
        };
      }

      const flowDiagramGenerator = createAIFlowDiagramGenerator();
      const flowDiagramData = await flowDiagramGenerator.generateFlowDiagram(
        flowDetails,
        "System",
        "Application Users Analysis Flow"
      );

      const flowDiagramResult = {
        title: "Application Users Analysis Flow",
        description: `User journey flows for all stakeholders: ${stakeholderNames.join(', ')}`,
        flowData: flowDiagramData
      };

      setGeneratedFlowDiagram(flowDiagramResult);
      
      // Save to localStorage
      localStorage.setItem('project-flow-diagram', JSON.stringify(flowDiagramResult));
      
    } catch (err) {
      console.error('Flow diagram generation error:', err);
      setError('Failed to generate flow diagram. Please try again.');
    } finally {
      setIsGeneratingFlowDiagram(false);
    }
  };



  const regenerateFlowDiagram = async () => {
    if (!projectInput.trim()) {
      setError('Please enter project description first');
      return;
    }

    // Clear existing flow diagram first
    setGeneratedFlowDiagram(null);
    localStorage.removeItem('project-flow-diagram');
    
    setIsGeneratingFlowDiagram(true);
    setError('');

    try {
      // Create user-centered FlowDetails object with alternative user journeys
      const flowDetails = {
        processDescription: `Alternative user journey for project: ${projectInput}. Enhanced with different user paths and interaction patterns for comprehensive user experience mapping.`,
        participants: [
          "First-time Visitors", "Registered Users", "Premium Users", "Mobile Users",
          "Desktop Users", "Admin Users", "Guest Users", "Power Users",
          "Casual Users", "Business Users", "Customer Support", "Content Creators"
        ],
        trigger: "User has a specific need or goal they want to accomplish",
        activities: [
          "FIRST-TIME VISITOR: Discovers landing page → Explores features → Reads testimonials → Watches demo → Decides to sign up → Creates account → Completes onboarding",
          "REGISTERED USER: Logs in → Checks dashboard → Reviews notifications → Completes daily tasks → Updates profile → Saves work → Logs out",
          "PREMIUM USER: Logs in with premium credentials → Accesses premium features → Uses advanced tools → Downloads premium content → Manages subscription → Contacts priority support",
          "MOBILE USER: Opens mobile app → Authenticates with biometrics → Syncs data → Uses offline features → Enables location services → Shares content → Receives push notifications",
          "ADMIN USER: Logs into admin panel → Reviews system metrics → Manages user accounts → Configures settings → Reviews reports → Handles escalations → Updates system",
          "GUEST USER: Browses without login → Views limited content → Receives registration prompts → Explores free features → Considers signup → Completes trial registration",
          "POWER USER: Uses keyboard shortcuts → Bulk operations → Custom workflows → API integrations → Advanced configurations → Automation setup → Performance optimization",
          "BUSINESS USER: Team login → Collaborative workspace → Project management → Resource allocation → Progress tracking → Team communication → Reporting dashboard",
          "CONTENT CREATOR: Content management → Create new content → Media upload → Content editing → Publishing workflow → Analytics review → Audience engagement",
          "CUSTOMER SUPPORT: Support dashboard → Ticket management → User assistance → Knowledge base updates → Escalation handling → Performance metrics → Training updates"
        ],
        decisionPoints: [
          "First-time visitor ready to create account?",
          "Registered user wants to upgrade to premium?",
          "Premium user satisfied with advanced features?",
          "Mobile user enables push notifications?",
          "Admin user approves new system changes?",
          "Guest user ready to register for full access?",
          "Power user wants to create custom workflows?",
          "Business user needs team collaboration features?",
          "Content creator ready to publish content?",
          "Customer support escalates complex issues?",
          "User prefers mobile or desktop experience?",
          "User wants to enable biometric authentication?",
          "User interested in API integrations?",
          "User needs offline functionality?",
          "User wants to share content publicly?",
          "User considering subscription renewal?",
          "User satisfied with loading performance?",
          "User wants personalized recommendations?",
          "User interested in community features?",
          "User needs data export capabilities?",
          "User wants advanced reporting features?",
          "User ready for automated workflows?",
          "User interested in third-party integrations?",
          "User planning long-term usage?"
        ],
        endEvent: "User successfully completes their journey and achieves their goals",
        additionalElements: [
          "User onboarding tutorials",
          "Interactive feature guides",
          "Contextual help tooltips",
          "User feedback collection",
          "Customer support chat",
          "User preference settings",
          "Accessibility options",
          "Multi-language support",
          "User progress tracking",
          "Achievement badges",
          "User community forums",
          "Knowledge base articles",
          "Video tutorials",
          "User testimonials",
          "Referral program",
          "User analytics dashboard",
          "Personalization engine",
          "User notification center",
          "Mobile app companion",
          "Offline mode support",
          "User data export tools",
          "Account security settings",
          "User subscription management",
          "Social sharing features",
          "User collaboration tools",
          "Custom user workflows",
          "User success metrics",
          "User retention programs",
          "User experience surveys",
          "User journey optimization"
        ]
      };

      const flowDiagramGenerator = createAIFlowDiagramGenerator();
      const flowDiagramData = await flowDiagramGenerator.generateFlowDiagram(
        flowDetails,
        "System",
        "Enhanced Project Workflow"
      );

      const flowDiagramResult = {
        title: "Alternative User Journey Flow",
        description: "Enhanced user-centered flow diagram with alternative user paths and interaction patterns",
        flowData: flowDiagramData
      };

      setGeneratedFlowDiagram(flowDiagramResult);
      
      // Save to localStorage
      localStorage.setItem('project-flow-diagram', JSON.stringify(flowDiagramResult));
      
    } catch (err) {
      console.error('Flow diagram regeneration error:', err);
      setError('Failed to regenerate flow diagram. Please try again.');
    } finally {
      setIsGeneratingFlowDiagram(false);
    }
  };

  const downloadFlowDiagram = () => {
    if (!generatedFlowDiagram) return;
    
    const flowData = JSON.stringify(generatedFlowDiagram, null, 2);
    const blob = new Blob([flowData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-flow-diagram.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const generateIndividualSection = async (sectionId: string) => {
    if (!projectInput.trim()) {
      setError('Please enter a project description');
      return;
    }

    const section = projectSectionsSettings.find(s => s.id === sectionId);
    if (!section) {
      setError('Section not found');
      return;
    }

    setGeneratingSectionId(sectionId);
    setError('');

    try {
      const planner = createEnhancedProjectPlanner();
      
      const config: EnhancedProjectPlanConfig = {
        projectDescription: projectInput,
        additionalRequirements: selectedSuggestions.length > 0 ? selectedSuggestions : undefined
      };

      // Generate content for this specific section using configured AI prompts
      const content = await planner.generateSection(section.title, config, {
        id: section.id,
        aiPrompts: section.aiPrompts
      });
      
      // Update the enhanced sections state
      setEnhancedSections(current => {
        const existingIndex = current.findIndex(s => s.id === sectionId);
        const newSection: ProjectPlanSection = {
          id: sectionId,
          title: section.title,
          content,
          isGenerating: false,
          isCompleted: true,
          order: section.order
        };

        if (existingIndex >= 0) {
          // Update existing section
          const updated = [...current];
          updated[existingIndex] = newSection;
          return updated;
        } else {
          // Add new section
          return [...current, newSection].sort((a, b) => a.order - b.order);
        }
      });

      // Update project plan if this is the first section or regenerate the HTML
      const allSections = enhancedSections.filter(s => s.id !== sectionId);
      allSections.push({
        id: sectionId,
        title: section.title,
        content,
        isGenerating: false,
        isCompleted: true,
        order: section.order
      });
      
      const sortedSections = allSections.sort((a, b) => a.order - b.order);
      
      if (sortedSections.length > 0) {
        const planner = createEnhancedProjectPlanner();
        const htmlReport = planner.generateHtmlReport(sortedSections);
        setProjectPlan(htmlReport);
        localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, htmlReport);
        // Save enhanced sections to localStorage using helper function
        saveEnhancedPlanSections(sortedSections);
      }

    } catch (err) {
      console.error(`Failed to generate section ${section.title}:`, err);
      setError(`Failed to generate ${section.title}. Please try again.`);
    } finally {
      setGeneratingSectionId(null);
    }
  };



  const openCustomPromptModal = (sectionId: string) => {
    console.log('Opening modal for section ID:', sectionId);
    console.log('Enhanced sections:', enhancedSections);
    console.log('Project plan exists:', !!projectPlan);
    
    setCustomPromptSectionId(sectionId);
    setCustomPrompt('');
    setShowCustomPromptModal(true);
  };

  const closeCustomPromptModal = () => {
    setShowCustomPromptModal(false);
    setCustomPrompt('');
    setCustomPromptSectionId(null);
  };

  const regenerateSectionWithCustomPrompt = async (sectionId: string, prompt: string) => {
    if (!prompt.trim()) {
      setError('Please enter custom instructions for regeneration');
      return;
    }

    setIsRegeneratingSection(true);
    setError('');

    try {
      const gemini = new GoogleGenerativeAI("AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM");
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Find the target section
      const targetSection = enhancedSections.find(s => s.id === sectionId);
      if (!targetSection) {
        setError(`Section not found: ${sectionId}`);
        return;
      }

      // Build regeneration prompt
      const regenerationPrompt = `
You are an expert project planning assistant. I need you to regenerate a specific section of a project plan based on a custom prompt.

ORIGINAL PROJECT DESCRIPTION:
${projectInput}

CURRENT SECTION TITLE: ${targetSection.title}
CURRENT SECTION CONTENT:
${targetSection.content}

CUSTOM REGENERATION PROMPT:
${prompt}

INSTRUCTIONS:
- Regenerate ONLY the "${targetSection.title}" section based on the custom prompt
- Keep the section title exactly the same: "${targetSection.title}"
- The new content should address the custom prompt while maintaining relevance to the overall project
- Use professional, detailed language appropriate for project documentation
- Include relevant technical details, implementation steps, and considerations
- Format the response as clean HTML content suitable for web display
- Include proper headings, paragraphs, lists, and structure
- Make sure the content is comprehensive and actionable
- Consider the project context: ${projectInput}

Please provide the regenerated section content as properly formatted HTML:`;

      const result = await model.generateContent(regenerationPrompt);
      const regeneratedContent = result.response.text();

      // Clean and format the regenerated content
      let cleanedContent = regeneratedContent.trim();
      
      // Remove any markdown code block markers if present
      if (cleanedContent.startsWith('```html')) {
        cleanedContent = cleanedContent.replace(/^```html\s*/, '').replace(/```\s*$/, '');
      }
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      // Update the enhanced sections with the cleaned content
      setEnhancedSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, content: cleanedContent }
          : section
      ));

      // Update the main project plan if it exists
      if (projectPlan) {
        // For HTML content, replace the specific section in the HTML
        let updatedHtml = projectPlan;
        const sectionPattern = new RegExp(`<section[^>]*id="${sectionId}"[^>]*>(.*?)</section>`, 'gis');
        
        const newSectionHtml = `<section class="project-section" id="${sectionId}">
          <h2 class="section-title">${targetSection.title}</h2>
          <div class="section-content">
            ${cleanedContent}
          </div>
        </section>`;
        
        if (sectionPattern.test(updatedHtml)) {
          updatedHtml = updatedHtml.replace(sectionPattern, newSectionHtml);
        } else {
          // If pattern not found, append the section
          updatedHtml += '\n' + newSectionHtml;
        }
        
        setProjectPlan(updatedHtml);
        localStorage.setItem(STORAGE_KEYS.PROJECT_PLAN, updatedHtml);
      }

      // Save updated enhanced sections to localStorage using helper function
      const updatedSections = enhancedSections.map(section => 
        section.id === sectionId 
          ? { ...section, content: cleanedContent }
          : section
      );
      saveEnhancedPlanSections(updatedSections);

      // Force a re-render by updating the active tab
      const currentActiveTab = document.querySelector('[data-state="active"][data-orientation="horizontal"]');
      if (currentActiveTab) {
        const tabValue = currentActiveTab.getAttribute('value');
        if (tabValue === sectionId) {
          // Trigger a re-render by briefly switching tabs
          setActiveTabId(null);
          setTimeout(() => {
            setActiveTabId(sectionId);
          }, 10);
        }
      }
      
      // Close modal and reset state
      setShowCustomPromptModal(false);
      setCustomPrompt('');
      setCustomPromptSectionId(null);
      
      // Show success notification
      console.log(`Section "${targetSection.title}" regenerated successfully`);
      
    } catch (error) {
      console.error('Section regeneration error:', error);
      setError('Failed to regenerate section. Please try again.');
    } finally {
      setIsRegeneratingSection(false);
    }
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
    localStorage.removeItem('enhanced_plan_sections');
    setLocation('/');
  };

  // Parse project plan into sections for tabbed interface
  const parseProjectPlanSections = (planContent: string): ProjectPlanSection[] => {
    if (!planContent) return [];
    
    const sections: ProjectPlanSection[] = [];
    const lines = planContent.split('\n');
    let currentSection: ProjectPlanSection | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for main section headers (# or ##)
      if (trimmedLine.match(/^#{1,2}\s+(.+)/)) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Start new section
        const title = trimmedLine.replace(/^#{1,2}\s+/, '').trim();
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        currentSection = {
          id,
          title,
          content: line + '\n',
          isGenerating: false,
          isCompleted: true,
          order: sections.length
        };
      } else if (currentSection) {
        // Add line to current section
        currentSection.content += line + '\n';
      } else if (trimmedLine && !currentSection) {
        // Content before first header - create introduction section
        if (sections.length === 0) {
          currentSection = {
            id: 'introduction',
            title: 'Project Overview',
            content: line + '\n',
            isGenerating: false,
            isCompleted: true,
            order: 0
          };
        }
      }
    }
    
    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const renderTabbedProjectPlan = () => {
    if (!projectPlan) return null;

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
      // For HTML content, extract sections from <section> tags
      const sectionPattern = /<section[^>]*>((?:.|\s)*?)<\/section>/gi;
      const sections = [];
      let match;
      
      while ((match = sectionPattern.exec(cleanedContent)) !== null) {
        const sectionHtml = match[0];
        const titleMatch = sectionHtml.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
        const title: string = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : `Section ${sections.length + 1}`;
        const id: string = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        sections.push({
          id,
          title,
          content: sectionHtml,
          isGenerating: false,
          isCompleted: true,
          order: sections.length
        });
      }

      if (sections.length === 0) {
        // If no sections found, treat entire content as one section
        sections.push({
          id: 'project-plan',
          title: 'Project Plan',
          content: cleanedContent,
          isGenerating: false,
          isCompleted: true,
          order: 0
        });
      }

      // Update enhancedSections state if it's different
      if (!enhancedSections || enhancedSections.length !== sections.length) {
        setEnhancedSections(sections);
      }

      return (
        <Tabs defaultValue={sections[0]?.id} className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-3 p-4 mb-6 rounded-xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border border-slate-200 shadow-inner">
            {sections.map((section, index) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id} 
                className="flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium ring-offset-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-white hover:shadow-md hover:scale-102 relative group cursor-pointer border-2 border-transparent data-[state=active]:border-blue-300 bg-white/80 backdrop-blur-sm"
              >
                <span className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:shadow-sm transition-all duration-300"></div>
                  <span className="font-semibold text-center text-slate-700 group-data-[state=active]:text-white transition-colors duration-300 whitespace-normal leading-tight">
                    {section.title}
                  </span>
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-20 transition-opacity duration-300"></div>
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="mt-0 animate-in fade-in-50 duration-200">
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
                  {(() => {
                    const { icon: SectionIcon } = getSectionIconAndDescription(section.title);
                    return (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                          <SectionIcon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                      </div>
                    );
                  })()}
                  <Button
                    onClick={() => openCustomPromptModal(section.id)}
                    size="sm"
                    variant="outline"
                    className="text-xs bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:from-purple-100 hover:to-indigo-100"
                    disabled={isRegeneratingSection}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <div className="p-0">
                  {(() => {
                    const enhancedHtml = `
                      <!DOCTYPE html>
                      <html lang="en">
                      <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${section.title}</title>
                        <style>
                          ${/* Include the same enhanced styling from renderProjectPlan */ ''}
                          * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                          }
                          
                          body {
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                            line-height: 1.7;
                            color: #1e293b;
                            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                            padding: 32px;
                            font-size: 15px;
                            letter-spacing: -0.01em;
                          }
                          
                          h1, h2, h3, h4, h5, h6 {
                            color: #0f172a;
                            margin-bottom: 20px;
                            font-weight: 700;
                            letter-spacing: -0.025em;
                          }
                          
                          h1 {
                            font-size: 2.5rem;
                            background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            margin-bottom: 32px;
                            padding-bottom: 16px;
                            border-bottom: 3px solid transparent;
                            border-image: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899) 1;
                            position: relative;
                          }
                          
                          h2 {
                            font-size: 1.75rem;
                            position: relative;
                            padding: 16px 20px;
                            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                            border-radius: 16px;
                            border-left: 5px solid #6366f1;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                            margin-bottom: 24px;
                          }
                          
                          .grid {
                            display: flex;
                            flex-direction: row;
                            flex-wrap: wrap;
                            gap: 16px;
                            margin: 20px 0;
                            justify-content: flex-start;
                            align-items: stretch;
                          }
                          
                          .metric {
                            background: linear-gradient(135deg, #ffffff, #f8fafc);
                            border: 1px solid #e2e8f0;
                            border-radius: 20px;
                            padding: 24px;
                            text-align: center;
                            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                            flex: 1;
                            min-width: 160px;
                            max-width: 220px;
                            transition: all 0.3s ease;
                            position: relative;
                            overflow: hidden;
                          }
                          
                          /* Metrics Dashboard Flex Layouts */
                          .metrics-dashboard {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 12px;
                            margin: 16px 0;
                            padding: 12px;
                            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                            border-radius: 12px;
                          }
                          
                          .metric-card {
                            display: flex;
                            flex-direction: column;
                            background: white;
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                            padding: 12px;
                            min-width: 100px;
                            flex: 1;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            transition: all 0.2s ease;
                            text-align: center;
                          }
                        </style>
                      </head>
                      <body>
                        ${section.content}
                      </body>
                      </html>
                    `;
                    
                    return (
                      <div 
                        className="w-full border-0 bg-white rounded-lg p-8 prose prose-lg max-w-none"
                        style={{ 
                          minHeight: '400px',
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
                          lineHeight: '1.7',
                          color: '#1e293b',
                          fontSize: '15px',
                          letterSpacing: '-0.01em'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: `
                            <style>
                              .grid {
                                display: flex;
                                flex-direction: row;
                                flex-wrap: wrap;
                                gap: 16px;
                                margin: 20px 0;
                                justify-content: flex-start;
                                align-items: stretch;
                              }
                              
                              .metric {
                                background: linear-gradient(135deg, #ffffff, #f8fafc);
                                border: 1px solid #e2e8f0;
                                border-radius: 20px;
                                padding: 24px;
                                text-align: center;
                                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                                flex: 1;
                                min-width: 160px;
                                max-width: 220px;
                                transition: all 0.3s ease;
                                position: relative;
                                overflow: hidden;
                              }
                              
                              .metrics-dashboard {
                                display: flex;
                                flex-wrap: wrap;
                                gap: 12px;
                                margin: 16px 0;
                                padding: 12px;
                                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                                border-radius: 12px;
                              }
                              
                              .metric-card {
                                display: flex;
                                flex-direction: column;
                                background: white;
                                border: 1px solid #e2e8f0;
                                border-radius: 8px;
                                padding: 12px;
                                min-width: 100px;
                                flex: 1;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                                transition: all 0.2s ease;
                                text-align: center;
                              }
                              
                              h1 {
                                font-size: 2.5rem;
                                background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                background-clip: text;
                                margin-bottom: 32px;
                                padding-bottom: 16px;
                                border-bottom: 3px solid transparent;
                                border-image: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899) 1;
                                position: relative;
                                font-weight: 700;
                                letter-spacing: -0.025em;
                              }
                              
                              h2 {
                                font-size: 1.75rem;
                                position: relative;
                                padding: 16px 20px;
                                background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                                border-radius: 16px;
                                border-left: 5px solid #6366f1;
                                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                                margin-bottom: 24px;
                                font-weight: 700;
                                letter-spacing: -0.025em;
                                color: #0f172a;
                              }
                              
                              .metric-trend.positive::before {
                                content: '↗';
                                margin-right: 2px;
                              }
                              
                              .metric-trend.negative::before {
                                content: '↘';
                              }
                            </style>
                            ${section.content}
                          `
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      );
    } else {
      // For plain text content, parse into sections based on headers
      const sections = parseProjectPlanSections(cleanedContent);
      
      if (sections.length === 0) {
        return (
          <div className="space-y-4 leading-relaxed">
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700">No content available to display.</p>
            </div>
          </div>
        );
      }

      return (
        <Tabs defaultValue={sections[0]?.id} className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-3 p-4 mb-6 rounded-xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border border-slate-200 shadow-inner">
            {sections.map((section, index) => {
              const { icon: SectionIcon, description } = getSectionIconAndDescription(section.title);
              return (
                <TabsTrigger 
                  key={section.id} 
                  value={section.id} 
                  className="flex flex-col items-center justify-center rounded-xl px-4 py-3 text-sm font-medium ring-offset-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-white hover:shadow-md hover:scale-102 relative group cursor-pointer border-2 border-transparent data-[state=active]:border-blue-300 bg-white/80 backdrop-blur-sm min-w-[120px]"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <SectionIcon className="w-4 h-4 text-blue-600 group-data-[state=active]:text-white transition-colors duration-300" />
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:shadow-sm transition-all duration-300"></div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-slate-700 group-data-[state=active]:text-white transition-colors duration-300 whitespace-normal leading-tight text-xs">
                        {section.title}
                      </div>
                      <div className="text-xs text-slate-500 group-data-[state=active]:text-blue-100 transition-colors duration-300 mt-0.5">
                        {description}
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-20 transition-opacity duration-300"></div>
                </TabsTrigger>
              );
            })}
          </TabsList>
          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="mt-0 animate-in fade-in-50 duration-200">
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-slate-50 to-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                      <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openCustomPromptModal(section.id)}
                        size="sm"
                        variant="outline"
                        className="text-xs bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:from-purple-100 hover:to-indigo-100"
                        disabled={isRegeneratingSection}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Regenerate
                      </Button>
                      <Button
                        onClick={() => startEditingSection(section.id, section.content, section.id)}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {editingSectionId === section.id && activeTabId === section.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Edit the content for this section. You can use plain text or basic formatting.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={saveSectionEdit}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button
                            onClick={cancelSectionEdit}
                            variant="outline"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                      
                      <Textarea
                        value={editedSectionContent}
                        onChange={(e) => setEditedSectionContent(e.target.value)}
                        className="min-h-[400px] font-mono text-sm bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter content for this section..."
                      />
                      
                      <div className="text-sm text-gray-500">
                        {editedSectionContent.length} characters | Plain text and basic formatting supported
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="prose prose-gray max-w-none">
                        {section.content.split('\n').map((line, index) => {
                        const cleanLine = line.trim();

                        if (!cleanLine) {
                          return <div key={index} className="h-4"></div>;
                        }

                        if (cleanLine.startsWith('# ')) {
                          return (
                            <h1
                              key={index}
                              className="text-2xl font-bold text-gray-900 mb-4 mt-6 border-b-2 border-blue-200 pb-2"
                            >
                              {cleanLine.substring(2).trim()}
                            </h1>
                          );
                        }

                        if (cleanLine.startsWith('## ')) {
                          return (
                            <h2
                              key={index}
                              className="text-xl font-semibold text-gray-800 mb-3 mt-5"
                            >
                              {cleanLine.substring(3).trim()}
                            </h2>
                          );
                        }

                        if (cleanLine.startsWith('### ')) {
                          return (
                            <h3
                              key={index}
                              className="text-lg font-medium text-gray-700 mb-2 mt-4"
                            >
                              {cleanLine.substring(4).trim()}
                            </h3>
                          );
                        }

                        if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
                          return (
                            <li
                              key={index}
                              className="text-gray-700 mb-2 ml-4 list-disc list-inside"
                            >
                              {cleanLine.substring(2).trim()}
                            </li>
                          );
                        }

                        if (cleanLine.match(/^\d+\.\s/)) {
                          return (
                            <li
                              key={index}
                              className="text-gray-700 mb-2 ml-4 list-decimal list-inside"
                            >
                              {cleanLine.replace(/^\d+\.\s/, '').trim()}
                            </li>
                          );
                        }

                        // Regular paragraphs
                        return (
                          <p
                            key={index}
                            className="text-gray-700 mb-4 leading-relaxed text-justify"
                          >
                            {cleanLine}
                          </p>
                        );
                      })}
                      </div>
                      
                      {/* Section Flow Diagram */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <SectionFlowViewer
                          sectionTitle={section.title}
                          sectionContent={section.content}
                          sectionId={section.id}
                          className="mt-4"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      );
    }
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

  const startEditingSection = (sectionId: string, content?: string, tabId?: string) => {
    if (content && tabId) {
      // Called with 3 parameters
      setEditingSectionId(sectionId);
      setEditedSectionContent(content);
      setActiveTabId(tabId);
    } else {
      // Called with 1 parameter - find section from enhanced sections
      const section = enhancedSections.find(s => s.id === sectionId);
      if (section) {
        setEditingSectionId(sectionId);
        setEditedSectionContent(section.content);
        setActiveTabId(sectionId);
      }
    }
  };

  const saveSectionEdit = () => {
    if (!editingSectionId || !activeTabId) return;

    // Update the enhanced sections
    setEnhancedSections(prev => prev.map(section => 
      section.id === editingSectionId 
        ? { ...section, content: editedSectionContent }
        : section
    ));

    // Also update the main project plan if it exists
    if (projectPlan) {
      // For HTML content, we need to update the specific section
      let updatedPlan = projectPlan;
      const sectionTitle = enhancedSections.find(s => s.id === editingSectionId)?.title || '';
      
      if (sectionTitle && updatedPlan.includes(sectionTitle)) {
        // Simple replacement for now - could be more sophisticated
        const sectionPattern = new RegExp(`(<h[1-6][^>]*>${sectionTitle}</h[1-6]>)(.*?)(?=<h[1-6]|$)`, 'is');
        const replacement = `$1\n${editedSectionContent}\n`;
        updatedPlan = updatedPlan.replace(sectionPattern, replacement);
        setProjectPlan(updatedPlan);
      }
    }

    setEditingSectionId(null);
    setEditedSectionContent('');
    setActiveTabId(null);
  };

  const cancelSectionEdit = () => {
    setEditingSectionId(null);
    setEditedSectionContent('');
    setActiveTabId(null);
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
      // Split HTML content into sections and render each in an iframe
      const sectionPattern = /<section[^>]*>((?:.|\s)*?)<\/section>/gi;
      const sections = cleanedContent.match(sectionPattern) || [];
      
      if (sections.length === 0) {
        // If no sections found, treat entire content as one section
        const blob = new Blob([cleanedContent], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900">Project Plan Content</h3>
              </div>
              <div className="p-0">
                <iframe
                  src={blobUrl}
                  className="w-full border-0"
                  style={{
                    height: '600px',
                    backgroundColor: '#ffffff'
                  }}
                  title="Project Plan Content"
                  sandbox="allow-same-origin allow-scripts"
                  onLoad={() => {
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                  }}
                />
              </div>
            </div>
          </div>
        );
      }
      
      // Render multiple sections in individual iframes
      return (
        <div className="space-y-0">
          {sections.map((sectionHtml, index) => {
            // Extract section title if available
            const titleMatch = sectionHtml.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
            const sectionTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : `Section ${index + 1}`;
            
            // Create enhanced HTML with modern styling
            const enhancedHtml = `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${sectionTitle}</title>
                <style>
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  
                  body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                    line-height: 1.5;
                    color: #1e293b;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    padding: 16px;
                    font-size: 14px;
                    letter-spacing: -0.01em;
                  }
                  
                  h1, h2, h3, h4, h5, h6 {
                    color: #0f172a;
                    margin-bottom: 12px;
                    font-weight: 700;
                    letter-spacing: -0.025em;
                  }
                  
                  h1 {
                    font-size: 1.875rem;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 16px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid transparent;
                    border-image: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899) 1;
                    position: relative;
                  }
                  
                  h1::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 40px;
                    height: 2px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6);
                    border-radius: 1px;
                  }
                  
                  h2 {
                    font-size: 1.375rem;
                    position: relative;
                    padding: 8px 12px;
                    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                    border-radius: 8px;
                    border-left: 3px solid #6366f1;
                    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    margin-bottom: 12px;
                  }
                  
                  h3 {
                    font-size: 1.125rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 0;
                    color: #475569;
                    border-bottom: 1px solid #e2e8f0;
                    margin-bottom: 8px;
                  }
                  
                  h3:before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border-radius: 50%;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
                  }
                  
                  p {
                    margin-bottom: 8px;
                    text-align: justify;
                  }
                  
                  ul, ol {
                    margin: 8px 0;
                    padding-left: 0;
                    list-style: none;
                  }
                  
                  li {
                    position: relative;
                    padding: 4px 0 4px 20px;
                    margin-bottom: 4px;
                    font-size: 13px;
                  }
                  
                  ul li:before {
                    content: '';
                    position: absolute;
                    left: 6px;
                    top: 10px;
                    width: 5px;
                    height: 5px;
                    background: #3b82f6;
                    border-radius: 50%;
                  }
                  
                  ol {
                    counter-reset: item;
                  }
                  
                  ol li {
                    counter-increment: item;
                  }
                  
                  ol li:before {
                    content: counter(item);
                    position: absolute;
                    left: 0;
                    top: 4px;
                    width: 16px;
                    height: 16px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                  }
                  
                  table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 20px 0;
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
                    border: 2px solid #e2e8f0;
                    font-size: 14px;
                    position: relative;
                  }
                  
                  table::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
                    z-index: 1;
                  }
                  
                  th, td {
                    padding: 16px 20px;
                    text-align: left;
                    border-bottom: 1px solid #e2e8f0;
                    vertical-align: middle;
                    transition: all 0.3s ease;
                    position: relative;
                  }
                  
                  th {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    font-weight: 700;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    position: relative;
                    box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3);
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                  }
                  
                  td {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(10px);
                    font-weight: 500;
                  }
                  
                  tr:hover td {
                    background: rgba(99, 102, 241, 0.05);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.1);
                  }
                  
                  td:first-child {
                    font-weight: 600;
                    color: #6366f1;
                    border-left: 3px solid transparent;
                  }
                  
                  tr:hover td:first-child {
                    border-left-color: #6366f1;
                  }
                  
                  th:first-child {
                    border-top-left-radius: 8px;
                  }
                  
                  th:last-child {
                    border-top-right-radius: 8px;
                  }
                  
                  tr:hover {
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    transition: all 0.2s ease;
                  }
                  
                  tr:last-child td:first-child {
                    border-bottom-left-radius: 8px;
                  }
                  
                  tr:last-child td:last-child {
                    border-bottom-right-radius: 8px;
                  }
                  
                  tr:last-child td {
                    border-bottom: none;
                  }
                  
                  .card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 12px;
                    margin: 8px 0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.05);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                  }
                  
                  .card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
                  }
                  
                  .card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                  }
                  
                  .highlight {
                    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                    border: 1px solid #0ea5e9;
                    border-radius: 8px;
                    padding: 12px;
                    margin: 8px 0;
                    position: relative;
                    box-shadow: 0 2px 4px -1px rgba(14, 165, 233, 0.1);
                    font-size: 13px;
                  }
                  
                  .highlight::before {
                    content: '💡';
                    position: absolute;
                    top: -6px;
                    left: 12px;
                    background: white;
                    padding: 2px 6px;
                    border-radius: 50%;
                    font-size: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  }
                  
                  .flowchart {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin: 12px 0;
                    justify-content: center;
                    align-items: center;
                    padding: 16px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                  }
                  
                  .flow-step {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-weight: 600;
                    position: relative;
                    min-width: 100px;
                    text-align: center;
                    box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3);
                    transition: all 0.3s ease;
                    font-size: 13px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                  }
                  
                  .flow-step:hover {
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 8px 25px -5px rgba(99, 102, 241, 0.4);
                    border-color: rgba(255, 255, 255, 0.4);
                  }
                  
                  .flow-step:not(:last-child):after {
                    content: '';
                    position: absolute;
                    right: -18px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 0;
                    height: 0;
                    border-top: 8px solid transparent;
                    border-bottom: 8px solid transparent;
                    border-left: 12px solid #6366f1;
                    z-index: 10;
                  }
                  
                  .flow-step:not(:last-child):before {
                    content: '';
                    position: absolute;
                    right: -16px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 12px;
                    height: 3px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6);
                    border-radius: 2px;
                    z-index: 9;
                  }
                  
                  .architecture-diagram {
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border: 2px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 20px;
                    margin: 16px 0;
                    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
                    position: relative;
                    overflow: hidden;
                  }
                  
                  .architecture-diagram::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
                  }
                  
                  .diagram-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    align-items: center;
                    position: relative;
                  }
                  
                  .diagram-box {
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    position: relative;
                    min-height: 80px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                  }
                  
                  .diagram-box::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6);
                    border-radius: 12px 12px 0 0;
                  }
                  
                  .diagram-box:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.15);
                    border-color: #6366f1;
                  }
                  
                  .diagram-box.primary {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    border-color: #4f46e5;
                  }
                  
                  .diagram-box.secondary {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    border-color: #047857;
                  }
                  
                  .diagram-box.accent {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    border-color: #b45309;
                  }
                  
                  .diagram-title {
                    font-size: 14px;
                    font-weight: 700;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  }
                  
                  .diagram-subtitle {
                    font-size: 11px;
                    opacity: 0.8;
                    font-weight: 500;
                  }
                  
                  .diagram-connector {
                    position: absolute;
                    width: 2px;
                    background: linear-gradient(to bottom, #6366f1, #8b5cf6);
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1;
                  }
                  
                  .diagram-connector.horizontal {
                    width: 100%;
                    height: 2px;
                    top: 50%;
                    left: 0;
                    transform: translateY(-50%);
                    background: linear-gradient(to right, #6366f1, #8b5cf6);
                  }
                  
                  .section-divider {
                    display: flex;
                    align-items: center;
                    margin: 20px 0;
                    position: relative;
                  }
                  
                  .section-divider::before {
                    content: '';
                    flex: 1;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent);
                  }
                  
                  .section-divider-text {
                    padding: 0 16px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3);
                  }
                  
                  .grid {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin: 8px 0;
                    justify-content: flex-start;
                    align-items: stretch;
                  }
                  
                  .metric {
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
                    flex: 1;
                    min-width: 100px;
                    max-width: 140px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                  }
                  
                  .metric::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
                  }
                  
                  .metric:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 12px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08);
                  }
                  
                  .metric-value {
                    font-size: 1.75rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    display: block;
                    letter-spacing: -0.025em;
                    margin-bottom: 4px;
                  }
                  
                  .metric-label {
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                  }
                  
                  .timeline {
                    position: relative;
                    padding-left: 16px;
                    margin: 6px 0;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 8px;
                    padding: 8px 8px 8px 20px;
                    border: 1px solid #e2e8f0;
                  }
                  
                  .timeline:before {
                    content: '';
                    position: absolute;
                    left: 12px;
                    top: 8px;
                    bottom: 8px;
                    width: 2px;
                    background: linear-gradient(to bottom, #3b82f6, #6366f1, #8b5cf6);
                    border-radius: 1px;
                  }
                  
                  .timeline-item {
                    position: relative;
                    padding: 3px 0;
                    margin-bottom: 3px;
                    background: white;
                    border-radius: 6px;
                    padding: 8px 10px;
                    margin-left: 10px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
                    transition: all 0.2s ease;
                  }
                  
                  .timeline-item:hover {
                    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                    transform: translateY(-1px);
                  }
                  
                  .timeline-item:before {
                    content: '●';
                    position: absolute;
                    left: -18px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 8px;
                    height: 8px;
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    border-radius: 50%;
                    color: white;
                    font-size: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid white;
                    box-shadow: 0 0 0 1px #3b82f6, 0 1px 2px rgba(59,130,246,0.2);
                  }
                  
                  .timeline-item h3 {
                    font-size: 0.8rem;
                    margin-bottom: 2px;
                    font-weight: 600;
                    color: #1e293b;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                  }
                  
                  .timeline-item h3:before {
                    content: '📅';
                    font-size: 0.7rem;
                  }
                  
                  .timeline-item p {
                    font-size: 0.75rem;
                    margin-bottom: 0;
                    color: #64748b;
                    line-height: 1.3;
                  }
                  
                  code {
                    background: #f3f4f6;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Monaco', 'Consolas', monospace;
                    font-size: 14px;
                  }
                  
                  blockquote {
                    border-left: 4px solid #10b981;
                    background: #ecfdf5;
                    padding: 16px 20px;
                    margin: 16px 0;
                    border-radius: 0 8px 8px 0;
                    font-style: italic;
                  }
                  
                  .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border-radius: 24px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border: 1px solid transparent;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                  }
                  
                  .status-badge:hover {
                    transform: scale(1.05);
                  }
                  
                  .status-success { 
                    background: linear-gradient(135deg, #ecfdf5, #d1fae5); 
                    color: #065f46; 
                    border-color: #10b981;
                    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
                  }
                  
                  .status-success::before { content: '✓'; }
                  
                  .status-warning { 
                    background: linear-gradient(135deg, #fffbeb, #fef3c7); 
                    color: #92400e; 
                    border-color: #f59e0b;
                    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
                  }
                  
                  .status-warning::before { content: '⚠'; }
                  
                  .status-info { 
                    background: linear-gradient(135deg, #eff6ff, #dbeafe); 
                    color: #1e40af; 
                    border-color: #3b82f6;
                    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
                  }
                  
                  .status-info::before { content: 'ℹ'; }
                  
                  .status-danger { 
                    background: linear-gradient(135deg, #fef2f2, #fee2e2); 
                    color: #991b1b; 
                    border-color: #ef4444;
                    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
                  }
                  
                  .status-danger::before { content: '✕'; }
                  
                  /* HTML-based Technical Diagrams */
                  .architecture-diagram {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    margin: 16px 0;
                    padding: 12px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                  }
                  
                  .diagram-layer {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                    width: 100%;
                    position: relative;
                  }
                  
                  .diagram-component {
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border: 2px solid #6366f1;
                    border-radius: 8px;
                    padding: 8px 12px;
                    min-width: 80px;
                    text-align: center;
                    font-weight: 600;
                    color: #1e293b;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                    position: relative;
                    font-size: 13px;
                  }
                  
                  .diagram-component:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                  }
                  
                  .diagram-component.database {
                    border-color: #10b981;
                    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
                  }
                  
                  .diagram-component.api {
                    border-color: #f59e0b;
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                  }
                  
                  .diagram-component.frontend {
                    border-color: #ec4899;
                    background: linear-gradient(135deg, #fdf2f8, #fce7f3);
                  }
                  
                  .diagram-arrow {
                    position: absolute;
                    color: #6366f1;
                    font-size: 24px;
                    font-weight: bold;
                  }
                  
                  .diagram-arrow.down {
                    bottom: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                  }
                  
                  .diagram-arrow.right {
                    right: -24px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 16px;
                  }
                  
                  /* Organizational Chart */
                  .org-chart {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    margin: 16px 0;
                    padding: 12px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 12px;
                  }
                  
                  .org-level {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    position: relative;
                    flex-wrap: wrap;
                  }
                  
                  .org-level-compact {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin: 4px 0;
                  }
                  
                  .org-role {
                    background: white;
                    border: 2px solid #6366f1;
                    border-radius: 8px;
                    padding: 8px 12px;
                    text-align: center;
                    min-width: 70px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1e293b;
                  }
                  
                  .org-role:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                  }
                  
                  .org-role.manager {
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    border-color: #3b82f6;
                  }
                  
                  .org-role.developer {
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                    border-color: #10b981;
                  }
                  
                  .org-role.designer {
                    background: linear-gradient(135deg, #fdf2f8, #fce7f3);
                    border-color: #ec4899;
                  }
                  
                  /* Process Flow Diagram */
                  .process-flow {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin: 16px 0;
                    padding: 12px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 12px;
                  }
                  
                  .process-step {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    background: white;
                    border-radius: 8px;
                    border-left: 3px solid #6366f1;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                  }
                  
                  .process-step:hover {
                    transform: translateX(2px);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                  }
                  
                  .process-number {
                    width: 24px;
                    height: 24px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 12px;
                    flex-shrink: 0;
                  }
                  
                  .process-content {
                    flex: 1;
                  }
                  
                  .process-title {
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 2px;
                    font-size: 14px;
                  }
                  
                  .process-description {
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.4;
                  }
                  
                  /* Data Flow Diagram */
                  .data-flow {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    gap: 12px;
                    margin: 16px 0;
                    padding: 12px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 12px;
                    position: relative;
                    max-width: 100%;
                    overflow: hidden;
                  }
                  
                  .data-node {
                    background: white;
                    border: 2px solid #6366f1;
                    border-radius: 8px;
                    padding: 8px 12px;
                    text-align: center;
                    font-weight: 600;
                    font-size: 13px;
                    min-height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                  }
                  
                  .data-node:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                  }
                  
                  .data-node.input {
                    border-color: #10b981;
                    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
                  }
                  
                  .data-node.process {
                    border-color: #f59e0b;
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                  }
                  
                  .data-node.output {
                    border-color: #ec4899;
                    background: linear-gradient(135deg, #fdf2f8, #fce7f3);
                  }
                  
                  /* Advanced Grid Flow Layout */
                  .advanced-flow-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    grid-template-rows: repeat(3, auto);
                    gap: 8px;
                    margin: 16px 0;
                    padding: 12px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 12px;
                    position: relative;
                  }
                  
                  .flow-node {
                    background: white;
                    border: 2px solid #6366f1;
                    border-radius: 6px;
                    padding: 6px 10px;
                    text-align: center;
                    font-size: 12px;
                    font-weight: 600;
                    color: #1e293b;
                    min-height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    z-index: 1;
                  }
                  
                  .flow-node:hover {
                    transform: scale(1.02);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                    z-index: 2;
                  }
                  
                  /* Grid positioning for complex flows */
                  .flow-node.start { grid-column: 1; grid-row: 2; }
                  .flow-node.decision { grid-column: 2; grid-row: 2; }
                  .flow-node.process-a { grid-column: 3; grid-row: 1; }
                  .flow-node.process-b { grid-column: 3; grid-row: 3; }
                  .flow-node.end { grid-column: 4; grid-row: 2; }
                  
                  /* Connection lines for grid flow */
                  .flow-connection {
                    position: absolute;
                    height: 2px;
                    background: #6366f1;
                    z-index: 0;
                  }
                  
                  .flow-connection.horizontal {
                    width: calc(25% - 4px);
                    top: 50%;
                    transform: translateY(-50%);
                  }
                  
                  .flow-connection.vertical {
                    width: 2px;
                    height: calc(33.33% - 4px);
                    left: 50%;
                    transform: translateX(-50%);
                  }
                  
                  /* Metrics Dashboard Flex Layouts */
                  .metrics-dashboard {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin: 16px 0;
                    padding: 12px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 12px;
                  }
                  
                  .metric-card {
                    display: flex;
                    flex-direction: column;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    min-width: 100px;
                    flex: 1;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                    text-align: center;
                  }
                  
                  .metric-card:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                  }
                  
                  .metric-title {
                    font-size: 11px;
                    font-weight: 600;
                    color: #64748b;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                  }
                  
                  .metric-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 2px;
                  }
                  
                  .metric-trend {
                    font-size: 10px;
                    color: #10b981;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  
                  .metric-trend.negative {
                    color: #ef4444;
                  }
                  
                  .metric-trend::before {
                    content: '↗';
                    margin-right: 2px;
                  }
                  
                  .metric-trend.negative::before {
                    content: '↘';
                  }
                  
                  /* Scrollbar Styling */
                  .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                  }
                  
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                  
                  /* Tab Animations */
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  
                  .animate-in {
                    animation: fadeIn 0.2s ease-out;
                  }
                  
                  .fade-in-50 {
                    animation-duration: 0.3s;
                  }
                  
                  /* Mobile Tab Responsiveness */
                  @media (max-width: 768px) {
                    .tab-scroll-container {
                      padding: 0 16px;
                    }
                    
                    .tab-trigger-mobile {
                      min-width: 100px !important;
                      padding: 8px 12px !important;
                      font-size: 13px !important;
                    }
                    
                    .tab-trigger-mobile span {
                      max-width: 80px !important;
                    }
                  }
                  
                  /* Enhanced Tab Shadows */
                  .tab-content-shadow {
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                  }
                  
                  .tab-content-shadow:hover {
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                  }
                  
                  /* Modern Section Headers */
                  h1, h2, h3, h4, h5, h6 {
                    color: #1e293b;
                    margin: 24px 0 16px 0;
                    font-weight: 700;
                    line-height: 1.2;
                    position: relative;
                  }
                  
                  h1 {
                    font-size: 2.2rem;
                    color: transparent;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
                    background-clip: text;
                    -webkit-background-clip: text;
                    border-bottom: 3px solid transparent;
                    border-image: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899) 1;
                    padding-bottom: 12px;
                    margin-bottom: 24px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                  }
                  
                  h2 {
                    font-size: 1.6rem;
                    color: #6366f1;
                    position: relative;
                    padding: 16px 0 16px 24px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 12px;
                    border: 2px solid #e2e8f0;
                    margin: 24px 0 20px 0;
                    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1);
                  }
                  
                  h2:before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 6px;
                    background: linear-gradient(to bottom, #6366f1, #8b5cf6, #ec4899);
                    border-radius: 0 12px 12px 0;
                  }
                  
                  h2:after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
                    border-radius: 12px 12px 0 0;
                  }
                  
                  h3 {
                    font-size: 1.3rem;
                    color: #6366f1;
                    position: relative;
                    padding-left: 20px;
                    margin: 20px 0 12px 0;
                  }
                  
                  h3:before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: linear-gradient(to bottom, #6366f1, #8b5cf6);
                    border-radius: 2px;
                  }
                  
                  /* Modern Content Sections */
                  .section-container {
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border: 2px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 24px;
                    margin: 20px 0;
                    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
                    position: relative;
                    overflow: hidden;
                  }
                  
                  .section-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
                  }
                  
                  /* Enhanced List Styling */
                  ul, ol {
                    margin: 16px 0;
                    padding-left: 0;
                  }
                  
                  li {
                    margin: 8px 0;
                    padding: 12px 16px 12px 40px;
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    position: relative;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.05);
                  }
                  
                  li:hover {
                    transform: translateX(4px);
                    box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.15);
                    border-color: #6366f1;
                  }
                  
                  li:before {
                    content: '';
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 8px;
                    height: 8px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border-radius: 50%;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
                  }
                  
                  /* Enhanced Paragraph Styling */
                  p {
                    margin: 12px 0;
                    line-height: 1.6;
                    color: #374151;
                    font-size: 14px;
                  }
                  
                  /* Strong and emphasis styling */
                  strong, b {
                    color: #6366f1;
                    font-weight: 700;
                  }
                  
                  em, i {
                    color: #8b5cf6;
                    font-style: italic;
                  }
                  
                  /* Modern Section Content Display */
                  .modern-section-content {
                    font-size: 14px;
                    line-height: 1.6;
                    color: #374151;
                  }
                  
                  .enhanced-content-display {
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);
                  }
                  
                  .enhanced-content-display h1 {
                    font-size: 1.8rem;
                    color: transparent;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    background-clip: text;
                    -webkit-background-clip: text;
                    margin-bottom: 16px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  }
                  
                  .enhanced-content-display h2 {
                    font-size: 1.4rem;
                    color: #6366f1;
                    margin: 20px 0 12px 0;
                    padding: 12px 0 12px 20px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 8px;
                    border-left: 4px solid #6366f1;
                    font-weight: 600;
                  }
                  
                  .enhanced-content-display h3 {
                    font-size: 1.2rem;
                    color: #6366f1;
                    margin: 16px 0 8px 0;
                    padding-left: 16px;
                    border-left: 3px solid #8b5cf6;
                    font-weight: 600;
                  }
                  
                  .enhanced-content-display p {
                    margin: 12px 0;
                    line-height: 1.6;
                    color: #374151;
                  }
                  
                  .enhanced-content-display ul,
                  .enhanced-content-display ol {
                    margin: 16px 0;
                    padding-left: 0;
                  }
                  
                  .enhanced-content-display li {
                    margin: 8px 0;
                    padding: 10px 16px 10px 36px;
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    position: relative;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                  }
                  
                  .enhanced-content-display li:hover {
                    transform: translateX(2px);
                    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
                    border-color: #6366f1;
                  }
                  
                  .enhanced-content-display li:before {
                    content: '';
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 6px;
                    height: 6px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border-radius: 50%;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
                  }
                  
                  /* Enhanced Architecture Diagrams */
                  .enhanced-content-display .architecture-diagram {
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border: 2px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 24px;
                    margin: 20px 0;
                    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
                    position: relative;
                    overflow: hidden;
                  }
                  
                  .enhanced-content-display .architecture-diagram::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
                  }
                  
                  /* Enhanced Flow Charts */
                  .enhanced-content-display .flowchart {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin: 16px 0;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);
                  }
                  
                  .enhanced-content-display .flow-step {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 12px;
                    font-weight: 600;
                    position: relative;
                    min-width: 120px;
                    text-align: center;
                    box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3);
                    transition: all 0.3s ease;
                    font-size: 14px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                  }
                  
                  .enhanced-content-display .flow-step:hover {
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 8px 25px -5px rgba(99, 102, 241, 0.4);
                    border-color: rgba(255, 255, 255, 0.4);
                  }
                  
                  .enhanced-content-display .flow-step:not(:last-child):after {
                    content: '';
                    position: absolute;
                    right: -20px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 0;
                    height: 0;
                    border-top: 10px solid transparent;
                    border-bottom: 10px solid transparent;
                    border-left: 14px solid #6366f1;
                    z-index: 10;
                  }
                  
                  .enhanced-content-display .flow-step:not(:last-child):before {
                    content: '';
                    position: absolute;
                    right: -18px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 14px;
                    height: 3px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6);
                    border-radius: 2px;
                    z-index: 9;
                  }
                  
                  /* Enhanced Section Dividers */
                  .enhanced-content-display .section-divider {
                    display: flex;
                    align-items: center;
                    margin: 24px 0;
                    position: relative;
                  }
                  
                  .enhanced-content-display .section-divider::before {
                    content: '';
                    flex: 1;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent);
                  }
                  
                  .enhanced-content-display .section-divider-text {
                    padding: 0 20px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3);
                  }
                  
                  /* Enhanced Diagram Boxes */
                  .enhanced-content-display .diagram-box {
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    position: relative;
                    min-height: 80px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    margin: 8px;
                  }
                  
                  .enhanced-content-display .diagram-box::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6);
                    border-radius: 12px 12px 0 0;
                  }
                  
                  .enhanced-content-display .diagram-box:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.15);
                    border-color: #6366f1;
                  }
                  
                  .enhanced-content-display .diagram-box.primary {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    border-color: #4f46e5;
                  }
                  
                  .enhanced-content-display .diagram-box.secondary {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    border-color: #047857;
                  }
                  
                  .enhanced-content-display .diagram-box.accent {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    border-color: #b45309;
                  }
                  
                  .enhanced-content-display .diagram-title {
                    font-size: 14px;
                    font-weight: 700;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  }
                  
                  .enhanced-content-display .diagram-subtitle {
                    font-size: 11px;
                    opacity: 0.8;
                    font-weight: 500;
                  }
                  
                  /* Enhanced Tables */
                  .enhanced-content-display table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 20px 0;
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 6px 20px -5px rgba(0, 0, 0, 0.1);
                    border: 2px solid #e2e8f0;
                  }
                  
                  .enhanced-content-display table::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
                  }
                  
                  .enhanced-content-display th,
                  .enhanced-content-display td {
                    padding: 14px 18px;
                    text-align: left;
                    border-bottom: 1px solid #e2e8f0;
                    transition: all 0.2s ease;
                  }
                  
                  .enhanced-content-display th {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    font-weight: 700;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  }
                  
                  .enhanced-content-display td {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(10px);
                  }
                  
                  .enhanced-content-display tr:hover td {
                    background: rgba(99, 102, 241, 0.05);
                    transform: translateY(-1px);
                  }
                </style>
              </head>
              <body>
                ${sectionHtml}
                
                <script>
                  // Auto-adjust iframe height to exact content size
                  function adjustHeight() {
                    // Force layout recalculation
                    document.body.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                    document.documentElement.style.overflow = 'hidden';
                    
                    // Force a reflow
                    document.body.offsetHeight;
                    
                    // Get precise measurements of all content
                    const body = document.body;
                    const html = document.documentElement;
                    
                    // Calculate the actual content bounds
                    const rect = body.getBoundingClientRect();
                    const bodyHeight = body.scrollHeight;
                    const bodyOffset = body.offsetHeight;
                    const htmlHeight = html.scrollHeight;
                    const htmlClient = html.clientHeight;
                    
                    // Find the last element to determine true bottom
                    const allElements = document.querySelectorAll('*');
                    let maxBottom = 0;
                    
                    allElements.forEach(el => {
                      const elementRect = el.getBoundingClientRect();
                      const elementBottom = elementRect.bottom;
                      if (elementBottom > maxBottom) {
                        maxBottom = elementBottom;
                      }
                    });
                    
                    // Calculate precise height using multiple methods
                    const heights = [
                      bodyHeight,
                      bodyOffset,
                      htmlHeight,
                      Math.ceil(maxBottom),
                      rect.height
                    ];
                    
                    // Use the maximum height that represents actual content
                    const contentHeight = Math.max(...heights.filter(h => h > 0));
                    
                    // Add minimal buffer (2px) to prevent any cutoff
                    const finalHeight = contentHeight + 2;
                    
                    window.parent.postMessage({
                      type: 'resize',
                      height: finalHeight
                    }, '*');
                    
                    console.log('Precise height calculated:', {
                      bodyHeight,
                      bodyOffset,
                      htmlHeight,
                      maxBottom: Math.ceil(maxBottom),
                      rectHeight: rect.height,
                      finalHeight
                    });
                  }
                  
                  // Multiple precise adjustment attempts
                  function performAdjustments() {
                    adjustHeight();
                    setTimeout(adjustHeight, 10);
                    setTimeout(adjustHeight, 50);
                    setTimeout(adjustHeight, 150);
                    setTimeout(adjustHeight, 300);
                    setTimeout(adjustHeight, 600);
                    setTimeout(adjustHeight, 1200);
                  }
                  
                  // Start adjustments when DOM is ready
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', performAdjustments);
                  } else {
                    performAdjustments();
                  }
                  
                  // Adjust on load
                  window.addEventListener('load', () => {
                    setTimeout(performAdjustments, 100);
                  });
                  
                  // Watch for any content changes
                  if (window.ResizeObserver) {
                    const observer = new ResizeObserver(() => {
                      setTimeout(adjustHeight, 10);
                    });
                    observer.observe(document.body);
                    observer.observe(document.documentElement);
                  }
                  
                  // Watch for dynamic content changes
                  if (window.MutationObserver) {
                    const mutationObserver = new MutationObserver(() => {
                      setTimeout(adjustHeight, 10);
                    });
                    mutationObserver.observe(document.body, {
                      childList: true,
                      subtree: true,
                      attributes: true
                    });
                  }
                </script>
              </body>
              </html>
            `;
            
            const blob = new Blob([enhancedHtml], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            return (
              <div key={`section-${index}`} className="bg-white border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">
                      {index + 1}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{sectionTitle}</h3>
                  </div>
                </div>
                <div className="p-0">
                  <iframe
                    src={blobUrl}
                    className="w-full border-0 block"
                    style={{
                      height: '200px', // Initial small height
                      backgroundColor: '#ffffff',
                      margin: 0,
                      padding: 0,
                      display: 'block'
                    }}
                    title={sectionTitle}
                    sandbox="allow-same-origin allow-scripts"
                    onLoad={(e) => {
                      const iframe = e.target as HTMLIFrameElement;
                      
                      // Precise height adjustment handler
                      const handleMessage = (event: MessageEvent) => {
                        if (event.data.type === 'resize' && event.source === iframe.contentWindow) {
                          const newHeight = Math.max(event.data.height, 50);
                          
                          // Apply height immediately
                          iframe.style.height = `${newHeight}px`;
                          
                          // Force layout recalculation
                          iframe.offsetHeight;
                          
                          console.log(`Iframe height adjusted to: ${newHeight}px`);
                        }
                      };
                      
                      // Direct height adjustment for same-origin content
                      const adjustHeightDirect = () => {
                        try {
                          if (iframe.contentDocument) {
                            const body = iframe.contentDocument.body;
                            const html = iframe.contentDocument.documentElement;
                            
                            // Get all possible measurements
                            const measurements = [
                              body.scrollHeight,
                              body.offsetHeight,
                              html.scrollHeight,
                              html.offsetHeight,
                              html.clientHeight
                            ].filter(h => h > 0);
                            
                            if (measurements.length > 0) {
                              const height = Math.max(...measurements);
                              iframe.style.height = `${height + 2}px`;
                              console.log(`Direct height adjustment: ${height + 2}px`);
                            }
                          }
                        } catch (error) {
                          // Expected for blob URLs - will use message-based approach
                        }
                      };
                      
                      window.addEventListener('message', handleMessage);
                      
                      // Try direct adjustment first, then rely on message-based
                      setTimeout(adjustHeightDirect, 50);
                      setTimeout(adjustHeightDirect, 200);
                      
                      // Clean up
                      setTimeout(() => {
                        URL.revokeObjectURL(blobUrl);
                        window.removeEventListener('message', handleMessage);
                      }, 5000);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // If not HTML, render as markdown with modern styling
    return (
      <div className="space-y-6">
        {cleanedContent.split('\n').map((line, index) => {
          const trimmedLine = line.trim();
          
          if (!trimmedLine) return null;
          
          // Clean markdown symbols and format content
          let cleanLine = trimmedLine
            .replace(/^\*\s+/, '')
            .replace(/^\-\s+/, '')
            .replace(/^#+\s+/, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1');
          
          if (!cleanLine) return null;
          
          // Format section headers
          if (trimmedLine.startsWith('# ')) {
            return (
              <div key={`h1-${index}`} className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200">
                  {cleanLine}
                </h1>
              </div>
            );
          }
          
          if (trimmedLine.startsWith('## ')) {
            return (
              <div key={`h2-${index}`} className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                  <h2 className="text-2xl font-semibold text-gray-900">{cleanLine}</h2>
                </div>
              </div>
            );
          }
          
          if (trimmedLine.startsWith('### ')) {
            return (
              <div key={`h3-${index}`} className="mb-4">
                <h3 className="text-xl font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {cleanLine}
                </h3>
              </div>
            );
          }
          
          // Format bullet points
          if (trimmedLine.match(/^[\*\-]\s+/)) {
            return (
              <div key={`bullet-${index}`} className="flex items-start gap-3 mb-3 ml-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 leading-relaxed">{cleanLine}</span>
              </div>
            );
          }
          
          // Format numbered lists
          if (trimmedLine.match(/^\d+\./)) {
            const number = trimmedLine.match(/^(\d+)/)?.[1];
            return (
              <div key={`numbered-${index}`} className="flex items-start gap-4 mb-4 ml-2">
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
              <div key={`keyvalue-${index}`} className="mb-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <span className="font-semibold text-blue-800">{key.trim()}:</span>
                {value && <span className="text-gray-700 ml-2">{value}</span>}
              </div>
            );
          }
          
          // Regular paragraphs
          return (
            <p key={`paragraph-${index}`} className="text-gray-700 mb-4 leading-relaxed">
              {cleanLine}
            </p>
          );
        })}
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
                      <p className="text-sm text-purple-600">Choose between standard, enhanced 10-section, or comprehensive planning</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="enhanced-planner"
                          checked={useEnhancedPlanner}
                          onCheckedChange={(checked) => setUseEnhancedPlanner(checked as boolean)}
                        />
                        <label htmlFor="enhanced-planner" className="text-sm font-medium text-purple-700 cursor-pointer">
                          Enhanced 10-Section Plan
                        </label>
                      </div>
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
                      {useEnhancedPlanner ? (
                        <div>
                          <strong>Enhanced 10-Section Plan:</strong> Generates dedicated sections for Executive Summary, Technical Architecture, Feature Specifications, Development Methodology, UX Design, Quality Assurance, DevOps Strategy, Risk Management, Stakeholder Management, and Post-Launch Strategy with individual API calls for each section.
                        </div>
                      ) : useAdvancedAgent ? (
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
                
                {/* Enhanced Progress Tracker for 10-Section Plan */}
                {isGeneratingEnhanced && (
                  <div className="mb-6">
                    <EnhancedProgressTracker 
                      progress={enhancedProgress}
                      sections={enhancedSections}
                    />
                  </div>
                )}

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
                  onClick={handleGenerateEnhancedPlan}
                  disabled={!projectInput.trim() || isGeneratingDynamic || isGeneratingPlan || isGeneratingSuggestions || isGeneratingEnhanced}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-sm"
                >
                  {isGeneratingDynamic || isGeneratingEnhanced ? (
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
                      Generate Plan ({projectSectionsSettings.filter(s => s.enabled).length} sections)
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
                  <ProjectSectionsSettings 
                    sections={projectSectionsSettings}
                    onSectionsChange={setProjectSectionsSettings}
                  />
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
                <div className="space-y-4 mt-[24px] mb-[24px]">
                  {/* Modern Header with Actions */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mt-[20px] mb-[20px]">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Project Sections</h3>
                          <p className="text-xs text-gray-500">
                            {projectSectionsSettings.filter(s => s.enabled).length} of {projectSectionsSettings.length} enabled
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProjectSectionsSettings 
                          sections={projectSectionsSettings}
                          onSectionsChange={setProjectSectionsSettings}
                        />
                        <Button
                          onClick={handleGenerateEnhancedPlan}
                          disabled={!projectInput.trim() || isGeneratingEnhanced || isGeneratingPlan}
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm text-xs"
                        >
                          {isGeneratingEnhanced ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              Generate All
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Enhanced Progress Tracker */}
                    {isGeneratingEnhanced && (
                      <div className="mb-4">
                        <EnhancedProgressTracker 
                          progress={enhancedProgress}
                          sections={enhancedSections}
                        />
                      </div>
                    )}


                  </div>
                  
                  {/* Combined Project Plan Content */}
                  {(enhancedSections && enhancedSections.length > 0 && enhancedSections.some(s => s.content)) || projectPlan ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="border-b border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Project Plan Sections</h3>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={downloadPDF}
                              variant="outline"
                              size="sm"
                              disabled={isDownloadingPdf}
                              className="text-xs"
                            >
                              {isDownloadingPdf ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3 mr-1" />
                              )}
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <Tabs 
                          defaultValue={enhancedSections.filter(s => s.content)[0]?.id || (projectPlan ? "generated-plan" : undefined)} 
                          className="w-full"
                          onValueChange={(value) => {
                            // Cancel any active editing when switching tabs
                            if (editingSectionId && activeTabId !== value) {
                              cancelSectionEdit();
                            }
                          }}
                        >
                          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-3 p-4 mb-6 rounded-xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border border-slate-200 shadow-inner">
                            {/* Enhanced Plan Section Tabs */}
                            {enhancedSections.filter(s => s.content).map((section, index) => {
                              const { icon: SectionIcon, description } = getSectionIconAndDescription(section.title);
                              return (
                                <TabsTrigger 
                                  key={section.id} 
                                  value={section.id} 
                                  className="flex flex-col items-center justify-center rounded-xl px-4 py-3 text-sm font-medium ring-offset-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-white hover:shadow-md hover:scale-102 relative group cursor-pointer border-2 border-transparent data-[state=active]:border-blue-300 bg-white/80 backdrop-blur-sm min-w-[120px]"
                                >
                                  <div className="flex flex-col items-center gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <SectionIcon className="w-4 h-4 text-blue-600 group-data-[state=active]:text-white transition-colors duration-300" />
                                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:shadow-sm transition-all duration-300"></div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-slate-700 group-data-[state=active]:text-white transition-colors duration-300 whitespace-normal leading-tight text-xs">
                                        {section.title}
                                      </div>
                                      <div className="text-xs text-slate-500 group-data-[state=active]:text-blue-100 transition-colors duration-300 mt-0.5">
                                        {description}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-20 transition-opacity duration-300"></div>
                                </TabsTrigger>
                              );
                            })}
                            
                            {/* Generated Plan Tab (if exists and no enhanced sections) */}
                            {projectPlan && !enhancedSections.some(s => s.content) && (
                              <TabsTrigger 
                                value="generated-plan"
                                className="flex flex-col items-center justify-center rounded-xl px-4 py-3 text-sm font-medium ring-offset-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-white hover:shadow-md hover:scale-102 relative group cursor-pointer border-2 border-transparent data-[state=active]:border-green-300 bg-white/80 backdrop-blur-sm min-w-[120px]"
                              >
                                <div className="flex flex-col items-center gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-green-600 group-data-[state=active]:text-white transition-colors duration-300" />
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:shadow-sm transition-all duration-300"></div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-semibold text-slate-700 group-data-[state=active]:text-white transition-colors duration-300 whitespace-normal leading-tight text-xs">
                                      Generated Plan
                                    </div>
                                    <div className="text-xs text-slate-500 group-data-[state=active]:text-green-100 transition-colors duration-300 mt-0.5">
                                      Complete Plan
                                    </div>
                                  </div>
                                </div>
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-20 transition-opacity duration-300"></div>
                              </TabsTrigger>
                            )}
                          </TabsList>
                          
                          {/* Enhanced Plan Section Content */}
                          {enhancedSections.filter(s => s.content).map((section) => (
                            <TabsContent key={section.id} value={section.id} className="mt-0 animate-in fade-in-50 duration-200">
                              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                
                                {/* Section Header with Actions */}
                                <div className="border-b border-gray-100 px-6 py-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => openCustomPromptModal(section.id)}
                                        variant="outline"
                                        size="sm"
                                        disabled={isRegeneratingSection}
                                        className="text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Regenerate
                                      </Button>
                                      <Button
                                        onClick={() => startEditingSection(section.id)}
                                        variant="outline"
                                        size="sm"
                                        disabled={editingSectionId === section.id}
                                        className="text-xs"
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-white via-gray-50 to-blue-50/30">
                                  {editingSectionId === section.id && activeTabId === section.id ? (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                            <Edit className="h-4 w-4 text-white" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-blue-800">
                                              Editing Section Content
                                            </p>
                                            <p className="text-xs text-blue-600">
                                              You can use HTML markup or plain text for rich formatting
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={saveSectionEdit}
                                            size="sm"
                                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs shadow-lg border-0"
                                          >
                                            <Save className="h-3 w-3 mr-1" />
                                            Save Changes
                                          </Button>
                                          <Button
                                            onClick={cancelSectionEdit}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                          >
                                            <X className="h-3 w-3 mr-1" />
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      <div className="relative">
                                        <Textarea
                                          value={editedSectionContent}
                                          onChange={(e) => setEditedSectionContent(e.target.value)}
                                          className="min-h-[400px] font-mono text-sm bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl shadow-sm transition-all duration-200 resize-y"
                                          placeholder="Enter content for this section... You can use HTML tags for formatting."
                                        />
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-gray-500 border border-gray-200">
                                          HTML Supported
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                          {editedSectionContent.length} characters
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          HTML markup and plain text supported
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="modern-section-content">
                                      <div 
                                        dangerouslySetInnerHTML={{ __html: section.content }}
                                        className="enhanced-content-display prose prose-sm max-w-none
                                          prose-headings:text-gray-900 prose-headings:font-semibold
                                          prose-p:text-gray-700 prose-p:leading-relaxed
                                          prose-ul:text-gray-700 prose-ol:text-gray-700
                                          prose-li:text-gray-700 prose-li:leading-relaxed
                                          prose-strong:text-gray-900 prose-strong:font-semibold
                                          prose-table:border-collapse prose-table:border-spacing-0
                                          prose-th:bg-gradient-to-r prose-th:from-blue-600 prose-th:to-indigo-600
                                          prose-th:text-white prose-th:font-semibold prose-th:text-left
                                          prose-td:border-b prose-td:border-gray-200 prose-td:bg-white/50
                                          prose-tr:transition-colors prose-tr:hover:bg-blue-50/30
                                          [&_.section-divider]:my-8 [&_.section-divider]:flex [&_.section-divider]:items-center
                                          [&_.section-divider-text]:bg-gradient-to-r [&_.section-divider-text]:from-blue-600 [&_.section-divider-text]:to-indigo-600
                                          [&_.section-divider-text]:text-white [&_.section-divider-text]:px-4 [&_.section-divider-text]:py-2
                                          [&_.section-divider-text]:rounded-full [&_.section-divider-text]:font-medium [&_.section-divider-text]:text-sm
                                          [&_.modern-card]:bg-gradient-to-br [&_.modern-card]:from-white [&_.modern-card]:to-gray-50
                                          [&_.modern-card]:border-2 [&_.modern-card]:border-gray-200 [&_.modern-card]:rounded-xl
                                          [&_.modern-card]:p-6 [&_.modern-card]:my-6 [&_.modern-card]:shadow-lg [&_.modern-card]:hover:shadow-xl
                                          [&_.modern-card]:transition-all [&_.modern-card]:duration-300
                                          [&_.flowchart]:bg-gradient-to-br [&_.flowchart]:from-blue-50 [&_.flowchart]:to-indigo-50
                                          [&_.flowchart]:border-2 [&_.flowchart]:border-blue-200 [&_.flowchart]:rounded-xl
                                          [&_.flowchart]:p-6 [&_.flowchart]:my-6 [&_.flowchart]:shadow-md
                                          [&_.flow-step]:bg-gradient-to-r [&_.flow-step]:from-blue-600 [&_.flow-step]:to-indigo-600
                                          [&_.flow-step]:text-white [&_.flow-step]:font-semibold [&_.flow-step]:px-4 [&_.flow-step]:py-3
                                          [&_.flow-step]:rounded-lg [&_.flow-step]:shadow-lg [&_.flow-step]:hover:shadow-xl
                                          [&_.flow-step]:transition-all [&_.flow-step]:duration-200 [&_.flow-step]:hover:scale-105
                                          [&_.architecture-diagram]:bg-gradient-to-br [&_.architecture-diagram]:from-gray-50 [&_.architecture-diagram]:to-blue-50
                                          [&_.architecture-diagram]:border-2 [&_.architecture-diagram]:border-gray-200 [&_.architecture-diagram]:rounded-xl
                                          [&_.architecture-diagram]:p-6 [&_.architecture-diagram]:my-6 [&_.architecture-diagram]:shadow-lg
                                          [&_.diagram-box]:transition-all [&_.diagram-box]:duration-200 [&_.diagram-box]:hover:scale-105
                                          [&_.diagram-box]:hover:shadow-xl [&_.diagram-box]:cursor-pointer
                                          [&_.tree-structure]:bg-gradient-to-br [&_.tree-structure]:from-gray-50 [&_.tree-structure]:to-blue-50
                                          [&_.tree-structure]:border-2 [&_.tree-structure]:border-gray-200 [&_.tree-structure]:rounded-xl
                                          [&_.tree-structure]:p-6 [&_.tree-structure]:my-6 [&_.tree-structure]:shadow-md
                                          [&_.tree-node]:transition-all [&_.tree-node]:duration-200 [&_.tree-node]:hover:scale-[1.02]
                                          [&_.modern-list_li]:transition-all [&_.modern-list_li]:duration-200 [&_.modern-list_li]:hover:shadow-md
                                          [&_.modern-list_li]:hover:scale-[1.01] [&_.modern-list_li]:hover:bg-blue-50/50
                                        "
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TabsContent>
                          ))}
                          
                          {/* Generated Plan Content (only if no enhanced sections) */}
                          {projectPlan && !enhancedSections.some(s => s.content) && (
                            <TabsContent value="generated-plan" className="mt-0 animate-in fade-in-50 duration-200">
                              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                
                                {/* Section Header with Actions */}
                                <div className="border-b border-gray-100 px-3 py-2">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-gray-900">Complete Generated Plan</h3>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={startEditingPlan}
                                        variant="outline"
                                        size="sm"
                                        disabled={isEditingPlan}
                                        className="text-xs"
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3">
                                  {renderTabbedProjectPlan()}
                                </div>
                              </div>
                            </TabsContent>
                          )}
                        </Tabs>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* BPMN Script Section */}
              {showBpmnScript && generatedBpmnXml && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-md flex items-center justify-center">
                          <Code className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">BPMN 2.0 Script</h3>
                          <p className="text-xs text-gray-600">Export and manage your workflow script</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={copyBpmnScript}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          onClick={downloadBpmnScript}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          onClick={startEditingBpmn}
                          variant="outline"
                          size="sm"
                          disabled={isEditingBpmn}
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    {isEditingBpmn ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">
                            Edit the BPMN XML script. Ensure proper XML syntax before saving.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={saveBpmnEdits}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={cancelBpmnEditing}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                        
                        <Textarea
                          value={editedBpmnScript}
                          onChange={(e) => setEditedBpmnScript(e.target.value)}
                          className="min-h-[300px] font-mono text-xs bg-gray-50 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          placeholder="Edit BPMN XML script..."
                        />
                        
                        <div className="text-xs text-gray-500">
                          {editedBpmnScript.length} characters | Maintain valid BPMN XML structure
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-600">
                          Generated BPMN 2.0 script that powers your visual workflow diagram. Compatible with any BPMN editor.
                        </p>
                        
                        <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                          <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                            {generatedBpmnXml}
                          </pre>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>BPMN 2.0 XML format with swimlanes</span>
                          <span>{generatedBpmnXml.length} characters</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Stakeholder Analysis Section */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-md flex items-center justify-center">
                      <Users className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Stakeholder Analysis</h3>
                      <p className="text-xs text-gray-600">Identify and analyze all project stakeholders with AI-powered insights</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 space-y-3">
                  <div className="text-sm text-gray-600">
                    Generate comprehensive stakeholder analysis including roles, responsibilities, influence levels, and interest mapping for your project.
                  </div>
                  
                  <Button
                    onClick={generateStakeholders}
                    disabled={isGeneratingStakeholders || !projectInput.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg text-sm"
                  >
                    {isGeneratingStakeholders ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Analyzing Stakeholders...
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 mr-2" />
                        Generate Stakeholder Analysis
                      </>
                    )}
                  </Button>

                  {/* Add New Stakeholder */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Add Stakeholder</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newStakeholderName}
                          onChange={(e) => setNewStakeholderName(e.target.value)}
                          placeholder="Enter stakeholder name (e.g., Project Manager, End User, Admin)"
                          className="w-full h-10 rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm transition-all placeholder:text-gray-400"
                          onKeyPress={(e) => e.key === 'Enter' && newStakeholderName.trim() && addStakeholder()}
                        />
                        {newStakeholderName.trim() && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={addStakeholder}
                        disabled={!newStakeholderName.trim()}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 px-6"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      💡 Tip: Press Enter to quickly add stakeholders, or click "Generate AI Suggestions" for ideas
                    </div>
                  </div>

                  {stakeholderNames.length > 0 && (
                    <div className="mt-3">
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/60 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Users className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">Stakeholders</span>
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">{stakeholderNames.length}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {stakeholderNames.map((name, index) => (
                            <div key={index} className="group bg-white/90 backdrop-blur-sm border border-purple-200/60 rounded-xl p-3 hover:bg-white hover:shadow-lg hover:border-purple-300 transition-all duration-300 flex-shrink-0 min-w-[120px]">
                              {editingStakeholderIndex === index ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingStakeholderName}
                                    onChange={(e) => setEditingStakeholderName(e.target.value)}
                                    className="flex-1 h-8 rounded-lg border border-purple-300 bg-white px-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                                    onKeyPress={(e) => e.key === 'Enter' && saveEditingStakeholder()}
                                    placeholder="Enter stakeholder name"
                                    autoFocus
                                  />
                                  <button
                                    onClick={saveEditingStakeholder}
                                    title="Save changes"
                                    className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-all hover:scale-105 shadow-sm"
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={cancelEditingStakeholder}
                                    title="Cancel editing"
                                    className="h-8 w-8 bg-gray-400 hover:bg-gray-500 text-white rounded-lg flex items-center justify-center transition-all hover:scale-105 shadow-sm"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between min-w-0">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex-shrink-0"></div>
                                    <span className="text-sm font-medium text-gray-800 truncate" title={name}>{name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <button
                                      onClick={() => startEditingStakeholder(index)}
                                      title="Edit stakeholder name"
                                      className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-all hover:scale-110 shadow-sm"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => deleteStakeholder(index)}
                                      title="Remove stakeholder"
                                      className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-all hover:scale-110 shadow-sm"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {/* Empty state with helpful message */}
                          {stakeholderNames.length === 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 italic bg-purple-50/50 rounded-lg p-3 border border-dashed border-purple-200">
                              <Users className="h-4 w-4" />
                              <span>No stakeholders added yet. Click "Generate AI Suggestions" or add manually.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Flow Diagram Generation Section */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
                      <Workflow className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Generate Flow Diagram</h3>
                      <p className="text-xs text-gray-600">Create an interactive workflow diagram based on your project</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 space-y-3">
                  <div className="text-sm text-gray-600">
                    Generate detailed user journey flows for all stakeholders identified above. This will analyze how each stakeholder interacts with your application from discovery to goal completion.
                  </div>
                  
                  <Button
                    onClick={generateProjectFlowDiagram}
                    disabled={isGeneratingFlowDiagram || !projectInput.trim() || stakeholderNames.length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg text-sm disabled:from-gray-400 disabled:to-gray-500"
                  >
                    {isGeneratingFlowDiagram ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Analyzing Users...
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 mr-2" />
                        Generate Application Users Analysis
                      </>
                    )}
                  </Button>
                  
                  {stakeholderNames.length === 0 && !isGeneratingFlowDiagram && (
                    <div className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Please add stakeholders in the section above first to generate user analysis.</span>
                      </div>
                    </div>
                  )}
                  
                  {stakeholderNames.length > 0 && !generatedFlowDiagram && (
                    <div className="text-xs text-blue-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Ready to analyze {stakeholderNames.length} stakeholder{stakeholderNames.length > 1 ? 's' : ''}: {stakeholderNames.join(', ')}</span>
                      </div>
                    </div>
                  )}
                  {generatedFlowDiagram && (
                    <div className="mt-6 relative">
                      {/* Modern glassmorphism container */}
                      <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 border border-blue-200/50 rounded-2xl p-6 shadow-xl">
                        {/* Decorative background elements */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-indigo-400/5 to-purple-400/5 rounded-2xl"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-300/10 to-transparent rounded-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-300/10 to-transparent rounded-2xl"></div>
                        
                        {/* Header section */}
                        <div className="relative flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
                              <Workflow className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent">
                                User Journey Flow
                              </h4>
                              <p className="text-sm text-blue-600/80 font-medium">
                                Interactive user experience visualization
                              </p>
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => setShowFlowDiagramEditor(true)}
                              className="group relative px-4 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/50 text-blue-700 hover:bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-300 rounded-xl font-medium text-sm"
                            >
                              <Edit className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                              Edit Flow
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Button>
                            <Button
                              onClick={regenerateFlowDiagram}
                              disabled={isGeneratingFlowDiagram}
                              className="group relative px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium text-sm"
                            >
                              {isGeneratingFlowDiagram ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                              )}
                              {isGeneratingFlowDiagram ? 'Regenerating...' : 'Regenerate'}
                              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Button>
                            <Button
                              onClick={downloadFlowDiagram}
                              className="group relative px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium text-sm"
                            >
                              <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                              Export
                              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Flow diagram container with modern styling */}
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/60 rounded-2xl shadow-2xl backdrop-blur-sm"></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/3 to-purple-500/5 rounded-2xl"></div>
                          <div className="relative bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-inner overflow-hidden" style={{height: '360px'}}>
                            {/* Subtle grid pattern overlay */}
                            <div className="absolute inset-0 opacity-[0.02]" style={{
                              backgroundImage: `radial-gradient(circle at 1px 1px, #3B82F6 1px, transparent 0)`,
                              backgroundSize: '20px 20px'
                            }}></div>
                            
                            <FlowDiagramViewer
                              flowData={generatedFlowDiagram.flowData}
                              title={generatedFlowDiagram.title}
                              className="h-full relative z-10"
                              flowKey="project-flow-diagram"
                              onFlowUpdate={(updatedFlow) => {
                                setGeneratedFlowDiagram({
                                  ...generatedFlowDiagram,
                                  flowData: updatedFlow
                                });
                                localStorage.setItem('project-flow-diagram', JSON.stringify({
                                  ...generatedFlowDiagram,
                                  flowData: updatedFlow
                                }));
                              }}
                            />
                            
                            {/* Hover overlay effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
                          </div>
                        </div>
                        
                        {/* Stats section */}
                        <div className="relative mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-200/30">
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
                              <span className="text-sm font-semibold text-blue-800">
                                {generatedFlowDiagram.flowData.nodes?.length || 0} nodes
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-200/30">
                              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                              <span className="text-sm font-semibold text-indigo-800">
                                {generatedFlowDiagram.flowData.edges?.length || 0} connections
                              </span>
                            </div>
                          </div>
                          
                          {/* Status indicator */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-full border border-emerald-200/50">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-emerald-700">Live & Interactive</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 pt-[14px] pb-[14px] mt-[20px] mb-[20px]">
          <div className="flex flex-col lg:flex-row gap-3 justify-between items-center">
            <Button
              variant="outline"
              onClick={resetPlanner}
              disabled={isGeneratingBpmn || isEnhancing}
              className="border-gray-300 hover:bg-gray-50 w-full lg:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Start Over
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Link href="/market-research" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className={`w-full ${hasMarketResearchData() 
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
              
              <Link href="/user-journey" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
                >
                  <Users className="h-4 w-4 mr-2" />
                  User Journey Flows
                </Button>
              </Link>
            </div>
          </div>
        </div>

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
            </CardContent>
          </Card>
        )}

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
              <div className="mt-3">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b p-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-md flex items-center justify-center">
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                        Sitemap XML Generator
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      <p className="text-gray-600 text-sm">
                        Generate a comprehensive XML sitemap for your project including all suggested pages, 
                        content hierarchy, SEO metadata, and navigation structure.
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={generateSitemap}
                          disabled={isGeneratingSitemap || !projectInput.trim()}
                          className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-sm"
                        >
                          {isGeneratingSitemap ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-2" />
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
                              className="border-teal-300 text-teal-600 hover:bg-teal-50 text-xs"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <Button
                              onClick={downloadSitemapXml}
                              variant="outline"
                              size="sm"
                              className="border-green-300 text-green-600 hover:bg-green-50 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
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

        {/* Action Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 pt-[14px] pb-[14px] mt-[20px] mb-[20px]">
          <div className="flex flex-col lg:flex-row gap-3 justify-between items-center">
            <Button
              variant="outline"
              onClick={resetPlanner}
              disabled={isGeneratingBpmn || isEnhancing}
              className="border-gray-300 hover:bg-gray-50 w-full lg:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Start Over
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Link href="/market-research" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className={`w-full ${hasMarketResearchData() 
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
              
              <Link href="/user-journey" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
                >
                  <Users className="h-4 w-4 mr-2" />
                  User Journey Flows
                </Button>
              </Link>
            </div>
          </div>
        </div>

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
              <div className="mt-3">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b p-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-md flex items-center justify-center">
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                        Sitemap XML Generator
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      <p className="text-gray-600 text-sm">
                        Generate a comprehensive XML sitemap for your project including all suggested pages, 
                        content hierarchy, SEO metadata, and navigation structure.
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={generateSitemap}
                          disabled={isGeneratingSitemap || !projectInput.trim()}
                          className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-sm"
                        >
                          {isGeneratingSitemap ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-2" />
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
                              className="border-teal-300 text-teal-600 hover:bg-teal-50 text-xs"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <Button
                              onClick={downloadSitemapXml}
                              variant="outline"
                              size="sm"
                              className="border-green-300 text-green-600 hover:bg-green-50 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
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
      
      {/* Custom Prompt Regeneration Modal */}
      {showCustomPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                    <Wand2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Regenerate Section</h3>
                    <p className="text-sm text-gray-600">Use AI to regenerate content with custom instructions</p>
                  </div>
                </div>
                <Button
                  onClick={closeCustomPromptModal}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Section Information</span>
                </div>
                <p className="text-sm text-purple-700">
                  {customPromptSectionId && (() => {
                    // For HTML content, extract sections directly from the current content
                    if (projectPlan && (projectPlan.includes('<section') || projectPlan.includes('<!DOCTYPE html>'))) {
                      const sectionPattern = /<section[^>]*>((?:.|\s)*?)<\/section>/gi;
                      let match;
                      while ((match = sectionPattern.exec(projectPlan)) !== null) {
                        const sectionHtml = match[0];
                        const titleMatch = sectionHtml.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
                        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown Section';
                        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        
                        if (id === customPromptSectionId) {
                          return `Regenerating: "${title}"`;
                        }
                      }
                    }
                    
                    // Fallback: just show the section ID
                    return `Regenerating section: ${customPromptSectionId}`;
                  })()}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700">
                  Custom Instructions
                </label>
                <Textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter specific instructions for how you want this section to be regenerated..."
                  className="min-h-[120px] border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500">
                  Example: "Make this more technical and include code examples" or "Focus on cost analysis and budget breakdown"
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Important</span>
                </div>
                <p className="text-sm text-yellow-700">
                  This will completely replace the current section content. The regeneration will maintain the section title but recreate all content based on your instructions.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <Button
                onClick={closeCustomPromptModal}
                variant="outline"
                disabled={isRegeneratingSection}
              >
                Cancel
              </Button>
              <Button
                onClick={() => customPromptSectionId && regenerateSectionWithCustomPrompt(customPromptSectionId, customPrompt)}
                disabled={!customPrompt.trim() || isRegeneratingSection}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isRegeneratingSection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Regenerate Section
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
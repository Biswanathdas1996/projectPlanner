import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Copy, 
  Plus, 
  Trash2, 
  ExternalLink,
  BookOpen,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  GitBranch,
  Zap
} from 'lucide-react';
import { generateCustomSuggestions, generateFlowAnalysis } from '@/lib/gemini';
import { STORAGE_KEYS } from '@/lib/bpmn-utils';
import { NavigationBar } from '@/components/navigation-bar';
import { WorkflowProgress } from '@/components/workflow-progress';

interface UserStory {
  id: string;
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  storyPoints: number;
  epic: string;
  labels: string[];
  gherkinScenarios: GherkinScenario[];
  stakeholder?: string;
  flowType?: string;
}

interface GherkinScenario {
  id: string;
  title: string;
  given: string[];
  when: string[];
  then: string[];
}

interface StakeholderFlow {
  stakeholder: string;
  flowType: string;
  bpmnXml: string;
  customPrompt: string;
}

interface FlowDetails {
  description: string;
  processDescription: string;
  participants: string[];
  trigger: string;
  activities: string[];
  decisionPoints: string[];
  endEvent: string;
  additionalElements: string[];
}

export default function UserStoryGenerator() {
  const [stakeholderFlows, setStakeholderFlows] = useState<StakeholderFlow[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [flowDetails, setFlowDetails] = useState<Record<string, FlowDetails>>({});
  const [isGeneratingUserStories, setIsGeneratingUserStories] = useState(false);
  const [userStoryGenerationProgress, setUserStoryGenerationProgress] = useState<{
    current: number;
    total: number;
    currentFlow: string;
    status: string;
  }>({
    current: 0,
    total: 0,
    currentFlow: '',
    status: ''
  });
  const [showUserStories, setShowUserStories] = useState(true);
  const [jiraConfig, setJiraConfig] = useState({
    projectKey: '',
    issueType: 'Story',
    epicKey: ''
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedFlows = localStorage.getItem(STORAGE_KEYS.STAKEHOLDER_FLOWS);
    if (savedFlows) {
      try {
        setStakeholderFlows(JSON.parse(savedFlows));
      } catch (e) {
        console.error('Error loading stakeholder flows:', e);
      }
    }

    const savedStories = localStorage.getItem('generated_user_stories');
    if (savedStories) {
      try {
        setUserStories(JSON.parse(savedStories));
      } catch (e) {
        console.error('Error loading user stories:', e);
      }
    }

    const savedFlowDetails = localStorage.getItem(STORAGE_KEYS.STAKEHOLDER_FLOW_DATA);
    if (savedFlowDetails) {
      try {
        setFlowDetails(JSON.parse(savedFlowDetails));
      } catch (e) {
        console.error('Error loading flow details:', e);
      }
    }

    const savedProjectDescription = localStorage.getItem(STORAGE_KEYS.PROJECT_DESCRIPTION);
    if (savedProjectDescription) {
      setProjectDescription(savedProjectDescription);
      setProjectName(savedProjectDescription.substring(0, 100));
    }

    const savedProjectPlan = localStorage.getItem(STORAGE_KEYS.PROJECT_PLAN);
    if (savedProjectPlan && !savedProjectDescription) {
      setProjectDescription(savedProjectPlan);
      setProjectName(savedProjectPlan.substring(0, 100));
    }
  }, []);

  // Save user stories to localStorage
  useEffect(() => {
    if (userStories.length > 0) {
      localStorage.setItem('generated_user_stories', JSON.stringify(userStories));
    }
  }, [userStories]);

  // Generate user stories from stakeholder flows based on flow details
  const generateUserStoriesFromFlows = async () => {
    if (stakeholderFlows.length === 0) {
      setError('No stakeholder flows found. Please generate flows first.');
      return;
    }

    setIsGeneratingUserStories(true);
    setError('');
    
    const newUserStories: UserStory[] = [];
    
    // Update progress tracking
    setUserStoryGenerationProgress({
      current: 0,
      total: stakeholderFlows.length,
      currentFlow: '',
      status: 'Starting user story generation...'
    });

    for (let i = 0; i < stakeholderFlows.length; i++) {
      const flow = stakeholderFlows[i];
      const flowKey = `${flow.stakeholder}-${flow.flowType}`;
      const flowDetail = flowDetails[flowKey];
      
      // Update progress
      setUserStoryGenerationProgress({
        current: i + 1,
        total: stakeholderFlows.length,
        currentFlow: `${flow.stakeholder} - ${flow.flowType}`,
        status: `Generating stories for ${flow.stakeholder}...`
      });

      try {
        // Create a comprehensive prompt using both flow details and project context
        const contextualPrompt = `
**Project Context:**
${projectDescription}

**Stakeholder:** ${flow.stakeholder}
**Flow Type:** ${flow.flowType}
**Custom Requirements:** ${flow.customPrompt}

**Flow Details:**
${flowDetail ? `
- Process Description: ${flowDetail.processDescription}
- Participants: ${flowDetail.participants.join(', ')}
- Trigger: ${flowDetail.trigger}
- Key Activities: ${flowDetail.activities.join(', ')}
- Decision Points: ${flowDetail.decisionPoints.join(', ')}
- End Event: ${flowDetail.endEvent}
- Additional Elements: ${flowDetail.additionalElements.join(', ')}
` : 'Using BPMN XML analysis for flow understanding'}

**Task:** Generate 2-4 comprehensive user stories for this stakeholder flow. Each story should be relevant to the specific activities and decision points in the workflow.

**CRITICAL:** Respond with ONLY a valid JSON array. No explanations, no markdown, no text before or after the JSON.

Required JSON format:
[
  {
    "title": "Clear, actionable story title",
    "asA": "specific user role or stakeholder",
    "iWant": "specific functionality or capability",
    "soThat": "clear business value or benefit",
    "acceptanceCriteria": ["testable criteria 1", "testable criteria 2", "testable criteria 3"],
    "priority": "Critical|High|Medium|Low",
    "storyPoints": 1-13,
    "epic": "relevant epic name",
    "labels": ["tag1", "tag2", "tag3"],
    "gherkinScenarios": [
      {
        "title": "scenario description",
        "given": ["precondition 1", "precondition 2"],
        "when": ["action 1", "action 2"],
        "then": ["expected result 1", "expected result 2"]
      }
    ]
  }
]

Generate the JSON array:`;

        const response = await generateCustomSuggestions(contextualPrompt);
        
        try {
          // Process the AI response to extract JSON
          const responseText = Array.isArray(response) ? response.join(' ') : String(response);
          console.log(`Processing response for ${flow.stakeholder} - ${flow.flowType}:`, responseText.substring(0, 200));
          
          // Extract JSON array from response
          let jsonMatch = responseText.match(/\[[\s\S]*?\]/);
          if (!jsonMatch) {
            // Try to find individual JSON objects and wrap them
            const objectMatches = responseText.match(/\{[\s\S]*?\}/g);
            if (objectMatches) {
              jsonMatch = [`[${objectMatches.join(',')}]`];
            }
          }
          
          if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
          }
          
          const generatedStories = JSON.parse(jsonMatch[0]);
          
          // Process and enhance the generated stories
          const processedStories: UserStory[] = generatedStories.map((story: any, index: number) => ({
            id: `story-${flow.stakeholder}-${flow.flowType}-${Date.now()}-${index}`,
            stakeholder: flow.stakeholder,
            flowType: flow.flowType,
            title: story.title || `${flow.stakeholder} ${flow.flowType} Story`,
            asA: story.asA || flow.stakeholder.toLowerCase(),
            iWant: story.iWant || `to complete ${flow.flowType.toLowerCase()}`,
            soThat: story.soThat || 'I can achieve my goals efficiently',
            acceptanceCriteria: Array.isArray(story.acceptanceCriteria) 
              ? story.acceptanceCriteria 
              : ['System functions as expected', 'User receives appropriate feedback'],
            priority: ['Critical', 'High', 'Medium', 'Low'].includes(story.priority) 
              ? story.priority 
              : 'Medium',
            storyPoints: (typeof story.storyPoints === 'number' && story.storyPoints >= 1 && story.storyPoints <= 13) 
              ? story.storyPoints 
              : 3,
            epic: story.epic || `${flow.stakeholder} Workflows`,
            labels: Array.isArray(story.labels) 
              ? story.labels 
              : [flow.stakeholder.toLowerCase(), flow.flowType.toLowerCase()],
            gherkinScenarios: (story.gherkinScenarios || []).map((scenario: any, scenarioIndex: number) => ({
              id: `scenario-${flow.stakeholder}-${Date.now()}-${index}-${scenarioIndex}`,
              title: scenario.title || `${flow.flowType} scenario`,
              given: Array.isArray(scenario.given) ? scenario.given : ['I am authenticated'],
              when: Array.isArray(scenario.when) ? scenario.when : ['I perform the action'],
              then: Array.isArray(scenario.then) ? scenario.then : ['The system responds correctly']
            }))
          }));

          newUserStories.push(...processedStories);
          console.log(`Generated ${processedStories.length} stories for ${flow.stakeholder} - ${flow.flowType}`);
          
        } catch (parseError) {
          console.error(`Error parsing stories for ${flow.stakeholder} - ${flow.flowType}:`, parseError);
          
          // Create intelligent fallback stories based on flow details
          const fallbackStories: UserStory[] = [];
          
          if (flowDetail) {
            // Generate stories based on activities
            flowDetail.activities.slice(0, 2).forEach((activity, index) => {
              fallbackStories.push({
                id: `story-${flow.stakeholder}-${flow.flowType}-fallback-${Date.now()}-${index}`,
                stakeholder: flow.stakeholder,
                flowType: flow.flowType,
                title: `${flow.stakeholder} ${activity}`,
                asA: flow.stakeholder.toLowerCase(),
                iWant: `to ${activity.toLowerCase()}`,
                soThat: 'I can progress through the workflow efficiently',
                acceptanceCriteria: [
                  `${activity} completes successfully`,
                  'Appropriate feedback is provided',
                  'Next steps are clearly indicated'
                ],
                priority: 'Medium' as const,
                storyPoints: 3,
                epic: `${flow.stakeholder} Core Workflows`,
                labels: [flow.stakeholder.toLowerCase(), activity.toLowerCase().replace(/\s+/g, '-')],
                gherkinScenarios: [
                  {
                    id: `scenario-fallback-${Date.now()}-${index}`,
                    title: `${activity} execution`,
                    given: ['I have the necessary permissions', 'The system is available'],
                    when: [`I initiate ${activity.toLowerCase()}`],
                    then: ['The activity completes successfully', 'I receive confirmation']
                  }
                ]
              });
            });
          } else {
            // Basic fallback story
            fallbackStories.push({
              id: `story-${flow.stakeholder}-${flow.flowType}-basic-fallback-${Date.now()}`,
              stakeholder: flow.stakeholder,
              flowType: flow.flowType,
              title: `${flow.stakeholder} ${flow.flowType} Process`,
              asA: flow.stakeholder.toLowerCase(),
              iWant: `to complete the ${flow.flowType.toLowerCase()} process`,
              soThat: 'I can achieve my business objectives',
              acceptanceCriteria: [
                'Process completes within expected timeframe',
                'All required validations pass',
                'Appropriate notifications are sent'
              ],
              priority: 'Medium' as const,
              storyPoints: 5,
              epic: `${flow.stakeholder} Workflows`,
              labels: [flow.stakeholder.toLowerCase(), flow.flowType.toLowerCase()],
              gherkinScenarios: [
                {
                  id: `scenario-basic-fallback-${Date.now()}`,
                  title: `Complete ${flow.flowType.toLowerCase()} process`,
                  given: ['I am authenticated and authorized', 'The system is operational'],
                  when: [`I start the ${flow.flowType.toLowerCase()} process`],
                  then: ['The process completes successfully', 'I receive appropriate confirmation']
                }
              ]
            });
          }

          newUserStories.push(...fallbackStories);
          console.log(`Created ${fallbackStories.length} fallback stories for ${flow.stakeholder} - ${flow.flowType}`);
        }
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing ${flow.stakeholder} - ${flow.flowType}:`, error);
        // Continue with next flow even if one fails
      }
    }

    // Update the user stories state with all generated stories
    setUserStories(prev => {
      // Remove duplicates and merge with existing stories
      const existingIds = new Set(prev.map(story => story.id));
      const uniqueNewStories = newUserStories.filter(story => !existingIds.has(story.id));
      return [...prev, ...uniqueNewStories];
    });

    // Final progress update
    setUserStoryGenerationProgress({
      current: stakeholderFlows.length,
      total: stakeholderFlows.length,
      currentFlow: '',
      status: `Generated ${newUserStories.length} user stories successfully!`
    });

    // Clear progress after delay
    setTimeout(() => {
      setUserStoryGenerationProgress({
        current: 0,
        total: 0,
        currentFlow: '',
        status: ''
      });
    }, 3000);

    setIsGeneratingUserStories(false);
  };

  // Export to JIRA format
  const exportToJira = () => {
    if (userStories.length === 0) {
      setError('No user stories to export');
      return;
    }

    const jiraExport = userStories.map(story => ({
      summary: story.title,
      description: `*User Story:*
As a ${story.asA}, I want ${story.iWant} so that ${story.soThat}.

*Acceptance Criteria:*
${story.acceptanceCriteria.map(criteria => `• ${criteria}`).join('\n')}

*Gherkin Scenarios:*
${story.gherkinScenarios.map(scenario => `
*Scenario:* ${scenario.title}
Given ${scenario.given.join('\nAnd ')}
When ${scenario.when.join('\nAnd ')}
Then ${scenario.then.join('\nAnd ')}
`).join('\n')}`,
      issueType: jiraConfig.issueType,
      project: jiraConfig.projectKey,
      priority: story.priority,
      storyPoints: story.storyPoints,
      epic: jiraConfig.epicKey || story.epic,
      labels: story.labels
    }));

    const blob = new Blob([JSON.stringify(jiraExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jira-user-stories-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export as Gherkin feature files
  const exportGherkinFeatures = () => {
    if (userStories.length === 0) {
      setError('No user stories to export');
      return;
    }

    const features = userStories.map(story => `Feature: ${story.title}

  As a ${story.asA}
  I want ${story.iWant}
  So that ${story.soThat}

  Background:
    Given the system is properly configured
    And the user has appropriate permissions

${story.gherkinScenarios.map(scenario => `  Scenario: ${scenario.title}
    Given ${scenario.given.join('\n    And ')}
    When ${scenario.when.join('\n    And ')}
    Then ${scenario.then.join('\n    And ')}`).join('\n\n')}
`).join('\n\n');

    const blob = new Blob([features], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gherkin-features-${new Date().toISOString().split('T')[0]}.feature`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Remove a user story
  const removeUserStory = (storyId: string) => {
    setUserStories(prev => prev.filter(story => story.id !== storyId));
  };

  // Clear all user stories
  const clearAllStories = () => {
    setUserStories([]);
    localStorage.removeItem('generated_user_stories');
    setGenerationStatus('All user stories cleared');
    setTimeout(() => setGenerationStatus(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar title="User Story Generator" />
      <div className="container mx-auto px-4 py-8 max-w-[1400px]">
        <WorkflowProgress />
        
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Generate comprehensive user stories from your stakeholder flows with AI-powered analysis and Gherkin scenarios
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {generationStatus && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {generationStatus}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate Stories</TabsTrigger>
            <TabsTrigger value="stories">User Stories ({userStories.length})</TabsTrigger>
            <TabsTrigger value="export">Export & JIRA</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Generate from Stakeholder Flows
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stakeholderFlows.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stakeholder flows found. Please generate workflows first in the User Journey page.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4">
                      <Button 
                        onClick={generateUserStoriesFromFlows}
                        disabled={isGeneratingUserStories}
                        className="flex-1"
                      >
                        {isGeneratingUserStories ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        Generate User Stories from All Flows
                      </Button>
                    </div>

                    {/* Progress tracking for comprehensive generation */}
                    {isGeneratingUserStories && userStoryGenerationProgress.total > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Generating User Stories
                          </span>
                          <span className="text-sm text-blue-600 dark:text-blue-300">
                            {userStoryGenerationProgress.current}/{userStoryGenerationProgress.total}
                          </span>
                        </div>
                        <Progress 
                          value={(userStoryGenerationProgress.current / userStoryGenerationProgress.total) * 100}
                          className="mb-2"
                        />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          {userStoryGenerationProgress.currentFlow && (
                            <div>Processing: {userStoryGenerationProgress.currentFlow}</div>
                          )}
                          <div>{userStoryGenerationProgress.status}</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Available Flows:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {stakeholderFlows.map(flow => (
                          <div key={`${flow.stakeholder}-${flow.flowType}`} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {flow.stakeholder}
                            </Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {flow.flowType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories" className="space-y-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Generated User Stories ({userStories.length})
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={() => {
                      const dataStr = JSON.stringify(userStories, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'user-stories.json';
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                  {userStories.length > 0 && (
                    <Button onClick={clearAllStories} variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardTitle>
            </div>

            {userStories.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-500">No user stories generated yet. Go to the Generate tab to create some.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userStories.map((story, index) => (
                  <div key={story.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                    {/* Story Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {story.stakeholder && (
                            <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                              {story.stakeholder}
                            </Badge>
                          )}
                          {story.flowType && (
                            <Badge variant="outline" className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border-purple-200">
                              {story.flowType}
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-1 ${
                              story.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                              story.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              story.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {story.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200">
                            {story.storyPoints} pts
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{story.title}</h3>
                      </div>
                      <Button
                        onClick={() => removeUserStory(story.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* User Story Format */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium text-blue-600">As a</span> {story.asA}, <br/>
                        <span className="font-medium text-green-600">I want</span> {story.iWant}, <br/>
                        <span className="font-medium text-purple-600">So that</span> {story.soThat}
                      </p>
                    </div>

                    {/* Acceptance Criteria */}
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        Acceptance Criteria
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {story.acceptanceCriteria.map((criteria, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2 mt-0.5">•</span>
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Labels and Epic */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Epic:</span>
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {story.epic}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {story.labels.map((label, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0.5">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Gherkin Scenarios */}
                    {story.gherkinScenarios && story.gherkinScenarios.length > 0 && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                          <GitBranch className="h-4 w-4 mr-1 text-blue-500" />
                          Gherkin Scenarios
                        </h4>
                        <div className="space-y-2">
                          {story.gherkinScenarios.map((scenario) => (
                            <div key={scenario.id} className="bg-gray-50 p-3 rounded text-sm">
                              <div className="font-medium text-gray-800 mb-1">{scenario.title}</div>
                              <div className="space-y-1 text-gray-700 font-mono text-xs">
                                {scenario.given.map((given, idx) => (
                                  <div key={idx}><span className="text-blue-600">Given</span> {given}</div>
                                ))}
                                {scenario.when.map((when, idx) => (
                                  <div key={idx}><span className="text-green-600">When</span> {when}</div>
                                ))}
                                {scenario.then.map((then, idx) => (
                                  <div key={idx}><span className="text-purple-600">Then</span> {then}</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  JIRA Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-key">Project Key</Label>
                    <Input
                      id="project-key"
                      placeholder="e.g., PROJ"
                      value={jiraConfig.projectKey}
                      onChange={(e) => setJiraConfig(prev => ({ ...prev, projectKey: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue-type">Issue Type</Label>
                    <Select value={jiraConfig.issueType} onValueChange={(value) => setJiraConfig(prev => ({ ...prev, issueType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Story">Story</SelectItem>
                        <SelectItem value="Task">Task</SelectItem>
                        <SelectItem value="Epic">Epic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="epic-key">Epic Key (Optional)</Label>
                    <Input
                      id="epic-key"
                      placeholder="e.g., PROJ-123"
                      value={jiraConfig.epicKey}
                      onChange={(e) => setJiraConfig(prev => ({ ...prev, epicKey: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={exportToJira}
                    disabled={userStories.length === 0}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to JIRA JSON
                  </Button>
                  <Button 
                    onClick={exportGherkinFeatures}
                    disabled={userStories.length === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export Gherkin Features
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
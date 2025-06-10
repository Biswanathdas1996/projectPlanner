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
  AlertCircle
} from 'lucide-react';
import { generateCustomSuggestions } from '@/lib/gemini';
import { STORAGE_KEYS } from '@/lib/bpmn-utils';
import { NavigationBar } from '@/components/navigation-bar';

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

export default function UserStoryGenerator() {
  const [stakeholderFlows, setStakeholderFlows] = useState<StakeholderFlow[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');
  const [projectName, setProjectName] = useState('');
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

    const savedStories = localStorage.getItem('user_stories');
    if (savedStories) {
      try {
        setUserStories(JSON.parse(savedStories));
      } catch (e) {
        console.error('Error loading user stories:', e);
      }
    }

    const savedProjectName = localStorage.getItem(STORAGE_KEYS.PROJECT_DESCRIPTION);
    if (savedProjectName) {
      setProjectName(savedProjectName.substring(0, 100));
    }
  }, []);

  // Save user stories to localStorage
  useEffect(() => {
    if (userStories.length > 0) {
      localStorage.setItem('user_stories', JSON.stringify(userStories));
    }
  }, [userStories]);

  // Generate user stories from selected stakeholder flow
  const generateUserStoriesFromFlow = async () => {
    if (!selectedFlow) {
      setError('Please select a stakeholder flow first');
      return;
    }

    const flow = stakeholderFlows.find(f => `${f.stakeholder}-${f.flowType}` === selectedFlow);
    if (!flow) {
      setError('Selected flow not found');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGenerationStatus('Analyzing workflow and generating user stories...');

    try {
      const prompt = `Based on the following BPMN workflow for stakeholder "${flow.stakeholder}" with flow type "${flow.flowType}", generate 2-3 user stories in Gherkin format.

BPMN XML: ${flow.bpmnXml}
Custom Requirements: ${flow.customPrompt}

IMPORTANT: Respond ONLY with a valid JSON array. No explanations, no markdown formatting, just the JSON array.

Example format:
[
  {
    "title": "User Login Authentication",
    "asA": "registered user",
    "iWant": "to securely log into my account",
    "soThat": "I can access my personal dashboard",
    "acceptanceCriteria": ["Valid credentials allow access", "Invalid credentials show error message"],
    "priority": "High",
    "storyPoints": 5,
    "epic": "User Management",
    "labels": ["authentication", "security"],
    "gherkinScenarios": [
      {
        "title": "Successful login with valid credentials",
        "given": ["I am on the login page", "I have valid credentials"],
        "when": ["I enter my username and password", "I click the login button"],
        "then": ["I should be redirected to my dashboard", "I should see a welcome message"]
      }
    ]
  }
]

Generate the JSON array now:`;

      const response = await generateCustomSuggestions(prompt);
      
      try {
        // Extract JSON from response - response is string array, join first
        const responseText = Array.isArray(response) ? response.join(' ') : String(response);
        console.log('Raw response:', responseText);
        
        // Try to find JSON array in the response
        let jsonMatch = responseText.match(/\[[\s\S]*?\]/);
        if (!jsonMatch) {
          // Try to find JSON objects and wrap them in an array
          const objectMatches = responseText.match(/\{[\s\S]*?\}/g);
          if (objectMatches) {
            jsonMatch = [`[${objectMatches.join(',')}]`];
          }
        }
        
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }
        
        console.log('Extracted JSON:', jsonMatch[0]);
        const generatedStories = JSON.parse(jsonMatch[0]);
        
        // Add IDs and process stories
        const processedStories: UserStory[] = generatedStories.map((story: any, index: number) => ({
          id: `story-${Date.now()}-${index}`,
          ...story,
          gherkinScenarios: story.gherkinScenarios?.map((scenario: any, scenarioIndex: number) => ({
            id: `scenario-${Date.now()}-${index}-${scenarioIndex}`,
            ...scenario
          })) || []
        }));

        setUserStories(prev => [...prev, ...processedStories]);
        setGenerationStatus(`Generated ${processedStories.length} user stories successfully!`);
        setTimeout(() => setGenerationStatus(''), 3000);
        
      } catch (parseError) {
        console.error('Error parsing generated stories:', parseError);
        
        // Create fallback user stories based on the flow information
        const fallbackStories: UserStory[] = [
          {
            id: `story-${Date.now()}-fallback`,
            title: `${flow.stakeholder} ${flow.flowType} Workflow`,
            asA: flow.stakeholder.toLowerCase(),
            iWant: `to complete the ${flow.flowType.toLowerCase()} process`,
            soThat: "I can achieve my goals efficiently",
            acceptanceCriteria: [
              "The workflow can be initiated successfully",
              "All required steps are completed",
              "The outcome meets expectations"
            ],
            priority: "Medium" as const,
            storyPoints: 5,
            epic: `${flow.stakeholder} Experience`,
            labels: [flow.stakeholder.toLowerCase(), flow.flowType.toLowerCase()],
            gherkinScenarios: [
              {
                id: `scenario-${Date.now()}-fallback`,
                title: `Complete ${flow.flowType} workflow`,
                given: [`I am a ${flow.stakeholder.toLowerCase()}`, "I have access to the system"],
                when: [`I start the ${flow.flowType.toLowerCase()} process`],
                then: ["The workflow should proceed smoothly", "I should reach the desired outcome"]
              }
            ]
          }
        ];
        
        setUserStories(prev => [...prev, ...fallbackStories]);
        setGenerationStatus('Generated fallback user story. AI response parsing failed but basic story created.');
        setTimeout(() => setGenerationStatus(''), 4000);
      }
      
    } catch (error) {
      console.error('Error generating user stories:', error);
      setError('Failed to generate user stories. Please check your API configuration.');
    } finally {
      setIsGenerating(false);
    }
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
    localStorage.removeItem('user_stories');
    setGenerationStatus('All user stories cleared');
    setTimeout(() => setGenerationStatus(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar title="User Story Generator" />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Generate user stories in Gherkin format from your BPMN workflows and export to JIRA
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
                  <div className="space-y-2">
                    <Label htmlFor="flow-select">Select Stakeholder Flow</Label>
                    <Select value={selectedFlow} onValueChange={setSelectedFlow}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a stakeholder flow to generate user stories from" />
                      </SelectTrigger>
                      <SelectContent>
                        {stakeholderFlows.map(flow => (
                          <SelectItem key={`${flow.stakeholder}-${flow.flowType}`} value={`${flow.stakeholder}-${flow.flowType}`}>
                            {flow.stakeholder} - {flow.flowType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={generateUserStoriesFromFlow}
                    disabled={isGenerating || !selectedFlow}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Generate User Stories
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stories" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated User Stories</h2>
            {userStories.length > 0 && (
              <Button onClick={clearAllStories} variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
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
              {userStories.map(story => (
                <Card key={story.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{story.title}</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={story.priority === 'Critical' ? 'destructive' : story.priority === 'High' ? 'default' : 'secondary'}>
                            {story.priority}
                          </Badge>
                          <Badge variant="outline">{story.storyPoints} pts</Badge>
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {story.epic}
                          </Badge>
                        </div>
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
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        As a <span className="font-bold">{story.asA}</span>, I want <span className="font-bold">{story.iWant}</span> so that <span className="font-bold">{story.soThat}</span>.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Acceptance Criteria:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {story.acceptanceCriteria.map((criteria, index) => (
                          <li key={index}>{criteria}</li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Gherkin Scenarios:</h4>
                      <div className="space-y-4">
                        {story.gherkinScenarios.map(scenario => (
                          <div key={scenario.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm">
                            <div className="font-bold text-green-600 dark:text-green-400 mb-2">
                              Scenario: {scenario.title}
                            </div>
                            <div className="space-y-1">
                              {scenario.given.map((step, index) => (
                                <div key={index} className="text-blue-600 dark:text-blue-400">
                                  {index === 0 ? 'Given' : '  And'} {step}
                                </div>
                              ))}
                              {scenario.when.map((step, index) => (
                                <div key={index} className="text-orange-600 dark:text-orange-400">
                                  {index === 0 ? 'When' : ' And'} {step}
                                </div>
                              ))}
                              {scenario.then.map((step, index) => (
                                <div key={index} className="text-purple-600 dark:text-purple-400">
                                  {index === 0 ? 'Then' : ' And'} {step}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {story.labels.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">Labels:</span>
                        {story.labels.map(label => (
                          <Badge key={label} variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                      <SelectItem value="Bug">Bug</SelectItem>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={exportToJira}
                  disabled={userStories.length === 0}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Export to JIRA Format
                </Button>
                <Button
                  onClick={exportGherkinFeatures}
                  disabled={userStories.length === 0}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Gherkin Features
                </Button>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p><strong>JIRA Export:</strong> Creates a JSON file that can be imported into JIRA using CSV/JSON import tools.</p>
                <p><strong>Gherkin Features:</strong> Exports as .feature files for use with Cucumber, SpecFlow, or other BDD frameworks.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
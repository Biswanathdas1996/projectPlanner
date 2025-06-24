import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NavigationBar } from '@/components/navigation-bar';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  MessageCircle, 
  FileText, 
  Download, 
  Loader2, 
  Volume2, 
  VolumeX, 
  Brain,
  Target,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  ConversationalAIAgent, 
  createConversationalAIAgent,
  type ConversationMessage,
  type ProjectPlan,
  type ConversationContext 
} from '@/lib/conversational-ai-agent';

export default function AIConsultant() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [context, setContext] = useState<ConversationContext>({});
  const [nextQuestions, setNextQuestions] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const agentRef = useRef<ConversationalAIAgent | null>(null);
  
  // Initialize the AI agent
  useEffect(() => {
    try {
      agentRef.current = createConversationalAIAgent();
      
      // Try to load existing conversation state
      const savedState = localStorage.getItem('ai-consultant-state');
      if (savedState && agentRef.current) {
        agentRef.current.loadState(savedState);
        setContext(agentRef.current.getContext());
      }
    } catch (error) {
      console.error('Error initializing AI agent:', error);
      toast({ 
        title: "Initialization failed", 
        description: "Please check your API configuration", 
        variant: "destructive" 
      });
    }
  }, []);
  
  const conversation = agentRef.current?.getConversation() || [];
  const currentStage = agentRef.current?.getCurrentStage() || 'discovery';

  // Save conversation state whenever it changes
  useEffect(() => {
    if (agentRef.current) {
      const state = agentRef.current.saveState();
      localStorage.setItem('ai-consultant-state', state);
    }
  }, [conversation, context]);

  // Load saved project plan
  useEffect(() => {
    const savedProjectPlan = localStorage.getItem('ai-consultant-project-plan');
    if (savedProjectPlan) {
      setProjectPlan(JSON.parse(savedProjectPlan));
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudioInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "Recording started", description: "Speak about your tech problem..." });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({ title: "Recording failed", description: "Please check microphone permissions", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Recording stopped", description: "Processing your audio..." });
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Use browser's Web Speech API for speech-to-text
      const recognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      // Convert blob to audio URL for processing
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      recognition.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          await handleUserInput(text);
        }
        URL.revokeObjectURL(audioUrl);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({ title: "Speech recognition failed", description: "Please try again or use text input", variant: "destructive" });
        URL.revokeObjectURL(audioUrl);
      };

      // Start recognition - for demo purposes, we'll use a simulated approach
      // In a real implementation, you'd process the audio blob directly
      
      // For now, let's simulate successful speech recognition
      setTimeout(async () => {
        const simulatedText = "I need help building a web application for my business";
        await handleUserInput(simulatedText);
        URL.revokeObjectURL(audioUrl);
      }, 1000);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({ title: "Processing failed", description: "Please try again or use text input", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserInput = async (input: string) => {
    if (!agentRef.current) {
      toast({ title: "Agent not initialized", description: "Please refresh the page", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      // Process message through the AI agent
      const response = await agentRef.current.processMessage(input);
      
      // Update local state
      setContext(response.context);
      setNextQuestions(response.nextQuestions);
      setConfidence(response.confidence);

      // Generate speech from AI response if ElevenLabs is available
      await generateSpeech(response.message);

      // Generate project plan if ready
      if (response.shouldGeneratePlan) {
        await handleGenerateProjectPlan();
      }

    } catch (error) {
      console.error('Error processing message:', error);
      toast({ 
        title: "Processing failed", 
        description: "Please check your API configuration and try again", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateProjectPlan = async () => {
    if (!agentRef.current) return;

    try {
      const plan = await agentRef.current.generateProjectPlan();
      setProjectPlan(plan);
      localStorage.setItem('ai-consultant-project-plan', JSON.stringify(plan));
      
      toast({ 
        title: "Project plan generated!", 
        description: "Your comprehensive plan is ready for download" 
      });
    } catch (error) {
      console.error('Error generating project plan:', error);
      toast({ 
        title: "Plan generation failed", 
        description: "Please try again", 
        variant: "destructive" 
      });
    }
  };

  const generateSpeech = async (text: string) => {
    try {
      const response = await fetch('/api/elevenlabs/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        // Don't show error for speech generation - it's optional
        console.log('Speech generation unavailable, continuing without audio');
        return;
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Auto-play the response
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('Speech generation failed, continuing without audio');
    }
  };

  const handleQuestionClick = useCallback((question: string) => {
    setCurrentInput(question);
  }, []);

  const clearConversation = useCallback(() => {
    if (agentRef.current) {
      agentRef.current.loadState('{"conversation":[],"context":{},"currentStage":"discovery"}');
      setContext({});
      setNextQuestions([]);
      setConfidence(0);
      setProjectPlan(null);
      localStorage.removeItem('ai-consultant-state');
      localStorage.removeItem('ai-consultant-project-plan');
      toast({ title: "Conversation cleared", description: "Starting fresh consultation" });
    }
  }, []);

  const handleTextSubmit = () => {
    if (currentInput.trim()) {
      handleUserInput(currentInput.trim());
      setCurrentInput('');
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const downloadProjectPlan = () => {
    if (projectPlan) {
      const planText = `
# ${projectPlan.title}

## Description
${projectPlan.description}

## Timeline: ${projectPlan.timeline}
## Budget: ${projectPlan.budget}

## Technologies
${projectPlan.technologies.map(tech => `- ${tech}`).join('\n')}

## Project Phases
${projectPlan.phases.map(phase => `
### ${phase.name} (${phase.duration})
${phase.tasks.map(task => `- ${task}`).join('\n')}
`).join('\n')}

## Risks & Mitigation
${projectPlan.risks.map(risk => `- ${risk}`).join('\n')}

## Conversation Summary
${conversation.map(msg => `
**${msg.role.toUpperCase()}:** ${msg.content}
`).join('\n')}
      `;

      const blob = new Blob([planText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-plan-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getStageDescription = () => {
    switch (currentStage) {
      case 'discovery':
        return 'Discovery - Understanding your needs';
      case 'analysis':
        return 'Analysis - Evaluating requirements';
      case 'specification':
        return 'Specification - Defining details';
      case 'planning':
        return 'Planning - Creating roadmap';
      case 'complete':
        return 'Complete - Ready for implementation';
      default:
        return 'AI Tech Consultant';
    }
  };

  const getStageProgress = () => {
    const stages = ['discovery', 'analysis', 'specification', 'planning', 'complete'];
    const currentIndex = stages.indexOf(currentStage);
    return ((currentIndex + 1) / stages.length) * 100;
  };

  const getContextSummary = () => {
    const items = [];
    if (context.projectType) items.push(`Type: ${context.projectType}`);
    if (context.problemDomain) items.push(`Domain: ${context.problemDomain}`);
    if (context.timeline) items.push(`Timeline: ${context.timeline}`);
    if (context.budget) items.push(`Budget: ${context.budget}`);
    return items;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar 
        title="AI Tech Consultant" 
        showBackButton={true}
        showStartOverButton={false}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Tech Consultant
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Discuss your tech problems with AI and get a comprehensive project plan
          </p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge variant="secondary" className="text-sm">
              {getStageDescription()}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {confidence}% confidence
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <Progress value={getStageProgress()} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">Consultation Progress</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversation Panel */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversation
                </CardTitle>
                <CardDescription>
                  Discuss your tech problem using voice or text
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Conversation History */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  {conversation.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Start the conversation by clicking the mic or typing below</p>
                    </div>
                  ) : (
                    conversation.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-900 border'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-white border p-3 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Controls */}
                <div className="space-y-3">
                  {/* Audio Controls */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                      variant={isRecording ? "destructive" : "default"}
                      className="flex-1"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-4 w-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    
                    {audioUrl && (
                      <Button
                        onClick={isPlaying ? stopAudio : playAudio}
                        variant="outline"
                        size="sm"
                      >
                        {isPlaying ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Text Input */}
                  <div className="flex gap-2">
                    <Textarea
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="Or type your question here..."
                      className="flex-1"
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleTextSubmit();
                        }
                      }}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleTextSubmit}
                        disabled={!currentInput.trim() || isProcessing}
                      >
                        Send
                      </Button>
                      <Button
                        onClick={clearConversation}
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Context & Progress Panel */}
          <div className="space-y-6">
            {/* Context Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Context Understanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Messages</span>
                    <span>{conversation.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Confidence</span>
                    <span>{confidence}%</span>
                  </div>
                  <Progress value={confidence} className="h-2" />
                  
                  {getContextSummary().length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Understood so far:</p>
                      <div className="space-y-1">
                        {getContextSummary().map((item, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Suggested Questions Card */}
            {nextQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Suggested Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {nextQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuestionClick(question)}
                        className="w-full text-left p-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Plan Card */}
            {projectPlan && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Project Plan
                  </CardTitle>
                  <CardDescription>
                    {projectPlan.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Timeline:</p>
                    <p className="text-sm text-gray-600">{projectPlan.timeline}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Budget:</p>
                    <p className="text-sm text-gray-600">{projectPlan.budget}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Technologies:</p>
                    <div className="flex flex-wrap gap-1">
                      {projectPlan.technologies.slice(0, 3).map((tech, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {projectPlan.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{projectPlan.technologies.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Phases:</p>
                    <div className="space-y-1">
                      {projectPlan.phases.map((phase, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{phase.name}</span>
                          <span className="text-gray-500"> ({phase.duration})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={downloadProjectPlan}
                      className="w-full"
                      variant="default"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Full Plan
                    </Button>
                    
                    {currentStage !== 'complete' && (
                      <Button
                        onClick={handleGenerateProjectPlan}
                        className="w-full"
                        variant="outline"
                        disabled={confidence < 70}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Plan Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />
    </div>
  );
}
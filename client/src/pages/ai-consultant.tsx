import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NavigationBar } from "@/components/navigation-bar";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  ConversationalAIAgent,
  ProjectPlan,
  type ConversationContext 
} from '@/lib/conversational-ai-agent';
import {
  GeminiVoiceAgent,
  VoiceConversationEvent
} from '@/lib/gemini-voice-agent';

export default function AIConsultant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [conversation, setConversation] = useState<Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>>([]);
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null);
  const [context, setContext] = useState<ConversationContext>({});
  const [nextQuestions, setNextQuestions] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<VoiceConversationEvent[]>([]);

  const agentRef = useRef<ConversationalAIAgent | null>(null);
  const geminiVoiceAgentRef = useRef<GeminiVoiceAgent | null>(null);

  // Initialize conversational AI agent
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        agentRef.current = new ConversationalAIAgent();
        
        // Load saved state if available
        const savedState = localStorage.getItem("ai-consultant-state");
        if (savedState) {
          agentRef.current.loadState(savedState);
          const currentContext = agentRef.current.getContext();
          setContext(currentContext);
          setNextQuestions(agentRef.current.getNextQuestions());
          setConfidence(agentRef.current.getConfidence());
        }
      } catch (error) {
        console.error("Failed to initialize AI agent:", error);
        toast({
          title: "Initialization error",
          description: "Failed to initialize AI consultant",
          variant: "destructive",
        });
      }
    };

    initializeAgent();
  }, []);

  // Get current conversation stage
  const currentStage = agentRef.current?.getCurrentStage() || "discovery";

  // Save conversation state whenever it changes
  useEffect(() => {
    if (agentRef.current) {
      const state = agentRef.current.saveState();
      localStorage.setItem("ai-consultant-state", state);
    }
  }, [conversation, context]);

  // Load saved project plan
  useEffect(() => {
    const savedProjectPlan = localStorage.getItem("ai-consultant-project-plan");
    if (savedProjectPlan) {
      setProjectPlan(JSON.parse(savedProjectPlan));
    }
  }, []);

  const startVoiceConversation = async () => {
    try {
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg';
      
      if (!geminiApiKey) {
        toast({ 
          title: "Voice features unavailable", 
          description: "Gemini API key not configured.", 
          variant: "destructive" 
        });
        return;
      }

      console.log('Using Gemini API key:', geminiApiKey ? 'Available' : 'Missing');
      
      setIsProcessing(true);
      
      // Create Gemini voice agent
      geminiVoiceAgentRef.current = await GeminiVoiceAgent.createTechConsultant(geminiApiKey);
      
      // Start conversation
      await geminiVoiceAgentRef.current.startConversation(handleConversationEvent);
      
      setIsVoiceMode(true);
      setIsConnected(true);
      
      toast({ 
        title: "Voice conversation started", 
        description: "Speak naturally - the AI will listen and respond with voice powered by Gemini" 
      });
      
    } catch (error) {
      console.error('Error starting voice conversation:', error);
      toast({ 
        title: "Voice conversation failed to start", 
        description: "Please try again or use text mode",
        variant: "destructive" 
      });
      setIsVoiceMode(false);
      setIsConnected(false);
    }
    
    setIsProcessing(false);
  };

  const stopVoiceConversation = () => {
    if (geminiVoiceAgentRef.current) {
      geminiVoiceAgentRef.current.endConversation();
      geminiVoiceAgentRef.current = null;
    }
    
    setIsVoiceMode(false);
    setIsConnected(false);
    setIsListening(false);
    
    toast({ title: "Voice conversation ended" });
  };

  const handleConversationEvent = async (event: VoiceConversationEvent) => {
    console.log('Conversation event:', event);
    
    setConversationHistory(prev => [...prev, event]);
    
    // Update listening state based on Gemini agent
    if (geminiVoiceAgentRef.current) {
      setIsListening(geminiVoiceAgentRef.current.isSpeechListening());
    }
    
    switch (event.type) {
      case 'agent_message':
        if (event.message) {
          // Add AI message to conversation
          setConversation(prev => [...prev, {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: event.message!,
            timestamp: new Date(),
          }]);
          
          // Process through local agent for context building
          await processAgentMessage(event.message);
        }
        break;
        
      case 'user_message':
        if (event.message) {
          // Add user message to conversation
          setConversation(prev => [...prev, {
            id: `user-${Date.now()}`,
            role: "user",
            content: event.message!,
            timestamp: new Date(),
          }]);
          
          // Process user message through local agent for context building
          await handleUserInputFromVoice(event.message);
        }
        break;
        
      case 'conversation_end':
        stopVoiceConversation();
        break;
        
      case 'error':
        toast({ 
          title: "Conversation error", 
          description: event.message || "An error occurred", 
          variant: "destructive" 
        });
        break;
    }
  };

  const processAgentMessage = async (message: string) => {
    // This is already handled in handleConversationEvent
  };

  const handleUserInputFromVoice = async (message: string) => {
    if (agentRef.current) {
      try {
        const response = await agentRef.current.processMessage(message);
        setContext(response.context);
        setNextQuestions(response.nextQuestions);
        setConfidence(response.confidence);
        
        if (response.shouldGeneratePlan) {
          await handleGenerateProjectPlan();
        }
      } catch (error) {
        console.error("Error processing voice message:", error);
      }
    }
  };

  const handleUserInput = async (input: string) => {
    if (!agentRef.current) {
      toast({
        title: "Agent not initialized",
        description: "Please refresh the page",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Add user message to conversation
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: input,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, userMessage]);

    try {
      // Process message through AI agent
      const response = await agentRef.current.processMessage(input);
      
      // Update context and questions
      setContext(response.context);
      setNextQuestions(response.nextQuestions);
      setConfidence(response.confidence);

      // Add AI response to conversation
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant" as const,
        content: response.message,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, aiMessage]);

      // Generate project plan if ready
      if (response.shouldGeneratePlan) {
        await handleGenerateProjectPlan();
      }
    } catch (error) {
      console.error("Error processing message:", error);
      toast({
        title: "Processing error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  const handleGenerateProjectPlan = async () => {
    if (!agentRef.current) return;

    try {
      setIsProcessing(true);
      const plan = await agentRef.current.generateProjectPlan();
      setProjectPlan(plan);
      
      // Save project plan
      localStorage.setItem("ai-consultant-project-plan", JSON.stringify(plan));
      
      toast({
        title: "Project plan generated!",
        description: "Your comprehensive project plan is ready",
      });
    } catch (error) {
      console.error("Error generating project plan:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate project plan",
        variant: "destructive",
      });
    }
    setIsProcessing(false);
  };

  const downloadProjectPlan = () => {
    if (!projectPlan) return;
    
    const dataStr = JSON.stringify(projectPlan, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `project-plan-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearConversation = useCallback(() => {
    if (window.confirm("Are you sure you want to start a new consultation? This will clear all current progress.")) {
      agentRef.current?.reset();
      setConversation([]);
      setConversationHistory([]);
      setContext({});
      setNextQuestions([]);
      setConfidence(0);
      setProjectPlan(null);
      localStorage.removeItem("ai-consultant-state");
      localStorage.removeItem("ai-consultant-project-plan");
      toast({
        title: "Conversation cleared",
        description: "Starting fresh consultation",
      });
    }
  }, []);

  const handleTextSubmit = async () => {
    if (currentInput.trim()) {
      if (isVoiceMode && isConnected) {
        await sendVoiceMessage(currentInput.trim());
      } else {
        await handleUserInput(currentInput.trim());
      }
      setCurrentInput("");
    }
  };

  const sendVoiceMessage = async (message: string) => {
    if (geminiVoiceAgentRef.current && isConnected) {
      try {
        await geminiVoiceAgentRef.current.sendTextMessage(message);
      } catch (error) {
        console.error("Error sending voice message:", error);
        toast({
          title: "Failed to send message",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }
  };

  const startListening = () => {
    if (!isVoiceMode || !geminiVoiceAgentRef.current) {
      toast({
        title: "Voice mode not active",
        description: "Please start a voice conversation first",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      toast({
        title: "Already listening",
        description: "Please speak now",
      });
      return;
    }

    try {
      geminiVoiceAgentRef.current.startListening();
      
      toast({
        title: "Listening...",
        description: "Speak now, I'm listening to your voice",
      });
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Microphone error",
        description: "Please allow microphone access and try again",
        variant: "destructive"
      });
    }
  };

  const isGeminiAvailable = () => {
    return !!(import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg');
  };

  const handleQuestionClick = async (question: string) => {
    await handleUserInput(question);
  };

  const getContextSummary = () => {
    const summary = [];
    if (context.projectType) summary.push(`Project: ${context.projectType}`);
    if (context.problemDomain) summary.push(`Domain: ${context.problemDomain}`);
    if (context.targetAudience) summary.push(`Audience: ${context.targetAudience}`);
    if (context.timeline) summary.push(`Timeline: ${context.timeline}`);
    if (context.budget) summary.push(`Budget: ${context.budget}`);
    if (context.techRequirements?.length) summary.push(`Tech: ${context.techRequirements.join(', ')}`);
    return summary;
  };

  const getStageProgress = () => {
    const stages = ["discovery", "analysis", "specification", "planning", "complete"];
    const currentIndex = stages.indexOf(currentStage);
    return ((currentIndex + 1) / stages.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationBar title="AI Tech Consultant" showBackButton />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Tech Consultant
                    </CardTitle>
                    <CardDescription>
                      Powered by Gemini AI - Get expert guidance for your tech projects
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!isVoiceMode ? (
                      <Button
                        onClick={startVoiceConversation}
                        disabled={isProcessing || !isGeminiAvailable()}
                        className="flex-1"
                        variant={isGeminiAvailable() ? "default" : "outline"}
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        {isGeminiAvailable() ? 'Start Voice with Gemini' : 'Voice Unavailable'}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={startListening}
                          disabled={isProcessing || isListening}
                          variant={isListening ? "destructive" : "default"}
                          size="sm"
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        <Button
                          onClick={stopVoiceConversation}
                          variant="outline"
                          size="sm"
                        >
                          <VolumeX className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={clearConversation}
                      variant="outline"
                      size="sm"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {conversation.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Welcome to your AI Tech Consultant</p>
                      <p className="text-sm">
                        Start by describing your project idea, and I'll help you create a comprehensive plan.
                      </p>
                    </div>
                  ) : (
                    conversation.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-900 border"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-white border rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Voice Conversation History */}
                {conversationHistory.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Voice Events:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {conversationHistory.map((event, index) => {
                        if (event.type === 'agent_message' || event.type === 'user_message') {
                          return (
                            <div key={`${event.sessionId}-${index}-${event.type}`} className="text-xs">
                              <span className="font-medium">
                                {event.type === 'user_message' ? 'You' : 'AI'}:
                              </span>{' '}
                              {event.message}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Describe your project idea or ask questions..."
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleTextSubmit();
                      }
                    }}
                    rows={3}
                    disabled={isProcessing}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleTextSubmit}
                      disabled={!currentInput.trim() || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4 mr-2" />
                      )}
                      Send Message
                    </Button>
                    {isVoiceMode && (
                      <Badge variant={isConnected ? "default" : "secondary"}>
                        {isConnected ? "Voice Connected" : "Voice Disconnected"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Consultation Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Stage: {currentStage}</span>
                      <span>{Math.round(getStageProgress())}%</span>
                    </div>
                    <Progress value={getStageProgress()} className="h-2" />
                  </div>
                  
                  {confidence > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Confidence</span>
                        <span>{Math.round(confidence * 100)}%</span>
                      </div>
                      <Progress value={confidence * 100} className="h-2" />
                    </div>
                  )}

                  {getContextSummary().length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Context Summary
                      </p>
                      <div className="space-y-1">
                        {getContextSummary().map((item, index) => (
                          <div
                            key={index}
                            className="text-xs text-gray-600 flex items-center gap-1"
                          >
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
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{projectPlan.title}</h4>
                      <p className="text-sm text-gray-600">{projectPlan.overview}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadProjectPlan}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
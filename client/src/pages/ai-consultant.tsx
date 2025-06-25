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
import { WorkflowProgress } from "@/components/workflow-progress";

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
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation, isProcessing]);

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

  const summarizeAndCreatePlan = async () => {
    if (conversation.length === 0) {
      toast({
        title: "No conversation to summarize",
        description: "Start chatting first to generate a project plan",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg';
      
      if (!geminiApiKey) {
        toast({
          title: "Unable to generate plan",
          description: "Gemini API key not available",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Prepare conversation summary for Gemini
      const conversationSummary = conversation
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `Based on this conversation with a user about their technology project, create a comprehensive project description and plan:

${conversationSummary}

Generate a detailed project plan in JSON format with the following structure:
{
  "projectTitle": "Brief descriptive title",
  "problemStatement": "Clear problem being solved",
  "targetAudience": "Who will use this",
  "coreFeatures": ["feature1", "feature2", "feature3"],
  "techStack": {
    "frontend": "recommended frontend tech",
    "backend": "recommended backend tech",
    "database": "recommended database",
    "deployment": "recommended deployment platform"
  },
  "timeline": "estimated development time",
  "budget": "estimated budget range",
  "risks": ["risk1", "risk2"],
  "nextSteps": ["step1", "step2", "step3"]
}

Make it specific to the user's requirements discussed in the conversation.`;

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Extract JSON from response
      let projectDescription;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          projectDescription = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback if no JSON found
          projectDescription = {
            projectTitle: "Technology Project",
            problemStatement: "Project discussed in conversation",
            conversationSummary: conversationSummary,
            generatedAt: new Date().toISOString()
          };
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        projectDescription = {
          projectTitle: "Technology Project",
          problemStatement: "Project discussed in conversation",
          conversationSummary: conversationSummary,
          rawResponse: response,
          generatedAt: new Date().toISOString()
        };
      }

      // Store in localStorage
      localStorage.setItem('bpmn-project-description', JSON.stringify(projectDescription));

      toast({
        title: "Project plan generated!",
        description: "Redirecting to start new planning process...",
      });

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = '/start-over';
      }, 1500);

    } catch (error) {
      console.error('Error generating project plan:', error);
      toast({
        title: "Failed to generate plan",
        description: "Please try again",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  const clearConversation = useCallback(() => {
    if (window.confirm("Are you sure you want to start a new consultation? This will clear all current progress.")) {
      // Reset agent if it has a reset method
      if (agentRef.current && typeof agentRef.current.reset === 'function') {
        agentRef.current.reset();
      }
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

  const toggleListening = () => {
    if (!isVoiceMode || !geminiVoiceAgentRef.current) {
      toast({
        title: "Voice mode not active",
        description: "Please start a voice conversation first",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        geminiVoiceAgentRef.current.stopListening();
        setIsListening(false);
        toast({
          title: "Stopped listening",
          description: "Click microphone to start again",
        });
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
      return;
    }

    try {
      geminiVoiceAgentRef.current.startListening();
      setIsListening(true);
      
      toast({
        title: "Listening...",
        description: "Speak now, click again to stop",
      });
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
      
      {/* Header */}
      <div className="relative z-10 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">AI Tech Consultant</h1>
                <p className="text-sm text-gray-400">Powered by Gemini AI</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={summarizeAndCreatePlan}
                disabled={isProcessing || conversation.length === 0}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate Plan & Continue
              </Button>
              <Button
                onClick={clearConversation}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                Clear Session
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Chat Header */}
              <div className="border-b border-gray-700/50 bg-gray-800/30 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium">Active Session</span>
                    {isVoiceMode && (
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        Voice Mode
                      </Badge>
                    )}
                  </div>
                  {!isVoiceMode ? (
                    <Button
                      onClick={startVoiceConversation}
                      disabled={isProcessing || !isGeminiAvailable()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Enable Voice
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={stopVoiceConversation}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                      >
                        <VolumeX className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chat Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 min-h-[500px] max-h-[500px] scroll-smooth"
              >
                {conversation.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Ready to Assist</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Describe your project idea and I'll help you create a comprehensive technology plan
                    </p>
                  </div>
                ) : (
                  conversation.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} group`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                          message.role === "user" 
                            ? "bg-gradient-to-br from-blue-500 to-purple-600" 
                            : "bg-gradient-to-br from-emerald-500 to-teal-600"
                        }`}>
                          {message.role === "user" ? (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          ) : (
                            <Brain className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div
                          className={`px-4 py-3 rounded-2xl backdrop-blur-sm ${
                            message.role === "user"
                              ? "bg-blue-600/90 text-white rounded-br-md"
                              : "bg-gray-800/60 text-gray-100 border border-gray-700/50 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isProcessing && (
                  <div className="flex justify-start group">
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-800/60 border border-gray-700/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                          <span className="text-sm text-gray-300">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-700/50 bg-gray-800/30 p-6">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
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
                      rows={2}
                      disabled={isProcessing}
                      className="bg-gray-900/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl resize-none"
                    />
                  </div>
                  
                  {/* Floating Action Buttons */}
                  <div className="flex gap-2">
                    {isVoiceMode && (
                      <Button
                        onClick={toggleListening}
                        disabled={isProcessing}
                        size="lg"
                        className={`w-12 h-12 rounded-full ${
                          isListening 
                            ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        } border-0 shadow-lg`}
                      >
                        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleTextSubmit}
                      disabled={!currentInput.trim() || isProcessing}
                      size="lg"
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-lg"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <MessageCircle className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Progress Card */}
            <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Progress</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Stage: {currentStage}</span>
                    <span className="text-blue-400">{Math.round(getStageProgress())}%</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getStageProgress()}%` }}
                    />
                  </div>
                </div>
                
                

                {getContextSummary().length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-3 text-white">
                      Context Summary
                    </p>
                    <div className="space-y-2">
                      {getContextSummary().map((item, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-300 flex items-center gap-2"
                        >
                          <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Questions Card */}
            {nextQuestions.length > 0 && (
              <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Suggestions</h3>
                </div>
                
                <div className="space-y-2">
                  {nextQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionClick(question)}
                      className="w-full text-left p-3 text-sm bg-gray-800/50 border border-gray-600/50 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 text-gray-200"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Project Plan Card */}
            {projectPlan && (
              <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Project Plan</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-white">{projectPlan.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{projectPlan.overview}</p>
                  </div>
                  
                  <Button
                    onClick={downloadProjectPlan}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Plan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
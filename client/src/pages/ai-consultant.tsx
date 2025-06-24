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
import { Separator } from "@/components/ui/separator";
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
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  ElevenLabsConversationAgent,
  type ConversationEvent,
  playAudioFromBuffer,
  getUserAudioStream,
} from "@/lib/elevenlabs-conversation-agent";
import { getElevenLabsApiKey, isElevenLabsAvailable } from "@/lib/api-config";
import {
  ConversationalAIAgent,
  createConversationalAIAgent,
  type ConversationMessage,
  type ProjectPlan,
  type ConversationContext,
} from "@/lib/conversational-ai-agent";

export default function AIConsultant() {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null);
  const [context, setContext] = useState<ConversationContext>({});
  const [nextQuestions, setNextQuestions] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<
    VoiceConversationEvent[]
  >([]);

  const agentRef = useRef<ConversationalAIAgent | null>(null);
  const geminiVoiceAgentRef = useRef<GeminiVoiceAgent | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Initialize the AI agents
  useEffect(() => {
    try {
      // Initialize local AI agent for fallback
      agentRef.current = createConversationalAIAgent();

      // Try to load existing conversation state
      const savedState = localStorage.getItem("ai-consultant-state");
      if (savedState && agentRef.current) {
        agentRef.current.loadState(savedState);
        setContext(agentRef.current.getContext());
      }

      // Initialize AudioContext for voice features
      if (typeof window !== "undefined") {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
    } catch (error) {
      console.error("Error initializing AI agent:", error);
      // Don't show error toast, just log it - the system will work in fallback mode
    }
  }, []);

  const conversation = isVoiceMode
    ? conversationHistory
        .filter((e) => e.type === "user_message" || e.type === "agent_message")
        .map((e) => ({
          id: e.sessionId || Date.now().toString(),
          role:
            e.type === "user_message"
              ? ("user" as const)
              : ("assistant" as const),
          content: e.message || "[Voice message]",
          timestamp: e.timestamp,
        }))
    : agentRef.current?.getConversation() || [];

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
      const apiKey = getElevenLabsApiKey();

      if (!apiKey) {
        toast({
          title: "Voice features unavailable",
          description: "ElevenLabs API key not configured.",
          variant: "destructive",
        });
        return;
      }

      console.log(
        "Using ElevenLabs API key:",
        apiKey ? "Available" : "Missing",
      );

      setIsProcessing(true);

      // Create ElevenLabs conversation agent
      elevenLabsAgentRef.current =
        await ElevenLabsConversationAgent.createTechConsultantAgent(apiKey);

      // Start conversation
      await elevenLabsAgentRef.current.startConversation(
        handleConversationEvent,
      );

      // Initialize speech recognition (non-blocking)
      initializeSpeechRecognition().catch((error) => {
        console.error("Speech recognition initialization failed:", error);
      });

      setIsVoiceMode(true);
      setIsConnected(true);

      toast({
        title: "Voice conversation started",
        description:
          "Speak naturally - the AI will listen and respond with voice",
      });
    } catch (error) {
      console.error("Error starting voice conversation:", error);
      toast({
        title: "Voice conversation failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to start voice conversation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const stopVoiceConversation = () => {
    // Stop any ongoing speech
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Stop speech recognition
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }

    if (elevenLabsAgentRef.current) {
      elevenLabsAgentRef.current.endConversation();
      elevenLabsAgentRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsVoiceMode(false);
    setIsConnected(false);
    setIsListening(false);

    toast({ title: "Voice conversation ended" });
  };

  const handleConversationEvent = async (event: ConversationEvent) => {
    console.log("Conversation event:", event);

    setConversationHistory((prev) => [...prev, event]);

    switch (event.type) {
      case "agent_message":
        if (event.audioData && audioContextRef.current) {
          // Play audio response
          try {
            await playAudioFromBuffer(event.audioData, audioContextRef.current);
          } catch (error) {
            console.error("Error playing audio:", error);
          }
        }

        if (event.message) {
          // Update conversation with text version for fallback processing
          await processAgentMessage(event.message);
        }
        break;

      case "user_message":
        if (event.message) {
          // Process user message through local agent for context building
          await handleUserInputFromVoice(event.message);
        }
        break;

      case "conversation_end":
        stopVoiceConversation();
        break;

      case "error":
        toast({
          title: "Conversation error",
          description: event.message || "An error occurred during conversation",
          variant: "destructive",
        });
        break;
    }
  };

  const processAgentMessage = async (message: string) => {
    // Extract insights from agent response to build context
    const insights = extractContextFromMessage(message);
    if (insights) {
      setContext((prev) => ({ ...prev, ...insights }));
    }
  };

  const extractContextFromMessage = (
    message: string,
  ): Partial<ConversationContext> | null => {
    const context: Partial<ConversationContext> = {};
    const lower = message.toLowerCase();

    // Extract project type
    if (lower.includes("web app") || lower.includes("website"))
      context.projectType = "web application";
    if (lower.includes("mobile app"))
      context.projectType = "mobile application";
    if (lower.includes("desktop app"))
      context.projectType = "desktop application";

    // Extract domain
    if (
      lower.includes("ecommerce") ||
      lower.includes("e-commerce") ||
      lower.includes("online store")
    ) {
      context.problemDomain = "e-commerce";
    }
    if (lower.includes("healthcare") || lower.includes("medical"))
      context.problemDomain = "healthcare";
    if (lower.includes("education") || lower.includes("learning"))
      context.problemDomain = "education";

    // Extract timeline mentions
    const timelineMatches = message.match(/(\d+)\s*(week|month|day)s?/gi);
    if (timelineMatches) {
      context.timeline = timelineMatches[0];
    }

    // Extract budget mentions
    const budgetMatches = message.match(/\$[\d,]+/g);
    if (budgetMatches) {
      context.budget = budgetMatches[0];
    }

    return Object.keys(context).length > 0 ? context : null;
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
      console.error("Error processing message:", error);
      toast({
        title: "Processing failed",
        description: "Please check your API configuration and try again",
        variant: "destructive",
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
      localStorage.setItem("ai-consultant-project-plan", JSON.stringify(plan));

      toast({
        title: "Project plan generated!",
        description: "Your comprehensive plan is ready for download",
      });
    } catch (error) {
      console.error("Error generating project plan:", error);
      toast({
        title: "Plan generation failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const generateSpeech = async (text: string) => {
    try {
      const response = await fetch("/api/elevenlabs/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        // Don't show error for speech generation - it's optional
        console.log("Speech generation unavailable, continuing without audio");
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
      console.log("Speech generation failed, continuing without audio");
    }
  };

  const handleQuestionClick = useCallback((question: string) => {
    setCurrentInput(question);
  }, []);

  const clearConversation = useCallback(() => {
    if (agentRef.current) {
      agentRef.current.loadState(
        '{"conversation":[],"context":{},"currentStage":"discovery"}',
      );
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
    if (elevenLabsAgentRef.current && isConnected) {
      try {
        await elevenLabsAgentRef.current.sendTextMessage(message);
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

  const downloadProjectPlan = () => {
    if (projectPlan) {
      const planText = `
# ${projectPlan.title}

## Description
${projectPlan.description}

## Timeline: ${projectPlan.timeline}
## Budget: ${projectPlan.budget}

## Technologies
${projectPlan.technologies.map((tech) => `- ${tech}`).join("\n")}

## Project Phases
${projectPlan.phases
  .map(
    (phase) => `
### ${phase.name} (${phase.duration})
${phase.tasks.map((task) => `- ${task}`).join("\n")}
`,
  )
  .join("\n")}

## Risks & Mitigation
${projectPlan.risks.map((risk) => `- ${risk}`).join("\n")}

## Conversation Summary
${conversation
  .map(
    (msg) => `
**${msg.role.toUpperCase()}:** ${msg.content}
`,
  )
  .join("\n")}
      `;

      const blob = new Blob([planText], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-plan-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getStageDescription = () => {
    switch (currentStage) {
      case "discovery":
        return "Discovery - Understanding your needs";
      case "analysis":
        return "Analysis - Evaluating requirements";
      case "specification":
        return "Specification - Defining details";
      case "planning":
        return "Planning - Creating roadmap";
      case "complete":
        return "Complete - Ready for implementation";
      default:
        return "AI Tech Consultant";
    }
  };

  const getStageProgress = () => {
    const stages = [
      "discovery",
      "analysis",
      "specification",
      "planning",
      "complete",
    ];
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

  const initializeSpeechRecognition = async (): Promise<void> => {
    try {
      // Check if speech recognition is supported
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn("Speech recognition not supported in this browser");
        return;
      }

      const recognition = new SpeechRecognition();

      // Configure speech recognition for better reliability
      recognition.continuous = false; // Single utterance mode
      recognition.interimResults = false; // Only final results
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();

        if (transcript) {
          console.log("User said:", transcript);
          setIsListening(false);

          // Send the voice message to the AI
          if (elevenLabsAgentRef.current && isConnected) {
            elevenLabsAgentRef.current.sendTextMessage(transcript);
          }

          // Add user message to conversation history
          setConversationHistory((prev) => [
            ...prev,
            {
              type: "user_message",
              message: transcript,
              sessionId:
                elevenLabsAgentRef.current?.getSessionId() || "voice-session",
              timestamp: new Date(),
            },
          ]);

          // Also process through local agent for context
          handleUserInputFromVoice(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        if (event.error === "not-allowed") {
          toast({
            title: "Microphone access denied",
            description: "Please allow microphone access to use voice input",
            variant: "destructive",
          });
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;

      // Don't auto-start, let user click the microphone button
      console.log(
        "Speech recognition initialized, ready for manual activation",
      );
    } catch (error) {
      console.error("Failed to initialize speech recognition:", error);
    }
  };

  // Function to start listening manually
  const startListening = () => {
    if (!isVoiceMode) {
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
      if (!speechRecognitionRef.current) {
        console.log("Recreating speech recognition");
        initializeSpeechRecognition();
        return;
      }

      console.log("Starting speech recognition manually");
      speechRecognitionRef.current.start();

      toast({
        title: "Listening...",
        description: "Speak now, I'm listening to your voice",
      });
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast({
        title: "Microphone error",
        description: "Please allow microphone access and try again",
        variant: "destructive",
      });

      // Recreate recognition instance
      initializeSpeechRecognition();
    }
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
            Discuss your tech problems with AI and get a comprehensive project
            plan
          </p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge variant="secondary" className="text-sm">
              {getStageDescription()}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {confidence}% confidence
            </Badge>
            {!isElevenLabsAvailable() && (
              <Badge
                variant="outline"
                className="text-sm text-orange-600 border-orange-300"
              >
                Text Mode Only
              </Badge>
            )}
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
                      <p>
                        Start the conversation by clicking the mic or typing
                        below
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
                      <div className="bg-white border p-3 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Controls */}
                <div className="space-y-3">
                  {/* Voice Conversation Controls */}
                  <div className="flex items-center gap-3">
                    {!isVoiceMode ? (
                      <Button
                        onClick={startVoiceConversation}
                        disabled={isProcessing || !isElevenLabsAvailable()}
                        className="flex-1"
                        variant={
                          isElevenLabsAvailable() ? "default" : "outline"
                        }
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-2" />
                            {isElevenLabsAvailable()
                              ? "Start Voice Conversation"
                              : "Voice Unavailable - Missing API Key"}
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-700">
                            {isConnected
                              ? isListening
                                ? "Listening for your voice..."
                                : "Voice conversation active"
                              : "Connecting..."}
                          </span>
                          {isListening ? (
                            <Mic className="h-4 w-4 text-green-600 animate-pulse" />
                          ) : isConnected ? (
                            <button
                              onClick={startListening}
                              className="text-green-600 hover:text-green-700 transition-colors"
                              title="Click to start listening"
                            >
                              <Mic className="h-4 w-4" />
                            </button>
                          ) : (
                            <Volume2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <Button
                          onClick={stopVoiceConversation}
                          variant="destructive"
                          size="sm"
                        >
                          <MicOff className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Text Input */}
                  <div className="flex gap-2">
                    <Textarea
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder={
                        isVoiceMode
                          ? "Type a message to send to voice conversation..."
                          : "Type your question here..."
                      }
                      className="flex-1"
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
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
                        disabled={isProcessing || isVoiceMode}
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
                      <p className="text-sm font-medium mb-2">
                        Understood so far:
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
                  <CardDescription>{projectPlan.title}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Timeline:</p>
                    <p className="text-sm text-gray-600">
                      {projectPlan.timeline}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Budget:</p>
                    <p className="text-sm text-gray-600">
                      {projectPlan.budget}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Technologies:</p>
                    <div className="flex flex-wrap gap-1">
                      {projectPlan.technologies
                        .slice(0, 3)
                        .map((tech, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
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
                          <span className="text-gray-500">
                            {" "}
                            ({phase.duration})
                          </span>
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

                    {currentStage !== "complete" && (
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

      {/* Voice Mode Indicator */}
      {isVoiceMode && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          {isListening ? (
            <>
              <Mic className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">Listening...</span>
            </>
          ) : (
            <>
              <button
                onClick={startListening}
                className="flex items-center gap-2 hover:bg-green-600 px-2 py-1 rounded transition-colors"
                title="Click to speak"
              >
                <Mic className="w-4 h-4" />
                <span className="text-sm font-medium">Click to Speak</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

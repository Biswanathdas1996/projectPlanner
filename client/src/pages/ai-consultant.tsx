import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NavigationBar } from '@/components/navigation-bar';
import { Mic, MicOff, MessageCircle, FileText, Download, Loader2, Volume2, VolumeX, PlayCircle, StopCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProjectPlan {
  title: string;
  description: string;
  phases: Array<{
    name: string;
    duration: string;
    tasks: string[];
  }>;
  technologies: string[];
  timeline: string;
  budget: string;
  risks: string[];
}

export default function AIConsultant() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null);
  const [conversationStage, setConversationStage] = useState<'initial' | 'gathering' | 'analyzing' | 'planning' | 'complete'>('initial');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Load conversation from localStorage
    const savedConversation = localStorage.getItem('ai-consultant-conversation');
    if (savedConversation) {
      setConversation(JSON.parse(savedConversation));
    }

    const savedProjectPlan = localStorage.getItem('ai-consultant-project-plan');
    if (savedProjectPlan) {
      setProjectPlan(JSON.parse(savedProjectPlan));
      setConversationStage('complete');
    }
  }, []);

  const saveConversation = (messages: ConversationMessage[]) => {
    localStorage.setItem('ai-consultant-conversation', JSON.stringify(messages));
    setConversation(messages);
  };

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
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const updatedConversation = [...conversation, userMessage];
    saveConversation(updatedConversation);

    setIsProcessing(true);

    try {
      // Generate AI response based on conversation stage
      const aiResponse = await generateAIResponse(input, updatedConversation);
      
      const assistantMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.text,
        timestamp: new Date(),
      };

      const finalConversation = [...updatedConversation, assistantMessage];
      saveConversation(finalConversation);

      // Generate speech from AI response
      if (aiResponse.text) {
        await generateSpeech(aiResponse.text);
      }

      // Update conversation stage
      updateConversationStage(finalConversation);

      // Generate project plan if conversation is complete
      if (aiResponse.shouldGeneratePlan) {
        await generateProjectPlan(finalConversation);
      }

    } catch (error) {
      console.error('Error generating response:', error);
      toast({ title: "Response failed", description: "Please try again", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAIResponse = async (input: string, conversationHistory: ConversationMessage[]) => {
    const response = await fetch('/api/elevenlabs/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        conversation: conversationHistory,
        stage: conversationStage,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI response');
    }

    return response.json();
  };

  const generateSpeech = async (text: string) => {
    try {
      const response = await fetch('/api/elevenlabs/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
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
      console.error('Error generating speech:', error);
    }
  };

  const updateConversationStage = (messages: ConversationMessage[]) => {
    const messageCount = messages.length;
    
    if (messageCount >= 10) {
      setConversationStage('planning');
    } else if (messageCount >= 6) {
      setConversationStage('analyzing');
    } else if (messageCount >= 2) {
      setConversationStage('gathering');
    }
  };

  const generateProjectPlan = async (conversationHistory: ConversationMessage[]) => {
    try {
      const response = await fetch('/api/elevenlabs/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: conversationHistory }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate project plan');
      }

      const plan = await response.json();
      setProjectPlan(plan);
      setConversationStage('complete');
      localStorage.setItem('ai-consultant-project-plan', JSON.stringify(plan));
      
      toast({ title: "Project plan generated!", description: "Your comprehensive plan is ready for download" });
    } catch (error) {
      console.error('Error generating project plan:', error);
      toast({ title: "Plan generation failed", description: "Please try again", variant: "destructive" });
    }
  };

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
    switch (conversationStage) {
      case 'initial':
        return 'Ready to discuss your tech problem';
      case 'gathering':
        return 'Gathering information about your requirements';
      case 'analyzing':
        return 'Analyzing your needs and constraints';
      case 'planning':
        return 'Developing your project plan';
      case 'complete':
        return 'Project plan ready for download';
      default:
        return 'AI Consultant';
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
            Discuss your tech problems with AI and get a comprehensive project plan
          </p>
          <Badge variant="secondary" className="text-sm">
            {getStageDescription()}
          </Badge>
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
                    <Button
                      onClick={handleTextSubmit}
                      disabled={!currentInput.trim() || isProcessing}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Plan Panel */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Messages</span>
                    <span>{conversation.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((conversation.length / 10) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {conversation.length < 10 
                      ? `${10 - conversation.length} more messages needed for plan generation`
                      : 'Ready to generate project plan'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

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

                  <Button
                    onClick={downloadProjectPlan}
                    className="w-full"
                    variant="default"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Full Plan
                  </Button>
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
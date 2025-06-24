interface ElevenLabsConversationConfig {
  agentId: string;
  apiKey: string;
}

interface ConversationSession {
  sessionId: string;
  websocket?: WebSocket;
  isActive: boolean;
}

export interface ConversationEvent {
  type: 'user_message' | 'agent_message' | 'conversation_end' | 'error';
  message?: string;
  audioData?: ArrayBuffer;
  sessionId?: string;
  timestamp: Date;
}

export class ElevenLabsConversationAgent {
  private config: ElevenLabsConversationConfig;
  private session: ConversationSession | null = null;
  private eventListeners: Map<string, ((event: ConversationEvent) => void)[]> = new Map();

  constructor(config: ElevenLabsConversationConfig) {
    this.config = config;
  }

  async startConversation(onEvent: (event: ConversationEvent) => void): Promise<string> {
    try {
      console.log('Starting conversation with agent:', this.config.agentId);
      
      // For now, simulate the conversation without WebSocket connection
      // This allows the UI to work while we troubleshoot the ElevenLabs API
      const sessionId = `session-${Date.now()}`;
      
      this.session = {
        sessionId,
        websocket: null as any,
        isActive: true,
      };

      // Store event handler for later use
      this.eventHandler = onEvent;

      // Simulate successful connection with speech
      setTimeout(() => {
        const welcomeMessage = 'Hello! I\'m your AI tech consultant. I\'m here to help you understand your technology needs and create a comprehensive project plan. What kind of project are you thinking about?';
        
        // Speak the message
        this.speakMessage(welcomeMessage);
        
        onEvent({
          type: 'agent_message',
          message: welcomeMessage,
          sessionId,
          timestamp: new Date(),
        });
      }, 1000);

      return sessionId;

      /* TODO: Implement actual ElevenLabs WebSocket connection
      // First, get a signed URL for the conversation
      const signedUrlResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.config.agentId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!signedUrlResponse.ok) {
        throw new Error(`Failed to get signed URL: ${signedUrlResponse.status} ${signedUrlResponse.statusText}`);
      }

      const { signed_url } = await signedUrlResponse.json();
      */
    } catch (error) {
      console.error('Failed to start ElevenLabs conversation:', error);
      throw new Error(`Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractSessionId(signedUrl: string): string {
    // Extract session ID from the WebSocket URL
    const url = new URL(signedUrl);
    const pathParts = url.pathname.split('/');
    return pathParts[pathParts.length - 1] || `session-${Date.now()}`;
  }

  private handleWebSocketMessage(event: MessageEvent, onEvent: (event: ConversationEvent) => void) {
    try {
      if (typeof event.data === 'string') {
        // Handle text messages (conversation updates, status, etc.)
        const data = JSON.parse(event.data);
        
        if (data.type === 'conversation_update' && data.message) {
          onEvent({
            type: 'agent_message',
            message: data.message,
            sessionId: this.session?.sessionId,
            timestamp: new Date(),
          });
        } else if (data.type === 'user_transcript' && data.transcript) {
          onEvent({
            type: 'user_message',
            message: data.transcript,
            sessionId: this.session?.sessionId,
            timestamp: new Date(),
          });
        }
      } else if (event.data instanceof ArrayBuffer) {
        // Handle audio data
        onEvent({
          type: 'agent_message',
          audioData: event.data,
          sessionId: this.session?.sessionId,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      onEvent({
        type: 'error',
        message: 'Failed to process message',
        sessionId: this.session?.sessionId,
        timestamp: new Date(),
      });
    }
  }

  async sendAudioMessage(audioData: ArrayBuffer): Promise<void> {
    if (!this.session?.websocket || !this.session.isActive) {
      throw new Error('No active conversation session');
    }

    try {
      this.session.websocket.send(audioData);
    } catch (error) {
      console.error('Failed to send audio message:', error);
      throw new Error('Failed to send audio message');
    }
  }

  async sendTextMessage(message: string): Promise<void> {
    if (!this.session?.isActive) {
      throw new Error('No active conversation session');
    }

    try {
      console.log('Sending message:', message);
      
      // For now, simulate AI response
      // In production, this would send to ElevenLabs WebSocket
      setTimeout(() => {
        // Simulate AI processing and response
        const responses = [
          "That's a great question about your project. Can you tell me more about the specific challenges you're facing?",
          "I understand. What's your target timeline for this project?",
          "Interesting. What's your budget range for this development work?",
          "Based on what you've shared, I think we can create a solid plan. Do you have any technical preferences or constraints?",
          "Perfect! Let me help you think through the implementation approach. What's most important to you - speed to market, scalability, or cost efficiency?"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        // Trigger event first
        if (this.eventHandler) {
          this.eventHandler({
            type: 'agent_message',
            message: randomResponse,
            sessionId: this.session?.sessionId,
            timestamp: new Date(),
          });
        }
        
        // Then speak the response after a brief delay
        setTimeout(() => {
          this.speakMessage(randomResponse);
        }, 300);
      }, 1500 + Math.random() * 1000); // Simulate realistic response time
      
    } catch (error) {
      console.error('Failed to send text message:', error);
      throw new Error('Failed to send text message');
    }
  }

  private eventHandler?: (event: ConversationEvent) => void;

  private speakMessage(message: string): void {
    try {
      // Use Web Speech API for text-to-speech
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(message);
        
        // Configure voice settings for a professional consultant
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0; // Normal pitch
        utterance.volume = 0.8; // Good volume level
        
        // Try to use a professional-sounding voice
        const voices = window.speechSynthesis.getVoices();
        
        // Prefer English voices with female or neutral tone for consultant
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Female') || voice.name.includes('Karen') || voice.name.includes('Samantha'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        console.log('Speaking message:', message.substring(0, 50) + '...');
        
        // Add event listeners
        utterance.onstart = () => {
          console.log('Speech started');
        };
        
        utterance.onend = () => {
          console.log('Speech completed');
        };
        
        utterance.onerror = (event) => {
          console.error('Speech error:', event.error);
        };
        
        // Speak the message
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not supported in this browser');
      }
    } catch (error) {
      console.error('Error speaking message:', error);
    }
  }

  endConversation(): void {
    if (this.session?.websocket) {
      this.session.websocket.close();
      this.session = null;
    }
  }

  isActive(): boolean {
    return this.session?.isActive || false;
  }

  getSessionId(): string | null {
    return this.session?.sessionId || null;
  }

  // Create a conversational AI agent for tech consulting
  static async createTechConsultantAgent(apiKey: string): Promise<ElevenLabsConversationAgent> {
    try {
      // Use a hardcoded agent ID for immediate functionality
      // In production, you would call the API to create/get an agent
      const agentId = 'default-tech-consultant'; // Placeholder agent ID
      
      console.log('Creating ElevenLabs agent with ID:', agentId);
      
      return new ElevenLabsConversationAgent({
        agentId,
        apiKey,
      });
    } catch (error) {
      console.error('Failed to create tech consultant agent:', error);
      throw error;
    }
  }

  private static async getOrCreateTechConsultantAgent(apiKey: string): Promise<string> {
    try {
      // Check for existing agents
      const agentsResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (agentsResponse.ok) {
        const agents = await agentsResponse.json();
        
        // Look for existing tech consultant agent
        const existingAgent = agents.find((agent: any) => 
          agent.name === 'Tech Consultant' || agent.name.includes('Tech Consultant')
        );

        if (existingAgent) {
          return existingAgent.agent_id;
        }
      }

      // Create new agent if none exists
      const createAgentResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          name: 'Tech Consultant',
          prompt: `You are an expert technology consultant helping clients understand their project needs and create comprehensive project plans.

Your role:
- Listen carefully to understand their technical challenges and business goals
- Ask thoughtful questions to clarify requirements, timeline, budget, and constraints
- Provide expert guidance on technology choices, architecture, and implementation approaches
- Help them think through risks, opportunities, and best practices
- Generate actionable project plans with phases, timelines, and deliverables

Conversation style:
- Be conversational, professional, and empathetic
- Ask one focused question at a time to avoid overwhelming them
- Show you're listening by referencing what they've shared
- Provide specific, actionable advice based on your expertise
- Help them make informed decisions about their technology investments

Current conversation stage will be provided in context. Adapt your questions and advice accordingly:
- Discovery: Understand the core problem and business context
- Analysis: Evaluate technical requirements and constraints  
- Specification: Define detailed features and implementation approach
- Planning: Create comprehensive roadmap and timeline
- Complete: Finalize recommendations and next steps

Keep responses concise but thorough. Focus on one key topic per response.`,
          voice: {
            voice_id: '21m00Tcm4TlvDq8ikWAM', // Default voice
            stability: 0.7,
            similarity_boost: 0.8,
          },
          conversation_config: {
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 700,
            },
            agent_output_audio_format: 'pcm_24000',
            user_input_audio_format: 'pcm_16000',
          },
        }),
      });

      if (!createAgentResponse.ok) {
        const errorText = await createAgentResponse.text();
        throw new Error(`Failed to create agent: ${createAgentResponse.status} ${errorText}`);
      }

      const newAgent = await createAgentResponse.json();
      return newAgent.agent_id;
    } catch (error) {
      console.error('Error creating tech consultant agent:', error);
      throw error;
    }
  }
}

// Helper function to convert ArrayBuffer to AudioContext playable format
export function playAudioFromBuffer(audioData: ArrayBuffer, audioContext: AudioContext): Promise<void> {
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(
      audioData.slice(0), // Create a copy of the ArrayBuffer
      (audioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => resolve();
        source.start();
      },
      (error) => reject(error)
    );
  });
}

// Helper function to get user media for voice input
export async function getUserAudioStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
      },
    });
  } catch (error) {
    console.error('Failed to get user audio stream:', error);
    throw new Error('Microphone access denied or unavailable');
  }
}
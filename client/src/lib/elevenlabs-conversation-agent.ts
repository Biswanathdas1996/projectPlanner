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
      
      // Extract session ID from the signed URL
      const sessionId = this.extractSessionId(signed_url);
      
      // Create WebSocket connection
      const websocket = new WebSocket(signed_url);
      
      this.session = {
        sessionId,
        websocket,
        isActive: false,
      };

      // Set up WebSocket event handlers
      websocket.onopen = () => {
        console.log('ElevenLabs conversation connected');
        if (this.session) {
          this.session.isActive = true;
        }
        onEvent({
          type: 'agent_message',
          message: 'Connected! You can now speak naturally with the AI consultant.',
          sessionId,
          timestamp: new Date(),
        });
      };

      websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event, onEvent);
      };

      websocket.onclose = (event) => {
        console.log('ElevenLabs conversation closed', event.code, event.reason);
        if (this.session) {
          this.session.isActive = false;
        }
        onEvent({
          type: 'conversation_end',
          sessionId,
          timestamp: new Date(),
        });
      };

      websocket.onerror = (error) => {
        console.error('ElevenLabs conversation error:', error);
        onEvent({
          type: 'error',
          message: 'Connection error occurred',
          sessionId,
          timestamp: new Date(),
        });
      };

      return sessionId;
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
    if (!this.session?.websocket || !this.session.isActive) {
      throw new Error('No active conversation session');
    }

    try {
      const messageData = {
        type: 'user_message',
        message: message,
        timestamp: new Date().toISOString(),
      };
      
      this.session.websocket.send(JSON.stringify(messageData));
    } catch (error) {
      console.error('Failed to send text message:', error);
      throw new Error('Failed to send text message');
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
      // First, check if we have an existing agent or create a new one
      const agentId = await this.getOrCreateTechConsultantAgent(apiKey);
      
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
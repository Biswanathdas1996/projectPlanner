import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VoiceConversationEvent {
  type: 'agent_message' | 'user_message' | 'conversation_start' | 'conversation_end' | 'error';
  message?: string;
  sessionId?: string;
  timestamp: Date;
}

export interface GeminiVoiceConfig {
  apiKey: string;
  model?: string;
}

export class GeminiVoiceAgent {
  private config: GeminiVoiceConfig;
  private genAI: GoogleGenerativeAI;
  private model: any;
  private sessionId: string;
  private isActive: boolean = false;
  private speechRecognition: any = null;
  private isListening: boolean = false;
  private eventHandler?: (event: VoiceConversationEvent) => void;
  private conversationHistory: Array<{role: string, content: string}> = [];

  constructor(config: GeminiVoiceConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.model || 'gemini-1.5-flash',
      systemInstruction: `You are an expert AI tech consultant. Your role is to:
      1. Understand users' technology problems and project ideas
      2. Ask clarifying questions to gather requirements
      3. Provide practical advice and solutions
      4. Help create comprehensive project plans
      5. Guide users through technical decisions
      
      IMPORTANT: Keep responses SHORT and conversational for voice interaction - maximum 50-70 words.
      Be direct and to the point. Ask ONE specific follow-up question to keep conversation flowing.
      Avoid long explanations - focus on key points only.`
    });
    this.sessionId = `gemini-session-${Date.now()}`;
  }

  async startConversation(onEvent: (event: VoiceConversationEvent) => void): Promise<string> {
    this.eventHandler = onEvent;
    this.isActive = true;
    
    // Initialize speech recognition
    await this.initializeSpeechRecognition();
    
    // Send welcome message
    const welcomeMessage = "Hello! I'm your AI tech consultant powered by Gemini. I'm here to help you understand your technology needs and create comprehensive project plans. What kind of project are you thinking about?";
    
    this.eventHandler({
      type: 'conversation_start',
      sessionId: this.sessionId,
      timestamp: new Date(),
    });

    setTimeout(() => {
      this.speakMessage(welcomeMessage);
      this.eventHandler?.({
        type: 'agent_message',
        message: welcomeMessage,
        sessionId: this.sessionId,
        timestamp: new Date(),
      });
    }, 500);

    return this.sessionId;
  }

  private async initializeSpeechRecognition(): Promise<void> {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('Speech recognition not supported');
        return;
      }

      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'en-US';

      this.speechRecognition.onstart = () => {
        this.isListening = true;
        console.log('Speech recognition started');
      };

      this.speechRecognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        
        if (transcript) {
          console.log('User said:', transcript);
          this.isListening = false;
          
          // Add to conversation history
          this.conversationHistory.push({
            role: 'user',
            content: transcript
          });

          // Send user message event
          this.eventHandler?.({
            type: 'user_message',
            message: transcript,
            sessionId: this.sessionId,
            timestamp: new Date(),
          });

          // Generate AI response
          await this.generateResponse(transcript);
        }
      };

      this.speechRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        
        if (event.error === 'not-allowed') {
          this.eventHandler?.({
            type: 'error',
            message: 'Microphone access denied. Please allow microphone access.',
            sessionId: this.sessionId,
            timestamp: new Date(),
          });
        }
      };

      this.speechRecognition.onend = () => {
        this.isListening = false;
        console.log('Speech recognition ended');
      };

    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
    }
  }

  async generateResponse(userMessage: string): Promise<void> {
    try {
      // Build conversation context
      const conversationContext = this.conversationHistory
        .slice(-6) // Keep last 6 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `Based on this conversation about a technology project:

${conversationContext}

As an expert tech consultant, provide a SHORT response (maximum 50-70 words) that:
1. Briefly acknowledges what the user said
2. Gives one key insight or advice
3. Asks ONE specific follow-up question

Be direct and conversational for voice interaction. Avoid long explanations.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Add AI response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response
      });

      // Send response event and speak it
      setTimeout(() => {
        this.eventHandler?.({
          type: 'agent_message',
          message: response,
          sessionId: this.sessionId,
          timestamp: new Date(),
        });

        this.speakMessage(response);
      }, 800);

    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback response
      const fallbackResponse = "I'm having trouble processing that right now. Could you tell me more about your project goals?";
      
      this.eventHandler?.({
        type: 'agent_message',
        message: fallbackResponse,
        sessionId: this.sessionId,
        timestamp: new Date(),
      });

      this.speakMessage(fallbackResponse);
    }
  }

  startListening(): void {
    if (!this.isActive || this.isListening || !this.speechRecognition) {
      return;
    }

    try {
      this.speechRecognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }

  private cleanTextForSpeech(text: string): string {
    return text
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Code
      .replace(/#{1,6}\s*/g, '') // Headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      
      // Clean up bullet points and lists
      .replace(/^\s*[\*\-\+]\s*/gm, '') // Bullet points
      .replace(/^\s*\d+\.\s*/gm, '') // Numbered lists
      
      // Remove special characters that cause speech issues
      .replace(/[^\w\s.,!?;:()\-'"]/g, ' ') // Keep basic punctuation
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/\.\s*\./g, '.') // Multiple periods
      .replace(/([.!?])\1+/g, '$1') // Repeated punctuation
      
      // Clean up common abbreviations for better speech
      .replace(/\be\.g\./g, 'for example')
      .replace(/\bi\.e\./g, 'that is')
      .replace(/\betc\./g, 'and so on')
      .replace(/\$(\d+),?(\d+)/g, '$1 thousand dollars') // Currency formatting
      .replace(/\$(\d+)/g, '$1 dollars')
      
      .trim();
  }

  private speakMessage(message: string): void {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        // Clean the message for better speech synthesis
        const cleanedMessage = this.cleanTextForSpeech(message);
        
        const utterance = new SpeechSynthesisUtterance(cleanedMessage);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Female') || voice.name.includes('Karen') || voice.name.includes('Samantha'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        console.log('Speaking:', cleanedMessage.substring(0, 50) + '...');
        
        utterance.onend = () => {
          console.log('Speech completed');
          // Auto-start listening after AI finishes speaking
          setTimeout(() => {
            if (this.isActive && !this.isListening) {
              this.startListening();
            }
          }, 1000);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error);
        };
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error speaking message:', error);
    }
  }

  async sendTextMessage(message: string): Promise<void> {
    if (!this.isActive) return;

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: message
    });

    // Send user message event
    this.eventHandler?.({
      type: 'user_message',
      message: message,
      sessionId: this.sessionId,
      timestamp: new Date(),
    });

    // Generate AI response
    await this.generateResponse(message);
  }

  endConversation(): void {
    this.isActive = false;
    this.isListening = false;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (error) {
        console.log('Speech recognition already stopped');
      }
    }

    this.eventHandler?.({
      type: 'conversation_end',
      sessionId: this.sessionId,
      timestamp: new Date(),
    });
  }

  getSessionId(): string {
    return this.sessionId;
  }

  isConversationActive(): boolean {
    return this.isActive;
  }

  isSpeechListening(): boolean {
    return this.isListening;
  }

  static async createTechConsultant(apiKey: string): Promise<GeminiVoiceAgent> {
    return new GeminiVoiceAgent({
      apiKey,
      model: 'gemini-1.5-flash'
    });
  }
}
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    intent?: string;
    entities?: Record<string, any>;
    followUpSuggestions?: string[];
  };
}

export interface ConversationContext {
  projectType?: string;
  problemDomain?: string;
  userExpertise?: "beginner" | "intermediate" | "expert";
  timeline?: string;
  budget?: string;
  techStack?: string[];
  requirements?: string[];
  constraints?: string[];
  stakeholders?: string[];
  /**
   * The intended audience for the project (e.g., developers, end-users, etc.).
   */
  targetAudience?: string;
  /**
   * Specific technical requirements for the project (e.g., frameworks, libraries, etc.).
   */
  techRequirements?: string[];
}

export interface AgentResponse {
  message: string;
  context: ConversationContext;
  nextQuestions: string[];
  confidence: number;
  shouldGeneratePlan: boolean;
  stageCompleted?: boolean;
}

export interface ProjectPlan {
  title: string;
  description: string;
  phases: Array<{
    name: string;
    duration: string;
    tasks: string[];
    deliverables: string[];
  }>;
  technologies: string[];
  timeline: string;
  budget: string;
  risks: string[];
  recommendations: string[];
  /**
   * A high-level summary or overview of the project.
   */
  overview?: string;
}

export class ConversationalAIAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private context: ConversationContext = {};
  private conversation: ConversationMessage[] = [];
  private currentStage:
    | "discovery"
    | "analysis"
    | "specification"
    | "planning"
    | "complete" = "discovery";

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key not found, using fallback responses");
      this.genAI = null as any;
      this.model = null;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    } catch (error) {
      console.error("Failed to initialize Gemini AI:", error);
      this.genAI = null as any;
      this.model = null;
    }
  }

  async processMessage(userMessage: string): Promise<AgentResponse> {
    // Add user message to conversation
    const userMsg: ConversationMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    this.conversation.push(userMsg);

    // Analyze user message and extract context
    await this.analyzeMessage(userMessage);

    // Generate contextual response
    const response = await this.generateResponse();

    // Add assistant response to conversation
    const assistantMsg: ConversationMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.message,
      timestamp: new Date(),
      metadata: {
        confidence: response.confidence,
        intent: this.determineIntent(userMessage),
        followUpSuggestions: response.nextQuestions,
      },
    };

    this.conversation.push(assistantMsg);

    return response;
  }

  private async analyzeMessage(message: string): Promise<void> {
    if (!this.model) {
      // Use rule-based analysis as fallback
      const analysis = this.analyzeMessageFallback(message);
      this.context = { ...this.context, ...analysis };
      return;
    }

    const analysisPrompt = `
Analyze this user message and extract relevant information for a tech project consultation:

Message: "${message}"

Current context: ${JSON.stringify(this.context)}
Current stage: ${this.currentStage}

Extract and update the following information:
1. Project type (web app, mobile app, desktop, API, etc.)
2. Problem domain (e-commerce, healthcare, education, etc.)
3. User expertise level
4. Timeline preferences
5. Budget range
6. Technology preferences
7. Specific requirements
8. Constraints or limitations
9. Stakeholders involved

Return a JSON object with the extracted information.
`;

    try {
      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse the analysis and update context
      const analysis = this.parseAnalysisResponse(text);
      this.context = { ...this.context, ...analysis };
    } catch (error) {
      console.error("Error analyzing message:", error);
      // Fallback to rule-based analysis
      const analysis = this.analyzeMessageFallback(message);
      this.context = { ...this.context, ...analysis };
    }
  }

  private analyzeMessageFallback(
    message: string
  ): Partial<ConversationContext> {
    const context: Partial<ConversationContext> = {};
    const lower = message.toLowerCase();

    // Extract project type
    if (
      lower.includes("website") ||
      lower.includes("web app") ||
      lower.includes("web")
    ) {
      context.projectType = "web application";
    } else if (lower.includes("mobile app") || lower.includes("app")) {
      context.projectType = "mobile application";
    } else if (lower.includes("desktop") || lower.includes("software")) {
      context.projectType = "desktop application";
    }

    // Extract domain
    if (
      lower.includes("ecommerce") ||
      lower.includes("e-commerce") ||
      lower.includes("shop") ||
      lower.includes("store")
    ) {
      context.problemDomain = "e-commerce";
    } else if (
      lower.includes("healthcare") ||
      lower.includes("medical") ||
      lower.includes("health")
    ) {
      context.problemDomain = "healthcare";
    } else if (
      lower.includes("education") ||
      lower.includes("learning") ||
      lower.includes("school")
    ) {
      context.problemDomain = "education";
    }

    // Extract expertise level
    if (
      lower.includes("beginner") ||
      lower.includes("new to") ||
      lower.includes("first time")
    ) {
      context.userExpertise = "beginner";
    } else if (
      lower.includes("experienced") ||
      lower.includes("expert") ||
      lower.includes("advanced")
    ) {
      context.userExpertise = "expert";
    } else {
      context.userExpertise = "intermediate";
    }

    // Extract timeline
    const timelineMatch = message.match(/(\d+)\s*(week|month|day)s?/i);
    if (timelineMatch) {
      context.timeline = timelineMatch[0];
    }

    // Extract budget
    const budgetMatch = message.match(/\$[\d,]+/);
    if (budgetMatch) {
      context.budget = budgetMatch[0];
    }

    return context;
  }

  private parseAnalysisResponse(
    response: string
  ): Partial<ConversationContext> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Error parsing analysis response:", error);
    }

    // Fallback to manual extraction
    const context: Partial<ConversationContext> = {};

    if (response.toLowerCase().includes("web"))
      context.projectType = "web application";
    if (response.toLowerCase().includes("mobile"))
      context.projectType = "mobile application";
    if (
      response.toLowerCase().includes("ecommerce") ||
      response.toLowerCase().includes("shop")
    ) {
      context.problemDomain = "e-commerce";
    }
    if (response.toLowerCase().includes("healthcare"))
      context.problemDomain = "healthcare";

    return context;
  }

  private async generateResponse(): Promise<AgentResponse> {
    if (!this.model) {
      // Use rule-based fallback response
      this.updateStage();
      return this.getFallbackResponse();
    }

    const stagePrompts = {
      discovery: this.buildDiscoveryPrompt(),
      analysis: this.buildAnalysisPrompt(),
      specification: this.buildSpecificationPrompt(),
      planning: this.buildPlanningPrompt(),
      complete: this.buildCompletePrompt(),
    };

    const prompt = stagePrompts[this.currentStage];

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const agentResponse = this.parseAgentResponse(text);

      // Update conversation stage based on context completeness
      this.updateStage();

      return agentResponse;
    } catch (error) {
      console.error("Error generating response:", error);
      this.updateStage();
      return this.getFallbackResponse();
    }
  }

  private buildDiscoveryPrompt(): string {
    return `
You are an expert tech consultant helping a client understand their project needs. 

Current conversation context:
${JSON.stringify(this.context, null, 2)}

Recent conversation:
${this.conversation
  .slice(-4)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

Your goal in the discovery stage is to:
1. Understand the core problem they're trying to solve
2. Identify the target users and stakeholders
3. Understand their business goals
4. Assess their technical expertise and resources

Ask ONE thoughtful, open-ended question that will help you understand their needs better. 
Be conversational, empathetic, and professional. Show that you're listening by referencing what they've already shared.

Also suggest 2-3 follow-up questions they might want to consider.

Respond in this format:
MESSAGE: [Your main response and question]
NEXT_QUESTIONS: [Array of 2-3 follow-up questions]
CONFIDENCE: [Number from 0-100 indicating how well you understand their needs]
`;
  }

  private buildAnalysisPrompt(): string {
    return `
You are analyzing the client's needs and starting to form recommendations.

Current context: ${JSON.stringify(this.context, null, 2)}

Recent conversation:
${this.conversation
  .slice(-4)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

Your goal in the analysis stage is to:
1. Validate your understanding of their requirements
2. Identify potential challenges and opportunities
3. Begin suggesting technical approaches
4. Clarify any ambiguities

Provide insights based on what you've learned and ask clarifying questions about technical preferences, constraints, or priorities.

Respond in this format:
MESSAGE: [Your analysis and recommendations]
NEXT_QUESTIONS: [Array of 2-3 clarifying questions]
CONFIDENCE: [Number from 0-100]
`;
  }

  private buildSpecificationPrompt(): string {
    return `
You are helping to define detailed specifications for their project.

Current context: ${JSON.stringify(this.context, null, 2)}

Recent conversation:
${this.conversation
  .slice(-4)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

Your goal in the specification stage is to:
1. Define specific features and functionality
2. Establish technical requirements
3. Set realistic timelines and budgets
4. Identify risks and mitigation strategies

Help them think through the details and make informed decisions about scope, technology stack, and implementation approach.

Respond in this format:
MESSAGE: [Your specifications and recommendations]
NEXT_QUESTIONS: [Array of 2-3 questions about implementation details]
CONFIDENCE: [Number from 0-100]
`;
  }

  private buildPlanningPrompt(): string {
    return `
You are ready to create a comprehensive project plan.

Current context: ${JSON.stringify(this.context, null, 2)}

Full conversation summary:
${this.conversation.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

Your goal in the planning stage is to:
1. Summarize all requirements and decisions
2. Propose a detailed implementation plan
3. Provide timeline and budget estimates
4. Offer next steps for getting started

Create a comprehensive response that ties everything together and demonstrates the value of your consultation.

Respond in this format:
MESSAGE: [Your comprehensive plan summary]
NEXT_QUESTIONS: [Array of 2-3 questions about next steps]
CONFIDENCE: [Number from 0-100]
SHOULD_GENERATE_PLAN: true
`;
  }

  private buildCompletePrompt(): string {
    return `
The consultation is complete and you're providing final recommendations.

Respond in this format:
MESSAGE: [Final recommendations and next steps]
NEXT_QUESTIONS: [Array of follow-up actions they can take]
CONFIDENCE: 100
STAGE_COMPLETED: true
`;
  }

  private parseAgentResponse(response: string): AgentResponse {
    try {
      const messageMatch = response.match(
        /MESSAGE:\s*([\s\S]*?)(?=NEXT_QUESTIONS:|$)/
      );
      const questionsMatch = response.match(
        /NEXT_QUESTIONS:\s*([\s\S]*?)(?=CONFIDENCE:|$)/
      );
      const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/);
      const shouldGeneratePlanMatch = response.match(
        /SHOULD_GENERATE_PLAN:\s*true/
      );

      const message = messageMatch ? messageMatch[1].trim() : response;
      const nextQuestions = questionsMatch
        ? this.parseQuestions(questionsMatch[1])
        : [];
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
      const shouldGeneratePlan = !!shouldGeneratePlanMatch;

      return {
        message,
        context: this.context,
        nextQuestions,
        confidence,
        shouldGeneratePlan,
      };
    } catch (error) {
      console.error("Error parsing agent response:", error);
      return this.getFallbackResponse();
    }
  }

  private parseQuestions(questionsText: string): string[] {
    try {
      // Try to parse as JSON array
      if (questionsText.includes("[")) {
        const jsonMatch = questionsText.match(/\[([\s\S]*)\]/);
        if (jsonMatch) {
          return JSON.parse(`[${jsonMatch[1]}]`);
        }
      }

      // Fallback to line-by-line parsing
      return questionsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^[-*]\s*/, ""))
        .slice(0, 3);
    } catch (error) {
      return [
        "What other requirements should we consider?",
        "Are there any constraints I should know about?",
        "What would success look like for this project?",
      ];
    }
  }

  private updateStage(): void {
    const contextCompleteness = this.assessContextCompleteness();

    if (contextCompleteness >= 0.8 && this.currentStage === "discovery") {
      this.currentStage = "analysis";
    } else if (contextCompleteness >= 0.9 && this.currentStage === "analysis") {
      this.currentStage = "specification";
    } else if (
      this.conversation.length >= 8 &&
      this.currentStage === "specification"
    ) {
      this.currentStage = "planning";
    } else if (
      this.conversation.length >= 12 &&
      this.currentStage === "planning"
    ) {
      this.currentStage = "complete";
    }
  }

  private assessContextCompleteness(): number {
    const requiredFields = ["projectType", "problemDomain", "userExpertise"];
    const optionalFields = ["timeline", "budget", "techStack", "requirements"];

    const requiredScore =
      requiredFields.filter(
        (field) => this.context[field as keyof ConversationContext]
      ).length / requiredFields.length;
    const optionalScore =
      optionalFields.filter(
        (field) => this.context[field as keyof ConversationContext]
      ).length / optionalFields.length;

    return requiredScore * 0.7 + optionalScore * 0.3;
  }

  private determineIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("help") || lowerMessage.includes("need"))
      return "request_help";
    if (lowerMessage.includes("build") || lowerMessage.includes("create"))
      return "build_request";
    if (
      lowerMessage.includes("cost") ||
      lowerMessage.includes("price") ||
      lowerMessage.includes("budget")
    )
      return "budget_inquiry";
    if (
      lowerMessage.includes("time") ||
      lowerMessage.includes("when") ||
      lowerMessage.includes("timeline")
    )
      return "timeline_inquiry";
    if (
      lowerMessage.includes("technology") ||
      lowerMessage.includes("tech") ||
      lowerMessage.includes("stack")
    )
      return "tech_inquiry";

    return "general_inquiry";
  }

  private getFallbackResponse(): AgentResponse {
    const fallbackMessages = [
      "I understand you're looking for help with a tech project. Could you tell me more about what you're trying to build?",
      "That's interesting! Help me understand the core problem you're trying to solve with technology.",
      "I'd love to help you with that. What's the main goal you're hoping to achieve?",
    ];

    return {
      message:
        fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)],
      context: this.context,
      nextQuestions: [
        "What problem are you trying to solve?",
        "Who would be using this solution?",
        "What's your timeline for this project?",
      ],
      confidence: 50,
      shouldGeneratePlan: false,
    };
  }

  async generateProjectPlan(): Promise<ProjectPlan> {
    if (!this.model) {
      return this.createFallbackPlan();
    }

    const planPrompt = `
Based on our conversation, create a comprehensive project plan.

Context: ${JSON.stringify(this.context, null, 2)}

Conversation summary:
${this.conversation.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

Create a detailed project plan that includes:
1. Project title and description
2. Development phases with tasks and deliverables
3. Recommended technology stack
4. Timeline estimate
5. Budget range
6. Risk assessment
7. Next steps and recommendations

Format the response as a valid JSON object.
`;

    try {
      const result = await this.model.generateContent(planPrompt);
      const response = await result.response;
      const text = response.text();

      return this.parseProjectPlan(text);
    } catch (error) {
      console.error("Error generating project plan:", error);
      return this.createFallbackPlan();
    }
  }

  private parseProjectPlan(response: string): ProjectPlan {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        return this.validateProjectPlan(plan);
      }
    } catch (error) {
      console.error("Error parsing project plan:", error);
    }

    return this.createFallbackPlan();
  }

  private validateProjectPlan(plan: any): ProjectPlan {
    return {
      title:
        plan.title ||
        `${this.context.projectType || "Custom"} Development Project`,
      description:
        plan.description ||
        "A custom solution tailored to your specific requirements.",
      phases: Array.isArray(plan.phases)
        ? plan.phases
        : this.createDefaultPhases(),
      technologies: Array.isArray(plan.technologies)
        ? plan.technologies
        : this.getRecommendedTechnologies(),
      timeline: plan.timeline || this.estimateTimeline(),
      budget: plan.budget || this.estimateBudget(),
      risks: Array.isArray(plan.risks) ? plan.risks : this.getCommonRisks(),
      recommendations: Array.isArray(plan.recommendations)
        ? plan.recommendations
        : this.getRecommendations(),
    };
  }

  private createFallbackPlan(): ProjectPlan {
    return {
      title: `${this.context.projectType || "Custom"} Development Project`,
      description:
        "A tailored solution based on your requirements and our consultation.",
      phases: this.createDefaultPhases(),
      technologies: this.getRecommendedTechnologies(),
      timeline: this.estimateTimeline(),
      budget: this.estimateBudget(),
      risks: this.getCommonRisks(),
      recommendations: this.getRecommendations(),
    };
  }

  private createDefaultPhases() {
    return [
      {
        name: "Discovery & Planning",
        duration: "2-3 weeks",
        tasks: [
          "Requirements analysis",
          "Technical architecture",
          "Project planning",
        ],
        deliverables: [
          "Requirements document",
          "Technical specification",
          "Project plan",
        ],
      },
      {
        name: "Design & Prototyping",
        duration: "2-3 weeks",
        tasks: ["UI/UX design", "Prototype development", "User testing"],
        deliverables: [
          "Design system",
          "Interactive prototype",
          "User feedback report",
        ],
      },
      {
        name: "Development",
        duration: "6-10 weeks",
        tasks: ["Backend development", "Frontend development", "Integration"],
        deliverables: [
          "Working application",
          "API documentation",
          "Test suite",
        ],
      },
      {
        name: "Testing & Launch",
        duration: "2-3 weeks",
        tasks: ["Quality assurance", "Performance testing", "Deployment"],
        deliverables: ["Tested application", "Deployment guide", "Launch plan"],
      },
    ];
  }

  private getRecommendedTechnologies(): string[] {
    const { projectType, problemDomain } = this.context;

    let technologies = ["React", "Node.js", "PostgreSQL", "AWS"];

    if (projectType?.includes("mobile")) {
      technologies = ["React Native", "Expo", "Firebase", "Redux"];
    } else if (problemDomain === "e-commerce") {
      technologies = ["Next.js", "Stripe", "Shopify API", "Redis"];
    }

    return technologies;
  }

  private estimateTimeline(): string {
    const complexity = this.assessProjectComplexity();

    if (complexity < 0.3) return "6-10 weeks";
    if (complexity < 0.6) return "10-16 weeks";
    return "16-24 weeks";
  }

  private estimateBudget(): string {
    const complexity = this.assessProjectComplexity();

    if (complexity < 0.3) return "$15,000 - $30,000";
    if (complexity < 0.6) return "$30,000 - $60,000";
    return "$60,000 - $120,000";
  }

  private assessProjectComplexity(): number {
    let complexity = 0.3; // Base complexity

    if (this.context.techStack && this.context.techStack.length > 5)
      complexity += 0.2;
    if (this.context.requirements && this.context.requirements.length > 10)
      complexity += 0.2;
    if (this.context.stakeholders && this.context.stakeholders.length > 3)
      complexity += 0.1;
    if (
      this.context.problemDomain === "healthcare" ||
      this.context.problemDomain === "finance"
    )
      complexity += 0.2;

    return Math.min(complexity, 1.0);
  }

  private getCommonRisks(): string[] {
    return [
      "Scope creep due to changing requirements",
      "Integration complexity with existing systems",
      "Performance issues at scale",
      "Security vulnerabilities",
      "Timeline delays due to technical challenges",
      "User adoption and change management",
    ];
  }

  private getRecommendations(): string[] {
    return [
      "Start with an MVP to validate core assumptions",
      "Implement agile development methodology",
      "Plan for iterative user feedback and testing",
      "Invest in proper security measures from the start",
      "Consider scalability in the initial architecture",
      "Allocate budget for ongoing maintenance and updates",
    ];
  }

  /**
   * Get the next set of questions based on the current context and stage.
   */
  getNextQuestions(): string[] {
    if (!this.context || !this.currentStage) {
      return ["Can you provide more details about your project?"];
    }

    switch (this.currentStage) {
      case "discovery":
        return [
          "What is the primary goal of your project?",
          "Who are the target users?",
          "What problem are you trying to solve?",
        ];
      case "analysis":
        return [
          "What are the key features you envision?",
          "Do you have any specific technology preferences?",
          "What is your budget range?",
        ];
      case "specification":
        return [
          "Can you provide detailed requirements for each feature?",
          "Are there any constraints or limitations we should consider?",
        ];
      case "planning":
        return [
          "What is your preferred timeline for the project?",
          "Who are the stakeholders involved?",
        ];
      case "complete":
        return ["Is there anything else we can assist you with?"];
      default:
        return ["Can you provide more details about your project?"];
    }
  }

  // Getters for accessing conversation state
  getConversation(): ConversationMessage[] {
    return this.conversation;
  }

  getContext(): ConversationContext {
    return this.context;
  }

  getCurrentStage(): string {
    return this.currentStage;
  }

  // Method to save/load conversation state
  saveState(): string {
    return JSON.stringify({
      conversation: this.conversation,
      context: this.context,
      currentStage: this.currentStage,
    });
  }

  loadState(state: string): void {
    try {
      const data = JSON.parse(state);
      this.conversation = data.conversation || [];
      this.context = data.context || {};
      this.currentStage = data.currentStage || "discovery";
    } catch (error) {
      console.error("Error loading conversation state:", error);
    }
  }

  // Method to get the confidence level from the last assistant message
  getConfidence(): number {
    const lastAssistantMessage = this.conversation
      .slice()
      .reverse()
      .find((msg) => msg.role === "assistant");
    return lastAssistantMessage?.metadata?.confidence ?? 50; // Default confidence is 50 if not available
  }

  /**
   * Resets the agent's context and conversation history.
   */
  reset(): void {
    this.context = {};
    this.conversation = [];
    this.currentStage = "discovery";
  }
}

export function createConversationalAIAgent(): ConversationalAIAgent {
  return new ConversationalAIAgent();
}

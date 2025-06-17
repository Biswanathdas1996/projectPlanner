import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ProjectRequirements {
  projectType: string;
  industry: string;
  scope: "small" | "medium" | "large" | "enterprise";
  timeline: string;
  budget: string;
  teamSize: string;
  technicalComplexity: "low" | "medium" | "high" | "expert";
  requirements: string[];
  stakeholders: string[];
  constraints: string[];
}

export interface ProjectSection {
  title: string;
  content: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedHours: number;
}

export interface ComprehensiveProjectPlan {
  projectOverview: ProjectSection;
  technicalArchitecture: ProjectSection;
  developmentPhases: ProjectSection[];
  riskManagement: ProjectSection;
  qualityAssurance: ProjectSection;
  deployment: ProjectSection;
  maintenance: ProjectSection;
  budgetBreakdown: ProjectSection;
  timelineDetails: ProjectSection;
  teamStructure: ProjectSection;
  stakeholderMatrix: ProjectSection;
  complianceRequirements: ProjectSection;
  scalabilityPlan: ProjectSection;
  securityFramework: ProjectSection;
  totalEstimatedHours: number;
  totalEstimatedCost: number;
  criticalPath: string[];
}

export class AIProjectPlannerAgent {
  private model: any;
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;

  constructor() {
    const genAI = new GoogleGenerativeAI(
      "AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM"
    );
    this.model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  async generateComprehensiveProjectPlan(
    description: string,
    requirements: Partial<ProjectRequirements> = {},
    progressCallback?: (step: string, progress: number) => void
  ): Promise<ComprehensiveProjectPlan> {
    progressCallback?.("Analyzing project requirements", 10);

    // Extract and analyze project requirements
    const analyzedRequirements = await this.analyzeProjectRequirements(
      description
    );
    const mergedRequirements = { ...analyzedRequirements, ...requirements };

    progressCallback?.("Creating technical architecture plan", 20);

    // Generate each section with specialized prompts
    const sections = await this.generateAllSections(
      mergedRequirements,
      description,
      progressCallback
    );

    progressCallback?.("Calculating project metrics", 90);

    // Calculate totals and critical path
    const totalEstimatedHours = sections.reduce(
      (total, section) => total + section.estimatedHours,
      0
    );
    const totalEstimatedCost = this.calculateProjectCost(
      totalEstimatedHours,
      mergedRequirements
    );
    const criticalPath = this.identifyCriticalPath(sections);

    progressCallback?.("Finalizing project plan", 100);

    return {
      projectOverview: sections[0],
      technicalArchitecture: sections[1],
      developmentPhases: sections.slice(2, 7),
      riskManagement: sections[7],
      qualityAssurance: sections[8],
      deployment: sections[9],
      maintenance: sections[10],
      budgetBreakdown: sections[11],
      timelineDetails: sections[12],
      teamStructure: sections[13],
      stakeholderMatrix: sections[14],
      complianceRequirements: sections[15],
      scalabilityPlan: sections[16],
      securityFramework: sections[17],
      totalEstimatedHours,
      totalEstimatedCost,
      criticalPath,
    };
  }

  private async analyzeProjectRequirements(
    description: string
  ): Promise<ProjectRequirements> {
    const prompt = `
Analyze the following project description and extract structured requirements:

"${description}"

Return a JSON object with the following structure:
{
  "projectType": "web_app | mobile_app | desktop_app | ai_system | iot_platform | enterprise_software | ecommerce | saas",
  "industry": "technology | healthcare | finance | education | retail | manufacturing | other",
  "scope": "small | medium | large | enterprise",
  "timeline": "estimated timeline in months",
  "budget": "estimated budget range",
  "teamSize": "recommended team size",
  "technicalComplexity": "low | medium | high | expert",
  "requirements": ["list", "of", "functional", "requirements"],
  "stakeholders": ["list", "of", "stakeholder", "types"],
  "constraints": ["list", "of", "project", "constraints"]
}

Ensure realistic estimates based on project complexity.`;

    try {
      const result = await this.retryableRequest(() =>
        this.model.generateContent(prompt)
      );
      const response = result.response.text();
      const cleanedResponse = this.extractJsonFromResponse(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.warn("Failed to analyze requirements, using defaults:", error);
      return this.getDefaultRequirements();
    }
  }

  private async generateAllSections(
    requirements: ProjectRequirements,
    originalDescription: string,
    progressCallback?: (step: string, progress: number) => void
  ): Promise<ProjectSection[]> {
    const sectionPrompts = this.buildSectionPrompts(
      requirements,
      originalDescription
    );
    const sections: ProjectSection[] = [];

    // Generate sections in batches to avoid rate limits and improve reliability
    const batchSize = 3;
    
    for (let i = 0; i < sectionPrompts.length; i += batchSize) {
      const batch = sectionPrompts.slice(i, i + batchSize);
      const batchPromises = batch.map(async (sectionPrompt, batchIndex) => {
        const globalIndex = i + batchIndex;
        const progress = 20 + (globalIndex / sectionPrompts.length) * 70;
        progressCallback?.(sectionPrompt.title, progress);

        try {
          const section = await this.generateSection(sectionPrompt, requirements);
          return section;
        } catch (error) {
          console.warn(`Failed to generate section: ${sectionPrompt.title}`, error);
          return this.getFallbackSection(sectionPrompt.title);
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      sections.push(...batchResults);

      // Add delay between batches to prevent rate limiting
      if (i + batchSize < sectionPrompts.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return sections;
  }

  private buildSectionPrompts(
    requirements: ProjectRequirements,
    description: string
  ) {
    return [
      {
        title: "Project Overview",
        prompt: `Create a comprehensive project overview for: "${description}"
        
        Include:
        - Executive summary
        - Project objectives and success criteria
        - Business value proposition
        - Key deliverables
        - High-level milestones
        - Resource requirements overview
        
        Project Type: ${requirements.projectType}
        Industry: ${requirements.industry}
        Scope: ${requirements.scope}
        Timeline: ${requirements.timeline}
        
        Make it professional and investor-ready.`,
      },
      {
        title: "Technical Architecture",
        prompt: `Design detailed technical architecture for: "${description}"
        
        Create a modern HTML architecture diagram using these specific CSS classes and structure:
        
        <div class="architecture-diagram">
          <div class="section-divider">
            <div class="section-divider-text">System Architecture</div>
          </div>
          <div class="diagram-container">
            <div class="diagram-box primary">
              <div class="diagram-title">Frontend Layer</div>
              <div class="diagram-subtitle">React/Vue/Angular</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">API Gateway</div>
              <div class="diagram-subtitle">REST/GraphQL</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Database</div>
              <div class="diagram-subtitle">PostgreSQL/MongoDB</div>
            </div>
          </div>
        </div>
        
        <div class="flowchart">
          <div class="flow-step">User Interface</div>
          <div class="flow-step">API Layer</div>
          <div class="flow-step">Business Logic</div>
          <div class="flow-step">Data Storage</div>
        </div>
        
        Include:
        - Technology stack recommendations with visual flow
        - Database design approach
        - API architecture with modern styling
        - Security architecture layers
        - Performance considerations
        - Integration points
        - Scalability strategy
        
        Technical Complexity: ${requirements.technicalComplexity}
        Team Size: ${requirements.teamSize}
        
        Use the provided CSS classes for all diagrams and flowcharts.`,
      },
      {
        title: "Phase 1: Foundation & Setup",
        prompt: `Detail Phase 1 foundation work for: "${description}"
        
        Create a development flow with modern styling:
        
        <div class="section-divider">
          <div class="section-divider-text">Development Flow</div>
        </div>
        
        <div class="flowchart">
          <div class="flow-step">Environment Setup</div>
          <div class="flow-step">Framework Config</div>
          <div class="flow-step">Database Init</div>
          <div class="flow-step">Auth System</div>
          <div class="flow-step">UI Framework</div>
        </div>
        
        Include:
        - Environment setup with visual progression
        - Development tools configuration
        - Basic infrastructure components
        - Core framework implementation steps
        - Initial database setup process
        - Authentication system architecture
        - Basic UI/UX framework structure
        
        Provide specific tasks, dependencies, and time estimates with flowchart visualization.`,
      },
      {
        title: "Phase 2: Core Development",
        prompt: `Detail Phase 2 core development for: "${description}"
        
        Create a development pipeline with modern architecture:
        
        <div class="architecture-diagram">
          <div class="section-divider">
            <div class="section-divider-text">Core Development Pipeline</div>
          </div>
          <div class="diagram-container">
            <div class="diagram-box primary">
              <div class="diagram-title">Feature Development</div>
              <div class="diagram-subtitle">Main Components</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">API Development</div>
              <div class="diagram-subtitle">Backend Services</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Frontend UI</div>
              <div class="diagram-subtitle">User Interface</div>
            </div>
          </div>
        </div>
        
        <div class="flowchart">
          <div class="flow-step">Business Logic</div>
          <div class="flow-step">Database Schema</div>
          <div class="flow-step">API Endpoints</div>
          <div class="flow-step">Component Library</div>
          <div class="flow-step">Integration Tests</div>
        </div>
        
        Include:
        - Main feature implementation roadmap
        - Business logic development with visual flow
        - Database schema completion process
        - API development architecture
        - Frontend component development structure
        - Integration testing pipeline
        
        Focus on core functionality and MVP features with modern diagram presentation.`,
      },
      {
        title: "Phase 3: Advanced Features",
        prompt: `Detail Phase 3 advanced features for: "${description}"
        
        Create an advanced features architecture:
        
        <div class="architecture-diagram">
          <div class="section-divider">
            <div class="section-divider-text">Advanced Features Architecture</div>
          </div>
          <div class="diagram-container">
            <div class="diagram-box primary">
              <div class="diagram-title">Performance Layer</div>
              <div class="diagram-subtitle">Optimization & Caching</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Security Module</div>
              <div class="diagram-subtitle">Advanced Protection</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Analytics Engine</div>
              <div class="diagram-subtitle">Data Intelligence</div>
            </div>
          </div>
        </div>
        
        <div class="flowchart">
          <div class="flow-step">Performance Optimization</div>
          <div class="flow-step">Security Hardening</div>
          <div class="flow-step">Third-party APIs</div>
          <div class="flow-step">Advanced UI/UX</div>
          <div class="flow-step">Analytics</div>
        </div>
        
        Include:
        - Advanced functionality implementation with visual flow
        - Performance optimization strategies
        - Advanced security features architecture
        - Third-party integrations roadmap
        - Advanced UI/UX components structure
        - Analytics implementation pipeline
        
        Focus on value-added features and optimizations with modern diagram presentation.`,
      },
      {
        title: "Phase 4: Testing & QA",
        prompt: `Detail Phase 4 testing and quality assurance for: "${description}"
        
        Create a comprehensive testing pipeline:
        
        <div class="architecture-diagram">
          <div class="section-divider">
            <div class="section-divider-text">Testing & QA Pipeline</div>
          </div>
          <div class="diagram-container">
            <div class="diagram-box primary">
              <div class="diagram-title">Automated Testing</div>
              <div class="diagram-subtitle">Unit & Integration</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Performance Testing</div>
              <div class="diagram-subtitle">Load & Stress</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Security Testing</div>
              <div class="diagram-subtitle">Penetration & Audit</div>
            </div>
          </div>
        </div>
        
        <div class="flowchart">
          <div class="flow-step">Unit Tests</div>
          <div class="flow-step">Integration Tests</div>
          <div class="flow-step">Performance Tests</div>
          <div class="flow-step">Security Audit</div>
          <div class="flow-step">UAT</div>
          <div class="flow-step">Production Ready</div>
        </div>
        
        Include:
        - Comprehensive testing strategy with visual flow
        - Automated testing implementation pipeline
        - Performance testing architecture
        - Security testing framework
        - User acceptance testing process
        - Bug fixing and optimization workflow
        
        Ensure production-ready quality with modern testing visualization.`,
      },
      {
        title: "Phase 5: Deployment & Launch",
        prompt: `Detail Phase 5 deployment and launch for: "${description}"
        
        Create a deployment pipeline architecture:
        
        <div class="architecture-diagram">
          <div class="section-divider">
            <div class="section-divider-text">Deployment Pipeline</div>
          </div>
          <div class="diagram-container">
            <div class="diagram-box primary">
              <div class="diagram-title">CI/CD Pipeline</div>
              <div class="diagram-subtitle">Automated Deployment</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Production Environment</div>
              <div class="diagram-subtitle">Live Server Setup</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Monitoring System</div>
              <div class="diagram-subtitle">Performance Tracking</div>
            </div>
          </div>
        </div>
        
        <div class="flowchart">
          <div class="flow-step">Environment Setup</div>
          <div class="flow-step">CI/CD Configuration</div>
          <div class="flow-step">Performance Monitoring</div>
          <div class="flow-step">Launch Strategy</div>
          <div class="flow-step">Post-Launch Support</div>
        </div>
        
        Include:
        - Production environment setup with visual flow
        - Deployment automation pipeline
        - Monitoring and logging architecture
        - Performance monitoring systems
        - Launch strategy roadmap
        - Post-launch support structure
        
        Ensure smooth production deployment with modern visualization.`,
      },
      {
        title: "Risk Management",
        prompt: `Create comprehensive risk management plan for: "${description}"
        
        Include:
        - Technical risks and mitigation
        - Business risks assessment
        - Resource risks
        - Timeline risks
        - External dependency risks
        - Contingency planning
        
        Provide specific risk levels and mitigation strategies.`,
      },
      {
        title: "Quality Assurance",
        prompt: `Design quality assurance framework for: "${description}"
        
        Include:
        - QA methodology
        - Testing standards
        - Code review process
        - Performance benchmarks
        - Security standards
        - Documentation requirements
        
        Ensure enterprise-grade quality.`,
      },
      {
        title: "Deployment Strategy",
        prompt: `Create detailed deployment strategy for: "${description}"
        
        Include:
        - Infrastructure requirements
        - CI/CD pipeline design
        - Environment management
        - Release management
        - Rollback procedures
        - Monitoring and alerting
        
        Focus on reliability and scalability.`,
      },
      {
        title: "Maintenance & Support",
        prompt: `Plan maintenance and support strategy for: "${description}"
        
        Include:
        - Ongoing maintenance tasks
        - Support structure
        - Update and upgrade procedures
        - Performance monitoring
        - Security maintenance
        - Long-term sustainability
        
        Plan for 3-5 year lifecycle.`,
      },
      {
        title: "Budget Breakdown",
        prompt: `Create detailed budget breakdown for: "${description}"
        
        Include:
        - Development costs
        - Infrastructure costs
        - Third-party services
        - Personnel costs
        - Testing and QA costs
        - Deployment costs
        - Ongoing operational costs
        
        Budget Range: ${requirements.budget}
        Team Size: ${requirements.teamSize}
        
        Provide realistic cost estimates with contingency.`,
      },
      {
        title: "Timeline Details",
        prompt: `Create detailed project timeline for: "${description}"
        
        Include:
        - Phase-by-phase breakdown
        - Critical path analysis
        - Dependencies mapping
        - Resource allocation timeline
        - Milestone definitions
        - Buffer time allocation
        
        Timeline: ${requirements.timeline}
        Scope: ${requirements.scope}
        
        Provide realistic scheduling with risk buffers.`,
      },
      {
        title: "Team Structure",
        prompt: `Design optimal team structure for: "${description}"
        
        Include:
        - Role definitions
        - Skill requirements
        - Team composition
        - Reporting structure
        - Communication protocols
        - Performance metrics
        
        Team Size: ${requirements.teamSize}
        Technical Complexity: ${requirements.technicalComplexity}
        
        Match team structure to project needs.`,
      },
      {
        title: "Stakeholder Matrix",
        prompt: `Create stakeholder engagement matrix for: "${description}"
        
        Include:
        - Stakeholder identification
        - Influence and interest mapping
        - Communication strategy
        - Feedback mechanisms
        - Decision-making authority
        - Escalation procedures
        
        Stakeholders: ${requirements.stakeholders.join(", ")}
        
        Ensure effective stakeholder management.`,
      },
      {
        title: "Compliance Requirements",
        prompt: `Define compliance and regulatory requirements for: "${description}"
        
        Include:
        - Industry regulations
        - Data protection requirements
        - Security compliance
        - Accessibility standards
        - International compliance
        - Audit requirements
        
        Industry: ${requirements.industry}
        
        Ensure full regulatory compliance.`,
      },
      {
        title: "Scalability Plan",
        prompt: `Design scalability and growth plan for: "${description}"
        
        Include:
        - Horizontal scaling strategy
        - Vertical scaling options
        - Performance optimization
        - Load balancing approach
        - Database scaling
        - Future enhancement roadmap
        
        Scope: ${requirements.scope}
        
        Plan for 10x growth scenarios.`,
      },
      {
        title: "Security Framework",
        prompt: `Create comprehensive security framework for: "${description}"
        
        Include:
        - Security architecture
        - Threat modeling
        - Authentication and authorization
        - Data encryption
        - Security monitoring
        - Incident response plan
        
        Industry: ${requirements.industry}
        Technical Complexity: ${requirements.technicalComplexity}
        
        Implement defense-in-depth strategy.`,
      },
    ];
  }

  private async generateSection(
    sectionPrompt: any,
    requirements: ProjectRequirements
  ): Promise<ProjectSection> {
    const enhancedPrompt = `${sectionPrompt.prompt}

Additional Context:
- Requirements: ${requirements.requirements.join(", ")}
- Constraints: ${requirements.constraints.join(", ")}
- Stakeholders: ${requirements.stakeholders.join(", ")}

Generate a detailed, professional section with:
1. Clear structure and headings
2. Specific, actionable recommendations
3. Realistic time and resource estimates
4. Risk considerations
5. Success metrics

Format as HTML with proper styling for professional presentation.
Include estimated hours for completion at the end.

Estimated Hours: [X hours]`;

    const result = await this.retryableRequest(() =>
      this.model.generateContent(enhancedPrompt)
    );
    const content = result.response.text();

    // Extract estimated hours from content
    const hoursMatch = content.match(
      /Estimated Hours:\s*\[?(\d+)\s*hours?\]?/i
    );
    const estimatedHours = hoursMatch
      ? parseInt(hoursMatch[1])
      : this.getDefaultHours(sectionPrompt.title);

    return {
      title: sectionPrompt.title,
      content: this.cleanHtmlContent(content),
      priority: this.getSectionPriority(sectionPrompt.title),
      estimatedHours,
    };
  }

  private async retryableRequest(requestFn: () => Promise<any>): Promise<any> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }
        console.warn(
          `Request attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * attempt)
        );
      }
    }
  }

  private extractJsonFromResponse(response: string): string {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : response;
  }

  private cleanHtmlContent(content: string): string {
    // Remove estimated hours line and clean up formatting
    return content
      .replace(/Estimated Hours:\s*\[?\d+\s*hours?\]?/gi, "")
      .replace(/```html\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
  }

  private getSectionPriority(
    title: string
  ): "critical" | "high" | "medium" | "low" {
    const criticalSections = [
      "Project Overview",
      "Technical Architecture",
      "Phase 1: Foundation & Setup",
    ];
    const highSections = [
      "Phase 2: Core Development",
      "Risk Management",
      "Security Framework",
    ];
    const mediumSections = [
      "Phase 3: Advanced Features",
      "Quality Assurance",
      "Deployment Strategy",
    ];

    if (criticalSections.includes(title)) return "critical";
    if (highSections.includes(title)) return "high";
    if (mediumSections.includes(title)) return "medium";
    return "low";
  }

  private getDefaultHours(sectionTitle: string): number {
    const hourMapping: Record<string, number> = {
      "Project Overview": 16,
      "Technical Architecture": 40,
      "Phase 1: Foundation & Setup": 120,
      "Phase 2: Core Development": 200,
      "Phase 3: Advanced Features": 160,
      "Phase 4: Testing & QA": 80,
      "Phase 5: Deployment & Launch": 60,
      "Risk Management": 24,
      "Quality Assurance": 32,
      "Deployment Strategy": 40,
      "Maintenance & Support": 24,
      "Budget Breakdown": 16,
      "Timeline Details": 20,
      "Team Structure": 16,
      "Stakeholder Matrix": 12,
      "Compliance Requirements": 32,
      "Scalability Plan": 40,
      "Security Framework": 48,
    };

    return hourMapping[sectionTitle] || 24;
  }

  private calculateProjectCost(
    totalHours: number,
    requirements: ProjectRequirements
  ): number {
    const hourlyRates = {
      low: 50,
      medium: 75,
      high: 100,
      expert: 150,
    };

    const baseRate = hourlyRates[requirements.technicalComplexity];
    const complexityMultiplier = {
      small: 1,
      medium: 1.2,
      large: 1.5,
      enterprise: 2,
    };

    return Math.round(
      totalHours * baseRate * complexityMultiplier[requirements.scope]
    );
  }

  private identifyCriticalPath(sections: ProjectSection[]): string[] {
    return sections
      .filter(
        (section) =>
          section.priority === "critical" || section.priority === "high"
      )
      .map((section) => section.title);
  }

  private getDefaultRequirements(): ProjectRequirements {
    return {
      projectType: "web_app",
      industry: "technology",
      scope: "medium",
      timeline: "6-12 months",
      budget: "$50,000 - $200,000",
      teamSize: "5-8 developers",
      technicalComplexity: "medium",
      requirements: [
        "User authentication",
        "Data management",
        "Responsive design",
      ],
      stakeholders: ["Project Manager", "Development Team", "End Users"],
      constraints: ["Budget limitations", "Timeline constraints"],
    };
  }

  private getFallbackSection(title: string): ProjectSection {
    return {
      title,
      content: `<div class="fallback-section">
        <h3>${title}</h3>
        <p>This section requires additional specification. Please provide more details about your ${title.toLowerCase()} requirements.</p>
        <ul>
          <li>Define specific requirements</li>
          <li>Identify key stakeholders</li>
          <li>Establish success criteria</li>
          <li>Set realistic timelines</li>
        </ul>
      </div>`,
      priority: "medium" as const,
      estimatedHours: this.getDefaultHours(title),
    };
  }
}

export function createAIProjectPlannerAgent(): AIProjectPlannerAgent {
  return new AIProjectPlannerAgent();
}

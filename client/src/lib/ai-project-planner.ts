import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ProjectRequirements {
  projectType: string;
  industry: string;
  scope: 'small' | 'medium' | 'large' | 'enterprise';
  timeline: string;
  budget: string;
  teamSize: string;
  technicalComplexity: 'low' | 'medium' | 'high' | 'expert';
  requirements: string[];
  stakeholders: string[];
  constraints: string[];
}

export interface ProjectSection {
  title: string;
  content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
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
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for AI project planning');
    }
    
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
  }

  async generateComprehensiveProjectPlan(
    description: string, 
    requirements: Partial<ProjectRequirements> = {},
    progressCallback?: (step: string, progress: number) => void
  ): Promise<ComprehensiveProjectPlan> {
    
    progressCallback?.('Analyzing project requirements', 10);
    
    // Extract and analyze project requirements
    const analyzedRequirements = await this.analyzeProjectRequirements(description);
    const mergedRequirements = { ...analyzedRequirements, ...requirements };
    
    progressCallback?.('Creating technical architecture plan', 20);
    
    // Generate each section with specialized prompts
    const sections = await this.generateAllSections(mergedRequirements, description, progressCallback);
    
    progressCallback?.('Calculating project metrics', 90);
    
    // Calculate totals and critical path
    const totalEstimatedHours = sections.reduce((total, section) => total + section.estimatedHours, 0);
    const totalEstimatedCost = this.calculateProjectCost(totalEstimatedHours, mergedRequirements);
    const criticalPath = this.identifyCriticalPath(sections);
    
    progressCallback?.('Finalizing project plan', 100);
    
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
      criticalPath
    };
  }

  private async analyzeProjectRequirements(description: string): Promise<ProjectRequirements> {
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
      const result = await this.retryableRequest(() => this.model.generateContent(prompt));
      const response = result.response.text();
      const cleanedResponse = this.extractJsonFromResponse(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.warn('Failed to analyze requirements, using defaults:', error);
      return this.getDefaultRequirements();
    }
  }

  private async generateAllSections(
    requirements: ProjectRequirements, 
    originalDescription: string,
    progressCallback?: (step: string, progress: number) => void
  ): Promise<ProjectSection[]> {
    
    const sectionPrompts = this.buildSectionPrompts(requirements, originalDescription);
    const sections: ProjectSection[] = [];
    
    for (let i = 0; i < sectionPrompts.length; i++) {
      const progress = 20 + (i / sectionPrompts.length) * 70;
      progressCallback?.(sectionPrompts[i].title, progress);
      
      try {
        const section = await this.generateSection(sectionPrompts[i], requirements);
        sections.push(section);
        
        // Add small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Failed to generate section: ${sectionPrompts[i].title}`, error);
        sections.push(this.getFallbackSection(sectionPrompts[i].title));
      }
    }
    
    return sections;
  }

  private buildSectionPrompts(requirements: ProjectRequirements, description: string) {
    return [
      {
        title: 'Project Overview',
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
        
        Make it professional and investor-ready.`
      },
      {
        title: 'Technical Architecture',
        prompt: `Design detailed technical architecture for: "${description}"
        
        Include:
        - System architecture diagram description
        - Technology stack recommendations
        - Database design approach
        - API architecture
        - Security architecture
        - Performance considerations
        - Integration points
        - Scalability strategy
        
        Technical Complexity: ${requirements.technicalComplexity}
        Team Size: ${requirements.teamSize}
        
        Provide specific technology recommendations and justify choices.`
      },
      {
        title: 'Phase 1: Foundation & Setup',
        prompt: `Detail Phase 1 foundation work for: "${description}"
        
        Include:
        - Environment setup
        - Development tools configuration
        - Basic infrastructure
        - Core framework implementation
        - Initial database setup
        - Authentication system
        - Basic UI/UX framework
        
        Provide specific tasks, dependencies, and time estimates.`
      },
      {
        title: 'Phase 2: Core Development',
        prompt: `Detail Phase 2 core development for: "${description}"
        
        Include:
        - Main feature implementation
        - Business logic development
        - Database schema completion
        - API development
        - Frontend component development
        - Integration testing
        
        Focus on core functionality and MVP features.`
      },
      {
        title: 'Phase 3: Advanced Features',
        prompt: `Detail Phase 3 advanced features for: "${description}"
        
        Include:
        - Advanced functionality implementation
        - Performance optimization
        - Advanced security features
        - Third-party integrations
        - Advanced UI/UX components
        - Analytics implementation
        
        Focus on value-added features and optimizations.`
      },
      {
        title: 'Phase 4: Testing & QA',
        prompt: `Detail Phase 4 testing and quality assurance for: "${description}"
        
        Include:
        - Comprehensive testing strategy
        - Automated testing implementation
        - Performance testing
        - Security testing
        - User acceptance testing
        - Bug fixing and optimization
        
        Ensure production-ready quality.`
      },
      {
        title: 'Phase 5: Deployment & Launch',
        prompt: `Detail Phase 5 deployment and launch for: "${description}"
        
        Include:
        - Production environment setup
        - Deployment automation
        - Monitoring and logging
        - Performance monitoring
        - Launch strategy
        - Post-launch support
        
        Ensure smooth production deployment.`
      },
      {
        title: 'Risk Management',
        prompt: `Create comprehensive risk management plan for: "${description}"
        
        Include:
        - Technical risks and mitigation
        - Business risks assessment
        - Resource risks
        - Timeline risks
        - External dependency risks
        - Contingency planning
        
        Provide specific risk levels and mitigation strategies.`
      },
      {
        title: 'Quality Assurance',
        prompt: `Design quality assurance framework for: "${description}"
        
        Include:
        - QA methodology
        - Testing standards
        - Code review process
        - Performance benchmarks
        - Security standards
        - Documentation requirements
        
        Ensure enterprise-grade quality.`
      },
      {
        title: 'Deployment Strategy',
        prompt: `Create detailed deployment strategy for: "${description}"
        
        Include:
        - Infrastructure requirements
        - CI/CD pipeline design
        - Environment management
        - Release management
        - Rollback procedures
        - Monitoring and alerting
        
        Focus on reliability and scalability.`
      },
      {
        title: 'Maintenance & Support',
        prompt: `Plan maintenance and support strategy for: "${description}"
        
        Include:
        - Ongoing maintenance tasks
        - Support structure
        - Update and upgrade procedures
        - Performance monitoring
        - Security maintenance
        - Long-term sustainability
        
        Plan for 3-5 year lifecycle.`
      },
      {
        title: 'Budget Breakdown',
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
        
        Provide realistic cost estimates with contingency.`
      },
      {
        title: 'Timeline Details',
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
        
        Provide realistic scheduling with risk buffers.`
      },
      {
        title: 'Team Structure',
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
        
        Match team structure to project needs.`
      },
      {
        title: 'Stakeholder Matrix',
        prompt: `Create stakeholder engagement matrix for: "${description}"
        
        Include:
        - Stakeholder identification
        - Influence and interest mapping
        - Communication strategy
        - Feedback mechanisms
        - Decision-making authority
        - Escalation procedures
        
        Stakeholders: ${requirements.stakeholders.join(', ')}
        
        Ensure effective stakeholder management.`
      },
      {
        title: 'Compliance Requirements',
        prompt: `Define compliance and regulatory requirements for: "${description}"
        
        Include:
        - Industry regulations
        - Data protection requirements
        - Security compliance
        - Accessibility standards
        - International compliance
        - Audit requirements
        
        Industry: ${requirements.industry}
        
        Ensure full regulatory compliance.`
      },
      {
        title: 'Scalability Plan',
        prompt: `Design scalability and growth plan for: "${description}"
        
        Include:
        - Horizontal scaling strategy
        - Vertical scaling options
        - Performance optimization
        - Load balancing approach
        - Database scaling
        - Future enhancement roadmap
        
        Scope: ${requirements.scope}
        
        Plan for 10x growth scenarios.`
      },
      {
        title: 'Security Framework',
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
        
        Implement defense-in-depth strategy.`
      }
    ];
  }

  private async generateSection(sectionPrompt: any, requirements: ProjectRequirements): Promise<ProjectSection> {
    const enhancedPrompt = `${sectionPrompt.prompt}

Additional Context:
- Requirements: ${requirements.requirements.join(', ')}
- Constraints: ${requirements.constraints.join(', ')}
- Stakeholders: ${requirements.stakeholders.join(', ')}

Generate a detailed, professional section with:
1. Clear structure and headings
2. Specific, actionable recommendations
3. Realistic time and resource estimates
4. Risk considerations
5. Success metrics

Format as HTML with proper styling for professional presentation.
Include estimated hours for completion at the end.

Estimated Hours: [X hours]`;

    const result = await this.retryableRequest(() => this.model.generateContent(enhancedPrompt));
    const content = result.response.text();
    
    // Extract estimated hours from content
    const hoursMatch = content.match(/Estimated Hours:\s*\[?(\d+)\s*hours?\]?/i);
    const estimatedHours = hoursMatch ? parseInt(hoursMatch[1]) : this.getDefaultHours(sectionPrompt.title);
    
    return {
      title: sectionPrompt.title,
      content: this.cleanHtmlContent(content),
      priority: this.getSectionPriority(sectionPrompt.title),
      estimatedHours
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
        console.warn(`Request attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
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
      .replace(/Estimated Hours:\s*\[?\d+\s*hours?\]?/gi, '')
      .replace(/```html\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  private getSectionPriority(title: string): 'critical' | 'high' | 'medium' | 'low' {
    const criticalSections = ['Project Overview', 'Technical Architecture', 'Phase 1: Foundation & Setup'];
    const highSections = ['Phase 2: Core Development', 'Risk Management', 'Security Framework'];
    const mediumSections = ['Phase 3: Advanced Features', 'Quality Assurance', 'Deployment Strategy'];
    
    if (criticalSections.includes(title)) return 'critical';
    if (highSections.includes(title)) return 'high';
    if (mediumSections.includes(title)) return 'medium';
    return 'low';
  }

  private getDefaultHours(sectionTitle: string): number {
    const hourMapping: Record<string, number> = {
      'Project Overview': 16,
      'Technical Architecture': 40,
      'Phase 1: Foundation & Setup': 120,
      'Phase 2: Core Development': 200,
      'Phase 3: Advanced Features': 160,
      'Phase 4: Testing & QA': 80,
      'Phase 5: Deployment & Launch': 60,
      'Risk Management': 24,
      'Quality Assurance': 32,
      'Deployment Strategy': 40,
      'Maintenance & Support': 24,
      'Budget Breakdown': 16,
      'Timeline Details': 20,
      'Team Structure': 16,
      'Stakeholder Matrix': 12,
      'Compliance Requirements': 32,
      'Scalability Plan': 40,
      'Security Framework': 48
    };
    
    return hourMapping[sectionTitle] || 24;
  }

  private calculateProjectCost(totalHours: number, requirements: ProjectRequirements): number {
    const hourlyRates = {
      low: 50,
      medium: 75,
      high: 100,
      expert: 150
    };
    
    const baseRate = hourlyRates[requirements.technicalComplexity];
    const complexityMultiplier = {
      small: 1,
      medium: 1.2,
      large: 1.5,
      enterprise: 2
    };
    
    return Math.round(totalHours * baseRate * complexityMultiplier[requirements.scope]);
  }

  private identifyCriticalPath(sections: ProjectSection[]): string[] {
    return sections
      .filter(section => section.priority === 'critical' || section.priority === 'high')
      .map(section => section.title);
  }

  private getDefaultRequirements(): ProjectRequirements {
    return {
      projectType: 'web_app',
      industry: 'technology',
      scope: 'medium',
      timeline: '6-12 months',
      budget: '$50,000 - $200,000',
      teamSize: '5-8 developers',
      technicalComplexity: 'medium',
      requirements: ['User authentication', 'Data management', 'Responsive design'],
      stakeholders: ['Project Manager', 'Development Team', 'End Users'],
      constraints: ['Budget limitations', 'Timeline constraints']
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
      priority: 'medium' as const,
      estimatedHours: this.getDefaultHours(title)
    };
  }
}

export function createAIProjectPlannerAgent(): AIProjectPlannerAgent {
  return new AIProjectPlannerAgent();
}
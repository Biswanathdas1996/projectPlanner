import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ProjectPlanSection {
  id: string;
  title: string;
  content: string;
  isGenerating: boolean;
  isCompleted: boolean;
  order: number;
}

export interface ProjectPlanProgress {
  currentSection: number;
  totalSections: number;
  currentSectionTitle: string;
  overallProgress: number;
  isGenerating: boolean;
}

export interface EnhancedProjectPlanConfig {
  projectDescription: string;
  additionalRequirements?: string[];
}

export class EnhancedProjectPlanner {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GOOGLE_AI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  private getDefaultSections(): ProjectPlanSection[] {
    return [
      {
        id: "executive-summary",
        title: "Executive Summary",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 1
      },
      {
        id: "technical-architecture",
        title: "Technical Architecture & Infrastructure",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 2
      },
      {
        id: "feature-specifications",
        title: "Detailed Feature Specifications",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 3
      },
      {
        id: "development-methodology",
        title: "Development Methodology & Timeline",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 4
      },
      {
        id: "user-experience",
        title: "User Experience & Interface Design",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 5
      },
      {
        id: "quality-assurance",
        title: "Quality Assurance & Testing Strategy",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 6
      },
      {
        id: "deployment-devops",
        title: "Deployment & DevOps Strategy",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 7
      },
      {
        id: "risk-management",
        title: "Risk Management & Mitigation",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 8
      },
      {
        id: "stakeholder-management",
        title: "Stakeholder Management",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 9
      },
      {
        id: "post-launch",
        title: "Post-Launch Strategy",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 10
      }
    ];
  }

  private buildSectionPrompt(
    sectionTitle: string,
    projectDescription: string,
    additionalRequirements?: string[]
  ): string {
    const baseContext = `Project Description: ${projectDescription}`;
    const requirements = additionalRequirements && additionalRequirements.length > 0 
      ? `\n\nAdditional Requirements:\n${additionalRequirements.map(req => `- ${req}`).join('\n')}`
      : '';

    const sectionPrompts: Record<string, string> = {
      "Executive Summary": `Create a comprehensive executive summary for this project. Include:
        - Project overview and objectives
        - Key value propositions
        - Target market and user base
        - High-level technical approach
        - Expected outcomes and success metrics
        - Investment requirements and ROI projections`,

      "Technical Architecture & Infrastructure": `Design the technical architecture and infrastructure for this project. Include:
        - System architecture diagrams and component breakdown
        - Technology stack recommendations with justifications
        - Database design and data flow architecture
        - API design and integration points
        - Scalability considerations and performance requirements
        - Security architecture and compliance considerations`,

      "Detailed Feature Specifications": `Create detailed feature specifications for this project. Include:
        - Complete feature list with priorities
        - User stories and acceptance criteria
        - Functional requirements and business rules
        - Non-functional requirements
        - Feature dependencies and integration points
        - API specifications and data models`,

      "Development Methodology & Timeline": `Develop the methodology and timeline for this project. Include:
        - Development methodology (Agile/Scrum/etc.) with justification
        - Sprint planning and milestone breakdown
        - Resource allocation and team structure
        - Critical path analysis and dependencies
        - Risk buffer and contingency planning
        - Delivery schedule with realistic timelines`,

      "User Experience & Interface Design": `Design the user experience and interface strategy. Include:
        - User personas and journey mapping
        - Information architecture and navigation flow
        - Wireframes and UI/UX design principles
        - Accessibility and usability standards
        - Responsive design considerations
        - User testing and feedback integration plan`,

      "Quality Assurance & Testing Strategy": `Create a comprehensive testing strategy. Include:
        - Testing methodology and approach
        - Unit, integration, and end-to-end testing plans
        - Performance and load testing strategies
        - Security testing and vulnerability assessment
        - User acceptance testing procedures
        - Bug tracking and quality metrics`,

      "Deployment & DevOps Strategy": `Design the deployment and DevOps strategy. Include:
        - CI/CD pipeline design and implementation
        - Environment management (dev, staging, prod)
        - Infrastructure as code and automation
        - Monitoring and logging strategies
        - Backup and disaster recovery plans
        - Release management and rollback procedures`,

      "Risk Management & Mitigation": `Develop risk management strategies. Include:
        - Technical risk assessment and mitigation
        - Project timeline and resource risks
        - Market and competitive risks
        - Security and compliance risks
        - Third-party dependency risks
        - Contingency planning and response strategies`,

      "Stakeholder Management": `Create stakeholder management plan. Include:
        - Stakeholder identification and analysis
        - Communication plan and reporting structure
        - Change management and approval processes
        - Conflict resolution procedures
        - Progress tracking and transparency measures
        - Feedback collection and integration methods`,

      "Post-Launch Strategy": `Develop post-launch strategy and maintenance plan. Include:
        - Go-to-market strategy and launch plan
        - User onboarding and support systems
        - Performance monitoring and analytics
        - Maintenance and update procedures
        - Scale-up and growth strategies
        - Long-term roadmap and evolution plan`
    };

    const prompt = sectionPrompts[sectionTitle as keyof typeof sectionPrompts] || `Create a detailed section about ${sectionTitle} for this project.`;

    return `${baseContext}${requirements}

${prompt}

Please provide a comprehensive, well-structured response with clear headings, bullet points, and actionable recommendations. Focus on practical implementation details and industry best practices.`;
  }

  async generateSection(
    sectionTitle: string,
    config: EnhancedProjectPlanConfig
  ): Promise<string> {
    try {
      const prompt = this.buildSectionPrompt(
        sectionTitle,
        config.projectDescription,
        config.additionalRequirements
      );

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error(`Error generating section ${sectionTitle}:`, error);
      throw new Error(`Failed to generate ${sectionTitle} section`);
    }
  }

  async generateCompletePlan(
    config: EnhancedProjectPlanConfig,
    onProgress?: (progress: ProjectPlanProgress) => void
  ): Promise<ProjectPlanSection[]> {
    const sections = this.getDefaultSections();
    const totalSections = sections.length;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Update progress
      if (onProgress) {
        onProgress({
          currentSection: i + 1,
          totalSections,
          currentSectionTitle: section.title,
          overallProgress: (i / totalSections) * 100,
          isGenerating: true
        });
      }

      // Mark section as generating
      section.isGenerating = true;

      try {
        // Generate content for this section
        section.content = await this.generateSection(section.title, config);
        section.isCompleted = true;
      } catch (error) {
        console.error(`Failed to generate section ${section.title}:`, error);
        section.content = `Error generating content for ${section.title}. Please try again.`;
      } finally {
        section.isGenerating = false;
      }

      // Small delay between sections to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Final progress update
    if (onProgress) {
      onProgress({
        currentSection: totalSections,
        totalSections,
        currentSectionTitle: "Complete",
        overallProgress: 100,
        isGenerating: false
      });
    }

    return sections;
  }

  generateHtmlReport(sections: ProjectPlanSection[]): string {
    const sectionsHtml = sections
      .sort((a, b) => a.order - b.order)
      .map(section => `
        <section class="project-section" id="${section.id}">
          <h2 class="section-title">${section.title}</h2>
          <div class="section-content">
            ${this.formatSectionContent(section.content)}
          </div>
        </section>
      `).join('\n');

    return `
      <div class="enhanced-project-plan">
        <header class="plan-header">
          <h1>Comprehensive Project Plan</h1>
          <div class="plan-meta">
            <span>Generated on: ${new Date().toLocaleDateString()}</span>
            <span>Sections: ${sections.length}</span>
          </div>
        </header>
        
        <nav class="plan-toc">
          <h3>Table of Contents</h3>
          <ol>
            ${sections.map(section => `
              <li><a href="#${section.id}">${section.title}</a></li>
            `).join('')}
          </ol>
        </nav>

        <main class="plan-content">
          ${sectionsHtml}
        </main>
      </div>
    `;
  }

  private formatSectionContent(content: string): string {
    // Convert markdown-like formatting to HTML
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*?)$/gm, '<h4>$1</h4>')
      .replace(/^## (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^# (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>');
    
    // Wrap list items in ul tags
    formatted = formatted.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');
    
    // Handle paragraphs
    formatted = formatted
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.)/gm, '<p>$1')
      .replace(/(.*)$/gm, '$1</p>');
      
    return formatted;
  }
}

export function createEnhancedProjectPlanner(): EnhancedProjectPlanner {
  return new EnhancedProjectPlanner();
}
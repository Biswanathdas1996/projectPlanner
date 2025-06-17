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
    const genAI = new GoogleGenerativeAI("AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM");
    this.genAI = genAI;
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
      "Executive Summary": `Create a comprehensive executive summary with rich HTML formatting. Include:
        - Project overview and objectives with key metrics
        - Value propositions in card format
        - Target market analysis with demographics table
        - Technical approach with architecture flow
        - Success metrics dashboard layout
        - ROI projections table with timeline`,

      "Technical Architecture & Infrastructure": `Design technical architecture with HTML-based visual elements:
        - System architecture using HTML flowcharts (no images, use div boxes and CSS)
        - Technology stack comparison table with detailed specifications
        - Database schema represented as HTML tables and relationships
        - API endpoints table with request/response examples
        - Scalability metrics dashboard using HTML metrics cards
        - Security protocols matrix with implementation details`,

      "Detailed Feature Specifications": `Create feature specifications with structured layouts:
        - Feature priority matrix table
        - User stories in card format
        - Acceptance criteria checklists
        - Requirements traceability matrix
        - Feature dependencies flowchart
        - API specifications table`,

      "Development Methodology & Timeline": `Develop methodology with HTML-based visual planning:
        - Methodology comparison table with pros/cons
        - Sprint timeline using HTML timeline components (no images)
        - Team structure using HTML organizational chart with connected boxes
        - Critical path represented as HTML flowchart with dependencies
        - Resource allocation table with capacity metrics
        - Delivery schedule using HTML timeline with milestones`,

      "User Experience & Interface Design": `Design UX strategy with HTML visual elements:
        - User persona cards using HTML card components
        - User journey represented as HTML flow diagrams (no images)
        - Information architecture as nested HTML structure
        - Design principles in checklist format
        - Accessibility compliance table with WCAG standards
        - Responsive breakpoint specifications table`,

      "Quality Assurance & Testing Strategy": `Create testing strategy with detailed matrices:
        - Testing types coverage matrix
        - Test execution timeline
        - Quality metrics dashboard
        - Bug severity classification table
        - Testing tools comparison
        - QA process flowchart`,

      "Deployment & DevOps Strategy": `Design DevOps with HTML-based infrastructure visualization:
        - CI/CD pipeline using HTML flowchart components (no images)
        - Environment configuration comparison table
        - Infrastructure architecture as HTML connected diagrams
        - Monitoring metrics dashboard using HTML cards and tables
        - Deployment checklist with step-by-step HTML timeline
        - Backup and recovery procedures flowchart in HTML`,

      "Risk Management & Mitigation": `Develop risk management with HTML-based assessment visualization:
        - Risk probability/impact matrix using HTML table with color coding
        - Mitigation strategies table with action items
        - Risk timeline using HTML timeline components (no images)
        - Contingency planning flowchart using HTML connected elements
        - Risk response procedures as HTML workflow diagrams
        - Escalation matrix with responsibility levels`,

      "Stakeholder Management": `Create stakeholder plan with HTML communication visualization:
        - Stakeholder analysis matrix with influence/interest grid
        - Communication calendar using HTML timeline format
        - Responsibility assignment table with clear roles
        - Escalation procedures using HTML flowchart (no images)
        - Progress tracking dashboard using HTML metrics cards
        - Feedback collection system workflow in HTML`,

      "Post-Launch Strategy": `Develop post-launch with HTML roadmap visualization:
        - Launch timeline using HTML milestone components (no images)
        - User onboarding flow as HTML step-by-step diagram
        - Analytics dashboard using HTML metrics and charts
        - Maintenance schedule table with recurring tasks
        - Growth metrics tracking using HTML progress indicators
        - Feature roadmap using HTML timeline with phases`
    };

    const prompt = sectionPrompts[sectionTitle as keyof typeof sectionPrompts] || `Create a detailed section about ${sectionTitle} for this project.`;

    return `${baseContext}${requirements}

${prompt}

CRITICAL: Return ONLY clean HTML content without any markdown formatting, code blocks, or backtick tags. Your response must start directly with the HTML section tag and contain no explanatory text or markdown.

Create comprehensive HTML sections using ONLY HTML and CSS - NO IMAGES. For technical diagrams use:

ARCHITECTURE DIAGRAMS - Use HTML structure:
<div class="architecture-diagram">
  <div class="diagram-layer">
    <div class="diagram-component frontend">Frontend Layer</div>
    <div class="diagram-arrow right">→</div>
    <div class="diagram-component api">API Gateway</div>
    <div class="diagram-arrow right">→</div>
    <div class="diagram-component database">Database</div>
  </div>
</div>

ORGANIZATIONAL CHARTS - Use HTML structure:
<div class="org-chart">
  <div class="org-level">
    <div class="org-role manager">Project Manager</div>
  </div>
  <div class="org-level">
    <div class="org-role developer">Frontend Dev</div>
    <div class="org-role developer">Backend Dev</div>
    <div class="org-role designer">UI Designer</div>
  </div>
</div>

PROCESS FLOWS - Use HTML structure:
<div class="process-flow">
  <div class="process-step">
    <div class="process-number">1</div>
    <div class="process-content">
      <div class="process-title">Requirements Analysis</div>
      <div class="process-description">Gather and document requirements</div>
    </div>
  </div>
</div>

Use tables, flowcharts, timelines, cards, metrics, and status badges. Never suggest images or external diagrams. All visualizations must be HTML/CSS based.`;
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
      let content = response.text();
      
      // Clean up any markdown formatting or code blocks
      content = content
        .replace(/```html\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*html\s*/gi, '')
        .trim();
      
      return content;
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
      
      // Update progress - starting generation
      if (onProgress) {
        onProgress({
          currentSection: i + 1,
          totalSections,
          currentSectionTitle: section.title,
          overallProgress: (i / totalSections) * 100,
          isGenerating: true
        });
      }

      try {
        // Generate content for this section
        console.log(`Generating section ${i + 1}/${totalSections}: ${section.title}`);
        section.content = await this.generateSection(section.title, config);
        section.isCompleted = true;
        section.isGenerating = false;
        
        // Update progress - section completed
        if (onProgress) {
          onProgress({
            currentSection: i + 1,
            totalSections,
            currentSectionTitle: section.title,
            overallProgress: ((i + 1) / totalSections) * 100,
            isGenerating: i < totalSections - 1
          });
        }
      } catch (error) {
        console.error(`Failed to generate section ${section.title}:`, error);
        section.content = `Error generating content for ${section.title}. Please try again.`;
        section.isCompleted = false;
        section.isGenerating = false;
      }

      // Small delay between sections to prevent rate limiting and allow UI updates
      if (i < totalSections - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
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
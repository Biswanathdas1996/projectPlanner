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

      "Technical Architecture & Infrastructure": `Design technical architecture with visual elements:
        - System architecture flowchart with components
        - Technology stack comparison table
        - Database schema visualization
        - API endpoints table with specifications
        - Scalability metrics and performance benchmarks
        - Security protocols matrix`,

      "Detailed Feature Specifications": `Create feature specifications with structured layouts:
        - Feature priority matrix table
        - User stories in card format
        - Acceptance criteria checklists
        - Requirements traceability matrix
        - Feature dependencies flowchart
        - API specifications table`,

      "Development Methodology & Timeline": `Develop methodology with visual planning:
        - Methodology comparison table
        - Sprint timeline with milestones
        - Team structure organizational chart
        - Critical path flowchart
        - Resource allocation table
        - Delivery schedule with Gantt-style layout`,

      "User Experience & Interface Design": `Design UX strategy with visual elements:
        - User persona cards with demographics
        - User journey flow diagrams
        - Information architecture sitemap
        - Design principles checklist
        - Accessibility compliance table
        - Responsive breakpoint specifications`,

      "Quality Assurance & Testing Strategy": `Create testing strategy with detailed matrices:
        - Testing types coverage matrix
        - Test execution timeline
        - Quality metrics dashboard
        - Bug severity classification table
        - Testing tools comparison
        - QA process flowchart`,

      "Deployment & DevOps Strategy": `Design DevOps with infrastructure diagrams:
        - CI/CD pipeline flowchart
        - Environment configuration table
        - Infrastructure architecture diagram
        - Monitoring metrics dashboard
        - Deployment checklist
        - Backup and recovery procedures`,

      "Risk Management & Mitigation": `Develop risk management with assessment matrices:
        - Risk probability/impact matrix
        - Mitigation strategies table
        - Risk timeline and monitoring
        - Contingency planning flowchart
        - Risk response procedures
        - Escalation matrix`,

      "Stakeholder Management": `Create stakeholder plan with communication matrices:
        - Stakeholder analysis matrix
        - Communication calendar
        - Responsibility assignment table
        - Escalation procedures flowchart
        - Progress tracking dashboard
        - Feedback collection system`,

      "Post-Launch Strategy": `Develop post-launch with roadmap visualization:
        - Launch timeline with milestones
        - User onboarding flow
        - Analytics dashboard mockup
        - Maintenance schedule table
        - Growth metrics tracking
        - Feature roadmap timeline`
    };

    const prompt = sectionPrompts[sectionTitle as keyof typeof sectionPrompts] || `Create a detailed section about ${sectionTitle} for this project.`;

    return `${baseContext}${requirements}

${prompt}

CRITICAL: Format your response as a complete HTML section with rich visual elements. Use this exact structure:

<section class="project-section">
  <h1>${sectionTitle}</h1>
  
  <!-- Key metrics display -->
  <div class="grid">
    <div class="metric">
      <span class="metric-value">42</span>
      <span class="metric-label">Days Timeline</span>
    </div>
    <div class="metric">
      <span class="metric-value">$50K</span>
      <span class="metric-label">Budget Estimate</span>
    </div>
  </div>
  
  <!-- Data tables for comparisons -->
  <table>
    <thead>
      <tr><th>Component</th><th>Technology</th><th>Priority</th><th>Timeline</th></tr>
    </thead>
    <tbody>
      <tr><td>Frontend</td><td>React.js</td><td><span class="status-badge status-success">High</span></td><td>4 weeks</td></tr>
      <tr><td>Backend</td><td>Node.js</td><td><span class="status-badge status-info">Medium</span></td><td>6 weeks</td></tr>
    </tbody>
  </table>
  
  <!-- Process flow diagrams -->
  <div class="flowchart">
    <div class="flow-step">Planning</div>
    <div class="flow-step">Design</div>
    <div class="flow-step">Development</div>
    <div class="flow-step">Testing</div>
    <div class="flow-step">Deployment</div>
  </div>
  
  <!-- Timeline visualization -->
  <div class="timeline">
    <div class="timeline-item">
      <h3>Phase 1: Requirements (Weeks 1-2)</h3>
      <p>Gather requirements and define project scope</p>
    </div>
    <div class="timeline-item">
      <h3>Phase 2: Development (Weeks 3-8)</h3>
      <p>Core feature development and integration</p>
    </div>
  </div>
  
  <!-- Highlighted information boxes -->
  <div class="highlight">
    <h3>⚠️ Critical Consideration</h3>
    <p>Important information that requires special attention</p>
  </div>
  
  <!-- Organized content cards -->
  <div class="card">
    <h3>Technical Requirements</h3>
    <ul>
      <li>Modern web framework (React/Vue/Angular)</li>
      <li>RESTful API with authentication</li>
      <li>Database with ACID compliance</li>
    </ul>
  </div>
  
  <div class="card">
    <h3>Success Criteria</h3>
    <ol>
      <li>User registration and authentication</li>
      <li>Core functionality implementation</li>
      <li>Performance benchmarks met</li>
    </ol>
  </div>
</section>

Requirements:
- Use tables for data comparisons, specifications, and matrices
- Use flowcharts for processes, workflows, and system architecture
- Use timelines for project phases, milestones, and schedules
- Use cards for grouping related information and features
- Use status badges for priorities, states, and classifications
- Use metrics for key performance indicators and measurements
- Use highlight boxes for critical information and warnings
- Include realistic, specific data relevant to the project
- Structure content logically with proper HTML hierarchy

Make the content comprehensive, visually organized, and easy to scan with proper HTML structure and semantic elements.`;
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
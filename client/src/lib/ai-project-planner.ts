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
        prompt: `Create a comprehensive project overview for: "${description}" using modern HTML with responsive design elements.

        Generate HTML with these specific styling patterns:

        <div class="section-divider">
          <div class="section-divider-text">Project Overview</div>
        </div>

        <div class="architecture-diagram">
          <h3>Executive Summary</h3>
          <p>Brief overview content here...</p>
          
          <div class="flowchart">
            <div class="flow-step">Vision</div>
            <div class="flow-step">Strategy</div>
            <div class="flow-step">Execution</div>
            <div class="flow-step">Success</div>
          </div>
        </div>

        <h3>Key Objectives & Success Criteria</h3>
        <ul>
          <li>Primary objective with measurable outcomes</li>
          <li>Secondary objectives aligned with business goals</li>
          <li>Success metrics and KPIs</li>
        </ul>

        <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0;">
          <div class="diagram-box primary">
            <div class="diagram-title">Business Value</div>
            <div class="diagram-subtitle">ROI & Impact</div>
          </div>
          <div class="diagram-box secondary">
            <div class="diagram-title">Deliverables</div>
            <div class="diagram-subtitle">Key Outputs</div>
          </div>
          <div class="diagram-box accent">
            <div class="diagram-title">Timeline</div>
            <div class="diagram-subtitle">${requirements.timeline}</div>
          </div>
        </div>

        Include comprehensive content for:
        - Executive summary with strategic vision
        - Project objectives and measurable success criteria
        - Business value proposition with ROI projections
        - Key deliverables with acceptance criteria
        - High-level milestones with timeline visualization
        - Resource requirements with allocation charts

        Project Context:
        - Type: ${requirements.projectType}
        - Industry: ${requirements.industry}
        - Scope: ${requirements.scope}
        - Timeline: ${requirements.timeline}
        
        Use professional language suitable for stakeholders and investors. Include visual elements using the provided CSS classes.`,
      },
      {
        title: "Technical Architecture",
        prompt: `Design comprehensive technical architecture for: "${description}" with modern visual diagrams and responsive layout.

        Generate HTML using these exact CSS classes and structure patterns:

        <div class="section-divider">
          <div class="section-divider-text">System Architecture</div>
        </div>

        <div class="architecture-diagram">
          <h3>Technology Stack Overview</h3>
          <p>Comprehensive technical foundation designed for scalability and maintainability.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary">
              <div class="diagram-title">Frontend Layer</div>
              <div class="diagram-subtitle">React/Next.js/Vue</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">API Gateway</div>
              <div class="diagram-subtitle">REST/GraphQL</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Database Layer</div>
              <div class="diagram-subtitle">PostgreSQL/MongoDB</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Cloud Services</div>
              <div class="diagram-subtitle">AWS/Azure/GCP</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Data Flow Architecture</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">User Interface</div>
          <div class="flow-step">API Gateway</div>
          <div class="flow-step">Business Logic</div>
          <div class="flow-step">Data Processing</div>
          <div class="flow-step">Database Storage</div>
        </div>

        <h3>Security Architecture</h3>
        <ul>
          <li>Authentication & Authorization layers with JWT/OAuth2</li>
          <li>API security with rate limiting and input validation</li>
          <li>Data encryption at rest and in transit</li>
          <li>Security monitoring and audit trails</li>
        </ul>

        <div class="section-divider">
          <div class="section-divider-text">Integration Points</div>
        </div>

        <div class="architecture-diagram">
          <div class="diagram-container" style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin: 20px 0;">
            <div class="diagram-box secondary">
              <div class="diagram-title">External APIs</div>
              <div class="diagram-subtitle">Third-party Services</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Payment Gateway</div>
              <div class="diagram-subtitle">Stripe/PayPal</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Analytics</div>
              <div class="diagram-subtitle">Tracking & Metrics</div>
            </div>
          </div>
        </div>

        Include detailed sections for:
        - Technology stack recommendations with justification
        - Database schema design and optimization strategies
        - API architecture with versioning and documentation
        - Security layers and compliance requirements
        - Performance optimization and caching strategies
        - Scalability planning and load balancing
        - Integration architecture and third-party services
        - Deployment and CI/CD pipeline design

        Technical Context:
        - Complexity Level: ${requirements.technicalComplexity}
        - Team Size: ${requirements.teamSize}
        - Expected Scale: ${requirements.scope}

        Use modern web standards and best practices. Include all visual elements using the provided CSS classes.`,
      },
      {
        title: "Phase 1: Foundation & Setup",
        prompt: `Create detailed Phase 1 foundation plan for: "${description}" with modern visual workflow and tree structure.

        Generate HTML with comprehensive development flow using these CSS classes:

        <div class="section-divider">
          <div class="section-divider-text">Phase 1: Foundation & Setup</div>
        </div>

        <div class="architecture-diagram">
          <h3>Development Environment Setup</h3>
          <p>Establish robust development foundation with modern toolchain and infrastructure.</p>
          
          <div class="flowchart">
            <div class="flow-step">Environment Setup</div>
            <div class="flow-step">Framework Config</div>
            <div class="flow-step">Database Init</div>
            <div class="flow-step">Auth System</div>
            <div class="flow-step">UI Framework</div>
            <div class="flow-step">Testing Setup</div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Infrastructure Components</div>
        </div>

        <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0;">
          <div class="diagram-box primary">
            <div class="diagram-title">Development Tools</div>
            <div class="diagram-subtitle">IDE, Git, CI/CD Pipeline</div>
          </div>
          <div class="diagram-box secondary">
            <div class="diagram-title">Framework Setup</div>
            <div class="diagram-subtitle">Core Libraries & Dependencies</div>
          </div>
          <div class="diagram-box accent">
            <div class="diagram-title">Database Foundation</div>
            <div class="diagram-subtitle">Schema & Migration Tools</div>
          </div>
          <div class="diagram-box primary">
            <div class="diagram-title">Security Layer</div>
            <div class="diagram-subtitle">Authentication & Authorization</div>
          </div>
        </div>

        <h3>Development Timeline & Dependencies</h3>
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Duration</th>
              <th>Dependencies</th>
              <th>Deliverables</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Environment Setup</td>
              <td>2-3 days</td>
              <td>None</td>
              <td>Dev environment ready</td>
            </tr>
            <tr>
              <td>Framework Configuration</td>
              <td>3-4 days</td>
              <td>Environment</td>
              <td>Basic app structure</td>
            </tr>
            <tr>
              <td>Database Integration</td>
              <td>2-3 days</td>
              <td>Framework</td>
              <td>Data layer functional</td>
            </tr>
            <tr>
              <td>Authentication System</td>
              <td>4-5 days</td>
              <td>Database</td>
              <td>User management ready</td>
            </tr>
          </tbody>
        </table>

        <div class="section-divider">
          <div class="section-divider-text">Quality Assurance Setup</div>
        </div>

        <div class="architecture-diagram">
          <div class="flowchart">
            <div class="flow-step">Unit Testing</div>
            <div class="flow-step">Integration Tests</div>
            <div class="flow-step">Code Quality</div>
            <div class="flow-step">Documentation</div>
          </div>
        </div>

        Include comprehensive details for:
        - Development environment configuration with modern toolchain
        - Version control setup and branching strategy
        - Database design and migration framework
        - Authentication and authorization implementation
        - UI/UX framework integration and theming
        - Testing infrastructure and quality gates
        - Documentation standards and API documentation
        - Performance monitoring and logging setup

        Timeline: ${requirements.timeline}
        Team Size: ${requirements.teamSize}
        Technical Complexity: ${requirements.technicalComplexity}

        Provide specific tasks, time estimates, and dependency chains with visual flow representations.`,
      },
      {
        title: "Phase 2: Core Development",
        prompt: `Create comprehensive Phase 2 core development plan for: "${description}" with detailed visual workflow and feature tree structure.

        Generate HTML with modern development pipeline visualization:

        <div class="section-divider">
          <div class="section-divider-text">Phase 2: Core Development</div>
        </div>

        <div class="architecture-diagram">
          <h3>Core Development Pipeline</h3>
          <p>Build the main application features with robust architecture and scalable design patterns.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary">
              <div class="diagram-title">Feature Development</div>
              <div class="diagram-subtitle">Core Business Logic</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">API Development</div>
              <div class="diagram-subtitle">Backend Services</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Frontend Components</div>
              <div class="diagram-subtitle">User Interface</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Data Management</div>
              <div class="diagram-subtitle">Database & Storage</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Development Workflow</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">Business Logic</div>
          <div class="flow-step">Database Schema</div>
          <div class="flow-step">API Endpoints</div>
          <div class="flow-step">Component Library</div>
          <div class="flow-step">Feature Integration</div>
          <div class="flow-step">Testing Suite</div>
        </div>

        <h3>Feature Development Roadmap</h3>
        <table>
          <thead>
            <tr>
              <th>Feature Module</th>
              <th>Priority</th>
              <th>Complexity</th>
              <th>Timeline</th>
              <th>Dependencies</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>User Management System</td>
              <td>High</td>
              <td>Medium</td>
              <td>1-2 weeks</td>
              <td>Authentication</td>
            </tr>
            <tr>
              <td>Core Business Features</td>
              <td>High</td>
              <td>High</td>
              <td>3-4 weeks</td>
              <td>User System</td>
            </tr>
            <tr>
              <td>Data Processing Engine</td>
              <td>Medium</td>
              <td>High</td>
              <td>2-3 weeks</td>
              <td>Database Schema</td>
            </tr>
            <tr>
              <td>API Integration Layer</td>
              <td>Medium</td>
              <td>Medium</td>
              <td>1-2 weeks</td>
              <td>Core Features</td>
            </tr>
          </tbody>
        </table>

        <div class="section-divider">
          <div class="section-divider-text">Component Architecture</div>
        </div>

        <div class="architecture-diagram">
          <div class="diagram-container" style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin: 20px 0;">
            <div class="diagram-box secondary">
              <div class="diagram-title">Shared Components</div>
              <div class="diagram-subtitle">Reusable UI Elements</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Business Components</div>
              <div class="diagram-subtitle">Feature-Specific Logic</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Layout Components</div>
              <div class="diagram-subtitle">Navigation & Structure</div>
            </div>
          </div>
        </div>

        Include comprehensive details for:
        - Core business logic implementation with design patterns
        - Database schema design and optimization strategies
        - RESTful API development with proper versioning
        - Frontend component architecture and state management
        - Integration testing framework and automated testing
        - Code quality standards and review processes
        - Performance optimization and monitoring setup
        - Error handling and logging implementation

        Technical Requirements:
        - Complexity: ${requirements.technicalComplexity}
        - Team Size: ${requirements.teamSize}
        - Timeline: ${requirements.timeline}

        Focus on MVP features with scalable foundation for future enhancements.`,
      },
      {
        title: "Phase 3: Advanced Features",
        prompt: `Create detailed Phase 3 advanced features plan for: "${description}" with comprehensive architecture diagrams and feature enhancement workflow.

        Generate HTML with advanced features visualization:

        <div class="section-divider">
          <div class="section-divider-text">Phase 3: Advanced Features</div>
        </div>

        <div class="architecture-diagram">
          <h3>Advanced Features Architecture</h3>
          <p>Implement sophisticated features that differentiate the product and enhance user experience.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 24px 0;">
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
            <div class="diagram-box primary">
              <div class="diagram-title">AI Integration</div>
              <div class="diagram-subtitle">Machine Learning</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Enhancement Workflow</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">Performance Optimization</div>
          <div class="flow-step">Security Hardening</div>
          <div class="flow-step">Third-party APIs</div>
          <div class="flow-step">Advanced UI/UX</div>
          <div class="flow-step">Analytics Integration</div>
          <div class="flow-step">AI Features</div>
        </div>

        <h3>Advanced Features Implementation Plan</h3>
        <table>
          <thead>
            <tr>
              <th>Feature Category</th>
              <th>Implementation</th>
              <th>Business Impact</th>
              <th>Technical Complexity</th>
              <th>Timeline</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Performance Optimization</td>
              <td>Caching, CDN, Lazy Loading</td>
              <td>User Experience</td>
              <td>Medium</td>
              <td>2-3 weeks</td>
            </tr>
            <tr>
              <td>Advanced Security</td>
              <td>2FA, Audit Logs, Encryption</td>
              <td>Trust & Compliance</td>
              <td>High</td>
              <td>3-4 weeks</td>
            </tr>
            <tr>
              <td>Analytics & Reporting</td>
              <td>Real-time Dashboards</td>
              <td>Data-Driven Decisions</td>
              <td>Medium</td>
              <td>2-3 weeks</td>
            </tr>
            <tr>
              <td>AI/ML Integration</td>
              <td>Predictive Features</td>
              <td>Competitive Advantage</td>
              <td>High</td>
              <td>4-6 weeks</td>
            </tr>
          </tbody>
        </table>

        <div class="section-divider">
          <div class="section-divider-text">Integration Architecture</div>
        </div>

        <div class="architecture-diagram">
          <div class="diagram-container" style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin: 20px 0;">
            <div class="diagram-box secondary">
              <div class="diagram-title">External APIs</div>
              <div class="diagram-subtitle">Third-party Services</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Payment Systems</div>
              <div class="diagram-subtitle">Billing & Subscriptions</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Notification System</div>
              <div class="diagram-subtitle">Multi-channel Alerts</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Search Engine</div>
              <div class="diagram-subtitle">Elasticsearch/Solr</div>
            </div>
          </div>
        </div>

        Include comprehensive details for:
        - Performance optimization strategies and caching mechanisms
        - Advanced security features and compliance requirements
        - Third-party API integrations and webhook management
        - Advanced UI/UX components and micro-interactions
        - Analytics and reporting dashboard implementation
        - Machine learning and AI feature integration
        - Real-time features and WebSocket implementation
        - Advanced search and filtering capabilities

        Focus on value-added features that provide competitive advantage and enhance user engagement.`,
      },
      {
        title: "Phase 4: Testing & QA",
        prompt: `Create comprehensive Phase 4 testing and quality assurance plan for: "${description}" with detailed testing architecture and QA workflow visualization.

        Generate HTML with modern testing pipeline design:

        <div class="section-divider">
          <div class="section-divider-text">Phase 4: Testing & Quality Assurance</div>
        </div>

        <div class="architecture-diagram">
          <h3>Comprehensive Testing Pipeline</h3>
          <p>Implement robust testing strategies to ensure product quality, performance, and security before deployment.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary">
              <div class="diagram-title">Automated Testing</div>
              <div class="diagram-subtitle">Unit & Integration Tests</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Performance Testing</div>
              <div class="diagram-subtitle">Load & Stress Testing</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Security Testing</div>
              <div class="diagram-subtitle">Penetration & Audit</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">User Testing</div>
              <div class="diagram-subtitle">UAT & Usability</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Testing Workflow</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">Unit Tests</div>
          <div class="flow-step">Integration Tests</div>
          <div class="flow-step">Performance Tests</div>
          <div class="flow-step">Security Audit</div>
          <div class="flow-step">User Acceptance</div>
          <div class="flow-step">Production Ready</div>
        </div>

        <h3>Testing Strategy Matrix</h3>
        <table>
          <thead>
            <tr>
              <th>Testing Type</th>
              <th>Coverage Target</th>
              <th>Tools & Frameworks</th>
              <th>Timeline</th>
              <th>Success Criteria</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Unit Testing</td>
              <td>90%+ Code Coverage</td>
              <td>Jest, Vitest, Cypress</td>
              <td>1-2 weeks</td>
              <td>All tests passing</td>
            </tr>
            <tr>
              <td>Integration Testing</td>
              <td>API & Database</td>
              <td>Supertest, TestContainers</td>
              <td>1-2 weeks</td>
              <td>End-to-end workflows</td>
            </tr>
            <tr>
              <td>Performance Testing</td>
              <td>Load & Stress</td>
              <td>Artillery, JMeter</td>
              <td>1 week</td>
              <td>SLA compliance</td>
            </tr>
            <tr>
              <td>Security Testing</td>
              <td>Vulnerability Scan</td>
              <td>OWASP ZAP, Snyk</td>
              <td>1 week</td>
              <td>Zero critical issues</td>
            </tr>
          </tbody>
        </table>

        <div class="section-divider">
          <div class="section-divider-text">Quality Gates</div>
        </div>

        <div class="architecture-diagram">
          <div class="diagram-container" style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin: 20px 0;">
            <div class="diagram-box secondary">
              <div class="diagram-title">Code Quality</div>
              <div class="diagram-subtitle">ESLint, SonarQube</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Test Coverage</div>
              <div class="diagram-subtitle">90%+ Coverage</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Performance</div>
              <div class="diagram-subtitle">Load Testing</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Security</div>
              <div class="diagram-subtitle">Vulnerability Scan</div>
            </div>
          </div>
        </div>

        Include comprehensive details for:
        - Automated testing framework setup and configuration
        - Unit testing strategies for frontend and backend components
        - Integration testing for APIs and database interactions
        - Performance testing scenarios and load testing protocols
        - Security testing procedures and penetration testing
        - User acceptance testing planning and execution
        - Continuous integration and deployment pipeline testing
        - Bug tracking and quality assurance processes

        Focus on establishing robust quality gates that ensure production readiness and maintain high standards throughout the development lifecycle.`,
      },
      {
        title: "Phase 5: Deployment & Launch",
        prompt: `Create comprehensive Phase 5 deployment and launch plan for: "${description}" with detailed deployment architecture and launch workflow visualization.

        Generate HTML with modern deployment pipeline design:

        <div class="section-divider">
          <div class="section-divider-text">Phase 5: Deployment & Launch</div>
        </div>

        <div class="architecture-diagram">
          <h3>Deployment Pipeline Architecture</h3>
          <p>Implement robust deployment strategies with automated CI/CD pipeline and comprehensive monitoring systems.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0;">
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
            <div class="diagram-box primary">
              <div class="diagram-title">Support Infrastructure</div>
              <div class="diagram-subtitle">24/7 Operations</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Launch Workflow</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">Environment Setup</div>
          <div class="flow-step">CI/CD Configuration</div>
          <div class="flow-step">Performance Monitoring</div>
          <div class="flow-step">Launch Strategy</div>
          <div class="flow-step">Post-Launch Support</div>
        </div>

        <h3>Deployment Strategy Matrix</h3>
        <table>
          <thead>
            <tr>
              <th>Environment</th>
              <th>Deployment Method</th>
              <th>Monitoring Level</th>
              <th>Rollback Time</th>
              <th>Success Criteria</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Staging</td>
              <td>Automated CI/CD</td>
              <td>Full Monitoring</td>
              <td>< 2 minutes</td>
              <td>All tests pass</td>
            </tr>
            <tr>
              <td>Production</td>
              <td>Blue-Green Deploy</td>
              <td>Real-time Alerts</td>
              <td>< 30 seconds</td>
              <td>Zero downtime</td>
            </tr>
            <tr>
              <td>DR Environment</td>
              <td>Automated Sync</td>
              <td>Health Checks</td>
              <td>< 5 minutes</td>
              <td>Data consistency</td>
            </tr>
          </tbody>
        </table>

        <div class="section-divider">
          <div class="section-divider-text">Launch Infrastructure</div>
        </div>

        <div class="architecture-diagram">
          <div class="diagram-container" style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin: 20px 0;">
            <div class="diagram-box secondary">
              <div class="diagram-title">Load Balancer</div>
              <div class="diagram-subtitle">Traffic Distribution</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">CDN Integration</div>
              <div class="diagram-subtitle">Global Performance</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">SSL/Security</div>
              <div class="diagram-subtitle">HTTPS & Encryption</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Backup Systems</div>
              <div class="diagram-subtitle">Data Protection</div>
            </div>
          </div>
        </div>

        Include comprehensive details for:
        - Production environment setup and configuration
        - CI/CD pipeline automation and deployment strategies
        - Monitoring, logging, and alerting systems implementation
        - Performance optimization and scalability planning
        - Security hardening and compliance verification
        - Launch strategy with phased rollout planning
        - Post-launch support and maintenance procedures
        - Disaster recovery and business continuity planning

        Focus on ensuring smooth production deployment with zero downtime and comprehensive monitoring.`,
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

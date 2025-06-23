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
    const genAI = new GoogleGenerativeAI(
      "AIzaSyBCf51fy9DXI3gZxmq58xgHYnQU-r9Bceg"
    );
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
        order: 1,
      },
      {
        id: "technical-architecture",
        title: "Technical Architecture & Infrastructure",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 2,
      },
      {
        id: "feature-specifications",
        title: "Detailed Feature Specifications",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 3,
      },
      {
        id: "development-methodology",
        title: "Development Methodology & Timeline",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 4,
      },
      {
        id: "user-experience",
        title: "User Experience & Interface Design",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 5,
      },
      {
        id: "quality-assurance",
        title: "Quality Assurance & Testing Strategy",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 6,
      },
      {
        id: "deployment-devops",
        title: "Deployment & DevOps Strategy",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 7,
      },
      {
        id: "risk-management",
        title: "Risk Management & Mitigation",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 8,
      },
      {
        id: "stakeholder-management",
        title: "Stakeholder Management",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 9,
      },
      {
        id: "post-launch",
        title: "Post-Launch Strategy",
        content: "",
        isGenerating: false,
        isCompleted: false,
        order: 10,
      },
    ];
  }

  buildSectionPromptWithAI(
    sectionTitle: string,
    projectDescription: string,
    additionalRequirements?: string[],
    sectionConfig?: {
      id: string;
      aiPrompts?: {
        primary: string;
        secondary?: string;
        context?: string;
      };
    }
  ): string {
    const baseContext = `Project Description: ${projectDescription}`;
    const requirements =
      additionalRequirements && additionalRequirements.length > 0
        ? `\n\nAdditional Requirements:\n${additionalRequirements
            .map((req) => `- ${req}`)
            .join("\n")}`
        : "";

    // Use configured AI prompts if available
    if (sectionConfig?.aiPrompts?.primary) {
      let prompt = sectionConfig.aiPrompts.primary;

      if (sectionConfig.aiPrompts.secondary) {
        prompt += `\n\nAdditional Details: ${sectionConfig.aiPrompts.secondary}`;
      }

      if (sectionConfig.aiPrompts.context) {
        prompt += `\n\nContext Guidelines: ${sectionConfig.aiPrompts.context}`;
      }

      return `${baseContext}${requirements}

${prompt}

CRITICAL: Return ONLY clean HTML content without any markdown formatting, code blocks, or backtick tags. Your response must start directly with the HTML section tag and contain no explanatory text or markdown.

Create sophisticated, compact HTML sections using ONLY HTML and CSS - NO IMAGES. Use modern layouts with tables, flowcharts, timelines, cards, metrics, and status badges. Never suggest images or external diagrams. All visualizations must be HTML/CSS based.`;
    }

    // Fallback to original method if no AI prompts configured
    return this.buildSectionPrompt(
      sectionTitle,
      projectDescription,
      additionalRequirements
    );
  }

  private buildSectionPrompt(
    sectionTitle: string,
    projectDescription: string,
    additionalRequirements?: string[]
  ): string {
    const baseContext = `Project Description: ${projectDescription}`;
    const requirements =
      additionalRequirements && additionalRequirements.length > 0
        ? `\n\nAdditional Requirements:\n${additionalRequirements
            .map((req) => `- ${req}`)
            .join("\n")}`
        : "";

    const sectionPrompts: Record<string, string> = {
      "Executive Summary": `Create a comprehensive executive summary with rich HTML formatting. Include:
        - Project overview and objectives with key metrics
        - Value propositions in card format
        - Target market analysis with demographics table
        - Technical approach with architecture flow
        - Success metrics dashboard layout
        - ROI projections table with timeline`,

      "Technical Architecture & Infrastructure": `Design technical architecture with ultra-compact HTML-based visual elements:
        - Multi-layered microservices architecture: API Gateway → Service Mesh → Container Orchestrator → Database Cluster → Message Queue → Cache Layer
        - Technology stack comparison table with modern frameworks (Next.js, React Native, Node.js, PostgreSQL, Redis, Docker, Kubernetes)
        - Database schema with microservices patterns: User Service ↔ Payment Service ↔ Notification Service ↔ Analytics Service
        - API endpoints table with GraphQL, REST, WebSocket, and gRPC implementations
        - Metrics dashboard using display: flex layout with real-time monitoring cards (CPU, Memory, Latency, Throughput, Error Rate)
        - Security protocols: OAuth 2.0 → JWT → Rate Limiting → WAF → SSL/TLS → Zero Trust Architecture
        - Complex cloud-native flow: CI/CD Pipeline → Blue/Green Deployment → Auto-scaling → Load Balancing → Service Discovery`,

      "Detailed Feature Specifications": `Create feature specifications with structured layouts:
        - Feature priority matrix table
        - User stories in card format
        - Acceptance criteria checklists
        - Requirements traceability matrix
        - Feature dependencies flowchart
        - API specifications table`,

      "Development Methodology & Timeline": `Develop methodology with ultra-compact HTML-based visual planning:
        - Modern agile methodology comparison using the agile-comparison class with methodology cards for Scrum, Kanban, SAFe, DevOps, and Lean
        - Modern sprint timeline using the sprint-timeline class with alternating timeline cards and center line visualization
        - Modern team structure: Product Owner → Scrum Master → Frontend Engineer → Backend Engineer → DevOps Engineer → QA Automation Engineer
        - Critical path flow: Requirements Gathering → System Design → API Development → Frontend Development → Integration Testing → UAT → Production Deployment
        - Resource allocation dashboard using the resource-allocation class with capacity cards and progress bars for team utilization
        - Delivery pipeline: Feature Branch → Pull Request → Code Review → Automated Testing → Staging Deployment → Production Release`,

      "User Experience & Interface Design": `Design UX strategy with ultra-compact HTML visual elements:
        - User persona cards with behavioral data: Power User → Casual User → Admin → Guest with engagement metrics
        - User journey mapping: Brand Discovery → Product Research → Comparison → Add to Cart → Checkout → Post-Purchase → Loyalty
        - Information architecture: Landing Page → Product Categories → Search Results → Product Details → Shopping Cart → Payment Gateway → Order Confirmation
        - Design system components: Atomic Design → Design Tokens → Component Library → Pattern Library → Style Guide
        - Modern UX metrics dashboard with gradient cards and progress bars using the ux-metrics class structure
        - Responsive design flow: Mobile-First → Progressive Enhancement → Breakpoint Optimization → Cross-Device Testing`,

      "Quality Assurance & Testing Strategy": `Create testing strategy with detailed matrices:
        - Testing types coverage matrix
        - Test execution timeline
        - Quality metrics dashboard
        - Bug severity classification table
        - Testing tools comparison
        - QA process flowchart`,

      "Deployment & DevOps Strategy": `Design DevOps with ultra-compact HTML-based infrastructure visualization:
        - CI/CD pipeline: Git Commit → Webhook Trigger → Docker Build → Unit Tests → Integration Tests → Security Scan → Staging Deploy → E2E Tests → Production Deploy
        - Environment configuration: Development → Testing → Staging → Pre-Production → Production with infrastructure as code
        - Cloud infrastructure: CDN → Load Balancer → API Gateway → Microservices → Service Mesh → Database Cluster → Message Queue → Cache Layer → Monitoring Stack
        - DevOps metrics dashboard using display: flex layout (Deployment Frequency, Lead Time, MTTR, Change Failure Rate, Uptime)
        - Container orchestration: Dockerfile → Image Registry → Kubernetes Cluster → Pod Scaling → Service Discovery → Ingress Controller
        - Monitoring stack: Prometheus → Grafana → ELK Stack → Jaeger → Alertmanager → PagerDuty → Incident Response`,

      "Risk Management & Mitigation": `Develop risk management with ultra-compact HTML-based assessment visualization:
        - Risk assessment matrix with probability/impact scoring and modern risk categories (Cybersecurity, Compliance, Technical Debt, Market, Operational)
        - Mitigation strategies: Risk Identification → Impact Analysis → Probability Assessment → Mitigation Planning → Implementation → Monitoring → Review
        - Risk monitoring timeline: Continuous Monitoring → Threat Detection → Risk Assessment → Response Planning → Incident Response → Post-Incident Review
        - Risk metrics dashboard using display: flex layout (Risk Score, Mitigation Coverage, Response Time, Incident Frequency, Compliance Status)
        - Modern risk categories: Supply Chain → Data Privacy → API Security → Infrastructure → Third-Party Dependencies → Regulatory Compliance
        - Incident response flow: Alert → Triage → Investigation → Containment → Eradication → Recovery → Lessons Learned`,

      "Stakeholder Management": `Create stakeholder plan with ultra-compact HTML communication visualization:
        - Stakeholder ecosystem: Product Owner → Engineering Manager → Tech Lead → Senior Developer → Junior Developer → QA Lead → DevOps Engineer → UX Designer
        - Communication flow: Sprint Planning → Daily Standups → Code Reviews → Deployment Notifications → Incident Reports → Post-Mortem Reviews
        - RACI matrix with modern roles: Product Manager → Engineering → Design → Marketing → Sales → Customer Success → Legal → Security
        - Escalation chain: Developer → Tech Lead → Engineering Manager → VP Engineering → CTO → CEO
        - Stakeholder metrics dashboard using display: flex layout (Engagement Score, Response Time, Decision Velocity, Satisfaction Rating)
        - Feedback loop: User Research → Product Requirements → Technical Specification → Development → Testing → Release → User Feedback`,

      "Post-Launch Strategy": `Develop post-launch with ultra-compact HTML roadmap visualization:
        - Launch phases: Alpha Testing → Beta Release → Soft Launch → Public Launch → Scale-up → Optimization
        - User onboarding journey: Account Creation → Email Verification → Profile Setup → Feature Discovery → First Success → Habit Formation
        - Analytics stack: Google Analytics → Mixpanel → Amplitude → Hotjar → DataDog → Custom Dashboards
        - Post-launch metrics dashboard using display: flex layout (MAU, DAU, Retention Rate, Churn Rate, Revenue Growth, Feature Adoption)
        - Growth strategies: SEO Optimization → Content Marketing → Social Media → Paid Advertising → Referral Programs → Partnership Development
        - Product roadmap: Bug Fixes → Performance Optimization → Feature Enhancements → New Integrations → Mobile App → Enterprise Features`,
    };

    const prompt =
      sectionPrompts[sectionTitle as keyof typeof sectionPrompts] ||
      `Create a detailed section about ${sectionTitle} for this project.`;

    return `${baseContext}${requirements}

${prompt}

CRITICAL: Return ONLY clean HTML content without any markdown formatting, code blocks, or backtick tags. Your response must start directly with the HTML section tag and contain no explanatory text or markdown.

Create sophisticated, compact HTML sections using ONLY HTML and CSS - NO IMAGES. For technical diagrams use dense, modern layouts with NO overlapping elements:

COMPACT ARCHITECTURE DIAGRAMS - Use precise layered positioning:
<div class="architecture-diagram">
  <div class="diagram-layer">
    <div class="diagram-component frontend">Frontend App</div>
    <div class="diagram-component api">API Gateway</div>
    <div class="diagram-component cache">Redis Cache</div>
  </div>
  <div class="diagram-layer">
    <div class="diagram-component load-balancer">Load Balancer</div>
    <div class="diagram-component microservice">User Service</div>
    <div class="diagram-component microservice">Auth Service</div>
    <div class="diagram-component database">PostgreSQL</div>
  </div>
</div>

DENSE ORGANIZATIONAL TREES - Use hierarchical structure:
<div class="org-chart">
  <div class="org-level-compact">
    <div class="org-role manager">PM</div>
  </div>
  <div class="org-level-compact">
    <div class="org-role developer">Frontend</div>
    <div class="org-role developer">Backend</div>
    <div class="org-role designer">UX/UI</div>
    <div class="org-role developer">DevOps</div>
  </div>
</div>

COMPACT CONNECTED FLOWS - Use tight horizontal layout with arrows:
<div class="flowchart">
  <div class="flow-step">Requirements</div>
  <div class="flow-step">Design</div>
  <div class="flow-step">Development</div>
  <div class="flow-step">Testing</div>
  <div class="flow-step">Deployment</div>
</div>

ADVANCED GRID FLOWS - Use precise positioning with connection arrows:
<div class="advanced-flow-grid">
  <div class="flow-node start"><span>Start</span></div>
  <div class="flow-node decision"><span>Validate?</span></div>
  <div class="flow-node process-a"><span>Process A</span></div>
  <div class="flow-node process-b"><span>Process B</span></div>
  <div class="flow-node end"><span>Complete</span></div>
  <div class="flow-connection horizontal" style="grid-column: 1/3; grid-row: 2; width: 80%;"></div>
  <div class="flow-connection horizontal" style="grid-column: 2/4; grid-row: 1; width: 80%;"></div>
  <div class="flow-connection horizontal" style="grid-column: 2/4; grid-row: 3; width: 80%;"></div>
  <div class="flow-connection horizontal" style="grid-column: 4/6; grid-row: 2; width: 80%;"></div>
  <div class="decision-label yes" style="grid-column: 2; grid-row: 1; margin-top: -10px;">Yes</div>
  <div class="decision-label no" style="grid-column: 2; grid-row: 3; margin-bottom: -10px;">No</div>
</div>

MODERN SPRINT TIMELINE - Use alternating timeline cards with center line:
<div class="sprint-timeline">
  <h3>Sprint Development Timeline</h3>
  <div class="timeline-container">
    <div class="timeline-line"></div>
    
    <div class="timeline-item">
      <div class="timeline-card planning">
        <div class="timeline-arrow"></div>
        <div class="timeline-header">
          <div class="timeline-title">Sprint Planning</div>
          <div class="timeline-date">Week 1</div>
        </div>
        <div class="timeline-description">Define sprint goals, select backlog items, and estimate effort required for upcoming sprint cycle.</div>
        <div class="timeline-progress">
          <div class="timeline-progress-bar planning" style="width: 100%;"></div>
        </div>
        <div class="timeline-tags">
          <span class="timeline-tag duration">2 days</span>
          <span class="timeline-tag participants">Team Lead, PO</span>
        </div>
      </div>
      <div class="timeline-node planning"></div>
    </div>

    <div class="timeline-item">
      <div class="timeline-card development">
        <div class="timeline-arrow"></div>
        <div class="timeline-header">
          <div class="timeline-title">Development Phase</div>
          <div class="timeline-date">Week 1-2</div>
        </div>
        <div class="timeline-description">Active development of features with daily standups and continuous integration.</div>
        <div class="timeline-progress">
          <div class="timeline-progress-bar development" style="width: 75%;"></div>
        </div>
        <div class="timeline-tags">
          <span class="timeline-tag duration">8 days</span>
          <span class="timeline-tag participants">Dev Team</span>
        </div>
      </div>
      <div class="timeline-node development"></div>
    </div>

    <div class="timeline-item">
      <div class="timeline-card testing">
        <div class="timeline-arrow"></div>
        <div class="timeline-header">
          <div class="timeline-title">Testing & QA</div>
          <div class="timeline-date">Week 2-3</div>
        </div>
        <div class="timeline-description">Comprehensive testing including unit tests, integration tests, and user acceptance testing.</div>
        <div class="timeline-progress">
          <div class="timeline-progress-bar testing" style="width: 60%;"></div>
        </div>
        <div class="timeline-tags">
          <span class="timeline-tag duration">4 days</span>
          <span class="timeline-tag participants">QA Team</span>
        </div>
      </div>
      <div class="timeline-node testing"></div>
    </div>

    <div class="timeline-item">
      <div class="timeline-card review">
        <div class="timeline-arrow"></div>
        <div class="timeline-header">
          <div class="timeline-title">Sprint Review</div>
          <div class="timeline-date">Week 3</div>
        </div>
        <div class="timeline-description">Demonstrate completed work to stakeholders and gather feedback for future improvements.</div>
        <div class="timeline-progress">
          <div class="timeline-progress-bar review" style="width: 30%;"></div>
        </div>
        <div class="timeline-tags">
          <span class="timeline-tag duration">1 day</span>
          <span class="timeline-tag participants">Full Team</span>
        </div>
      </div>
      <div class="timeline-node review"></div>
    </div>

    <div class="timeline-item">
      <div class="timeline-card retrospective">
        <div class="timeline-arrow"></div>
        <div class="timeline-header">
          <div class="timeline-title">Retrospective</div>
          <div class="timeline-date">Week 3</div>
        </div>
        <div class="timeline-description">Reflect on sprint process, identify improvements, and plan optimizations for next sprint.</div>
        <div class="timeline-progress">
          <div class="timeline-progress-bar retrospective" style="width: 0%;"></div>
        </div>
        <div class="timeline-tags">
          <span class="timeline-tag duration">Half day</span>
          <span class="timeline-tag participants">Dev Team</span>
        </div>
      </div>
      <div class="timeline-node retrospective"></div>
    </div>
  </div>
  
  <div class="timeline-compact">
    <div class="timeline-milestone">
      <div class="milestone-node completed"></div>
      <div class="milestone-title">Planning</div>
      <div class="milestone-date">Jan 15</div>
    </div>
    <div class="timeline-milestone">
      <div class="milestone-node current"></div>
      <div class="milestone-title">Development</div>
      <div class="milestone-date">Jan 22</div>
    </div>
    <div class="timeline-milestone">
      <div class="milestone-node upcoming"></div>
      <div class="milestone-title">Testing</div>
      <div class="milestone-date">Jan 29</div>
    </div>
    <div class="timeline-milestone">
      <div class="milestone-node upcoming"></div>
      <div class="milestone-title">Review</div>
      <div class="milestone-date">Feb 5</div>
    </div>
    <div class="timeline-milestone">
      <div class="milestone-node upcoming"></div>
      <div class="milestone-title">Retrospective</div>
      <div class="milestone-date">Feb 6</div>
    </div>
  </div>
</div>

MODERN AGILE METHODOLOGY COMPARISON - Use methodology cards with ratings and metrics:
<div class="agile-comparison">
  <h3>Agile Methodology Comparison</h3>
  <div class="methodology-grid">
    <div class="methodology-card scrum">
      <div class="methodology-header">
        <div class="methodology-title">Scrum</div>
        <div class="methodology-icon">🏃</div>
      </div>
      <div class="methodology-description">Sprint-based framework with defined roles and ceremonies</div>
      <div class="methodology-rating">
        <span class="rating-label">Complexity:</span>
        <div class="rating-stars">
          <div class="rating-star filled"></div>
          <div class="rating-star filled"></div>
          <div class="rating-star filled"></div>
          <div class="rating-star"></div>
          <div class="rating-star"></div>
        </div>
      </div>
      <div class="methodology-metrics">
        <span class="methodology-metric">2-4 week sprints</span>
        <span class="methodology-metric">Daily standups</span>
        <span class="methodology-metric">Sprint reviews</span>
      </div>
    </div>
    <div class="methodology-card kanban">
      <div class="methodology-header">
        <div class="methodology-title">Kanban</div>
        <div class="methodology-icon">📋</div>
      </div>
      <div class="methodology-description">Visual workflow management with continuous delivery</div>
      <div class="methodology-rating">
        <span class="rating-label">Complexity:</span>
        <div class="rating-stars">
          <div class="rating-star filled"></div>
          <div class="rating-star filled"></div>
          <div class="rating-star"></div>
          <div class="rating-star"></div>
          <div class="rating-star"></div>
        </div>
      </div>
      <div class="methodology-metrics">
        <span class="methodology-metric">Continuous flow</span>
        <span class="methodology-metric">WIP limits</span>
        <span class="methodology-metric">Pull system</span>
      </div>
    </div>
    <div class="methodology-card safe">
      <div class="methodology-header">
        <div class="methodology-title">SAFe</div>
        <div class="methodology-icon">🏢</div>
      </div>
      <div class="methodology-description">Scaled agile framework for enterprise organizations</div>
      <div class="methodology-rating">
        <span class="rating-label">Complexity:</span>
        <div class="rating-stars">
          <div class="rating-star filled"></div>
          <div class="rating-star filled"></div>
          <div class="rating-star filled"></div>
          <div class="rating-star filled"></div>
          <div class="rating-star filled"></div>
        </div>
      </div>
      <div class="methodology-metrics">
        <span class="methodology-metric">PI planning</span>
        <span class="methodology-metric">ART structure</span>
        <span class="methodology-metric">Lean portfolio</span>
      </div>
    </div>
    <div class="methodology-card devops">
      <div class="methodology-header">
        <div class="methodology-title">DevOps</div>
        <div class="methodology-icon">⚙️</div>
      </div>
      <div class="methodology-description">Culture and practices for development and operations collaboration</div>
      <div class="methodology-rating">
        <span class="rating-label">Complexity:</span>
        <div class="rating-stars">
          <div class="rating-star filled"></div>
          <div class="rating-star filled"></div>
          <div class="rating-star filled"></div>
          <div class="rating-star filled"></div>
          <div class="rating-star"></div>
        </div>
      </div>
      <div class="methodology-metrics">
        <span class="methodology-metric">CI/CD</span>
        <span class="methodology-metric">Automation</span>
        <span class="methodology-metric">Monitoring</span>
      </div>
    </div>
  </div>
</div>

MODERN RESOURCE ALLOCATION DASHBOARD - Use capacity cards with progress bars:
<div class="resource-allocation">
  <h3>Team Resource Allocation</h3>
  <div class="resource-grid">
    <div class="resource-card frontend">
      <div class="resource-header">
        <div class="resource-title">Frontend Team</div>
        <div class="resource-capacity high">85%</div>
      </div>
      <div class="capacity-bar">
        <div class="capacity-fill frontend" style="width: 85%;"></div>
      </div>
      <div class="resource-details">
        <div class="resource-detail">
          <span class="resource-label">Developers:</span>
          <span class="resource-value">3 people</span>
        </div>
        <div class="resource-detail">
          <span class="resource-label">Sprint Capacity:</span>
          <span class="resource-value">120 hours</span>
        </div>
        <div class="resource-detail">
          <span class="resource-label">Committed:</span>
          <span class="resource-value">102 hours</span>
        </div>
      </div>
    </div>
    <div class="resource-card backend">
      <div class="resource-header">
        <div class="resource-title">Backend Team</div>
        <div class="resource-capacity high">92%</div>
      </div>
      <div class="capacity-bar">
        <div class="capacity-fill backend" style="width: 92%;"></div>
      </div>
      <div class="resource-details">
        <div class="resource-detail">
          <span class="resource-label">Developers:</span>
          <span class="resource-value">4 people</span>
        </div>
        <div class="resource-detail">
          <span class="resource-label">Sprint Capacity:</span>
          <span class="resource-value">160 hours</span>
        </div>
        <div class="resource-detail">
          <span class="resource-label">Committed:</span>
          <span class="resource-value">147 hours</span>
        </div>
      </div>
    </div>
    <div class="resource-card qa">
      <div class="resource-header">
        <div class="resource-title">QA Team</div>
        <div class="resource-capacity medium">65%</div>
      </div>
      <div class="capacity-bar">
        <div class="capacity-fill qa" style="width: 65%;"></div>
      </div>
      <div class="resource-details">
        <div class="resource-detail">
          <span class="resource-label">Engineers:</span>
          <span class="resource-value">2 people</span>
        </div>
        <div class="resource-detail">
          <span class="resource-label">Sprint Capacity:</span>
          <span class="resource-value">80 hours</span>
        </div>
        <div class="resource-detail">
          <span class="resource-label">Committed:</span>
          <span class="resource-value">52 hours</span>
        </div>
      </div>
    </div>
    <div class="resource-card devops">
      <div class="resource-header">
        <div class="resource-title">DevOps Team</div>
        <div class="resource-capacity medium">70%</div>
      </div>
      <div class="capacity-bar">
        <div class="capacity-fill devops" style="width: 70%;"></div>
      </div>
      <div class="resource-details">
        <div class="resource-detail">
          <span class="resource-label">Engineers:</span>
          <span class="resource-value">2 people</span>
        </div>
        <div class="resource-detail">
          <span class="resource-label">Sprint Capacity:</span>
          <span class="resource-value">80 hours</span>
        </div>
        <div class="resource-detail">
          <span class="resource-label">Committed:</span>
          <span class="resource-value">56 hours</span>
        </div>
      </div>
    </div>
  </div>
  <div class="resource-summary">
    <div class="summary-chip">
      <span class="value">78%</span>
      <span class="label">Overall Utilization</span>
    </div>
    <div class="summary-chip">
      <span class="value">11</span>
      <span class="label">Team Members</span>
    </div>
    <div class="summary-chip">
      <span class="value">440h</span>
      <span class="label">Total Capacity</span>
    </div>
    <div class="summary-chip">
      <span class="value">357h</span>
      <span class="label">Committed Hours</span>
    </div>
  </div>
</div>

MODERN UX METRICS DASHBOARD - Use comprehensive metric cards with progress indicators:
<div class="ux-metrics">
  <h3>User Experience Metrics Dashboard</h3>
  <div class="metrics-grid">
    <div class="metric-card conversion">
      <div class="metric-header">
        <div class="metric-title">Conversion Rate</div>
        <div class="metric-icon">📈</div>
      </div>
      <div class="metric-value">3.2%</div>
      <div class="metric-change positive">+0.5% vs last month</div>
      <div class="metric-progress">
        <div class="metric-progress-bar conversion" style="width: 65%;"></div>
      </div>
    </div>
    <div class="metric-card engagement">
      <div class="metric-header">
        <div class="metric-title">Session Duration</div>
        <div class="metric-icon">⏱️</div>
      </div>
      <div class="metric-value">4:32</div>
      <div class="metric-change positive">+15s vs last month</div>
      <div class="metric-progress">
        <div class="metric-progress-bar engagement" style="width: 76%;"></div>
      </div>
    </div>
    <div class="metric-card satisfaction">
      <div class="metric-header">
        <div class="metric-title">User Satisfaction</div>
        <div class="metric-icon">😊</div>
      </div>
      <div class="metric-value">4.7/5</div>
      <div class="metric-change positive">+0.2 vs last month</div>
      <div class="metric-progress">
        <div class="metric-progress-bar satisfaction" style="width: 94%;"></div>
      </div>
    </div>
    <div class="metric-card performance">
      <div class="metric-header">
        <div class="metric-title">Page Load Time</div>
        <div class="metric-icon">⚡</div>
      </div>
      <div class="metric-value">1.8s</div>
      <div class="metric-change negative">+0.3s vs last month</div>
      <div class="metric-progress">
        <div class="metric-progress-bar performance" style="width: 72%;"></div>
      </div>
    </div>
  </div>
  <div class="metrics-row">
    <div class="metric-chip">
      <span class="value">89%</span>
      <span class="label">Task Completion</span>
    </div>
    <div class="metric-chip">
      <span class="value">2.3%</span>
      <span class="label">Bounce Rate</span>
    </div>
    <div class="metric-chip">
      <span class="value">67%</span>
      <span class="label">Feature Adoption</span>
    </div>
    <div class="metric-chip">
      <span class="value">78%</span>
      <span class="label">Mobile Usage</span>
    </div>
  </div>
</div>

Use tables, flowcharts, timelines, cards, metrics, and status badges. Never suggest images or external diagrams. All visualizations must be HTML/CSS based.`;
  }

  async generateSection(
    sectionTitle: string,
    config: EnhancedProjectPlanConfig,
    sectionConfig?: {
      id: string;
      aiPrompts?: {
        primary: string;
        secondary?: string;
        context?: string;
      };
    }
  ): Promise<string> {
    try {
      const prompt = this.buildSectionPromptWithAI(
        sectionTitle,
        config.projectDescription,
        config.additionalRequirements,
        sectionConfig
      );

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let content = response.text();

      // Clean up any markdown formatting or code blocks
      content = content
        .replace(/```html\s*/gi, "")
        .replace(/```\s*/g, "")
        .replace(/^\s*html\s*/gi, "")
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
          isGenerating: true,
        });
      }

      try {
        // Generate content for this section
        console.log(
          `Generating section ${i + 1}/${totalSections}: ${section.title}`
        );
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
            isGenerating: i < totalSections - 1,
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
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    // Final progress update
    if (onProgress) {
      onProgress({
        currentSection: totalSections,
        totalSections,
        currentSectionTitle: "Complete",
        overallProgress: 100,
        isGenerating: false,
      });
    }

    return sections;
  }

  generateHtmlReport(sections: ProjectPlanSection[]): string {
    const sectionsHtml = sections
      .sort((a, b) => a.order - b.order)
      .map(
        (section) => `
        <section class="project-section" id="${section.id}">
          <h2 class="section-title">${section.title}</h2>
          <div class="section-content">
            ${this.formatSectionContent(section.content)}
          </div>
        </section>
      `
      )
      .join("\n");

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
            ${sections
              .map(
                (section) => `
              <li><a href="#${section.id}">${section.title}</a></li>
            `
              )
              .join("")}
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
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^### (.*?)$/gm, "<h4>$1</h4>")
      .replace(/^## (.*?)$/gm, "<h3>$1</h3>")
      .replace(/^# (.*?)$/gm, "<h2>$1</h2>")
      .replace(/^- (.*?)$/gm, "<li>$1</li>");

    // Wrap list items in ul tags
    formatted = formatted.replace(/(<li>.*?<\/li>)/g, "<ul>$1</ul>");

    // Handle paragraphs
    formatted = formatted
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(.)/gm, "<p>$1")
      .replace(/(.*)$/gm, "$1</p>");

    return formatted;
  }
}

export function createEnhancedProjectPlanner(): EnhancedProjectPlanner {
  return new EnhancedProjectPlanner();
}

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
      "AIzaSyBCf51fy9DXI3gZxmq58xgHYnQU-r9Bceg"
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
          const section = await this.generateSection(
            sectionPrompt,
            requirements
          );
          return section;
        } catch (error) {
          console.warn(
            `Failed to generate section: ${sectionPrompt.title}`,
            error
          );
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

        Use these exact CSS template patterns for consistent styling:

        <!-- Modern Card Template -->
        <div class="modern-card" style="background: linear-gradient(135deg, #ffffff, #f8fafc); border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 20px 0; box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <h3 style="color: #6366f1; margin-bottom: 16px; font-weight: 700;">Card Title</h3>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">Card content goes here...</p>
        </div>

        <!-- Modern List Template -->
        <ul class="modern-list" style="margin: 20px 0; padding: 0; list-style: none;">
          <li style="margin: 12px 0; padding: 16px 20px 16px 44px; background: linear-gradient(135deg, #ffffff, #f8fafc); border: 1px solid #e2e8f0; border-radius: 8px; position: relative; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
            <div style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);"></div>
            List item content
          </li>
        </ul>

        <!-- Modern Table Template -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 24px 0; background: linear-gradient(135deg, #ffffff, #f8fafc); border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px -5px rgba(0, 0, 0, 0.1); border: 2px solid #e2e8f0; position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <thead>
            <tr>
              <th style="padding: 18px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Header</th>
            </tr>
          </thead>
          <tbody>
            <tr style="transition: all 0.2s ease;">
              <td style="padding: 16px 18px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #e2e8f0; color: #374151;">Content</td>
            </tr>
          </tbody>
        </table>

        <!-- Tree Structure Template -->
        <div class="tree-structure" style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border: 1px solid #e2e8f0;">
          <div class="tree-node" style="margin: 8px 0; padding: 12px 16px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 8px; font-weight: 600; position: relative;">
            Root Node
            <div class="tree-children" style="margin-left: 24px; margin-top: 12px; border-left: 2px solid #8b5cf6; padding-left: 16px;">
              <div class="tree-child" style="margin: 8px 0; padding: 10px 14px; background: linear-gradient(135deg, #ffffff, #f8fafc); border: 1px solid #e2e8f0; border-radius: 6px; color: #374151; position: relative;">
                Child Node
              </div>
            </div>
          </div>
        </div>

        <!-- Flow Diagram Template -->
        <div class="flowchart" style="display: flex; flex-wrap: wrap; gap: 16px; margin: 20px 0; justify-content: center; align-items: center; padding: 24px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);">
          <div class="flow-step" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 20px; border-radius: 12px; font-weight: 600; position: relative; min-width: 140px; text-align: center; box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3); transition: all 0.3s ease; font-size: 14px; border: 2px solid rgba(255, 255, 255, 0.2);">
            Step 1
            <div style="position: absolute; right: -18px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 14px solid #6366f1; z-index: 10;"></div>
          </div>
          <div class="flow-step" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 20px; border-radius: 12px; font-weight: 600; position: relative; min-width: 140px; text-align: center; box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3); transition: all 0.3s ease; font-size: 14px; border: 2px solid rgba(255, 255, 255, 0.2);">
            Step 2
          </div>
        </div>

        <!-- Architecture Diagram Template -->
        <div class="architecture-diagram">
          <h3 style="color: #6366f1; margin-bottom: 16px; font-weight: 700;">Architecture Overview</h3>
          <div class="diagram-container">
            <div class="diagram-box primary">
              <div class="diagram-title">Frontend</div>
              <div class="diagram-subtitle">User Interface</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Backend</div>
              <div class="diagram-subtitle">API Services</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Database</div>
              <div class="diagram-subtitle">Data Storage</div>
            </div>
            <div class="diagram-box info">
              <div class="diagram-title">External APIs</div>
              <div class="diagram-subtitle">Third-party Services</div>
            </div>
          </div>
        </div>

        <!-- Section Divider Template -->
        <div class="section-divider" style="display: flex; align-items: center; margin: 24px 0; position: relative;">
          <div style="flex: 1; height: 2px; background: linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent);"></div>
          <div class="section-divider-text" style="padding: 0 20px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3);">Section Title</div>
          <div style="flex: 1; height: 2px; background: linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent);"></div>
        </div>

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

        <div class="architecture-diagram">
          <h3>Project Value Flow</h3>
          <div class="diagram-container">
            <!-- Start -->
            <div class="diagram-box terminal primary" style="grid-column: 1; grid-row: 2;">
              <div class="diagram-title">Start</div>
            </div>
            
            <!-- Analysis -->
            <div class="diagram-box process secondary" style="grid-column: 3; grid-row: 2;">
              <div class="diagram-title">Analysis</div>
              <div class="diagram-subtitle">Requirements</div>
            </div>
            
            <!-- Decision -->
            <div class="diagram-box decision info" style="grid-column: 5; grid-row: 2;">
              <div class="diagram-title">Approved?</div>
            </div>
            
            <!-- Development -->
            <div class="diagram-box process secondary" style="grid-column: 7; grid-row: 2;">
              <div class="diagram-title">Build</div>
              <div class="diagram-subtitle">Development</div>
            </div>
            
            <!-- Deploy -->
            <div class="diagram-box terminal success" style="grid-column: 9; grid-row: 2;">
              <div class="diagram-title">Deploy</div>
            </div>
            
            <!-- Revision Path -->
            <div class="diagram-box process accent" style="grid-column: 5; grid-row: 4;">
              <div class="diagram-title">Revise</div>
              <div class="diagram-subtitle">Update Plan</div>
            </div>
            
            <!-- Lines -->
            <div class="flowchart-line horizontal" style="grid-column: 2; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 4; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 6; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 8; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line vertical" style="grid-column: 5; grid-row: 3; justify-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 3; grid-row: 4; grid-column-end: 6; align-self: center;"></div>
            
            <!-- Decision Symbols -->
            <div class="decision-symbol yes" style="grid-column: 6; grid-row: 2; justify-self: start; align-self: center;"></div>
            <div class="decision-symbol no" style="grid-column: 5; grid-row: 3; justify-self: center; align-self: start;"></div>
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

        Use these exact CSS template patterns for consistent styling:

        <!-- Modern Card Template -->
        <div class="modern-card" style="background: linear-gradient(135deg, #ffffff, #f8fafc); border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 20px 0; box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <h3 style="color: #6366f1; margin-bottom: 16px; font-weight: 700;">Card Title</h3>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">Card content goes here...</p>
        </div>

        <!-- Modern List Template -->
        <ul class="modern-list" style="margin: 20px 0; padding: 0; list-style: none;">
          <li style="margin: 12px 0; padding: 16px 20px 16px 44px; background: linear-gradient(135deg, #ffffff, #f8fafc); border: 1px solid #e2e8f0; border-radius: 8px; position: relative; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
            <div style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);"></div>
            List item content
          </li>
        </ul>

        <!-- Modern Table Template -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 24px 0; background: linear-gradient(135deg, #ffffff, #f8fafc); border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px -5px rgba(0, 0, 0, 0.1); border: 2px solid #e2e8f0; position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <thead>
            <tr>
              <th style="padding: 18px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Header</th>
            </tr>
          </thead>
          <tbody>
            <tr style="transition: all 0.2s ease;">
              <td style="padding: 16px 18px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #e2e8f0; color: #374151;">Content</td>
            </tr>
          </tbody>
        </table>

        <!-- Tree Structure Template -->
        <div class="tree-structure" style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border: 1px solid #e2e8f0;">
          <div class="tree-node" style="margin: 8px 0; padding: 12px 16px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 8px; font-weight: 600; position: relative;">
            Root Node
            <div class="tree-children" style="margin-left: 24px; margin-top: 12px; border-left: 2px solid #8b5cf6; padding-left: 16px;">
              <div class="tree-child" style="margin: 8px 0; padding: 10px 14px; background: linear-gradient(135deg, #ffffff, #f8fafc); border: 1px solid #e2e8f0; border-radius: 6px; color: #374151; position: relative;">
                Child Node
              </div>
            </div>
          </div>
        </div>

        <!-- Flow Diagram Template -->
        <div class="flowchart" style="display: flex; flex-wrap: wrap; gap: 16px; margin: 20px 0; justify-content: center; align-items: center; padding: 24px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);">
          <div class="flow-step" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 20px; border-radius: 12px; font-weight: 600; position: relative; min-width: 140px; text-align: center; box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3); transition: all 0.3s ease; font-size: 14px; border: 2px solid rgba(255, 255, 255, 0.2);">
            Step 1
            <div style="position: absolute; right: -18px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 14px solid #6366f1; z-index: 10;"></div>
          </div>
          <div class="flow-step" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 20px; border-radius: 12px; font-weight: 600; position: relative; min-width: 140px; text-align: center; box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3); transition: all 0.3s ease; font-size: 14px; border: 2px solid rgba(255, 255, 255, 0.2);">
            Step 2
          </div>
        </div>

        <!-- Architecture Diagram Template -->
        <div class="architecture-diagram" style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 20px 0; box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <h3 style="color: #6366f1; margin-bottom: 16px; font-weight: 700;">Architecture Overview</h3>
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: 2px solid #4f46e5; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; position: relative; min-height: 80px; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 8px;">
              <div class="diagram-title" style="font-size: 14px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Component</div>
              <div class="diagram-subtitle" style="font-size: 11px; opacity: 0.8; font-weight: 500;">Description</div>
            </div>
          </div>
        </div>

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

        Use these exact CSS template patterns for consistent styling:

        <!-- Modern Card Template -->
        <div class="modern-card" style="background: linear-gradient(135deg, #ffffff, #f8fafc); border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 20px 0; box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <h3 style="color: #6366f1; margin-bottom: 16px; font-weight: 700;">Card Title</h3>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">Card content goes here...</p>
        </div>

        <!-- Modern Table Template -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 24px 0; background: linear-gradient(135deg, #ffffff, #f8fafc); border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px -5px rgba(0, 0, 0, 0.1); border: 2px solid #e2e8f0; position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <thead>
            <tr>
              <th style="padding: 18px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Header</th>
            </tr>
          </thead>
          <tbody>
            <tr style="transition: all 0.2s ease;">
              <td style="padding: 16px 18px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #e2e8f0; color: #374151;">Content</td>
            </tr>
          </tbody>
        </table>

        <!-- Flow Diagram Template -->
        <div class="flowchart" style="display: flex; flex-wrap: wrap; gap: 16px; margin: 20px 0; justify-content: center; align-items: center; padding: 24px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);">
          <div class="flow-step" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 20px; border-radius: 12px; font-weight: 600; position: relative; min-width: 140px; text-align: center; box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3); transition: all 0.3s ease; font-size: 14px; border: 2px solid rgba(255, 255, 255, 0.2);">
            Step 1
            <div style="position: absolute; right: -18px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 14px solid #6366f1; z-index: 10;"></div>
          </div>
        </div>

        <!-- Architecture Diagram Template -->
        <div class="architecture-diagram" style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 20px 0; box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <h3 style="color: #6366f1; margin-bottom: 16px; font-weight: 700;">Architecture Overview</h3>
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: 2px solid #4f46e5; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; position: relative; min-height: 80px; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 8px;">
              <div class="diagram-title" style="font-size: 14px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Component</div>
              <div class="diagram-subtitle" style="font-size: 11px; opacity: 0.8; font-weight: 500;">Description</div>
            </div>
          </div>
        </div>

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

        <div class="architecture-diagram">
          <h3>Setup Process</h3>
          <div class="diagram-container">
            <!-- Setup Flow -->
            <div class="diagram-box terminal primary" style="grid-column: 1; grid-row: 2;">
              <div class="diagram-title">Start</div>
            </div>
            
            <div class="diagram-box process secondary" style="grid-column: 3; grid-row: 2;">
              <div class="diagram-title">Install</div>
              <div class="diagram-subtitle">Tools & Deps</div>
            </div>
            
            <div class="diagram-box decision info" style="grid-column: 5; grid-row: 2;">
              <div class="diagram-title">Valid?</div>
            </div>
            
            <div class="diagram-box process warning" style="grid-column: 7; grid-row: 2;">
              <div class="diagram-title">Configure</div>
              <div class="diagram-subtitle">Database</div>
            </div>
            
            <div class="diagram-box terminal success" style="grid-column: 9; grid-row: 2;">
              <div class="diagram-title">Ready</div>
            </div>
            
            <!-- Error Path -->
            <div class="diagram-box process accent" style="grid-column: 5; grid-row: 4;">
              <div class="diagram-title">Fix Issues</div>
              <div class="diagram-subtitle">Debug</div>
            </div>
            
            <!-- Connections -->
            <div class="flowchart-line horizontal" style="grid-column: 2; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 4; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 6; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 8; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line vertical" style="grid-column: 5; grid-row: 3; justify-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 3; grid-row: 4; grid-column-end: 6; align-self: center;"></div>
            
            <div class="decision-symbol yes" style="grid-column: 6; grid-row: 2; justify-self: start; align-self: center;"></div>
            <div class="decision-symbol no" style="grid-column: 5; grid-row: 3; justify-self: center; align-self: start;"></div>
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
          
          <div class="diagram-container">
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
            <div class="diagram-box info">
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
        prompt: `Create comprehensive risk management plan for: "${description}" with detailed risk assessment matrix and mitigation workflow visualization.

        Generate HTML with modern risk management design:

        <div class="section-divider">
          <div class="section-divider-text">Risk Management Framework</div>
        </div>

        <div class="architecture-diagram">
          <h3>Risk Assessment Matrix</h3>
          <p>Comprehensive risk identification, assessment, and mitigation strategies to ensure project success.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary">
              <div class="diagram-title">Technical Risks</div>
              <div class="diagram-subtitle">Architecture & Implementation</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Business Risks</div>
              <div class="diagram-subtitle">Market & Financial</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Resource Risks</div>
              <div class="diagram-subtitle">Team & Budget</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">External Risks</div>
              <div class="diagram-subtitle">Dependencies & Environment</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Risk Mitigation Workflow</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">Risk Identification</div>
          <div class="flow-step">Impact Assessment</div>
          <div class="flow-step">Probability Analysis</div>
          <div class="flow-step">Mitigation Planning</div>
          <div class="flow-step">Monitoring & Review</div>
        </div>

        <h3>Risk Assessment Table</h3>
        <table>
          <thead>
            <tr>
              <th>Risk Category</th>
              <th>Risk Level</th>
              <th>Impact</th>
              <th>Probability</th>
              <th>Mitigation Strategy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Technical Complexity</td>
              <td>High</td>
              <td>Schedule Delay</td>
              <td>Medium</td>
              <td>Prototype & Proof of Concept</td>
            </tr>
            <tr>
              <td>Resource Availability</td>
              <td>Medium</td>
              <td>Quality Impact</td>
              <td>Low</td>
              <td>Cross-training & Backup Plans</td>
            </tr>
            <tr>
              <td>Third-party Dependencies</td>
              <td>Medium</td>
              <td>Feature Limitations</td>
              <td>Medium</td>
              <td>Alternative Solutions</td>
            </tr>
            <tr>
              <td>Scope Creep</td>
              <td>High</td>
              <td>Budget Overrun</td>
              <td>High</td>
              <td>Change Management Process</td>
            </tr>
          </tbody>
        </table>

        Include comprehensive details for:
        - Technical risk assessment and architecture contingencies
        - Business risk evaluation and market analysis
        - Resource planning and team capacity management
        - Timeline risk factors and schedule optimization
        - External dependency risks and vendor management
        - Contingency planning and emergency procedures
        - Risk monitoring and early warning systems
        - Escalation procedures and decision frameworks

        Focus on proactive risk management with clear mitigation strategies and measurable success criteria.`,
      },
      {
        title: "Quality Assurance",
        prompt: `Design comprehensive quality assurance framework for: "${description}" with detailed QA methodology and quality gates visualization.

        Generate HTML with modern QA framework design:

        <div class="section-divider">
          <div class="section-divider-text">Quality Assurance Framework</div>
        </div>

        <div class="architecture-diagram">
          <h3>QA Methodology Overview</h3>
          <p>Establish enterprise-grade quality standards with comprehensive testing and review processes.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary">
              <div class="diagram-title">Testing Standards</div>
              <div class="diagram-subtitle">Automated & Manual</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Code Review</div>
              <div class="diagram-subtitle">Peer Review Process</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Performance QA</div>
              <div class="diagram-subtitle">Benchmarks & Monitoring</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Security Standards</div>
              <div class="diagram-subtitle">Compliance & Auditing</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Quality Gates Workflow</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">Code Standards</div>
          <div class="flow-step">Peer Review</div>
          <div class="flow-step">Automated Testing</div>
          <div class="flow-step">Performance Check</div>
          <div class="flow-step">Security Scan</div>
          <div class="flow-step">Release Ready</div>
        </div>

        <h3>QA Standards Matrix</h3>
        <table>
          <thead>
            <tr>
              <th>Quality Area</th>
              <th>Standard</th>
              <th>Measurement</th>
              <th>Tool/Process</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Code Quality</td>
              <td>Clean Code Principles</td>
              <td>Static Analysis</td>
              <td>ESLint, SonarQube</td>
              <td>Zero critical issues</td>
            </tr>
            <tr>
              <td>Test Coverage</td>
              <td>Comprehensive Testing</td>
              <td>Coverage Percentage</td>
              <td>Jest, Cypress</td>
              <td>90%+ Coverage</td>
            </tr>
            <tr>
              <td>Performance</td>
              <td>Response Time SLA</td>
              <td>Load Testing</td>
              <td>Artillery, Lighthouse</td>
              <td>< 2s Load Time</td>
            </tr>
            <tr>
              <td>Security</td>
              <td>OWASP Standards</td>
              <td>Vulnerability Scan</td>
              <td>Snyk, OWASP ZAP</td>
              <td>Zero High Risk</td>
            </tr>
          </tbody>
        </table>

        Include comprehensive details for:
        - QA methodology implementation and team structure
        - Testing standards for unit, integration, and E2E testing
        - Code review processes and quality gates
        - Performance benchmarking and optimization criteria
        - Security standards and compliance requirements
        - Documentation standards and knowledge management
        - Continuous improvement and feedback loops
        - Quality metrics and reporting frameworks

        Focus on establishing enterprise-grade quality standards that ensure reliable, secure, and maintainable software delivery.`,
      },
      {
        title: "Deployment Strategy",
        prompt: `Create detailed deployment strategy for: "${description}" with comprehensive infrastructure architecture and deployment workflow visualization.

        Generate HTML with modern deployment strategy design:

        <div class="section-divider">
          <div class="section-divider-text">Deployment Strategy Framework</div>
        </div>

        <div class="architecture-diagram">
          <h3>Infrastructure Architecture</h3>
          <p>Design scalable and reliable deployment infrastructure with automated CI/CD pipeline and comprehensive monitoring.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary">
              <div class="diagram-title">Infrastructure</div>
              <div class="diagram-subtitle">Cloud & Containers</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">CI/CD Pipeline</div>
              <div class="diagram-subtitle">Automated Deployment</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Environment Management</div>
              <div class="diagram-subtitle">Dev/Stage/Prod</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Monitoring</div>
              <div class="diagram-subtitle">Alerts & Logging</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Deployment Workflow</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">Code Commit</div>
          <div class="flow-step">Build & Test</div>
          <div class="flow-step">Deploy to Staging</div>
          <div class="flow-step">Validation</div>
          <div class="flow-step">Production Deploy</div>
          <div class="flow-step">Health Check</div>
        </div>

        <h3>Environment Configuration</h3>
        <table>
          <thead>
            <tr>
              <th>Environment</th>
              <th>Infrastructure</th>
              <th>Deployment Method</th>
              <th>Data Source</th>
              <th>Monitoring Level</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Development</td>
              <td>Local/Docker</td>
              <td>Manual/Hot Reload</td>
              <td>Mock Data</td>
              <td>Basic Logging</td>
            </tr>
            <tr>
              <td>Staging</td>
              <td>Cloud Instance</td>
              <td>Automated CI/CD</td>
              <td>Production Copy</td>
              <td>Full Monitoring</td>
            </tr>
            <tr>
              <td>Production</td>
              <td>Load Balanced</td>
              <td>Blue-Green Deploy</td>
              <td>Live Database</td>
              <td>Real-time Alerts</td>
            </tr>
          </tbody>
        </table>

        Include comprehensive details for:
        - Infrastructure requirements and cloud architecture planning
        - CI/CD pipeline design with automated testing integration
        - Environment management and configuration strategies
        - Release management with version control and rollback procedures
        - Monitoring, logging, and alerting system implementation
        - Security hardening and access control measures
        - Performance optimization and scalability planning
        - Disaster recovery and backup strategies

        Focus on reliability, scalability, and zero-downtime deployment capabilities.`,
      },
      {
        title: "Maintenance & Support",
        prompt: `Plan comprehensive maintenance and support strategy for: "${description}" with detailed support infrastructure and maintenance workflow visualization.

        Generate HTML with modern maintenance strategy design:

        <div class="section-divider">
          <div class="section-divider-text">Maintenance & Support Strategy</div>
        </div>

        <div class="architecture-diagram">
          <h3>Support Infrastructure Overview</h3>
          <p>Establish comprehensive maintenance and support framework for long-term sustainability and optimal performance.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary">
              <div class="diagram-title">Maintenance Tasks</div>
              <div class="diagram-subtitle">Scheduled & Preventive</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Support Structure</div>
              <div class="diagram-subtitle">24/7 Operations</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Updates & Upgrades</div>
              <div class="diagram-subtitle">Version Management</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Performance Monitoring</div>
              <div class="diagram-subtitle">Real-time Analytics</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Maintenance Workflow</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">Health Monitoring</div>
          <div class="flow-step">Issue Detection</div>
          <div class="flow-step">Impact Assessment</div>
          <div class="flow-step">Resolution Planning</div>
          <div class="flow-step">Implementation</div>
          <div class="flow-step">Verification</div>
        </div>

        <h3>Support Tier Structure</h3>
        <table>
          <thead>
            <tr>
              <th>Support Level</th>
              <th>Response Time</th>
              <th>Coverage</th>
              <th>Escalation Path</th>
              <th>Resources</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tier 1 - Basic</td>
              <td>< 4 hours</td>
              <td>Business Hours</td>
              <td>Tier 2 Escalation</td>
              <td>Support Team</td>
            </tr>
            <tr>
              <td>Tier 2 - Advanced</td>
              <td>< 2 hours</td>
              <td>Extended Hours</td>
              <td>Development Team</td>
              <td>Senior Engineers</td>
            </tr>
            <tr>
              <td>Tier 3 - Critical</td>
              <td>< 30 minutes</td>
              <td>24/7 Coverage</td>
              <td>Emergency Response</td>
              <td>Expert Team</td>
            </tr>
          </tbody>
        </table>

        <div class="section-divider">
          <div class="section-divider-text">Lifecycle Management</div>
        </div>

        <div class="architecture-diagram">
          <div class="diagram-container" style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin: 20px 0;">
            <div class="diagram-box secondary">
              <div class="diagram-title">Security Updates</div>
              <div class="diagram-subtitle">Monthly Patches</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Feature Updates</div>
              <div class="diagram-subtitle">Quarterly Releases</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Major Upgrades</div>
              <div class="diagram-subtitle">Annual Planning</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">EOL Planning</div>
              <div class="diagram-subtitle">5-Year Roadmap</div>
            </div>
          </div>
        </div>

        Include comprehensive details for:
        - Ongoing maintenance task scheduling and automation
        - Support team structure and escalation procedures
        - Update and upgrade planning with minimal downtime
        - Performance monitoring and optimization strategies
        - Security maintenance and vulnerability management
        - Documentation and knowledge base management
        - User training and change management processes
        - Long-term sustainability and technology evolution planning

        Plan for 3-5 year lifecycle with clear upgrade paths and technology roadmap.`,
      },
      {
        title: "Budget Breakdown",
        prompt: `Create comprehensive budget breakdown for: "${description}" with detailed cost analysis and financial planning visualization.

        Use these exact CSS template patterns for consistent styling:

        <!-- Modern Card Template -->
        <div class="modern-card" style="background: linear-gradient(135deg, #ffffff, #f8fafc); border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 20px 0; box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <h3 style="color: #6366f1; margin-bottom: 16px; font-weight: 700;">Card Title</h3>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">Card content goes here...</p>
        </div>

        <!-- Modern Table Template -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 24px 0; background: linear-gradient(135deg, #ffffff, #f8fafc); border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px -5px rgba(0, 0, 0, 0.1); border: 2px solid #e2e8f0; position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <thead>
            <tr>
              <th style="padding: 18px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Header</th>
            </tr>
          </thead>
          <tbody>
            <tr style="transition: all 0.2s ease;">
              <td style="padding: 16px 18px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #e2e8f0; color: #374151;">Content</td>
            </tr>
          </tbody>
        </table>

        <!-- Flow Diagram Template -->
        <div class="flowchart" style="display: flex; flex-wrap: wrap; gap: 16px; margin: 20px 0; justify-content: center; align-items: center; padding: 24px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);">
          <div class="flow-step" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 20px; border-radius: 12px; font-weight: 600; position: relative; min-width: 140px; text-align: center; box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3); transition: all 0.3s ease; font-size: 14px; border: 2px solid rgba(255, 255, 255, 0.2);">
            Step 1
            <div style="position: absolute; right: -18px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 14px solid #6366f1; z-index: 10;"></div>
          </div>
        </div>

        <!-- Architecture Diagram Template -->
        <div class="architecture-diagram" style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 20px 0; box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);"></div>
          <h3 style="color: #6366f1; margin-bottom: 16px; font-weight: 700;">Architecture Overview</h3>
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: 2px solid #4f46e5; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; position: relative; min-height: 80px; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 8px;">
              <div class="diagram-title" style="font-size: 14px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Component</div>
              <div class="diagram-subtitle" style="font-size: 11px; opacity: 0.8; font-weight: 500;">Description</div>
            </div>
          </div>
        </div>

        Generate HTML with modern budget analysis design:

        <div class="section-divider">
          <div class="section-divider-text">Budget Breakdown & Financial Planning</div>
        </div>

        <div class="architecture-diagram">
          <h3>Cost Structure Overview</h3>
          <p>Comprehensive financial analysis with realistic cost estimates and contingency planning for project success.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary">
              <div class="diagram-title">Development Costs</div>
              <div class="diagram-subtitle">Team & Implementation</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Infrastructure</div>
              <div class="diagram-subtitle">Cloud & Hardware</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Third-party Services</div>
              <div class="diagram-subtitle">APIs & Tools</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Operational Costs</div>
              <div class="diagram-subtitle">Ongoing Expenses</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Cost Allocation Flow</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">Personnel (60%)</div>
          <div class="flow-step">Infrastructure (20%)</div>
          <div class="flow-step">Third-party (10%)</div>
          <div class="flow-step">Testing & QA (5%)</div>
          <div class="flow-step">Contingency (5%)</div>
        </div>

        <h3>Detailed Cost Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Cost Category</th>
              <th>Description</th>
              <th>Unit Cost</th>
              <th>Duration/Quantity</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Development Team</td>
              <td>Senior/Mid/Junior Developers</td>
              <td>$80-150/hour</td>
              <td>${requirements.timeline}</td>
              <td>Calculate based on team size</td>
            </tr>
            <tr>
              <td>Cloud Infrastructure</td>
              <td>AWS/Azure/GCP Services</td>
              <td>$500-2000/month</td>
              <td>12 months</td>
              <td>$6,000-24,000</td>
            </tr>
            <tr>
              <td>Third-party APIs</td>
              <td>Payment, Auth, Analytics</td>
              <td>$50-500/month</td>
              <td>12 months</td>
              <td>$600-6,000</td>
            </tr>
            <tr>
              <td>Testing & QA</td>
              <td>Automated Testing Tools</td>
              <td>$200-1000/month</td>
              <td>Project Duration</td>
              <td>Based on timeline</td>
            </tr>
          </tbody>
        </table>

        <div class="section-divider">
          <div class="section-divider-text">Financial Planning</div>
        </div>

        <div class="architecture-diagram">
          <div class="diagram-container" style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin: 20px 0;">
            <div class="diagram-box secondary">
              <div class="diagram-title">Phase 1 Budget</div>
              <div class="diagram-subtitle">Foundation (30%)</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Phase 2-3 Budget</div>
              <div class="diagram-subtitle">Development (50%)</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Phase 4-5 Budget</div>
              <div class="diagram-subtitle">Testing & Launch (15%)</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Contingency Fund</div>
              <div class="diagram-subtitle">Risk Buffer (5%)</div>
            </div>
          </div>
        </div>

        Include comprehensive details for:
        - Development team costs with role-based hourly rates
        - Infrastructure and hosting expenses with scalability considerations
        - Third-party service licensing and API usage costs
        - Testing, QA, and deployment automation tool expenses
        - Project management and coordination overhead costs
        - Legal, compliance, and security audit expenses
        - Training and knowledge transfer costs
        - Ongoing operational and maintenance budgets

        Budget Context:
        - Total Budget Range: ${requirements.budget}
        - Team Size: ${requirements.teamSize}
        - Project Timeline: ${requirements.timeline}

        Provide realistic cost estimates with 5-10% contingency buffer for risk mitigation.`,
      },
      {
        title: "Timeline Details",
        prompt: `Create comprehensive project timeline for: "${description}" with detailed milestone tracking and timeline visualization.

        Generate HTML with modern timeline design:

        <div class="section-divider">
          <div class="section-divider-text">Project Timeline & Milestone Planning</div>
        </div>

        <div class="architecture-diagram">
          <h3>Timeline Overview</h3>
          <p>Comprehensive project scheduling with critical path analysis and milestone dependency tracking for successful delivery.</p>
          
          <div class="diagram-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0;">
            <div class="diagram-box primary">
              <div class="diagram-title">Phase Planning</div>
              <div class="diagram-subtitle">Sequential Development</div>
            </div>
            <div class="diagram-box secondary">
              <div class="diagram-title">Critical Path</div>
              <div class="diagram-subtitle">Dependency Analysis</div>
            </div>
            <div class="diagram-box accent">
              <div class="diagram-title">Resource Allocation</div>
              <div class="diagram-subtitle">Team & Budget Timeline</div>
            </div>
            <div class="diagram-box primary">
              <div class="diagram-title">Risk Buffers</div>
              <div class="diagram-subtitle">Contingency Planning</div>
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Development Timeline Flow</div>
        </div>

        <div class="flowchart">
          <div class="flow-step">Phase 1 (20%)</div>
          <div class="flow-step">Phase 2 (30%)</div>
          <div class="flow-step">Phase 3 (25%)</div>
          <div class="flow-step">Phase 4 (15%)</div>
          <div class="flow-step">Phase 5 (10%)</div>
        </div>

        <h3>Detailed Phase Timeline</h3>
        <table>
          <thead>
            <tr>
              <th>Phase</th>
              <th>Duration</th>
              <th>Key Milestones</th>
              <th>Dependencies</th>
              <th>Team Focus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Foundation & Setup</td>
              <td>20% of timeline</td>
              <td>Environment, Framework, Auth</td>
              <td>None</td>
              <td>Full Team</td>
            </tr>
            <tr>
              <td>Core Development</td>
              <td>30% of timeline</td>
              <td>MVP Features, API, Database</td>
              <td>Phase 1 Complete</td>
              <td>Development Focus</td>
            </tr>
            <tr>
              <td>Advanced Features</td>
              <td>25% of timeline</td>
              <td>Integrations, Performance</td>
              <td>Core Features</td>
              <td>Specialized Teams</td>
            </tr>
            <tr>
              <td>Testing & QA</td>
              <td>15% of timeline</td>
              <td>Testing, Security, UAT</td>
              <td>Feature Complete</td>
              <td>QA Team Lead</td>
            </tr>
            <tr>
              <td>Deployment & Launch</td>
              <td>10% of timeline</td>
              <td>Production, Monitoring</td>
              <td>Testing Complete</td>
              <td>DevOps Focus</td>
            </tr>
          </tbody>
        </table>

        Include comprehensive details for:
        - Phase-by-phase breakdown with specific deliverables
        - Critical path analysis identifying project bottlenecks
        - Milestone tracking with clear success criteria
        - Resource allocation timeline showing team capacity
        - Risk buffer periods integrated throughout development
        - Delivery schedules with client review incorporation
        - Parallel development opportunities for timeline optimization
        - Contingency planning for scope changes and challenges

        Timeline Context:
        - Duration: ${requirements.timeline}
        - Scope: ${requirements.scope}

        Create realistic timeline with 10-15% buffer periods for risk mitigation.`,
      },
      {
        title: "Team Structure",
        prompt: `Design optimal team structure for: "${description}" with modern organizational chart and team hierarchy visualization.

        Generate HTML with modern team structure design:

        <div class="section-divider">
          <div class="section-divider-text">Team Structure & Organization</div>
        </div>

        <div class="org-chart">
          <h3>Project Team Hierarchy</h3>
          
          <!-- Executive Level -->
          <div class="org-level">
            <div class="org-role manager lead">Project Manager</div>
          </div>
          
          <!-- Leadership Level -->
          <div class="org-level">
            <div class="org-role manager">Tech Lead</div>
            <div class="org-role designer lead">Design Lead</div>
            <div class="org-role analyst">Product Owner</div>
          </div>
          
          <!-- Development Team -->
          <div class="org-level">
            <div class="org-role developer">Senior Developer</div>
            <div class="org-role developer">Frontend Dev</div>
            <div class="org-role developer">Backend Dev</div>
            <div class="org-role designer">UI/UX Designer</div>
            <div class="org-role tester">QA Engineer</div>
          </div>
          
          <!-- Support Team -->
          <div class="org-level">
            <div class="org-role analyst">DevOps Engineer</div>
            <div class="org-role tester">Automation Tester</div>
            <div class="org-role developer">Junior Developer</div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-text">Team Composition Matrix</div>
        </div>

        <div class="team-compact">
          <div class="team-member">
            <div class="role-title">Project Manager</div>
            <div class="role-level">Leadership</div>
          </div>
          <div class="team-member">
            <div class="role-title">Technical Lead</div>
            <div class="role-level">Senior</div>
          </div>
          <div class="team-member">
            <div class="role-title">Senior Developer</div>
            <div class="role-level">Senior</div>
          </div>
          <div class="team-member">
            <div class="role-title">Frontend Developer</div>
            <div class="role-level">Mid-Level</div>
          </div>
          <div class="team-member">
            <div class="role-title">Backend Developer</div>
            <div class="role-level">Mid-Level</div>
          </div>
          <div class="team-member">
            <div class="role-title">UI/UX Designer</div>
            <div class="role-level">Mid-Level</div>
          </div>
          <div class="team-member">
            <div class="role-title">QA Engineer</div>
            <div class="role-level">Mid-Level</div>
          </div>
          <div class="team-member">
            <div class="role-title">DevOps Engineer</div>
            <div class="role-level">Senior</div>
          </div>
        </div>

        <h3>Team Responsibilities Matrix</h3>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Key Responsibilities</th>
              <th>Skills Required</th>
              <th>Experience Level</th>
              <th>Reporting Structure</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Project Manager</td>
              <td>Planning, Coordination, Stakeholder Management</td>
              <td>Agile, Communication, Risk Management</td>
              <td>5+ years</td>
              <td>Reports to Stakeholders</td>
            </tr>
            <tr>
              <td>Technical Lead</td>
              <td>Architecture, Code Review, Technical Decisions</td>
              <td>Full-stack Development, System Design</td>
              <td>7+ years</td>
              <td>Reports to Project Manager</td>
            </tr>
            <tr>
              <td>Senior Developer</td>
              <td>Complex Features, Mentoring, Code Quality</td>
              <td>Advanced Programming, Design Patterns</td>
              <td>5+ years</td>
              <td>Reports to Technical Lead</td>
            </tr>
            <tr>
              <td>Frontend Developer</td>
              <td>UI Implementation, User Experience</td>
              <td>React, TypeScript, CSS, Responsive Design</td>
              <td>3+ years</td>
              <td>Reports to Technical Lead</td>
            </tr>
            <tr>
              <td>Backend Developer</td>
              <td>API Development, Database Design</td>
              <td>Node.js, Database, Cloud Services</td>
              <td>3+ years</td>
              <td>Reports to Technical Lead</td>
            </tr>
            <tr>
              <td>UI/UX Designer</td>
              <td>Design System, User Research, Prototyping</td>
              <td>Figma, Design Thinking, User Research</td>
              <td>3+ years</td>
              <td>Reports to Design Lead</td>
            </tr>
            <tr>
              <td>QA Engineer</td>
              <td>Testing Strategy, Quality Assurance</td>
              <td>Test Automation, Manual Testing</td>
              <td>3+ years</td>
              <td>Reports to Project Manager</td>
            </tr>
            <tr>
              <td>DevOps Engineer</td>
              <td>CI/CD, Infrastructure, Monitoring</td>
              <td>AWS/Azure, Docker, Kubernetes</td>
              <td>4+ years</td>
              <td>Reports to Technical Lead</td>
            </tr>
          </tbody>
        </table>

        <div class="section-divider">
          <div class="section-divider-text">Communication & Collaboration</div>
        </div>

        <div class="architecture-diagram">
          <h3>Team Communication Flow</h3>
          <div class="diagram-container">
            <!-- Daily Standup -->
            <div class="diagram-box terminal primary" style="grid-column: 1; grid-row: 2;">
              <div class="diagram-title">Daily Standup</div>
            </div>
            
            <!-- Sprint Planning -->
            <div class="diagram-box process secondary" style="grid-column: 3; grid-row: 2;">
              <div class="diagram-title">Sprint Planning</div>
              <div class="diagram-subtitle">Bi-weekly</div>
            </div>
            
            <!-- Code Review -->
            <div class="diagram-box process warning" style="grid-column: 5; grid-row: 2;">
              <div class="diagram-title">Code Review</div>
              <div class="diagram-subtitle">Continuous</div>
            </div>
            
            <!-- Team Sync -->
            <div class="diagram-box process info" style="grid-column: 7; grid-row: 2;">
              <div class="diagram-title">Team Sync</div>
              <div class="diagram-subtitle">Weekly</div>
            </div>
            
            <!-- Retrospective -->
            <div class="diagram-box terminal success" style="grid-column: 9; grid-row: 2;">
              <div class="diagram-title">Retrospective</div>
            </div>
            
            <!-- Connections -->
            <div class="flowchart-line horizontal" style="grid-column: 2; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 4; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 6; grid-row: 2; align-self: center;"></div>
            <div class="flowchart-line horizontal" style="grid-column: 8; grid-row: 2; align-self: center;"></div>
          </div>
        </div>

        Include comprehensive details for:
        - Role definitions with clear responsibilities and accountability
        - Skill requirements matrix with technical and soft skills
        - Team composition optimization for project complexity
        - Reporting structure with clear communication channels
        - Collaboration protocols and meeting cadences
        - Performance metrics and team success indicators
        - Onboarding process for new team members
        - Escalation procedures and conflict resolution

        Team Configuration:
        - Size: ${requirements.teamSize}
        - Technical Complexity: ${requirements.technicalComplexity}
        - Project Scope: ${requirements.scope}

        Design team structure for optimal collaboration and delivery efficiency.`,
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

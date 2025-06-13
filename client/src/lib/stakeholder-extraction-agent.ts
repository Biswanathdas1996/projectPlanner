import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ExtractedStakeholder {
  name: string;
  role: string;
  type: "internal" | "external" | "system";
  responsibilities: string[];
  interactions: string[];
  influence: "high" | "medium" | "low";
  interest: "high" | "medium" | "low";
  category: "primary" | "secondary" | "key";
}

export interface StakeholderAnalysis {
  stakeholders: ExtractedStakeholder[];
  stakeholderMatrix: {
    primary: ExtractedStakeholder[];
    secondary: ExtractedStakeholder[];
    key: ExtractedStakeholder[];
  };
  totalCount: number;
  categories: Record<string, number>;
  flowTypes: Record<string, string[]>;
  recommendations: string[];
}

export class StakeholderExtractionAgent {
  private model: any;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1500;

  constructor() {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required for stakeholder extraction");
    }

    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.85,
        maxOutputTokens: 4096,
      },
    });
  }

  async extractStakeholdersFromProjectPlan(
    projectPlan: string,
    progressCallback?: (step: string, progress: number) => void
  ): Promise<StakeholderAnalysis> {
    progressCallback?.("Analyzing project plan structure", 10);

    // Clean and prepare the project plan text
    const cleanedPlan = this.cleanProjectPlanText(projectPlan);

    progressCallback?.("Identifying stakeholder patterns", 25);

    // Extract stakeholders using AI analysis
    const stakeholders = await this.identifyStakeholders(cleanedPlan);

    progressCallback?.("Categorizing stakeholders", 50);

    // Categorize and analyze stakeholders
    const categorizedStakeholders = this.categorizeStakeholders(stakeholders);

    progressCallback?.("Analyzing stakeholder relationships", 75);

    // Generate flow types and recommendations
    const flowTypes = this.generateFlowTypes(categorizedStakeholders);
    const recommendations = this.generateRecommendations(
      categorizedStakeholders
    );

    progressCallback?.("Finalizing stakeholder analysis", 100);

    return {
      stakeholders: categorizedStakeholders,
      stakeholderMatrix: this.createStakeholderMatrix(categorizedStakeholders),
      totalCount: categorizedStakeholders.length,
      categories: this.countCategories(categorizedStakeholders),
      flowTypes,
      recommendations,
    };
  }

  private cleanProjectPlanText(projectPlan: string): string {
    // Remove HTML tags if present
    let cleaned = projectPlan.replace(/<[^>]*>/g, " ");

    // Remove extra whitespace and normalize
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    // Remove common non-relevant patterns
    cleaned = cleaned.replace(
      /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi,
      " "
    );

    return cleaned;
  }

  private async identifyStakeholders(
    projectPlan: string
  ): Promise<ExtractedStakeholder[]> {
    const prompt = `
Analyze the following project plan and extract ALL stakeholders involved in the project. 
Be comprehensive and identify both obvious and implicit stakeholders.

Project Plan:
"${projectPlan.substring(0, 6000)}" ${
      projectPlan.length > 6000 ? "... [truncated]" : ""
    }

Extract stakeholders and return as JSON array with this exact structure:
[
  {
    "name": "Stakeholder Name",
    "role": "Their specific role/title",
    "type": "internal|external|system",
    "responsibilities": ["responsibility1", "responsibility2"],
    "interactions": ["interaction1", "interaction2"],
    "influence": "high|medium|low",
    "interest": "high|medium|low",
    "category": "primary|secondary|key"
  }
]

Include these stakeholder types:
- End Users (different user personas)
- Internal Team Members (developers, designers, managers, QA, DevOps)
- Business Stakeholders (product owners, executives, sales, marketing)
- External Partners (vendors, clients, regulatory bodies)
- System Stakeholders (databases, APIs, third-party services)
- Support Stakeholders (customer support, training, documentation)

Be thorough and extract 15-25 stakeholders minimum for a comprehensive analysis.
`;

    try {
      const result = await this.retryableRequest(() =>
        this.model.generateContent(prompt)
      );
      const response = result.response.text();
      const cleanedResponse = this.extractJsonFromResponse(response);
      const stakeholders = JSON.parse(cleanedResponse);

      return stakeholders.map((s: any) => this.validateStakeholder(s));
    } catch (error) {
      console.warn(
        "Primary stakeholder extraction failed, using fallback method:",
        error
      );
      return this.extractStakeholdersFallback(projectPlan);
    }
  }

  private validateStakeholder(stakeholder: any): ExtractedStakeholder {
    return {
      name: stakeholder.name || "Unknown Stakeholder",
      role: stakeholder.role || "Unspecified Role",
      type: ["internal", "external", "system"].includes(stakeholder.type)
        ? stakeholder.type
        : "internal",
      responsibilities: Array.isArray(stakeholder.responsibilities)
        ? stakeholder.responsibilities
        : [],
      interactions: Array.isArray(stakeholder.interactions)
        ? stakeholder.interactions
        : [],
      influence: ["high", "medium", "low"].includes(stakeholder.influence)
        ? stakeholder.influence
        : "medium",
      interest: ["high", "medium", "low"].includes(stakeholder.interest)
        ? stakeholder.interest
        : "medium",
      category: ["primary", "secondary", "key"].includes(stakeholder.category)
        ? stakeholder.category
        : "secondary",
    };
  }

  private extractStakeholdersFallback(
    projectPlan: string
  ): ExtractedStakeholder[] {
    const commonStakeholders = [
      {
        name: "End Users",
        role: "Primary Users",
        type: "external",
        category: "primary",
        influence: "high",
        interest: "high",
      },
      {
        name: "Product Owner",
        role: "Product Management",
        type: "internal",
        category: "key",
        influence: "high",
        interest: "high",
      },
      {
        name: "Project Manager",
        role: "Project Coordination",
        type: "internal",
        category: "key",
        influence: "high",
        interest: "high",
      },
      {
        name: "Development Team",
        role: "Software Development",
        type: "internal",
        category: "primary",
        influence: "medium",
        interest: "high",
      },
      {
        name: "QA Engineers",
        role: "Quality Assurance",
        type: "internal",
        category: "primary",
        influence: "medium",
        interest: "high",
      },
      {
        name: "UI/UX Designers",
        role: "User Experience Design",
        type: "internal",
        category: "primary",
        influence: "medium",
        interest: "high",
      },
      {
        name: "System Administrators",
        role: "Infrastructure Management",
        type: "internal",
        category: "secondary",
        influence: "medium",
        interest: "medium",
      },
      {
        name: "Business Analysts",
        role: "Requirements Analysis",
        type: "internal",
        category: "secondary",
        influence: "medium",
        interest: "high",
      },
      {
        name: "Stakeholders",
        role: "Business Decision Makers",
        type: "internal",
        category: "key",
        influence: "high",
        interest: "medium",
      },
      {
        name: "Customer Support",
        role: "User Support",
        type: "internal",
        category: "secondary",
        influence: "low",
        interest: "medium",
      },
    ];

    return commonStakeholders.map(
      (s) =>
        ({
          ...s,
          responsibilities: [
            `Manage ${s.role.toLowerCase()}`,
            "Ensure project success",
          ],
          interactions: [
            "Project meetings",
            "Status updates",
            "Requirements review",
          ],
        } as ExtractedStakeholder)
    );
  }

  private categorizeStakeholders(
    stakeholders: ExtractedStakeholder[]
  ): ExtractedStakeholder[] {
    return stakeholders.map((stakeholder) => {
      // Auto-categorize based on influence and interest
      if (stakeholder.influence === "high" && stakeholder.interest === "high") {
        stakeholder.category = "key";
      } else if (
        stakeholder.influence === "high" ||
        stakeholder.interest === "high"
      ) {
        stakeholder.category = "primary";
      } else {
        stakeholder.category = "secondary";
      }

      return stakeholder;
    });
  }

  private createStakeholderMatrix(stakeholders: ExtractedStakeholder[]) {
    return {
      primary: stakeholders.filter((s) => s.category === "primary"),
      secondary: stakeholders.filter((s) => s.category === "secondary"),
      key: stakeholders.filter((s) => s.category === "key"),
    };
  }

  private countCategories(
    stakeholders: ExtractedStakeholder[]
  ): Record<string, number> {
    const counts = { internal: 0, external: 0, system: 0 };
    stakeholders.forEach((s) => {
      counts[s.type]++;
    });
    return counts;
  }

  private generateFlowTypes(
    stakeholders: ExtractedStakeholder[]
  ): Record<string, string[]> {
    const flowTypes: Record<string, string[]> = {};

    stakeholders.forEach((stakeholder) => {
      const flows = [];
      const roleLower = stakeholder.role.toLowerCase();
      const nameLower = stakeholder.name.toLowerCase();

      // Enhanced flow generation based on specific roles and responsibilities

      // End Users and Customers
      if (
        nameLower.includes("user") ||
        nameLower.includes("customer") ||
        nameLower.includes("client")
      ) {
        flows.push(
          "User Onboarding",
          "Authentication Flow",
          "Main Feature Access",
          "Profile Management"
        );
        flows.push(
          "Support Request",
          "Feedback Submission",
          "Account Settings",
          "Data Export"
        );
      }

      // Administrative roles
      if (
        nameLower.includes("admin") ||
        roleLower.includes("admin") ||
        roleLower.includes("administrator")
      ) {
        flows.push(
          "Admin Dashboard Access",
          "User Account Management",
          "System Configuration"
        );
        flows.push(
          "Reports Generation",
          "Security Monitoring",
          "Backup Management"
        );
      }

      // Management roles
      if (
        nameLower.includes("manager") ||
        roleLower.includes("manager") ||
        roleLower.includes("supervisor")
      ) {
        flows.push(
          "Team Overview",
          "Resource Allocation",
          "Performance Review"
        );
        flows.push(
          "Budget Approval",
          "Strategic Planning",
          "Stakeholder Communication"
        );
      }

      // Development and Technical roles
      if (
        roleLower.includes("developer") ||
        roleLower.includes("engineer") ||
        nameLower.includes("dev")
      ) {
        flows.push(
          "Code Development",
          "Testing Workflow",
          "Deployment Process"
        );
        flows.push("Bug Resolution", "Code Review", "Documentation Update");
      }

      // QA and Testing roles
      if (
        roleLower.includes("qa") ||
        roleLower.includes("test") ||
        roleLower.includes("quality")
      ) {
        flows.push("Test Case Creation", "Test Execution", "Bug Reporting");
        flows.push(
          "Quality Review",
          "Performance Testing",
          "User Acceptance Testing"
        );
      }

      // Design roles
      if (
        roleLower.includes("design") ||
        roleLower.includes("ux") ||
        roleLower.includes("ui")
      ) {
        flows.push("Design Creation", "User Research", "Prototype Development");
        flows.push(
          "Design Review",
          "Usability Testing",
          "Style Guide Management"
        );
      }

      // Business Analyst roles
      if (roleLower.includes("analyst") || roleLower.includes("business")) {
        flows.push(
          "Requirements Gathering",
          "Process Analysis",
          "Documentation"
        );
        flows.push("Stakeholder Interviews", "Gap Analysis", "Solution Design");
      }

      // Product roles
      if (roleLower.includes("product") || nameLower.includes("product")) {
        flows.push(
          "Feature Planning",
          "Roadmap Management",
          "User Story Creation"
        );
        flows.push("Market Research", "Product Launch", "Metrics Analysis");
      }

      // Support roles
      if (roleLower.includes("support") || nameLower.includes("support")) {
        flows.push(
          "Ticket Management",
          "Customer Assistance",
          "Issue Escalation"
        );
        flows.push(
          "Knowledge Base Update",
          "Customer Communication",
          "Problem Resolution"
        );
      }

      // Sales and Marketing
      if (roleLower.includes("sales") || roleLower.includes("marketing")) {
        flows.push(
          "Lead Generation",
          "Customer Engagement",
          "Campaign Management"
        );
        flows.push("Sales Process", "Market Analysis", "Customer Retention");
      }

      // DevOps and Infrastructure
      if (
        roleLower.includes("devops") ||
        roleLower.includes("infrastructure") ||
        roleLower.includes("system")
      ) {
        flows.push(
          "Infrastructure Setup",
          "Deployment Pipeline",
          "System Monitoring"
        );
        flows.push(
          "Security Implementation",
          "Backup Process",
          "Performance Optimization"
        );
      }

      // External stakeholders
      if (stakeholder.type === "external") {
        flows.push(
          "External Communication",
          "Contract Management",
          "Compliance Reporting"
        );
        flows.push(
          "Partnership Coordination",
          "Vendor Management",
          "Regulatory Interaction"
        );
      }

      // System stakeholders
      if (stakeholder.type === "system") {
        flows.push(
          "API Integration",
          "Data Synchronization",
          "System Health Check"
        );
        flows.push("Error Handling", "Automated Monitoring", "Data Backup");
      }

      // Financial roles
      if (roleLower.includes("finance") || roleLower.includes("accounting")) {
        flows.push("Budget Planning", "Financial Reporting", "Cost Analysis");
        flows.push(
          "Invoice Processing",
          "Payment Management",
          "Financial Compliance"
        );
      }

      // Legal and Compliance
      if (roleLower.includes("legal") || roleLower.includes("compliance")) {
        flows.push("Legal Review", "Compliance Monitoring", "Risk Assessment");
        flows.push(
          "Contract Review",
          "Regulatory Reporting",
          "Policy Management"
        );
      }

      // Default flows based on responsibilities if none matched
      if (flows.length === 0) {
        stakeholder.responsibilities.forEach((responsibility) => {
          const respLower = responsibility.toLowerCase();
          if (respLower.includes("manage")) {
            flows.push("Management Dashboard", "Resource Oversight");
          }
          if (respLower.includes("develop")) {
            flows.push("Development Workflow", "Code Management");
          }
          if (respLower.includes("test")) {
            flows.push("Testing Process", "Quality Assurance");
          }
          if (respLower.includes("support")) {
            flows.push("Support Workflow", "Issue Resolution");
          }
        });
      }

      // Final fallback flows
      if (flows.length === 0) {
        flows.push(
          "Standard Workflow",
          "Communication Process",
          "Status Updates"
        );
      }

      // Remove duplicates and limit to reasonable number
      const uniqueFlows: string[] = [];
      const seen = new Set<string>();
      for (const flow of flows) {
        if (!seen.has(flow) && uniqueFlows.length < 8) {
          seen.add(flow);
          uniqueFlows.push(flow);
        }
      }
      flowTypes[stakeholder.name] = uniqueFlows;
    });

    return flowTypes;
  }

  private generateRecommendations(
    stakeholders: ExtractedStakeholder[]
  ): string[] {
    const recommendations = [];

    const keyStakeholders = stakeholders.filter(
      (s) => s.category === "key"
    ).length;
    const highInfluenceStakeholders = stakeholders.filter(
      (s) => s.influence === "high"
    ).length;
    const externalStakeholders = stakeholders.filter(
      (s) => s.type === "external"
    ).length;

    if (keyStakeholders > 5) {
      recommendations.push(
        "Consider establishing a steering committee to manage the large number of key stakeholders"
      );
    }

    if (highInfluenceStakeholders > 8) {
      recommendations.push(
        "Implement a stakeholder engagement hierarchy to manage high-influence stakeholders effectively"
      );
    }

    if (externalStakeholders > 3) {
      recommendations.push(
        "Develop external stakeholder communication protocols and regular touchpoint schedules"
      );
    }

    recommendations.push(
      "Create detailed BPMN flows for each primary stakeholder to map their journey through the system"
    );
    recommendations.push(
      "Establish regular feedback loops with key stakeholders to ensure alignment throughout the project"
    );
    recommendations.push(
      "Consider stakeholder impact analysis for major project decisions and changes"
    );

    return recommendations;
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
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    return jsonMatch ? jsonMatch[0] : response;
  }
}

export function createStakeholderExtractionAgent(): StakeholderExtractionAgent {
  return new StakeholderExtractionAgent();
}

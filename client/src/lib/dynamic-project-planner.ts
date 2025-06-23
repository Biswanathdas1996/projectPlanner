import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ProjectSection {
  id: string;
  title: string;
  description: string;
  prompt: string;
  order: number;
  enabled: boolean;
  estimatedHours?: number;
  priority?: "critical" | "high" | "medium" | "low";
}

export interface GeneratedSection {
  id: string;
  title: string;
  content: string;
  generated: boolean;
  estimatedHours: number;
  priority: "critical" | "high" | "medium" | "low";
}

export interface ProjectPlanConfig {
  sections: ProjectSection[];
  projectDescription: string;
  additionalContext?: string;
}

export interface ProjectPlanResult {
  sections: GeneratedSection[];
  totalEstimatedHours: number;
  generationTime: number;
  htmlContent: string;
}

export class DynamicProjectPlanner {
  private model: any;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

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
        maxOutputTokens: 4096,
      },
    });
  }

  async generateProjectPlan(
    config: ProjectPlanConfig,
    progressCallback?: (
      section: string,
      progress: number,
      total: number
    ) => void
  ): Promise<ProjectPlanResult> {
    const startTime = Date.now();
    const enabledSections = config.sections
      .filter((section) => section.enabled)
      .sort((a, b) => a.order - b.order);

    const generatedSections: GeneratedSection[] = [];
    let totalEstimatedHours = 0;

    // Generate each section individually
    for (let i = 0; i < enabledSections.length; i++) {
      const section = enabledSections[i];
      progressCallback?.(section.title, i + 1, enabledSections.length);

      try {
        const generatedSection = await this.generateSection(
          section,
          config.projectDescription,
          config.additionalContext
        );
        generatedSections.push(generatedSection);
        totalEstimatedHours += generatedSection.estimatedHours;

        // Add delay between API calls to prevent rate limiting
        if (i < enabledSections.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      } catch (error) {
        console.error(`Failed to generate section: ${section.title}`, error);
        // Add fallback section
        generatedSections.push({
          id: section.id,
          title: section.title,
          content: `<p>Failed to generate content for ${section.title}. Please try again.</p>`,
          generated: false,
          estimatedHours: section.estimatedHours || 8,
          priority: section.priority || "medium",
        });
      }
    }

    const htmlContent = this.generateHtmlDocument(
      generatedSections,
      config.projectDescription
    );
    const generationTime = Date.now() - startTime;

    return {
      sections: generatedSections,
      totalEstimatedHours,
      generationTime,
      htmlContent,
    };
  }

  private async generateSection(
    section: ProjectSection,
    projectDescription: string,
    additionalContext?: string
  ): Promise<GeneratedSection> {
    const enhancedPrompt = `
Project Description: "${projectDescription}"

${additionalContext ? `Additional Context: ${additionalContext}` : ""}

Section: ${section.title}
Description: ${section.description}

${section.prompt}

Please provide a comprehensive, professional response that includes:
- Detailed analysis and recommendations
- Specific implementation steps
- Best practices and considerations
- Risk factors and mitigation strategies
- Success metrics where applicable

Format the response in clean HTML with proper headings, paragraphs, lists, and structure.
Use professional styling classes like 'section-header', 'key-point', 'recommendation', etc.
`;

    const result = await this.retryableRequest(() =>
      this.model.generateContent(enhancedPrompt)
    );

    const response = result.response.text();
    const cleanedContent = this.cleanHtmlContent(response);

    return {
      id: section.id,
      title: section.title,
      content: cleanedContent,
      generated: true,
      estimatedHours:
        section.estimatedHours || this.estimateHours(section.title),
      priority: section.priority || "medium",
    };
  }

  private async retryableRequest(requestFn: () => Promise<any>): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, error);

        if (attempt < this.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempt)
          );
        }
      }
    }

    throw lastError;
  }

  private cleanHtmlContent(content: string): string {
    // Remove code blocks and clean up formatting
    let cleaned = content.trim();

    if (cleaned.startsWith("```html")) {
      cleaned = cleaned.replace(/^```html\s*/, "").replace(/```\s*$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    // Ensure proper HTML structure
    if (!cleaned.includes("<")) {
      cleaned = `<div class="section-content">${cleaned.replace(
        /\n/g,
        "</p><p>"
      )}</div>`;
      cleaned = cleaned.replace(
        '<div class="section-content"><p>',
        '<div class="section-content"><p>'
      );
      cleaned = cleaned.replace("</p></div>", "</p></div>");
    }

    return cleaned;
  }

  private estimateHours(sectionTitle: string): number {
    const hourEstimates: { [key: string]: number } = {
      "Executive Summary": 4,
      "Technical Architecture": 16,
      "Feature Specifications": 12,
      "Development Methodology": 8,
      "User Experience Design": 12,
      "Quality Assurance": 10,
      "Deployment Strategy": 10,
      "Risk Management": 6,
      "Stakeholder Management": 4,
      "Post-Launch Strategy": 6,
    };

    return hourEstimates[sectionTitle] || 8;
  }

  private generateHtmlDocument(
    sections: GeneratedSection[],
    projectDescription: string
  ): string {
    const sectionsHtml = sections
      .map(
        (section) => `
      <section class="project-section" id="${section.id}">
        <div class="section-header">
          <h2 class="section-title">${section.title}</h2>
          <div class="section-meta">
            <span class="estimated-hours">${section.estimatedHours}h</span>
            <span class="priority priority-${section.priority}">${section.priority}</span>
          </div>
        </div>
        <div class="section-content">
          ${section.content}
        </div>
      </section>
    `
      )
      .join("\n");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Plan - ${projectDescription.substring(0, 50)}...</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6; color: #333; background: #f8fafc;
        }
        .project-plan { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .plan-header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 3rem 2rem; border-radius: 12px; margin-bottom: 2rem;
            text-align: center;
        }
        .plan-title { font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; }
        .plan-description { font-size: 1.2rem; opacity: 0.9; }
        .project-section { 
            background: white; border-radius: 8px; padding: 2rem; margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #667eea;
        }
        .section-header { 
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #f1f5f9;
        }
        .section-title { font-size: 1.8rem; font-weight: 600; color: #1e293b; }
        .section-meta { display: flex; gap: 1rem; }
        .estimated-hours { 
            background: #e0f2fe; color: #0277bd; padding: 0.25rem 0.75rem;
            border-radius: 1rem; font-size: 0.875rem; font-weight: 500;
        }
        .priority { 
            padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.875rem;
            font-weight: 500; text-transform: uppercase;
        }
        .priority-critical { background: #fee2e2; color: #dc2626; }
        .priority-high { background: #fef3c7; color: #d97706; }
        .priority-medium { background: #e0f2fe; color: #0277bd; }
        .priority-low { background: #f0fdf4; color: #059669; }
        .section-content { font-size: 1rem; }
        .section-content h1, .section-content h2, .section-content h3 {
            color: #1e293b; margin: 1.5rem 0 1rem 0; font-weight: 600;
        }
        .section-content h1 { font-size: 1.5rem; }
        .section-content h2 { font-size: 1.3rem; }
        .section-content h3 { font-size: 1.1rem; }
        .section-content p { margin-bottom: 1rem; }
        .section-content ul, .section-content ol { 
            margin-left: 2rem; margin-bottom: 1rem;
        }
        .section-content li { margin-bottom: 0.5rem; }
        .key-point { 
            background: #f8fafc; border-left: 3px solid #3b82f6;
            padding: 1rem; margin: 1rem 0; border-radius: 0 6px 6px 0;
        }
        .recommendation { 
            background: #f0fdf4; border-left: 3px solid #10b981;
            padding: 1rem; margin: 1rem 0; border-radius: 0 6px 6px 0;
        }
        @media (max-width: 768px) {
            .project-plan { padding: 1rem; }
            .plan-header { padding: 2rem 1rem; }
            .plan-title { font-size: 2rem; }
            .section-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
        }
    </style>
</head>
<body>
    <div class="project-plan">
        <header class="plan-header">
            <h1 class="plan-title">Comprehensive Project Plan</h1>
            <p class="plan-description">${projectDescription}</p>
        </header>
        ${sectionsHtml}
    </div>
</body>
</html>`;
  }
}

// Default project plan configuration
export const DEFAULT_PROJECT_SECTIONS: ProjectSection[] = [
  {
    id: "executive-summary",
    title: "Executive Summary",
    description:
      "High-level overview of the project including objectives, scope, and expected outcomes",
    prompt:
      "Create a comprehensive executive summary that includes project vision, key objectives, success metrics, budget overview, timeline summary, and strategic importance. Make it suitable for stakeholders and decision-makers.",
    order: 1,
    enabled: true,
    estimatedHours: 4,
    priority: "critical",
  },
  {
    id: "technical-architecture",
    title: "Technical Architecture & Infrastructure",
    description:
      "Detailed technical design, system architecture, and infrastructure requirements",
    prompt:
      "Design a comprehensive technical architecture including system diagrams, technology stack recommendations, database design, API architecture, security framework, performance considerations, scalability planning, and infrastructure requirements.",
    order: 2,
    enabled: true,
    estimatedHours: 16,
    priority: "critical",
  },
  {
    id: "feature-specifications",
    title: "Detailed Feature Specifications",
    description:
      "Comprehensive breakdown of all features, user stories, and functional requirements",
    prompt:
      "Create detailed feature specifications including user stories, acceptance criteria, functional requirements, non-functional requirements, feature prioritization, and integration requirements. Include wireframes descriptions where relevant.",
    order: 3,
    enabled: true,
    estimatedHours: 12,
    priority: "high",
  },
  {
    id: "development-methodology",
    title: "Development Methodology & Timeline",
    description:
      "Development approach, project phases, milestones, and detailed timeline",
    prompt:
      "Define the development methodology (Agile, Scrum, etc.), sprint planning, milestone definitions, detailed project timeline, resource allocation, dependencies, and risk buffers. Include a realistic delivery schedule.",
    order: 4,
    enabled: true,
    estimatedHours: 8,
    priority: "high",
  },
  {
    id: "user-experience-design",
    title: "User Experience & Interface Design",
    description:
      "UX/UI design strategy, user journey mapping, and design system specifications",
    prompt:
      "Create a comprehensive UX/UI strategy including user persona analysis, user journey mapping, design system specifications, accessibility requirements, responsive design approach, and usability testing plans.",
    order: 5,
    enabled: true,
    estimatedHours: 12,
    priority: "high",
  },
  {
    id: "quality-assurance",
    title: "Quality Assurance & Testing Strategy",
    description: "Testing methodology, QA processes, and quality standards",
    prompt:
      "Design a comprehensive QA strategy including testing methodologies, test case development, automated testing approach, performance testing, security testing, user acceptance testing, and bug tracking processes.",
    order: 6,
    enabled: true,
    estimatedHours: 10,
    priority: "high",
  },
  {
    id: "deployment-devops",
    title: "Deployment & DevOps Strategy",
    description:
      "Deployment pipeline, DevOps practices, and production environment setup",
    prompt:
      "Create a detailed deployment and DevOps strategy including CI/CD pipeline design, environment management, deployment automation, monitoring and alerting, backup strategies, and rollback procedures.",
    order: 7,
    enabled: true,
    estimatedHours: 10,
    priority: "medium",
  },
  {
    id: "risk-management",
    title: "Risk Management & Mitigation",
    description:
      "Risk assessment, mitigation strategies, and contingency planning",
    prompt:
      "Develop a comprehensive risk management plan including risk identification, risk assessment matrix, mitigation strategies, contingency planning, and monitoring procedures. Cover technical, business, and operational risks.",
    order: 8,
    enabled: true,
    estimatedHours: 6,
    priority: "medium",
  },
  {
    id: "stakeholder-management",
    title: "Stakeholder Management",
    description:
      "Stakeholder identification, communication plan, and engagement strategy",
    prompt:
      "Create a stakeholder management plan including stakeholder identification, influence/interest matrix, communication strategy, feedback mechanisms, decision-making processes, and escalation procedures.",
    order: 9,
    enabled: true,
    estimatedHours: 4,
    priority: "medium",
  },
  {
    id: "post-launch-strategy",
    title: "Post-Launch Strategy",
    description:
      "Maintenance, support, monitoring, and future enhancement planning",
    prompt:
      "Design a comprehensive post-launch strategy including maintenance planning, user support processes, performance monitoring, analytics implementation, user feedback collection, and future enhancement roadmap.",
    order: 10,
    enabled: true,
    estimatedHours: 6,
    priority: "low",
  },
];

export function createDynamicProjectPlanner(): DynamicProjectPlanner {
  return new DynamicProjectPlanner();
}

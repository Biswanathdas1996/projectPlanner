import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PageRequirement {
  pageName: string;
  pageType: string;
  purpose: string;
  stakeholders: string[];
  contentElements: ContentElement[];
  userInteractions: string[];
  dataRequirements: string[];
  priority: "critical" | "high" | "medium" | "low";
  isEditing?: boolean;
}

export interface ContentElement {
  type:
    | "header"
    | "form"
    | "button"
    | "text"
    | "image"
    | "list"
    | "table"
    | "chart"
    | "input"
    | "dropdown"
    | "modal"
    | "navigation"
    | "api-display"
    | "upload"
    | "search";
  label: string;
  content: string;
  position: "top" | "center" | "bottom" | "left" | "right" | "sidebar";
  required: boolean;
  interactions: string[];
}

export interface WireframeAnalysisResult {
  projectContext: string;
  totalPages: number;
  pageRequirements: PageRequirement[];
  stakeholders: string[];
  commonElements: ContentElement[];
  userFlowConnections: { from: string; to: string; trigger: string }[];
  dataFlowMap: { source: string; destination: string; dataType: string }[];
}

export class WireframeAnalysisAgent {
  private model: any;

  constructor() {
    const genAI = new GoogleGenerativeAI(
      "AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg"
    );
    this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  }

  async analyzeStakeholderFlows(): Promise<WireframeAnalysisResult> {
    try {
      console.log("Starting stakeholder flow analysis...");

      // Get stakeholder flow data from local storage - try multiple possible keys
      const stakeholderFlowData = localStorage.getItem(
        "project-flow-data-intrim"
      );

      // Check if we have any flow-related data
      if (!stakeholderFlowData) {
        throw new Error(
          "No stakeholder flow data found. Please complete the Stakeholder Flow Analysis first by going to the User Journey page and generating flow details."
        );
      }

      let flowData = {};

      try {
        // Parse available data
        if (stakeholderFlowData) {
          flowData = stakeholderFlowData;
        }
      } catch (parseError) {
        console.error("Error parsing stored data:", parseError);
        // Continue with empty objects rather than failing
        flowData = {};
      }

      const analysisPrompt = this.buildAnalysisPrompt();
      console.log("Generated analysis prompt, calling Gemini API...");

      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysisText = response.text();

      console.log("Received Gemini response, parsing results...");
      return this.parseAnalysisResult(analysisText);
    } catch (error) {
      console.error("Error analyzing stakeholder flows:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          throw new Error(
            "API key issue. Please check your Gemini API configuration."
          );
        } else if (
          error.message.includes("quota") ||
          error.message.includes("limit")
        ) {
          throw new Error("API quota exceeded. Please try again later.");
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          throw new Error(
            "Network error. Please check your internet connection."
          );
        } else if (error.message.includes("stakeholder flow data")) {
          throw error; // Pass through our custom error messages
        }
      }

      throw new Error(
        `Analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private generateBasicAnalysisFromStakeholders(
    stakeholders: string[],
    projectDescription: string
  ): WireframeAnalysisResult {
    console.log("Generating basic analysis from stakeholders:", stakeholders);

    const pageRequirements: PageRequirement[] = [];

    // Create basic pages for each stakeholder
    stakeholders.forEach((stakeholder, index) => {
      pageRequirements.push({
        pageName: `${stakeholder} Dashboard`,
        pageType: "dashboard",
        purpose: `Main interface for ${stakeholder} to manage their tasks and view relevant information`,
        stakeholders: [stakeholder],
        contentElements: [
          {
            type: "header",
            label: `${stakeholder} Dashboard`,
            content: `Welcome ${stakeholder}`,
            position: "top",
            required: true,
            interactions: ["navigate"],
          },
          {
            type: "navigation",
            label: "Main Navigation",
            content: "Navigation menu",
            position: "top",
            required: true,
            interactions: ["navigate"],
          },
          {
            type: "list",
            label: "Tasks & Activities",
            content: `${stakeholder} specific tasks and activities`,
            position: "center",
            required: true,
            interactions: ["view", "edit", "complete"],
          },
          {
            type: "button",
            label: "Action Buttons",
            content: "Primary actions",
            position: "bottom",
            required: true,
            interactions: ["click", "submit"],
          },
        ],
        userInteractions: ["View tasks", "Complete actions", "Navigate"],
        dataRequirements: ["User data", "Task data", "Status information"],
        priority: "high",
      });
    });

    // Add common pages
    pageRequirements.push({
      pageName: "Login Page",
      pageType: "form",
      purpose: "User authentication and system access",
      stakeholders: stakeholders,
      contentElements: [
        {
          type: "form",
          label: "Login Form",
          content: "Username and password fields",
          position: "center",
          required: true,
          interactions: ["input", "submit"],
        },
        {
          type: "button",
          label: "Login Button",
          content: "Submit credentials",
          position: "center",
          required: true,
          interactions: ["click"],
        },
      ],
      userInteractions: ["Enter credentials", "Submit form"],
      dataRequirements: ["User credentials"],
      priority: "critical",
    });

    return {
      projectContext:
        projectDescription || "Business process management system",
      totalPages: pageRequirements.length,
      pageRequirements,
      stakeholders: stakeholders,
      commonElements: [
        {
          type: "navigation",
          label: "Main Navigation",
          content: "Site navigation",
          position: "top",
          required: true,
          interactions: ["navigate"],
        },
      ],
      userFlowConnections: [
        {
          from: "Login Page",
          to: `${stakeholders[0]} Dashboard`,
          trigger: "successful login",
        },
      ],
      dataFlowMap: [
        {
          source: "Login Page",
          destination: "User Dashboard",
          dataType: "authentication data",
        },
      ],
    };
  }

  private buildAnalysisPrompt(): string {
    return `
You are an expert UX/UI analyst and wireframe designer. Analyze the following stakeholder flow data and determine what pages/screens are needed for a comprehensive digital solution.
 
**Stakeholder flows:**
${localStorage.getItem("project-flow-data-intrim")}


**Analysis Requirements:**
1. Identify all unique pages/screens needed based on the above stakeholder flows
2. For each page, determine:
   - Primary purpose and function
   - Target stakeholders who will use it

4. Map the flow connections between pages
5. Identify common elements that appear across multiple pages

**Output Format (JSON):**
{
  "projectContext": "brief summary of the project",
  "totalPages": number,
  "pageRequirements": [
    {
      "pageName": "descriptive page name",
      "pageType": "dashboard|form|list|detail|approval|management|reporting",
      "purpose": "what this page accomplishes",
      "userInteractions": ["list of main user actions on this page"],
    }
  ],
  "commonElements": [list of elements that appear on multiple pages],
  "userFlowConnections": [
    {"from": "page1", "to": "page2", "trigger": "what action causes navigation"}
  ],
  "dataFlowMap": [
    {"source": "where data comes from", "destination": "where it goes", "dataType": "type of data"}
  ]
}

Provide a comprehensive analysis that covers all stakeholder needs and business processes identified in the flow data.
`;
  }

  private parseAnalysisResult(analysisText: string): WireframeAnalysisResult {
    try {
      // Extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in analysis result");
      }

      const analysisResult = JSON.parse(jsonMatch[0]);

      // Validate and enhance the result
      return {
        projectContext:
          analysisResult.projectContext ||
          "Project analysis based on stakeholder flows",
        totalPages:
          analysisResult.totalPages ||
          analysisResult.pageRequirements?.length ||
          0,
        pageRequirements: this.validatePageRequirements(
          analysisResult.pageRequirements || []
        ),
        stakeholders: analysisResult.stakeholders || [],
        commonElements: analysisResult.commonElements || [],
        userFlowConnections: analysisResult.userFlowConnections || [],
        dataFlowMap: analysisResult.dataFlowMap || [],
      };
    } catch (error) {
      console.error("Error parsing analysis result:", error);
    }

    // Return a default WireframeAnalysisResult in case of error
    return {
      projectContext: "Unknown project context",
      totalPages: 0,
      pageRequirements: [],
      stakeholders: [],
      commonElements: [],
      userFlowConnections: [],
      dataFlowMap: [],
    };
  }

  private validatePageRequirements(requirements: any[]): PageRequirement[] {
    return requirements.map((req) => ({
      pageName: req.pageName || "Unnamed Page",
      pageType: req.pageType || "form",
      purpose: req.purpose || "General purpose page",
      stakeholders: Array.isArray(req.stakeholders) ? req.stakeholders : [],
      contentElements: this.validateContentElements(req.contentElements || []),
      userInteractions: Array.isArray(req.userInteractions)
        ? req.userInteractions
        : [],
      dataRequirements: Array.isArray(req.dataRequirements)
        ? req.dataRequirements
        : [],
      priority: ["critical", "high", "medium", "low"].includes(req.priority)
        ? req.priority
        : "medium",
    }));
  }

  private validateContentElements(elements: any[]): ContentElement[] {
    const validTypes = [
      "header",
      "form",
      "button",
      "text",
      "image",
      "list",
      "table",
      "chart",
      "input",
      "dropdown",
      "modal",
      "navigation",
      "api-display",
      "upload",
      "search",
    ];
    const validPositions = [
      "top",
      "center",
      "bottom",
      "left",
      "right",
      "sidebar",
    ];

    return elements.map((element) => ({
      type: validTypes.includes(element.type) ? element.type : "text",
      label: element.label || "Content Element",
      content: element.content || "Content placeholder",
      position: validPositions.includes(element.position)
        ? element.position
        : "center",
      required: Boolean(element.required),
      interactions: Array.isArray(element.interactions)
        ? element.interactions
        : [],
    }));
  }

  private inferPageType(flowName: string): string {
    const flow = flowName.toLowerCase();
    if (flow.includes("dashboard") || flow.includes("overview"))
      return "dashboard";
    if (flow.includes("approval") || flow.includes("review")) return "approval";
    if (flow.includes("management") || flow.includes("admin"))
      return "management";
    if (flow.includes("report") || flow.includes("analytics"))
      return "reporting";
    if (flow.includes("form") || flow.includes("submit")) return "form";
    if (flow.includes("list") || flow.includes("browse")) return "list";
    return "detail";
  }

  private generateBasicContentElements(flowName: string): ContentElement[] {
    return [
      {
        type: "header",
        label: `${flowName} Header`,
        content: `${flowName} Management`,
        position: "top",
        required: true,
        interactions: [],
      },
      {
        type: "form",
        label: "Main Form",
        content: `${flowName} input form`,
        position: "center",
        required: true,
        interactions: ["Submit", "Reset"],
      },
      {
        type: "button",
        label: "Submit Button",
        content: "Submit",
        position: "bottom",
        required: true,
        interactions: ["Click"],
      },
    ];
  }
}

export function createWireframeAnalysisAgent(): WireframeAnalysisAgent {
  return new WireframeAnalysisAgent();
}

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E");

export async function generateCustomSuggestions(
  projectDescription: string,
): Promise<string[]> {
  if (!projectDescription.trim()) {
    throw new Error("Project description is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Based on this project description: "${projectDescription}"

Generate 8-12 relevant project planning suggestions that would help improve and expand this project. Focus on:
- Technical enhancements and features
- User experience improvements
- Business considerations
- Implementation strategies
- Quality assurance approaches
- Performance optimizations

Return ONLY a JSON array of suggestion strings, no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    return JSON.parse(text);
  } catch {
    // Fallback: extract suggestions from text format
    const lines = text
      .split("\n")
      .filter(
        (line) =>
          line.trim() && !line.includes("```") && !line.includes("JSON"),
      );
    return lines.slice(0, 10);
  }
}

export async function generateProjectPlan(
  projectDescription: string,
): Promise<string> {
  if (!projectDescription.trim()) {
    throw new Error("Project description is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Create a comprehensive project plan for: "${projectDescription}"

Structure the plan with these sections:
1. **Project Overview** - Brief summary and objectives
2. **Technical Architecture** - System design and technology stack
3. **Core Features** - Main functionality and user stories
4. **Development Phases** - Implementation timeline and milestones
5. **User Experience Flow** - Key user interactions and workflows
6. **Quality Assurance** - Testing strategies and validation
7. **Deployment Strategy** - Launch and maintenance considerations
8. **Risk Assessment** - Potential challenges and mitigation plans

Format as clean HTML with:
- Professional styling with embedded CSS
- Clear section headers with consistent typography
- Organized lists and structured content
- Subtle color coding for different section types
- Responsive design principles
- Professional spacing and visual hierarchy

Return ONLY the complete HTML document with embedded CSS - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateUserJourneyFlows(
  projectPlan: string,
): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Generate comprehensive user journey flow diagrams for different personas based on this project plan: "${projectPlan}"

Create detailed step-by-step flow diagrams for each distinct user persona and their specific journeys. Include:

**User Personas and Journey Types:**
1. **Guest/Anonymous User Journey** - Unauthenticated user interactions, exploration, registration flows
2. **Logged-in User Journey** - Authenticated user core features, profile management, main workflows
3. **Admin User Journey** - Administrative tasks, user management, system configuration, reporting
4. **Power User Journey** - Advanced features, bulk operations, integrations
5. **Mobile User Journey** - Mobile-specific interactions and responsive flows

**For Each Journey Include:**
- **Start Point**: Clear entry point and user context
- **Decision Points**: Where users make choices with branching paths
- **Action Steps**: Specific tasks users perform
- **System Interactions**: Backend processes and validations
- **Success/Failure Paths**: Different outcomes and error handling
- **Exit Points**: How journeys conclude

**Visual Format Requirements:**
- Clean HTML with embedded CSS styling
- Interactive flow diagrams with hover effects
- Color-coded sections for different persona types
- Professional typography and spacing
- Responsive design for all screen sizes
- Clear visual indicators for different flow types

Return ONLY the complete HTML document with embedded CSS - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generatePersonaBpmnFlow(
  projectPlan: string,
  personaType: "guest" | "loggedin" | "admin" | "power" | "mobile",
): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const personaPrompts = {
    guest: {
      title: "Guest User Journey",
      description:
        "Unauthenticated user interactions, exploration, discovery, registration flows",
      swimlanes: [
        "Guest User",
        "Public Interface",
        "Authentication System",
        "Content Service",
      ],
    },
    loggedin: {
      title: "Logged-in User Journey",
      description:
        "Authenticated user core features, profile management, main application workflows",
      swimlanes: [
        "Logged-in User",
        "User Interface",
        "Application Service",
        "Data Storage",
      ],
    },
    admin: {
      title: "Admin User Journey",
      description:
        "Administrative tasks, user management, system configuration, reporting and analytics",
      swimlanes: [
        "Admin User",
        "Admin Panel",
        "Management Service",
        "System Database",
      ],
    },
    power: {
      title: "Power User Journey",
      description:
        "Advanced features, bulk operations, API access, integrations, custom workflows",
      swimlanes: [
        "Power User",
        "Advanced Features",
        "API Gateway",
        "Integration Hub",
      ],
    },
    mobile: {
      title: "Mobile User Journey",
      description:
        "Mobile-specific interactions, responsive flows, offline capabilities, push notifications",
      swimlanes: ["Mobile User", "Mobile App", "Push Service", "Sync Service"],
    },
  };

  const persona = personaPrompts[personaType];

  const prompt = `Generate a BPMN 2.0 XML diagram specifically for ${persona.title} based on this project plan: "${projectPlan}"

**Focus on ${persona.description}**

**BPMN 2.0 Requirements:**
- Create valid BPMN 2.0 XML format following OMG specifications
- Include proper XML namespaces and schema declarations
- Use swimlanes (Participant/Lane elements) for: ${persona.swimlanes.join(", ")}
- Implement proper BPMN elements: StartEvent, Task, ExclusiveGateway, EndEvent
- Include SequenceFlow connections between all elements
- Add proper BPMNDiagram with visual positioning coordinates

**${persona.title} Specific Elements:**
- **Start Events**: ${personaType === "guest" ? "Landing page visit, search discovery" : personaType === "admin" ? "Admin login, dashboard access" : "User login, app launch"}
- **User Tasks**: ${personaType === "guest" ? "Browse content, view features, register" : personaType === "admin" ? "Manage users, configure settings, review reports" : "Use core features, update profile"}
- **Service Tasks**: ${personaType === "guest" ? "Show public content, track analytics" : personaType === "admin" ? "Generate reports, sync data, send notifications" : "Process requests, save data"}
- **Decision Points**: ${personaType === "guest" ? "Register vs browse, feature access" : personaType === "admin" ? "Permission checks, approval workflows" : "Feature availability, data validation"}
- **End Events**: Successful completion, error handling, session timeout

**Flow Patterns for ${persona.title}:**
- Sequential ${personaType} interaction steps
- Decision branching based on ${personaType} permissions and context
- Error handling specific to ${personaType} scenarios
- Cross-swimlane communication patterns

**XML Structure Requirements:**
- Valid XML declaration and BPMN namespace
- Proper Process definition with flowNodeRef elements
- Collaboration element with ${persona.swimlanes.length} participants
- Complete BPMNDiagram with realistic coordinates
- Process ID: "Process_${personaType.charAt(0).toUpperCase() + personaType.slice(1)}_Journey"

Generate a complete, valid BPMN 2.0 XML document focused specifically on the ${persona.title} workflow.

Return ONLY the complete BPMN 2.0 XML - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateSitemapXml(projectPlan: string): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Generate a comprehensive XML sitemap based on this project plan: "${projectPlan}"

Create a realistic sitemap.xml file that includes:
- Homepage and core navigation pages
- Feature-specific pages based on the project plan
- User account and profile pages
- Administrative and management pages
- API documentation and developer resources
- Support and help pages
- Legal and policy pages
- Blog or content sections if applicable
- Search and filtering pages
- Mobile-specific pages if needed

**Requirements:**
- Valid XML sitemap format following sitemap.org protocol
- Realistic URLs that match the project type and structure
- Proper priority values (0.1 to 1.0) based on page importance
- Appropriate changefreq values (always, hourly, daily, weekly, monthly, yearly, never)
- lastmod dates set to current date for all pages
- Clean, properly formatted XML structure
- URLs should be realistic for the project description
- Include both user-facing and administrative pages
- Relevant to the project description

**XML Requirements:**
- Valid XML sitemap format following sitemap.org protocol
- Proper XML declaration and namespace
- Clean, properly formatted structure
- URLs should be realistic for the project type
- Include at least 15-25 pages for comprehensive coverage

Return ONLY the complete XML sitemap - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function extractStakeholdersFromProject(
  projectPlan: string,
): Promise<{ stakeholders: string[], flowTypes: Record<string, string[]> }> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Analyze this project plan and extract all stakeholders/user personas and their potential workflow types: "${projectPlan}"

Extract:
1. **Stakeholders/Personas**: All distinct user types, roles, or personas mentioned in the project plan
2. **Flow Types**: For each stakeholder, identify different workflow scenarios they might encounter

Examples of stakeholders: Guest User, Registered User, Admin, Content Manager, Customer Support, Developer, Power User, Mobile User, API Consumer, etc.

Examples of flow types per stakeholder:
- Guest User: Registration Flow, Browse Content Flow, Search Flow
- Admin: User Management Flow, Content Moderation Flow, Analytics Review Flow
- Customer: Purchase Flow, Support Request Flow, Account Management Flow

Return ONLY a JSON object in this exact format:
{
  "stakeholders": ["Stakeholder1", "Stakeholder2", ...],
  "flowTypes": {
    "Stakeholder1": ["Flow Type A", "Flow Type B", ...],
    "Stakeholder2": ["Flow Type C", "Flow Type D", ...]
  }
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    // Clean the response to extract JSON
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    }
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse stakeholders JSON:', error);
    // Fallback to default stakeholders
    return {
      stakeholders: ["Guest User", "Registered User", "Admin User", "Power User", "Mobile User"],
      flowTypes: {
        "Guest User": ["Registration Flow", "Browse Content Flow", "Search Flow"],
        "Registered User": ["Login Flow", "Main Features Flow", "Profile Management Flow"],
        "Admin User": ["User Management Flow", "System Configuration Flow", "Analytics Flow"],
        "Power User": ["Advanced Features Flow", "Bulk Operations Flow", "API Integration Flow"],
        "Mobile User": ["Mobile App Flow", "Offline Sync Flow", "Push Notification Flow"]
      }
    };
  }
}

export async function generatePersonaBpmnFlowWithType(
  projectPlan: string,
  stakeholder: string,
  flowType: string,
  customPrompt?: string
): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const enhancedProjectPlan = customPrompt 
    ? `${projectPlan}\n\nAdditional Requirements: ${customPrompt}`
    : projectPlan;

  const prompt = `Generate a BPMN 2.0 XML diagram for ${stakeholder} - ${flowType} based on this project plan: "${enhancedProjectPlan}"

**Focus on ${stakeholder} performing ${flowType} workflow**

**BPMN 2.0 Requirements:**
- Create valid BPMN 2.0 XML format following OMG specifications
- Include proper XML namespaces and schema declarations
- Use swimlanes (Participant/Lane elements) for: ${stakeholder}, System, Backend Service, External Service
- Implement proper BPMN elements: StartEvent, UserTask, ServiceTask, ExclusiveGateway, EndEvent
- Include SequenceFlow connections between all elements
- Add proper BPMNDiagram with visual positioning coordinates

**${flowType} Specific Elements:**
- **Start Events**: Entry point for ${flowType}
- **User Tasks**: Actions ${stakeholder} performs during ${flowType}
- **Service Tasks**: System processes supporting ${flowType}
- **Decision Points**: Branching logic specific to ${flowType}
- **End Events**: Completion states for ${flowType}

**Flow Patterns:**
- Sequential steps for ${flowType}
- Decision branching based on ${stakeholder} context
- Error handling specific to ${flowType}
- Cross-swimlane communication patterns

**XML Structure Requirements:**
- Valid XML declaration and BPMN namespace
- Process ID: "Process_${stakeholder.replace(/\s+/g, '_')}_${flowType.replace(/\s+/g, '_')}"
- Collaboration with appropriate participants
- Complete BPMNDiagram with realistic coordinates

Generate a complete, valid BPMN 2.0 XML document focused specifically on the ${stakeholder} ${flowType} workflow.

Return ONLY the complete BPMN 2.0 XML - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Clean the response to remove any markdown formatting
  let cleanedText = text.trim();
  if (cleanedText.startsWith("```xml")) {
    cleanedText = cleanedText.replace(/^```xml\s*/, "").replace(/```\s*$/, "");
  }
  if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  return cleanedText;
}

export async function generateBpmnXml(enhancedPrompt: string): Promise<string> {
  if (!enhancedPrompt.trim()) {
    throw new Error("Enhanced prompt is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(enhancedPrompt);
  const response = await result.response;
  const text = response.text();

  // Clean the response to remove any markdown formatting
  let cleanedText = text.trim();
  if (cleanedText.startsWith("```xml")) {
    cleanedText = cleanedText.replace(/^```xml\s*/, "").replace(/```\s*$/, "");
  }
  if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  return cleanedText;
}

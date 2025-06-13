import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini for client-side usage
const genAI = new GoogleGenerativeAI("AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E");

// Add error handling and logging for debugging
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.("Gemini") || args[0]?.includes?.("API")) {
    originalConsoleError("🔥 GEMINI API DEBUG:", ...args);
  } else {
    originalConsoleError(...args);
  }
};

export async function generateCustomizedBpmnFromStructuredData(structuredData: {
  processName: string;
  processDescription: string;
  participants: string[];
  trigger: string;
  activities: string[];
  decisionPoints: string[];
  endEvent: string;
  additionalElements: string[];
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    });

    const prompt = `You are a BPMN 2.0 expert. Generate a complete, valid BPMN 2.0 XML diagram based on this structured workflow data:

✅ 1. Process & Description: ${structuredData.processName}
${structuredData.processDescription}

✅ 2. Participants (Swimlanes): ${structuredData.participants.join(", ")}

✅ 3. Trigger (Start Event): ${structuredData.trigger}

✅ 4. Activities (Tasks): 
${structuredData.activities
  .map((activity, i) => `${i + 1}. ${activity}`)
  .join("\n")}

✅ 5. Decision Points (Gateways):
${structuredData.decisionPoints
  .map((decision, i) => `${i + 1}. ${decision}`)
  .join("\n")}

✅ 6. End Event: ${structuredData.endEvent}

✅ 7. Additional Elements: ${structuredData.additionalElements.join(", ")}

REQUIREMENTS:
- Generate complete BPMN 2.0 XML with proper namespaces (bpmn2, bpmndi, dc, di, xsi)
- Create collaboration with participant pools/swimlanes for each participant
- Include all activities as userTask elements in sequence
- Convert decision points into exclusiveGateway elements with conditional sequence flows
- Add proper Yes/No labels on gateway outgoing flows
- Include comprehensive visual positioning (BPMNDiagram, BPMNPlane, BPMNShape, BPMNEdge)
- Use proper BPMN 2.0 element types and attributes
- Ensure all elements have unique IDs and proper references
- Include start event, end event, and all workflow elements
- Generate swimlane layout with proper positioning
- Return ONLY the XML content, no explanations or markdown

Generate the BPMN 2.0 XML:`;

    console.log(
      "Generating AI-customized BPMN from 7-element structured data..."
    );
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let bpmnXml = response.text();

    // Clean up the response
    bpmnXml = bpmnXml.replace(/```xml\n?/g, "").replace(/```\n?/g, "");
    bpmnXml = bpmnXml.trim();

    // Ensure XML declaration
    if (!bpmnXml.startsWith("<?xml")) {
      bpmnXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + bpmnXml;
    }

    console.log(
      "AI Generated BPMN 2.0 XML:",
      bpmnXml.substring(0, 200) + "..."
    );

    return bpmnXml;
  } catch (error) {
    console.error(
      "Error generating customized BPMN from structured data:",
      error
    );
    throw error;
  }
}

export async function generateFlowAnalysis(prompt: string): Promise<string> {
  if (!prompt.trim()) {
    throw new Error("Prompt is required");
  }

  console.log("🚀 Starting Gemini API call for flow analysis...");

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    console.log("📡 Sending request to Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Received response from Gemini API, length:", text.length);

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from Gemini API");
    }

    return text;
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    throw new Error(`Gemini API failed: ${error.message}`);
  }
}

export async function generateCustomSuggestions(
  projectDescription: string
): Promise<string[]> {
  if (!projectDescription.trim()) {
    throw new Error("Project description is required");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });

  const prompt = `Analyze this project description and generate 10-15 highly relevant, actionable enhancement suggestions: "${projectDescription}"

SUGGESTION CATEGORIES (include 2-3 from each):

1. **Advanced Technical Features**
   - AI/ML integrations and automation
   - Advanced security implementations
   - Performance optimizations and caching
   - Real-time capabilities and websockets
   - API integrations and third-party services

2. **User Experience Enhancements**
   - Accessibility improvements (WCAG compliance)
   - Mobile-first responsive design
   - Progressive web app capabilities
   - User onboarding and tutorial systems
   - Personalization and customization options

3. **Business Intelligence & Analytics**
   - Comprehensive analytics and reporting
   - A/B testing framework implementation
   - User behavior tracking and insights
   - Performance monitoring and KPIs
   - Business intelligence dashboards

4. **Quality & Reliability**
   - Comprehensive testing strategies (unit, integration, e2e)
   - Error handling and graceful degradation
   - Monitoring and alerting systems
   - Backup and disaster recovery plans
   - Load testing and stress testing protocols

5. **Scalability & Infrastructure**
   - Microservices architecture implementation
   - Container orchestration and deployment
   - CDN integration for global performance
   - Database optimization and sharding
   - Auto-scaling and load balancing

REQUIREMENTS:
- Each suggestion must be specific and actionable
- Include implementation complexity consideration
- Focus on measurable business value
- Ensure suggestions are relevant to the project type
- Include both short-term and long-term enhancements
- Consider industry best practices and standards

Return ONLY a JSON array of suggestion strings with no explanations, markdown, or additional text.

Example format: ["Implement multi-factor authentication (MFA) and biometric login options for enhanced security", "Develop a personalized onboarding experience with interactive tutorials tailored to user financial literacy levels"]`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    // Clean the response to extract JSON
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/^```json\s*/, "")
        .replace(/```\s*$/, "");
    }
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    const suggestions = JSON.parse(cleanedText);

    // Validate suggestions array
    if (!Array.isArray(suggestions) || suggestions.length < 8) {
      throw new Error("Invalid suggestions format");
    }

    return suggestions.slice(0, 15); // Limit to 15 suggestions max
  } catch (error) {
    console.error("Failed to parse suggestions JSON:", error);
    // Enhanced fallback: extract suggestions from text format
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !line.includes("```") &&
          !line.includes("JSON") &&
          !line.startsWith("Here") &&
          !line.startsWith("Based") &&
          line.length > 20
      )
      .map((line) => line.replace(/^[\d\.\-\*\+]\s*/, "")) // Remove list markers
      .filter((line) => line.length > 30); // Filter out short lines

    return lines.slice(0, 12);
  }
}

export async function generateProjectPlan(
  projectDescription: string
): Promise<string> {
  if (!projectDescription.trim()) {
    throw new Error("Project description is required");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const prompt = `Create a comprehensive, detailed project plan for: "${projectDescription}"

CRITICAL REQUIREMENT: The document MUST start with a Table of Contents and include ALL 10 sections with exact numbering and titles as shown below.

MANDATORY STRUCTURE:

**Table of Contents**
1. Executive Summary
2. Technical Architecture & Infrastructure
3. Detailed Feature Specifications
4. Development Methodology & Timeline
5. User Experience & Interface Design
6. Quality Assurance & Testing Strategy
7. Deployment & DevOps Strategy
8. Risk Management & Mitigation
9. Stakeholder Management
10. Post-Launch Strategy

MANDATORY SECTIONS (ALL MUST BE INCLUDED WITH EXACT TITLES):

1. **Executive Summary**
   - Project purpose and vision
   - Key objectives and success metrics table
   - Target audience and market analysis
   - Budget estimation with cost breakdown table
   - ROI projections with timeline chart
   - **VISUALS**: Executive dashboard table, ROI timeline chart, stakeholder tree view

2. **Technical Architecture & Infrastructure**
   - Complete technology stack comparison table
   - System architecture flow diagram (ASCII art)
   - Database design with entity relationship tree
   - Security architecture flow diagram
   - Scalability progression timeline
   - Third-party integrations dependency tree
   - **VISUALS**: Architecture flow diagram, technology stack table, integration tree view

3. **Detailed Feature Specifications**
   - Core functionality comparison table
   - User stories with priority matrix table
   - User roles and permissions matrix
   - Feature prioritization tree (MVP → Future phases)
   - Acceptance criteria checklist tables
   - **VISUALS**: Feature tree hierarchy, user stories table, permissions matrix

4. **Development Methodology & Timeline**
   - Project phases timeline (Gantt-style)
   - Sprint planning table with deliverables
   - Team structure organization chart tree
   - Resource allocation timeline chart
   - Dependencies flow diagram
   - Critical path analysis with timeline
   - **VISUALS**: Gantt timeline, team org tree, dependency flow diagram

5. **User Experience & Interface Design**
   - User persona comparison table
   - User journey flow diagrams (ASCII)
   - Wireframe description with layout tree
   - Accessibility compliance checklist table
   - Responsive design breakpoint table
   - **VISUALS**: User journey flowcharts, persona comparison table, design tree structure

6. **Quality Assurance & Testing Strategy**
   - Testing methodology comparison table
   - Test case execution timeline
   - Quality metrics dashboard table
   - Bug severity classification table
   - Testing workflow flow diagram
   - **VISUALS**: Testing workflow diagram, QA timeline, metrics dashboard table

7. **Deployment & DevOps Strategy**
   - Environment progression flow diagram
   - CI/CD pipeline flow chart (ASCII)
   - Deployment timeline with milestones
   - Infrastructure monitoring table
   - Backup strategy timeline
   - **VISUALS**: CI/CD flow diagram, deployment timeline, infrastructure table

8. **Risk Management & Mitigation**
   - Risk assessment matrix table
   - Risk mitigation flow diagram
   - Risk probability timeline
   - Contingency planning tree structure
   - Impact vs likelihood chart
   - **VISUALS**: Risk matrix table, mitigation flow diagram, contingency tree

9. **Stakeholder Management**
   - Stakeholder hierarchy tree
   - Communication plan timeline
   - Responsibility assignment matrix (RACI)
   - Approval workflow diagram
   - Change management process flow
   - **VISUALS**: Stakeholder org tree, communication timeline, RACI matrix

10. **Post-Launch Strategy**
    - Launch timeline with milestones
    - KPI tracking dashboard table
    - Feature roadmap timeline
    - Growth strategy flow diagram
    - Maintenance schedule table
    - **VISUALS**: Launch timeline, KPI dashboard, roadmap timeline, growth flow diagram

MANDATORY VISUAL ELEMENTS FOR EACH SECTION:

1. **Flow Diagrams**: ASCII/Unicode flowcharts with boxes (┌─┐│└┘), arrows (→↓←↑), and decision diamonds (◊)
   Example: 
   ┌─────────────┐    ┌─────────────┐
   │   Start     │ →  │   Process   │
   └─────────────┘    └─────────────┘

2. **Tabular Data**: Professional HTML tables with headers, alternating row colors, and responsive design
   - Include comparison tables, feature matrices, cost breakdowns, and data summaries
   - Use proper table headers, sorting indicators, and status badges

3. **Tree Views**: Hierarchical structures using text-based indentation and Unicode tree characters (├──└──│)
   Example:
   ├── Executive Summary
   │   ├── Objectives
   │   └── Budget Analysis
   └── Technical Architecture

4. **Timeline Views**: Gantt-style representations using CSS progress bars and milestone markers
   - Show project phases, dependencies, and critical paths
   - Include percentage completion and milestone dates

5. **Progress Indicators**: CSS-based progress bars with percentages and status colors
   - Green for completed tasks, yellow for in-progress, red for blocked

6. **Charts & Graphs**: Data visualizations using CSS bar charts, pie charts with Unicode characters
   - Include budget breakdowns, resource allocation, and performance metrics

FORMATTING REQUIREMENTS:
- Complete HTML document with embedded CSS that matches the application's blue-purple gradient theme
- Use the application's color palette: blue (#3B82F6), purple (#8B5CF6), cyan (#06B6D4), gray gradients
- Professional corporate styling with rounded corners (8px-12px), subtle shadows, and glassmorphism effects
- Responsive design for all devices with mobile-optimized tables and diagrams
- Typography: Use system fonts (ui-sans-serif, system-ui, sans-serif) with proper line heights (1.6)
- Color scheme: White/light gray backgrounds (#F8FAFC, #F1F5F9), dark text (#1F2937), blue accent colors
- Interactive table of contents with anchor links using gradient backgrounds
- Professional charts, diagrams, and data visualizations with the theme colors
- CSS-based progress bars using blue-purple gradients and rounded styling
- Print-friendly styling with page breaks and consistent spacing
- Accessibility-compliant markup with proper ARIA labels and focus states
- Hover effects using the theme's blue/purple color transitions

VISUAL ELEMENT EXAMPLES TO INCLUDE:

**Sample Flow Diagram Template:**
<pre class="flow-diagram">
┌─────────────┐    ┌─────────────┐    ◊─────────────◊
│ Requirements│ →  │   Design    │ →  │  Approved?   │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                            ↓ Yes
                                   ┌─────────────┐
                                   │ Development │
                                   └─────────────┘
</pre>

**Sample Table Template:**
<table class="project-table">
  <thead>
    <tr><th>Feature</th><th>Priority</th><th>Effort</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>User Auth</td><td><span class="priority-high">High</span></td><td>5 days</td><td class="status-complete">✓ Complete</td></tr>
  </tbody>
</table>

**Required CSS Classes for Theme Consistency:**
<style>
/* Ensure full document height visibility */
html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  overflow-x: hidden;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #1F2937;
  background: #F8FAFC;
}

.document-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.project-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.project-table th {
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}
.project-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #E5E7EB;
}
.project-table tr:hover {
  background: #F8FAFC;
}
.priority-high { 
  background: linear-gradient(135deg, #EF4444, #DC2626);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}
.status-complete {
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}
.timeline-bar {
  background: linear-gradient(135deg, #3B82F6, #8B5CF6);
  height: 24px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  margin: 0.5rem 0;
}
.section-header {
  background: linear-gradient(135deg, #F8FAFC 0%, #E5E7EB 100%);
  padding: 1.5rem;
  border-radius: 12px;
  margin: 2rem 0 1rem 0;
  border-left: 4px solid #3B82F6;
  page-break-inside: avoid;
}
.flow-diagram {
  background: #F8FAFC;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  margin: 1rem 0;
  overflow-x: auto;
  white-space: pre;
}
.tree-view {
  background: #F8FAFC;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  line-height: 1.5;
  margin: 1rem 0;
  overflow-x: auto;
  white-space: pre;
}

/* Ensure content sections have proper spacing */
.content-section {
  margin: 2rem 0;
  padding-bottom: 2rem;
  border-bottom: 1px solid #E5E7EB;
}

.content-section:last-child {
  border-bottom: none;
  padding-bottom: 4rem;
}

/* Table of contents styling */
.toc {
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin: 2rem 0;
}

.toc a {
  color: white;
  text-decoration: none;
  display: block;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.toc a:hover {
  background: rgba(255, 255, 255, 0.1);
  padding-left: 1rem;
  transition: all 0.3s ease;
}

/* Print styles */
@media print {
  .document-container {
    max-width: none;
    margin: 0;
    padding: 1rem;
    box-shadow: none;
  }
  
  .section-header {
    page-break-after: avoid;
  }
  
  .project-table {
    page-break-inside: avoid;
  }
}
</style>

**Sample Tree View Template:**
<pre class="tree-view">
Project Structure
├── Frontend Development
│   ├── React Components
│   ├── State Management
│   └── UI/UX Design
├── Backend Development
│   ├── API Development
│   ├── Database Design
│   └── Authentication
└── DevOps & Deployment
    ├── CI/CD Pipeline
    └── Infrastructure Setup
</pre>

**Sample Timeline Template:**
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-bar" style="width: 75%; background-color: #4CAF50;"></div>
    <span>Phase 1: Planning (75% Complete)</span>
  </div>
</div>

QUALITY STANDARDS:
- Each section must be substantial (minimum 300 words)
- Include specific, actionable details with quantifiable metrics
- Provide realistic timelines with buffer considerations
- Use industry-standard terminology and best practices
- Include measurable success criteria with KPIs
- Address scalability, security, and maintainability from day one
- Every section MUST include the specified visual elements

CRITICAL VISUAL REQUIREMENTS:
- Minimum 3 tables per section with real data
- At least 2 flow diagrams showing process workflows
- 1 tree structure showing hierarchical organization
- Timeline charts with specific dates and milestones
- Progress indicators showing completion percentages
- All visuals must be styled with professional CSS

Return ONLY the complete HTML document with embedded CSS. The document must be production-ready, visually rich, and comprehensive enough for actual project implementation.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Validate the response contains all required sections with exact titles
  const requiredSections = [
    "Table of Contents",
    "1. Executive Summary",
    "2. Technical Architecture & Infrastructure",
    "3. Detailed Feature Specifications",
    "4. Development Methodology & Timeline",
    "5. User Experience & Interface Design",
    "6. Quality Assurance & Testing Strategy",
    "7. Deployment & DevOps Strategy",
    "8. Risk Management & Mitigation",
    "9. Stakeholder Management",
    "10. Post-Launch Strategy",
  ];

  const missingSections = requiredSections.filter(
    (section) => !text.includes(section)
  );

  if (missingSections.length > 0) {
    console.warn(
      `Retrying generation - missing sections: ${missingSections.join(", ")}`
    );

    // First retry with enhanced specificity
    const retryPrompt = `Create a comprehensive project plan for: "${projectDescription}"

ABSOLUTE REQUIREMENT: Include EXACTLY these sections in this order:

Table of Contents
1. Executive Summary
2. Technical Architecture & Infrastructure
3. Detailed Feature Specifications
4. Development Methodology & Timeline
5. User Experience & Interface Design
6. Quality Assurance & Testing Strategy
7. Deployment & DevOps Strategy
8. Risk Management & Mitigation
9. Stakeholder Management
10. Post-Launch Strategy

Each section must include:
- Flow diagrams using ASCII characters
- Professional HTML tables with data
- Tree structures for hierarchical organization
- Timeline charts with milestones
- Progress indicators

The document must be complete HTML with embedded CSS styling. Do not skip or merge any sections.`;

    const retryResult = await model.generateContent(retryPrompt);
    const retryResponse = await retryResult.response;
    const retryText = retryResponse.text();

    // Validate retry attempt
    const stillMissing = requiredSections.filter(
      (section) => !retryText.includes(section)
    );

    if (stillMissing.length > 0) {
      console.warn(
        `Second validation failed - still missing: ${stillMissing.join(", ")}`
      );

      // Final attempt with ultra-specific prompt
      const finalPrompt = `Generate HTML project plan with these EXACT headings:

<h1>Table of Contents</h1>
<h2>1. Executive Summary</h2>
<h2>2. Technical Architecture & Infrastructure</h2>
<h2>3. Detailed Feature Specifications</h2>
<h2>4. Development Methodology & Timeline</h2>
<h2>5. User Experience & Interface Design</h2>
<h2>6. Quality Assurance & Testing Strategy</h2>
<h2>7. Deployment & DevOps Strategy</h2>
<h2>8. Risk Management & Mitigation</h2>
<h2>9. Stakeholder Management</h2>
<h2>10. Post-Launch Strategy</h2>

For project: "${projectDescription}"

Include visual elements: tables, flow diagrams, tree structures, timelines in each section.`;

      const finalResult = await model.generateContent(finalPrompt);
      const finalResponse = await finalResult.response;
      return finalResponse.text();
    }

    return retryText;
  }

  return text;
}

export async function generateUserJourneyFlows(
  projectPlan: string
): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
  personaType: "guest" | "loggedin" | "admin" | "power" | "mobile"
): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

  const prompt = `Generate a BPMN 2.0 XML diagram specifically for ${
    persona.title
  } based on this project plan: "${projectPlan}"

**Focus on ${persona.description}**

**BPMN 2.0 Requirements:**
- Create valid BPMN 2.0 XML format following OMG specifications
- Include proper XML namespaces and schema declarations
- Use swimlanes (Participant/Lane elements) for: ${persona.swimlanes.join(", ")}
- Implement proper BPMN elements: StartEvent, Task, ExclusiveGateway, EndEvent
- Include SequenceFlow connections between all elements
- Add proper BPMNDiagram with visual positioning coordinates

**${persona.title} Specific Elements:**
- **Start Events**: ${
    personaType === "guest"
      ? "Landing page visit, search discovery"
      : personaType === "admin"
      ? "Admin login, dashboard access"
      : "User login, app launch"
  }
- **User Tasks**: ${
    personaType === "guest"
      ? "Browse content, view features, register"
      : personaType === "admin"
      ? "Manage users, configure settings, review reports"
      : "Use core features, update profile"
  }
- **Service Tasks**: ${
    personaType === "guest"
      ? "Show public content, track analytics"
      : personaType === "admin"
      ? "Generate reports, sync data, send notifications"
      : "Process requests, save data"
  }
- **Decision Points**: ${
    personaType === "guest"
      ? "Register vs browse, feature access"
      : personaType === "admin"
      ? "Permission checks, approval workflows"
      : "Feature availability, data validation"
  }
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
- Process ID: "Process_${
    personaType.charAt(0).toUpperCase() + personaType.slice(1)
  }_Journey"

Generate a complete, valid BPMN 2.0 XML document focused specifically on the ${
    persona.title
  } workflow.

Return ONLY the complete BPMN 2.0 XML - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateSitemapXml(projectPlan: string): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
  projectPlan: string
): Promise<{ stakeholders: string[]; flowTypes: Record<string, string[]> }> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
      cleanedText = cleanedText
        .replace(/^```json\s*/, "")
        .replace(/```\s*$/, "");
    }
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Failed to parse stakeholders JSON:", error);
    // Fallback to default stakeholders
    return {
      stakeholders: [
        "Guest User",
        "Registered User",
        "Admin User",
        "Power User",
        "Mobile User",
      ],
      flowTypes: {
        "Guest User": [
          "Registration Flow",
          "Browse Content Flow",
          "Search Flow",
        ],
        "Registered User": [
          "Login Flow",
          "Main Features Flow",
          "Profile Management Flow",
        ],
        "Admin User": [
          "User Management Flow",
          "System Configuration Flow",
          "Analytics Flow",
        ],
        "Power User": [
          "Advanced Features Flow",
          "Bulk Operations Flow",
          "API Integration Flow",
        ],
        "Mobile User": [
          "Mobile App Flow",
          "Offline Sync Flow",
          "Push Notification Flow",
        ],
      },
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

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
- **User Tasks**: Use SHORT names (2-4 words): "Submit Request", "Validate Data", "Process Transaction"
- **Service Tasks**: Use BPMN conventions: "Update Records", "Send Notification", "Generate Report" 
- **Decision Points**: Branching logic specific to ${flowType}
- **End Events**: Completion states for ${flowType}

**Activity Naming Rules:**
- Use "Verb + Object" format: "Submit Request", "Validate Data", "Process Payment"
- Keep names under 20 characters when possible
- Avoid long descriptive sentences
- Use standard BPMN task naming patterns

**Flow Patterns:**
- Sequential steps for ${flowType}
- Decision branching based on ${stakeholder} context
- Error handling specific to ${flowType}
- Cross-swimlane communication patterns

**XML Structure Requirements:**
- Valid XML declaration and BPMN namespace
- Process ID: "Process_${stakeholder.replace(/\s+/g, "_")}_${flowType.replace(
    /\s+/g,
    "_"
  )}"
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

export async function generateBpmnXml(flowContent: string): Promise<string> {
  // Check if we have structured 7-element format for enhanced AI generation
  const isStructuredFormat =
    flowContent.includes("✅ 1. Process & Description") &&
    flowContent.includes("✅ 2. Participants") &&
    flowContent.includes("✅ 3. Trigger") &&
    flowContent.includes("✅ 4. Activities") &&
    flowContent.includes("✅ 5. Decision Points") &&
    flowContent.includes("✅ 6. End Event") &&
    flowContent.includes("✅ 7. Additional Elements");

  if (isStructuredFormat) {
    console.log(
      "🎯 Using structured 7-element format for enhanced AI generation"
    );

    // Parse structured content for better AI understanding
    const sections = {
      process:
        flowContent
          .match(/✅ 1\. Process & Description\n([^✅]*)/)?.[1]
          ?.trim() || "",
      participants:
        flowContent
          .match(/✅ 2\. Participants.*?\n((?:- .*\n?)*)/)?.[1]
          ?.trim() || "",
      trigger:
        flowContent.match(/✅ 3\. Trigger.*?\n([^✅]*)/)?.[1]?.trim() || "",
      activities:
        flowContent
          .match(/✅ 4\. Activities.*?\n((?:\d+\. .*\n?)*)/)?.[1]
          ?.trim() || "",
      decisions:
        flowContent
          .match(/✅ 5\. Decision Points.*?\n((?:- .*\n?)*)/)?.[1]
          ?.trim() || "",
      endEvent:
        flowContent.match(/✅ 6\. End Event\n([^✅]*)/)?.[1]?.trim() || "",
      additional:
        flowContent
          .match(/✅ 7\. Additional Elements.*?\n((?:- .*\n?)*)/)?.[1]
          ?.trim() || "",
    };

    // Enhanced prompt for structured data with specific BPMN requirements
    const enhancedPrompt = `Generate a complete BPMN 2.0 XML diagram from this structured business process data:

PROCESS: ${sections.process}

PARTICIPANTS/SWIMLANES: 
${sections.participants}

START EVENT: ${sections.trigger}

SEQUENTIAL ACTIVITIES/TASKS:
${sections.activities}

DECISION POINTS/GATEWAYS:
${sections.decisions}

END EVENT: ${sections.endEvent}

ADDITIONAL ELEMENTS:
${sections.additional}

CRITICAL REQUIREMENTS for BPMN 2.0 XML:
- Use EXACT namespace: xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
- Include all participants as swimlanes with collaboration
- Create sequential flow between all activities in order
- Add exclusive gateways for each decision point with conditional flows
- Include proper visual layout with bpmndi:BPMNDiagram
- Use userTask for activities, exclusiveGateway for decisions
- Ensure all sourceRef/targetRef match element IDs exactly
- Generate unique IDs for all elements
- Include proper coordinates for visual positioning
- Return ONLY valid XML, no explanations or markdown`;

    flowContent = enhancedPrompt;
  }

  // Direct client-side BPMN generation using browser Gemini API
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment."
    );
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(flowContent);
  const response = await result.response;
  let text = response.text();

  // Clean up response to extract XML
  text = text
    .replace(/```xml\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Validate it starts with XML declaration or BPMN element
  if (!text.startsWith("<?xml") && !text.startsWith("<bpmn")) {
    console.error("Invalid BPMN XML response from AI");
    throw new Error("AI did not generate valid BPMN XML");
  }

  return text;
}

export async function generateBpmnXmlClient(
  flowContent: string
): Promise<string> {
  if (!flowContent.trim()) {
    throw new Error("Flow content is required");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2,
      topK: 30,
      topP: 0.8,
      maxOutputTokens: 4096,
    },
  });

  const prompt = `Generate a complete BPMN 2.0 XML diagram based STRICTLY on these 7 structured sections:

${flowContent}

MANDATORY MAPPING REQUIREMENTS:
✅ 1. Process & Description → bpmn2:process name and documentation
✅ 2. Participants (Swimlanes) → bpmn2:participant elements with pools/lanes
✅ 3. Trigger (Start Event) → bpmn2:startEvent with exact trigger name
✅ 4. Activities (Tasks) → bpmn2:userTask or bpmn2:serviceTask elements
✅ 5. Decision Points (Gateways) → bpmn2:exclusiveGateway elements
✅ 6. End Event → bpmn2:endEvent with exact end event name
✅ 7. Additional Elements → bpmn2:message, bpmn2:timer, bpmn2:dataObject as specified

STRICT XML STRUCTURE:
- Use bpmn2: namespace prefix consistently throughout
- Include proper XML declaration: <?xml version="1.0" encoding="UTF-8"?>
- Valid BPMN definitions with correct namespaces
- Create collaboration with participants as pools/lanes
- Process element with all flow elements
- BPMNDiagram with visual coordinates
- Connect ALL elements with bpmn2:sequenceFlow
- Ensure all XML tags are properly closed
- Use correct namespace prefixes (bpmn2: for BPMN elements, bpmndi: for diagram)

ELEMENT CREATION RULES:
- Create exactly one swimlane per participant listed in section 2
- Use exact trigger text from section 3 for start event name
- Convert each activity from section 4 to individual task elements
- Transform each decision point from section 5 to gateway elements
- Use exact end event text from section 6
- Add elements from section 7 as specified (messages, timers, data objects)
- Generate unique IDs for all elements

CRITICAL XML VALIDATION:
- Use bpmn2: prefix for ALL BPMN elements (bpmn2:startEvent, bpmn2:userTask, etc.)
- Use bpmndi: prefix for ALL diagram elements (bpmndi:BPMNShape, bpmndi:BPMNEdge)
- NO timer event definitions - use bpmn2:intermediateCatchEvent instead
- Ensure ALL XML tags are properly closed
- Validate namespace prefixes match element types

VISUAL LAYOUT:
- Include bpmndi:BPMNDiagram with proper coordinates
- Arrange elements left-to-right in process flow
- Position swimlanes vertically

Return ONLY valid BPMN 2.0 XML with proper namespaces - no explanations or markdown.

TEMPLATE STRUCTURE:
<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   id="Definitions_1" 
                   targetNamespace="http://bpmn.io/schema/bpmn">
  
  <bpmn2:collaboration id="Collaboration_1">
    <!-- Create participant for each swimlane from content -->
  </bpmn2:collaboration>
  
  <bpmn2:process id="Process_1" isExecutable="true">
    <!-- Map content sections to BPMN elements -->
    <!-- Start event from trigger -->
    <!-- Tasks from activities -->
    <!-- Gateways from decision points -->
    <!-- End event from end event content -->
    <!-- Sequence flows connecting all elements -->
  </bpmn2:process>
  
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <!-- Visual layout with coordinates -->
  </bpmndi:BPMNDiagram>
  
</bpmn2:definitions>

VALIDATION REQUIREMENTS:
- All referenced IDs must exist
- Sequence flows must connect valid source/target elements
- Each process element must be visually represented in diagram
- XML must be well-formed and valid BPMN 2.0

Return ONLY the complete, valid BPMN 2.0 XML - no explanations or markdown.`;

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

  // Basic validation - ensure it starts with XML declaration
  if (
    !cleanedText.startsWith("<?xml") &&
    !cleanedText.startsWith("<bpmn2:definitions")
  ) {
    throw new Error("Generated BPMN XML is not properly formatted");
  }

  // Validate essential BPMN elements are present
  const requiredElements = [
    "bpmn2:process",
    "bpmn2:startEvent",
    "bpmn2:endEvent",
  ];
  const missingElements = requiredElements.filter(
    (element) => !cleanedText.includes(element)
  );

  if (missingElements.length > 0) {
    console.warn("BPMN XML missing elements:", missingElements);
  }

  return cleanedText;
}

export async function generateSwimlaneXml(
  stakeholder: string,
  flowType: string,
  details: {
    description: string;
    participants: string[];
    activities: string[];
  }
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  });

  // Create valid XML IDs by sanitizing stakeholder and flow type names
  const cleanStakeholder = stakeholder
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const cleanFlowType = flowType
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const prompt = `Generate a BPMN 2.0 XML swimlane diagram based on these specifications:

STAKEHOLDER: ${stakeholder}
FLOW TYPE: ${flowType}
DESCRIPTION: ${details.description}

PARTICIPANTS:
${details.participants
  .map((participant, idx) => `${idx + 1}. ${participant}`)
  .join("\n")}

ACTIVITIES:
${details.activities
  .map((activity, idx) => `${idx + 1}. ${activity}`)
  .join("\n")}

Create a BPMN 2.0 XML with proper swimlane structure including:
- Participant pools for different actors/systems involved in this flow
- Process flows with start events, service tasks, and end events
- Proper BPMN 2.0 XML namespace declarations
- Valid diagram interchange (DI) elements for visual layout
- Sequence flows connecting all elements
- Swimlanes representing main actors (${stakeholder}, System, External Services)

CRITICAL XML ID REQUIREMENTS:
- All IDs must be valid XML identifiers (no spaces, parentheses, commas, or special characters)
- Use only alphanumeric characters and underscores for IDs
- Example valid IDs: "Process_${cleanStakeholder}_${cleanFlowType}", "Pool_${cleanStakeholder}", "Activity_1", "Flow_1"
- Invalid characters: ( ) , . - / \ @ # $ % ^ & * + = | [ ] { } < > ? ! ~ \` " '

BPMN STRUCTURE REQUIREMENTS:
- Return ONLY valid BPMN 2.0 XML
- No markdown formatting or explanations
- Include proper xmlns declarations exactly as shown:
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
- Use collaboration with participant pools for swimlanes
- Include bpmndi:BPMNDiagram for visual layout
- Process flows connecting the core processes in logical sequence
- Service tasks for key components
- Start and end events
- Gateways where decisions are needed
- Do not include unknown attributes like dx, dy in waypoints

EXAMPLE VALID STRUCTURE:
<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:collaboration id="Collaboration_1">
    <bpmn2:participant id="Pool_${cleanStakeholder}" name="${stakeholder}" processRef="Process_${cleanStakeholder}_${cleanFlowType}" />
  </bpmn2:collaboration>
  <bpmn2:process id="Process_${cleanStakeholder}_${cleanFlowType}" isExecutable="true">
    <bpmn2:startEvent id="StartEvent_1" name="Start ${flowType}" />
    <bpmn2:serviceTask id="Activity_1" name="Task Name" />
    <bpmn2:endEvent id="EndEvent_1" name="End ${flowType}" />
    <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Activity_1" />
    <bpmn2:sequenceFlow id="Flow_2" sourceRef="Activity_1" targetRef="EndEvent_1" />
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Pool_${cleanStakeholder}_di" bpmnElement="Pool_${cleanStakeholder}" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="600" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="212" y="162" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_1_di" bpmnElement="Activity_1">
        <dc:Bounds x="320" y="140" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="502" y="162" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="248" y="180" />
        <di:waypoint x="320" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="420" y="180" />
        <di:waypoint x="502" y="180" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>

Return ONLY the complete BPMN 2.0 XML - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Clean up response to extract XML
  text = text
    .replace(/```xml\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Validate it starts with XML declaration or BPMN element
  if (!text.startsWith("<?xml") && !text.startsWith("<bpmn")) {
    console.error("Invalid BPMN XML response:", text);
    throw new Error("Generated content is not valid BPMN XML");
  }

  return text;
}

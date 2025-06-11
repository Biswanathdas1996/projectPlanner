import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E");

export async function generateCustomSuggestions(projectDescription: string): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Based on this project description, generate 12-16 specific, relevant additional features and requirements that would enhance the project. Focus on practical, implementable features that would add real value.

Project Description:
"${projectDescription}"

Requirements:
1. Generate suggestions that are directly relevant to this specific project type
2. Include both technical and business features
3. Consider scalability, security, user experience, and integration aspects
4. Make each suggestion specific and actionable
5. Avoid generic suggestions that don't fit the project context
6. Include modern web development best practices
7. Consider the target audience and use cases for this project

Return ONLY a JSON array of strings, each string being a concise suggestion (max 60 characters). No explanations, just the array.

Example format: ["User authentication with 2FA", "Real-time notifications", "Mobile responsive design"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response and parse JSON
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    try {
      const suggestions = JSON.parse(cleanedText);
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (parseError) {
      console.error('JSON parse error for suggestions:', parseError);
      console.log('Raw response:', text);
      // Fallback to generic suggestions if parsing fails
      return [
        "User authentication and authorization",
        "Real-time notifications",
        "Mobile application support",
        "API integration capabilities",
        "Advanced search functionality",
        "Analytics and reporting dashboard",
        "Payment processing system",
        "File upload and management",
        "Multi-language support",
        "Security audit compliance",
        "Automated testing pipeline",
        "Performance optimization"
      ];
    }
  } catch (error) {
    console.error('Error generating custom suggestions:', error);
    // Return fallback suggestions
    return [
      "User authentication and authorization",
      "Real-time notifications",
      "Mobile application support",
      "API integration capabilities",
      "Advanced search functionality",
      "Analytics and reporting dashboard",
      "Payment processing system",
      "File upload and management",
      "Multi-language support",
      "Security audit compliance",
      "Automated testing pipeline",
      "Performance optimization"
    ];
  }
}

export async function generateProjectPlan(
  projectDescription: string,
): Promise<string> {
  if (!projectDescription.trim()) {
    throw new Error("Project description is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Create a comprehensive project plan for: "${projectDescription}"

IMPORTANT: Generate the response as complete HTML code with embedded CSS styling, architecture diagrams, and visual elements.

**OUTPUT FORMAT:**
Start your response with <!DOCTYPE html> and include:
- Complete HTML structure with head and body tags
- Embedded CSS in <style> tags within the head
- Visual architecture diagrams using CSS boxes, flexbox, and grid
- Interactive elements with hover effects
- Professional color scheme and typography

**Required Visual Components with Descriptions:**
1. **Executive Dashboard** - Overview cards showing project metrics, budget, timeline, and key performance indicators with elegant blue gradients
2. **System Architecture Diagram** - Visual component flow with rounded boxes and connecting arrows showing Frontend → API → Database → External Services in green tones
3. **User Journey Flow** - Step-by-step user interaction flow with decision diamonds and process rectangles in purple gradients
4. **Technology Stack** - Layered architecture diagram showing frontend, backend, database, and infrastructure layers with distinct color coding
5. **Development Timeline** - Project phases with milestones, deadlines, and deliverables in a professional timeline format
6. **Team Structure** - Organizational hierarchy with roles, responsibilities, and reporting structure
7. **CI/CD Pipeline** - Development workflow from code commit to deployment with automated testing stages
8. **Risk Assessment Matrix** - Color-coded risk analysis with mitigation strategies and priority levels

**CSS Requirements:**
- Use elegant color palette: primary blues (#3b82f6, #1d4ed8), secondary greens (#10b981, #059669), accent purples (#8b5cf6, #7c3aed)
- Create boxes with subtle gradients, soft shadows, and rounded corners
- Add smooth hover effects with color transitions
- Use modern typography with proper hierarchy
- Include descriptive text for each section explaining its purpose
- Responsive design with consistent spacing
- Professional card layouts with elegant borders

**Content Structure with Detailed Descriptions:**
- **Project Overview Section**: Clear objectives, scope definition, success criteria, and stakeholder information
- **Executive Summary**: High-level project metrics, budget overview, timeline summary, and expected ROI
- **Technical Architecture**: Detailed system design with component interactions, data flow, and integration points
- **User Experience Flow**: Complete user journey mapping with touchpoints, decision trees, and interaction patterns
- **Development Methodology**: Agile/Scrum practices, sprint planning, code review processes, and quality assurance
- **Resource Allocation**: Team structure, skill requirements, budget breakdown, and equipment needs
- **Risk Management**: Comprehensive risk analysis with probability assessment, impact evaluation, and mitigation plans
- **Implementation Roadmap**: Phase-wise delivery schedule with milestones, dependencies, and critical path analysis

**Visual Design Requirements:**
- Each section must include a brief description paragraph explaining its purpose and importance
- Use consistent color coding: Blues for architecture, Greens for processes, Purples for planning, Orange for risks
- Add subtle animations and hover effects for interactive elements
- Include icons and visual indicators for different content types
- Maintain professional spacing with proper typography hierarchy

Return ONLY the complete HTML document with embedded CSS - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateProjectPlanLegacy(
  projectDescription: string,
): Promise<string> {
  if (!projectDescription.trim()) {
    throw new Error("Project description is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
You are a senior business analyst and technical architect. Create a comprehensive project plan for the following project description:

"${projectDescription}"

1. Project Overview & Objectives
Problem Statement: Define the core challenge or opportunity addressed by the application.

Business Goals: List 2–3 clear, measurable goals.

KPIs & Success Metrics: Define metrics (e.g., user acquisition, retention, conversion).

Stakeholders: Identify key stakeholders (e.g., Product Owner, Tech Lead, QA Manager).

2. User Flow & Journey Mapping
User Roles: Define personas (e.g., Admin, End User, Reviewer).

End-to-End Journey: Outline complete user paths, key actions, and outcomes.

Decision Trees: Include conditional workflows and exception paths.

Touchpoints: Highlight screens, forms, alerts, and external integrations.

Edge Cases: Plan for invalid input, access issues, and service failures.

3. Technical Architecture
Frontend (React):

Component hierarchy, routing, state (Redux/Context/API Query).

Responsive UI, lazy loading, SSR (if needed).

Backend (API Layer):

REST/GraphQL endpoints, Flask/Express/NestJS, service contracts.

Authentication (OAuth2/JWT), role-based access.

Database Schema:

Tables/entities, indexing, relationships, migration strategy.

Security Model:

HTTPS, OWASP top 10, data encryption, API rate limits.

Infrastructure:

Cloud (Azure/AWS), CDN, logging, alerting (e.g., ELK, Prometheus).

Integrations:

External APIs (payment, KYC, analytics), webhooks, third-party SDKs.

Scalability:

Load balancing, horizontal scaling, stateless services.

Stack Recommendation:

React.js, Node.js/Python, PostgreSQL/MongoDB, Docker, NGINX, Kubernetes.

4. Development & Execution Plan
Repo Setup: GitHub/GitLab, mono/multi-repo, .gitignore, license.

Branching Model: Git Flow with main, develop, feature/hotfix branches.

Component Planning:

Modular folders: /components, /services, /store, /pages.

Sprints:

Bi-weekly with deliverables (UI, API integration, test coverage).

Sample roadmap:

Sprint 1: Auth & UI Skeleton

Sprint 2: Core Features & API

Sprint 3: Testing & Optimization

Estimation: Use story points (1–13), velocity-based burndown.

CI/CD:

GitHub Actions/GitLab CI, auto-tests, Docker builds, deployment.

Code Quality:

ESLint/Prettier, PR template, peer review checklists.

Dev Environment:

Vite/CRA setup, environment configs, .env handling.

Testing:

Jest, Cypress/Postman, min 80% coverage, coverage reports.

5. Team & Resource Allocation
Roles:

Frontend Devs, Backend Devs, QA Engineer, DevOps, PM, UI/UX.

Team Size: ~6–8 members for MVP.

Budget: Estimate resource cost, infra, licensing (~monthly/quarterly).

6. Risk & Mitigation
Tech Risks: API bottlenecks → Use caching, DB fallback.

Business Risks: Scope creep → Fixed feature set in MVP.

Timeline Risks: Dev delays → Add 10–15% buffer, parallelize tasks.

7. QA & Test Strategy
Methodologies:

Shift-left testing, TDD, functional + non-functional tests.

Automation:

CI-triggered unit + integration suites.

Performance Testing:

JMeter/Lighthouse, load benchmarks pre-release.

8. Deployment & Go-Live
Environment Setup:

Dev → QA → UAT → Prod; IaC with Terraform/Docker Compose.

Deployment Flow:

Blue-Green or Rolling Deployments with Helm or ECS.

Rollback Plan:

Version tagging, DB snapshot, hotfix pipeline.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateBpmnJson(projectPlan: string): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Convert the following comprehensive project plan into a detailed BPMN 2.0 XML script with swimlanes that represents complete user flows and technical architecture. Create workflows that capture:

1. **User Journey Flows**: Map every user interaction, decision point, and system response
2. **Technical Process Flows**: Include API calls, database operations, and system integrations
3. **Business Process Flows**: Capture approval workflows, validation steps, and business logic

CRITICAL REQUIREMENTS:
- Generate complete BPMN 2.0 XML with proper namespace declarations
- Include swimlanes (lanes) for different user roles, system components, and external services
- Use exclusive gateways for ALL decision points (user choices, validations, approvals, error handling)
- Use parallel gateways for concurrent processes (async operations, multi-user workflows)
- Add intermediate events for system waits, API calls, and external integrations
- Include error handling paths and exception flows
- Ensure all elements have proper IDs and are connected with sequence flows

Project Plan:
"${projectPlan}"

Return ONLY a complete BPMN 2.0 XML document in this format:

<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_EndUser" name="End User" processRef="Process_EndUser" />
    <bpmn:participant id="Participant_Frontend" name="Frontend Application" processRef="Process_Frontend" />
    <bpmn:participant id="Participant_Backend" name="Backend API" processRef="Process_Backend" />
    <bpmn:participant id="Participant_Database" name="Database Layer" processRef="Process_Database" />
    <bpmn:participant id="Participant_External" name="External Services" processRef="Process_External" />
  </bpmn:collaboration>

  <!-- Process definitions for each swimlane -->
  <bpmn:process id="Process_EndUser" isExecutable="true">
    <!-- End User tasks and events -->
  </bpmn:process>

  <bpmn:process id="Process_Frontend" isExecutable="true">
    <!-- Frontend application tasks -->
  </bpmn:process>

  <bpmn:process id="Process_Backend" isExecutable="true">
    <!-- Backend API tasks and gateways -->
  </bpmn:process>

  <bpmn:process id="Process_Database" isExecutable="true">
    <!-- Database operations -->
  </bpmn:process>

  <bpmn:process id="Process_External" isExecutable="true">
    <!-- External service integrations -->
  </bpmn:process>

  <!-- BPMN Diagram Information -->
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <!-- Visual layout information -->
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>

REQUIREMENTS FOR THE GENERATED XML:
1. **Swimlanes Structure**: Use bpmn:collaboration with multiple bpmn:participant elements for different roles (End User, Frontend, Backend, Database, External Services)
2. **Process Elements**: Include start events, tasks, exclusive gateways, parallel gateways, intermediate events, and end events
3. **Gateway Types**: 
   - exclusiveGateway for decision points (Yes/No branches)
   - parallelGateway for concurrent operations
   - eventBasedGateway for event-driven processes
4. **Task Types**:
   - userTask for user interactions
   - serviceTask for system operations
   - scriptTask for automated processes
   - manualTask for manual operations
5. **Event Types**:
   - startEvent for process initiation
   - endEvent for process completion
   - intermediateEvent for waiting points
   - messageEvent for notifications
6. **Sequence Flows**: Connect all elements with proper flow relationships and condition expressions
7. **Error Handling**: Include error events and exception flows
8. **Real Data Mapping**: Base all elements on actual project requirements from the plan

Generate a comprehensive BPMN 2.0 XML that accurately represents the project workflow with proper swimlane separation and realistic process flows.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Clean the response to remove any markdown formatting
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```xml')) {
    cleanedText = cleanedText.replace(/^```xml\s*/, '').replace(/```\s*$/, '');
  }
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  
  return cleanedText;
}
      {
        "type": "task",
        "id": "Task_Build",
        "name": "Automated Build",
        "lane": "Lane_2"
      },
      {
        "type": "exclusiveGateway",
        "id": "Gateway_Tests",
        "name": "All Tests Pass?",
        "lane": "Lane_2"
      },
      {
        "type": "task",
        "id": "Task_Deploy",
        "name": "Deploy to Staging",
        "lane": "Lane_2"
      },
      {
        "type": "task",
        "id": "Task_EnvSetup",
        "name": "Environment Configuration",
        "lane": "Lane_4"
      },
      {
        "type": "task",
        "id": "Task_Monitoring",
        "name": "Setup Monitoring & Alerts",
        "lane": "Lane_4"
      },
      {
        "type": "endEvent",
        "id": "EndEvent_1",
        "name": "Feature Deployed",
        "lane": "Lane_2"
      },
      {
        "type": "endEvent",
        "id": "EndEvent_2",
        "name": "Build Failed",
        "lane": "Lane_2"
      }
    ],
    "flows": [
      {
        "id": "Flow_1",
        "sourceRef": "StartEvent_1",
        "targetRef": "Task_1"
      },
      {
        "id": "Flow_2",
        "sourceRef": "Task_1",
        "targetRef": "Gateway_1"
      },
      {
        "id": "Flow_3",
        "sourceRef": "Gateway_1",
        "targetRef": "Task_CodeReview",
        "name": "Yes",
        "condition": "complete"
      },
      {
        "id": "Flow_4",
        "sourceRef": "Gateway_1",
        "targetRef": "Task_1",
        "name": "No",
        "condition": "incomplete"
      },
      {
        "id": "Flow_5",
        "sourceRef": "Task_CodeReview",
        "targetRef": "Gateway_QualityGate"
      },
      {
        "id": "Flow_6",
        "sourceRef": "Gateway_QualityGate",
        "targetRef": "Task_Build",
        "name": "Approved",
        "condition": "approved"
      },
      {
        "id": "Flow_7",
        "sourceRef": "Gateway_QualityGate",
        "targetRef": "Task_1",
        "name": "Rejected",
        "condition": "rejected"
      },
      {
        "id": "Flow_8",
        "sourceRef": "Task_Build",
        "targetRef": "Gateway_Tests"
      },
      {
        "id": "Flow_9",
        "sourceRef": "Gateway_Tests",
        "targetRef": "Task_Deploy",
        "name": "Pass",
        "condition": "pass"
      },
      {
        "id": "Flow_10",
        "sourceRef": "Gateway_Tests",
        "targetRef": "EndEvent_2",
        "name": "Fail",
        "condition": "fail"
      },
      {
        "id": "Flow_11",
        "sourceRef": "Task_Deploy",
        "targetRef": "EndEvent_1"
      }
    ]
  }
}

Rules for Comprehensive User Flow & Technical Architecture Mapping:

**Swimlane Organization:**
- Create 4-6 swimlanes representing user roles, system components, and external services
- Use specific names: "End User", "Frontend App", "Backend API", "Database", "External Services", "Admin/Manager"
- EVERY element MUST be assigned to a swimlane - no elements outside swimlanes
- Place tasks in appropriate swimlanes based on who/what performs them

**User Flow Mapping Requirements:**
- Map EVERY user interaction as a separate task or event
- Include user input validation, form submissions, navigation actions
- Add decision points for user choices (Login/Register?, Save/Cancel?, Accept/Decline?)
- Include error handling flows for invalid inputs, failed operations, timeouts

**Technical Architecture Requirements:**
- Include API calls as service tasks in "Backend API" swimlane
- Add database operations (Create, Read, Update, Delete) in "Database" swimlane
- Include authentication/authorization checks as exclusive gateways
- Add external service integrations (payment, email, notifications) in "External Services"
- Include caching, validation, and data transformation processes

**Decision Points & Gateways:**
- MANDATORY: Every workflow MUST have 3-5 exclusive gateways minimum
- User decision points: "Continue?", "Save Changes?", "Confirm Action?"
- System validation points: "Data Valid?", "User Authorized?", "Payment Successful?"
- Error handling points: "Retry?", "Fallback Required?", "Escalate Issue?"
- Gateway names MUST end with "?" and have exactly TWO outgoing flows ("Yes"/"No")

**Process Flow Structure:**
- Use parallel gateways for concurrent operations (async API calls, background processing)
- Add intermediate catch events for system waits, external responses, user notifications
- Include timer events for timeouts, scheduled tasks, reminder notifications
- Use intermediate throw events for error conditions, alerts, notifications

**Element Distribution & Clean Layout:**
- Maximum 4 elements per swimlane to prevent crowding
- Use intermediate events to break long sequences
- Distribute connected elements across different swimlanes
- Include multiple end events for different outcomes (Success, Error, Cancel, Timeout)

**Technical Integration Points:**
- Include authentication flows (login, logout, session management)
- Add data validation and sanitization processes
- Include error logging, monitoring, and alerting flows
- Add backup, recovery, and rollback procedures

**Development Workflow Integration:**
- Include code review processes as approval gateways
- Add CI/CD pipeline stages (build, test, deploy) as sequential tasks
- Include quality gates (linting, testing, security scans) as exclusive gateways
- Add sprint planning and release management processes
- Include environment promotion flows (dev → staging → production)
- Add rollback and hotfix deployment procedures
- Include monitoring and alerting setup processes
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Clean up the response to extract just the JSON
  text = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error("Failed to parse generated JSON:", text);
    throw new Error("Failed to parse generated BPMN structure");
  }
}

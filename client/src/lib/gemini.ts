import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E");

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

**Required Visual Components:**
1. **Executive Dashboard** - Key metrics in card format
2. **System Architecture Diagram** - Visual boxes showing Frontend → API → Database → External Services
3. **User Journey Flow** - Step-by-step flow with arrows and decision points
4. **Technology Stack** - Layered diagram showing tech components
5. **Development Timeline** - Gantt-style timeline with phases
6. **Team Structure** - Organizational chart with roles
7. **CI/CD Pipeline** - Visual pipeline stages
8. **Risk Matrix** - Color-coded risk assessment table

**CSS Requirements:**
- Use flexbox and grid for layouts
- Create boxes with borders, shadows, and colors for components
- Add arrows (→, ↓) and connecting lines between elements
- Include hover effects and transitions
- Responsive design with media queries
- Professional typography and spacing

**Content Structure:**
- Project overview with objectives and scope
- Detailed user flows with decision points
- Complete technical architecture specifications
- Development workflow with Git, testing, CI/CD
- Resource planning and timeline estimates
- Risk assessment and mitigation strategies

Return ONLY the complete HTML document - no explanations or markdown.`;

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

export async function generateBpmnJson(projectPlan: string): Promise<any> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Convert the following comprehensive project plan into a detailed BPMN JSON structure with swimlanes that represents complete user flows and technical architecture. Create workflows that capture:

1. **User Journey Flows**: Map every user interaction, decision point, and system response
2. **Technical Process Flows**: Include API calls, database operations, and system integrations
3. **Business Process Flows**: Capture approval workflows, validation steps, and business logic

CRITICAL REQUIREMENTS:
- Include exclusive gateways for ALL decision points (user choices, validations, approvals, error handling)
- Use parallel gateways for concurrent processes (async operations, multi-user workflows)
- Add intermediate events for system waits, API calls, and external integrations
- Create separate swimlanes for different user roles, system components, and external services
- Include error handling paths and exception flows

Project Plan:
"${projectPlan}"

Return ONLY a valid JSON object in this exact format:
{
  "definitions": {
    "id": "project-workflow",
    "name": "Project Workflow",
    "lastModified": "${new Date().toISOString()}",
    "swimlanes": [
      {
        "id": "Lane_1",
        "name": "Development Team",
        "elements": ["StartEvent_1", "Task_1", "Gateway_1"]
      },
      {
        "id": "Lane_2", 
        "name": "CI/CD Pipeline",
        "elements": ["Task_Build", "Gateway_Tests", "Task_Deploy"]
      },
      {
        "id": "Lane_3",
        "name": "Quality Assurance",
        "elements": ["Task_CodeReview", "Gateway_QualityGate"]
      },
      {
        "id": "Lane_4",
        "name": "DevOps/Infrastructure", 
        "elements": ["Task_EnvSetup", "Task_Monitoring"]
      }
    ],
    "elements": [
      {
        "type": "startEvent",
        "id": "StartEvent_1",
        "name": "Development Sprint Start",
        "lane": "Lane_1"
      },
      {
        "type": "task",
        "id": "Task_1", 
        "name": "Feature Development",
        "lane": "Lane_1"
      },
      {
        "type": "exclusiveGateway",
        "id": "Gateway_1",
        "name": "Code Complete?",
        "lane": "Lane_1"
      },
      {
        "type": "task",
        "id": "Task_CodeReview",
        "name": "Code Review Process",
        "lane": "Lane_3"
      },
      {
        "type": "exclusiveGateway",
        "id": "Gateway_QualityGate",
        "name": "Review Approved?",
        "lane": "Lane_3"
      },
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

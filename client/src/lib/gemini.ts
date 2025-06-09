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
You are a senior business analyst and technical architect. Create a comprehensive project plan for the following project description:

"${projectDescription}"

Generate a detailed project plan that includes:

1. **Project Overview & Business Objectives**
   - Clear problem statement and goals
   - Success metrics and KPIs
   - Stakeholder identification

2. **User Flow Diagrams & Journey Mapping**
   - Complete user journey from start to finish
   - All user roles and their specific workflows
   - Decision points and conditional paths
   - User interactions and touchpoints
   - Error handling and edge cases

3. **Technical Architecture & System Design**
   - Frontend architecture (React components, state management, routing)
   - Backend architecture (APIs, databases, microservices)
   - Database schema and data flow
   - Security architecture (authentication, authorization, encryption)
   - Infrastructure requirements (cloud services, CDN, monitoring)
   - Integration points and third-party services
   - Performance and scalability considerations
   - Technology stack recommendations

4. **Implementation Phases with Detailed Breakdown**
   - Phase-by-phase development approach
   - User stories and acceptance criteria
   - Technical tasks and deliverables
   - Timeline estimates and dependencies

5. **Resource Requirements & Team Structure**
   - Required roles and skill sets
   - Team size and composition
   - Budget considerations

6. **Risk Assessment & Mitigation Strategies**
   - Technical risks and solutions
   - Business risks and contingencies
   - Timeline risks and buffers

7. **Quality Assurance & Testing Strategy**
   - Testing methodologies and frameworks
   - Automated testing approach
   - Performance testing requirements

8. **Deployment & Go-Live Plan**
   - Environment setup and configuration
   - Deployment pipeline and automation
   - Rollback strategies

Format your response with clear headers and detailed sub-sections. Include specific technical details, user interaction flows, and actionable implementation steps.
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
        "name": "Department/Role Name",
        "elements": ["StartEvent_1", "Task_1", "Gateway_1"]
      },
      {
        "id": "Lane_2", 
        "name": "Another Department/Role",
        "elements": ["Task_2", "Gateway_2"]
      }
    ],
    "elements": [
      {
        "type": "startEvent",
        "id": "StartEvent_1",
        "name": "Project Start",
        "lane": "Lane_1"
      },
      {
        "type": "task",
        "id": "Task_1", 
        "name": "Phase/Task Name",
        "lane": "Lane_1"
      },
      {
        "type": "exclusiveGateway",
        "id": "Gateway_1",
        "name": "Approval Required?",
        "lane": "Lane_1"
      },
      {
        "type": "task",
        "id": "Task_Approved",
        "name": "Process Approved Request",
        "lane": "Lane_1"
      },
      {
        "type": "task", 
        "id": "Task_Rejected",
        "name": "Handle Rejection",
        "lane": "Lane_1"
      },
      {
        "type": "task",
        "id": "Task_2", 
        "name": "Another Task",
        "lane": "Lane_2"
      },
      {
        "type": "intermediateCatchEvent",
        "id": "Event_1",
        "name": "Wait for Input",
        "lane": "Lane_2"
      },
      {
        "type": "exclusiveGateway",
        "id": "Gateway_2",
        "name": "Final Check?",
        "lane": "Lane_2"
      },
      {
        "type": "endEvent",
        "id": "EndEvent_1",
        "name": "Project Complete",
        "lane": "Lane_2"
      },
      {
        "type": "endEvent",
        "id": "EndEvent_2",
        "name": "Project Cancelled",
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
        "targetRef": "Task_Approved",
        "name": "Yes",
        "condition": "approved"
      },
      {
        "id": "Flow_4",
        "sourceRef": "Gateway_1",
        "targetRef": "Task_Rejected",
        "name": "No",
        "condition": "rejected"
      },
      {
        "id": "Flow_5",
        "sourceRef": "Task_Approved",
        "targetRef": "Task_2"
      },
      {
        "id": "Flow_6",
        "sourceRef": "Task_Rejected",
        "targetRef": "EndEvent_1"
      },
      {
        "id": "Flow_7",
        "sourceRef": "Task_2",
        "targetRef": "Event_1"
      },
      {
        "id": "Flow_8",
        "sourceRef": "Event_1",
        "targetRef": "Gateway_2"
      },
      {
        "id": "Flow_9",
        "sourceRef": "Gateway_2",
        "targetRef": "EndEvent_1",
        "name": "Approved",
        "condition": "approved"
      },
      {
        "id": "Flow_10",
        "sourceRef": "Gateway_2",
        "targetRef": "EndEvent_2",
        "name": "Rejected",
        "condition": "rejected"
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

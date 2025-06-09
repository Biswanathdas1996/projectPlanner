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
You are a business process analyst. Create a detailed project plan for the following project description:

"${projectDescription}"

Please provide a structured response with:
1. Project Overview (2-3 sentences)
2. Key Phases (3-6 main phases)
3. Major Tasks (under each phase)
4. Dependencies and considerations

Format your response as a clear, structured plan that can be converted into a business process diagram.
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
Convert the following project plan into a BPMN JSON structure with swimlanes. Create a workflow that represents the project phases and tasks as BPMN elements organized by responsible parties or departments.

IMPORTANT: Include exclusive gateways (decision boxes) for any decision points, approvals, quality checks, or yes/no conditions in the workflow. Use parallel gateways for concurrent activities.

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
        "type": "exclusiveGateway",
        "id": "Gateway_1",
        "name": "Decision Point",
        "lane": "Lane_2"
      },
      {
        "type": "endEvent",
        "id": "EndEvent_1",
        "name": "Project Complete",
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
        "targetRef": "EndEvent_1"
      }
    ]
  }
}

Rules:
- Create 2-4 swimlanes based on different departments, roles, or phases
- Use descriptive names for swimlanes (e.g., "Customer", "Sales Team", "Development", "Management")
- EVERY element MUST be assigned to a swimlane - no elements outside swimlanes
- Place tasks in appropriate swimlanes based on who performs them
- MANDATORY: Include exclusive gateways for decision points with conditional flows:
  * Approval processes (Approved? Yes/No)
  * Quality checks (Quality OK? Yes/No)
  * Budget approvals (Budget Approved? Yes/No)
  * Risk assessments (Risk Acceptable? Yes/No)
  * Completion checks (Task Complete? Yes/No)
- For exclusive gateways, create conditional flows with labels like "Yes", "No", "Approved", "Rejected"
- Use parallel gateways for tasks that can happen simultaneously
- Ensure ALL elements are connected in sequence with flows
- Use proper BPMN element types: startEvent, task, exclusiveGateway, parallelGateway, endEvent, userTask, serviceTask
- Every element (except endEvent) must have outgoing flows
- Every element (except startEvent) must have incoming flows
- Generate unique IDs for each element and flow
- Include timer events or intermediate events where appropriate
- Verify each element has a "lane" property matching one of the swimlane IDs
- For workflows with multiple outcomes, use multiple end events (e.g., "Project Approved", "Project Rejected")
- All swimlanes must contain at least one element
- Elements should be logically distributed across swimlanes based on responsibility
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

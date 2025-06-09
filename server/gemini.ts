import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateProjectPlan(req: Request, res: Response) {
  try {
    const { projectDescription } = req.body;
    
    if (!projectDescription || typeof projectDescription !== 'string') {
      return res.status(400).json({ error: 'Project description is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    const text = response.text();

    res.json({ 
      success: true, 
      projectPlan: text 
    });

  } catch (error) {
    console.error('Error generating project plan:', error);
    res.status(500).json({ 
      error: 'Failed to generate project plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function generateBpmnJson(req: Request, res: Response) {
  try {
    const { projectPlan } = req.body;
    
    if (!projectPlan || typeof projectPlan !== 'string') {
      return res.status(400).json({ error: 'Project plan is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Convert the following project plan into a BPMN JSON structure with swimlanes. Create a workflow that represents the project phases and tasks as BPMN elements organized by responsible parties or departments.

CRITICAL REQUIREMENT: EVERY element MUST be assigned to a swimlane category. NO elements can exist outside swimlanes.

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
        "name": "Project Management",
        "elements": ["StartEvent_1", "Task_1"]
      },
      {
        "id": "Lane_2", 
        "name": "Development Team",
        "elements": ["Task_2", "Gateway_1"]
      },
      {
        "id": "Lane_3",
        "name": "Quality Assurance", 
        "elements": ["Task_3", "EndEvent_1"]
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
        "type": "task",
        "id": "Task_2", 
        "name": "Implementation Task",
        "lane": "Lane_2"
      },
      {
        "type": "exclusiveGateway",
        "id": "Gateway_1",
        "name": "Quality Check?",
        "lane": "Lane_2"
      },
      {
        "type": "task",
        "id": "Task_3", 
        "name": "Testing & Validation",
        "lane": "Lane_3"
      },
      {
        "type": "endEvent",
        "id": "EndEvent_1",
        "name": "Project Complete",
        "lane": "Lane_3"
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
        "targetRef": "Task_2"
      },
      {
        "id": "Flow_3",
        "sourceRef": "Task_2",
        "targetRef": "Gateway_1"
      },
      {
        "id": "Flow_4",
        "sourceRef": "Gateway_1",
        "targetRef": "Task_3",
        "name": "Approved"
      },
      {
        "id": "Flow_5",
        "sourceRef": "Task_3",
        "targetRef": "EndEvent_1"
      }
    ]
  }
}

MANDATORY CATEGORIZATION RULES:
- Create 3-5 swimlanes based on different roles, departments, or project phases
- Use role-based names: "Project Management", "Development Team", "Quality Assurance", "Client/Stakeholder", "Management Approval"
- EVERY element MUST have a "lane" property matching a swimlane ID
- Each swimlane MUST contain at least 2 elements
- Distribute elements logically:
  * Planning/initiation → "Project Management" 
  * Development/implementation → "Development Team"
  * Testing/validation → "Quality Assurance"
  * Approvals/decisions → "Management Approval"
  * Client interactions → "Client/Stakeholder"
- Include exclusive gateways for decision points with "?" in names
- Balance element distribution across swimlanes
- Use proper BPMN element types: startEvent, task, exclusiveGateway, parallelGateway, endEvent, userTask, serviceTask
- Ensure all flows connect elements properly
- Generate unique IDs for each element and flow
- Verify no element exists without lane assignment
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response to extract just the JSON
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const bpmnJson = JSON.parse(text);
      res.json({ 
        success: true, 
        bpmnJson 
      });
    } catch (parseError) {
      console.error('Failed to parse generated JSON:', text);
      res.status(500).json({ 
        error: 'Failed to parse generated BPMN structure',
        rawResponse: text
      });
    }

  } catch (error) {
    console.error('Error generating BPMN JSON:', error);
    res.status(500).json({ 
      error: 'Failed to generate BPMN structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
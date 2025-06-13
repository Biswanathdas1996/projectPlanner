import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateProjectPlan(req: Request, res: Response) {
  try {
    const { projectDescription, description } = req.body;
    const content = projectDescription || description;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Project description is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a business process analyst. Create a detailed project plan for the following project description:

"${content}"

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
      projectPlan: text,
    });
  } catch (error) {
    console.error("Error generating project plan:", error);
    res.status(500).json({
      error: "Failed to generate project plan",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function generateBpmnJson(req: Request, res: Response) {
  try {
    const { projectPlan } = req.body;

    if (!projectPlan || typeof projectPlan !== "string") {
      return res.status(400).json({ error: "Project plan is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Convert the following project plan into a BPMN JSON structure. Create a workflow that represents the project phases and tasks as BPMN elements.

Project Plan:
"${projectPlan}"

Return ONLY a valid JSON object in this exact format:
{
  "definitions": {
    "id": "project-workflow",
    "name": "Project Workflow",
    "lastModified": "${new Date().toISOString()}",
    "elements": [
      {
        "type": "startEvent",
        "id": "StartEvent_1",
        "name": "Project Start"
      },
      {
        "type": "task",
        "id": "Task_1", 
        "name": "Phase/Task Name"
      },
      {
        "type": "exclusiveGateway",
        "id": "Gateway_1",
        "name": "Decision Point"
      },
      {
        "type": "endEvent",
        "id": "EndEvent_1",
        "name": "Project Complete"
      }
    ],
    "flows": [
      {
        "id": "Flow_1",
        "sourceRef": "StartEvent_1",
        "targetRef": "Task_1"
      }
    ]
  }
}

Rules:
- Use descriptive names for tasks based on the project phases
- Include decision points as gateways where appropriate
- Create a logical flow from start to end
- Use proper BPMN element types: startEvent, task, exclusiveGateway, endEvent
- Ensure all flows connect elements properly
- Generate unique IDs for each element
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
      const bpmnJson = JSON.parse(text);
      res.json({
        success: true,
        bpmnJson,
      });
    } catch (parseError) {
      console.error("Failed to parse generated JSON:", text);
      res.status(500).json({
        error: "Failed to parse generated BPMN structure",
        rawResponse: text,
      });
    }
  } catch (error) {
    console.error("Error generating BPMN JSON:", error);
    res.status(500).json({
      error: "Failed to generate BPMN structure",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// BPMN generation moved to client-side only

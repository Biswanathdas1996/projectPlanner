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

export async function generateBpmnXml(req: Request, res: Response) {
  try {
    const { projectPlan, stakeholder, flowType, customPrompt } = req.body;
    
    if (!projectPlan || typeof projectPlan !== 'string') {
      return res.status(400).json({ error: 'Project plan is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Generate a BPMN 2.0 XML swimlane diagram based on this specification:

${projectPlan}

Create a BPMN 2.0 XML with proper swimlane structure including:
- Participant pools for different actors/systems
- Process flows with start events, service tasks, and end events
- Proper BPMN 2.0 XML namespace declarations
- Valid diagram interchange (DI) elements for visual layout
- Sequence flows connecting all elements

Requirements:
- Return ONLY valid BPMN 2.0 XML
- No markdown formatting or explanations
- Include proper xmlns declarations
- Use collaboration with participant pools for swimlanes
- Include bpmndi:BPMNDiagram for visual layout

Example structure:
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="${stakeholder || 'Stakeholder'}" processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1" isExecutable="true">
    <!-- Process elements here -->
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <!-- Diagram elements here -->
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response to extract XML
    text = text.replace(/```xml\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Validate it starts with XML declaration or BPMN element
    if (!text.startsWith('<?xml') && !text.startsWith('<bpmn')) {
      console.error('Invalid BPMN XML response:', text);
      // Return a minimal fallback BPMN
      text = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="${stakeholder || 'Stakeholder'}" processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start ${flowType || 'Process'}" />
    <bpmn:serviceTask id="Activity_1" name="Process Task" />
    <bpmn:endEvent id="EndEvent_1" name="End ${flowType || 'Process'}" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Activity_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Activity_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
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
</bpmn:definitions>`;
    }

    // Return XML as plain text
    res.setHeader('Content-Type', 'application/xml');
    res.send(text);

  } catch (error) {
    console.error('Error generating BPMN XML:', error);
    res.status(500).json({ 
      error: 'Failed to generate BPMN XML',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
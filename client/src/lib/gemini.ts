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

export async function generateBpmnXml(projectPlan: string): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Convert the following project plan into a BPMN 2.0 XML document with swimlanes. Focus on creating a realistic workflow that BPMN.js can properly render.

Project Plan:
"${projectPlan}"

CRITICAL: Generate ONLY valid BPMN 2.0 XML that follows this EXACT structure for BPMN.js compatibility:

<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" 
  id="Definitions_1" 
  targetNamespace="http://bpmn.io/schema/bpmn">
  
  <bpmn2:collaboration id="Collaboration_1">
    <bpmn2:participant id="Participant_User" name="User" processRef="Process_User" />
    <bpmn2:participant id="Participant_System" name="System" processRef="Process_System" />
    <bpmn2:participant id="Participant_Backend" name="Backend" processRef="Process_Backend" />
  </bpmn2:collaboration>

  <bpmn2:process id="Process_User" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1" name="Start">
      <bpmn2:outgoing>Flow_1</bpmn2:outgoing>
    </bpmn2:startEvent>
    <bpmn2:userTask id="UserTask_1" name="User Action">
      <bpmn2:incoming>Flow_1</bpmn2:incoming>
      <bpmn2:outgoing>Flow_2</bpmn2:outgoing>
    </bpmn2:userTask>
    <bpmn2:endEvent id="EndEvent_1" name="End">
      <bpmn2:incoming>Flow_2</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="UserTask_1" />
    <bpmn2:sequenceFlow id="Flow_2" sourceRef="UserTask_1" targetRef="EndEvent_1" />
  </bpmn2:process>

  <bpmn2:process id="Process_System" isExecutable="false">
    <bpmn2:serviceTask id="ServiceTask_1" name="System Process">
      <bpmn2:incoming>MessageFlow_1</bpmn2:incoming>
      <bpmn2:outgoing>MessageFlow_2</bpmn2:outgoing>
    </bpmn2:serviceTask>
  </bpmn2:process>

  <bpmn2:process id="Process_Backend" isExecutable="false">
    <bpmn2:serviceTask id="ServiceTask_2" name="Backend Process">
      <bpmn2:incoming>MessageFlow_3</bpmn2:incoming>
      <bpmn2:outgoing>MessageFlow_4</bpmn2:outgoing>
    </bpmn2:serviceTask>
  </bpmn2:process>

  <bpmn2:messageFlow id="MessageFlow_1" sourceRef="UserTask_1" targetRef="ServiceTask_1" />
  <bpmn2:messageFlow id="MessageFlow_2" sourceRef="ServiceTask_1" targetRef="UserTask_1" />
  <bpmn2:messageFlow id="MessageFlow_3" sourceRef="ServiceTask_1" targetRef="ServiceTask_2" />
  <bpmn2:messageFlow id="MessageFlow_4" sourceRef="ServiceTask_2" targetRef="ServiceTask_1" />

  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_User_di" bpmnElement="Participant_User" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="600" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Participant_System_di" bpmnElement="Participant_System" isHorizontal="true">
        <dc:Bounds x="160" y="350" width="600" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Participant_Backend_di" bpmnElement="Participant_Backend" isHorizontal="true">
        <dc:Bounds x="160" y="620" width="600" height="250" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="232" y="162" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="UserTask_1_di" bpmnElement="UserTask_1">
        <dc:Bounds x="320" y="140" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="472" y="162" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="ServiceTask_1_di" bpmnElement="ServiceTask_1">
        <dc:Bounds x="320" y="410" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="ServiceTask_2_di" bpmnElement="ServiceTask_2">
        <dc:Bounds x="320" y="680" width="100" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="268" y="180" />
        <di:waypoint x="320" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="420" y="180" />
        <di:waypoint x="472" y="180" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="MessageFlow_1_di" bpmnElement="MessageFlow_1">
        <di:waypoint x="370" y="220" />
        <di:waypoint x="370" y="410" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="MessageFlow_2_di" bpmnElement="MessageFlow_2">
        <di:waypoint x="390" y="410" />
        <di:waypoint x="390" y="220" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="MessageFlow_3_di" bpmnElement="MessageFlow_3">
        <di:waypoint x="370" y="490" />
        <di:waypoint x="370" y="680" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="MessageFlow_4_di" bpmnElement="MessageFlow_4">
        <di:waypoint x="390" y="680" />
        <di:waypoint x="390" y="490" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>

REQUIREMENTS:
1. Use EXACTLY the namespace prefixes shown: bpmn2:, bpmndi:, dc:, di:
2. Include collaboration with 3-5 participants (swimlanes)
3. Add 8-15 process elements: start events, user tasks, service tasks, gateways, end events
4. Connect elements with sequence flows and message flows
5. Include complete visual layout with proper coordinates
6. Base element names and flow on the actual project plan content
7. Ensure all IDs are unique and properly referenced

Generate realistic workflow elements based on the project plan content, not generic placeholders.`;

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
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY ||
    "AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM"
);

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
- Integration capabilities (APIs, third-party services)
- Performance optimizations and scalability improvements
- Security enhancements and data protection measures

2. **User Experience Improvements**
- Interface design and usability enhancements
- Accessibility features and mobile responsiveness
- Personalization and customization options

3. **Business Value Additions**
- Analytics and reporting capabilities
- Workflow automation and efficiency improvements
- Revenue generation or cost reduction opportunities

4. **Innovation & Future-Proofing**
- Emerging technology integration (AI, ML, IoT)
- Platform extensibility and modularity
- Future expansion possibilities

FORMAT: Return only a JSON array of suggestion strings, no markdown or explanations.
EXAMPLE: ["Implement real-time notifications", "Add advanced search filters", "Integrate payment processing"]

Each suggestion should be:
- Specific and actionable
- Directly relevant to the project
- Value-driven for users or business
- Technically feasible`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Clean up the response
  text = text.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  }
  if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  try {
    const suggestions = JSON.parse(text);
    if (Array.isArray(suggestions)) {
      return suggestions.filter(
        (s) => typeof s === "string" && s.trim().length > 0
      );
    }
    throw new Error("Response is not an array");
  } catch (parseError) {
    console.error("Failed to parse suggestions:", text);
    // Return fallback suggestions based on project description
    return [
      "Implement user authentication and authorization",
      "Add real-time data synchronization",
      "Create comprehensive reporting dashboard",
      "Integrate third-party APIs for enhanced functionality",
      "Implement advanced search and filtering capabilities",
    ];
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
      maxOutputTokens: 4096,
    },
  });

  const prompt = `Create a comprehensive project plan for: "${projectDescription}"

Generate a detailed HTML document with embedded CSS styling that includes:

1. **Executive Summary**
2. **Technical Architecture**
3. **Feature Specifications**
4. **Development Timeline**
5. **User Experience Design**
6. **Testing Strategy**
7. **Deployment Plan**
8. **Risk Management**
9. **Stakeholder Analysis**
10. **Success Metrics**

Use professional HTML formatting with:
- Clean, modern CSS styling
- Responsive design principles
- Professional color scheme
- Clear typography hierarchy
- Interactive elements where appropriate

Return only the complete HTML document with embedded CSS.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Clean up the response
  text = text.trim();
  if (text.startsWith("```html")) {
    text = text.replace(/^```html\s*/, "").replace(/```\s*$/, "");
  }
  if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  return text;
}

export async function generateProjectPlanLegacy(
  projectDescription: string
): Promise<string> {
  return generateProjectPlan(projectDescription);
}

export async function generateBpmnJson(projectPlan: string): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.3,
      topK: 30,
      topP: 0.8,
      maxOutputTokens: 3072,
    },
  });

  const prompt = `Based on this project plan, generate a comprehensive BPMN workflow structure in JSON format:

${projectPlan}

Create a detailed BPMN workflow that includes:
- Multiple swimlanes for different roles/systems
- User tasks, service tasks, and decision gateways
- Start and end events
- Sequence flows connecting all elements
- Realistic process flow for the project

Return ONLY valid JSON in this exact structure:
{
  "name": "Project Workflow",
  "description": "Main project workflow description",
  "lanes": [
    {
      "id": "lane1",
      "name": "Lane Name",
      "elements": ["element1", "element2"]
    }
  ],
  "elements": [
    {
      "id": "element1",
      "type": "startEvent|userTask|serviceTask|exclusiveGateway|endEvent",
      "name": "Element Name",
      "lane": "lane1"
    }
  ],
  "flows": [
    {
      "id": "flow1",
      "sourceRef": "element1",
      "targetRef": "element2",
      "name": "Flow Name"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Clean up the response
  text = text.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  }
  if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  try {
    // Validate that it's valid JSON
    JSON.parse(text);
    return text;
  } catch (parseError) {
    console.error("Failed to parse generated JSON:", text);
    throw new Error("Failed to parse generated BPMN structure");
  }
}

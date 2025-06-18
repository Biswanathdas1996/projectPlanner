import { GoogleGenerativeAI } from "@google/generative-ai";

export interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string };
  type?: string;
  style?: any;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: any;
}

export interface FlowDiagramData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowDetails {
  processDescription: string;
  participants: string[];
  trigger: string;
  activities: string[];
  decisionPoints: string[];
  endEvent: string;
  additionalElements: string[];
}

export class AIFlowDiagramGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = "AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM";
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateFlowDiagram(
    flowDetails: FlowDetails,
    stakeholder: string,
    flowType: string
  ): Promise<FlowDiagramData> {
    try {
      const prompt = this.buildFlowDiagramPrompt(flowDetails, stakeholder, flowType);
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      return this.parseFlowDiagramResponse(response);
    } catch (error) {
      console.error("Error generating flow diagram:", error);
      throw new Error("Failed to generate flow diagram");
    }
  }

  private buildFlowDiagramPrompt(
    flowDetails: FlowDetails,
    stakeholder: string,
    flowType: string
  ): string {
    return `Generate a ReactFlow diagram JSON structure for the following workflow:

**Stakeholder:** ${stakeholder}
**Flow Type:** ${flowType}
**Process Description:** ${flowDetails.processDescription}
**Trigger:** ${flowDetails.trigger}
**Participants:** ${flowDetails.participants.join(", ")}
**Activities:** ${flowDetails.activities.join(", ")}
**Decision Points:** ${flowDetails.decisionPoints.join(", ")}
**End Event:** ${flowDetails.endEvent}
**Additional Elements:** ${flowDetails.additionalElements.join(", ")}

Create a ReactFlow diagram with the following requirements:

1. **Start Node**: Create a start node for the trigger
2. **Activity Nodes**: Create nodes for each activity
3. **Decision Nodes**: Create diamond-shaped decision nodes for decision points
4. **End Node**: Create an end node for the end event
5. **Participant Swimlanes**: Group nodes by participants using different colors/styles
6. **Proper Layout**: Arrange nodes in a logical flow from left to right or top to bottom
7. **Connections**: Connect nodes with edges showing the flow sequence

**Node Types:**
- 'input' for start nodes (green background)
- 'default' for activity nodes (blue background)
- 'output' for end nodes (red background)
- Custom decision nodes (yellow/orange background)

**Layout Guidelines:**
- Start at position (50, 50)
- Space nodes 200px apart horizontally and 150px apart vertically
- Use different Y positions for different participants (swimlanes)
- Make decision nodes diamond-shaped with appropriate styling

**Response Format:**
Return ONLY a valid JSON object with this exact structure:
{
  "nodes": [
    {
      "id": "node-1",
      "position": { "x": 50, "y": 50 },
      "data": { "label": "Start: [trigger description]" },
      "type": "input",
      "style": { "backgroundColor": "#10B981", "color": "white", "border": "2px solid #059669" }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "animated": true
    }
  ]
}

Generate a comprehensive flow with proper positioning and styling for all elements.`;
  }

  private parseFlowDiagramResponse(response: string): FlowDiagramData {
    try {
      console.log("Raw AI response:", response);
      
      // Clean the response to extract JSON
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }
      
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response");
        throw new Error("No JSON found in response");
      }

      const jsonString = jsonMatch[0];
      console.log("Extracted JSON string:", jsonString);
      
      const flowData = JSON.parse(jsonString);
      console.log("Parsed flow data:", flowData);

      // Validate the structure
      if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
        console.error("Invalid nodes structure:", flowData.nodes);
        throw new Error("Invalid nodes structure");
      }
      if (!flowData.edges || !Array.isArray(flowData.edges)) {
        console.error("Invalid edges structure:", flowData.edges);
        throw new Error("Invalid edges structure");
      }

      console.log("Successfully parsed flow diagram with", flowData.nodes.length, "nodes and", flowData.edges.length, "edges");
      return flowData as FlowDiagramData;
    } catch (error) {
      console.error("Error parsing flow diagram response:", error);
      console.log("Using fallback diagram");
      // Return a fallback structure
      return this.createFallbackDiagram();
    }
  }

  private createFallbackDiagram(): FlowDiagramData {
    console.log("Creating fallback diagram");
    const fallbackData = {
      nodes: [
        {
          id: "start",
          position: { x: 100, y: 100 },
          data: { label: "Start Process" },
          type: "input",
          style: { 
            backgroundColor: "#10B981", 
            color: "white", 
            border: "2px solid #059669",
            borderRadius: "8px",
            padding: "10px",
            minWidth: "120px"
          }
        },
        {
          id: "activity-1",
          position: { x: 300, y: 100 },
          data: { label: "Process Activity" },
          style: { 
            backgroundColor: "#3B82F6", 
            color: "white", 
            border: "2px solid #1D4ED8",
            borderRadius: "8px",
            padding: "10px",
            minWidth: "120px"
          }
        },
        {
          id: "end",
          position: { x: 500, y: 100 },
          data: { label: "End Process" },
          type: "output",
          style: { 
            backgroundColor: "#EF4444", 
            color: "white", 
            border: "2px solid #DC2626",
            borderRadius: "8px",
            padding: "10px",
            minWidth: "120px"
          }
        }
      ],
      edges: [
        {
          id: "edge-1",
          source: "start",
          target: "activity-1",
          animated: true,
          style: { stroke: "#6B7280", strokeWidth: 2 }
        },
        {
          id: "edge-2",
          source: "activity-1",
          target: "end",
          animated: true,
          style: { stroke: "#6B7280", strokeWidth: 2 }
        }
      ]
    };
    console.log("Fallback diagram created:", fallbackData);
    return fallbackData;
  }
}

export function createAIFlowDiagramGenerator(): AIFlowDiagramGenerator {
  return new AIFlowDiagramGenerator();
}
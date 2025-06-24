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
    const apiKey = "AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg";
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });
  }

  async generateFlowDiagram(
    flowDetails: any,
    stakeholder: string,
    flowType: string
  ): Promise<FlowDiagramData> {
    try {
      const prompt = this.buildFlowDiagramPrompt(
        flowDetails,
        stakeholder,
        flowType
      );
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return this.parseFlowDiagramResponse(response);
    } catch (error) {
      console.error("Error generating flow diagram:", error);
      throw new Error("Failed to generate flow diagram");
    }
  }

  private buildFlowDiagramPrompt(
    flowDetails: any,
    stakeholder: string,
    flowType: string
  ): string {
    // Compose a detailed prompt using the provided flow details, stakeholder, and flow type.
    return `
  Generate a ReactFlow diagram JSON structure for a stakeholder-specific user journey.

**Flow Focus:** User Journey Mapping for Multiple Stakeholder Types
**Process Description:** ${flowDetails.processDescription}
**Flow Details:** ${flowDetails}

## LAYOUT REQUIREMENTS:
- **Stakeholder Swim Lanes**: Arrange in 4-6 horizontal swimlanes by user type
- **User Journey Flow**: Show  all progression from discovery to goal completion
- **Alternative Paths**: Include different user pathways and choice branches
- **Decision Points**: Show user decision moments with clear outcomes
- **Support Touch points**: Include help, feedback, and assistance points
  Requirements:
  - Generate a user journey flow for the stakeholder "${stakeholder}" based on the process description and activities.
  - Include all relevant activities, decision points, and support elements for this stakeholder.
  - Use 25-35 nodes to represent the complete journey from discovery to completion.
  - Position nodes in swimlanes or layers according to user journey stages (discovery, onboarding, core, advanced, support, completion).
  - Style nodes according to their type (see below).
  - Edges should clearly show the flow, alternative paths, and decision outcomes.

  ## NODE SPECIFICATIONS:
- **Discovery Nodes**: Green (#10B981) for user entry points
- **Onboarding Nodes**: Blue (#3B82F6) for registration/setup processes
- **Core Activity Nodes**: Indigo (#4F46E5) for main user tasks
- **Feature Nodes**: Purple (#8B5CF6) for specific functionality
- **Decision Nodes**: Amber (#F59E0B) for user choice points
- **Support Nodes**: Cyan (#06B6D4) for help and assistance
- **Premium Nodes**: Emerald (#059669) for paid features
- **Completion Nodes**: Gray (#6B7280) for successful outcomes

** Node Text color must be white 

 
  ## POSITIONING:
  - Discovery Layer: Y = 50-150 (app discovery, landing page)
  - Onboarding Layer: Y = 200-300 (registration, setup)
  - Core Usage Layer: Y = 350-500 (main features, daily tasks)
  - Advanced Features Layer: Y = 550-650 (premium, power user features)
  - Support/Exit Layer: Y = 700-800 (help, completion, feedback)
  - X spacing: 200px between stakeholder paths
  - Create separate horizontal flows for each stakeholder type
  
  ## EDGE REQUIREMENTS:
  - Primary user flow edges: solid lines
  - Alternative path edges: dashed lines
  - Decision outcome edges: labeled with user choices
  - Support flow edges: animated blue lines
  - Premium upgrade edges: thick green lines
  - User feedback edges: dotted lines
  - Include clear labels for user decision outcomes
  
  Generate a JSON object with 'nodes' and 'edges' arrays showing STAKEHOLDER-SPECIFIC USER JOURNEYS.
  Each node must represent a user action, decision point, or interface touchpoint.
  
  CRITICAL: Generate 25-35 detailed nodes representing COMPLETE USER JOURNEYS for different stakeholder types showing their step-by-step progression through the application.
  
  **CRITICAL: Response Format Requirements:**
  Return ONLY a valid JSON object. Do NOT include any extra properties beyond these allowed fields:
  All the interactions should be joined 
  
  For nodes, ONLY use these properties:
  - id (string, required)
  - position (object with x, y numbers, required)
  - data (object with label string, required)
  - type (string, optional: "input", "output", "default")
  - style (object, optional)
  
  For edges, ONLY use these properties:
  - id (string, required)
  - source (string, required)
  - target (string, required)
  - animated (boolean, optional)
  - style (object, optional)
  
  DO NOT ADD: description, or any other custom properties.
  All the participant name should be visible
  Example structure:
  {
    "nodes": [
      {
        "id": "node-1",
        "position": { "x": 50, "y": 50 },
        "data": { "label": "Start: User submits form" },
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
  
  Generate the full flow diagram JSON for the "${stakeholder}" user journey.
  `;
  }

  private parseFlowDiagramResponse(response: string): FlowDiagramData {
    try {
      console.log("Raw AI response:", response);

      // Clean the response to extract JSON
      let cleanedResponse = response.trim();

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/, "")
          .replace(/```\s*$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse
          .replace(/^```\s*/, "")
          .replace(/```\s*$/, "");
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

      // Clean up nodes - remove non-ReactFlow properties
      const cleanedNodes = flowData.nodes.map((node: any) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: node.data || { label: "Node" },
        type: node.type,
        style: node.style,
      }));

      // Clean up edges - ensure all required properties are present
      const cleanedEdges = flowData.edges.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.animated || false,
        style: edge.style,
      }));

      const cleanedFlowData = {
        nodes: cleanedNodes,
        edges: cleanedEdges,
      };

      console.log(
        "Successfully parsed and cleaned flow diagram with",
        cleanedNodes.length,
        "nodes and",
        cleanedEdges.length,
        "edges"
      );
      return cleanedFlowData as FlowDiagramData;
    } catch (error) {
      console.error("Error parsing flow diagram response:", error);
      console.log("Using fallback diagram");
      // Return a fallback structure
      return this.createFallbackDiagram();
    }
  }

  private createFallbackDiagram(): FlowDiagramData {
    console.log("Creating comprehensive enterprise fallback diagram");

    return {
      nodes: [
        {
          id: "node-1",
          position: { x: 50, y: 50 },
          data: { label: "Start: Enterprise Request" },
          type: "input",
          style: {
            backgroundColor: "#10B981",
            color: "white",
            border: "3px solid #059669",
          },
        },
        {
          id: "node-2",
          position: { x: 250, y: 50 },
          data: { label: "Identity Provider" },
          type: "default",
          style: {
            backgroundColor: "#8B5CF6",
            color: "white",
            border: "2px solid #7C3AED",
          },
        },
        {
          id: "node-3",
          position: { x: 450, y: 50 },
          data: { label: "MFA Gateway" },
          type: "default",
          style: {
            backgroundColor: "#8B5CF6",
            color: "white",
            border: "2px solid #7C3AED",
          },
        },
        {
          id: "node-4",
          position: { x: 650, y: 50 },
          data: { label: "RBAC Engine" },
          type: "default",
          style: {
            backgroundColor: "#8B5CF6",
            color: "white",
            border: "2px solid #7C3AED",
          },
        },
        {
          id: "node-5",
          position: { x: 850, y: 50 },
          data: { label: "Auth Decision?" },
          type: "default",
          style: {
            backgroundColor: "#F59E0B",
            color: "white",
            borderRadius: "50%",
          },
        },
        {
          id: "node-6",
          position: { x: 1050, y: 50 },
          data: { label: "Security Token Service" },
          type: "default",
          style: {
            backgroundColor: "#8B5CF6",
            color: "white",
            border: "2px solid #7C3AED",
          },
        },
        {
          id: "node-7",
          position: { x: 50, y: 250 },
          data: { label: "API Gateway" },
          type: "default",
          style: {
            backgroundColor: "#3B82F6",
            color: "white",
            border: "2px solid #2563EB",
          },
        },
        {
          id: "node-8",
          position: { x: 250, y: 250 },
          data: { label: "Load Balancer" },
          type: "default",
          style: {
            backgroundColor: "#3B82F6",
            color: "white",
            border: "2px solid #2563EB",
          },
        },
        {
          id: "node-9",
          position: { x: 450, y: 250 },
          data: { label: "Service Discovery" },
          type: "default",
          style: {
            backgroundColor: "#3B82F6",
            color: "white",
            border: "2px solid #2563EB",
          },
        },
        {
          id: "node-10",
          position: { x: 650, y: 250 },
          data: { label: "Circuit Breaker" },
          type: "default",
          style: {
            backgroundColor: "#3B82F6",
            color: "white",
            border: "2px solid #2563EB",
          },
        },
        {
          id: "node-11",
          position: { x: 850, y: 250 },
          data: { label: "Rate Limiter" },
          type: "default",
          style: {
            backgroundColor: "#3B82F6",
            color: "white",
            border: "2px solid #2563EB",
          },
        },
        {
          id: "node-12",
          position: { x: 1050, y: 250 },
          data: { label: "Service Mesh" },
          type: "default",
          style: {
            backgroundColor: "#3B82F6",
            color: "white",
            border: "2px solid #2563EB",
          },
        },
        {
          id: "node-13",
          position: { x: 50, y: 450 },
          data: { label: "Business Rule Engine" },
          type: "default",
          style: {
            backgroundColor: "#4F46E5",
            color: "white",
            border: "2px solid #4338CA",
          },
        },
        {
          id: "node-14",
          position: { x: 250, y: 450 },
          data: { label: "Workflow Orchestrator" },
          type: "default",
          style: {
            backgroundColor: "#4F46E5",
            color: "white",
            border: "2px solid #4338CA",
          },
        },
        {
          id: "node-15",
          position: { x: 450, y: 450 },
          data: { label: "State Machine" },
          type: "default",
          style: {
            backgroundColor: "#4F46E5",
            color: "white",
            border: "2px solid #4338CA",
          },
        },
        {
          id: "node-16",
          position: { x: 650, y: 450 },
          data: { label: "Decision Matrix" },
          type: "default",
          style: {
            backgroundColor: "#F59E0B",
            color: "white",
            borderRadius: "50%",
          },
        },
        {
          id: "node-17",
          position: { x: 850, y: 450 },
          data: { label: "Approval Chain" },
          type: "default",
          style: {
            backgroundColor: "#4F46E5",
            color: "white",
            border: "2px solid #4338CA",
          },
        },
        {
          id: "node-18",
          position: { x: 1050, y: 450 },
          data: { label: "Document Processor" },
          type: "default",
          style: {
            backgroundColor: "#4F46E5",
            color: "white",
            border: "2px solid #4338CA",
          },
        },
        {
          id: "node-19",
          position: { x: 50, y: 650 },
          data: { label: "Primary Database" },
          type: "default",
          style: {
            backgroundColor: "#059669",
            color: "white",
            border: "2px solid #047857",
          },
        },
        {
          id: "node-20",
          position: { x: 250, y: 650 },
          data: { label: "Read Replica" },
          type: "default",
          style: {
            backgroundColor: "#059669",
            color: "white",
            border: "2px solid #047857",
          },
        },
        {
          id: "node-21",
          position: { x: 450, y: 650 },
          data: { label: "Data Warehouse" },
          type: "default",
          style: {
            backgroundColor: "#059669",
            color: "white",
            border: "2px solid #047857",
          },
        },
        {
          id: "node-22",
          position: { x: 650, y: 650 },
          data: { label: "Search Index" },
          type: "default",
          style: {
            backgroundColor: "#059669",
            color: "white",
            border: "2px solid #047857",
          },
        },
        {
          id: "node-23",
          position: { x: 850, y: 650 },
          data: { label: "File Storage" },
          type: "default",
          style: {
            backgroundColor: "#059669",
            color: "white",
            border: "2px solid #047857",
          },
        },
        {
          id: "node-24",
          position: { x: 1050, y: 650 },
          data: { label: "Backup Service" },
          type: "default",
          style: {
            backgroundColor: "#059669",
            color: "white",
            border: "2px solid #047857",
          },
        },
        {
          id: "node-25",
          position: { x: 250, y: 850 },
          data: { label: "Payment Gateway" },
          type: "default",
          style: {
            backgroundColor: "#06B6D4",
            color: "white",
            border: "2px solid #0891B2",
          },
        },
        {
          id: "node-26",
          position: { x: 450, y: 850 },
          data: { label: "Third-party APIs" },
          type: "default",
          style: {
            backgroundColor: "#06B6D4",
            color: "white",
            border: "2px solid #0891B2",
          },
        },
        {
          id: "node-27",
          position: { x: 650, y: 850 },
          data: { label: "Partner Systems" },
          type: "default",
          style: {
            backgroundColor: "#06B6D4",
            color: "white",
            border: "2px solid #0891B2",
          },
        },
        {
          id: "node-28",
          position: { x: 50, y: 1050 },
          data: { label: "Health Monitor" },
          type: "default",
          style: {
            backgroundColor: "#EA580C",
            color: "white",
            border: "2px solid #DC2626",
          },
        },
        {
          id: "node-29",
          position: { x: 250, y: 1050 },
          data: { label: "Metrics Collector" },
          type: "default",
          style: {
            backgroundColor: "#EA580C",
            color: "white",
            border: "2px solid #DC2626",
          },
        },
        {
          id: "node-30",
          position: { x: 450, y: 1050 },
          data: { label: "Log Aggregator" },
          type: "default",
          style: {
            backgroundColor: "#EA580C",
            color: "white",
            border: "2px solid #DC2626",
          },
        },
        {
          id: "node-31",
          position: { x: 650, y: 1050 },
          data: { label: "Alert Manager" },
          type: "default",
          style: {
            backgroundColor: "#EA580C",
            color: "white",
            border: "2px solid #DC2626",
          },
        },
        {
          id: "node-32",
          position: { x: 850, y: 1050 },
          data: { label: "Performance Monitor" },
          type: "default",
          style: {
            backgroundColor: "#EA580C",
            color: "white",
            border: "2px solid #DC2626",
          },
        },
        {
          id: "node-33",
          position: { x: 1050, y: 1050 },
          data: { label: "Error Tracker" },
          type: "default",
          style: {
            backgroundColor: "#DC2626",
            color: "white",
            border: "2px solid #B91C1C",
          },
        },
        {
          id: "node-34",
          position: { x: 850, y: 1250 },
          data: { label: "Success Completion" },
          type: "output",
          style: {
            backgroundColor: "#6B7280",
            color: "white",
            border: "2px solid #4B5563",
          },
        },
        {
          id: "node-35",
          position: { x: 1150, y: 200 },
          data: { label: "Auth Failure" },
          type: "output",
          style: {
            backgroundColor: "#DC2626",
            color: "white",
            border: "2px solid #B91C1C",
          },
        },
      ],
      edges: [
        { id: "edge-1", source: "node-1", target: "node-2", animated: false },
        { id: "edge-2", source: "node-2", target: "node-3", animated: false },
        { id: "edge-3", source: "node-3", target: "node-4", animated: false },
        { id: "edge-4", source: "node-4", target: "node-5", animated: false },
        {
          id: "edge-5",
          source: "node-5",
          target: "node-6",
          animated: true,
          label: "Success",
        },
        {
          id: "edge-6",
          source: "node-5",
          target: "node-35",
          animated: true,
          label: "Failure",
          style: { stroke: "#DC2626", strokeDasharray: "5,5" },
        },
        { id: "edge-7", source: "node-6", target: "node-7", animated: false },
        { id: "edge-8", source: "node-7", target: "node-8", animated: false },
        { id: "edge-9", source: "node-8", target: "node-9", animated: false },
        { id: "edge-10", source: "node-9", target: "node-10", animated: false },
        {
          id: "edge-11",
          source: "node-10",
          target: "node-11",
          animated: false,
        },
        {
          id: "edge-12",
          source: "node-11",
          target: "node-12",
          animated: false,
        },
        {
          id: "edge-13",
          source: "node-12",
          target: "node-13",
          animated: false,
        },
        {
          id: "edge-14",
          source: "node-13",
          target: "node-14",
          animated: false,
        },
        {
          id: "edge-15",
          source: "node-14",
          target: "node-15",
          animated: false,
        },
        {
          id: "edge-16",
          source: "node-15",
          target: "node-16",
          animated: false,
        },
        {
          id: "edge-17",
          source: "node-16",
          target: "node-17",
          animated: true,
          label: "Approved",
        },
        {
          id: "edge-18",
          source: "node-17",
          target: "node-18",
          animated: false,
        },
        {
          id: "edge-19",
          source: "node-18",
          target: "node-19",
          animated: false,
        },
        {
          id: "edge-20",
          source: "node-19",
          target: "node-20",
          animated: false,
        },
        {
          id: "edge-21",
          source: "node-19",
          target: "node-21",
          animated: false,
        },
        {
          id: "edge-22",
          source: "node-21",
          target: "node-22",
          animated: false,
        },
        {
          id: "edge-23",
          source: "node-19",
          target: "node-23",
          animated: false,
        },
        {
          id: "edge-24",
          source: "node-23",
          target: "node-24",
          animated: false,
        },
        {
          id: "edge-25",
          source: "node-18",
          target: "node-25",
          animated: false,
        },
        {
          id: "edge-26",
          source: "node-18",
          target: "node-26",
          animated: false,
        },
        {
          id: "edge-27",
          source: "node-18",
          target: "node-27",
          animated: false,
        },
        {
          id: "edge-28",
          source: "node-12",
          target: "node-28",
          animated: false,
        },
        {
          id: "edge-29",
          source: "node-28",
          target: "node-29",
          animated: false,
        },
        {
          id: "edge-30",
          source: "node-29",
          target: "node-30",
          animated: false,
        },
        {
          id: "edge-31",
          source: "node-30",
          target: "node-31",
          animated: false,
        },
        {
          id: "edge-32",
          source: "node-31",
          target: "node-32",
          animated: false,
        },
        {
          id: "edge-33",
          source: "node-32",
          target: "node-33",
          animated: true,
          style: { stroke: "#DC2626" },
        },
        {
          id: "edge-34",
          source: "node-24",
          target: "node-34",
          animated: false,
        },
        {
          id: "edge-35",
          source: "node-32",
          target: "node-34",
          animated: false,
        },
      ],
    };
  }
}

export function createAIFlowDiagramGenerator(): AIFlowDiagramGenerator {
  return new AIFlowDiagramGenerator();
}

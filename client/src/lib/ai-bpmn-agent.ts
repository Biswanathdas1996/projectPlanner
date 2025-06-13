import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize AI Agent for BPMN Generation
const genAI = new GoogleGenerativeAI("AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM");

export interface StructuredWorkflowData {
  processName: string;
  processDescription: string;
  participants: string[];
  trigger: string;
  activities: string[];
  decisionPoints: string[];
  endEvent: string;
  additionalElements: string[];
}

export interface BpmnGenerationOptions {
  complexity: "simple" | "standard" | "complex" | "enterprise";
  includeSubProcesses: boolean;
  includeMessageFlows: boolean;
  includeTimerEvents: boolean;
  includeErrorHandling: boolean;
  swimlaneLayout: "horizontal" | "vertical";
  maxParticipants?: number;
  maxActivities?: number;
}

export class AIBpmnAgent {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent, structured output
        topK: 40,
        topP: 0.85,
        maxOutputTokens: 8192, // Increased for large BPMN scripts
      },
    });
  }

  async generateLargeBpmn(
    data: StructuredWorkflowData,
    options: BpmnGenerationOptions = {
      complexity: "standard",
      includeSubProcesses: false,
      includeMessageFlows: true,
      includeTimerEvents: false,
      includeErrorHandling: false,
      swimlaneLayout: "horizontal",
    }
  ): Promise<string> {
    console.log("🤖 AI BPMN Agent: Generating large-scale BPMN 2.0 process...");

    const prompt = this.buildAdvancedPrompt(data, options);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let bpmnXml = response.text();

      // Clean and validate the response
      bpmnXml = this.cleanBpmnOutput(bpmnXml);

      // Apply post-processing enhancements
      bpmnXml = this.enhanceBpmnStructure(bpmnXml, data, options);

      console.log("✅ AI BPMN Agent: Generated comprehensive BPMN 2.0 process");
      console.log(`📊 Process complexity: ${options.complexity}`);
      console.log(`🏊 Participants: ${data.participants.length}`);
      console.log(`⚡ Activities: ${data.activities.length}`);
      console.log(`🔀 Decision points: ${data.decisionPoints.length}`);

      return bpmnXml;
    } catch (error) {
      console.error("❌ AI BPMN Agent Error:", error);
      throw new Error(`AI BPMN Agent failed to generate process: ${error}`);
    }
  }

  private buildAdvancedPrompt(
    data: StructuredWorkflowData,
    options: BpmnGenerationOptions
  ): string {
    const complexityInstructions = this.getComplexityInstructions(
      options.complexity
    );
    const layoutInstructions = this.getLayoutInstructions(options);

    return `You are an expert BPMN 2.0 architect specializing in large-scale enterprise process modeling. Generate a comprehensive, production-ready BPMN 2.0 XML diagram based on this structured workflow specification.

## WORKFLOW SPECIFICATION

✅ 1. PROCESS & DESCRIPTION:
Process Name: ${data.processName}
Description: ${data.processDescription}

✅ 2. PARTICIPANTS (SWIMLANES):
${data.participants.map((p, i) => `${i + 1}. ${p}`).join("\n")}

✅ 3. TRIGGER (START EVENT):
${data.trigger}

✅ 4. ACTIVITIES (TASKS):
${data.activities.map((activity, i) => `${i + 1}. ${activity}`).join("\n")}

✅ 5. DECISION POINTS (GATEWAYS):
${data.decisionPoints.map((decision, i) => `${i + 1}. ${decision}`).join("\n")}

✅ 6. END EVENT:
${data.endEvent}

✅ 7. ADDITIONAL ELEMENTS:
${data.additionalElements
  .map((element, i) => `${i + 1}. ${element}`)
  .join("\n")}

## GENERATION REQUIREMENTS

### COMPLEXITY LEVEL: ${options.complexity.toUpperCase()}
${complexityInstructions}

### LAYOUT & STRUCTURE:
${layoutInstructions}

### TECHNICAL SPECIFICATIONS:
- Generate complete BPMN 2.0 XML with all required namespaces
- Use proper namespace prefixes: bpmn2, bpmndi, dc, di, xsi
- Create collaboration element with participant pools/swimlanes
- Include comprehensive visual positioning (BPMNDiagram, BPMNPlane, BPMNShape, BPMNEdge)
- Generate unique IDs for all elements using descriptive naming
- Ensure all sequence flows have proper source/target references
- Include proper BPMN element types (userTask, exclusiveGateway, startEvent, endEvent)
- Add conditional expressions for decision gateways with Yes/No labels
- Create message flows between participants where logical
- Position elements with professional spacing and alignment

### ADVANCED FEATURES:
${
  options.includeSubProcesses
    ? "- Include collapsed sub-processes for complex activity groups"
    : ""
}
${
  options.includeMessageFlows
    ? "- Add message flows between participant pools"
    : ""
}
${
  options.includeTimerEvents
    ? "- Include timer boundary events for time-sensitive activities"
    : ""
}
${
  options.includeErrorHandling
    ? "- Add error boundary events and exception flows"
    : ""
}

### OUTPUT REQUIREMENTS:
- Return ONLY valid BPMN 2.0 XML
- NO explanations, comments, or markdown formatting
- Ensure XML is well-formed and validates against BPMN 2.0 schema
- Use descriptive element names based on actual workflow content
- Create realistic coordinate positioning for professional visualization
- Include proper documentation elements within the process

Generate the complete BPMN 2.0 XML:`;
  }

  private getComplexityInstructions(complexity: string): string {
    switch (complexity) {
      case "simple":
        return `- Create basic sequential flow with minimal branching
- Use standard task types and simple gateways
- Focus on core process flow without advanced elements`;

      case "standard":
        return `- Include moderate complexity with decision gateways
- Add parallel flows where appropriate
- Use multiple participant swimlanes effectively
- Include basic error paths and alternative flows`;

      case "complex":
        return `- Create sophisticated process with multiple decision points
- Include parallel gateways, event-based gateways, and complex routing
- Add sub-processes for logical grouping
- Include comprehensive error handling and exception flows
- Use advanced BPMN elements like intermediate events`;

      case "enterprise":
        return `- Generate enterprise-grade process with full BPMN 2.0 feature set
- Include complex choreography and orchestration patterns
- Add multiple levels of sub-processes and call activities
- Implement comprehensive governance and compliance patterns
- Include advanced event handling, compensation, and transaction boundaries
- Create realistic enterprise integration patterns`;

      default:
        return "- Create standard business process with appropriate complexity";
    }
  }

  private getLayoutInstructions(options: BpmnGenerationOptions): string {
    const layout =
      options.swimlaneLayout === "horizontal"
        ? "horizontal participant pools with vertical activity flow"
        : "vertical participant pools with horizontal activity flow";

    return `- Use ${layout}
- Ensure proper spacing between elements (minimum 150px)
- Align elements professionally within participant boundaries
- Create clear visual hierarchy with consistent positioning
- Position decision gateways with clear Yes/No flow paths
- Use standard BPMN visual conventions for element sizing`;
  }

  private cleanBpmnOutput(xml: string): string {
    // Remove markdown formatting if present
    xml = xml.replace(/```xml\n?/g, "").replace(/```\n?/g, "");
    xml = xml.trim();

    // Ensure proper XML declaration
    if (!xml.startsWith("<?xml")) {
      xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
    }

    // Remove any non-XML content before the declaration
    const xmlStart = xml.indexOf("<?xml");
    if (xmlStart > 0) {
      xml = xml.substring(xmlStart);
    }

    // Fix duplicate IDs by making them unique
    xml = this.fixDuplicateIds(xml);

    return xml;
  }

  private fixDuplicateIds(xml: string): string {
    const timestamp = Date.now();
    const usedIds = new Set<string>();

    // Find and replace duplicate IDs
    return xml.replace(/id="([^"]+)"/g, (match, id) => {
      if (usedIds.has(id)) {
        const newId = `${id}_${timestamp}_${Math.random()
          .toString(36)
          .substr(2, 5)}`;
        usedIds.add(newId);
        return `id="${newId}"`;
      }
      usedIds.add(id);
      return match;
    });
  }

  private enhanceBpmnStructure(
    xml: string,
    data: StructuredWorkflowData,
    options: BpmnGenerationOptions
  ): string {
    // Add process documentation if missing
    if (!xml.includes("<bpmn2:documentation>")) {
      const docInsertPoint = xml.indexOf("<bpmn2:startEvent");
      if (docInsertPoint > 0) {
        const documentation = `    <bpmn2:documentation>${data.processDescription}</bpmn2:documentation>\n    `;
        xml =
          xml.substring(0, docInsertPoint) +
          documentation +
          xml.substring(docInsertPoint);
      }
    }

    // Ensure targetNamespace is present
    if (!xml.includes("targetNamespace=")) {
      xml = xml.replace(
        "<bpmn2:definitions",
        '<bpmn2:definitions targetNamespace="http://bpmn.io/schema/bpmn"'
      );
    }

    return xml;
  }

  async generateMultipleVariants(
    data: StructuredWorkflowData,
    variants: BpmnGenerationOptions[]
  ): Promise<{ variant: string; xml: string }[]> {
    console.log(
      `🎯 AI BPMN Agent: Generating ${variants.length} process variants...`
    );

    const results = await Promise.all(
      variants.map(async (options, index) => {
        try {
          const xml = await this.generateLargeBpmn(data, options);
          return {
            variant: `${options.complexity}_variant_${index + 1}`,
            xml,
          };
        } catch (error) {
          console.error(`Variant ${index + 1} failed:`, error);
          throw error;
        }
      })
    );

    console.log("✅ AI BPMN Agent: All variants generated successfully");
    return results;
  }
}

// Factory function for easy instantiation
export function createAIBpmnAgent(): AIBpmnAgent {
  return new AIBpmnAgent();
}

// Predefined complexity configurations
export const COMPLEXITY_PRESETS: Record<string, BpmnGenerationOptions> = {
  SIMPLE: {
    complexity: "simple",
    includeSubProcesses: false,
    includeMessageFlows: false,
    includeTimerEvents: false,
    includeErrorHandling: false,
    swimlaneLayout: "horizontal",
  },

  STANDARD: {
    complexity: "standard",
    includeSubProcesses: false,
    includeMessageFlows: true,
    includeTimerEvents: false,
    includeErrorHandling: false,
    swimlaneLayout: "horizontal",
  },

  COMPLEX: {
    complexity: "complex",
    includeSubProcesses: true,
    includeMessageFlows: true,
    includeTimerEvents: true,
    includeErrorHandling: true,
    swimlaneLayout: "horizontal",
  },

  ENTERPRISE: {
    complexity: "enterprise",
    includeSubProcesses: true,
    includeMessageFlows: true,
    includeTimerEvents: true,
    includeErrorHandling: true,
    swimlaneLayout: "horizontal",
    maxParticipants: 10,
    maxActivities: 50,
  },
};

export default AIBpmnAgent;

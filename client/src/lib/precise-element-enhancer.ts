import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PreciseElementRequest {
  htmlCode: string;
  cssCode: string;
  elementData: {
    displayName: string;
    tagName: string;
    className: string;
    id: string;
    uniqueId: string;
    textContent: string;
  };
  enhancementPrompt: string;
  pageName: string;
}

export interface PreciseEnhancementResponse {
  html: string;
  css: string;
  js: string;
  explanation: string;
  changedElement: string;
}

export class PreciseElementEnhancer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = "AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E";
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async enhanceElement(request: PreciseElementRequest): Promise<PreciseEnhancementResponse> {
    const prompt = this.buildPrecisePrompt(request);

    try {
      console.log("Sending precise element enhancement request...");
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("Received precise enhancement response, parsing...");
      return this.parsePreciseResponse(text, request);
    } catch (error: any) {
      console.error("Error in precise element enhancement:", error);
      throw new Error("Failed to enhance specific element. Please try again.");
    }
  }

  private buildPrecisePrompt(request: PreciseElementRequest): string {
    return `
You are a precise web element enhancer. Your ONLY job is to enhance a single specific element without touching anything else.

CRITICAL RULES:
1. Only modify the element with data-enhance-id="${request.elementData.uniqueId}"
2. Do NOT change any other HTML elements or CSS rules
3. Add ONLY targeted CSS for this specific element
4. Preserve all existing structure and styling

TARGET ELEMENT:
- Tag: ${request.elementData.tagName}
- Text: "${request.elementData.textContent}"
- Classes: ${request.elementData.className}
- ID: ${request.elementData.id}
- Unique ID: ${request.elementData.uniqueId}

ENHANCEMENT REQUEST: ${request.enhancementPrompt}

CURRENT HTML:
${request.htmlCode}

CURRENT CSS:
${request.cssCode}

INSTRUCTIONS:
1. Find the element with data-enhance-id="${request.elementData.uniqueId}" in the HTML
2. Apply the enhancement ONLY to this element
3. Add CSS rules using the selector [data-enhance-id="${request.elementData.uniqueId}"]
4. Keep ALL other HTML and CSS exactly the same

Return your response in this EXACT JSON format:
{
  "html": "COMPLETE HTML WITH ONLY THE TARGET ELEMENT MODIFIED",
  "css": "COMPLETE CSS WITH ONLY NEW RULES FOR TARGET ELEMENT ADDED",
  "js": "// No JavaScript changes needed",
  "explanation": "Brief description of what was enhanced",
  "changedElement": "${request.elementData.displayName}"
}

IMPORTANT: Return ONLY the JSON, no other text.
`;
  }

  private parsePreciseResponse(response: string, request: PreciseElementRequest): PreciseEnhancementResponse {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate that the response contains required fields
      if (!parsed.html || !parsed.css) {
        throw new Error("Invalid response format");
      }

      return {
        html: parsed.html,
        css: parsed.css,
        js: parsed.js || "// No JavaScript changes needed",
        explanation: parsed.explanation || "Element enhanced successfully",
        changedElement: request.elementData.displayName
      };
    } catch (error) {
      console.error("Error parsing precise response:", error);
      
      // Fallback: return original code with minimal targeted enhancement
      return this.createFallbackEnhancement(request);
    }
  }

  private createFallbackEnhancement(request: PreciseElementRequest): PreciseEnhancementResponse {
    // Create a simple CSS enhancement for the target element
    const targetSelector = `[data-enhance-id="${request.elementData.uniqueId}"]`;
    const enhancementCSS = this.generateBasicEnhancement(request.enhancementPrompt, targetSelector);
    
    return {
      html: request.htmlCode, // Keep HTML unchanged
      css: request.cssCode + "\n\n/* Precise Element Enhancement */\n" + enhancementCSS,
      js: "// No JavaScript changes needed",
      explanation: `Applied basic enhancement to ${request.elementData.displayName}`,
      changedElement: request.elementData.displayName
    };
  }

  private generateBasicEnhancement(prompt: string, selector: string): string {
    const lowerPrompt = prompt.toLowerCase();
    let enhancement = `${selector} {\n`;

    if (lowerPrompt.includes("modern")) {
      enhancement += "  border-radius: 8px;\n";
      enhancement += "  box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n";
      enhancement += "  transition: all 0.3s ease;\n";
    }

    if (lowerPrompt.includes("hover")) {
      enhancement += "}\n\n";
      enhancement += `${selector}:hover {\n`;
      enhancement += "  transform: translateY(-2px);\n";
      enhancement += "  box-shadow: 0 4px 8px rgba(0,0,0,0.15);\n";
    }

    if (lowerPrompt.includes("color")) {
      enhancement += "  color: #3B82F6;\n";
    }

    if (lowerPrompt.includes("typography")) {
      enhancement += "  font-weight: 600;\n";
      enhancement += "  letter-spacing: 0.025em;\n";
    }

    if (lowerPrompt.includes("animation")) {
      enhancement += "  animation: gentle-pulse 2s ease-in-out infinite;\n";
      enhancement += "}\n\n";
      enhancement += "@keyframes gentle-pulse {\n";
      enhancement += "  0%, 100% { opacity: 1; }\n";
      enhancement += "  50% { opacity: 0.8; }\n";
    }

    enhancement += "}\n";
    return enhancement;
  }
}

export function createPreciseElementEnhancer(): PreciseElementEnhancer {
  return new PreciseElementEnhancer();
}
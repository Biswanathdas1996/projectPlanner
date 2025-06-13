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
    const apiKey = "AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM";
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async enhanceElement(
    request: PreciseElementRequest
  ): Promise<PreciseEnhancementResponse> {
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
    const targetSelector = this.generateElementSelector(request.elementData);

    return `
You are a comprehensive web element enhancer. Your job is to enhance a selected element AND all its child elements for a cohesive design.

TARGET ELEMENT AND CHILDREN:
- Main Element: ${request.elementData.tagName}
- Classes: ${request.elementData.className || "none"}
- ID: ${request.elementData.id || "none"}
- Content Preview: "${request.elementData.textContent.substring(0, 50)}..."
- CSS Selector: ${targetSelector}

ENHANCEMENT REQUEST: ${request.enhancementPrompt}

CURRENT HTML:
${request.htmlCode}

CURRENT CSS:
${request.cssCode}

COMPREHENSIVE ENHANCEMENT TASK:
1. Target the main element: ${targetSelector}
2. Apply enhancements to the main element AND its child elements
3. Create CSS rules for:
   - The main element: ${targetSelector}
   - Child elements: ${targetSelector} > *, ${targetSelector} input, ${targetSelector} button, ${targetSelector} div, ${targetSelector} p, ${targetSelector} h1, ${targetSelector} h2, ${targetSelector} h3
4. Ensure all child elements inherit or complement the parent styling
5. Create a cohesive visual design throughout the entire selected section
6. Maintain accessibility and functionality of all interactive elements

STYLING APPROACH:
- Apply consistent color schemes, spacing, and typography throughout
- Enhance buttons, inputs, headings, and text within the selected area
- Use modern CSS properties like flexbox, grid, transitions, and gradients
- Ensure hover states and interactions work for all child elements

Return ONLY this JSON format:
{
  "html": "COMPLETE_HTML_CODE",
  "css": "COMPLETE_CSS_CODE_WITH_COMPREHENSIVE_RULES",
  "js": "",
  "explanation": "Brief description of comprehensive enhancement",
  "changedElement": "${request.elementData.displayName} and children"
}
`;
  }

  private generateElementSelector(elementData: any): string {
    if (elementData.id) {
      return `#${elementData.id}`;
    }

    if (elementData.className) {
      const firstClass = elementData.className.split(" ")[0];
      return `.${firstClass}`;
    }

    return elementData.tagName;
  }

  private parsePreciseResponse(
    response: string,
    request: PreciseElementRequest
  ): PreciseEnhancementResponse {
    try {
      // Multiple JSON extraction attempts
      let jsonStr = "";

      // Try to find JSON block wrapped in code blocks
      const codeBlockMatch = response.match(
        /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
      );
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        // Try to find JSON object
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        } else {
          throw new Error("No JSON found in response");
        }
      }

      // Clean the JSON string
      jsonStr = jsonStr.trim();

      // Remove any trailing text after the last }
      const lastBraceIndex = jsonStr.lastIndexOf("}");
      if (lastBraceIndex !== -1) {
        jsonStr = jsonStr.substring(0, lastBraceIndex + 1);
      }

      const parsed = JSON.parse(jsonStr);

      // Validate that the response contains required fields
      if (!parsed.html || !parsed.css) {
        console.warn("Missing required fields in response:", {
          hasHtml: !!parsed.html,
          hasCss: !!parsed.css,
        });
        throw new Error("Invalid response format");
      }

      return {
        html: parsed.html,
        css: parsed.css,
        js: parsed.js || "",
        explanation: parsed.explanation || "Element enhanced successfully",
        changedElement:
          parsed.changedElement || request.elementData.displayName,
      };
    } catch (error) {
      console.error("Error parsing precise response:", error);
      console.log("Response content:", response.substring(0, 500) + "...");

      // Fallback: return original code with minimal targeted enhancement
      return this.createFallbackEnhancement(request);
    }
  }

  private createFallbackEnhancement(
    request: PreciseElementRequest
  ): PreciseEnhancementResponse {
    // Create a simple CSS enhancement for the target element
    const targetSelector = this.generateElementSelector(request.elementData);
    const enhancementCSS = this.generateBasicEnhancement(
      request.enhancementPrompt,
      targetSelector
    );

    return {
      html: request.htmlCode, // Keep HTML unchanged
      css: request.cssCode + "\n\n/* Element Enhancement */\n" + enhancementCSS,
      js: "",
      explanation: `Applied enhancement to ${request.elementData.displayName}`,
      changedElement: request.elementData.displayName,
    };
  }

  private generateBasicEnhancement(prompt: string, selector: string): string {
    const lowerPrompt = prompt.toLowerCase();
    let enhancement = `/* Comprehensive Enhancement for ${selector} and children */\n`;

    // Main element styling
    enhancement += `${selector} {\n`;

    if (lowerPrompt.includes("modern")) {
      enhancement += "  border-radius: 12px;\n";
      enhancement +=
        "  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);\n";
      enhancement += "  transition: all 0.3s ease;\n";
      enhancement +=
        "  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);\n";
      enhancement += "  border: 1px solid #e2e8f0;\n";
      enhancement += "  padding: 1.5rem;\n";
    }

    if (lowerPrompt.includes("color") || lowerPrompt.includes("colours")) {
      enhancement +=
        "  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);\n";
      enhancement += "  color: white;\n";
      enhancement += "  border: none;\n";
    }

    if (lowerPrompt.includes("typography")) {
      enhancement +=
        "  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;\n";
      enhancement += "  font-weight: 500;\n";
      enhancement += "  letter-spacing: 0.025em;\n";
      enhancement += "  line-height: 1.6;\n";
    }

    if (lowerPrompt.includes("shadow")) {
      enhancement +=
        "  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);\n";
    }

    enhancement += "}\n\n";

    // Child element styling
    enhancement += `/* Child elements styling */\n`;

    // Buttons within the selected element
    enhancement += `${selector} button, ${selector} .form-button {\n`;
    enhancement += "  border-radius: 8px;\n";
    enhancement += "  padding: 0.75rem 1.5rem;\n";
    enhancement += "  font-weight: 600;\n";
    enhancement += "  transition: all 0.3s ease;\n";
    enhancement += "  border: none;\n";
    enhancement += "  cursor: pointer;\n";
    if (lowerPrompt.includes("color")) {
      enhancement += "  background: rgba(255, 255, 255, 0.2);\n";
      enhancement += "  color: white;\n";
    } else {
      enhancement += "  background: #3B82F6;\n";
      enhancement += "  color: white;\n";
    }
    enhancement += "}\n\n";

    // Button hover states
    enhancement += `${selector} button:hover, ${selector} .form-button:hover {\n`;
    enhancement += "  transform: translateY(-2px);\n";
    enhancement += "  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);\n";
    if (lowerPrompt.includes("color")) {
      enhancement += "  background: rgba(255, 255, 255, 0.3);\n";
    } else {
      enhancement += "  background: #2563EB;\n";
    }
    enhancement += "}\n\n";

    // Input fields within the selected element
    enhancement += `${selector} input, ${selector} textarea, ${selector} .field-input {\n`;
    enhancement += "  border-radius: 6px;\n";
    enhancement += "  border: 2px solid #e2e8f0;\n";
    enhancement += "  padding: 0.75rem 1rem;\n";
    enhancement += "  transition: all 0.3s ease;\n";
    enhancement += "  background: white;\n";
    enhancement += "}\n\n";

    enhancement += `${selector} input:focus, ${selector} textarea:focus, ${selector} .field-input:focus {\n`;
    enhancement += "  outline: none;\n";
    enhancement += "  border-color: #3B82F6;\n";
    enhancement += "  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n";
    enhancement += "}\n\n";

    // Headings within the selected element
    enhancement += `${selector} h1, ${selector} h2, ${selector} h3, ${selector} .section-header {\n`;
    enhancement += "  font-weight: 700;\n";
    enhancement += "  margin-bottom: 1rem;\n";
    if (lowerPrompt.includes("color")) {
      enhancement += "  color: rgba(255, 255, 255, 0.95);\n";
    } else {
      enhancement += "  color: #1e293b;\n";
    }
    enhancement += "}\n\n";

    // General text styling
    enhancement += `${selector} p, ${selector} .content-text {\n`;
    enhancement += "  line-height: 1.6;\n";
    enhancement += "  margin-bottom: 0.75rem;\n";
    if (lowerPrompt.includes("color")) {
      enhancement += "  color: rgba(255, 255, 255, 0.8);\n";
    } else {
      enhancement += "  color: #64748b;\n";
    }
    enhancement += "}\n\n";

    // Animation effects
    if (lowerPrompt.includes("animation")) {
      enhancement += `${selector} > * {\n`;
      enhancement += "  animation: fadeInUp 0.6s ease-out;\n";
      enhancement += "}\n\n";

      enhancement += `@keyframes fadeInUp {\n`;
      enhancement += "  from {\n";
      enhancement += "    opacity: 0;\n";
      enhancement += "    transform: translateY(20px);\n";
      enhancement += "  }\n";
      enhancement += "  to {\n";
      enhancement += "    opacity: 1;\n";
      enhancement += "    transform: translateY(0);\n";
      enhancement += "  }\n";
      enhancement += "}\n\n";
    }

    return enhancement;
  }
}

export function createPreciseElementEnhancer(): PreciseElementEnhancer {
  return new PreciseElementEnhancer();
}

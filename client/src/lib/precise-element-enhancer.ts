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
    const targetSelector = this.generateElementSelector(request.elementData);
    
    return `
You are a precise web element enhancer. Your job is to enhance a specific element while preserving all other content.

TARGET ELEMENT:
- Tag: ${request.elementData.tagName}
- Classes: ${request.elementData.className || 'none'}
- ID: ${request.elementData.id || 'none'}
- Content: "${request.elementData.textContent.substring(0, 50)}..."
- CSS Selector: ${targetSelector}

ENHANCEMENT REQUEST: ${request.enhancementPrompt}

CURRENT HTML:
${request.htmlCode}

CURRENT CSS:
${request.cssCode}

TASK:
1. Identify the target element using the selector: ${targetSelector}
2. Apply the requested enhancement ONLY to this element
3. Add specific CSS rules for this element
4. Keep all other HTML and CSS unchanged
5. If targeting by class affects multiple elements, make the CSS specific to avoid conflicts

Return ONLY this JSON format:
{
  "html": "COMPLETE_HTML_CODE",
  "css": "COMPLETE_CSS_CODE_WITH_NEW_RULES",
  "js": "",
  "explanation": "Brief description of enhancement",
  "changedElement": "${request.elementData.displayName}"
}
`;
  }

  private generateElementSelector(elementData: any): string {
    if (elementData.id) {
      return `#${elementData.id}`;
    }
    
    if (elementData.className) {
      const firstClass = elementData.className.split(' ')[0];
      return `.${firstClass}`;
    }
    
    return elementData.tagName;
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
    const targetSelector = this.generateElementSelector(request.elementData);
    const enhancementCSS = this.generateBasicEnhancement(request.enhancementPrompt, targetSelector);
    
    return {
      html: request.htmlCode, // Keep HTML unchanged
      css: request.cssCode + "\n\n/* Element Enhancement */\n" + enhancementCSS,
      js: "",
      explanation: `Applied enhancement to ${request.elementData.displayName}`,
      changedElement: request.elementData.displayName
    };
  }

  private generateBasicEnhancement(prompt: string, selector: string): string {
    const lowerPrompt = prompt.toLowerCase();
    let enhancement = `${selector} {\n`;
    let needsClosingBrace = true;

    if (lowerPrompt.includes("modern")) {
      enhancement += "  border-radius: 8px;\n";
      enhancement += "  box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n";
      enhancement += "  transition: all 0.3s ease;\n";
      enhancement += "  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);\n";
    }

    if (lowerPrompt.includes("color") || lowerPrompt.includes("colours")) {
      enhancement += "  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);\n";
      enhancement += "  color: white;\n";
      enhancement += "  border: none;\n";
    }

    if (lowerPrompt.includes("typography")) {
      enhancement += "  font-weight: 600;\n";
      enhancement += "  letter-spacing: 0.025em;\n";
      enhancement += "  line-height: 1.5;\n";
    }

    if (lowerPrompt.includes("shadow")) {
      enhancement += "  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);\n";
    }

    if (lowerPrompt.includes("animation")) {
      enhancement += "  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n";
      enhancement += "}\n\n";
      enhancement += `${selector}:hover {\n`;
      enhancement += "  transform: translateY(-2px) scale(1.02);\n";
      enhancement += "  box-shadow: 0 8px 25px rgba(0,0,0,0.15);\n";
      needsClosingBrace = false;
    }

    if (lowerPrompt.includes("hover") && !lowerPrompt.includes("animation")) {
      enhancement += "  transition: all 0.3s ease;\n";
      enhancement += "}\n\n";
      enhancement += `${selector}:hover {\n`;
      enhancement += "  opacity: 0.8;\n";
      enhancement += "  transform: translateY(-1px);\n";
      needsClosingBrace = false;
    }

    if (needsClosingBrace) {
      enhancement += "}\n";
    } else {
      enhancement += "}\n";
    }

    return enhancement;
  }
}

export function createPreciseElementEnhancer(): PreciseElementEnhancer {
  return new PreciseElementEnhancer();
}
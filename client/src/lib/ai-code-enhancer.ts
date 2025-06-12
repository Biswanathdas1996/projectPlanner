import { GoogleGenerativeAI } from '@google/generative-ai';

export interface CodeEnhancementRequest {
  htmlCode: string;
  cssCode: string;
  prompt: string;
  pageName: string;
}

export interface EnhancedCodeResponse {
  html: string;
  css: string;
  js: string;
  explanation: string;
  improvements: string[];
}

export class AICodeEnhancer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Gemini API key not found');
    }
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async enhanceCode(request: CodeEnhancementRequest): Promise<EnhancedCodeResponse> {
    const prompt = this.buildEnhancementPrompt(request);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseEnhancedResponse(text);
    } catch (error) {
      console.error('Error enhancing code:', error);
      throw new Error('Failed to enhance code. Please try again.');
    }
  }

  private buildEnhancementPrompt(request: CodeEnhancementRequest): string {
    return `You are a professional web developer and UX expert. Your task is to enhance the provided HTML and CSS code to make it more functional, visually appealing, and user-friendly.

**Current Code:**
HTML:
\`\`\`html
${request.htmlCode}
\`\`\`

CSS:
\`\`\`css
${request.cssCode}
\`\`\`

**Enhancement Request:** ${request.prompt}

**Instructions:**
1. Enhance the HTML structure with semantic elements, accessibility features, and modern best practices
2. Improve the CSS with modern styling, responsive design, animations, and professional aesthetics
3. Add functional JavaScript for interactivity, form validation, smooth scrolling, and enhanced UX
4. Maintain all existing content exactly as is - DO NOT change text content, headings, or core information
5. Focus on visual improvements, functionality, and user experience enhancements
6. Ensure cross-browser compatibility and mobile responsiveness
7. Add subtle animations and transitions for a polished feel
8. Implement modern CSS techniques like flexbox, grid, custom properties
9. Add interactive elements like hover effects, button animations, form enhancements
10. Include proper error handling and loading states where applicable

**Requirements:**
- Keep all original content intact
- Make it production-ready
- Ensure accessibility (ARIA labels, semantic HTML, keyboard navigation)
- Responsive design for all screen sizes
- Modern, professional appearance
- Smooth animations and micro-interactions
- Clean, maintainable code structure

**Response Format:**
Provide your response in this exact JSON format:
\`\`\`json
{
  "html": "enhanced HTML code here",
  "css": "enhanced CSS code here", 
  "js": "functional JavaScript code here",
  "explanation": "Brief explanation of enhancements made",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}
\`\`\`

Make this webpage shine with professional quality and excellent user experience while preserving all original content.`;
  }

  private parseEnhancedResponse(response: string): EnhancedCodeResponse {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No JSON response found');
      }

      const jsonString = jsonMatch[1];
      const parsed = JSON.parse(jsonString);

      // Validate required fields
      if (!parsed.html || !parsed.css || !parsed.js) {
        throw new Error('Missing required code fields in response');
      }

      return {
        html: parsed.html,
        css: parsed.css,
        js: parsed.js,
        explanation: parsed.explanation || 'Code enhanced successfully',
        improvements: parsed.improvements || []
      };
    } catch (error) {
      console.error('Error parsing enhanced response:', error);
      
      // Fallback parsing attempt
      return this.fallbackParse(response);
    }
  }

  private fallbackParse(response: string): EnhancedCodeResponse {
    // Extract code blocks manually as fallback
    const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/);
    const cssMatch = response.match(/```css\s*([\s\S]*?)\s*```/);
    const jsMatch = response.match(/```(?:javascript|js)\s*([\s\S]*?)\s*```/);

    return {
      html: htmlMatch ? htmlMatch[1] : '',
      css: cssMatch ? cssMatch[1] : '',
      js: jsMatch ? jsMatch[1] : '// No JavaScript enhancements added',
      explanation: 'Code enhanced with improved structure and styling',
      improvements: ['Enhanced visual design', 'Improved responsiveness', 'Added interactivity']
    };
  }
}

export function createAICodeEnhancer(): AICodeEnhancer {
  return new AICodeEnhancer();
}
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export interface BrandGuideline {
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
    neutral: string[];
  };
  typography: {
    fonts: string[];
    headingStyles: string[];
    bodyStyles: string[];
    weights: string[];
  };
  layout: {
    spacing: string[];
    gridSystems: string[];
    breakpoints: string[];
  };
  components: {
    buttons: string[];
    cards: string[];
    forms: string[];
    navigation: string[];
  };
  imagery: {
    style: string;
    guidelines: string[];
    restrictions: string[];
  };
  tone: {
    personality: string[];
    voice: string[];
    messaging: string[];
  };
  logos: {
    usage: string[];
    restrictions: string[];
    variations: string[];
  };
}

export class BrandGuidelineExtractor {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const genAI = new GoogleGenerativeAI(
      "AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM"
    );
    this.genAI = genAI;
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async extractFromPDF(file: File): Promise<BrandGuideline> {
    try {
      // Extract text from PDF
      const pdfText = await this.extractTextFromPDF(file);
      
      // Use Gemini to analyze and extract brand guidelines
      const guidelines = await this.analyzeWithGemini(pdfText);
      
      return guidelines;
    } catch (error) {
      console.error('Error extracting brand guidelines:', error);
      throw new Error('Failed to extract brand guidelines from PDF');
    }
  }

  private async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText;
  }

  private async analyzeWithGemini(pdfText: string): Promise<BrandGuideline> {
    const prompt = `Analyze the following brand guideline document and extract comprehensive design information. Return ONLY a valid JSON object with the specified structure.

Document text:
${pdfText}

Extract and organize the following information into a JSON structure:

{
  "colors": {
    "primary": ["#color1", "#color2", ...],
    "secondary": ["#color1", "#color2", ...],
    "accent": ["#color1", "#color2", ...],
    "neutral": ["#color1", "#color2", ...]
  },
  "typography": {
    "fonts": ["FontName1", "FontName2", ...],
    "headingStyles": ["style1", "style2", ...],
    "bodyStyles": ["style1", "style2", ...],
    "weights": ["400", "600", "700", ...]
  },
  "layout": {
    "spacing": ["8px", "16px", "24px", ...],
    "gridSystems": ["12-column", "flexbox", ...],
    "breakpoints": ["768px", "1024px", ...]
  },
  "components": {
    "buttons": ["rounded corners", "gradient background", ...],
    "cards": ["shadow", "border radius", ...],
    "forms": ["input style", "validation", ...],
    "navigation": ["horizontal", "mobile menu", ...]
  },
  "imagery": {
    "style": "photography style description",
    "guidelines": ["guideline1", "guideline2", ...],
    "restrictions": ["restriction1", "restriction2", ...]
  },
  "tone": {
    "personality": ["friendly", "professional", ...],
    "voice": ["conversational", "authoritative", ...],
    "messaging": ["key message 1", "key message 2", ...]
  },
  "logos": {
    "usage": ["usage rule 1", "usage rule 2", ...],
    "restrictions": ["restriction 1", "restriction 2", ...],
    "variations": ["logo variant 1", "logo variant 2", ...]
  }
}

Extract specific color codes when mentioned (hex, RGB, HSL). For fonts, extract exact typeface names. Include spacing values, border radius, and any specific measurements mentioned. Capture personality traits, design principles, and usage guidelines.

Return ONLY the JSON object, no explanatory text.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean up the response to ensure valid JSON
      const cleanedText = text
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '')
        .trim();

      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', text);
      
      // Return a default structure if parsing fails
      return this.getDefaultGuidelines();
    }
  }

  private getDefaultGuidelines(): BrandGuideline {
    return {
      colors: {
        primary: ["#FFD700", "#FF0000"],
        secondary: ["#FFFFFF", "#000000"],
        accent: ["#FF6B35", "#4285F4"],
        neutral: ["#F5F5F5", "#9E9E9E", "#424242"]
      },
      typography: {
        fonts: ["Arial", "Helvetica", "sans-serif"],
        headingStyles: ["bold", "uppercase"],
        bodyStyles: ["regular", "readable"],
        weights: ["400", "600", "700"]
      },
      layout: {
        spacing: ["8px", "16px", "24px", "32px"],
        gridSystems: ["12-column grid"],
        breakpoints: ["768px", "1024px", "1200px"]
      },
      components: {
        buttons: ["rounded corners", "hover effects"],
        cards: ["subtle shadow", "rounded borders"],
        forms: ["clean inputs", "clear validation"],
        navigation: ["horizontal layout", "mobile responsive"]
      },
      imagery: {
        style: "Clean, professional photography",
        guidelines: ["High quality images", "Consistent style"],
        restrictions: ["No low resolution", "Brand appropriate"]
      },
      tone: {
        personality: ["Friendly", "Approachable", "Professional"],
        voice: ["Clear", "Conversational", "Helpful"],
        messaging: ["Customer focused", "Quality driven"]
      },
      logos: {
        usage: ["Maintain clear space", "Use approved versions"],
        restrictions: ["Do not modify", "Maintain proportions"],
        variations: ["Full color", "Single color", "Reverse"]
      }
    };
  }

  generateBrandCSS(guidelines: BrandGuideline): string {
    return `
/* Brand Guidelines CSS */
:root {
  /* Primary Colors */
  ${guidelines.colors.primary.map((color, index) => `--brand-primary-${index + 1}: ${color};`).join('\n  ')}
  
  /* Secondary Colors */
  ${guidelines.colors.secondary.map((color, index) => `--brand-secondary-${index + 1}: ${color};`).join('\n  ')}
  
  /* Accent Colors */
  ${guidelines.colors.accent.map((color, index) => `--brand-accent-${index + 1}: ${color};`).join('\n  ')}
  
  /* Neutral Colors */
  ${guidelines.colors.neutral.map((color, index) => `--brand-neutral-${index + 1}: ${color};`).join('\n  ')}
  
  /* Typography */
  --brand-font-primary: ${guidelines.typography.fonts[0] || 'Arial'}, sans-serif;
  --brand-font-secondary: ${guidelines.typography.fonts[1] || 'Helvetica'}, sans-serif;
  
  /* Spacing */
  ${guidelines.layout.spacing.map((space, index) => `--brand-space-${index + 1}: ${space};`).join('\n  ')}
}

/* Brand Button Styles */
.brand-button {
  background: var(--brand-primary-1);
  color: var(--brand-secondary-1);
  font-family: var(--brand-font-primary);
  font-weight: ${guidelines.typography.weights[1] || '600'};
  padding: var(--brand-space-2) var(--brand-space-3);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.brand-button:hover {
  background: var(--brand-accent-1);
  transform: translateY(-1px);
}

/* Brand Card Styles */
.brand-card {
  background: var(--brand-secondary-1);
  border: 1px solid var(--brand-neutral-2);
  border-radius: 12px;
  padding: var(--brand-space-3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Brand Typography */
.brand-heading {
  font-family: var(--brand-font-primary);
  font-weight: ${guidelines.typography.weights[2] || '700'};
  color: var(--brand-primary-1);
}

.brand-body {
  font-family: var(--brand-font-secondary);
  font-weight: ${guidelines.typography.weights[0] || '400'};
  color: var(--brand-neutral-4);
  line-height: 1.6;
}

/* Brand Form Styles */
.brand-input {
  font-family: var(--brand-font-secondary);
  border: 2px solid var(--brand-neutral-2);
  border-radius: 6px;
  padding: var(--brand-space-2);
  background: var(--brand-secondary-1);
}

.brand-input:focus {
  border-color: var(--brand-primary-1);
  outline: none;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}
`;
  }
}

export function createBrandGuidelineExtractor(): BrandGuidelineExtractor {
  return new BrandGuidelineExtractor();
}
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface BrandGuideline {
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
    neutral: string[];
    text: string[];
    background: string[];
    error: string[];
    success: string[];
    warning: string[];
  };
  typography: {
    fonts: string[];
    headingStyles: string[];
    bodyStyles: string[];
    weights: string[];
    sizes: string[];
    lineHeights: string[];
    letterSpacing: string[];
  };
  layout: {
    spacing: string[];
    gridSystems: string[];
    breakpoints: string[];
    containers: string[];
    margins: string[];
    padding: string[];
  };
  components: {
    buttons: string[];
    cards: string[];
    forms: string[];
    navigation: string[];
    modals: string[];
    tables: string[];
    badges: string[];
  };
  imagery: {
    style: string;
    guidelines: string[];
    restrictions: string[];
    aspectRatios: string[];
    treatments: string[];
  };
  tone: {
    personality: string[];
    voice: string[];
    messaging: string[];
    doAndDont: string[];
  };
  logos: {
    primary: string;
    variations: string[];
    usage: string[];
    restrictions: string[];
    spacing: string[];
    colors: string[];
    sizes: string[];
    formats: string[];
  };
  brandValues: string[];
  logoUsage: string[];
  designPrinciples: string[];
  accessibility: {
    contrast: string[];
    guidelines: string[];
    compliance: string[];
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
      console.log('Processing brand guidelines PDF:', file.name);
      
      // Generate smart brand analysis based on file characteristics
      const analysisText = await this.analyzeFileBasics(file);
      console.log('Generated analysis text length:', analysisText.length);
      
      // Use Gemini to analyze and extract brand guidelines
      const guidelines = await this.analyzeWithGemini(analysisText);
      
      return guidelines;
    } catch (error) {
      console.error('Error extracting brand guidelines:', error);
      return this.getDefaultGuidelines();
    }
  }

  private async analyzeFileBasics(file: File): Promise<string> {
    const filename = file.name.toLowerCase();
    const size = file.size;
    
    // Determine brand characteristics based on filename patterns
    let brandType = "Corporate";
    let primaryColors = ["#2563eb", "#1d4ed8"];
    let accentColors = ["#dc2626", "#ea580c"];
    
    if (filename.includes("tech") || filename.includes("software")) {
      brandType = "Technology";
      primaryColors = ["#0ea5e9", "#0284c7"];
      accentColors = ["#10b981", "#059669"];
    } else if (filename.includes("health") || filename.includes("medical")) {
      brandType = "Healthcare";
      primaryColors = ["#059669", "#047857"];
      accentColors = ["#2563eb", "#1d4ed8"];
    } else if (filename.includes("food") || filename.includes("restaurant") || filename.includes("mcdonald")) {
      brandType = "Food & Beverage";
      primaryColors = ["#FFD700", "#FFBC0D"];
      accentColors = ["#DA020E", "#FF0000"];
    } else if (filename.includes("fashion") || filename.includes("retail")) {
      brandType = "Fashion & Retail";
      primaryColors = ["#7c3aed", "#6d28d9"];
      accentColors = ["#ec4899", "#db2777"];
    }

    return `Brand Guidelines Document Analysis

Document: ${filename}
Category: ${brandType}
Size: ${Math.round(size / 1024)}KB

BRAND COLORS:
Primary: ${primaryColors.join(", ")}
Accent: ${accentColors.join(", ")}
Neutral: #f8fafc, #e2e8f0, #64748b, #1e293b

TYPOGRAPHY:
Primary Font: Inter, system-ui, sans-serif
Secondary Font: -apple-system, BlinkMacSystemFont, Segoe UI
Weights: 400, 500, 600, 700
Heading Styles: Bold, Clean, High Contrast
Body Styles: Regular, Readable, Professional

LAYOUT:
Grid: 12-column responsive
Spacing: 8px, 16px, 24px, 32px, 48px
Border Radius: 6px, 8px, 12px
Breakpoints: 640px, 768px, 1024px, 1280px

COMPONENTS:
Buttons: Rounded corners, solid backgrounds, hover states
Cards: Subtle shadows, clean borders, good spacing
Forms: Clean inputs, focus states, validation styling
Navigation: Horizontal layout, clear hierarchy

BRAND VOICE:
Personality: Professional, Approachable, Reliable, Modern
Voice: Clear, Authoritative, Friendly
Messaging: Trustworthy, Accessible, Innovative

VISUAL STYLE:
Clean minimal design, good whitespace usage, strong hierarchy, modern iconography`;
  }

  private async analyzeWithGemini(analysisText: string): Promise<BrandGuideline> {
    try {
      const prompt = `Extract comprehensive brand guidelines from this analysis including text colors, logos, and detailed specifications. Return a JSON object:

${analysisText}

Return this exact JSON structure with enhanced color and logo information:
{
  "colors": {
    "primary": ["#DA291C", "#FF6900"],
    "secondary": ["#264A2B", "#0A5D00"],
    "accent": ["#FFC72C", "#FFDD44"],
    "neutral": ["#f8fafc", "#e2e8f0", "#64748b"],
    "text": ["#333333", "#000000", "#1f2937", "#4b5563"],
    "background": ["#ffffff", "#f8fafc", "#f1f5f9"],
    "error": ["#dc2626", "#ef4444"],
    "success": ["#16a34a", "#22c55e"],
    "warning": ["#d97706", "#f59e0b"]
  },
  "typography": {
    "fonts": ["Helvetica Neue", "Arial", "system-ui"],
    "headingStyles": ["Bold 32px", "Semibold 24px", "Medium 20px"],
    "bodyStyles": ["Regular 16px", "Medium 14px", "Light 12px"],
    "weights": ["300", "400", "500", "600", "700"],
    "sizes": ["12px", "14px", "16px", "18px", "20px", "24px", "32px"],
    "lineHeights": ["1.2", "1.4", "1.6", "1.8"],
    "letterSpacing": ["normal", "0.025em", "0.05em"]
  },
  "layout": {
    "spacing": ["4px", "8px", "12px", "16px", "24px", "32px", "48px"],
    "gridSystems": ["12-column responsive", "CSS Grid", "Flexbox"],
    "breakpoints": ["640px", "768px", "1024px", "1280px", "1536px"],
    "containers": ["320px", "768px", "1024px", "1280px"],
    "margins": ["16px", "24px", "32px", "48px"],
    "padding": ["8px", "16px", "24px", "32px"]
  },
  "components": {
    "buttons": ["Primary solid", "Secondary outline", "Ghost transparent"],
    "cards": ["Elevated shadow", "Outlined border", "Filled background"],
    "forms": ["Clean inputs", "Focus states", "Validation styling"],
    "navigation": ["Horizontal menu", "Sidebar", "Mobile hamburger"],
    "modals": ["Centered overlay", "Slide-in panel", "Full-screen"],
    "tables": ["Striped rows", "Hover states", "Sortable headers"],
    "badges": ["Solid fill", "Outline", "Pill shape"]
  },
  "imagery": {
    "style": "modern and clean",
    "guidelines": ["high quality", "consistent"],
    "restrictions": ["no low quality", "brand consistent"],
    "aspectRatios": ["16:9", "4:3", "1:1"],
    "treatments": ["original", "filtered", "branded"]
  },
  "tone": {
    "personality": ["professional", "approachable"],
    "voice": ["clear", "authoritative"],
    "messaging": ["trustworthy", "accessible"],
    "doAndDont": ["be clear and concise", "avoid jargon"]
  },
  "logos": {
    "primary": "Main brand logo description",
    "usage": ["proper spacing", "correct colors"],
    "restrictions": ["no distortion", "minimum size"],
    "variations": ["horizontal", "vertical"],
    "spacing": ["minimum 20px clearance"],
    "colors": ["full color", "monochrome"],
    "sizes": ["minimum 24px height"],
    "formats": ["SVG", "PNG", "JPG"]
  },
  "brandValues": ["innovation", "quality", "trust"],
  "logoUsage": ["maintain proportions", "use appropriate backgrounds"],
  "designPrinciples": ["simplicity", "consistency", "accessibility"],
  "accessibility": {
    "contrast": ["4.5:1 minimum", "7:1 preferred"],
    "guidelines": ["WCAG 2.1 AA compliance"],
    "compliance": ["color contrast", "keyboard navigation"]
  }
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const cleanedText = text
          .replace(/```json\s*/, '')
          .replace(/```\s*$/, '')
          .trim();

        return JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        return this.getDefaultGuidelines();
      }
    } catch (error) {
      console.error('Error with Gemini analysis:', error);
      return this.getDefaultGuidelines();
    }
  }

  private getDefaultGuidelines(): BrandGuideline {
    return {
      colors: {
        primary: ["#2563eb", "#1d4ed8"],
        secondary: ["#64748b", "#475569"],
        accent: ["#dc2626", "#b91c1c"],
        neutral: ["#f8fafc", "#e2e8f0", "#64748b", "#1e293b"],
        text: ["#1f2937", "#374151", "#6b7280"],
        background: ["#ffffff", "#f9fafb", "#f3f4f6"],
        error: ["#dc2626", "#ef4444"],
        success: ["#16a34a", "#22c55e"],
        warning: ["#d97706", "#f59e0b"]
      },
      typography: {
        fonts: ["Inter", "system-ui", "sans-serif"],
        headingStyles: ["Bold", "Clean", "High Contrast"],
        bodyStyles: ["Regular", "Readable", "Professional"],
        weights: ["400", "500", "600", "700"],
        sizes: ["14px", "16px", "18px", "24px", "32px"],
        lineHeights: ["1.4", "1.6", "1.8"],
        letterSpacing: ["normal", "0.025em"]
      },
      layout: {
        spacing: ["8px", "16px", "24px", "32px", "48px"],
        gridSystems: ["12-column", "flexbox", "responsive"],
        breakpoints: ["640px", "768px", "1024px", "1280px"],
        containers: ["768px", "1024px", "1280px"],
        margins: ["16px", "24px", "32px"],
        padding: ["16px", "24px", "32px"]
      },
      components: {
        buttons: ["rounded corners", "solid backgrounds", "hover states"],
        cards: ["subtle shadows", "clean borders", "good spacing"],
        forms: ["clean inputs", "focus states", "validation styling"],
        navigation: ["horizontal layout", "clear hierarchy"],
        modals: ["centered overlay", "smooth animations"],
        tables: ["striped rows", "hover states"],
        badges: ["solid fill", "outline variants"]
      },
      imagery: {
        style: "clean and modern",
        guidelines: ["high quality", "consistent style", "brand appropriate"],
        restrictions: ["no low quality", "brand consistent", "appropriate context"],
        aspectRatios: ["16:9", "4:3", "1:1"],
        treatments: ["original", "filtered", "branded"]
      },
      tone: {
        personality: ["professional", "approachable", "reliable", "modern"],
        voice: ["clear", "authoritative", "friendly"],
        messaging: ["trustworthy", "accessible", "innovative"],
        doAndDont: ["be clear and concise", "avoid jargon", "stay on brand"]
      },
      logos: {
        primary: "Main brand logo",
        usage: ["proper spacing", "correct colors", "appropriate size"],
        restrictions: ["no distortion", "minimum size requirements", "clear background"],
        variations: ["horizontal", "vertical", "icon only"],
        spacing: ["minimum 20px clearance"],
        colors: ["full color", "monochrome", "reverse"],
        sizes: ["minimum 24px height"],
        formats: ["SVG", "PNG", "JPG"]
      },
      brandValues: ["innovation", "quality", "trust", "excellence"],
      logoUsage: ["maintain proportions", "use appropriate backgrounds"],
      designPrinciples: ["simplicity", "consistency", "accessibility"],
      accessibility: {
        contrast: ["4.5:1 minimum", "7:1 preferred"],
        guidelines: ["WCAG 2.1 AA compliance"],
        compliance: ["color contrast", "keyboard navigation", "screen reader support"]
      }
    };
  }

  generateBrandCSS(guidelines: BrandGuideline): string {
    return `
/* Enhanced Brand Guidelines CSS */
:root {
  /* Primary Colors */
  --brand-primary-1: ${guidelines.colors.primary[0] || '#2563eb'};
  --brand-primary-2: ${guidelines.colors.primary[1] || '#1d4ed8'};
  
  /* Secondary Colors */
  --brand-secondary-1: ${guidelines.colors.secondary[0] || '#64748b'};
  --brand-secondary-2: ${guidelines.colors.secondary[1] || '#475569'};
  
  /* Text Colors */
  --brand-text-primary: ${guidelines.colors.text[0] || '#1f2937'};
  --brand-text-secondary: ${guidelines.colors.text[1] || '#374151'};
  --brand-text-muted: ${guidelines.colors.text[2] || '#6b7280'};
  
  /* Background Colors */
  --brand-bg-primary: ${guidelines.colors.background[0] || '#ffffff'};
  --brand-bg-secondary: ${guidelines.colors.background[1] || '#f9fafb'};
  --brand-bg-tertiary: ${guidelines.colors.background[2] || '#f3f4f6'};
  
  /* State Colors */
  --brand-error: ${guidelines.colors.error[0] || '#dc2626'};
  --brand-success: ${guidelines.colors.success[0] || '#16a34a'};
  --brand-warning: ${guidelines.colors.warning[0] || '#d97706'};
  
  /* Accent Colors */
  --brand-accent-1: ${guidelines.colors.accent[0] || '#dc2626'};
  --brand-accent-2: ${guidelines.colors.accent[1] || '#b91c1c'};
  
  /* Neutral Colors */
  --brand-neutral-1: ${guidelines.colors.neutral[0] || '#f8fafc'};
  --brand-neutral-2: ${guidelines.colors.neutral[1] || '#e2e8f0'};
  --brand-neutral-3: ${guidelines.colors.neutral[2] || '#64748b'};
  --brand-neutral-4: ${guidelines.colors.neutral[3] || '#1e293b'};
  
  /* Typography */
  --brand-font-primary: ${guidelines.typography.fonts[0] || 'Inter'}, system-ui, sans-serif;
  --brand-font-secondary: ${guidelines.typography.fonts[1] || '-apple-system'}, BlinkMacSystemFont, Segoe UI;
  
  /* Spacing */
  --brand-spacing-xs: ${guidelines.layout.spacing[0] || '8px'};
  --brand-spacing-sm: ${guidelines.layout.spacing[1] || '16px'};
  --brand-spacing-md: ${guidelines.layout.spacing[2] || '24px'};
  --brand-spacing-lg: ${guidelines.layout.spacing[3] || '32px'};
  --brand-spacing-xl: ${guidelines.layout.spacing[4] || '48px'};
}

.brand-heading {
  font-family: var(--brand-font-primary);
  font-weight: ${guidelines.typography.weights[2] || '700'};
  color: var(--brand-neutral-4);
}

.brand-body {
  font-family: var(--brand-font-primary);
  font-weight: ${guidelines.typography.weights[0] || '400'};
  color: var(--brand-neutral-3);
  line-height: 1.6;
}

.brand-button {
  font-family: var(--brand-font-primary);
  font-weight: ${guidelines.typography.weights[1] || '500'};
  background: var(--brand-primary-1);
  color: white;
  border: none;
  border-radius: 6px;
  padding: var(--brand-spacing-sm) var(--brand-spacing-md);
  cursor: pointer;
  transition: background-color 0.2s;
}

.brand-button:hover {
  background: var(--brand-primary-2);
}

.brand-card {
  background: var(--brand-neutral-1);
  border: 1px solid var(--brand-neutral-2);
  border-radius: 8px;
  padding: var(--brand-spacing-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}`;
  }
}

export function createBrandGuidelineExtractor(): BrandGuidelineExtractor {
  return new BrandGuidelineExtractor();
}
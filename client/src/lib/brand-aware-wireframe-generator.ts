import { GoogleGenerativeAI } from "@google/generative-ai";
import { BrandGuideline } from "./brand-guideline-extractor";

export interface BrandedWireframeRequest {
  pageContent: any;
  designStyle: string;
  deviceType: string;
  brandGuidelines: BrandGuideline;
}

export interface BrandedWireframeResponse {
  html: string;
  css: string;
  brandNotes: string[];
}

export class BrandAwareWireframeGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateBrandedWireframe(request: BrandedWireframeRequest): Promise<BrandedWireframeResponse> {
    try {
      const prompt = this.buildBrandedPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseResponse(text, request.brandGuidelines);
    } catch (error) {
      console.error('Error generating branded wireframe:', error);
      throw new Error('Failed to generate branded wireframe');
    }
  }

  private buildBrandedPrompt(request: BrandedWireframeRequest): string {
    const { pageContent, designStyle, deviceType, brandGuidelines } = request;

    return `Generate a complete, production-ready wireframe that strictly follows the provided brand guidelines.

PAGE CONTENT:
${JSON.stringify(pageContent, null, 2)}

DESIGN STYLE: ${designStyle}
DEVICE TYPE: ${deviceType}

BRAND GUIDELINES TO FOLLOW:
Colors:
- Primary: ${brandGuidelines.colors.primary.join(', ')}
- Secondary: ${brandGuidelines.colors.secondary.join(', ')}
- Accent: ${brandGuidelines.colors.accent.join(', ')}
- Neutral: ${brandGuidelines.colors.neutral.join(', ')}

Typography:
- Fonts: ${brandGuidelines.typography.fonts.join(', ')}
- Heading Styles: ${brandGuidelines.typography.headingStyles.join(', ')}
- Body Styles: ${brandGuidelines.typography.bodyStyles.join(', ')}
- Weights: ${brandGuidelines.typography.weights.join(', ')}

Layout Guidelines:
- Spacing: ${brandGuidelines.layout.spacing.join(', ')}
- Grid Systems: ${brandGuidelines.layout.gridSystems.join(', ')}
- Breakpoints: ${brandGuidelines.layout.breakpoints.join(', ')}

Component Guidelines:
- Buttons: ${brandGuidelines.components.buttons.join(', ')}
- Cards: ${brandGuidelines.components.cards.join(', ')}
- Forms: ${brandGuidelines.components.forms.join(', ')}
- Navigation: ${brandGuidelines.components.navigation.join(', ')}

Imagery Style: ${brandGuidelines.imagery.style}
Brand Personality: ${brandGuidelines.tone.personality.join(', ')}
Brand Voice: ${brandGuidelines.tone.voice.join(', ')}

CRITICAL REQUIREMENTS:
1. Use ONLY the specified brand colors - no other colors allowed
2. Apply the exact typography fonts and weights specified
3. Follow the spacing system precisely
4. Implement component styles according to brand guidelines
5. Ensure the design reflects the brand personality and tone
6. Create a cohesive, professional wireframe that embodies the brand

RESPONSE FORMAT:
Return your response in this exact format:

===HTML===
[Complete HTML wireframe code here]
===CSS===
[Complete CSS styling here - must use brand colors, fonts, and spacing]
===BRAND_NOTES===
[List of specific brand guideline applications made]

HTML REQUIREMENTS:
- Complete, semantic HTML5 structure
- Responsive design for ${deviceType}
- All content from pageContent included
- Proper accessibility attributes
- Clean, production-ready code

CSS REQUIREMENTS:
- Use CSS custom properties for brand colors
- Apply brand fonts exactly as specified
- Follow brand spacing system
- Implement brand component styles
- Create hover and interactive states
- Mobile-responsive design
- Professional animations and transitions

BRAND APPLICATION NOTES:
Document how you applied each brand guideline element in the design.`;
  }

  private parseResponse(response: string, brandGuidelines: BrandGuideline): BrandedWireframeResponse {
    try {
      const htmlMatch = response.match(/===HTML===\s*([\s\S]*?)(?===CSS===)/);
      const cssMatch = response.match(/===CSS===\s*([\s\S]*?)(?===BRAND_NOTES===)/);
      const notesMatch = response.match(/===BRAND_NOTES===\s*([\s\S]*?)$/);

      let html = htmlMatch ? htmlMatch[1].trim() : '';
      let css = cssMatch ? cssMatch[1].trim() : '';
      const notesText = notesMatch ? notesMatch[1].trim() : '';

      // Clean up code blocks
      html = html.replace(/```html\s*|\s*```$/g, '').trim();
      css = css.replace(/```css\s*|\s*```$/g, '').trim();

      // Generate brand-specific CSS if not provided
      if (!css) {
        css = this.generateBrandCSS(brandGuidelines);
      }

      // Parse brand notes
      const brandNotes = notesText
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[•\-\*]\s*/, '').trim());

      return {
        html: html || this.generateFallbackHTML(),
        css: css || this.generateBrandCSS(brandGuidelines),
        brandNotes: brandNotes.length > 0 ? brandNotes : this.generateDefaultBrandNotes(brandGuidelines)
      };
    } catch (error) {
      console.error('Error parsing wireframe response:', error);
      
      return {
        html: this.generateFallbackHTML(),
        css: this.generateBrandCSS(brandGuidelines),
        brandNotes: this.generateDefaultBrandNotes(brandGuidelines)
      };
    }
  }

  private generateBrandCSS(guidelines: BrandGuideline): string {
    return `
/* Brand-Aware Wireframe Styles */
:root {
  /* Brand Colors */
  --brand-primary: ${guidelines.colors.primary[0] || '#007bff'};
  --brand-primary-light: ${guidelines.colors.primary[1] || '#6cb2eb'};
  --brand-secondary: ${guidelines.colors.secondary[0] || '#6c757d'};
  --brand-accent: ${guidelines.colors.accent[0] || '#28a745'};
  --brand-neutral-light: ${guidelines.colors.neutral[0] || '#f8f9fa'};
  --brand-neutral: ${guidelines.colors.neutral[1] || '#e9ecef'};
  --brand-neutral-dark: ${guidelines.colors.neutral[2] || '#6c757d'};
  
  /* Brand Typography */
  --brand-font-primary: '${guidelines.typography.fonts[0] || 'Arial'}', sans-serif;
  --brand-font-secondary: '${guidelines.typography.fonts[1] || 'Helvetica'}', sans-serif;
  --brand-weight-normal: ${guidelines.typography.weights[0] || '400'};
  --brand-weight-medium: ${guidelines.typography.weights[1] || '500'};
  --brand-weight-bold: ${guidelines.typography.weights[2] || '700'};
  
  /* Brand Spacing */
  --brand-space-xs: ${guidelines.layout.spacing[0] || '4px'};
  --brand-space-sm: ${guidelines.layout.spacing[1] || '8px'};
  --brand-space-md: ${guidelines.layout.spacing[2] || '16px'};
  --brand-space-lg: ${guidelines.layout.spacing[3] || '24px'};
  --brand-space-xl: ${guidelines.layout.spacing[4] || '32px'};
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--brand-font-primary);
  font-weight: var(--brand-weight-normal);
  line-height: 1.6;
  color: var(--brand-neutral-dark);
  background-color: var(--brand-neutral-light);
}

.wireframe-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--brand-space-md);
  background: white;
  min-height: 100vh;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Brand Headers */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--brand-font-primary);
  font-weight: var(--brand-weight-bold);
  color: var(--brand-primary);
  margin-bottom: var(--brand-space-md);
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.5rem; }

/* Brand Buttons */
.brand-button {
  background: var(--brand-primary);
  color: white;
  border: none;
  padding: var(--brand-space-sm) var(--brand-space-lg);
  border-radius: 6px;
  font-family: var(--brand-font-primary);
  font-weight: var(--brand-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.brand-button:hover {
  background: var(--brand-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.brand-button-secondary {
  background: var(--brand-secondary);
  color: white;
}

.brand-button-accent {
  background: var(--brand-accent);
  color: white;
}

/* Brand Cards */
.brand-card {
  background: white;
  border: 1px solid var(--brand-neutral);
  border-radius: 8px;
  padding: var(--brand-space-lg);
  margin-bottom: var(--brand-space-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.brand-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Brand Forms */
.brand-input, .brand-select, .brand-textarea {
  width: 100%;
  padding: var(--brand-space-sm);
  border: 2px solid var(--brand-neutral);
  border-radius: 4px;
  font-family: var(--brand-font-secondary);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.brand-input:focus, .brand-select:focus, .brand-textarea:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

/* Brand Navigation */
.brand-nav {
  background: var(--brand-primary);
  padding: var(--brand-space-md) 0;
  margin-bottom: var(--brand-space-lg);
}

.brand-nav ul {
  list-style: none;
  display: flex;
  justify-content: center;
  gap: var(--brand-space-lg);
}

.brand-nav a {
  color: white;
  text-decoration: none;
  font-weight: var(--brand-weight-medium);
  padding: var(--brand-space-sm) var(--brand-space-md);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.brand-nav a:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .wireframe-container {
    padding: var(--brand-space-sm);
  }
  
  .brand-nav ul {
    flex-direction: column;
    gap: var(--brand-space-sm);
  }
  
  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
}

/* Brand Grid System */
.brand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--brand-space-lg);
  margin: var(--brand-space-lg) 0;
}

.brand-flex {
  display: flex;
  gap: var(--brand-space-md);
  align-items: center;
}

/* Brand Utilities */
.brand-text-center { text-align: center; }
.brand-text-primary { color: var(--brand-primary); }
.brand-text-secondary { color: var(--brand-secondary); }
.brand-bg-light { background-color: var(--brand-neutral-light); }
.brand-shadow { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
.brand-rounded { border-radius: 8px; }
`;
  }

  private generateFallbackHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brand-Aware Wireframe</title>
</head>
<body>
    <div class="wireframe-container">
        <header class="brand-nav">
            <nav>
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </nav>
        </header>

        <main>
            <section class="hero brand-text-center">
                <h1>Welcome to Our Brand</h1>
                <p>Experience our brand-aligned design system</p>
                <button class="brand-button">Get Started</button>
            </section>

            <section class="content">
                <div class="brand-grid">
                    <div class="brand-card">
                        <h3>Feature One</h3>
                        <p>Description of the first key feature following brand guidelines.</p>
                        <button class="brand-button-accent">Learn More</button>
                    </div>
                    <div class="brand-card">
                        <h3>Feature Two</h3>
                        <p>Description of the second key feature with brand consistency.</p>
                        <button class="brand-button-accent">Learn More</button>
                    </div>
                </div>
            </section>
        </main>
    </div>
</body>
</html>`;
  }

  private generateDefaultBrandNotes(guidelines: BrandGuideline): string[] {
    return [
      `Applied primary brand color: ${guidelines.colors.primary[0]}`,
      `Used brand typography: ${guidelines.typography.fonts[0]}`,
      `Implemented brand spacing system: ${guidelines.layout.spacing.join(', ')}`,
      `Followed button guidelines: ${guidelines.components.buttons.join(', ')}`,
      `Reflected brand personality: ${guidelines.tone.personality.join(', ')}`
    ];
  }
}

export function createBrandAwareWireframeGenerator(): BrandAwareWireframeGenerator {
  return new BrandAwareWireframeGenerator();
}
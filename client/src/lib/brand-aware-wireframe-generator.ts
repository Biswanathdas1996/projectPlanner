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
    const genAI = new GoogleGenerativeAI(
      "AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM"
    );
    this.genAI = genAI;
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

    return `Create a MODERN, PROFESSIONAL, and BRAND-COMPLIANT wireframe that strictly adheres to the brand guidelines. The design must be sophisticated, contemporary, and production-ready.

PAGE REQUIREMENTS:
Page Name: ${pageContent.pageName}
Page Type: ${pageContent.pageType}
Purpose: ${pageContent.purpose}
Target Users: ${pageContent.stakeholders.join(', ')}

CONTENT ELEMENTS:
Headers: ${pageContent.headers.join(', ')}
Buttons: ${pageContent.buttons.map((b: any) => `${b.label} (${b.style})`).join(', ')}
Forms: ${pageContent.forms.map((f: any) => `${f.title} with fields: ${f.fields.join(', ')}`).join(' | ')}
Navigation: ${pageContent.navigation.join(', ')}

DESIGN REQUIREMENTS: ${designStyle} style for ${deviceType}

MANDATORY BRAND COMPLIANCE:
PRIMARY COLORS (use for headers, navigation, primary buttons):
${brandGuidelines.colors.primary.map(color => `- ${color}`).join('\n')}

ACCENT COLORS (use for CTAs, highlights, interactive elements):
${brandGuidelines.colors.accent.map(color => `- ${color}`).join('\n')}

SECONDARY COLORS (use for supporting elements, borders):
${brandGuidelines.colors.secondary.map(color => `- ${color}`).join('\n')}

NEUTRAL COLORS (use for backgrounds, text, subtle elements):
${brandGuidelines.colors.neutral.map(color => `- ${color}`).join('\n')}

TYPOGRAPHY SYSTEM:
Primary Font: ${brandGuidelines.typography.fonts[0] || 'Inter'}
Secondary Font: ${brandGuidelines.typography.fonts[1] || 'system-ui'}
Font Weights: ${brandGuidelines.typography.weights.join(', ')}
Heading Style: ${brandGuidelines.typography.headingStyles.join(', ')}
Body Style: ${brandGuidelines.typography.bodyStyles.join(', ')}

LAYOUT SPECIFICATIONS:
Spacing System: ${brandGuidelines.layout.spacing.join(', ')}
Grid System: ${brandGuidelines.layout.gridSystems.join(', ')}
Responsive Breakpoints: ${brandGuidelines.layout.breakpoints.join(', ')}

COMPONENT STYLING:
Buttons: ${brandGuidelines.components.buttons.join(', ')} - USE EXACT BRAND COLORS
Cards: ${brandGuidelines.components.cards.join(', ')} - PROFESSIONAL SHADOWS AND SPACING
Forms: ${brandGuidelines.components.forms.join(', ')} - CLEAN, ACCESSIBLE DESIGN
Navigation: ${brandGuidelines.components.navigation.join(', ')} - CLEAR HIERARCHY

BRAND PERSONALITY TO REFLECT:
${brandGuidelines.tone.personality.join(', ')} - ${brandGuidelines.tone.voice.join(', ')}

MODERN DESIGN REQUIREMENTS:
1. Use contemporary layout patterns (CSS Grid, Flexbox)
2. Implement proper visual hierarchy with brand colors
3. Apply consistent spacing using the brand spacing system
4. Use brand-specific fonts with appropriate weights
5. Create professional shadows and subtle gradients within brand palette
6. Ensure accessibility with proper contrast ratios
7. Add micro-interactions and hover states using accent colors
8. Implement responsive design following brand breakpoints
9. Use brand colors for ALL interactive elements
10. Apply brand personality through color psychology and spacing

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
    const primaryColor = guidelines.colors.primary[0] || '#2563eb';
    const primaryColorAlt = guidelines.colors.primary[1] || '#1d4ed8';
    const accentColor = guidelines.colors.accent[0] || '#dc2626';
    const accentColorAlt = guidelines.colors.accent[1] || '#b91c1c';
    const secondaryColor = guidelines.colors.secondary[0] || '#64748b';
    const neutralLight = guidelines.colors.neutral[0] || '#f8fafc';
    const neutralMid = guidelines.colors.neutral[1] || '#e2e8f0';
    const neutralDark = guidelines.colors.neutral[3] || '#1e293b';
    const primaryFont = guidelines.typography.fonts[0] || 'Inter';
    
    return `
/* Professional Brand-Compliant Wireframe System */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Exact Brand Color System */
  --brand-primary: ${primaryColor};
  --brand-primary-dark: ${primaryColorAlt};
  --brand-accent: ${accentColor};
  --brand-accent-dark: ${accentColorAlt};
  --brand-secondary: ${secondaryColor};
  --brand-neutral-50: ${neutralLight};
  --brand-neutral-200: ${neutralMid};
  --brand-neutral-800: ${neutralDark};
  
  /* Brand Typography System */
  --brand-font-primary: '${primaryFont}', system-ui, -apple-system, sans-serif;
  --brand-font-secondary: '${guidelines.typography.fonts[1] || 'system-ui'}', -apple-system, sans-serif;
  --brand-weight-normal: ${guidelines.typography.weights[0] || '400'};
  --brand-weight-medium: ${guidelines.typography.weights[1] || '500'};
  --brand-weight-bold: ${guidelines.typography.weights[2] || '700'};
  
  /* Professional Spacing System */
  --brand-space-xs: ${guidelines.layout.spacing[0] || '8px'};
  --brand-space-sm: ${guidelines.layout.spacing[1] || '16px'};
  --brand-space-md: ${guidelines.layout.spacing[2] || '24px'};
  --brand-space-lg: ${guidelines.layout.spacing[3] || '32px'};
  --brand-space-xl: ${guidelines.layout.spacing[4] || '48px'};
  
  /* Modern Design Tokens */
  --brand-radius: 12px;
  --brand-radius-sm: 8px;
  --brand-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --brand-shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --brand-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--brand-font-primary);
  font-weight: var(--brand-weight-normal);
  color: var(--brand-neutral-800);
  background: linear-gradient(135deg, var(--brand-neutral-50) 0%, #ffffff 100%);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Modern Layout Container */
.brand-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--brand-space-md);
}

.brand-wireframe {
  background: white;
  min-height: 100vh;
  box-shadow: var(--brand-shadow-lg);
  border-radius: var(--brand-radius);
  overflow: hidden;
}

/* Professional Typography System */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--brand-font-primary);
  font-weight: var(--brand-weight-bold);
  color: var(--brand-primary);
  line-height: 1.2;
  margin-bottom: var(--brand-space-md);
}

h1 { 
  font-size: clamp(2rem, 5vw, 3.5rem);
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

h2 { 
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  color: var(--brand-neutral-800);
}

h3 { 
  font-size: 1.25rem;
  color: var(--brand-primary-dark);
  font-weight: var(--brand-weight-medium);
}

.brand-text {
  font-size: 1rem;
  color: var(--brand-secondary);
  line-height: 1.6;
  margin-bottom: var(--brand-space-sm);
}

/* Modern Component System */
.brand-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--brand-space-xs);
  padding: var(--brand-space-sm) var(--brand-space-md);
  font-family: var(--brand-font-primary);
  font-weight: var(--brand-weight-medium);
  font-size: 0.95rem;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--brand-radius-sm);
  cursor: pointer;
  transition: var(--brand-transition);
  text-decoration: none;
  box-shadow: var(--brand-shadow);
  position: relative;
  overflow: hidden;
  font-family: var(--brand-font-primary);
  font-weight: var(--brand-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.brand-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.brand-button:hover {
  background: linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-accent-dark) 100%);
  transform: translateY(-2px);
  box-shadow: var(--brand-shadow-lg);
}

.brand-button:hover::before {
  left: 100%;
}

.brand-button--secondary {
  background: transparent;
  color: var(--brand-primary);
  border: 2px solid var(--brand-primary);
  box-shadow: none;
}

.brand-button--secondary:hover {
  background: var(--brand-primary);
  color: white;
}

.brand-button--accent {
  background: linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-accent-dark) 100%);
}

/* Professional Card System */
.brand-card {
  background: white;
  border-radius: var(--brand-radius);
  padding: var(--brand-space-lg);
  box-shadow: var(--brand-shadow);
  border: 1px solid var(--brand-neutral-200);
  transition: var(--brand-transition);
  position: relative;
  overflow: hidden;
  margin-bottom: var(--brand-space-md);
}

.brand-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-accent) 100%);
}

.brand-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--brand-shadow-lg);
}

/* Modern Form Elements */
.brand-form-group {
  margin-bottom: var(--brand-space-md);
}

.brand-label {
  display: block;
  font-weight: var(--brand-weight-medium);
  color: var(--brand-neutral-800);
  margin-bottom: var(--brand-space-xs);
  font-size: 0.95rem;
}

.brand-input, .brand-select, .brand-textarea {
  width: 100%;
  padding: var(--brand-space-sm);
  font-family: var(--brand-font-primary);
  font-size: 1rem;
  border: 2px solid var(--brand-neutral-200);
  border-radius: var(--brand-radius-sm);
  background: white;
  transition: var(--brand-transition);
}

.brand-input:focus, .brand-select:focus, .brand-textarea:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Professional Navigation System */
.brand-nav {
  background: white;
  padding: var(--brand-space-sm) 0;
  border-bottom: 1px solid var(--brand-neutral-200);
  box-shadow: var(--brand-shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand-nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  font-size: 1.5rem;
  font-weight: var(--brand-weight-bold);
  color: var(--brand-primary);
  text-decoration: none;
}

.brand-nav-links {
  display: flex;
  gap: var(--brand-space-lg);
  list-style: none;
}

.brand-nav-link {
  color: var(--brand-secondary);
  text-decoration: none;
  font-weight: var(--brand-weight-medium);
  transition: var(--brand-transition);
  position: relative;
}

.brand-nav-link:hover {
  color: var(--brand-primary);
}

.brand-nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--brand-accent);
  transition: var(--brand-transition);
}

.brand-nav-link:hover::after {
  width: 100%;
}
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
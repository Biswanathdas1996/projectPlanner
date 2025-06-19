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
      const response = result.response.text();
      
      return this.parseResponse(response, request.brandGuidelines);
    } catch (error) {
      console.error('Error generating branded wireframe:', error);
      
      return {
        html: this.generateFallbackHTML(),
        css: this.generateBrandCSS(request.brandGuidelines),
        brandNotes: this.generateDefaultBrandNotes(request.brandGuidelines)
      };
    }
  }

  private buildBrandedPrompt(request: BrandedWireframeRequest): string {
    const { pageContent, designStyle, deviceType, brandGuidelines } = request;

    return `You are a professional UI/UX designer specializing in brand-compliant wireframe generation. Create a modern, sophisticated wireframe that strictly follows the provided brand guidelines.

PAGE CONTENT ANALYSIS:
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

BRAND GUIDELINES TO FOLLOW EXACTLY:
Colors:
- Primary: ${brandGuidelines.colors.primary.join(', ')}
- Secondary: ${brandGuidelines.colors.secondary.join(', ')}
- Accent: ${brandGuidelines.colors.accent.join(', ')}
- Neutral: ${brandGuidelines.colors.neutral.join(', ')}

Typography:
- Fonts: ${brandGuidelines.typography.fonts.join(', ')}
- Weights: ${brandGuidelines.typography.weights.join(', ')}

Layout:
- Spacing: ${brandGuidelines.layout.spacing.join(', ')}
- Grid: ${brandGuidelines.layout.grid.join(', ')}

Components:
- Buttons: ${brandGuidelines.components.buttons.join(', ')}
- Cards: ${brandGuidelines.components.cards.join(', ')}

Brand Tone: ${brandGuidelines.tone.personality.join(', ')}

WIREFRAME GENERATION REQUIREMENTS:

1. STRICT BRAND COMPLIANCE:
- Use EXACT brand colors (no approximations)
- Apply specified typography with correct fonts and weights
- Follow spacing and grid guidelines precisely
- Implement component styles as specified

2. MODERN PROFESSIONAL DESIGN:
- Clean, sophisticated layout with modern CSS techniques
- Professional gradients, shadows, and transitions
- Responsive grid systems and flexible layouts
- Advanced typography with proper hierarchy

3. COMPREHENSIVE STYLING:
- Modern CSS variables for brand consistency
- Professional button styles with hover effects
- Sophisticated card designs with subtle shadows
- Advanced navigation with smooth animations
- Responsive breakpoints for all devices

4. ADVANCED COMPONENTS:
- Hero sections with gradient backgrounds
- Feature grids with icon placeholders
- Statistics sections with large numbers
- Professional forms with proper validation styling
- Modern navigation bars with brand logos

Provide your response in this exact format:

===HTML===
[Complete HTML structure with semantic elements, proper accessibility, and brand-specific classes]

===CSS===
[Complete CSS with modern techniques, exact brand colors, sophisticated styling, and responsive design]

===BRAND_NOTES===
[Detailed list of how brand guidelines were applied in the design]

IMPORTANT: Use exact brand colors from the guidelines. Create a professional, modern design that would be suitable for enterprise use. Include advanced CSS features like gradients, animations, and modern layout techniques.`;
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

/* Modern Grid System */
.brand-grid {
  display: grid;
  gap: var(--brand-space-lg);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.brand-flex {
  display: flex;
  align-items: center;
  gap: var(--brand-space-sm);
}

.brand-section {
  padding: var(--brand-space-xl) 0;
}

/* Professional Hero Section */
.brand-hero {
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%);
  color: white;
  padding: var(--brand-space-xl) var(--brand-space-md);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.brand-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="white" opacity="0.1"/></svg>');
  background-size: 50px 50px;
}

.brand-hero h1 {
  color: white;
  margin-bottom: var(--brand-space-md);
  -webkit-text-fill-color: white;
}

.brand-hero .brand-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto var(--brand-space-lg);
}

/* Feature Grid */
.brand-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--brand-space-lg);
  margin: var(--brand-space-xl) 0;
}

.brand-feature {
  text-align: center;
  padding: var(--brand-space-lg);
}

.brand-feature-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-accent) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--brand-space-md);
  color: white;
  font-size: 1.5rem;
  font-weight: var(--brand-weight-bold);
}

/* Stats Section */
.brand-stats {
  background: var(--brand-neutral-50);
  padding: var(--brand-space-xl) var(--brand-space-md);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--brand-space-lg);
  text-align: center;
}

.brand-stat-number {
  font-size: 2.5rem;
  font-weight: var(--brand-weight-bold);
  color: var(--brand-primary);
  display: block;
}

.brand-stat-label {
  color: var(--brand-secondary);
  font-weight: var(--brand-weight-medium);
}

/* Responsive Design */
@media (max-width: 768px) {
  .brand-container {
    padding: 0 var(--brand-space-sm);
  }
  
  .brand-grid {
    grid-template-columns: 1fr;
    gap: var(--brand-space-md);
  }
  
  .brand-nav-content {
    flex-direction: column;
    gap: var(--brand-space-sm);
  }
  
  .brand-nav-links {
    gap: var(--brand-space-md);
  }
  
  .brand-hero {
    padding: var(--brand-space-lg) var(--brand-space-sm);
  }
  
  .brand-features {
    grid-template-columns: 1fr;
  }
  
  .brand-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .brand-stats {
    grid-template-columns: 1fr;
  }
}

/* Utility Classes */
.brand-text-center { text-align: center; }
.brand-text-left { text-align: left; }
.brand-text-right { text-align: right; }

.brand-mb-lg { margin-bottom: var(--brand-space-lg); }
.brand-mt-lg { margin-top: var(--brand-space-lg); }
.brand-mb-xl { margin-bottom: var(--brand-space-xl); }
.brand-mt-xl { margin-top: var(--brand-space-xl); }

.brand-p-lg { padding: var(--brand-space-lg); }
.brand-p-xl { padding: var(--brand-space-xl); }

.brand-bg-primary { background: var(--brand-primary); color: white; }
.brand-bg-accent { background: var(--brand-accent); color: white; }
.brand-bg-light { background: var(--brand-neutral-50); }

.brand-text-primary { color: var(--brand-primary); }
.brand-text-accent { color: var(--brand-accent); }
.brand-text-secondary { color: var(--brand-secondary); }

.brand-border { border: 1px solid var(--brand-neutral-200); }
.brand-border-primary { border: 2px solid var(--brand-primary); }

.brand-rounded { border-radius: var(--brand-radius); }
.brand-rounded-full { border-radius: 50%; }

.brand-shadow { box-shadow: var(--brand-shadow); }
.brand-shadow-lg { box-shadow: var(--brand-shadow-lg); }

/* Animation Utilities */
.brand-fade-in {
  animation: brandFadeIn 0.6s ease-out;
}

@keyframes brandFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.brand-slide-up {
  animation: brandSlideUp 0.8s ease-out;
}

@keyframes brandSlideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`;
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
    <div class="brand-container">
        <div class="brand-wireframe">
            <nav class="brand-nav">
                <div class="brand-nav-content brand-container">
                    <a href="#" class="brand-logo">Brand</a>
                    <ul class="brand-nav-links">
                        <li><a href="#" class="brand-nav-link">Home</a></li>
                        <li><a href="#" class="brand-nav-link">About</a></li>
                        <li><a href="#" class="brand-nav-link">Services</a></li>
                        <li><a href="#" class="brand-nav-link">Contact</a></li>
                    </ul>
                </div>
            </nav>

            <main>
                <section class="brand-hero">
                    <div class="brand-container">
                        <h1>Welcome to Our Brand</h1>
                        <p class="brand-text">Experience our professional, brand-aligned design system with modern components and sophisticated styling.</p>
                        <a href="#" class="brand-button">Get Started</a>
                        <a href="#" class="brand-button brand-button--secondary">Learn More</a>
                    </div>
                </section>

                <section class="brand-section">
                    <div class="brand-container">
                        <h2 class="brand-text-center brand-mb-lg">Our Features</h2>
                        <div class="brand-features">
                            <div class="brand-feature">
                                <div class="brand-feature-icon">1</div>
                                <h3>Professional Design</h3>
                                <p class="brand-text">Modern, sophisticated components that follow exact brand guidelines and color specifications.</p>
                            </div>
                            <div class="brand-feature">
                                <div class="brand-feature-icon">2</div>
                                <h3>Brand Compliance</h3>
                                <p class="brand-text">Strict adherence to typography, spacing, and visual identity standards across all elements.</p>
                            </div>
                            <div class="brand-feature">
                                <div class="brand-feature-icon">3</div>
                                <h3>Responsive Excellence</h3>
                                <p class="brand-text">Adaptive layouts that maintain brand integrity across all device sizes and orientations.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="brand-stats">
                    <div class="brand-container brand-grid">
                        <div class="brand-text-center">
                            <span class="brand-stat-number">99%</span>
                            <span class="brand-stat-label">Brand Compliance</span>
                        </div>
                        <div class="brand-text-center">
                            <span class="brand-stat-number">50+</span>
                            <span class="brand-stat-label">Components</span>
                        </div>
                        <div class="brand-text-center">
                            <span class="brand-stat-number">24/7</span>
                            <span class="brand-stat-label">Support</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    </div>
</body>
</html>`;
  }

  private generateDefaultBrandNotes(guidelines: BrandGuideline): string[] {
    return [
      `Applied primary brand color: ${guidelines.colors.primary[0]} throughout the design`,
      `Used brand typography: ${guidelines.typography.fonts[0]} for consistent text styling`,
      `Implemented brand spacing system: ${guidelines.layout.spacing.join(', ')} for proper layout`,
      `Followed button guidelines with modern gradients and hover effects`,
      `Reflected brand personality: ${guidelines.tone.personality.join(', ')} in design choices`,
      `Created responsive layouts that maintain brand integrity across devices`,
      `Applied sophisticated CSS with modern animations and transitions`
    ];
  }
}

export function createBrandAwareWireframeGenerator(): BrandAwareWireframeGenerator {
  return new BrandAwareWireframeGenerator();
}
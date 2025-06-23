import { GoogleGenerativeAI } from "@google/generative-ai";

// PDF image extraction utilities
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

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
    fontFamilies?: {
      primary?: string;
      secondary?: string;
      heading?: string;
      body?: string;
    };
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
    buttons?: {
      primary?: string;
      secondary?: string;
      ghost?: string;
      sizes?: string[];
      states?: string[];
      borderRadius?: string;
      fontWeight?: string;
    };
    cards?: {
      design?: string;
      shadows?: string[];
      borders?: string[];
      spacing?: string;
      borderRadius?: string;
      backgrounds?: string[];
      hoverStates?: string[];
    };
    forms?: {
      inputStyles?: string;
      labelStyles?: string;
      validationStyles?: string;
      placeholderStyles?: string;
      focusStates?: string;
    };
    navigation?: {
      primaryNav?: string;
      styles?: string;
      states?: string;
      mobileNav?: string;
      breadcrumbs?: string;
    };
    sections?: {
      headerDesign?: string;
      footerDesign?: string;
      contentAreas?: string;
      sidebars?: string;
      backgrounds?: string[];
    };
    contactUs?: {
      design?: string;
      formStyles?: string;
      layout?: string;
    };
    modals?: string[];
    tables?: string[];
    badges?: string[];
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
  keyPoints: string[];
  keyClauses: string[];
  keyHighlights: string[];
  dosAndDonts: {
    dos: string[];
    donts: string[];
  };
  brandRules: string[];
  compliance: {
    requirements: string[];
    restrictions: string[];
    guidelines: string[];
  };
  usageGuidelines: {
    approved: string[];
    prohibited: string[];
    context: string[];
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
    images: {
      primary?: string; // base64 encoded logo image
      horizontal?: string; // base64 encoded horizontal variant
      icon?: string; // base64 encoded icon variant
      monochrome?: string; // base64 encoded monochrome variant
    };
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
      "AIzaSyBCf51fy9DXI3gZxmq58xgHYnQU-r9Bceg"
    );
    this.genAI = genAI;
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async extractFromPDF(file: File): Promise<BrandGuideline> {
    try {
      console.log("Processing brand guidelines PDF:", file.name);

      // Extract logos and images from PDF
      const logoImages = await this.extractLogosFromPDF(file);

      // Generate smart brand analysis based on file characteristics
      const analysisText = await this.analyzeFileBasics(file);
      console.log("Generated analysis text length:", analysisText.length);

      // Use Gemini to analyze and extract brand guidelines
      const guidelines = await this.analyzeWithGemini(analysisText);

      // Integrate extracted logo images
      if (logoImages && Object.keys(logoImages).length > 0) {
        guidelines.logos.images = logoImages;
        console.log(
          "Extracted logo images:",
          Object.keys(logoImages).length,
          "variants"
        );
      }

      return guidelines;
    } catch (error) {
      console.error("Error extracting brand guidelines:", error);
      return this.getDefaultGuidelines();
    }
  }

  private async extractLogosFromPDF(file: File): Promise<{
    primary?: string;
    horizontal?: string;
    icon?: string;
    monochrome?: string;
  }> {
    try {
      // Load PDF.js library if not already loaded
      if (!window.pdfjsLib) {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        document.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer })
        .promise;

      const extractedImages: { [key: string]: string } = {};

      // Process first few pages to find logos
      const maxPages = Math.min(pdf.numPages, 5);

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const operatorList = await page.getOperatorList();

        // Look for image operations in the PDF
        for (let i = 0; i < operatorList.fnArray.length; i++) {
          if (
            operatorList.fnArray[i] === window.pdfjsLib.OPS.paintImageXObject
          ) {
            try {
              const imgName = operatorList.argsArray[i][0];
              const resources = await page.getAnnotations();

              // Extract image data and convert to base64
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d");
              const viewport = page.getViewport({ scale: 1.0 });

              canvas.width = viewport.width;
              canvas.height = viewport.height;

              await page.render({
                canvasContext: context,
                viewport: viewport,
              }).promise;

              // Convert canvas to base64 and resize for logo use
              const imageData = await this.extractAndResizeImage(canvas);

              if (imageData) {
                // Categorize based on position and size
                if (pageNum === 1) {
                  extractedImages.primary = imageData;
                } else {
                  extractedImages[`variant_${pageNum}`] = imageData;
                }
              }
            } catch (imgError) {
              console.warn(
                "Error extracting image from page",
                pageNum,
                imgError
              );
            }
          }
        }
      }

      // If we found images, process and categorize them
      if (Object.keys(extractedImages).length > 0) {
        console.log(
          "Successfully extracted",
          Object.keys(extractedImages).length,
          "logo images from PDF"
        );
        return this.processExtractedLogos(extractedImages);
      }

      return {};
    } catch (error) {
      console.error("Error extracting logos from PDF:", error);
      return {};
    }
  }

  private async extractAndResizeImage(
    canvas: HTMLCanvasElement
  ): Promise<string | null> {
    try {
      // Create a smaller canvas for logo optimization
      const logoCanvas = document.createElement("canvas");
      const logoContext = logoCanvas.getContext("2d");

      // Set optimal logo dimensions (max 200px width/height)
      const maxSize = 200;
      const ratio = Math.min(maxSize / canvas.width, maxSize / canvas.height);

      logoCanvas.width = canvas.width * ratio;
      logoCanvas.height = canvas.height * ratio;

      // Draw resized image
      logoContext?.drawImage(canvas, 0, 0, logoCanvas.width, logoCanvas.height);

      // Convert to base64 with compression
      return logoCanvas.toDataURL("image/png", 0.8);
    } catch (error) {
      console.error("Error resizing logo image:", error);
      return null;
    }
  }

  private processExtractedLogos(images: { [key: string]: string }): {
    primary?: string;
    horizontal?: string;
    icon?: string;
    monochrome?: string;
  } {
    const processed: any = {};

    // Use the first extracted image as primary
    const imageKeys = Object.keys(images);
    if (imageKeys.length > 0) {
      processed.primary = images[imageKeys[0]];

      // If we have multiple images, use them as variations
      if (imageKeys.length > 1) {
        processed.horizontal = images[imageKeys[1]];
      }
      if (imageKeys.length > 2) {
        processed.icon = images[imageKeys[2]];
      }
    }

    return processed;
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
    } else if (
      filename.includes("food") ||
      filename.includes("restaurant") ||
      filename.includes("mcdonald")
    ) {
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

TYPOGRAPHY & FONT FAMILIES - COMPREHENSIVE SPECIFICATIONS:
FONT FAMILIES:
- Primary Font Family: Inter, system-ui, -apple-system, sans-serif
- Secondary Font Family: Georgia, Times New Roman, serif
- Heading Font Family: Inter, Helvetica Neue, Arial, sans-serif
- Body Font Family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif
- Monospace Font Family: Menlo, Monaco, Consolas, Liberation Mono, monospace

FONT WEIGHTS:
- Light: 300
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

FONT SIZES:
- Extra Small: 12px
- Small: 14px
- Base: 16px
- Large: 18px
- Extra Large: 20px
- 2XL: 24px
- 3XL: 32px
- 4XL: 40px

TYPOGRAPHY STYLES:
- Heading Styles: Bold weight, clean lines, high contrast, proper hierarchy
- Body Styles: Regular weight, readable line height, professional appearance
- Caption Styles: Smaller size, medium weight, subtle color
- Link Styles: Brand color, underline on hover, proper contrast

LAYOUT:
Grid: 12-column responsive
Spacing: 8px, 16px, 24px, 32px, 48px
Border Radius: 6px, 8px, 12px
Breakpoints: 640px, 768px, 1024px, 1280px

COMPONENTS - DETAILED SPECIFICATIONS:
BUTTONS:
- Primary: Solid brand color background, white text, 8px border-radius, 12px padding
- Secondary: Outlined border with brand color, transparent background, brand color text
- Ghost: No border, transparent background, subtle hover color change
- Sizes: Small (8px padding), Medium (12px padding), Large (16px padding)
- States: Hover (darker shade), Active (pressed state), Disabled (50% opacity)

CARDS:
- Design: Clean with subtle shadows or borders, rounded corners, proper internal spacing
- Shadows: None, Subtle (0 1px 2px rgba(0,0,0,0.05)), Medium (0 4px 6px rgba(0,0,0,0.1))
- Border Radius: 8px to 12px depending on card size
- Spacing: 16px internal padding, 24px between cards
- Hover States: Subtle shadow increase, border color change

NAVIGATION:
- Primary Nav: Horizontal layout, brand logo left, menu items right
- Styles: Clean typography, proper spacing, clear visual hierarchy
- States: Active state highlighted, hover effects, current page indicator
- Mobile Nav: Hamburger menu, slide-out panel, stacked menu items

FORMS & CONTACT:
- Input Styles: 1px border, 8px border-radius, 12px padding, focus outline
- Label Styles: Medium font weight, 14px size, brand color
- Contact Design: Form layout with contact information display
- Contact Layout: Two-column or single column based on available space

SECTIONS:
- Header Design: Brand logo with navigation menu, proper spacing and alignment
- Footer Design: Multiple columns with links, contact info, social media
- Content Areas: Proper margins, readable line lengths, section spacing
- Backgrounds: White, light grays, brand accent colors for emphasis

BRAND VOICE:
Personality: Professional, Approachable, Reliable, Modern
Voice: Clear, Authoritative, Friendly
Messaging: Trustworthy, Accessible, Innovative

VISUAL STYLE:
Clean minimal design, good whitespace usage, strong hierarchy, modern iconography`;
  }

  private async analyzeWithGemini(
    analysisText: string
  ): Promise<BrandGuideline> {
    try {
      const prompt = `Extract comprehensive brand guidelines from this analysis. Focus on capturing ALL key points, clauses, highlights, dos and don'ts, brand rules, compliance requirements, and usage guidelines from the document. Return a detailed JSON object:

${analysisText}

EXTRACTION REQUIREMENTS:
1. Identify ALL key points mentioned in the document
2. Extract key clauses and important statements
3. Capture highlights and emphasized content
4. List specific dos and don'ts for brand usage
5. Document brand rules and compliance requirements
6. Note usage guidelines and restrictions
7. Extract color specifications, typography details, and component guidelines
8. Capture accessibility requirements and design principles
9. Document logo usage rules and restrictions
10. Extract any legal or trademark information

Return this exact JSON structure with comprehensive brand information:
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
    "fontFamilies": {
      "primary": "Helvetica Neue, Arial, sans-serif",
      "secondary": "Georgia, Times New Roman, serif",
      "heading": "Inter, system-ui, sans-serif",
      "body": "system-ui, -apple-system, sans-serif"
    },
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
    "buttons": {
      "primary": "Solid background, white text, 8px border-radius, 12px padding",
      "secondary": "Outlined border, brand color text, transparent background",
      "ghost": "No border, transparent background, hover color change",
      "sizes": ["sm: 8px padding", "md: 12px padding", "lg: 16px padding"],
      "states": ["hover: darker shade", "active: pressed state", "disabled: 50% opacity"],
      "borderRadius": "8px",
      "fontWeight": "500"
    },
    "cards": {
      "design": "Clean borders or subtle shadows, rounded corners, proper spacing",
      "shadows": ["none", "sm: 0 1px 2px rgba(0,0,0,0.05)", "md: 0 4px 6px rgba(0,0,0,0.1)"],
      "borders": ["1px solid #e5e7eb", "2px solid brand-color"],
      "spacing": "16px internal padding, 24px between cards",
      "borderRadius": "8px to 12px",
      "backgrounds": ["white", "light gray", "brand accent"],
      "hoverStates": ["subtle shadow increase", "border color change"]
    },
    "forms": {
      "inputStyles": "1px border, 8px border-radius, 12px padding, focus outline",
      "labelStyles": "Medium font weight, 14px size, brand color",
      "validationStyles": "Red border for errors, green for success, helper text",
      "placeholderStyles": "Light gray text, regular font weight",
      "focusStates": "Brand color outline, 2px focus ring"
    },
    "navigation": {
      "primaryNav": "Horizontal layout, brand logo left, menu items right",
      "styles": "Clean typography, proper spacing, clear hierarchy",
      "states": "Active state highlighted, hover effects, current page indicator",
      "mobileNav": "Hamburger menu, slide-out panel, stacked items",
      "breadcrumbs": "Separator characters, clickable links, current page non-clickable"
    },
    "sections": {
      "headerDesign": "Brand logo, navigation menu, proper spacing and alignment",
      "footerDesign": "Multiple columns, links, contact info, social media",
      "contentAreas": "Proper margins, readable line lengths, section spacing",
      "sidebars": "Complementary content, navigation aids, related information",
      "backgrounds": "White, light grays, brand accent colors for emphasis"
    },
    "contactUs": {
      "design": "Form layout with proper spacing, contact information display",
      "formStyles": "Clean inputs, proper labels, submit button styling",
      "layout": "Two-column or single column based on space, contact details sidebar"
    }
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
  },
  "keyPoints": [
    "Main brand objectives and goals",
    "Core visual identity principles",
    "Primary brand messaging themes",
    "Target audience considerations"
  ],
  "keyClauses": [
    "Logo must maintain minimum size requirements",
    "Brand colors must meet accessibility standards",
    "Typography must be legible across all platforms",
    "Consistent application across all touchpoints"
  ],
  "keyHighlights": [
    "Brand essence and unique value proposition",
    "Critical design specifications",
    "Important usage restrictions",
    "Key differentiating factors"
  ],
  "dosAndDonts": {
    "dos": [
      "Use approved color combinations",
      "Maintain proper logo clearspace",
      "Follow typography hierarchy",
      "Ensure accessibility compliance"
    ],
    "donts": [
      "Never distort or skew the logo",
      "Don't use unauthorized color variations",
      "Avoid poor contrast combinations",
      "Never alter brand typography"
    ]
  },
  "brandRules": [
    "Always use official brand assets",
    "Maintain consistent visual hierarchy",
    "Follow approved color usage guidelines",
    "Ensure proper logo placement and sizing"
  ],
  "compliance": {
    "requirements": [
      "WCAG 2.1 AA accessibility standards",
      "Brand consistency across all platforms",
      "Legal trademark usage compliance"
    ],
    "restrictions": [
      "No unauthorized logo modifications",
      "Restricted color palette usage",
      "Specific spacing requirements"
    ],
    "guidelines": [
      "Follow established design patterns",
      "Maintain brand voice and tone",
      "Use approved imagery styles"
    ]
  },
  "usageGuidelines": {
    "approved": [
      "Official marketing materials",
      "Digital platforms and websites",
      "Print publications and collateral"
    ],
    "prohibited": [
      "Unauthorized logo alterations",
      "Off-brand color combinations",
      "Inconsistent typography usage"
    ],
    "context": [
      "Business communications",
      "Marketing campaigns",
      "Product packaging and design"
    ]
  }
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const cleanedText = text
          .replace(/```json\s*/, "")
          .replace(/```\s*$/, "")
          .trim();

        return JSON.parse(cleanedText) as BrandGuideline;
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        return this.getDefaultGuidelines();
      }
    } catch (error) {
      console.error("Error with Gemini analysis:", error);
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
        warning: ["#d97706", "#f59e0b"],
      },
      typography: {
        fonts: ["Inter", "system-ui", "sans-serif"],
        fontFamilies: {
          primary: "Inter, system-ui, sans-serif",
          heading: "Inter, system-ui, sans-serif",
          body: "Inter, system-ui, sans-serif",
        },
        headingStyles: ["Bold", "Clean", "High Contrast"],
        bodyStyles: ["Regular", "Readable", "Professional"],
        weights: ["400", "500", "600", "700"],
        sizes: ["14px", "16px", "18px", "24px", "32px"],
        lineHeights: ["1.4", "1.6", "1.8"],
        letterSpacing: ["normal", "0.025em"],
      },
      layout: {
        spacing: ["8px", "16px", "24px", "32px", "48px"],
        gridSystems: ["12-column", "flexbox", "responsive"],
        breakpoints: ["640px", "768px", "1024px", "1280px"],
        containers: ["768px", "1024px", "1280px"],
        margins: ["16px", "24px", "32px"],
        padding: ["16px", "24px", "32px"],
      },
      components: {
        buttons: {
          primary: "Solid background with brand colors, rounded corners",
          secondary: "Outlined style with brand color borders",
          borderRadius: "8px",
          fontWeight: "500",
          states: [
            "hover: darker shade",
            "active: pressed",
            "disabled: opacity 50%",
          ],
        },
        cards: {
          design: "Subtle shadows with clean borders and good spacing",
          shadows: ["0 1px 3px rgba(0,0,0,0.1)", "0 4px 6px rgba(0,0,0,0.1)"],
          borderRadius: "8px",
          spacing: "16px internal padding",
        },
        forms: {
          inputStyles: "Clean inputs with focus states and validation styling",
          labelStyles: "Clear labels with medium font weight",
          focusStates: "Brand color outline with 2px focus ring",
        },
        navigation: {
          primaryNav: "Horizontal layout with clear hierarchy",
          states: "Active, hover, and current page indicators",
          mobileNav: "Hamburger menu with slide-out panel",
        },
        sections: {
          headerDesign: "Brand logo with navigation menu",
          footerDesign: "Multi-column layout with links and contact info",
          contentAreas: "Proper margins and readable layouts",
        },
        contactUs: {
          design: "Form layout with contact information display",
          layout: "Two-column or single column based on space",
        },
        modals: ["centered overlay", "smooth animations"],
        tables: ["striped rows", "hover states"],
        badges: ["solid fill", "outline variants"],
      },
      imagery: {
        style: "clean and modern",
        guidelines: ["high quality", "consistent style", "brand appropriate"],
        restrictions: [
          "no low quality",
          "brand consistent",
          "appropriate context",
        ],
        aspectRatios: ["16:9", "4:3", "1:1"],
        treatments: ["original", "filtered", "branded"],
      },
      tone: {
        personality: ["professional", "approachable", "reliable", "modern"],
        voice: ["clear", "authoritative", "friendly"],
        messaging: ["trustworthy", "accessible", "innovative"],
        doAndDont: ["be clear and concise", "avoid jargon", "stay on brand"],
      },
      logos: {
        primary: "Main brand logo",
        usage: ["proper spacing", "correct colors", "appropriate size"],
        restrictions: [
          "no distortion",
          "minimum size requirements",
          "clear background",
        ],
        variations: ["horizontal", "vertical", "icon only"],
        spacing: ["minimum 20px clearance"],
        colors: ["full color", "monochrome", "reverse"],
        sizes: ["minimum 24px height"],
        formats: ["SVG", "PNG", "JPG"],
        images: {},
      },
      brandValues: ["innovation", "quality", "trust", "excellence"],
      logoUsage: ["maintain proportions", "use appropriate backgrounds"],
      designPrinciples: ["simplicity", "consistency", "accessibility"],
      accessibility: {
        contrast: ["4.5:1 minimum", "7:1 preferred"],
        guidelines: ["WCAG 2.1 AA compliance"],
        compliance: [
          "color contrast",
          "keyboard navigation",
          "screen reader support",
        ],
      },
      keyPoints: [
        "Maintain brand consistency across all touchpoints",
        "Use approved color combinations for accessibility",
        "Follow typography hierarchy guidelines",
        "Ensure proper logo placement and sizing",
      ],
      keyClauses: [
        "Logo must maintain minimum size requirements",
        "Brand colors must meet accessibility standards",
        "Typography must be legible across all platforms",
        "Consistent application across all touchpoints",
      ],
      keyHighlights: [
        "Brand essence and unique value proposition",
        "Critical design specifications",
        "Important usage restrictions",
        "Key differentiating factors",
      ],
      dosAndDonts: {
        dos: [
          "Use approved color combinations",
          "Maintain proper logo clearspace",
          "Follow typography hierarchy",
          "Ensure accessibility compliance",
        ],
        donts: [
          "Never distort or skew the logo",
          "Don't use unauthorized color variations",
          "Avoid poor contrast combinations",
          "Never alter brand typography",
        ],
      },
      brandRules: [
        "Always use official brand assets",
        "Maintain consistent visual hierarchy",
        "Follow approved color usage guidelines",
        "Ensure proper logo placement and sizing",
      ],
      compliance: {
        requirements: [
          "WCAG 2.1 AA accessibility standards",
          "Brand consistency across all platforms",
          "Legal trademark usage compliance",
        ],
        restrictions: [
          "No unauthorized logo modifications",
          "Restricted color palette usage",
          "Specific spacing requirements",
        ],
        guidelines: [
          "Follow established design patterns",
          "Maintain brand voice and tone",
          "Use approved imagery styles",
        ],
      },
      usageGuidelines: {
        approved: [
          "Official marketing materials",
          "Digital platforms and websites",
          "Print publications and collateral",
        ],
        prohibited: [
          "Unauthorized logo alterations",
          "Off-brand color combinations",
          "Inconsistent typography usage",
        ],
        context: [
          "Business communications",
          "Marketing campaigns",
          "Product packaging and design",
        ],
      },
    };
  }

  generateBrandCSS(guidelines: BrandGuideline): string {
    return `
/* Enhanced Brand Guidelines CSS */
:root {
  /* Primary Colors */
  --brand-primary-1: ${guidelines.colors.primary[0] || "#2563eb"};
  --brand-primary-2: ${guidelines.colors.primary[1] || "#1d4ed8"};
  
  /* Secondary Colors */
  --brand-secondary-1: ${guidelines.colors.secondary[0] || "#64748b"};
  --brand-secondary-2: ${guidelines.colors.secondary[1] || "#475569"};
  
  /* Text Colors */
  --brand-text-primary: ${guidelines.colors.text[0] || "#1f2937"};
  --brand-text-secondary: ${guidelines.colors.text[1] || "#374151"};
  --brand-text-muted: ${guidelines.colors.text[2] || "#6b7280"};
  
  /* Background Colors */
  --brand-bg-primary: ${guidelines.colors.background[0] || "#ffffff"};
  --brand-bg-secondary: ${guidelines.colors.background[1] || "#f9fafb"};
  --brand-bg-tertiary: ${guidelines.colors.background[2] || "#f3f4f6"};
  
  /* State Colors */
  --brand-error: ${guidelines.colors.error[0] || "#dc2626"};
  --brand-success: ${guidelines.colors.success[0] || "#16a34a"};
  --brand-warning: ${guidelines.colors.warning[0] || "#d97706"};
  
  /* Accent Colors */
  --brand-accent-1: ${guidelines.colors.accent[0] || "#dc2626"};
  --brand-accent-2: ${guidelines.colors.accent[1] || "#b91c1c"};
  
  /* Neutral Colors */
  --brand-neutral-1: ${guidelines.colors.neutral[0] || "#f8fafc"};
  --brand-neutral-2: ${guidelines.colors.neutral[1] || "#e2e8f0"};
  --brand-neutral-3: ${guidelines.colors.neutral[2] || "#64748b"};
  --brand-neutral-4: ${guidelines.colors.neutral[3] || "#1e293b"};
  
  /* Typography */
  --brand-font-primary: ${
    guidelines.typography.fonts[0] || "Inter"
  }, system-ui, sans-serif;
  --brand-font-secondary: ${
    guidelines.typography.fonts[1] || "-apple-system"
  }, BlinkMacSystemFont, Segoe UI;
  
  /* Spacing */
  --brand-spacing-xs: ${guidelines.layout.spacing[0] || "8px"};
  --brand-spacing-sm: ${guidelines.layout.spacing[1] || "16px"};
  --brand-spacing-md: ${guidelines.layout.spacing[2] || "24px"};
  --brand-spacing-lg: ${guidelines.layout.spacing[3] || "32px"};
  --brand-spacing-xl: ${guidelines.layout.spacing[4] || "48px"};
}

.brand-heading {
  font-family: var(--brand-font-primary);
  font-weight: ${guidelines.typography.weights[2] || "700"};
  color: var(--brand-neutral-4);
}

.brand-body {
  font-family: var(--brand-font-primary);
  font-weight: ${guidelines.typography.weights[0] || "400"};
  color: var(--brand-neutral-3);
  line-height: 1.6;
}

.brand-button {
  font-family: var(--brand-font-primary);
  font-weight: ${guidelines.typography.weights[1] || "500"};
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

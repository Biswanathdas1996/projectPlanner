import { GoogleGenerativeAI } from "@google/generative-ai";
import { BrandGuideline } from "./brand-guideline-extractor";
import { FinalBrandReport } from "./chunked-brand-analyzer";

export interface BrandedWireframeRequest {
    pageContent: any;
    designStyle: string;
    deviceType: string;
    brandGuidelines: BrandGuideline;
    finalBrandReport?: FinalBrandReport;
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
            "AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM",
        );
        this.genAI = genAI;
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async generateBrandedWireframe(
        request: BrandedWireframeRequest,
    ): Promise<BrandedWireframeResponse> {
        try {
            console.log(
                "Generating branded wireframe for:",
                request.pageContent.pageName,
            );

            const prompt = this.buildBrandedPrompt(request);
            console.log("Prompt length:", prompt.length);

            const result = await this.model.generateContent(prompt);
            const response = result.response.text();

            console.log("AI response received, length:", response.length);

            return this.parseResponse(
                response,
                request.brandGuidelines,
                request.pageContent,
            );
        } catch (error: any) {
            console.error("Error generating branded wireframe:", error);
            console.error(
                "Error details:",
                error?.message || "Unknown error",
                error?.stack || "No stack trace",
            );

            // Return fallback with complete page content preserved
            return {
                html: this.generateCompletePageHTML(
                    request.pageContent,
                    request.brandGuidelines,
                ),
                css: this.generateBrandCSS(request.brandGuidelines),
                brandNotes: this.generateDefaultBrandNotes(
                    request.brandGuidelines,
                ),
            };
        }
    }

    private buildBrandedPrompt(request: BrandedWireframeRequest): string {
        const { pageContent, designStyle, deviceType, brandGuidelines, finalBrandReport } =
            request;

        // Build complete content sections
        const headersSection =
            pageContent.headers && pageContent.headers.length > 0
                ? `Headers: ${pageContent.headers.join(", ")}`
                : "";

        const buttonsSection =
            pageContent.buttons && pageContent.buttons.length > 0
                ? `Buttons: ${pageContent.buttons.map((b: any) => b.label || b).join(", ")}`
                : "";

        const formsSection =
            pageContent.forms && pageContent.forms.length > 0
                ? `Forms: ${pageContent.forms.map((f: any) => `${f.title || f} (${f.fields ? f.fields.join(", ") : "form fields"})`).join("; ")}`
                : "";

        const listsSection =
            pageContent.lists && pageContent.lists.length > 0
                ? `Lists: ${pageContent.lists.map((l: any) => `${l.title || l} (${l.items ? l.items.join(", ") : "list items"})`).join("; ")}`
                : "";

        const navigationSection =
            pageContent.navigation && pageContent.navigation.length > 0
                ? `Navigation: ${pageContent.navigation.join(", ")}`
                : "";

        const textContentSection =
            pageContent.textContent && pageContent.textContent.length > 0
                ? `Text Content: ${pageContent.textContent.join("; ")}`
                : "";

        const additionalContentSection =
            pageContent.additionalContent &&
            pageContent.additionalContent.length > 0
                ? `Additional Content: ${pageContent.additionalContent.join("; ")}`
                : "";

        const stakeholdersSection =
            pageContent.stakeholders && pageContent.stakeholders.length > 0
                ? `Stakeholders: ${pageContent.stakeholders.join(", ")}`
                : "";

        // Extract comprehensive brand data from multimodal analysis
        const criticalRequirements = finalBrandReport?.keyFindings?.criticalRequirements?.slice(0, 8) || [];
        const brandThemes = finalBrandReport?.keyFindings?.brandThemes?.slice(0, 6) || [];
        const designPrinciples = finalBrandReport?.keyFindings?.designPrinciples?.slice(0, 6) || [];
        const colorGuidelines = finalBrandReport?.brandGuidelines?.colors?.primary?.slice(0, 6) || [];
        const typographyGuidelines = finalBrandReport?.brandGuidelines?.typography?.fonts?.slice(0, 6) || [];
        const logoGuidelines = finalBrandReport?.brandGuidelines?.logos?.usage?.slice(0, 6) || [];
        const dosAndDonts = { 
          dos: finalBrandReport?.brandGuidelines?.tone?.doAndDonts?.dos?.slice(0, 5) || [], 
          donts: finalBrandReport?.brandGuidelines?.tone?.doAndDonts?.donts?.slice(0, 5) || [] 
        };

        return `Create a professional, brand-compliant web page wireframe for "${pageContent.pageName}" using multimodal AI-extracted brand guidelines.

==== MULTIMODAL BRAND ANALYSIS GUIDELINES ====

CRITICAL REQUIREMENTS:
${criticalRequirements.map((requirement, i) => `${i + 1}. ${requirement}`).join('\n')}

BRAND THEMES:
${brandThemes.map(theme => `• ${theme}`).join('\n')}

DESIGN PRINCIPLES:
${designPrinciples.map(principle => `• ${principle}`).join('\n')}

COLOR GUIDELINES:
${colorGuidelines.map(color => `• ${color}`).join('\n')}

TYPOGRAPHY GUIDELINES:
${typographyGuidelines.map(font => `• ${font}`).join('\n')}

LOGO USAGE GUIDELINES:
${logoGuidelines.map(guideline => `• ${guideline}`).join('\n')}

BRAND COMPLIANCE - MUST DO:
${dosAndDonts.dos.map(item => `✓ ${item}`).join('\n')}

BRAND COMPLIANCE - MUST NOT DO:
${dosAndDonts.donts.map(item => `✗ ${item}`).join('\n')}

FALLBACK BRAND GUIDELINES:
COLORS:
- Primary: ${(brandGuidelines.colors?.primary || []).join(", ")}
- Secondary: ${(brandGuidelines.colors?.secondary || []).join(", ")}
- Accent: ${(brandGuidelines.colors?.accent || []).join(", ")}
- Text Colors: ${(brandGuidelines.colors?.text || []).join(", ")}
- Background: ${(brandGuidelines.colors?.background || []).join(", ")}
- State Colors - Error: ${(brandGuidelines.colors?.error || []).join(", ")}, Success: ${(brandGuidelines.colors?.success || []).join(", ")}, Warning: ${(brandGuidelines.colors?.warning || []).join(", ")}

TYPOGRAPHY & FONT FAMILIES:
- Primary Font Family: ${brandGuidelines.typography?.fontFamilies?.primary || (brandGuidelines.typography?.fonts || [])[0] || "system-ui, sans-serif"}
- Heading Font Family: ${brandGuidelines.typography?.fontFamilies?.heading || (brandGuidelines.typography?.fonts || [])[0] || "system-ui, sans-serif"}
- Body Font Family: ${brandGuidelines.typography?.fontFamilies?.body || (brandGuidelines.typography?.fonts || [])[1] || "system-ui, sans-serif"}
- Font Sizes: ${(brandGuidelines.typography?.sizes || []).join(", ")}
- Font Weights: ${(brandGuidelines.typography?.weights || []).join(", ")}
- Line Heights: ${(brandGuidelines.typography?.lineHeights || []).join(", ")}

LOGO & BRANDING:
- Primary Logo: ${brandGuidelines.logos?.primary || "Brand logo"}
- Logo Variations: ${(brandGuidelines.logos?.variations || []).join(", ")}
- Size Requirements: ${(brandGuidelines.logos?.sizes || []).join(", ")}
- Spacing: ${(brandGuidelines.logos?.spacing || []).join(", ")}
- Color Options: ${(brandGuidelines.logos?.colors || []).join(", ")}


COMPONENT DESIGN SPECIFICATIONS:
BUTTONS:
- Primary: ${brandGuidelines.components?.buttons?.primary || "Solid background with brand colors"}
- Secondary: ${brandGuidelines.components?.buttons?.secondary || "Outlined style with brand colors"}
- Border Radius: ${brandGuidelines.components?.buttons?.borderRadius || "8px"}
- Font Weight: ${brandGuidelines.components?.buttons?.fontWeight || "500"}
- States: ${brandGuidelines.components?.buttons?.states?.join(", ") || "hover, active, disabled"}

CARDS:
- Design: ${brandGuidelines.components?.cards?.design || "Clean with subtle shadows and rounded corners"}
- Shadows: ${brandGuidelines.components?.cards?.shadows?.join(", ") || "subtle elevation"}
- Border Radius: ${brandGuidelines.components?.cards?.borderRadius || "8px to 12px"}
- Spacing: ${brandGuidelines.components?.cards?.spacing || "16px internal padding"}
- Hover States: ${brandGuidelines.components?.cards?.hoverStates?.join(", ") || "subtle shadow increase"}

NAVIGATION:
- Primary Nav: ${brandGuidelines.components?.navigation?.primaryNav || "Horizontal layout with brand logo"}
- States: ${brandGuidelines.components?.navigation?.states || "Active, hover, and current page indicators"}
- Mobile Nav: ${brandGuidelines.components?.navigation?.mobileNav || "Hamburger menu with slide-out panel"}

FORMS & CONTACT:
- Input Styles: ${brandGuidelines.components?.forms?.inputStyles || "Clean with focus states"}
- Label Styles: ${brandGuidelines.components?.forms?.labelStyles || "Medium weight with brand colors"}
- Contact Design: ${brandGuidelines.components?.contactUs?.design || "Form with contact information display"}
- Contact Layout: ${brandGuidelines.components?.contactUs?.layout || "Two-column or single column layout"}

SECTIONS:
- Header Design: ${brandGuidelines.components?.sections?.headerDesign || "Brand logo with navigation menu"}
- Footer Design: ${brandGuidelines.components?.sections?.footerDesign || "Multiple columns with links and contact info"}
- Content Areas: ${brandGuidelines.components?.sections?.contentAreas || "Proper margins and readable layouts"}
- Backgrounds: ${Array.isArray(brandGuidelines.components?.sections?.backgrounds) ? brandGuidelines.components.sections.backgrounds.join(", ") : (brandGuidelines.components?.sections?.backgrounds || "White, light grays, brand accents")}

ACCESSIBILITY:
- Contrast Standards: ${(brandGuidelines.accessibility?.contrast || []).join(", ")}
- Compliance: ${(brandGuidelines.accessibility?.compliance || []).join(", ")}

BRAND VALUES: ${(brandGuidelines.brandValues || []).join(", ")}
DESIGN PRINCIPLES: ${(brandGuidelines.designPrinciples || []).join(", ")}
- Design Style: ${designStyle}
- Device Type: ${deviceType}

PAGE CONTEXT & PURPOSE:
- Page Type: ${pageContent.pageType || "Web Application Page"}
- Main Purpose: ${pageContent.purpose}
- Target Users: ${pageContent.stakeholders?.join(", ") || "General users"}

CONTENT TO ORGANIZE INTO LOGICAL SECTIONS:
${headersSection}
${textContentSection}
${buttonsSection}
${formsSection}
${listsSection}
${navigationSection}
${additionalContentSection}

LAYOUT REQUIREMENTS:
- Create a realistic web page structure with proper information hierarchy
- Organize content into logical sections that flow naturally
- Place navigation elements appropriately (header/sidebar)
- Group related functionality together
- Design forms as functional input areas, not just lists
- Make buttons actionable and contextually placed
- Structure lists as meaningful data displays
- Create a cohesive user experience that serves the page purpose

WIREFRAME DESIGN REQUIREMENTS:
1. REALISTIC LAYOUT: Create a logical web page structure that serves the actual purpose
   - Use proper header with navigation and branding
   - Organize content in meaningful sections with clear hierarchy
   - Place forms in appropriate contexts (not just as lists)
   - Group related buttons and actions logically
   - Structure data/lists as functional components (tables, cards, dashboards)

2. CONTENT ORGANIZATION: Transform raw content into proper web elements
   - Headers become section titles and page structure
   - Text content becomes explanatory copy, descriptions, and help text
   - Buttons become actionable CTAs in logical positions
   - Forms become functional input areas with proper labels and flow
   - Lists become data displays, menus, or feature highlights
   - Navigation becomes actual site navigation structure

3. USER EXPERIENCE FLOW: Design for real user interactions
   - Create logical task flows based on page purpose
   - Place primary actions prominently
   - Support secondary actions appropriately
   - Provide clear information hierarchy
   - Include status indicators and feedback elements

4. TECHNICAL REQUIREMENTS:
   - Include ALL content sections mentioned above - do not omit any
   - Apply brand colors consistently throughout, no gradients
   - Use specified typography with proper hierarchy
   - Include brand logo placeholder in header following specifications
   
   - Make it responsive and modern
   - Ensure proper color contrast for accessibility
   - Include engaging infographic elements
   - Apply brand guidelines consistently

5. REAL-WORLD FUNCTIONALITY: Design as if this were a production website
   - Forms should have proper validation states
   - Buttons should indicate their specific functions
   - Navigation should reflect actual site structure
   - Content should be organized for easy scanning and comprehension

Create a realistic, functional web page layout that a real user would encounter. Examples:
- Appointment scheduling should have a calendar interface, time slots, and booking forms
- Video call pages should show connection status, participant info, and call controls  
- Dashboard pages should display key metrics, quick actions, and data summaries
- E-commerce should show products, filters, shopping cart, and checkout flow

LOGO INTEGRATION WITH PLACEHOLDERS:
- Primary Logo: Main header/navigation area
  <div class="logo-placeholder primary-logo" style="height: 40px; width: 120px; background: linear-gradient(45deg, ${(brandGuidelines.colors?.primary || [])[0] || "#DA291C"}, ${(brandGuidelines.colors?.accent || [])[0] || "#FFC72C"}); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">[LOGO]</div>

- Horizontal Logo: Footer, wide banner sections
  <div class="logo-placeholder horizontal-logo" style="height: 32px; width: 160px; background: ${(brandGuidelines.colors?.primary || [])[0] || "#DA291C"}; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">[BRAND NAME]</div>

- Icon Logo: Favicon, mobile menu, compact spaces
  <div class="logo-placeholder icon-logo" style="height: 24px; width: 24px; background: ${(brandGuidelines.colors?.accent || [])[0] || "#FFC72C"}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">B</div>

- Text Logo: Use brand typography and colors for text-based branding
  <div class="text-logo" style="font-family: ${brandGuidelines.typography?.fontFamilies?.primary || (brandGuidelines.typography?.fonts || [])[0] || "system-ui, sans-serif"}; color: ${(brandGuidelines.colors?.primary || [])[0] || "#DA291C"}; font-weight: bold; font-size: 24px;">BRAND</div>

IMPLEMENT MULTIPLE LOGO PLACEMENTS WITH PLACEHOLDERS:
1. Header Navigation: Use primary logo placeholder with brand colors
2. Footer Section: Use horizontal brand name placeholder
3. Loading/Error States: Use icon logo placeholder (circular)
4. Mobile Menu: Use compact icon placeholder
5. Content Sections: Use text logo with brand typography
6. Background Watermarks: Use faded brand elements
7. All Images: Use placeholder divs with appropriate dimensions and brand colors

Return HTML and CSS in this exact format:

===HTML===
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageContent.pageName} - Brand Compliant</title>
    <style>
[Complete CSS using brand colors and typography - make it modern and responsive]
    </style>
</head>
<body>
    [Complete realistic web page structure organizing ALL content into logical, functional sections]
</body>
</html>




===BRAND_NOTES===
- Applied primary brand color: ${(brandGuidelines.colors?.primary || [])[0] || "brand primary color"}
- Used brand typography: ${(brandGuidelines.typography?.fonts || [])[0] || "brand typography"}
- Implemented responsive design with brand guidelines`;
    }

    private parseResponse(
        response: string,
        brandGuidelines: BrandGuideline,
        pageContent: any,
    ): BrandedWireframeResponse {
        try {
            const htmlMatch = response.match(
                /===HTML===\s*([\s\S]*?)(?===CSS===)/,
            );
            const cssMatch = response.match(
                /===CSS===\s*([\s\S]*?)(?===BRAND_NOTES===)/,
            );
            const notesMatch = response.match(
                /===BRAND_NOTES===\s*([\s\S]*?)$/,
            );

            let html = htmlMatch ? htmlMatch[1].trim() : "";
            let css = cssMatch ? cssMatch[1].trim() : "";
            const notesText = notesMatch ? notesMatch[1].trim() : "";

            // Clean up code blocks
            html = html.replace(/```html\s*|\s*```$/g, "").trim();
            css = css.replace(/```css\s*|\s*```$/g, "").trim();

            // Generate brand-specific CSS if not provided
            if (!css) {
                css = this.generateBrandCSS(brandGuidelines);
            }

            // If HTML is missing or incomplete, generate complete page HTML with all content
            if (!html || html.length < 200) {
                html = this.generateCompletePageHTML(
                    pageContent,
                    brandGuidelines,
                );
            }

            // Parse brand notes
            const brandNotes = notesText
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => line.replace(/^[•\-\*]\s*/, "").trim());

            return {
                html: html,
                css: css,
                brandNotes:
                    brandNotes.length > 0
                        ? brandNotes
                        : this.generateDefaultBrandNotes(brandGuidelines),
            };
        } catch (error) {
            console.error("Error parsing wireframe response:", error);

            return {
                html: this.generateCompletePageHTML(
                    pageContent,
                    brandGuidelines,
                ),
                css: this.generateBrandCSS(brandGuidelines),
                brandNotes: this.generateDefaultBrandNotes(brandGuidelines),
            };
        }
    }

    private generateCompletePageHTML(
        pageContent: any,
        brandGuidelines: BrandGuideline,
    ): string {
        const primaryColor =
            (brandGuidelines.colors?.primary || [])[0] || "#DA291C";
        const accentColor =
            (brandGuidelines.colors?.accent || [])[0] || "#FFC72C";
        const secondaryColor =
            (brandGuidelines.colors?.secondary || [])[0] || "#264A2B";
        const neutralColor =
            (brandGuidelines.colors?.neutral || [])[0] || "#f8fafc";
        const brandFont =
            (brandGuidelines.typography?.fonts || [])[0] || "Helvetica Neue";

        // Calculate proper text colors based on background contrast
        const getContrastColor = (backgroundColor: string): string => {
            // Remove # if present and convert to RGB
            const hex = backgroundColor.replace("#", "");
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);

            // Calculate luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // Return white for dark backgrounds, dark for light backgrounds
            return luminance > 0.5 ? "#333333" : "#ffffff";
        };

        const primaryTextColor = getContrastColor(primaryColor);
        const accentTextColor = getContrastColor(accentColor);
        const secondaryTextColor = getContrastColor(secondaryColor);
        const neutralTextColor = getContrastColor(neutralColor);

        // Determine page type and create appropriate layout structure
        const isAppointmentPage =
            pageContent.pageName.toLowerCase().includes("appointment") ||
            pageContent.pageName.toLowerCase().includes("scheduling");
        const isVideoCallPage =
            pageContent.pageName.toLowerCase().includes("video") ||
            pageContent.pageName.toLowerCase().includes("call") ||
            pageContent.pageName.toLowerCase().includes("telemedicine");
        const isDashboardPage =
            pageContent.pageName.toLowerCase().includes("dashboard") ||
            pageContent.pageName.toLowerCase().includes("overview");
        const isFormPage = pageContent.forms && pageContent.forms.length > 0;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageContent.pageName} - Brand Compliant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: '${brandFont}', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background: ${neutralColor};
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            animation: fadeIn 0.8s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .page-header {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
            border-left: 6px solid ${accentColor};
            position: relative;
            overflow: hidden;
        }
        
        .page-header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100px;
            background: ${accentColor};
            opacity: 0.1;
            border-radius: 50%;
            transform: translate(50%, -50%);
        }
        
        .page-header h1 {
            color: ${primaryColor};
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
        }
        
        .purpose {
            color: #64748b;
            font-size: 1.1rem;
            margin-bottom: 20px;
        }
        
        .stakeholders {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 15px;
        }
        
        .stakeholder-badge {
            background: ${accentColor};
            color: ${accentTextColor};
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .content-section {
            background: white;
            margin-bottom: 25px;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .content-section:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .content-section h2 {
            color: ${primaryColor};
            font-size: 1.5rem;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .content-section h2::before {
            content: '';
            width: 4px;
            height: 20px;
            background: ${accentColor};
            border-radius: 2px;
        }
        
        .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .btn {
            background: ${primaryColor};
            color: ${primaryTextColor};
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .btn:hover {
            background: ${secondaryColor};
            color: ${secondaryTextColor};
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .btn-secondary {
            background: ${accentColor};
            color: ${accentTextColor};
        }
        
        .btn-secondary:hover {
            background: ${secondaryColor};
            color: ${secondaryTextColor};
        }
        
        .form-container {
            background: ${neutralColor};
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            margin-bottom: 20px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: ${primaryColor};
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: ${accentColor};
            box-shadow: 0 0 0 3px rgba(255, 199, 44, 0.1);
        }
        
        .list-container {
            background: ${neutralColor};
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            margin-bottom: 20px;
        }
        
        .list-container ul {
            list-style: none;
            padding: 0;
        }
        
        .list-container li {
            padding: 12px;
            margin-bottom: 8px;
            background: white;
            border-left: 4px solid ${accentColor};
            border-radius: 6px;
            transition: all 0.3s ease;
        }
        
        .list-container li:hover {
            transform: translateX(5px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .nav-links {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 15px;
        }
        
        .nav-link {
            color: ${primaryColor};
            text-decoration: none;
            font-weight: 600;
            padding: 8px 16px;
            border-radius: 6px;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .nav-link:hover {
            background: ${primaryColor};
            color: white;
            transform: translateY(-1px);
        }
        
        .infographic-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .info-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            border: 2px solid ${accentColor};
            position: relative;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .info-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .info-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2rem;
            margin-bottom: 15px;
        }
        
        .progress-indicator {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }
        
        .progress-bar {
            height: 100%;
            border-radius: 4px;
            transition: width 0.8s ease;
        }
        
        .stats-container {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-item {
            text-align: center;
            padding: 15px;
            background: ${neutralColor};
            border-radius: 8px;
            border: 1px solid ${accentColor};
            min-width: 120px;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: ${primaryColor};
            display: block;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #64748b;
            margin-top: 5px;
        }
        
        .visual-separator {
            height: 4px;
            background: ${accentColor};
            border-radius: 2px;
            margin: 30px 0;
            position: relative;
        }
        
        .visual-separator::before {
            content: '';
            position: absolute;
            left: 50%;
            top: -8px;
            transform: translateX(-50%);
            width: 16px;
            height: 16px;
            background: ${primaryColor};
            border-radius: 50%;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            .page-header {
                padding: 25px;
            }
            .page-header h1 {
                font-size: 2rem;
            }
            .content-section {
                padding: 20px;
            }
            .nav-links {
                flex-direction: column;
            }
            .infographic-grid {
                grid-template-columns: 1fr;
            }
            .stats-container {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <!-- Top Navigation -->
    <nav style="background: white; border-bottom: 2px solid ${accentColor}; padding: 15px 0; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div class="container" style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 40px; height: 40px; background: ${primaryColor}; color: ${primaryTextColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">
                    ${pageContent.pageName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 style="color: ${primaryColor}; font-size: 1.4rem; margin: 0; font-weight: 700;">${pageContent.pageName}</h1>
                    <p style="color: #64748b; font-size: 0.85rem; margin: 0;">${pageContent.pageType || "Application"}</p>
                </div>
            </div>
            ${
                pageContent.navigation && pageContent.navigation.length > 0
                    ? `
            <div style="display: flex; gap: 5px;">
                ${pageContent.navigation
                    .slice(0, 4)
                    .map(
                        (nav: string) => `
                    <a href="#" style="color: ${primaryColor}; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s ease; font-size: 0.9rem;" 
                       onmouseover="this.style.background='${accentColor}'; this.style.color='${accentTextColor}'" 
                       onmouseout="this.style.background=''; this.style.color='${primaryColor}'">${nav}</a>
                `,
                    )
                    .join("")}
            </div>
            `
                    : ""
            }
        </div>
    </nav>

    <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 20px;">
        <!-- Page Header Section -->
        <section style="background: linear-gradient(135deg, white 0%, ${neutralColor} 100%); padding: 40px; border-radius: 16px; margin-bottom: 30px; text-align: center; position: relative; border: 1px solid #e2e8f0;">
            <h1 style="color: ${primaryColor}; font-size: 2.5rem; font-weight: 700; margin-bottom: 15px;">${pageContent.pageName}</h1>
            <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 25px; max-width: 600px; margin-left: auto; margin-right: auto;">${pageContent.purpose}</p>
            ${
                pageContent.stakeholders && pageContent.stakeholders.length > 0
                    ? `
            <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 10px;">
                <span style="color: #64748b; font-size: 0.9rem; font-weight: 500;">For:</span>
                ${pageContent.stakeholders
                    .map(
                        (stakeholder: string) => `
                    <span style="background: ${accentColor}; color: ${accentTextColor}; padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${stakeholder}</span>
                `,
                    )
                    .join("")}
            </div>
            `
                    : ""
            }
        </section>
        
        ${
            pageContent.headers && pageContent.headers.length > 0
                ? `
        <section class="content-section">
            <h2>📊 Key Sections</h2>
            <div class="infographic-grid">
                ${pageContent.headers
                    .map(
                        (header: string, idx: number) => `
                    <div class="info-card">
                        <div class="info-icon" style="background: ${accentColor}; color: ${accentTextColor};">
                            ${idx + 1}
                        </div>
                        <h3 style="color: ${primaryColor}; margin-bottom: 8px;">${header}</h3>
                        <div class="progress-indicator">
                            <div class="progress-bar" style="width: ${85 - idx * 5}%; background: ${primaryColor};"></div>
                        </div>
                    </div>
                `,
                    )
                    .join("")}
            </div>
        </section>
        `
                : ""
        }
        
        ${
            pageContent.textContent && pageContent.textContent.length > 0
                ? `
        <section class="content-section">
            <h2>Content</h2>
            ${pageContent.textContent.map((text: string) => `<p style="margin-bottom: 15px; line-height: 1.7;">${text}</p>`).join("")}
        </section>
        `
                : ""
        }
        
        ${
            pageContent.buttons && pageContent.buttons.length > 0
                ? `
        <section class="content-section">
            <h2>🎯 Available Actions</h2>
            <div class="stats-container">
                <div class="stat-item">
                    <span class="stat-number">${pageContent.buttons.length}</span>
                    <div class="stat-label">Total Actions</div>
                </div>
                <div class="stat-item">
                    <span class="stat-number">100%</span>
                    <div class="stat-label">Functionality</div>
                </div>
            </div>
            <div class="visual-separator"></div>
            <div class="button-group">
                ${pageContent.buttons.map((button: any, idx: number) => `<button class="btn ${idx % 2 === 0 ? "" : "btn-secondary"}">${button.label || button}</button>`).join("")}
            </div>
        </section>
        `
                : ""
        }
        
        ${
            pageContent.forms && pageContent.forms.length > 0
                ? `
        <!-- Interactive Forms Section -->
        <section style="display: grid; grid-template-columns: ${pageContent.forms.length > 1 ? "repeat(auto-fit, minmax(400px, 1fr))" : "1fr"}; gap: 30px; margin-bottom: 30px;">
            ${pageContent.forms
                .map(
                    (form: any, formIdx: number) => `
                <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                        <div style="width: 35px; height: 35px; background: ${primaryColor}; color: ${primaryTextColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${formIdx + 1}
                        </div>
                        <div>
                            <h3 style="color: ${primaryColor}; margin: 0; font-size: 1.3rem; font-weight: 600;">${form.title || form}</h3>
                            <p style="color: #64748b; font-size: 0.9rem; margin: 0;">Complete the information below</p>
                        </div>
                    </div>
                    <div style="display: grid; gap: 20px;">
                        ${
                            form.fields
                                ? form.fields
                                      .map(
                                          (field: string, fieldIdx: number) => `
                            <div style="position: relative;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: ${primaryColor}; font-size: 0.9rem;">${field} ${fieldIdx < 2 ? '<span style="color: #ef4444;">*</span>' : ""}</label>
                                <input type="${field.toLowerCase().includes("email") ? "email" : field.toLowerCase().includes("phone") ? "tel" : field.toLowerCase().includes("date") || field.toLowerCase().includes("time") ? "datetime-local" : "text"}" 
                                       placeholder="Enter your ${field.toLowerCase()}" 
                                       style="width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; transition: all 0.3s ease;"
                                       onfocus="this.style.borderColor='${accentColor}'; this.style.boxShadow='0 0 0 3px ${accentColor}33'"
                                       onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'">
                            </div>
                        `,
                                      )
                                      .join("")
                                : ""
                        }
                        <button style="background: ${primaryColor}; color: ${primaryTextColor}; padding: 15px 25px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-top: 10px;"
                                onmouseover="this.style.background='${secondaryColor}'; this.style.color='${secondaryTextColor}'; this.style.transform='translateY(-2px)'"
                                onmouseout="this.style.background='${primaryColor}'; this.style.color='${primaryTextColor}'; this.style.transform='translateY(0)'">${form.submitAction || "Submit " + (form.title || "Form")}</button>
                    </div>
                </div>
            `,
                )
                .join("")}
        </section>
        `
                : ""
        }
        
        ${
            pageContent.lists && pageContent.lists.length > 0
                ? `
        <!-- Data Dashboard Section -->
        <section style="margin-bottom: 30px;">
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 style="color: ${primaryColor}; margin: 0; font-size: 1.5rem; font-weight: 600;">📊 Data Overview</h2>
                    <div style="display: flex; gap: 20px;">
                        <div style="text-align: center; padding: 15px; background: ${accentColor}; color: ${accentTextColor}; border-radius: 8px; min-width: 100px;">
                            <div style="font-size: 1.8rem; font-weight: bold;">${pageContent.lists.length}</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">Categories</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: ${primaryColor}; color: ${primaryTextColor}; border-radius: 8px; min-width: 100px;">
                            <div style="font-size: 1.8rem; font-weight: bold;">${pageContent.lists.reduce((total: number, list: any) => total + (list.items ? list.items.length : 0), 0)}</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">Total Items</div>
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px;">
                    ${pageContent.lists
                        .map(
                            (list: any, idx: number) => `
                        <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: ${neutralColor};">
                            <div style="background: ${primaryColor}; color: ${primaryTextColor}; padding: 15px; display: flex; align-items: center; gap: 10px;">
                                <div style="width: 30px; height: 30px; background: ${accentColor}; color: ${accentTextColor}; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">
                                    ${idx + 1}
                                </div>
                                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">${list.title || list}</h3>
                                <span style="margin-left: auto; background: ${accentColor}; color: ${accentTextColor}; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                                    ${list.items ? list.items.length : 0} items
                                </span>
                            </div>
                            <div style="padding: 20px;">
                                ${
                                    list.items
                                        ? list.items
                                              .map(
                                                  (
                                                      item: string,
                                                      itemIdx: number,
                                                  ) => `
                                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 8px; background: white; border-radius: 6px; border-left: 3px solid ${accentColor}; transition: all 0.3s ease;"
                                         onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'"
                                         onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
                                        <div style="width: 8px; height: 8px; background: ${primaryColor}; border-radius: 50%; flex-shrink: 0;"></div>
                                        <span style="color: #374151; font-weight: 500;">${item}</span>
                                        <span style="margin-left: auto; color: #9ca3af; font-size: 0.8rem;">#${itemIdx + 1}</span>
                                    </div>
                                `,
                                              )
                                              .join("")
                                        : '<p style="color: #9ca3af; text-align: center; padding: 20px;">No items available</p>'
                                }
                            </div>
                        </div>
                    `,
                        )
                        .join("")}
                </div>
            </div>
        </section>
        `
                : ""
        }
        
        ${
            pageContent.navigation && pageContent.navigation.length > 0
                ? `
        <section class="content-section">
            <h2>Navigation</h2>
            <nav class="nav-links">
                ${pageContent.navigation.map((nav: string) => `<a href="#" class="nav-link">${nav}</a>`).join("")}
            </nav>
        </section>
        `
                : ""
        }
        
        ${
            pageContent.additionalContent &&
            pageContent.additionalContent.length > 0
                ? `
        <section class="content-section">
            <h2>Additional Information</h2>
            ${pageContent.additionalContent.map((content: string) => `<p style="margin-bottom: 15px; line-height: 1.7;">${content}</p>`).join("")}
        </section>
        `
                : ""
        }
    </div>
    
    <script>
        // Interactive features with brand colors and proper contrast
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Visual feedback with proper contrast
                const originalText = this.textContent;
                this.textContent = '✓ ' + originalText;
                this.style.background = '${accentColor}';
                this.style.color = '${accentTextColor}';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = '';
                    this.style.color = '';
                }, 1500);
            });
        });
        
        // Form interactions with proper focus colors
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', function() {
                this.style.borderColor = '${accentColor}';
                this.style.boxShadow = '0 0 0 3px ${accentColor}33';
            });
            
            input.addEventListener('blur', function() {
                this.style.borderColor = '#e2e8f0';
                this.style.boxShadow = 'none';
            });
        });
    </script>
</body>
</html>`;
    }

    private generateBrandCSS(guidelines: BrandGuideline): string {
        const primaryColor = guidelines?.colors?.primary?.[0] || "#2563eb";
        const primaryColorAlt = guidelines?.colors?.primary?.[1] || "#1d4ed8";
        const accentColor = guidelines?.colors?.accent?.[0] || "#dc2626";
        const accentColorAlt = guidelines?.colors?.accent?.[1] || "#b91c1c";
        const secondaryColor = guidelines?.colors?.secondary?.[0] || "#64748b";
        const neutralLight = guidelines?.colors?.neutral?.[0] || "#f8fafc";
        const neutralMid = guidelines?.colors?.neutral?.[1] || "#e2e8f0";
        const neutralDark = guidelines?.colors?.neutral?.[3] || "#1e293b";
        const primaryFont = guidelines?.typography?.fonts?.[0] || "Inter";

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
  --brand-font-secondary: '${guidelines.typography.fonts[1] || "system-ui"}', -apple-system, sans-serif;
  --brand-weight-normal: ${guidelines.typography.weights[0] || "400"};
  --brand-weight-medium: ${guidelines.typography.weights[1] || "500"};
  --brand-weight-bold: ${guidelines.typography.weights[2] || "700"};
  
  /* Professional Spacing System */
  --brand-space-xs: ${guidelines.layout.spacing[0] || "8px"};
  --brand-space-sm: ${guidelines.layout.spacing[1] || "16px"};
  --brand-space-md: ${guidelines.layout.spacing[2] || "24px"};
  --brand-space-lg: ${guidelines.layout.spacing[3] || "32px"};
  --brand-space-xl: ${guidelines.layout.spacing[4] || "48px"};
  
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
            `Implemented brand spacing system: ${guidelines.layout.spacing.join(", ")} for proper layout`,
            `Followed button guidelines with modern gradients and hover effects`,
            `Reflected brand personality: ${guidelines.tone.personality.join(", ")} in design choices`,
            `Created responsive layouts that maintain brand integrity across devices`,
            `Applied sophisticated CSS with modern animations and transitions`,
        ];
    }
}

export function createBrandAwareWireframeGenerator(): BrandAwareWireframeGenerator {
    return new BrandAwareWireframeGenerator();
}

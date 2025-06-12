import { GoogleGenerativeAI } from "@google/generative-ai";
import type { WireframeAnalysisResult } from "./wireframe-analysis-agent";

export interface PageContentCard {
  id: string;
  pageName: string;
  pageType: string;
  purpose: string;
  stakeholders: string[];
  headers: string[];
  textContent: string[];
  buttons: { label: string; action: string; style: string }[];
  forms: { title: string; fields: string[]; submitAction: string }[];
  inputs: { label: string; type: string; placeholder: string; required: boolean }[];
  lists: { title: string; items: string[]; type: string }[];
  images: { alt: string; description: string; position: string }[];
  navigation: string[];
  additionalContent: string[];
  isEdited: boolean;
}

export interface PageContentGenerationRequest {
  analysisResult: WireframeAnalysisResult;
  stakeholderFlows: any[];
  flowTypes: any;
  projectDescription: string;
}

export class PageContentAgent {
  public model: any;

  constructor() {
    const genAI = new GoogleGenerativeAI(
      "AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E"
    );
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generatePageContent(request: PageContentGenerationRequest): Promise<PageContentCard[]> {
    try {
      console.log("Starting page content generation...");
      
      const { analysisResult, stakeholderFlows, flowTypes, projectDescription } = request;
      
      const contentCards: PageContentCard[] = [];
      
      // Generate content for each page requirement
      for (let i = 0; i < analysisResult.pageRequirements.length; i++) {
        const pageReq = analysisResult.pageRequirements[i];
        
        console.log(`Generating content for page: ${pageReq.pageName}`);
        
        const pageContent = await this.generateSinglePageContent(pageReq, {
          stakeholderFlows,
          flowTypes,
          projectDescription
        });
        
        contentCards.push({
          id: `page-${i}`,
          ...pageContent,
          isEdited: false
        });
      }
      
      console.log(`Generated content for ${contentCards.length} pages`);
      return contentCards;
      
    } catch (error) {
      console.error("Error generating page content:", error);
      throw new Error("Failed to generate page content: " + (error as Error).message);
    }
  }

  async generateSinglePageContent(pageReq: any, context: {
    stakeholderFlows: any[];
    flowTypes: any;
    projectDescription: string;
  }): Promise<Omit<PageContentCard, 'id' | 'isEdited'>> {
    const prompt = this.buildContentPrompt(pageReq, context.flowTypes, context.projectDescription);
    
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return this.parseContentResponse(text, pageReq);
  }

  buildContentPrompt(pageReq: any, flowTypes: any, projectDescription: string): string {
    return `
You are an expert UX content strategist. Generate detailed page content for a web application page.

**Project Context:**
${projectDescription}

**Page Details:**
- Page Name: ${pageReq.pageName}
- Page Type: ${pageReq.pageType}
- Purpose: ${pageReq.purpose}
- Target Stakeholders: ${pageReq.stakeholders?.join(', ') || 'General users'}

**Available Flow Types:**
${JSON.stringify(flowTypes, null, 2)}

**Instructions:**
Generate comprehensive page content including:

1. **Headers**: Main page title and section headers (3-5 items)
2. **Text Content**: Descriptive text, labels, help text (5-8 items)
3. **Buttons**: Action buttons with labels, actions, and styles (3-6 items)
4. **Forms**: Form sections with fields and submit actions (1-3 forms)
5. **Input Fields**: Individual input elements with details (3-8 inputs)
6. **Lists**: Data lists, menus, or item collections (2-4 lists)
7. **Images**: Image placeholders with descriptions (2-4 images)
8. **Navigation**: Menu items and navigation elements (3-6 items)
9. **Additional Content**: Any other relevant content elements

**Output Format (JSON):**
{
  "pageName": "${pageReq.pageName}",
  "pageType": "${pageReq.pageType}",
  "purpose": "${pageReq.purpose}",
  "stakeholders": ${JSON.stringify(pageReq.stakeholders || [])},
  "headers": ["Main Header", "Section Header 1", "Section Header 2"],
  "textContent": ["Welcome message", "Description text", "Help text"],
  "buttons": [
    {"label": "Save", "action": "save", "style": "primary"},
    {"label": "Cancel", "action": "cancel", "style": "secondary"}
  ],
  "forms": [
    {"title": "User Information", "fields": ["Name", "Email", "Phone"], "submitAction": "submit_user_info"}
  ],
  "inputs": [
    {"label": "Full Name", "type": "text", "placeholder": "Enter your full name", "required": true},
    {"label": "Email", "type": "email", "placeholder": "Enter email address", "required": true}
  ],
  "lists": [
    {"title": "Recent Items", "items": ["Item 1", "Item 2", "Item 3"], "type": "unordered"}
  ],
  "images": [
    {"alt": "Profile picture", "description": "User profile image", "position": "top-right"},
    {"alt": "Dashboard chart", "description": "Analytics chart display", "position": "center"}
  ],
  "navigation": ["Home", "Dashboard", "Settings", "Profile", "Logout"],
  "additionalContent": ["Footer text", "Copyright notice", "Terms link"]
}

Generate realistic, relevant content that matches the page purpose and stakeholder needs. Make the content specific to the ${pageReq.pageType} page type and ${pageReq.purpose} purpose.
`;
  }

  private parseContentResponse(response: string, pageReq: any): Omit<PageContentCard, 'id' | 'isEdited'> {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        pageName: parsed.pageName || pageReq.pageName,
        pageType: parsed.pageType || pageReq.pageType,
        purpose: parsed.purpose || pageReq.purpose,
        stakeholders: parsed.stakeholders || pageReq.stakeholders || [],
        headers: Array.isArray(parsed.headers) ? parsed.headers : this.generateFallbackHeaders(pageReq),
        textContent: Array.isArray(parsed.textContent) ? parsed.textContent : this.generateFallbackTextContent(pageReq),
        buttons: Array.isArray(parsed.buttons) ? this.validateButtons(parsed.buttons) : this.generateFallbackButtons(pageReq),
        forms: Array.isArray(parsed.forms) ? this.validateForms(parsed.forms) : this.generateFallbackForms(pageReq),
        inputs: Array.isArray(parsed.inputs) ? this.validateInputs(parsed.inputs) : this.generateFallbackInputs(pageReq),
        lists: Array.isArray(parsed.lists) ? this.validateLists(parsed.lists) : this.generateFallbackLists(pageReq),
        images: Array.isArray(parsed.images) ? this.validateImages(parsed.images) : this.generateFallbackImages(pageReq),
        navigation: Array.isArray(parsed.navigation) ? parsed.navigation : this.generateFallbackNavigation(pageReq),
        additionalContent: Array.isArray(parsed.additionalContent) ? parsed.additionalContent : this.generateFallbackAdditionalContent(pageReq)
      };
      
    } catch (error) {
      console.error("Error parsing content response:", error);
      return this.generateFallbackContent(pageReq);
    }
  }

  private generateFallbackContent(pageReq: any): Omit<PageContentCard, 'id' | 'isEdited'> {
    return {
      pageName: pageReq.pageName,
      pageType: pageReq.pageType,
      purpose: pageReq.purpose,
      stakeholders: pageReq.stakeholders || [],
      headers: this.generateFallbackHeaders(pageReq),
      textContent: this.generateFallbackTextContent(pageReq),
      buttons: this.generateFallbackButtons(pageReq),
      forms: this.generateFallbackForms(pageReq),
      inputs: this.generateFallbackInputs(pageReq),
      lists: this.generateFallbackLists(pageReq),
      images: this.generateFallbackImages(pageReq),
      navigation: this.generateFallbackNavigation(pageReq),
      additionalContent: this.generateFallbackAdditionalContent(pageReq)
    };
  }

  private generateFallbackHeaders(pageReq: any): string[] {
    return [
      pageReq.pageName,
      "Overview",
      "Details",
      "Actions"
    ];
  }

  private generateFallbackTextContent(pageReq: any): string[] {
    return [
      `Welcome to ${pageReq.pageName}`,
      `This page helps you ${pageReq.purpose?.toLowerCase() || 'manage your tasks'}`,
      "Please review the information below",
      "Use the available actions to proceed",
      "Contact support if you need assistance"
    ];
  }

  private generateFallbackButtons(pageReq: any): { label: string; action: string; style: string }[] {
    const type = pageReq.pageType?.toLowerCase() || 'form';
    
    if (type.includes('dashboard')) {
      return [
        { label: "Refresh", action: "refresh", style: "secondary" },
        { label: "Export", action: "export", style: "outline" },
        { label: "Settings", action: "settings", style: "ghost" }
      ];
    } else if (type.includes('form')) {
      return [
        { label: "Save", action: "save", style: "primary" },
        { label: "Cancel", action: "cancel", style: "secondary" },
        { label: "Reset", action: "reset", style: "outline" }
      ];
    } else {
      return [
        { label: "Continue", action: "continue", style: "primary" },
        { label: "Back", action: "back", style: "secondary" }
      ];
    }
  }

  private generateFallbackForms(pageReq: any): { title: string; fields: string[]; submitAction: string }[] {
    const type = pageReq.pageType?.toLowerCase() || 'form';
    
    if (type.includes('form') || type.includes('input')) {
      return [
        {
          title: `${pageReq.pageName} Form`,
          fields: ["Name", "Email", "Description", "Category"],
          submitAction: "submit_form"
        }
      ];
    } else {
      return [
        {
          title: "Search",
          fields: ["Query", "Filters"],
          submitAction: "search"
        }
      ];
    }
  }

  private generateFallbackInputs(pageReq: any): { label: string; type: string; placeholder: string; required: boolean }[] {
    return [
      { label: "Name", type: "text", placeholder: "Enter name", required: true },
      { label: "Email", type: "email", placeholder: "Enter email address", required: true },
      { label: "Description", type: "textarea", placeholder: "Enter description", required: false },
      { label: "Category", type: "select", placeholder: "Select category", required: true }
    ];
  }

  private generateFallbackLists(pageReq: any): { title: string; items: string[]; type: string }[] {
    return [
      {
        title: "Recent Items",
        items: ["Item 1", "Item 2", "Item 3", "Item 4"],
        type: "unordered"
      },
      {
        title: "Actions",
        items: ["View Details", "Edit", "Delete", "Share"],
        type: "action"
      }
    ];
  }

  private generateFallbackImages(pageReq: any): { alt: string; description: string; position: string }[] {
    return [
      { alt: "Header image", description: "Page header banner", position: "top" },
      { alt: "Content image", description: "Main content illustration", position: "center" },
      { alt: "Icon", description: "Feature icon", position: "sidebar" }
    ];
  }

  private generateFallbackNavigation(pageReq: any): string[] {
    return [
      "Home",
      "Dashboard",
      "Profile",
      "Settings",
      "Help",
      "Logout"
    ];
  }

  private generateFallbackAdditionalContent(pageReq: any): string[] {
    return [
      "Last updated: Today",
      "Need help? Contact support",
      "Terms and conditions apply",
      "© 2024 Application Name"
    ];
  }

  private validateButtons(buttons: any[]): { label: string; action: string; style: string }[] {
    return buttons.map(btn => ({
      label: String(btn.label || btn.text || btn.name || "Button"),
      action: String(btn.action || btn.onClick || btn.handler || "click"),
      style: String(btn.style || btn.variant || btn.type || "primary")
    }));
  }

  private validateForms(forms: any[]): { title: string; fields: string[]; submitAction: string }[] {
    return forms.map(form => ({
      title: String(form.title || form.name || "Form"),
      fields: Array.isArray(form.fields) 
        ? form.fields.map((field: any) => 
            typeof field === 'string' ? field : String(field.label || field.name || field.placeholder || "Field")
          )
        : ["Field 1", "Field 2"],
      submitAction: String(form.submitAction || form.action || form.onSubmit || "submit")
    }));
  }

  private validateInputs(inputs: any[]): { label: string; type: string; placeholder: string; required: boolean }[] {
    return inputs.map(input => ({
      label: String(input.label || input.name || "Input"),
      type: String(input.type || "text"),
      placeholder: String(input.placeholder || input.hint || "Enter value"),
      required: Boolean(input.required || input.mandatory || false)
    }));
  }

  private validateLists(lists: any[]): { title: string; items: string[]; type: string }[] {
    return lists.map(list => ({
      title: String(list.title || list.name || "List"),
      items: Array.isArray(list.items) 
        ? list.items.map((item: any) => 
            typeof item === 'string' ? item : String(item.text || item.label || item.name || "Item")
          )
        : ["Item 1", "Item 2"],
      type: String(list.type || "unordered")
    }));
  }

  private validateImages(images: any[]): { alt: string; description: string; position: string }[] {
    return images.map(image => ({
      alt: String(image.alt || image.title || "Image"),
      description: String(image.description || image.caption || "Image description"),
      position: String(image.position || image.location || "center")
    }));
  }
}

export function createPageContentAgent(): PageContentAgent {
  return new PageContentAgent();
}
import { useToast } from "@/hooks/use-toast";

export interface FigmaFrame {
  name: string;
  width: number;
  height: number;
  children: FigmaNode[];
  fills: FigmaFill[];
  backgroundColor?: string;
}

export interface FigmaNode {
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: FigmaFill[];
  characters?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  children?: FigmaNode[];
  cornerRadius?: number;
  strokeWeight?: number;
  strokes?: FigmaStroke[];
}

export interface FigmaFill {
  type: string;
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

export interface FigmaStroke {
  type: string;
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

export interface WireframeForExport {
  id: string;
  pageName: string;
  htmlCode: string;
  cssCode?: string;
  userType?: string;
  features?: string[];
  createdAt?: string;
}

export class FigmaExporter {
  private static parseHexColor(hex: string): { r: number; g: number; b: number; a: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return { r: 0, g: 0, b: 0, a: 1 };
    }
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
      a: 1,
    };
  }

  private static extractStylesFromHTML(html: string): {
    colors: string[];
    fonts: string[];
    dimensions: { width: number; height: number };
  } {
    const colors: string[] = [];
    const fonts: string[] = [];
    
    // Extract colors from inline styles and CSS
    const colorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g;
    const colorMatches = html.match(colorRegex);
    if (colorMatches) {
      colors.push(...colorMatches);
    }
    
    // Extract rgb colors
    const rgbRegex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g;
    let rgbMatch;
    while ((rgbMatch = rgbRegex.exec(html)) !== null) {
      const hex = `#${parseInt(rgbMatch[1]).toString(16).padStart(2, '0')}${parseInt(rgbMatch[2]).toString(16).padStart(2, '0')}${parseInt(rgbMatch[3]).toString(16).padStart(2, '0')}`;
      colors.push(hex);
    }
    
    // Extract font families
    const fontRegex = /font-family:\s*([^;]+)/g;
    let fontMatch;
    while ((fontMatch = fontRegex.exec(html)) !== null) {
      fonts.push(fontMatch[1].replace(/['"]/g, '').trim());
    }
    
    return {
      colors: [...new Set(colors)],
      fonts: [...new Set(fonts)],
      dimensions: { width: 1200, height: 800 }, // Default dimensions
    };
  }

  private static convertHTMLToFigmaNodes(html: string, pageName: string, pageIndex: number): FigmaNode[] {
    const nodes: FigmaNode[] = [];
    let yOffset = 0;
    const styles = this.extractStylesFromHTML(html);
    
    // Create header section
    if (html.includes('<h1') || html.includes('<h2') || html.includes('<h3')) {
      nodes.push({
        id: `${pageIndex}:${nodes.length + 2}`,
        type: 'TEXT',
        name: `${pageName} - Header`,
        blendMode: 'PASS_THROUGH',
        absoluteBoundingBox: {
          x: 32,
          y: yOffset,
          width: 300,
          height: 48,
        },
        constraints: {
          vertical: 'TOP',
          horizontal: 'LEFT',
        },
        characters: pageName,
        style: {
          fontFamily: styles.fonts[0] || 'Inter',
          fontPostScriptName: styles.fonts[0] || 'Inter-Bold',
          fontWeight: 700,
          fontSize: 32,
          textAlignHorizontal: 'LEFT',
          textAlignVertical: 'TOP',
        },
        fills: [{ 
          blendMode: 'NORMAL',
          type: 'SOLID', 
          color: this.parseHexColor('#000000') 
        }],
        strokes: [],
        strokeWeight: 0,
      } as any);
      yOffset += 80;
    }
    
    // Create navigation section if nav elements exist
    if (html.includes('<nav') || html.includes('navigation')) {
      nodes.push({
        type: 'RECTANGLE',
        name: 'Navigation Bar',
        x: 0,
        y: yOffset,
        width: 1200,
        height: 60,
        fills: [{ type: 'SOLID', color: this.parseHexColor(styles.colors[0] || '#f8f9fa') }],
        cornerRadius: 8,
      });
      
      nodes.push({
        type: 'TEXT',
        name: 'Navigation Items',
        x: 32,
        y: yOffset + 20,
        width: 200,
        height: 20,
        characters: 'Home • About • Services • Contact',
        fontSize: 14,
        fontFamily: styles.fonts[0] || 'Inter',
        fills: [{ type: 'SOLID', color: this.parseHexColor('#333333') }],
      });
      yOffset += 100;
    }
    
    // Create main content area
    if (html.includes('<main') || html.includes('content')) {
      nodes.push({
        type: 'RECTANGLE',
        name: 'Main Content Area',
        x: 32,
        y: yOffset,
        width: 1136,
        height: 400,
        fills: [{ type: 'SOLID', color: this.parseHexColor('#ffffff') }],
        strokeWeight: 1,
        strokes: [{ type: 'SOLID', color: this.parseHexColor('#e0e0e0') }],
        cornerRadius: 12,
      });
      yOffset += 40;
    }
    
    // Create form elements if forms exist
    if (html.includes('<form') || html.includes('<input')) {
      nodes.push({
        type: 'RECTANGLE',
        name: 'Form Container',
        x: 64,
        y: yOffset,
        width: 400,
        height: 300,
        fills: [{ type: 'SOLID', color: this.parseHexColor('#f8f9fa') }],
        cornerRadius: 8,
      });
      
      // Add form fields
      for (let i = 0; i < 3; i++) {
        nodes.push({
          type: 'RECTANGLE',
          name: `Input Field ${i + 1}`,
          x: 96,
          y: yOffset + 40 + (i * 60),
          width: 336,
          height: 40,
          fills: [{ type: 'SOLID', color: this.parseHexColor('#ffffff') }],
          strokeWeight: 1,
          strokes: [{ type: 'SOLID', color: this.parseHexColor('#d1d5db') }],
          cornerRadius: 6,
        });
      }
      yOffset += 340;
    }
    
    // Create button elements
    if (html.includes('<button') || html.includes('btn')) {
      nodes.push({
        type: 'RECTANGLE',
        name: 'Primary Button',
        x: 96,
        y: yOffset,
        width: 120,
        height: 40,
        fills: [{ type: 'SOLID', color: this.parseHexColor(styles.colors[1] || '#3b82f6') }],
        cornerRadius: 8,
      });
      
      nodes.push({
        type: 'TEXT',
        name: 'Button Text',
        x: 126,
        y: yOffset + 12,
        width: 60,
        height: 16,
        characters: 'Submit',
        fontSize: 14,
        fontWeight: 'medium',
        fontFamily: styles.fonts[0] || 'Inter',
        textAlignHorizontal: 'CENTER',
        fills: [{ type: 'SOLID', color: this.parseHexColor('#ffffff') }],
      });
      yOffset += 80;
    }
    
    // Create sidebar if it exists
    if (html.includes('sidebar') || html.includes('aside')) {
      nodes.push({
        type: 'RECTANGLE',
        name: 'Sidebar',
        x: 900,
        y: 200,
        width: 268,
        height: 400,
        fills: [{ type: 'SOLID', color: this.parseHexColor('#f3f4f6') }],
        strokeWeight: 1,
        strokes: [{ type: 'SOLID', color: this.parseHexColor('#e5e7eb') }],
        cornerRadius: 8,
      });
    }
    
    return nodes;
  }

  static exportToFigma(wireframes: WireframeForExport[]): {
    figmaData: any;
    fileName: string;
    importGuide: string;
  } {
    const figmaDocument = {
      document: {
        id: '0:0',
        name: 'Wireframe Export',
        type: 'DOCUMENT',
        children: wireframes.map((wireframe, index) => ({
          id: `0:${index + 1}`,
          name: wireframe.pageName,
          type: 'CANVAS',
          backgroundColor: this.parseHexColor('#f5f5f5'),
          prototypeStartNodeID: null,
          flowStartingPoints: [],
          children: [
            {
              id: `${index + 1}:1`,
              name: `${wireframe.pageName} - Desktop`,
              type: 'FRAME',
              blendMode: 'PASS_THROUGH',
              absoluteBoundingBox: {
                x: 0,
                y: 0,
                width: 1200,
                height: 800,
              },
              absoluteRenderBounds: {
                x: 0,
                y: 0,
                width: 1200,
                height: 800,
              },
              constraints: {
                vertical: 'TOP',
                horizontal: 'LEFT',
              },
              fills: [{ 
                blendMode: 'NORMAL',
                type: 'SOLID', 
                color: this.parseHexColor('#ffffff') 
              }],
              strokes: [],
              strokeWeight: 1,
              strokeAlign: 'INSIDE',
              backgroundColor: this.parseHexColor('#ffffff'),
              cornerRadius: 8,
              effects: [{
                type: 'DROP_SHADOW',
                visible: true,
                color: { r: 0, g: 0, b: 0, a: 0.1 },
                blendMode: 'NORMAL',
                offset: { x: 0, y: 4 },
                radius: 8,
                spread: 0,
              }],
              children: this.convertHTMLToFigmaNodes(wireframe.htmlCode, wireframe.pageName, index + 1),
            },
          ],
        })),
      },
      components: {},
      componentSets: {},
      schemaVersion: 0,
      styles: this.generateFigmaStyles(wireframes),
      lastModified: new Date().toISOString(),
      thumbnailUrl: '',
      version: '1.0.0',
      role: 'owner',
      editorType: 'figma',
      linkAccess: 'inherit',
    };

    const importGuide = this.generateImportGuide();
    const fileName = `wireframes-figma-${new Date().toISOString().split('T')[0]}.fig`;
    
    return {
      figmaData: figmaDocument,
      fileName,
      importGuide,
    };
  }

  private static generateFigmaStyles(wireframes: WireframeForExport[]): any {
    const styles: any = {};
    const allColors = new Set<string>();
    const allFonts = new Set<string>();
    
    wireframes.forEach(wireframe => {
      const extracted = this.extractStylesFromHTML(wireframe.htmlCode);
      extracted.colors.forEach(color => allColors.add(color));
      extracted.fonts.forEach(font => allFonts.add(font));
    });

    // Generate color styles
    Array.from(allColors).forEach((color, index) => {
      styles[`color_${index}`] = {
        key: `color_${index}`,
        name: `Color/${color}`,
        styleType: 'FILL',
        fills: [{
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: this.parseHexColor(color),
        }],
      };
    });

    // Generate text styles
    Array.from(allFonts).forEach((font, index) => {
      styles[`text_${index}`] = {
        key: `text_${index}`,
        name: `Typography/${font}`,
        styleType: 'TEXT',
        fontSize: 16,
        fontFamily: font,
        fontWeight: 400,
        lineHeight: { unit: 'PERCENT', value: 120 },
        letterSpacing: { unit: 'PERCENT', value: 0 },
      };
    });

    return styles;
  }

  private static generateImportGuide(): string {
    return `
🎨 FIGMA IMPORT GUIDE
====================

METHOD 1: Figma Plugin Import (Recommended)
-------------------------------------------
1. Open Figma in your browser (figma.com)
2. Go to "Plugins" → "Browse all plugins"
3. Search for and install one of these plugins:
   • "JSON to Figma" (most popular)
   • "Figma Import"
   • "Design Tokens"
4. Run the plugin and upload your JSON file
5. The plugin will create frames and elements automatically

METHOD 2: Manual Recreation
---------------------------
1. Open the downloaded JSON file in a text editor
2. Create a new Figma file
3. For each page in the JSON:
   - Create a new frame with the specified dimensions
   - Add rectangles, text, and other elements based on the JSON structure
   - Apply colors and typography from the styles section

METHOD 3: Design Tokens Import
------------------------------
1. Use the separate design tokens file (.json)
2. Install "Design Tokens" plugin in Figma
3. Import colors, typography, and spacing tokens
4. Use tokens to manually recreate the wireframes

WHAT'S INCLUDED IN THE EXPORT:
==============================
✓ Simplified element structure optimized for plugin import
✓ Page and frame organization
✓ Text elements with font and color specifications
✓ Rectangle shapes for UI components
✓ Color palette extracted from wireframes
✓ Typography definitions
✓ Positioning and dimension data
✓ Metadata for proper organization

TROUBLESHOOTING:
================
- Figma doesn't support direct JSON import - plugins are required
- If a plugin fails, try a different JSON to Figma plugin
- Some elements may need manual adjustment after import
- Complex layouts might require manual fine-tuning
- Colors may need to be added to your Figma color styles manually

PLUGIN RECOMMENDATIONS:
======================
1. "JSON to Figma" - Best for complete wireframe import
2. "Figma Import" - Good alternative with different parsing
3. "Design Tokens" - Perfect for importing just the color/typography system

The exported JSON is optimized for these plugins and contains all necessary data for recreation in Figma.
`;
  }

  static async exportToFigmaDesignTokens(wireframes: WireframeForExport[]): Promise<{
    tokens: any;
    fileName: string;
  }> {
    const allColors = new Set<string>();
    const allFonts = new Set<string>();
    
    wireframes.forEach(wireframe => {
      const styles = this.extractStylesFromHTML(wireframe.htmlCode);
      styles.colors.forEach(color => allColors.add(color));
      styles.fonts.forEach(font => allFonts.add(font));
    });

    const designTokens = {
      colors: Object.fromEntries(
        Array.from(allColors).map((color, index) => [
          `color-${index + 1}`,
          {
            value: color,
            type: 'color',
            description: `Extracted from wireframes`,
          },
        ])
      ),
      typography: Object.fromEntries(
        Array.from(allFonts).map((font, index) => [
          `font-${index + 1}`,
          {
            value: font,
            type: 'fontFamily',
            description: `Font family used in wireframes`,
          },
        ])
      ),
      spacing: {
        'xs': {
          value: '8px',
          type: 'spacing',
        },
        'sm': {
          value: '16px',
          type: 'spacing',
        },
        'md': {
          value: '24px',
          type: 'spacing',
        },
        'lg': {
          value: '32px',
          type: 'spacing',
        },
        'xl': {
          value: '48px',
          type: 'spacing',
        },
      },
    };

    return {
      tokens: designTokens,
      fileName: `design-tokens-${new Date().toISOString().split('T')[0]}.json`,
    };
  }

  static downloadFigmaExport(wireframes: WireframeForExport[]): { fileName: string } {
    // Create multiple export formats for maximum compatibility
    
    // Format 1: Simplified HTML/CSS structure (most compatible)
    const htmlCssData = {
      format: "html-css-wireframes",
      version: "1.0",
      wireframes: wireframes.map((wireframe, index) => ({
        id: wireframe.id,
        name: wireframe.pageName,
        html: wireframe.htmlCode,
        css: wireframe.cssCode || "",
        metadata: {
          userType: wireframe.userType,
          features: wireframe.features,
          createdAt: wireframe.createdAt
        }
      }))
    };

    // Format 2: Basic Figma-style structure
    const figmaStyleData = {
      name: "Wireframe Export",
      children: wireframes.map((wireframe, index) => ({
        name: wireframe.pageName,
        type: "CANVAS",
        children: [{
          name: `${wireframe.pageName} Frame`,
          type: "FRAME",
          width: 1200,
          height: 800,
          children: this.convertHTMLToBasicNodes(wireframe.htmlCode, wireframe.pageName)
        }]
      }))
    };

    // Format 3: Design specification document
    const specData = {
      project: "Wireframe Specifications",
      pages: wireframes.map(wireframe => {
        const styles = this.extractStylesFromHTML(wireframe.htmlCode);
        return {
          name: wireframe.pageName,
          elements: this.analyzeHTMLStructure(wireframe.htmlCode),
          colors: styles.colors,
          fonts: styles.fonts,
          layout: "1200x800px desktop layout"
        };
      })
    };

    const dateStr = new Date().toISOString().split('T')[0];
    
    // Download HTML/CSS format (primary)
    const htmlFileName = `wireframes-html-css-${dateStr}.json`;
    this.downloadFile(JSON.stringify(htmlCssData, null, 2), htmlFileName, 'application/json');
    
    // Download Figma-style format
    const figmaFileName = `wireframes-figma-style-${dateStr}.json`;
    this.downloadFile(JSON.stringify(figmaStyleData, null, 2), figmaFileName, 'application/json');
    
    // Download design spec
    const specFileName = `wireframes-design-spec-${dateStr}.json`;
    this.downloadFile(JSON.stringify(specData, null, 2), specFileName, 'application/json');
    
    // Download combined HTML file for browser viewing
    const combinedHtml = this.createCombinedHTMLFile(wireframes);
    const htmlFileName2 = `wireframes-preview-${dateStr}.html`;
    this.downloadFile(combinedHtml, htmlFileName2, 'text/html');

    return { fileName: htmlFileName };
  }

  private static downloadFile(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private static convertHTMLToBasicNodes(html: string, pageName: string): any[] {
    const nodes = [];
    let y = 0;
    
    // Header
    nodes.push({
      name: "Header",
      type: "TEXT",
      characters: pageName,
      x: 0,
      y: y,
      width: 400,
      height: 48,
      fontSize: 32,
      fontName: { family: "Inter", style: "Bold" }
    });
    y += 80;
    
    // Navigation
    if (html.includes('nav') || html.includes('menu')) {
      nodes.push({
        name: "Navigation",
        type: "RECTANGLE",
        x: 0,
        y: y,
        width: 1200,
        height: 60,
        fills: [{ type: "SOLID", color: { r: 0.97, g: 0.97, b: 0.97 } }]
      });
      y += 80;
    }
    
    // Main content
    nodes.push({
      name: "Main Content",
      type: "RECTANGLE",
      x: 0,
      y: y,
      width: 1200,
      height: 400,
      fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
      strokes: [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }]
    });
    
    return nodes;
  }

  private static analyzeHTMLStructure(html: string): any[] {
    const elements = [];
    
    if (html.includes('<h1') || html.includes('<h2')) {
      elements.push({ type: "heading", content: "Page title/header" });
    }
    if (html.includes('<nav')) {
      elements.push({ type: "navigation", content: "Navigation menu" });
    }
    if (html.includes('<form') || html.includes('<input')) {
      elements.push({ type: "form", content: "Input form with fields" });
    }
    if (html.includes('<button')) {
      elements.push({ type: "button", content: "Action buttons" });
    }
    if (html.includes('sidebar')) {
      elements.push({ type: "sidebar", content: "Side navigation or info panel" });
    }
    
    return elements;
  }

  private static createCombinedHTMLFile(wireframes: WireframeForExport[]): string {
    const pages = wireframes.map((wireframe, index) => `
      <div class="wireframe-page" style="margin-bottom: 50px; padding: 20px; border: 2px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; margin-bottom: 20px; font-family: Arial, sans-serif;">
          ${wireframe.pageName}
        </h2>
        <div style="border: 1px solid #ccc; border-radius: 4px; overflow: hidden;">
          ${wireframe.htmlCode}
        </div>
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wireframe Export - Preview</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 20px; 
      background: #f5f5f5; 
    }
    .wireframe-page { 
      background: white; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
    }
  </style>
</head>
<body>
  <h1 style="text-align: center; color: #333; margin-bottom: 40px;">
    Wireframe Export Preview
  </h1>
  ${pages}
  <div style="text-align: center; margin-top: 40px; color: #666; font-size: 14px;">
    Generated on ${new Date().toLocaleDateString()} by AI Wireframe Designer
  </div>
</body>
</html>`;
  }

  private static convertHTMLToSimpleElements(html: string, pageName: string): any[] {
    const elements = [];
    let yOffset = 40;
    const styles = this.extractStylesFromHTML(html);
    
    // Header element
    if (html.includes('<h1') || html.includes('<h2') || html.includes('<h3')) {
      elements.push({
        type: 'TEXT',
        name: `${pageName} Header`,
        x: 40,
        y: yOffset,
        width: 400,
        height: 48,
        text: pageName,
        fontSize: 32,
        fontFamily: styles.fonts[0] || 'Inter',
        fontWeight: 'bold',
        color: '#000000'
      });
      yOffset += 80;
    }
    
    // Navigation bar
    if (html.includes('<nav') || html.includes('navigation')) {
      elements.push({
        type: 'RECTANGLE',
        name: 'Navigation Bar',
        x: 0,
        y: yOffset,
        width: 1200,
        height: 60,
        fill: styles.colors[0] || '#f8f9fa',
        cornerRadius: 8
      });
      
      elements.push({
        type: 'TEXT',
        name: 'Nav Items',
        x: 40,
        y: yOffset + 20,
        width: 300,
        height: 20,
        text: 'Home • About • Services • Contact',
        fontSize: 14,
        fontFamily: styles.fonts[0] || 'Inter',
        color: '#333333'
      });
      yOffset += 100;
    }
    
    // Main content area
    elements.push({
      type: 'RECTANGLE',
      name: 'Content Area',
      x: 40,
      y: yOffset,
      width: 1120,
      height: 400,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 1,
      cornerRadius: 12
    });
    
    // Form elements
    if (html.includes('<form') || html.includes('<input')) {
      elements.push({
        type: 'RECTANGLE',
        name: 'Form Container',
        x: 80,
        y: yOffset + 40,
        width: 400,
        height: 300,
        fill: '#f8f9fa',
        cornerRadius: 8
      });
      
      // Input fields
      for (let i = 0; i < 3; i++) {
        elements.push({
          type: 'RECTANGLE',
          name: `Input Field ${i + 1}`,
          x: 120,
          y: yOffset + 80 + (i * 60),
          width: 320,
          height: 40,
          fill: '#ffffff',
          stroke: '#d1d5db',
          strokeWidth: 1,
          cornerRadius: 6
        });
      }
    }
    
    // Buttons
    if (html.includes('<button') || html.includes('btn')) {
      elements.push({
        type: 'RECTANGLE',
        name: 'Primary Button',
        x: 120,
        y: yOffset + 300,
        width: 120,
        height: 40,
        fill: styles.colors[1] || '#3b82f6',
        cornerRadius: 8
      });
      
      elements.push({
        type: 'TEXT',
        name: 'Button Text',
        x: 150,
        y: yOffset + 312,
        width: 60,
        height: 16,
        text: 'Submit',
        fontSize: 14,
        fontFamily: styles.fonts[0] || 'Inter',
        color: '#ffffff',
        textAlign: 'center'
      });
    }
    
    return elements;
  }

  static async downloadDesignTokens(wireframes: WireframeForExport[]): Promise<void> {
    const { tokens, fileName } = await this.exportToFigmaDesignTokens(wireframes);
    
    const dataStr = JSON.stringify(tokens, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
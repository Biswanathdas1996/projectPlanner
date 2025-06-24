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

METHOD 1: Direct JSON Import (Recommended)
------------------------------------------
1. Open Figma in your browser (figma.com)
2. Create a new file or open existing file
3. Go to "File" → "Import"
4. Select the downloaded .fig JSON file
5. Figma will automatically create pages for each wireframe

METHOD 2: Figma Plugin Import
-----------------------------
1. In Figma, go to "Plugins" → "Browse all plugins"
2. Search for "JSON to Figma" or "Import JSON"
3. Install a JSON import plugin
4. Run the plugin and upload your JSON file
5. Configure import settings as needed

METHOD 3: Copy & Paste Approach
--------------------------------
1. Open the JSON file in a text editor
2. Copy specific node structures
3. Use Figma plugins like "JSON to Figma" to convert individual components
4. Manually recreate layouts based on the JSON structure

WHAT'S INCLUDED IN THE EXPORT:
==============================
✓ Page structure with proper canvas organization
✓ Frame layouts for each wireframe
✓ Text elements with font specifications
✓ Rectangle components for UI elements
✓ Color definitions extracted from your wireframes
✓ Typography styles and font families
✓ Layout positioning and dimensions
✓ Design tokens for consistent styling

TROUBLESHOOTING:
================
- If direct import fails, try Method 2 with plugins
- Ensure your Figma account has sufficient permissions
- Large files may need to be split into smaller chunks
- Some styling may need manual adjustment after import

DESIGN TOKENS FILE:
==================
Use the separate design tokens file to set up your design system:
1. Import colors into your Figma color styles
2. Set up typography styles using the font specifications
3. Create component variants using the spacing definitions

For best results, review and refine the imported elements to match your design standards.
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
    const { figmaData, fileName, importGuide } = this.exportToFigma(wireframes);
    
    // Download the Figma file
    const dataStr = JSON.stringify(figmaData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Download the import guide
    const guideBlob = new Blob([importGuide], { type: 'text/plain' });
    const guideUrl = URL.createObjectURL(guideBlob);
    const guideLink = document.createElement('a');
    guideLink.href = guideUrl;
    guideLink.download = 'figma-import-guide.txt';
    document.body.appendChild(guideLink);
    guideLink.click();
    document.body.removeChild(guideLink);
    URL.revokeObjectURL(guideUrl);

    return { fileName };
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
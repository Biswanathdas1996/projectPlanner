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

  private static convertHTMLToFigmaNodes(html: string, pageName: string): FigmaNode[] {
    const nodes: FigmaNode[] = [];
    let yOffset = 0;
    const styles = this.extractStylesFromHTML(html);
    
    // Create header section
    if (html.includes('<h1') || html.includes('<h2') || html.includes('<h3')) {
      nodes.push({
        type: 'TEXT',
        name: `${pageName} - Header`,
        x: 32,
        y: yOffset,
        width: 300,
        height: 48,
        characters: pageName,
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: styles.fonts[0] || 'Inter',
        textAlignHorizontal: 'LEFT',
        fills: [{ type: 'SOLID', color: this.parseHexColor('#000000') }],
      });
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
  } {
    const figmaDocument = {
      name: 'Wireframe Export',
      type: 'DOCUMENT',
      children: wireframes.map((wireframe, index) => ({
        name: wireframe.pageName,
        type: 'CANVAS',
        backgroundColor: this.parseHexColor('#ffffff'),
        children: [
          {
            name: `${wireframe.pageName} Frame`,
            type: 'FRAME',
            x: 0,
            y: 0,
            width: 1200,
            height: 800,
            fills: [{ type: 'SOLID', color: this.parseHexColor('#ffffff') }],
            children: this.convertHTMLToFigmaNodes(wireframe.htmlCode, wireframe.pageName),
          },
        ],
        prototypeDevice: {
          type: 'PRESET',
          preset: 'DESKTOP',
        },
      })),
      version: '1.0',
      exportSettings: {
        format: 'FIGMA',
        includeFills: true,
        includeStrokes: true,
      },
    };

    const fileName = `wireframes-export-${new Date().toISOString().split('T')[0]}.figma.json`;
    
    return {
      figmaData: figmaDocument,
      fileName,
    };
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

  static downloadFigmaExport(wireframes: WireframeForExport[]): void {
    const { figmaData, fileName } = this.exportToFigma(wireframes);
    
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
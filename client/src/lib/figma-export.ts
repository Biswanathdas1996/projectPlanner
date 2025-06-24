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

  static async exportToFigmaUsingHtmlToDesign(wireframes: WireframeForExport[]): Promise<void> {
    const htmlToDesignAPI = 'https://htmlcsstoimage.com/demo_run';
    const results: Array<{ name: string; url: string; html: string }> = [];
    
    for (const wireframe of wireframes) {
      try {
        // Prepare HTML for html.to.design conversion
        const cleanHTML = this.prepareHTMLForFigma(wireframe.htmlCode, wireframe.pageName);
        
        // Create a data URL for the HTML content
        const htmlBlob = new Blob([cleanHTML], { type: 'text/html' });
        const htmlUrl = URL.createObjectURL(htmlBlob);
        
        results.push({
          name: wireframe.pageName,
          url: htmlUrl,
          html: cleanHTML
        });
        
        console.log(`Prepared ${wireframe.pageName} for Figma conversion`);
      } catch (error) {
        console.error(`Error preparing ${wireframe.pageName} for Figma:`, error);
      }
    }
    
    // Create instructions for using html.to.design
    const instructions = this.generateFigmaInstructions(results);
    
    // Download the instructions and HTML files
    this.downloadFigmaPackage(results, instructions);
  }

  private static prepareHTMLForFigma(htmlCode: string, pageName: string): string {
    // Clean and optimize HTML for Figma conversion
    const optimizedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageName} - Figma Ready</title>
    <style>
        /* Optimize for Figma conversion */
        * {
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #ffffff;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        /* Ensure consistent spacing for Figma */
        .figma-frame {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        /* Optimize buttons for Figma components */
        button, .btn {
            border: none;
            border-radius: 6px;
            padding: 12px 24px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        /* Optimize form elements */
        input, textarea, select {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 12px;
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
        }
        
        /* Optimize typography */
        h1, h2, h3, h4, h5, h6 {
            margin: 0 0 16px 0;
            line-height: 1.4;
        }
        
        p {
            margin: 0 0 16px 0;
            line-height: 1.6;
        }
        
        /* Grid and layout optimization */
        .grid {
            display: grid;
            gap: 24px;
        }
        
        .flex {
            display: flex;
            gap: 16px;
        }
    </style>
</head>
<body>
    <div class="figma-frame">
        ${htmlCode.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}
    </div>
</body>
</html>`;
    
    return optimizedHTML;
  }

  private static generateFigmaInstructions(results: Array<{ name: string; url: string; html: string }>): string {
    return `# 🎨 Figma Export Guide - AI Generated Wireframes

## Quick Start: Convert HTML Wireframes to Figma Components

### 📋 What You Downloaded:
- ${results.length} optimized HTML wireframe files
- This instruction guide (figma-import-instructions.md)
- Complete wireframe package (JSON format)

### 🚀 Step-by-Step Conversion Process:

#### Step 1: Access html.to.design
1. Visit **https://html.to.design**
2. Create a free account or sign in
3. This service converts HTML directly to editable Figma components

#### Step 2: Convert Each Wireframe
${results.map((result, index) => `
**${index + 1}. Converting "${result.name}"**
   - Open file: \`${result.name.toLowerCase().replace(/\s+/g, '-')}.html\`
   - Select all content (Ctrl+A / Cmd+A)
   - Copy the HTML code
   - Paste into html.to.design converter
   - Click "Convert to Figma"
   - Download the generated .fig file
`).join('')}

#### Step 3: Import to Figma
1. Open Figma desktop app or web version
2. Create new file or open existing project
3. Import each converted .fig file
4. Organize wireframes into pages/sections

### ✨ What You'll Get in Figma:
- **Editable Components**: Buttons, forms, cards become Figma components
- **Proper Typography**: Text styles are preserved and convertible
- **Layout Structure**: Grids, flexbox layouts maintained
- **Color Palette**: Extracted colors available as styles
- **Interactive Elements**: Buttons and forms ready for prototyping

### 🎯 Pro Tips for Best Results:

**Before Converting:**
- Each HTML file is optimized for Figma conversion
- Scripts removed, styles cleaned for compatibility
- Consistent spacing and typography applied

**After Converting:**
1. **Create Component Library**: Turn repeated elements into components
2. **Set Up Auto-Layout**: Apply to containers for responsive behavior  
3. **Define Color Styles**: Extract brand colors into Figma color styles
4. **Typography System**: Convert text styles to Figma text styles
5. **Organize Layers**: Group related elements and name layers clearly

### 📊 Wireframe Inventory:
${results.map((result, index) => `${index + 1}. **${result.name}** - Ready for conversion`).join('\n')}

### 🔧 Troubleshooting:
- **Complex layouts**: May need manual adjustment after conversion
- **Custom fonts**: Add font files to Figma before importing
- **Images**: Replace placeholder images with actual assets
- **Animations**: Add Figma prototyping interactions after import

### 🌟 Next Steps:
1. Convert all wireframes using html.to.design
2. Create a master Figma file with all screens
3. Build component library from converted elements
4. Add prototyping connections between screens
5. Share with team for design iteration

---
**Generated**: ${new Date().toLocaleDateString()} | **Tool**: AI Wireframe Designer | **Total Files**: ${results.length}
**Conversion Method**: html.to.design for maximum Figma compatibility`;
  }

  private static downloadFigmaPackage(
    results: Array<{ name: string; url: string; html: string }>, 
    instructions: string
  ): void {
    // Create a zip-like structure with all files
    const packageData = {
      instructions: instructions,
      wireframes: results.map(result => ({
        name: result.name,
        filename: `${result.name.toLowerCase().replace(/\s+/g, '-')}.html`,
        content: result.html
      })),
      metadata: {
        exportDate: new Date().toISOString(),
        totalWireframes: results.length,
        exportTool: 'AI Wireframe Designer',
        figmaMethod: 'html.to.design'
      }
    };
    
    // Download the complete package as JSON
    const dataStr = JSON.stringify(packageData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `figma-wireframes-package-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Also download instructions separately
    const instructionsBlob = new Blob([instructions], { type: 'text/markdown' });
    const instructionsUrl = URL.createObjectURL(instructionsBlob);
    const instructionsLink = document.createElement('a');
    instructionsLink.href = instructionsUrl;
    instructionsLink.download = 'figma-import-instructions.md';
    document.body.appendChild(instructionsLink);
    instructionsLink.click();
    document.body.removeChild(instructionsLink);
    URL.revokeObjectURL(instructionsUrl);
    
    // Download individual HTML files
    results.forEach(result => {
      const htmlBlob = new Blob([result.html], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      const htmlLink = document.createElement('a');
      htmlLink.href = htmlUrl;
      htmlLink.download = `${result.name.toLowerCase().replace(/\s+/g, '-')}.html`;
      document.body.appendChild(htmlLink);
      htmlLink.click();
      document.body.removeChild(htmlLink);
      URL.revokeObjectURL(htmlUrl);
      
      // Clean up the object URL
      URL.revokeObjectURL(result.url);
    });
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
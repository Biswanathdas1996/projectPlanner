import { WireframeExportData } from './svg-export-utils';

/**
 * Directly converts HTML wireframe to SVG by parsing and recreating the layout
 * This ensures the SVG exactly matches the wireframe structure
 */
export async function convertWireframeToDirectSVG(
  wireframe: WireframeExportData,
  options: { width: number; height: number; backgroundColor: string } = {
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff'
  }
): Promise<string> {
  
  // Extract styles and content from HTML
  const styleMatch = wireframe.htmlCode.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const styles = styleMatch ? styleMatch[1] : '';
  
  // Extract body content, removing HTML/body tags but keeping inner content
  let bodyContent = wireframe.htmlCode;
  const bodyMatch = wireframe.htmlCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1];
  } else {
    // Remove DOCTYPE, html, head tags but keep everything else
    bodyContent = wireframe.htmlCode
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>/gi, '')
      .replace(/<\/body>/gi, '');
  }
  
  // Parse CSS variables and colors
  const cssVars = extractCSSVariables(styles);
  const colors = extractColors(styles, cssVars);
  
  // Create SVG structure based on HTML elements
  const svgElements = await parseHTMLToSVG(bodyContent, colors, options);
  
  // Create complete SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .wireframe-text { font-family: Arial, sans-serif; }
      .header-text { font-size: 24px; font-weight: bold; }
      .content-text { font-size: 14px; }
      .small-text { font-size: 12px; }
      .button-text { font-size: 14px; font-weight: 500; }
    </style>
  </defs>
  
  <rect width="100%" height="100%" fill="${options.backgroundColor}"/>
  
  ${svgElements}
  
  <!-- Watermark -->
  <text x="${options.width - 10}" y="${options.height - 10}" class="small-text wireframe-text" fill="#999" text-anchor="end">
    ${wireframe.pageName}
  </text>
</svg>`;

  return svg;
}

/**
 * Extract CSS variables from styles
 */
function extractCSSVariables(styles: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const varMatches = styles.match(/--[\w-]+:\s*[^;]+/g) || [];
  
  varMatches.forEach(match => {
    const [key, value] = match.split(':').map(s => s.trim());
    if (key && value) {
      vars[key] = value.replace(/\/\*.*?\*\//g, '').trim();
    }
  });
  
  return vars;
}

/**
 * Extract color values from CSS
 */
function extractColors(styles: string, cssVars: Record<string, string>) {
  const colors = {
    primary: '#006341',
    secondary: '#E8D9B8', 
    accent: '#96693B',
    neutral: '#F2F2F2',
    text: '#333333',
    background: '#ffffff'
  };
  
  // Extract from CSS variables
  if (cssVars['--primary-color']) colors.primary = cssVars['--primary-color'];
  if (cssVars['--secondary-color']) colors.secondary = cssVars['--secondary-color'];
  if (cssVars['--accent-color']) colors.accent = cssVars['--accent-color'];
  if (cssVars['--neutral-color']) colors.neutral = cssVars['--neutral-color'];
  
  // Extract from regular CSS properties
  const colorMatches = styles.match(/(?:color|background-color|background):\s*([^;]+)/g) || [];
  colorMatches.forEach(match => {
    const color = match.split(':')[1].trim().replace(';', '');
    if (color.includes('#') && color.length >= 4) {
      if (match.includes('background')) {
        colors.background = color;
      } else {
        colors.text = color;
      }
    }
  });
  
  return colors;
}

/**
 * Parse HTML content and convert to SVG elements
 */
async function parseHTMLToSVG(
  htmlContent: string, 
  colors: any, 
  options: { width: number; height: number }
): Promise<string> {
  let svgElements = '';
  let yOffset = 40;
  const leftMargin = 40;
  const contentWidth = options.width - (leftMargin * 2);
  
  // Create a temporary DOM parser
  const parser = new DOMParser();
  const tempDoc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
  const container = tempDoc.body.firstElementChild as HTMLElement;
  
  if (!container) {
    return '<text x="50%" y="50%" text-anchor="middle" class="content-text wireframe-text" fill="#666">No content found</text>';
  }
  
  // Process each element
  const elements = Array.from(container.querySelectorAll('*'));
  const processedElements = new Set();
  
  // Process top-level elements first
  for (const element of container.children) {
    const result = processElement(element as HTMLElement, leftMargin, yOffset, contentWidth, colors, processedElements);
    svgElements += result.svg;
    yOffset = result.nextY;
  }
  
  return svgElements;
}

/**
 * Process individual HTML elements and convert to SVG
 */
function processElement(
  element: HTMLElement, 
  x: number, 
  y: number, 
  maxWidth: number, 
  colors: any,
  processed: Set<HTMLElement>
): { svg: string; nextY: number } {
  
  if (processed.has(element)) {
    return { svg: '', nextY: y };
  }
  processed.add(element);
  
  const tagName = element.tagName.toLowerCase();
  const text = element.textContent?.trim() || '';
  const classList = Array.from(element.classList);
  let svg = '';
  let nextY = y;
  
  // Skip empty elements
  if (!text && !element.children.length) {
    return { svg: '', nextY: y };
  }
  
  switch (tagName) {
    case 'h1':
    case 'h2':
    case 'h3':
      if (text) {
        svg += `
  <rect x="${x - 5}" y="${y - 5}" width="${maxWidth + 10}" height="45" fill="${colors.secondary}" opacity="0.2" rx="6"/>
  <text x="${x + 10}" y="${y + 25}" class="header-text wireframe-text" fill="${colors.primary}">${escapeXML(text)}</text>`;
        nextY = y + 60;
      }
      break;
      
    case 'nav':
    case 'header':
      svg += `
  <rect x="0" y="${y - 20}" width="100%" height="60" fill="${colors.primary}"/>
  <text x="${x}" y="${y + 15}" class="header-text wireframe-text" fill="white">Navigation</text>`;
      if (text) {
        svg += `
  <text x="${x + 200}" y="${y + 15}" class="content-text wireframe-text" fill="white">${escapeXML(text)}</text>`;
      }
      nextY = y + 60;
      break;
      
    case 'button':
      if (text) {
        const buttonWidth = Math.min(text.length * 8 + 40, 200);
        svg += `
  <rect x="${x}" y="${y}" width="${buttonWidth}" height="40" fill="${colors.primary}" rx="6"/>
  <text x="${x + buttonWidth/2}" y="${y + 25}" class="button-text wireframe-text" fill="white" text-anchor="middle">${escapeXML(text)}</text>`;
        nextY = y + 55;
      }
      break;
      
    case 'input':
    case 'textarea':
      const inputWidth = Math.min(300, maxWidth - 20);
      const placeholder = element.getAttribute('placeholder') || 'Input field';
      svg += `
  <rect x="${x}" y="${y}" width="${inputWidth}" height="35" fill="white" stroke="${colors.neutral}" stroke-width="2" rx="4"/>
  <text x="${x + 10}" y="${y + 22}" class="content-text wireframe-text" fill="#999">${escapeXML(placeholder)}</text>`;
      nextY = y + 50;
      break;
      
    case 'p':
    case 'div':
    case 'span':
      if (text && !element.querySelector('button, input, textarea')) {
        // Split long text into multiple lines
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        const maxCharsPerLine = Math.floor(maxWidth / 8);
        
        for (const word of words) {
          if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
            currentLine = currentLine ? currentLine + ' ' + word : word;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
        
        lines.forEach((line, index) => {
          svg += `
  <text x="${x}" y="${y + (index * 20) + 15}" class="content-text wireframe-text" fill="${colors.text}">${escapeXML(line)}</text>`;
        });
        nextY = y + (lines.length * 20) + 10;
      }
      break;
      
    case 'ul':
    case 'ol':
      let listY = y;
      const listItems = element.querySelectorAll('li');
      listItems.forEach((li, index) => {
        const bullet = tagName === 'ol' ? `${index + 1}.` : '•';
        const itemText = li.textContent?.trim() || '';
        if (itemText) {
          svg += `
  <text x="${x}" y="${listY + 20}" class="content-text wireframe-text" fill="${colors.text}">${bullet} ${escapeXML(itemText)}</text>`;
          listY += 25;
        }
      });
      nextY = listY + 10;
      break;
      
    default:
      // Handle container elements by processing their children
      if (element.children.length > 0) {
        let childY = y;
        for (const child of element.children) {
          const result = processElement(child as HTMLElement, x, childY, maxWidth, colors, processed);
          svg += result.svg;
          childY = result.nextY;
        }
        nextY = childY;
      } else if (text) {
        // Fallback for other text elements
        svg += `
  <text x="${x}" y="${y + 15}" class="content-text wireframe-text" fill="${colors.text}">${escapeXML(text)}</text>`;
        nextY = y + 30;
      }
      break;
  }
  
  return { svg, nextY };
}

/**
 * Escape XML special characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Download the direct SVG
 */
export function downloadDirectSVG(wireframe: WireframeExportData, svgContent: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${wireframe.pageName.replace(/\s+/g, '-').toLowerCase()}-exact-wireframe.svg`;
  link.click();
  URL.revokeObjectURL(url);
}
import { toPng, toSvg, toJpeg } from 'html-to-image';

export interface WireframeExportOptions {
  format: 'svg' | 'png' | 'jpeg';
  quality: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  scale?: number;
}

export interface WireframeExportData {
  id: string;
  pageName: string;
  htmlCode: string;
  cssCode?: string;
  jsCode?: string;
}

/**
 * Creates a hidden iframe with the wireframe HTML content
 */
function createHiddenWireframeFrame(htmlCode: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '1200px';
  iframe.style.height = '800px';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  
  document.body.appendChild(iframe);
  
  // Write content to iframe
  if (iframe.contentDocument) {
    iframe.contentDocument.open();
    iframe.contentDocument.write(htmlCode);
    iframe.contentDocument.close();
  }
  
  return iframe;
}

/**
 * Converts HTML wireframe to high-quality SVG
 */
export async function convertWireframeToSVG(
  wireframe: WireframeExportData,
  options: Partial<WireframeExportOptions> = {}
): Promise<string> {
  const defaultOptions: WireframeExportOptions = {
    format: 'svg',
    quality: 1.0,
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    scale: 1,
    ...options
  };

  try {
    // Create an iframe to properly render the complete HTML document
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-20000px';
    iframe.style.left = '-20000px';
    iframe.style.width = `${defaultOptions.width}px`;
    iframe.style.height = `${defaultOptions.height}px`;
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.style.zIndex = '-9999';
    
    document.body.appendChild(iframe);
    
    // Write the complete HTML content to the iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Cannot access iframe document');
    }
    
    iframeDoc.open();
    iframeDoc.write(wireframe.htmlCode);
    iframeDoc.close();

    // Wait for the document to fully load and render
    await new Promise((resolve) => {
      iframe.onload = resolve;
      // Also wait a bit for styles to apply
      setTimeout(resolve, 1500);
    });

    // Get the body element from the iframe
    const iframeBody = iframeDoc.body;
    if (!iframeBody) {
      throw new Error('Cannot access iframe body');
    }

    // Ensure the body fills the iframe dimensions
    iframeBody.style.margin = '0';
    iframeBody.style.padding = '0';
    iframeBody.style.width = '100%';
    iframeBody.style.height = '100%';
    iframeBody.style.overflow = 'hidden';

    // Convert to SVG using html-to-image with error handling
    let svgDataUrl: string;
    try {
      svgDataUrl = await toSvg(iframeBody, {
        quality: defaultOptions.quality,
        width: defaultOptions.width,
        height: defaultOptions.height,
        backgroundColor: defaultOptions.backgroundColor,
        pixelRatio: defaultOptions.scale,
        canvasWidth: defaultOptions.width * defaultOptions.scale,
        canvasHeight: defaultOptions.height * defaultOptions.scale,
        filter: (node) => {
          // Filter out script tags and other non-visual elements
          if (node.tagName === 'SCRIPT' || node.tagName === 'NOSCRIPT') {
            return false;
          }
          return true;
        }
      });
    } catch (conversionError) {
      console.error('SVG conversion failed, attempting fallback:', conversionError);
      document.body.removeChild(iframe);
      throw new Error(`SVG conversion failed: ${conversionError.message}`);
    }

    // Clean up
    document.body.removeChild(iframe);

    // Check if the conversion was successful
    if (!svgDataUrl || svgDataUrl === 'data:,' || svgDataUrl.length < 100) {
      throw new Error('SVG conversion failed - empty or invalid result');
    }

    // Extract SVG content from data URL
    const base64Data = svgDataUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid SVG data URL format');
    }
    
    const svgContent = atob(base64Data);
    
    // Validate SVG content
    if (!svgContent.includes('<svg') || svgContent.length < 50) {
      throw new Error('Invalid SVG content generated');
    }
    
    // Ensure the SVG has proper dimensions
    const svgWithProperDimensions = svgContent.replace(
      /<svg[^>]*>/,
      `<svg width="${defaultOptions.width}" height="${defaultOptions.height}" viewBox="0 0 ${defaultOptions.width} ${defaultOptions.height}" xmlns="http://www.w3.org/2000/svg">`
    );
    
    return svgWithProperDimensions;

  } catch (error) {
    console.error('Error converting wireframe to SVG:', error);
    
    // Enhanced fallback: Create SVG with actual HTML content embedded
    return createEnhancedFallbackSVG(wireframe, defaultOptions);
  }
}

/**
 * Converts HTML wireframe to PNG
 */
export async function convertWireframeToPNG(
  wireframe: WireframeExportData,
  options: Partial<WireframeExportOptions> = {}
): Promise<string> {
  const defaultOptions: WireframeExportOptions = {
    format: 'png',
    quality: 1.0,
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    scale: 2, // Higher scale for better quality
    ...options
  };

  try {
    const iframe = createHiddenWireframeFrame(wireframe.htmlCode);
    
    await new Promise(resolve => {
      iframe.onload = resolve;
      setTimeout(resolve, 1000);
    });

    const iframeBody = iframe.contentDocument?.body;
    if (!iframeBody) {
      throw new Error('Could not access iframe content');
    }

    const pngDataUrl = await toPng(iframeBody, {
      quality: defaultOptions.quality,
      width: defaultOptions.width,
      height: defaultOptions.height,
      backgroundColor: defaultOptions.backgroundColor,
      pixelRatio: defaultOptions.scale
    });

    document.body.removeChild(iframe);
    return pngDataUrl;

  } catch (error) {
    console.error('Error converting wireframe to PNG:', error);
    throw error;
  }
}

/**
 * Creates an enhanced fallback SVG with actual wireframe content
 */
function createEnhancedFallbackSVG(
  wireframe: WireframeExportData,
  options: WireframeExportOptions
): string {
  const { width = 1200, height = 800, backgroundColor = '#ffffff' } = options;
  
  // Extract styles from HTML
  const styleMatch = wireframe.htmlCode.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const styles = styleMatch ? styleMatch[1] : '';
  
  // Extract body content
  const bodyMatch = wireframe.htmlCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : wireframe.htmlCode;
  
  // Parse colors from CSS
  const colorMatches = styles.match(/(?:color|background-color|background):\s*([^;]+)/g) || [];
  const colors = colorMatches.map(match => {
    const color = match.split(':')[1].trim().replace(';', '');
    return color.includes('#') ? color : '#666666';
  });
  
  const primaryColor = colors.find(c => c.includes('#')) || '#006341';
  const secondaryColor = colors[1] || '#E8D9B8';
  
  // Create enhanced SVG with actual wireframe structure
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .wireframe-text { font-family: Arial, sans-serif; fill: #333; }
      .header-text { font-size: 24px; font-weight: bold; fill: ${primaryColor}; }
      .content-text { font-size: 14px; fill: #666; }
      .small-text { font-size: 12px; fill: #888; }
    </style>
  </defs>
  
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  
  <!-- Recreate wireframe layout based on HTML structure -->
  ${createSVGFromHTML(bodyContent, primaryColor, secondaryColor, width, height)}
  
  <!-- Footer -->
  <text x="50%" y="${height - 20}" class="small-text wireframe-text" text-anchor="middle">
    ${wireframe.pageName} - Exported ${new Date().toLocaleDateString()}
  </text>
</svg>`;
}

/**
 * Converts HTML content to SVG elements
 */
function createSVGFromHTML(htmlContent: string, primaryColor: string, secondaryColor: string, width: number, height: number): string {
  let svgElements = '';
  let yOffset = 60;
  
  // Parse common HTML elements and convert to SVG
  const lines = htmlContent.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Headers
    if (trimmedLine.includes('<h1') || trimmedLine.includes('<h2') || trimmedLine.includes('<h3')) {
      const text = trimmedLine.replace(/<[^>]*>/g, '').trim();
      if (text) {
        svgElements += `
  <rect x="40" y="${yOffset - 5}" width="${width - 80}" height="40" fill="${secondaryColor}" opacity="0.3" rx="4"/>
  <text x="60" y="${yOffset + 20}" class="header-text wireframe-text">${text}</text>`;
        yOffset += 60;
      }
    }
    // Paragraphs
    else if (trimmedLine.includes('<p') || trimmedLine.includes('class=')) {
      const text = trimmedLine.replace(/<[^>]*>/g, '').trim();
      if (text && text.length > 5) {
        const words = text.split(' ');
        const chunks = [];
        for (let i = 0; i < words.length; i += 8) {
          chunks.push(words.slice(i, i + 8).join(' '));
        }
        
        chunks.forEach((chunk, index) => {
          svgElements += `
  <text x="60" y="${yOffset + (index * 20)}" class="content-text wireframe-text">${chunk}</text>`;
        });
        yOffset += chunks.length * 20 + 20;
      }
    }
    // Buttons
    else if (trimmedLine.includes('button') || trimmedLine.includes('btn')) {
      const text = trimmedLine.replace(/<[^>]*>/g, '').trim();
      if (text) {
        svgElements += `
  <rect x="60" y="${yOffset}" width="120" height="35" fill="${primaryColor}" rx="6"/>
  <text x="120" y="${yOffset + 22}" class="content-text wireframe-text" fill="white" text-anchor="middle">${text}</text>`;
        yOffset += 50;
      }
    }
    // Navigation/Header areas
    else if (trimmedLine.includes('nav') || trimmedLine.includes('header')) {
      svgElements += `
  <rect x="0" y="0" width="${width}" height="60" fill="${primaryColor}"/>
  <text x="40" y="35" class="header-text wireframe-text" fill="white">Navigation</text>`;
    }
    // Form inputs
    else if (trimmedLine.includes('input') || trimmedLine.includes('textarea')) {
      svgElements += `
  <rect x="60" y="${yOffset}" width="300" height="30" fill="white" stroke="#ddd" rx="4"/>
  <text x="70" y="${yOffset + 20}" class="small-text wireframe-text">Input field</text>`;
      yOffset += 40;
    }
  }
  
  return svgElements;
}

/**
 * Downloads wireframe as SVG file
 */
export function downloadWireframeAsSVG(
  wireframe: WireframeExportData,
  svgContent: string
): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `wireframe-${wireframe.pageName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads wireframe as PNG file
 */
export function downloadWireframeAsPNG(
  wireframe: WireframeExportData,
  pngDataUrl: string
): void {
  const link = document.createElement('a');
  link.href = pngDataUrl;
  link.download = `wireframe-${wireframe.pageName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`;
  link.click();
}

/**
 * Exports all wireframes as high-quality SVG files
 */
export async function exportAllWireframesAsSVG(
  wireframes: WireframeExportData[],
  options: Partial<WireframeExportOptions> = {}
): Promise<void> {
  const defaultOptions = {
    quality: 1.0,
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    ...options
  };

  console.log(`Starting SVG export for ${wireframes.length} wireframes...`);

  // Export individual wireframes
  for (let i = 0; i < wireframes.length; i++) {
    const wireframe = wireframes[i];
    console.log(`Converting wireframe ${i + 1}/${wireframes.length}: ${wireframe.pageName}`);
    
    try {
      const svgContent = await convertWireframeToSVG(wireframe, defaultOptions);
      downloadWireframeAsSVG(wireframe, svgContent);
      
      // Add delay between downloads to prevent browser blocking
      if (i < wireframes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Failed to export ${wireframe.pageName} as SVG:`, error);
    }
  }

  // Create combined SVG with all wireframes
  await createCombinedSVGExport(wireframes, defaultOptions);
  
  console.log('SVG export completed!');
}

/**
 * Creates a combined SVG file with all wireframes
 */
async function createCombinedSVGExport(
  wireframes: WireframeExportData[],
  options: WireframeExportOptions
): Promise<void> {
  const wireframeHeight = options.height || 800;
  const wireframeWidth = options.width || 1200;
  const spacing = 100;
  const totalHeight = wireframes.length * (wireframeHeight + spacing);

  let combinedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${wireframeWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${options.backgroundColor || '#f8f9fa'}"/>
  
  <!-- Title -->
  <text x="${wireframeWidth / 2}" y="40" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#212529" text-anchor="middle">
    All Wireframes Export
  </text>
  <text x="${wireframeWidth / 2}" y="65" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle">
    Generated on ${new Date().toLocaleDateString()} • ${wireframes.length} wireframes
  </text>
`;

  for (let i = 0; i < wireframes.length; i++) {
    const wireframe = wireframes[i];
    const yOffset = 100 + i * (wireframeHeight + spacing);
    
    try {
      // Try to get actual SVG content for each wireframe
      const wireframeSVG = await convertWireframeToSVG(wireframe, options);
      
      // Extract the inner content of the SVG (remove the outer svg tags)
      const svgInnerContent = wireframeSVG.replace(/<\?xml[^>]*>/, '')
        .replace(/<svg[^>]*>/, '')
        .replace(/<\/svg>/, '');
      
      combinedSVG += `
  <g transform="translate(0, ${yOffset})">
    <rect x="20" y="0" width="${wireframeWidth - 40}" height="${wireframeHeight}" fill="#ffffff" stroke="#dee2e6" stroke-width="2" rx="8"/>
    <text x="40" y="25" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#212529">
      ${wireframe.pageName}
    </text>
    <g transform="translate(40, 40) scale(${(wireframeWidth - 80) / wireframeWidth}, ${(wireframeHeight - 60) / wireframeHeight})">
      ${svgInnerContent}
    </g>
  </g>`;
    } catch (error) {
      // Fallback for individual wireframe
      combinedSVG += `
  <g transform="translate(0, ${yOffset})">
    <rect x="20" y="0" width="${wireframeWidth - 40}" height="${wireframeHeight}" fill="#ffffff" stroke="#dee2e6" stroke-width="2" rx="8"/>
    <text x="40" y="25" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#212529">
      ${wireframe.pageName}
    </text>
    <rect x="40" y="40" width="${wireframeWidth - 80}" height="${wireframeHeight - 80}" fill="#f8f9fa" stroke="#dee2e6" rx="4"/>
    <text x="${wireframeWidth / 2}" y="${wireframeHeight / 2 + yOffset - 50}" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle">
      Wireframe content (preview not available)
    </text>
  </g>`;
    }
  }

  combinedSVG += `</svg>`;

  // Download combined SVG
  const blob = new Blob([combinedSVG], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `all-wireframes-combined-${new Date().toISOString().split('T')[0]}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}
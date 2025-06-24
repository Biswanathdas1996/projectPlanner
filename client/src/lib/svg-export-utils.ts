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
    // Create hidden iframe with wireframe content
    const iframe = createHiddenWireframeFrame(wireframe.htmlCode);
    
    // Wait for content to load
    await new Promise(resolve => {
      iframe.onload = resolve;
      setTimeout(resolve, 1000); // Fallback timeout
    });

    const iframeBody = iframe.contentDocument?.body;
    if (!iframeBody) {
      throw new Error('Could not access iframe content');
    }

    // Convert to SVG using html-to-image
    const svgDataUrl = await toSvg(iframeBody, {
      quality: defaultOptions.quality,
      width: defaultOptions.width,
      height: defaultOptions.height,
      backgroundColor: defaultOptions.backgroundColor,
      style: {
        transform: `scale(${defaultOptions.scale})`,
        transformOrigin: 'top left'
      }
    });

    // Clean up
    document.body.removeChild(iframe);

    // Extract SVG content from data URL
    const svgContent = atob(svgDataUrl.split(',')[1]);
    return svgContent;

  } catch (error) {
    console.error('Error converting wireframe to SVG:', error);
    
    // Fallback: Create a basic SVG representation
    return createFallbackSVG(wireframe, defaultOptions);
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
 * Creates a fallback SVG when HTML-to-SVG conversion fails
 */
function createFallbackSVG(
  wireframe: WireframeExportData,
  options: WireframeExportOptions
): string {
  const { width = 1200, height = 800, backgroundColor = '#ffffff' } = options;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="100%" height="80" fill="#f8f9fa" stroke="#e9ecef" stroke-width="1"/>
  <text x="50%" y="45" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#212529" text-anchor="middle">
    ${wireframe.pageName}
  </text>
  
  <!-- Main Content Area -->
  <rect x="40" y="120" width="${width - 80}" height="${height - 200}" fill="#ffffff" stroke="#dee2e6" stroke-width="2" rx="8"/>
  
  <!-- Wireframe Label -->
  <text x="60" y="150" font-family="Arial, sans-serif" font-size="16" fill="#6c757d">
    Wireframe: ${wireframe.pageName}
  </text>
  
  <!-- Content Placeholder -->
  <rect x="60" y="170" width="${width - 120}" height="40" fill="#f8f9fa" stroke="#dee2e6" rx="4"/>
  <text x="80" y="195" font-family="Arial, sans-serif" font-size="14" fill="#6c757d">
    Generated wireframe content (fallback representation)
  </text>
  
  <!-- Footer -->
  <text x="50%" y="${height - 20}" font-family="Arial, sans-serif" font-size="12" fill="#6c757d" text-anchor="middle">
    Exported on ${new Date().toLocaleDateString()}
  </text>
</svg>`;
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
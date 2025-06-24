import { toPng } from 'html-to-image';
import JSZip from 'jszip';

export interface WireframeHTMLToImageExport {
  id: string;
  pageName: string;
  htmlCode: string;
  cssCode?: string;
  userType?: string;
  features?: string[];
  createdAt?: string;
}

export class HTMLToImageExporter {
  private static createFullPageHTML(htmlCode: string, pageName: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        html, body {
            width: 100%;
            height: auto;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            background: #ffffff;
            overflow: visible;
        }
        .wireframe-container {
            width: 100%;
            min-height: 100vh;
            padding: 20px;
            background: #ffffff;
            display: block;
            position: relative;
        }
        /* Ensure all content is visible */
        * {
            max-width: none !important;
            overflow: visible !important;
            position: static !important;
        }
        /* Force visibility for all elements */
        div, section, article, aside, nav, header, footer, main,
        form, table, ul, ol, li, p, h1, h2, h3, h4, h5, h6 {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    </style>
</head>
<body>
    <div class="wireframe-container" id="capture-container">
        ${htmlCode}
    </div>
</body>
</html>`;
  }

  private static async convertWireframeToPNG(wireframe: WireframeHTMLToImageExport): Promise<Blob> {
    console.log(`Converting ${wireframe.pageName} to PNG using html-to-image...`);
    
    // Create iframe for isolated rendering
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1400px';
    iframe.style.height = '1000px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.style.backgroundColor = '#ffffff';
    
    document.body.appendChild(iframe);
    
    try {
      // Create complete HTML with wireframe content
      const fullHTML = this.createFullPageHTML(wireframe.htmlCode, wireframe.pageName);
      
      // Set iframe content
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Cannot access iframe document');
      }
      
      iframeDoc.open();
      iframeDoc.write(fullHTML);
      iframeDoc.close();
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the container element
      const container = iframeDoc.querySelector('#capture-container') || iframeDoc.body;
      
      if (!container) {
        throw new Error('Cannot find container element');
      }
      
      // Get actual content dimensions
      const contentWidth = Math.max(
        container.scrollWidth,
        container.clientWidth,
        (container as HTMLElement).offsetWidth,
        iframeDoc.documentElement.scrollWidth,
        iframeDoc.body.scrollWidth,
        1400
      );
      
      const contentHeight = Math.max(
        container.scrollHeight,
        container.clientHeight,
        (container as HTMLElement).offsetHeight,
        iframeDoc.documentElement.scrollHeight,
        iframeDoc.body.scrollHeight,
        1000
      );
      
      console.log(`html-to-image capture dimensions for ${wireframe.pageName}: ${contentWidth}x${contentHeight}`);
      
      // Use html-to-image to capture the complete element
      const dataUrl = await toPng(container as HTMLElement, {
        width: contentWidth,
        height: contentHeight,
        backgroundColor: '#ffffff',
        pixelRatio: 2, // High quality
        canvasWidth: contentWidth,
        canvasHeight: contentHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      console.log(`Successfully converted ${wireframe.pageName} to PNG (${Math.round(blob.size / 1024)}KB)`);
      
      return blob;
      
    } catch (error) {
      console.error(`Error converting ${wireframe.pageName} with html-to-image:`, error);
      throw error;
    } finally {
      // Clean up iframe
      document.body.removeChild(iframe);
    }
  }

  static async exportAllWireframesAsHTMLToImagePNG(wireframes: WireframeHTMLToImageExport[]): Promise<void> {
    try {
      console.log(`Starting html-to-image PNG export for ${wireframes.length} wireframes...`);
      
      const zip = new JSZip();
      const folder = zip.folder("wireframes-html-to-image-png");
      
      if (!folder) {
        throw new Error('Failed to create ZIP folder');
      }
      
      // Process each wireframe
      for (let i = 0; i < wireframes.length; i++) {
        const wireframe = wireframes[i];
        try {
          console.log(`Processing ${wireframe.pageName} (${i + 1}/${wireframes.length})...`);
          
          const pngBlob = await this.convertWireframeToPNG(wireframe);
          
          // Add PNG to ZIP
          const filename = `${wireframe.pageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.png`;
          folder.file(filename, pngBlob);
          
          console.log(`Added ${filename} to ZIP archive`);
          
        } catch (error) {
          console.error(`Failed to process ${wireframe.pageName}:`, error);
          // Continue with other wireframes even if one fails
        }
      }
      
      // Add metadata file
      const metadata = {
        exportType: 'html-to-image PNG Export',
        totalWireframes: wireframes.length,
        exportDate: new Date().toISOString(),
        captureMethod: 'html-to-image library with complete element capture',
        description: 'High-quality PNG images of wireframes captured using html-to-image library'
      };
      
      folder.file('export-info.json', JSON.stringify(metadata, null, 2));
      
      // Generate and download ZIP
      console.log('Generating ZIP archive...');
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wireframes-html-to-image-export-${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      
      console.log(`html-to-image PNG export completed: ${(zipBlob.size / (1024 * 1024)).toFixed(2)}MB`);
      
    } catch (error) {
      console.error('Error in html-to-image PNG export:', error);
      throw error;
    }
  }
}
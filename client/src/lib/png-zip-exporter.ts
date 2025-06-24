import html2canvas from 'html2canvas';
import JSZip from 'jszip';

export interface WireframePNGExport {
  id: string;
  pageName: string;
  htmlCode: string;
  cssCode?: string;
  userType?: string;
  features?: string[];
  createdAt?: string;
}

export class PNGZipExporter {
  private static createFullSizeIframe(htmlCode: string, pageName: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '2500px'; // Maximum width to accommodate all content
    iframe.style.height = '2000px'; // Maximum height to accommodate all content
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.style.backgroundColor = '#ffffff';
    iframe.style.overflow = 'visible';
    
    // Create HTML with maximum space and no restrictions
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=2500, initial-scale=1.0">
    <title>${pageName}</title>
    <style>
        html, body {
            margin: 0;
            padding: 100px; /* Maximum padding for complete capture */
            width: auto; /* Auto width to accommodate all content */
            min-width: 2000px; /* Minimum width for full content */
            height: auto;
            min-height: 1500px;
            overflow: visible;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        }
        * {
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            position: static !important; /* Force all elements to normal flow */
            float: none !important;
            transform: none !important;
            margin: max(0px, attr(margin)) !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
        }
        /* Container with maximum space for complete capture */
        .wireframe-container {
            width: auto; /* Auto width for full content */
            min-width: 100%;
            height: auto;
            min-height: 100%;
            padding: 50px; /* Generous padding */
            overflow: visible;
            position: relative;
            display: block;
            margin: 0; /* No margin to use full space */
        }
        /* Ensure no element is ever cut off */
        div, section, article, aside, nav, header, footer, main, 
        form, table, ul, ol, li, p, h1, h2, h3, h4, h5, h6 {
            overflow: visible !important;
            max-width: none !important;
            max-height: none !important;
            position: static !important;
            float: none !important;
            transform: none !important;
            clip: none !important;
            clip-path: none !important;
        }
        /* Remove any layout restrictions */
        img, svg, canvas, video, iframe {
            max-width: none !important;
            max-height: none !important;
            width: auto !important;
            height: auto !important;
        }
        /* Ensure flexbox and grid show all content */
        .flex, .grid, 
        [style*="display: flex"], [style*="display: grid"],
        [class*="flex"], [class*="grid"] {
            flex-wrap: wrap !important;
            overflow: visible !important;
            width: auto !important;
            min-width: max-content !important;
            height: auto !important;
            min-height: max-content !important;
        }
        /* Force all positioning to be visible */
        *[style*="position: absolute"], *[style*="position: fixed"], 
        *[style*="position: sticky"], .absolute, .fixed, .sticky {
            position: static !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            bottom: auto !important;
            z-index: auto !important;
            transform: none !important;
        }
        /* Remove any hiding or clipping */
        *[style*="display: none"], .hidden {
            display: block !important;
        }
        *[style*="visibility: hidden"] {
            visibility: visible !important;
        }
        /* Ensure text and content is always visible */
        * {
            color: inherit !important;
            background-color: inherit !important;
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
    
    document.body.appendChild(iframe);
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(fullHTML);
      doc.close();
    }
    
    return iframe;
  }

  private static async waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
    return new Promise((resolve) => {
      const checkLoad = () => {
        const doc = iframe.contentDocument;
        if (doc && doc.readyState === 'complete') {
          // Wait for complete layout and content positioning
          setTimeout(() => {
            // Force a reflow to ensure all content is positioned
            if (doc.body) {
              doc.body.offsetHeight; // Trigger reflow
            }
            setTimeout(resolve, 3000); // Extended wait for complete rendering
          }, 1000);
        } else {
          setTimeout(checkLoad, 100);
        }
      };
      checkLoad();
    });
  }

  private static async convertWireframeToPNG(wireframe: WireframePNGExport): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`Converting ${wireframe.pageName} to high-quality PNG...`);
        
        // Create iframe for rendering
        const iframe = this.createFullSizeIframe(wireframe.htmlCode, wireframe.pageName);
        
        // Wait for iframe to fully load
        await this.waitForIframeLoad(iframe);
        
        const doc = iframe.contentDocument;
        if (!doc || !doc.body) {
          document.body.removeChild(iframe);
          reject(new Error('Failed to load wireframe content'));
          return;
        }

        // Get the container and force complete layout calculation
        const container = doc.querySelector('#capture-container') || doc.querySelector('.wireframe-container') || doc.body;
        
        // Force complete layout and measure everything
        container.scrollTop = 0;
        container.scrollLeft = 0;
        
        // Get all possible dimension measurements
        const measurements = {
          containerScroll: { width: container.scrollWidth, height: container.scrollHeight },
          documentScroll: { width: doc.documentElement.scrollWidth, height: doc.documentElement.scrollHeight },
          bodyScroll: { width: doc.body.scrollWidth, height: doc.body.scrollHeight },
          containerClient: { width: container.clientWidth, height: container.clientHeight },
          documentClient: { width: doc.documentElement.clientWidth, height: doc.documentElement.clientHeight },
          bodyClient: { width: doc.body.clientWidth, height: doc.body.clientHeight },
          containerOffset: { width: (container as HTMLElement).offsetWidth, height: (container as HTMLElement).offsetHeight }
        };
        
        // Use maximum of ALL measurements to ensure nothing is missed
        const contentWidth = Math.max(
          measurements.containerScroll.width,
          measurements.documentScroll.width,
          measurements.bodyScroll.width,
          measurements.containerClient.width,
          measurements.documentClient.width,
          measurements.bodyClient.width,
          measurements.containerOffset.width,
          1400 // Standard wireframe width
        );
        
        const contentHeight = Math.max(
          measurements.containerScroll.height,
          measurements.documentScroll.height,
          measurements.bodyScroll.height,
          measurements.containerClient.height,
          measurements.documentClient.height,
          measurements.bodyClient.height,
          measurements.containerOffset.height,
          900 // Minimum height for content
        );
        
        // Add substantial padding to guarantee complete capture
        const actualWidth = contentWidth + 200; // No cap, add generous padding
        const actualHeight = contentHeight + 200; // Add generous padding for height

        console.log(`Complete wireframe measurements for ${wireframe.pageName}:`, measurements);
        console.log(`Final capture dimensions: ${actualWidth}x${actualHeight}`);

        // Use html2canvas with maximum capture settings
        const canvas = await html2canvas(container as Element, {
          width: actualWidth,
          height: actualHeight,
          scale: 2, // High quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          removeContainer: true,
          imageTimeout: 30000,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          windowWidth: actualWidth,
          windowHeight: actualHeight,
          foreignObjectRendering: true,
          onclone: (clonedDoc) => {
            // Apply maximum visibility styles to cloned document
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * { 
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
                overflow: visible !important;
                max-width: none !important;
                max-height: none !important;
                position: static !important;
                float: none !important;
                transform: none !important;
                clip: none !important;
                clip-path: none !important;
              }
              body, html {
                overflow: visible !important;
                height: auto !important;
                min-height: ${actualHeight}px !important;
                width: auto !important;
                min-width: ${actualWidth}px !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 100px !important;
                background: #ffffff !important;
              }
              #capture-container, .wireframe-container {
                overflow: visible !important;
                height: auto !important;
                min-height: 100% !important;
                width: auto !important;
                min-width: 100% !important;
                max-width: none !important;
                padding: 50px !important;
                position: relative !important;
                margin: 0 !important;
                background: transparent !important;
              }
              /* Force all elements to be visible */
              div, section, article, aside, nav, header, footer, main,
              form, table, ul, ol, li, p, h1, h2, h3, h4, h5, h6 {
                overflow: visible !important;
                max-width: none !important;
                max-height: none !important;
                position: static !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
              /* Remove all positioning constraints */
              *[style*="position: absolute"], *[style*="position: fixed"], 
              *[style*="position: sticky"], .absolute, .fixed, .sticky {
                position: static !important;
                top: auto !important;
                left: auto !important;
                right: auto !important;
                bottom: auto !important;
                z-index: auto !important;
                transform: none !important;
              }
            `;
            clonedDoc.head.appendChild(style);
            
            // Force layout calculation on cloned document
            if (clonedDoc.body) {
              clonedDoc.body.offsetHeight;
            }
          }
        });

        // Convert canvas to high-quality PNG blob
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`Successfully converted ${wireframe.pageName} to PNG (${Math.round(blob.size / 1024)}KB)`);
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png', 1.0); // Maximum quality

        // Clean up iframe
        document.body.removeChild(iframe);

      } catch (error) {
        console.error(`Error converting ${wireframe.pageName} to PNG:`, error);
        reject(error);
      }
    });
  }

  static async exportAllWireframesAsPNGZip(wireframes: WireframePNGExport[]): Promise<void> {
    try {
      console.log(`Starting PNG ZIP export for ${wireframes.length} wireframes...`);
      
      const zip = new JSZip();
      const folder = zip.folder("wireframes-png-export");
      
      if (!folder) {
        throw new Error('Failed to create ZIP folder');
      }

      // Convert each wireframe to PNG and add to ZIP
      for (let i = 0; i < wireframes.length; i++) {
        const wireframe = wireframes[i];
        try {
          console.log(`Processing ${wireframe.pageName} (${i + 1}/${wireframes.length})...`);
          
          const pngBlob = await this.convertWireframeToPNG(wireframe);
          
          // Add PNG to ZIP with clean filename
          const filename = `${wireframe.pageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.png`;
          folder.file(filename, pngBlob);
          
          console.log(`Added ${filename} to ZIP archive`);
          
          // Small delay between conversions to prevent overwhelming the browser
          if (i < wireframes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to convert ${wireframe.pageName}:`, error);
          // Continue with other wireframes even if one fails
        }
      }
      
      // Add metadata file
      const metadata = {
        exportDate: new Date().toISOString(),
        totalWireframes: wireframes.length,
        exportTool: 'AI Wireframe Designer',
        format: 'PNG',
        resolution: '3600x2400 (3x scale)',
        description: 'High-quality PNG exports of AI-generated wireframes'
      };
      
      folder.file('export-info.json', JSON.stringify(metadata, null, 2));
      
      console.log('Generating ZIP archive...');
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
      
      // Download ZIP file
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wireframes-png-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`PNG ZIP export completed: ${Math.round(zipBlob.size / 1024 / 1024 * 100) / 100}MB`);
      
    } catch (error) {
      console.error('Error creating PNG ZIP export:', error);
      throw error;
    }
  }
}
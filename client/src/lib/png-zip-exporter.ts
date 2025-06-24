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
    iframe.style.width = '1200px';
    iframe.style.height = '800px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.style.backgroundColor = '#ffffff';
    
    // Create optimized HTML for high-quality rendering
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1200, initial-scale=1.0">
    <title>${pageName}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            width: 1200px;
            height: 800px;
            overflow: hidden;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        }
        * {
            box-sizing: border-box;
        }
        /* Ensure high quality rendering */
        * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
        }
    </style>
</head>
<body>
    ${htmlCode}
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
          // Wait for styles and images to load
          setTimeout(resolve, 1500);
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

        // Use html2canvas for high-quality capture
        const canvas = await html2canvas(doc.body, {
          width: 1200,
          height: 800,
          scale: 3, // High resolution (3x scale for crisp quality)
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          removeContainer: true,
          imageTimeout: 30000,
          onclone: (clonedDoc) => {
            // Ensure all styles are applied in cloned document
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * { 
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
              }
            `;
            clonedDoc.head.appendChild(style);
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
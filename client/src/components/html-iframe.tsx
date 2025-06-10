import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Minimize2, RefreshCw, Copy, Download } from 'lucide-react';

interface HtmlIframeProps {
  htmlContent: string;
  width?: string;
  height?: string;
  className?: string;
  title?: string;
  showControls?: boolean;
  allowFullscreen?: boolean;
}

export function HtmlIframe({ 
  htmlContent, 
  width = "100%", 
  height = "400px", 
  className = "",
  title = "HTML Content",
  showControls = true,
  allowFullscreen = true
}: HtmlIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      setIsLoading(true);
      const iframe = iframeRef.current;
      
      // Enhanced HTML template with better styling and responsiveness
      const enhancedHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              background: #ffffff;
              padding: 16px;
              overflow-x: auto;
            }
            .iframe-container {
              max-width: 100%;
              overflow-x: auto;
            }
            /* Responsive tables */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background: #f8fafc;
              font-weight: 600;
              color: #374151;
            }
            /* Enhanced styling for any content */
            h1, h2, h3, h4, h5, h6 {
              margin: 16px 0 8px 0;
              color: #1f2937;
            }
            p {
              margin: 8px 0;
            }
            .highlight {
              background: #fef3c7;
              padding: 2px 4px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="iframe-container">
            ${htmlContent}
          </div>
          <script>
            // Auto-resize iframe height based on content
            function resizeIframe() {
              const height = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
              );
              window.parent.postMessage({ type: 'resize', height }, '*');
            }
            
            // Initial resize
            setTimeout(resizeIframe, 100);
            
            // Resize on window resize
            window.addEventListener('resize', resizeIframe);
            
            // Resize on content changes
            const observer = new MutationObserver(resizeIframe);
            observer.observe(document.body, { 
              childList: true, 
              subtree: true, 
              attributes: true 
            });
          </script>
        </body>
        </html>
      `;
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(enhancedHtml);
        doc.close();
        
        // Handle iframe load
        iframe.onload = () => {
          setIsLoading(false);
        };
      }
    }
  }, [htmlContent, title]);

  // Handle messages from iframe for auto-resizing
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'resize' && iframeRef.current) {
        const newHeight = Math.min(event.data.height + 20, 800); // Max height limit
        iframeRef.current.style.height = `${newHeight}px`;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const refreshIframe = () => {
    if (iframeRef.current && htmlContent) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.location.reload();
      }
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(htmlContent);
  };

  const downloadHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
          <h3 className="font-semibold">{title}</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshIframe}
              className="text-white hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-gray-700"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4">
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            title={title}
            className="bg-white rounded-lg"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      </div>
    );
  }

  return (
    <Card className={`${className} relative`}>
      {showControls && (
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">{title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                HTML
              </Badge>
              {isLoading && (
                <Badge variant="outline" className="text-xs">
                  Loading...
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyContent}
                className="h-8 w-8 p-0"
                title="Copy HTML"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadHtml}
                className="h-8 w-8 p-0"
                title="Download HTML"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshIframe}
                className="h-8 w-8 p-0"
                title="Refresh"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              {allowFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="h-8 w-8 p-0"
                  title="Fullscreen"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={showControls ? "pt-2" : "p-4"}>
        <iframe
          ref={iframeRef}
          width={width}
          height={height}
          title={title}
          className="w-full border border-gray-200 rounded-lg bg-white"
          sandbox="allow-same-origin allow-scripts allow-forms"
          style={{
            minHeight: height,
            maxWidth: '100%'
          }}
        />
      </CardContent>
    </Card>
  );
}
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, FileX, Code } from 'lucide-react';

interface InlineBpmnViewerProps {
  bpmnXml: string;
  height?: string;
  title: string;
}

declare global {
  interface Window {
    BpmnJS: any;
  }
}

export function InlineBpmnViewer({ bpmnXml, height = "400px", title }: InlineBpmnViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showXmlDetails, setShowXmlDetails] = useState(false);

  useEffect(() => {
    setError(null);
    setIsLoading(true);
    
    if (!bpmnXml) {
      setError('No BPMN XML content provided');
      setIsLoading(false);
      return;
    }

    // Validate XML structure
    if (bpmnXml.includes('<html>')) {
      setError('Invalid BPMN content: Received HTML instead of XML. This usually indicates a server error or incorrect API response.');
      setIsLoading(false);
      return;
    }

    if (!bpmnXml.includes('bpmn') && !bpmnXml.includes('<?xml')) {
      setError('Invalid BPMN format: Content does not appear to be valid BPMN XML.');
      setIsLoading(false);
      return;
    }

    if (!containerRef.current || !window.BpmnJS) {
      setIsLoading(false);
      return;
    }

    const initViewer = async () => {
      try {
        // Clean up existing viewer
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }

        // Create new viewer
        const viewer = new window.BpmnJS({
          container: containerRef.current,
          width: '100%',
          height: height
        });

        viewerRef.current = viewer;

        // Import the BPMN XML
        const result = await viewer.importXML(bpmnXml);
        
        if (result.warnings && result.warnings.length > 0) {
          const warningMessages = result.warnings.map((w: any) => w.message).join('; ');
          console.warn(`BPMN warnings for ${title}:`, result.warnings);
          setError(`BPMN rendering warnings: ${warningMessages}`);
        }

        // Fit diagram to viewport
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport');
        
        setIsLoading(false);

      } catch (error: any) {
        console.error(`Error loading BPMN diagram for ${title}:`, error);
        
        // Log the raw XML for debugging
        console.log('Raw XML Content (first 500 chars):', bpmnXml.substring(0, 500));
        
        let errorMessage = 'Failed to render BPMN diagram';
        if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        if (error.warnings && error.warnings.length > 0) {
          const warningDetails = error.warnings.map((w: any) => 
            `Line ${w.line || '?'}: ${w.message || w.error?.message || 'Unknown error'}`
          ).join('; ');
          errorMessage += `. Validation errors: ${warningDetails}`;
        }
        
        // Add common troubleshooting info
        errorMessage += '\n\nCommon causes:\n• API returned HTML error page instead of BPMN XML\n• Invalid BPMN XML structure or missing required elements\n• Network connectivity issues with Gemini API\n• BPMN.js library failed to parse the XML content';
        
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    // Load BPMN.js if not already loaded
    if (!window.BpmnJS) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/bpmn-js@17.7.1/dist/bpmn-navigated-viewer.production.min.js';
      script.onload = initViewer;
      document.head.appendChild(script);
    } else {
      initViewer();
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [bpmnXml, height, title]);

  // Show error state with detailed information
  if (error) {
    return (
      <div className="w-full border border-red-200 rounded-lg overflow-hidden bg-red-50">
        <div className="bg-red-100 px-4 py-2 border-b border-red-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-red-800 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {title} - BPMN Generation Error
            </h4>
            <button
              onClick={() => setShowXmlDetails(!showXmlDetails)}
              className="text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded flex items-center"
            >
              <Code className="h-3 w-3 mr-1" />
              {showXmlDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <p className="text-sm text-red-700 mb-2 font-medium">Error Details:</p>
              <p className="text-sm text-red-600 mb-3">{error}</p>
              
              {showXmlDetails && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-red-700 mb-2">Raw XML Content (first 500 chars):</p>
                  <div className="bg-red-100 border border-red-200 rounded p-2">
                    <pre className="text-xs text-red-800 whitespace-pre-wrap break-all">
                      {bpmnXml ? bpmnXml.substring(0, 500) + (bpmnXml.length > 500 ? '...' : '') : 'No XML content'}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="mt-3 text-xs text-red-600">
                <p className="font-medium mb-1">Common causes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>API returned HTML error page instead of BPMN XML</li>
                  <li>Invalid BPMN XML structure or missing required elements</li>
                  <li>Network connectivity issues with Gemini API</li>
                  <li>BPMN.js library failed to parse the XML content</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
        <div className="bg-blue-100 px-4 py-2 border-b border-blue-200">
          <h4 className="text-sm font-medium text-blue-800">{title} - Loading BPMN Diagram</h4>
        </div>
        <div 
          className="flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-blue-600">Rendering BPMN diagram...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!bpmnXml) {
    return (
      <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <FileX className="h-4 w-4 mr-2" />
            {title} - No BPMN Diagram
          </h4>
        </div>
        <div 
          className="flex items-center justify-center border-2 border-dashed border-gray-300"
          style={{ height }}
        >
          <div className="text-center">
            <FileX className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No BPMN diagram available</p>
            <p className="text-gray-400 text-xs mt-1">Generate flow details first, then create BPMN diagram</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">{title} - BPMN Flow</h4>
      </div>
      <div 
        ref={containerRef} 
        style={{ height }}
        className="w-full"
      />
    </div>
  );
}
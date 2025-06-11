import { useRef, useEffect, useState } from 'react';
import { FileX, AlertCircle } from 'lucide-react';
import BpmnJS from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

interface InlineBpmnViewerProps {
  bpmnXml: string;
  height?: string;
  title: string;
}

export function InlineBpmnViewer({ bpmnXml, height = "400px", title }: InlineBpmnViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnJS | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!bpmnXml) {
      setError('No BPMN XML provided');
      setIsLoading(false);
      return;
    }

    const initViewer = async () => {
      try {
        // Clean up existing viewer
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }

        // Wait for container to be ready
        if (!containerRef.current) {
          setTimeout(initViewer, 100);
          return;
        }

        // Clear container
        containerRef.current.innerHTML = '';

        // Create viewer using npm package
        const viewer = new BpmnJS({
          container: containerRef.current,
          width: '100%',
          height: height,
        });

        viewerRef.current = viewer;

        // Import XML and handle result
        const result = await viewer.importXML(bpmnXml);
        
        if (result.warnings && result.warnings.length > 0) {
          console.warn('BPMN import warnings:', result.warnings);
        }

        // Fit to viewport
        try {
          const canvas = viewer.get('canvas');
          canvas.zoom('fit-viewport');
        } catch (e) {
          console.warn('Could not fit to viewport:', e);
        }

        setIsLoading(false);
        setError(null);

      } catch (error: any) {
        console.error('BPMN rendering error:', error);
        setError(`Rendering failed: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    initViewer();

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying viewer:', e);
        }
      }
    };
  }, [bpmnXml]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700">{title} - BPMN Flow</h4>
        </div>
        <div 
          className="flex items-center justify-center bg-gray-50"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading BPMN diagram...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full border border-red-200 rounded-lg overflow-hidden bg-red-50">
        <div className="bg-red-100 px-4 py-2 border-b border-red-200">
          <h4 className="text-sm font-medium text-red-700 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {title} - Error
          </h4>
        </div>
        <div 
          className="flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center p-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 text-sm font-medium mb-1">Failed to render BPMN diagram</p>
            <p className="text-red-500 text-xs">{error}</p>
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
import { useEffect, useRef, useState } from 'react';
import BpmnJS from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

interface BpmnJSViewerProps {
  bpmnXml: string;
  height?: string;
  title: string;
  className?: string;
}

export function BpmnJSViewer({ bpmnXml, height = "400px", title, className = "" }: BpmnJSViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnJS | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !bpmnXml) return;

    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Clean up previous viewer
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }

        // Create new viewer
        const viewer = new BpmnJS({
          container: containerRef.current,
          width: '100%',
          height: height,
        });

        viewerRef.current = viewer;

        // Import BPMN XML
        await viewer.importXML(bpmnXml);

        // Fit viewport to show entire diagram
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport');

        setIsLoading(false);
      } catch (err) {
        console.error('BPMN rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render BPMN diagram');
        setIsLoading(false);
      }
    };

    initViewer();

    // Cleanup on unmount
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [bpmnXml, height]);

  if (error) {
    return (
      <div className={`border rounded-lg p-4 bg-red-50 border-red-200 ${className}`}>
        <h3 className="font-semibold text-red-800 mb-2">{title}</h3>
        <p className="text-red-600 text-sm">Error rendering BPMN: {error}</p>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Rendering BPMN diagram...</span>
            </div>
          </div>
        )}
        <div 
          ref={containerRef} 
          style={{ height }}
          className="w-full"
        />
      </div>
    </div>
  );
}
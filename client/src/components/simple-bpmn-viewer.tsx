import { useState, useRef, useEffect } from 'react';
import { AlertCircle, FileX } from 'lucide-react';
import BpmnJS from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

interface SimpleBpmnViewerProps {
  bpmnXml: string;
  height?: string;
  title: string;
}

export function SimpleBpmnViewer({ bpmnXml, height = "300px", title }: SimpleBpmnViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnJS | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        // Create new viewer instance
        const viewer = new BpmnJS({
          container: containerRef.current!,
          width: '100%',
          height: height,
        });

        viewerRef.current = viewer;

        // Import BPMN XML
        await viewer.importXML(bpmnXml);

        // Fit viewport to show entire diagram
        const canvas = viewer.get('canvas') as any;
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

  if (!bpmnXml) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
        <div className="flex items-center gap-2 text-gray-500">
          <FileX className="h-4 w-4" />
          <span>No BPMN diagram available</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4 bg-red-50 border-red-200">
        <h3 className="font-semibold text-red-800 mb-2">{title}</h3>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Header with title */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading...</span>
          </div>
        )}
      </div>

      {/* BPMN Diagram Container */}
      <div 
        className="relative"
        style={{ height }}
      >
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
          style={{ height: '100%' }}
          className="w-full"
        />
      </div>
    </div>
  );
}
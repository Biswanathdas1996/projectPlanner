import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (!containerRef.current || !window.BpmnJS || !bpmnXml) return;

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
        await viewer.importXML(bpmnXml);

        // Fit diagram to viewport
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport');

      } catch (error) {
        console.error(`Error loading BPMN diagram for ${title}:`, error);
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

  if (!bpmnXml) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-500">No BPMN diagram available</p>
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
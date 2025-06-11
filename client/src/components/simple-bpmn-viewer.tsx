import { useState, useRef, useEffect } from 'react';
import { AlertCircle, FileX, ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react';

interface SimpleBpmnViewerProps {
  bpmnXml: string;
  height?: string;
  title: string;
}

interface BpmnElement {
  id: string;
  name: string;
  type: 'startEvent' | 'userTask' | 'endEvent' | 'sequenceFlow';
  sourceRef?: string;
  targetRef?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function SimpleBpmnViewer({ bpmnXml, height = "300px", title }: SimpleBpmnViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Parse BPMN XML and extract basic elements
  const parseBpmnElements = (xml: string): BpmnElement[] => {
    try {
      const elements: BpmnElement[] = [];
      
      // Extract start events
      const startEventMatches = xml.match(/<bpmn2:startEvent[^>]*id="([^"]*)"[^>]*name="([^"]*)"[^>]*\/>/g);
      if (startEventMatches) {
        startEventMatches.forEach((match, index) => {
          const idMatch = match.match(/id="([^"]*)"/);
          const nameMatch = match.match(/name="([^"]*)"/);
          if (idMatch && nameMatch) {
            elements.push({
              id: idMatch[1],
              name: nameMatch[1],
              type: 'startEvent',
              x: 50,
              y: 100,
              width: 36,
              height: 36
            });
          }
        });
      }

      // Extract user tasks
      const taskMatches = xml.match(/<bpmn2:userTask[^>]*id="([^"]*)"[^>]*name="([^"]*)"[^>]*\/>/g);
      if (taskMatches) {
        taskMatches.forEach((match, index) => {
          const idMatch = match.match(/id="([^"]*)"/);
          const nameMatch = match.match(/name="([^"]*)"/);
          if (idMatch && nameMatch) {
            elements.push({
              id: idMatch[1],
              name: nameMatch[1],
              type: 'userTask',
              x: 150 + (index * 180),
              y: 80,
              width: 100,
              height: 80
            });
          }
        });
      }

      // Extract end events
      const endEventMatches = xml.match(/<bpmn2:endEvent[^>]*id="([^"]*)"[^>]*name="([^"]*)"[^>]*\/>/g);
      if (endEventMatches) {
        endEventMatches.forEach((match, index) => {
          const idMatch = match.match(/id="([^"]*)"/);
          const nameMatch = match.match(/name="([^"]*)"/);
          if (idMatch && nameMatch) {
            const taskCount = taskMatches ? taskMatches.length : 0;
            elements.push({
              id: idMatch[1],
              name: nameMatch[1],
              type: 'endEvent',
              x: 150 + (taskCount * 180) + 50,
              y: 100,
              width: 36,
              height: 36
            });
          }
        });
      }

      // Extract sequence flows
      const flowMatches = xml.match(/<bpmn2:sequenceFlow[^>]*id="([^"]*)"[^>]*sourceRef="([^"]*)"[^>]*targetRef="([^"]*)"[^>]*\/>/g);
      if (flowMatches) {
        flowMatches.forEach(match => {
          const idMatch = match.match(/id="([^"]*)"/);
          const sourceMatch = match.match(/sourceRef="([^"]*)"/);
          const targetMatch = match.match(/targetRef="([^"]*)"/);
          if (idMatch && sourceMatch && targetMatch) {
            elements.push({
              id: idMatch[1],
              name: '',
              type: 'sequenceFlow',
              sourceRef: sourceMatch[1],
              targetRef: targetMatch[1]
            });
          }
        });
      }

      return elements;
    } catch (error) {
      console.error('Error parsing BPMN XML:', error);
      return [];
    }
  };

  const elements = parseBpmnElements(bpmnXml);

  // Handle zoom
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };
  
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

  // Calculate SVG dimensions
  const maxX = Math.max(...elements.filter(e => e.x).map(e => (e.x || 0) + (e.width || 0)));
  const svgWidth = Math.max(maxX + 100, 600);
  const svgHeight = parseInt(height.replace('px', '')) || 300;

  // Get flows for drawing connections
  const flows = elements.filter(e => e.type === 'sequenceFlow');

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">{title} - BPMN Flow</h4>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-500 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded ml-1"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <div className="flex items-center text-xs text-gray-500 ml-2">
            <Move className="h-3 w-3 mr-1" />
            Drag to pan
          </div>
        </div>
      </div>
      <div 
        style={{ height }} 
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg 
          ref={svgRef}
          width={svgWidth} 
          height={svgHeight} 
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Draw sequence flows (arrows) */}
          {flows.map(flow => {
            const sourceElement = elements.find(e => e.id === flow.sourceRef);
            const targetElement = elements.find(e => e.id === flow.targetRef);
            
            if (!sourceElement || !targetElement) return null;
            
            const sourceX = (sourceElement.x || 0) + (sourceElement.width || 0);
            const sourceY = (sourceElement.y || 0) + (sourceElement.height || 0) / 2;
            const targetX = targetElement.x || 0;
            const targetY = (targetElement.y || 0) + (targetElement.height || 0) / 2;
            
            return (
              <g key={flow.id}>
                <line
                  x1={sourceX}
                  y1={sourceY}
                  x2={targetX}
                  y2={targetY}
                  stroke="#666"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })}
          
          {/* Draw BPMN elements */}
          {elements.filter(e => e.type !== 'sequenceFlow').map(element => {
            if (element.type === 'startEvent') {
              return (
                <g key={element.id}>
                  <circle
                    cx={(element.x || 0) + (element.width || 0) / 2}
                    cy={(element.y || 0) + (element.height || 0) / 2}
                    r={(element.width || 0) / 2}
                    fill="#e8f5e8"
                    stroke="#4ade80"
                    strokeWidth="2"
                  />
                  <text
                    x={(element.x || 0) + (element.width || 0) / 2}
                    y={(element.y || 0) + (element.height || 0) + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#666"
                  >
                    {element.name.length > 15 ? element.name.substring(0, 15) + '...' : element.name}
                  </text>
                </g>
              );
            }
            
            if (element.type === 'userTask') {
              return (
                <g key={element.id}>
                  <rect
                    x={element.x || 0}
                    y={element.y || 0}
                    width={element.width || 0}
                    height={element.height || 0}
                    fill="#e1f5fe"
                    stroke="#0ea5e9"
                    strokeWidth="2"
                    rx="5"
                  />
                  <text
                    x={(element.x || 0) + (element.width || 0) / 2}
                    y={(element.y || 0) + (element.height || 0) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#0369a1"
                    className="font-medium"
                  >
                    {element.name.length > 12 ? element.name.substring(0, 12) + '...' : element.name}
                  </text>
                </g>
              );
            }
            
            if (element.type === 'endEvent') {
              return (
                <g key={element.id}>
                  <circle
                    cx={(element.x || 0) + (element.width || 0) / 2}
                    cy={(element.y || 0) + (element.height || 0) / 2}
                    r={(element.width || 0) / 2}
                    fill="#fef2f2"
                    stroke="#ef4444"
                    strokeWidth="3"
                  />
                  <text
                    x={(element.x || 0) + (element.width || 0) / 2}
                    y={(element.y || 0) + (element.height || 0) + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#666"
                  >
                    {element.name.length > 15 ? element.name.substring(0, 15) + '...' : element.name}
                  </text>
                </g>
              );
            }
            
            return null;
          })}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#666"
              />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}
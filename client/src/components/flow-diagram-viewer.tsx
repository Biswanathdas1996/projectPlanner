import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowDiagramData } from '@/lib/ai-flow-diagram-generator';

interface FlowDiagramViewerProps {
  flowData: FlowDiagramData;
  title: string;
  className?: string;
}

// Custom node styles for different types
const nodeTypes = {};

export function FlowDiagramViewer({ flowData, title, className = "" }: FlowDiagramViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const proOptions = { hideAttribution: true };

  // Custom minimap node color function
  const nodeColor = (node: any) => {
    if (node.type === 'input') return '#10B981';
    if (node.type === 'output') return '#EF4444';
    return '#3B82F6';
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">Interactive flow diagram visualization</p>
      </div>
      
      <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          proOptions={proOptions}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap 
            nodeColor={nodeColor}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={12} 
            size={1}
            color="#e5e7eb"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
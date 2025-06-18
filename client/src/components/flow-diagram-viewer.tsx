import React, { useCallback, useMemo, useEffect, useState } from 'react';
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
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowDiagramData } from '@/lib/ai-flow-diagram-generator';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';
import { FlowDiagramEditor } from '@/components/flow-diagram-editor';

interface FlowDiagramViewerProps {
  flowData: FlowDiagramData;
  title: string;
  className?: string;
  flowKey?: string;
  onFlowUpdate?: (updatedFlowData: FlowDiagramData) => void;
}

// Custom node styles for different types
const nodeTypes = {};

function FlowDiagramViewerInner({ flowData, title, className = "", flowKey, onFlowUpdate }: FlowDiagramViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges || []);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    console.log('FlowDiagramViewer received data:', flowData);
    console.log('Nodes:', flowData.nodes);
    console.log('Edges:', flowData.edges);
  }, [flowData]);

  const handleFlowSave = useCallback((updatedFlowData: FlowDiagramData) => {
    setNodes(updatedFlowData.nodes);
    setEdges(updatedFlowData.edges);
    if (onFlowUpdate) {
      onFlowUpdate(updatedFlowData);
    }
    setIsEditorOpen(false);
  }, [setNodes, setEdges, onFlowUpdate]);

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

  if (!flowData.nodes || flowData.nodes.length === 0) {
    return (
      <div className={`w-full h-full ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">No flow data available</p>
        </div>
        <div className="w-full h-96 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">No nodes to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">Interactive flow diagram with {nodes.length} nodes</p>
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
          fitViewOptions={{ padding: 0.2 }}
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

export function FlowDiagramViewer(props: FlowDiagramViewerProps) {
  return (
    <ReactFlowProvider>
      <FlowDiagramViewerInner {...props} />
    </ReactFlowProvider>
  );
}
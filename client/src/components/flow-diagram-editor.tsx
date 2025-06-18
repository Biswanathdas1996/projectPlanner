import React, { useCallback, useEffect, useState } from 'react';
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
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowDiagramData } from '@/lib/ai-flow-diagram-generator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Save, Download, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FlowDiagramEditorProps {
  isOpen: boolean;
  onClose: () => void;
  flowData: FlowDiagramData;
  title: string;
  flowKey?: string;
  onSave?: (updatedFlowData: FlowDiagramData) => void;
}

const nodeTypes = {};

function FlowDiagramEditorInner({ 
  isOpen, 
  onClose, 
  flowData, 
  title, 
  flowKey,
  onSave 
}: FlowDiagramEditorProps) {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges || []);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const originalNodesStr = JSON.stringify(flowData.nodes);
    const originalEdgesStr = JSON.stringify(flowData.edges);
    const currentNodesStr = JSON.stringify(nodes);
    const currentEdgesStr = JSON.stringify(edges);
    
    setHasChanges(
      originalNodesStr !== currentNodesStr || 
      originalEdgesStr !== currentEdgesStr
    );
  }, [nodes, edges, flowData]);

  // Reset to original data when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNodes(flowData.nodes || []);
      setEdges(flowData.edges || []);
      setHasChanges(false);
    }
  }, [isOpen, flowData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSave = useCallback(() => {
    // Convert ReactFlow edges to FlowEdge format
    const convertedEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated || false,
      style: edge.style,
      label: typeof edge.label === 'string' ? edge.label : undefined
    }));
    
    const updatedFlowData = { nodes, edges: convertedEdges };
    
    // Save to localStorage if flowKey is provided
    if (flowKey) {
      try {
        const existingFlows = JSON.parse(localStorage.getItem('flowDiagrams') || '{}');
        existingFlows[flowKey] = updatedFlowData;
        localStorage.setItem('flowDiagrams', JSON.stringify(existingFlows));
        
        toast({
          title: "Flow Saved",
          description: "Flow diagram has been saved to local storage",
        });
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        toast({
          title: "Save Error",
          description: "Failed to save flow diagram",
          variant: "destructive",
        });
      }
    }
    
    // Call parent save callback
    if (onSave) {
      onSave(updatedFlowData as FlowDiagramData);
    }
    
    setHasChanges(false);
  }, [nodes, edges, flowKey, onSave, toast]);

  const handleReset = useCallback(() => {
    setNodes(flowData.nodes || []);
    setEdges(flowData.edges || []);
    setHasChanges(false);
  }, [flowData, setNodes, setEdges]);

  const handleExportJSON = useCallback(() => {
    const flowJSON = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([flowJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Flow Exported",
      description: "Flow diagram JSON has been downloaded",
    });
  }, [nodes, edges, title, toast]);

  const nodeColor = (node: any) => {
    if (node.type === 'input') return '#10B981';
    if (node.type === 'output') return '#EF4444';
    return '#3B82F6';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Full-screen flow diagram editor • {nodes.length} nodes, {edges.length} edges
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                disabled={!hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={!hasChanges}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={handleExportJSON}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative" style={{ height: 'calc(95vh - 100px)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            attributionPosition="bottom-left"
            className="bg-gray-50"
          >
            <Controls className="bg-white shadow-lg border" />
            <MiniMap 
              nodeColor={nodeColor}
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="bg-white shadow-lg border"
            />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={16} 
              size={1}
              color="#e5e7eb"
            />
            
            {/* Custom Panel with Instructions */}
            <Panel position="top-left" className="bg-white shadow-lg border rounded-lg p-4 max-w-xs">
              <h4 className="font-semibold text-sm mb-2">Editor Instructions</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Drag nodes to reposition</li>
                <li>• Connect nodes by dragging from node handles</li>
                <li>• Use controls to zoom and fit view</li>
                <li>• Click Save to update the flow</li>
              </ul>
            </Panel>
          </ReactFlow>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FlowDiagramEditor(props: FlowDiagramEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowDiagramEditorInner {...props} />
    </ReactFlowProvider>
  );
}
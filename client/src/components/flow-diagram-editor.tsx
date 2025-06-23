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
  Node,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowDiagramData } from '@/lib/ai-flow-diagram-generator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Download, Maximize2, Plus, Trash2, Edit, RotateCcw, Settings, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState('default');
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const reactFlowInstance = useReactFlow();

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

  // Track selected elements
  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[], edges: Edge[] }) => {
    setSelectedNodes(selectedNodes);
    setSelectedEdges(selectedEdges);
  }, []);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Add new node
  const addNode = useCallback(() => {
    if (!newNodeLabel.trim()) {
      toast({
        title: "Error",
        description: "Please enter a node label",
        variant: "destructive"
      });
      return;
    }

    const newNode: Node = {
      id: `node-${Date.now()}`,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: newNodeLabel.trim() },
      type: newNodeType,
      style: getNodeStyle(newNodeType)
    };

    setNodes((nds) => [...nds, newNode]);
    setNewNodeLabel('');
    toast({
      title: "Success",
      description: "Node added successfully"
    });
  }, [newNodeLabel, newNodeType, setNodes, toast]);

  // Delete selected elements
  const deleteSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select nodes or edges to delete",
        variant: "destructive"
      });
      return;
    }

    const nodeIds = selectedNodes.map(node => node.id);
    const edgeIds = selectedEdges.map(edge => edge.id);

    setNodes((nds) => nds.filter(node => !nodeIds.includes(node.id)));
    setEdges((eds) => eds.filter(edge => !edgeIds.includes(edge.id)));

    toast({
      title: "Success",
      description: `Deleted ${nodeIds.length} nodes and ${edgeIds.length} edges`
    });
  }, [selectedNodes, selectedEdges, setNodes, setEdges, toast]);

  // Edit node
  const startEditNode = useCallback((node: Node) => {
    setEditingNode(node);
    setNewNodeLabel(node.data.label || '');
    setNewNodeType(node.type || 'default');
  }, []);

  const saveNodeEdit = useCallback(() => {
    if (!editingNode || !newNodeLabel.trim()) return;

    setNodes((nds) => nds.map(node => 
      node.id === editingNode.id 
        ? { 
            ...node, 
            data: { ...node.data, label: newNodeLabel.trim() },
            type: newNodeType,
            style: getNodeStyle(newNodeType)
          }
        : node
    ));

    setEditingNode(null);
    setNewNodeLabel('');
    toast({
      title: "Success",
      description: "Node updated successfully"
    });
  }, [editingNode, newNodeLabel, newNodeType, setNodes, toast]);

  const cancelEdit = useCallback(() => {
    setEditingNode(null);
    setNewNodeLabel('');
    setNewNodeType('default');
  }, []);

  // Get node style based on type
  const getNodeStyle = (type: string) => {
    switch (type) {
      case 'input':
        return { backgroundColor: '#10B981', color: 'white', border: '2px solid #059669' };
      case 'output':
        return { backgroundColor: '#EF4444', color: 'white', border: '2px solid #DC2626' };
      case 'default':
      default:
        return { backgroundColor: '#3B82F6', color: 'white', border: '2px solid #2563EB' };
    }
  };

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
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            attributionPosition="bottom-left"
            className="bg-gray-50"
            multiSelectionKeyCode="Shift"
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
            
            {/* Panel Toggle Button */}
            <Panel position="top-right" className="bg-white shadow-lg border rounded-lg p-2">
              <Button
                onClick={() => setIsPanelVisible(!isPanelVisible)}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                title={isPanelVisible ? "Hide Editor Panel" : "Show Editor Panel"}
              >
                {isPanelVisible ? <EyeOff className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
              </Button>
            </Panel>
            
            {/* Editing Panel */}
            {isPanelVisible && (
              <Panel position="top-left" className="bg-white shadow-lg border rounded-lg p-4 min-w-80">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Flow Editor</h3>
                  <Button
                    onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    title={isPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
                  >
                    {isPanelCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Panel Content - Collapsible */}
                {!isPanelCollapsed && (
                  <>
                    {/* Add Node Section */}
                    <div className="space-y-2 mb-4">
                      <Label className="text-xs font-medium">Add New Node</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Node label"
                          value={newNodeLabel}
                          onChange={(e) => setNewNodeLabel(e.target.value)}
                          className="text-xs h-8"
                          onKeyPress={(e) => e.key === 'Enter' && addNode()}
                        />
                        <Select value={newNodeType} onValueChange={setNewNodeType}>
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="input">Start</SelectItem>
                            <SelectItem value="default">Process</SelectItem>
                            <SelectItem value="output">End</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={addNode} size="sm" className="h-8 px-2">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Edit Node Section */}
                    {editingNode && (
                      <div className="space-y-2 mb-4 p-2 bg-blue-50 rounded border">
                        <Label className="text-xs font-medium">Edit Node: {editingNode.id}</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Node label"
                            value={newNodeLabel}
                            onChange={(e) => setNewNodeLabel(e.target.value)}
                            className="text-xs h-8"
                            onKeyPress={(e) => e.key === 'Enter' && saveNodeEdit()}
                          />
                          <Select value={newNodeType} onValueChange={setNewNodeType}>
                            <SelectTrigger className="w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="input">Start</SelectItem>
                              <SelectItem value="default">Process</SelectItem>
                              <SelectItem value="output">End</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={saveNodeEdit} size="sm" className="h-8 px-2 bg-green-600 hover:bg-green-700">
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button onClick={cancelEdit} size="sm" variant="outline" className="h-8 px-2">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Selection Actions */}
                    <div className="space-y-2 mb-4">
                      <Label className="text-xs font-medium">
                        Selected: {selectedNodes.length} nodes, {selectedEdges.length} edges
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          onClick={deleteSelected}
                          variant="destructive"
                          size="sm"
                          className="h-8 px-2"
                          disabled={selectedNodes.length === 0 && selectedEdges.length === 0}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                        {selectedNodes.length === 1 && (
                          <Button
                            onClick={() => startEditNode(selectedNodes[0])}
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <p className="font-medium mb-1">Instructions:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Click nodes/edges to select</li>
                        <li>• Hold Shift for multi-select</li>
                        <li>• Drag nodes to reposition</li>
                        <li>• Connect nodes by dragging handles</li>
                        <li>• Use controls to zoom and fit view</li>
                        <li>• Click Save to update the flow</li>
                      </ul>
                    </div>
                  </>
                )}
              </Panel>
            )}
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
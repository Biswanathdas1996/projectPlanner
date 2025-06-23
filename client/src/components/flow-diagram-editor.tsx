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
import { X, Save, Download, Maximize2, Plus, Trash2, Edit, RotateCcw, Settings, EyeOff, ChevronUp, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
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
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
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

  // AI Flow Generation
  const generateAIFlow = useCallback(async () => {
    if (!aiPrompt.trim()) return;

    setIsGeneratingAI(true);
    
    try {
      const apiKey = "AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM";
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const currentFlowContext = {
        existingNodes: nodes.map(n => ({ id: n.id, label: n.data?.label })),
        existingEdges: edges.map(e => ({ source: e.source, target: e.target })),
        nodeCount: nodes.length,
        edgeCount: edges.length
      };

      const prompt = `You are an AI flow diagram generator. Generate new flow components based on the user's request and append them to the existing flow diagram without modifying existing components.

Current Flow Context:
- Existing nodes: ${currentFlowContext.existingNodes.map(n => `${n.id}: ${n.label}`).join(', ')}
- Current node count: ${currentFlowContext.nodeCount}
- Current edge count: ${currentFlowContext.edgeCount}

User Request: "${aiPrompt}"

Generate new flow components that:
1. DO NOT modify or replace existing nodes/edges
2. Create new nodes with unique IDs starting from "ai-node-${Date.now()}-"
3. Connect appropriately to existing flow or create a separate sub-flow
4. Use logical positioning (avoid overlapping with existing nodes)
5. Include 3-7 new nodes maximum to keep the flow manageable

Return ONLY a JSON object with this exact structure:
{
  "newNodes": [
    {
      "id": "ai-node-xxx",
      "position": { "x": number, "y": number },
      "data": { "label": "Node Label" },
      "style": { "backgroundColor": "#colorcode" }
    }
  ],
  "newEdges": [
    {
      "id": "ai-edge-xxx",
      "source": "source-node-id",
      "target": "target-node-id",
      "animated": false
    }
  ],
  "connectionPoints": [
    {
      "existingNodeId": "existing-node-id",
      "newNodeId": "new-node-id",
      "edgeId": "connection-edge-id"
    }
  ]
}

Use these colors for nodes:
- Start/Input: #10B981 (green)
- Process/Action: #3B82F6 (blue)  
- Decision: #F59E0B (yellow)
- End/Output: #EF4444 (red)
- System: #8B5CF6 (purple)`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid AI response format");
      }
      
      const aiFlowData = JSON.parse(jsonMatch[0]);
      
      // Find the rightmost and bottommost positions of existing nodes
      const maxX = Math.max(...nodes.map(n => n.position.x), 0);
      const maxY = Math.max(...nodes.map(n => n.position.y), 0);
      
      // Adjust positions of new nodes to avoid overlap
      const adjustedNodes = aiFlowData.newNodes.map((node: any, index: number) => ({
        ...node,
        position: {
          x: node.position.x + maxX + 300, // Offset to the right
          y: node.position.y + (index * 100) // Spread vertically
        }
      }));

      // Generate connection edges if specified
      const connectionEdges = aiFlowData.connectionPoints?.map((conn: any) => ({
        id: conn.edgeId,
        source: conn.existingNodeId,
        target: conn.newNodeId,
        animated: false,
        style: { stroke: '#6366F1', strokeWidth: 2 }
      })) || [];

      // Add new nodes and edges to the existing flow
      setNodes(prevNodes => [...prevNodes, ...adjustedNodes]);
      setEdges(prevEdges => [...prevEdges, ...aiFlowData.newEdges, ...connectionEdges]);

      toast({
        title: "AI Flow Generated",
        description: `Added ${adjustedNodes.length} new nodes and ${aiFlowData.newEdges.length + connectionEdges.length} new connections`,
      });

      // Clear the prompt
      setAiPrompt('');
      
    } catch (error) {
      console.error('AI Flow Generation Error:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate AI flow. Please try a different prompt.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  }, [aiPrompt, nodes, edges, setNodes, setEdges, toast]);

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
            <div className="flex items-center gap-2 ml-[25px] mr-[25px]">
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
                            className="h-8 px-2 ml-[27px] mr-[27px]"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* AI Flow Generator */}
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded border border-purple-200">
                      <p className="font-medium mb-2 text-purple-800 text-sm">AI Flow Generator</p>
                      <div className="space-y-2">
                        <textarea
                          placeholder="Describe new flow components to add (e.g., 'Add user authentication flow with login, verification, and dashboard steps')"
                          className="w-full h-16 px-2 py-1 text-xs border rounded resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                        />
                        <Button
                          onClick={generateAIFlow}
                          disabled={isGeneratingAI || !aiPrompt.trim()}
                          size="sm"
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                          {isGeneratingAI ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              Generate & Append Flow
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <p className="font-medium mb-1">Instructions:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Use AI Generator to add new flow components</li>
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
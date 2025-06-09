import { useState, useCallback, useRef, useEffect } from 'react';
import type { ElementProperties, NotificationData } from '@shared/schema';
import { DEFAULT_BPMN_DIAGRAM, STORAGE_KEYS, generateId, xmlToJson } from '@/lib/bpmn-utils';

// Global BpmnJS type declaration
declare global {
  interface Window {
    BpmnJS: any;
  }
}

export function useBpmn() {
  const [selectedElement, setSelectedElement] = useState<ElementProperties | null>(null);
  const [diagramXml, setDiagramXml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [status, setStatus] = useState<string>('Ready');
  const modelerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize BPMN modeler
  const initializeModeler = useCallback(async () => {
    if (!containerRef.current || !window.BpmnJS) return;

    try {
      const modeler = new window.BpmnJS({
        container: containerRef.current,
        keyboard: {
          bindTo: document
        }
      });

      modelerRef.current = modeler;

      // Load default diagram
      await modeler.importXML(DEFAULT_BPMN_DIAGRAM);

      // Setup event listeners
      modeler.on('selection.changed', (event: any) => {
        try {
          if (!event || !event.newSelection) {
            setSelectedElement(null);
            return;
          }
          
          const selection = event.newSelection;
          if (Array.isArray(selection) && selection.length === 1) {
            const element = selection[0];
            if (element && typeof element === 'object') {
              const businessObject = element.businessObject || element;
              const elementData: ElementProperties = {
                id: businessObject.id || generateId(),
                name: businessObject.name || '',
                type: businessObject.$type ? businessObject.$type.replace('bpmn:', '') : 'unknown'
              };
              setSelectedElement(elementData);
            }
          } else {
            setSelectedElement(null);
          }
        } catch (error) {
          console.error('Selection error:', error);
          setSelectedElement(null);
        }
      });

      modeler.on('commandStack.changed', () => {
        updateXmlView();
        setStatus('Modified');
      });

      // Load from localStorage if available
      loadFromStorage();
      updateXmlView();
      setIsLoading(false);
      setStatus('Ready');
      
      // Auto-fit the diagram to viewport after initialization
      setTimeout(() => {
        if (modelerRef.current) {
          modelerRef.current.get('canvas').zoom('fit-viewport');
        }
      }, 500);

    } catch (error) {
      console.error('Error initializing BPMN modeler:', error);
      showNotification('Failed to initialize BPMN modeler', 'error');
      setIsLoading(false);
    }
  }, []);

  // Update XML view
  const updateXmlView = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      const result = await modelerRef.current.saveXML({ format: true });
      setDiagramXml(result.xml);
    } catch (error) {
      console.error('Error updating XML view:', error);
      setDiagramXml('<!-- Failed to generate BPMN XML -->');
    }
  }, []);

  // Show notification
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success', duration: number = 5000) => {
    const notification: NotificationData = {
      id: generateId(),
      message,
      type,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, duration);
    }
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Save to localStorage
  const saveToStorage = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      const result = await modelerRef.current.saveXML({ format: true });
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, result.xml);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, new Date().toISOString());
      showNotification('Diagram saved successfully!', 'success');
      setStatus('Saved');
    } catch (error) {
      console.error('Error saving diagram:', error);
      showNotification('Failed to save diagram', 'error');
    }
  }, [showNotification]);

  // Convert legacy JSON format to BPMN XML with swimlanes
  const convertJsonToBpmnXml = useCallback((jsonData: any): string => {
    // Create a basic but complete BPMN XML structure that BPMN.js can render
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" 
  id="Definitions_Legacy" 
  targetNamespace="http://bpmn.io/schema/bpmn">
  
  <bpmn2:collaboration id="Collaboration_1">
    <bpmn2:participant id="Participant_User" name="User Process" processRef="Process_User" />
    <bpmn2:participant id="Participant_System" name="System Process" processRef="Process_System" />
    <bpmn2:participant id="Participant_Backend" name="Backend Process" processRef="Process_Backend" />
  </bpmn2:collaboration>

  <bpmn2:process id="Process_User" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1" name="Process Start">
      <bpmn2:outgoing>Flow_1</bpmn2:outgoing>
    </bpmn2:startEvent>
    <bpmn2:userTask id="UserTask_1" name="User Action">
      <bpmn2:incoming>Flow_1</bpmn2:incoming>
      <bpmn2:outgoing>Flow_2</bpmn2:outgoing>
    </bpmn2:userTask>
    <bpmn2:userTask id="UserTask_2" name="Review Output">
      <bpmn2:incoming>Flow_6</bpmn2:incoming>
      <bpmn2:outgoing>Flow_7</bpmn2:outgoing>
    </bpmn2:userTask>
    <bpmn2:endEvent id="EndEvent_1" name="Process Complete">
      <bpmn2:incoming>Flow_7</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="UserTask_1" />
    <bpmn2:sequenceFlow id="Flow_2" sourceRef="UserTask_1" targetRef="UserTask_2" />
    <bpmn2:sequenceFlow id="Flow_7" sourceRef="UserTask_2" targetRef="EndEvent_1" />
  </bpmn2:process>

  <bpmn2:process id="Process_System" isExecutable="false">
    <bpmn2:serviceTask id="ServiceTask_1" name="Process Request">
      <bpmn2:incoming>MessageFlow_1</bpmn2:incoming>
      <bpmn2:outgoing>Flow_3</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:exclusiveGateway id="Gateway_1" name="Validation">
      <bpmn2:incoming>Flow_3</bpmn2:incoming>
      <bpmn2:outgoing>Flow_4</bpmn2:outgoing>
      <bpmn2:outgoing>Flow_5</bpmn2:outgoing>
    </bpmn2:exclusiveGateway>
    <bpmn2:serviceTask id="ServiceTask_2" name="Generate Response">
      <bpmn2:incoming>Flow_4</bpmn2:incoming>
      <bpmn2:outgoing>MessageFlow_2</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:sequenceFlow id="Flow_3" sourceRef="ServiceTask_1" targetRef="Gateway_1" />
    <bpmn2:sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="ServiceTask_2" name="Valid" />
    <bpmn2:sequenceFlow id="Flow_5" sourceRef="Gateway_1" targetRef="ServiceTask_3" name="Error" />
  </bpmn2:process>

  <bpmn2:process id="Process_Backend" isExecutable="false">
    <bpmn2:serviceTask id="ServiceTask_3" name="Handle Error">
      <bpmn2:incoming>Flow_5</bpmn2:incoming>
      <bpmn2:outgoing>MessageFlow_3</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:serviceTask id="ServiceTask_4" name="Process Data">
      <bpmn2:incoming>MessageFlow_4</bpmn2:incoming>
      <bpmn2:outgoing>Flow_6</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:sequenceFlow id="Flow_6" sourceRef="ServiceTask_4" targetRef="UserTask_2" />
  </bpmn2:process>

  <bpmn2:messageFlow id="MessageFlow_1" sourceRef="UserTask_1" targetRef="ServiceTask_1" />
  <bpmn2:messageFlow id="MessageFlow_2" sourceRef="ServiceTask_2" targetRef="ServiceTask_4" />
  <bpmn2:messageFlow id="MessageFlow_3" sourceRef="ServiceTask_3" targetRef="UserTask_1" />
  <bpmn2:messageFlow id="MessageFlow_4" sourceRef="ServiceTask_1" targetRef="ServiceTask_4" />

  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_User_di" bpmnElement="Participant_User" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="800" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Participant_System_di" bpmnElement="Participant_System" isHorizontal="true">
        <dc:Bounds x="160" y="350" width="800" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Participant_Backend_di" bpmnElement="Participant_Backend" isHorizontal="true">
        <dc:Bounds x="160" y="620" width="800" height="250" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="232" y="162" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="UserTask_1_di" bpmnElement="UserTask_1">
        <dc:Bounds x="320" y="140" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="UserTask_2_di" bpmnElement="UserTask_2">
        <dc:Bounds x="680" y="140" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="832" y="162" width="36" height="36" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="ServiceTask_1_di" bpmnElement="ServiceTask_1">
        <dc:Bounds x="320" y="410" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1" isMarkerVisible="true">
        <dc:Bounds x="465" y="425" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="ServiceTask_2_di" bpmnElement="ServiceTask_2">
        <dc:Bounds x="560" y="410" width="100" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="ServiceTask_3_di" bpmnElement="ServiceTask_3">
        <dc:Bounds x="440" y="680" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="ServiceTask_4_di" bpmnElement="ServiceTask_4">
        <dc:Bounds x="680" y="680" width="100" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="268" y="180" />
        <di:waypoint x="320" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="420" y="180" />
        <di:waypoint x="680" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7">
        <di:waypoint x="780" y="180" />
        <di:waypoint x="832" y="180" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="420" y="450" />
        <di:waypoint x="465" y="450" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="515" y="450" />
        <di:waypoint x="560" y="450" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <di:waypoint x="490" y="475" />
        <di:waypoint x="490" y="680" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6">
        <di:waypoint x="730" y="680" />
        <di:waypoint x="730" y="220" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="MessageFlow_1_di" bpmnElement="MessageFlow_1">
        <di:waypoint x="370" y="220" />
        <di:waypoint x="370" y="410" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="MessageFlow_2_di" bpmnElement="MessageFlow_2">
        <di:waypoint x="610" y="490" />
        <di:waypoint x="680" y="680" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="MessageFlow_3_di" bpmnElement="MessageFlow_3">
        <di:waypoint x="440" y="720" />
        <di:waypoint x="390" y="220" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="MessageFlow_4_di" bpmnElement="MessageFlow_4">
        <di:waypoint x="390" y="490" />
        <di:waypoint x="710" y="680" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;
  }, []);

  // Load from localStorage
  const loadFromStorage = useCallback(async () => {
    if (!modelerRef.current) return;

    // First check for AI-generated diagram (now in XML format)
    const aiDiagram = localStorage.getItem(STORAGE_KEYS.CURRENT_DIAGRAM);
    if (aiDiagram) {
      try {
        // Check if it's XML format (starts with <?xml or <bpmn:definitions)
        if (aiDiagram.trim().startsWith('<?xml') || aiDiagram.trim().startsWith('<bpmn:definitions') || aiDiagram.trim().startsWith('<bpmn2:definitions')) {
          // Direct XML import
          await modelerRef.current.importXML(aiDiagram);
          showNotification('AI-generated BPMN diagram loaded successfully', 'success');
          setStatus('AI Loaded');
          updateXmlView();
          
          // Auto-fit AI diagrams to viewport for better visibility
          setTimeout(() => {
            if (modelerRef.current) {
              modelerRef.current.get('canvas').zoom('fit-viewport');
            }
          }, 300);
          
          // Clear the AI diagram after loading to prevent reloading
          localStorage.removeItem(STORAGE_KEYS.CURRENT_DIAGRAM);
          return;
        } else {
          // Legacy JSON format - convert to XML
          const jsonData = JSON.parse(aiDiagram);
          const bpmnXml = convertJsonToBpmnXml(jsonData);
          await modelerRef.current.importXML(bpmnXml);
          showNotification('AI-generated diagram loaded successfully', 'success');
          setStatus('AI Loaded');
          updateXmlView();
          
          // Auto-fit AI diagrams to viewport for better visibility
          setTimeout(() => {
            if (modelerRef.current) {
              modelerRef.current.get('canvas').zoom('fit-viewport');
            }
          }, 300);
          
          // Clear the AI diagram after loading to prevent reloading
          localStorage.removeItem(STORAGE_KEYS.CURRENT_DIAGRAM);
          return;
        }
      } catch (error) {
        // Only log meaningful errors, not empty objects
        if (error && ((error instanceof Error && error.message) || (typeof error === 'string' && error.length > 0) || error.toString() !== '[object Object]')) {
          console.error('Error loading AI diagram:', error);
          showNotification('Failed to load AI diagram, loading saved diagram instead', 'warning');
        }
      }
    }

    // Fallback to regular saved diagram
    const savedDiagram = localStorage.getItem(STORAGE_KEYS.DIAGRAM);
    if (savedDiagram) {
      try {
        await modelerRef.current.importXML(savedDiagram);
        showNotification('Diagram loaded from storage', 'success');
        setStatus('Loaded');
        updateXmlView();
      } catch (error) {
        console.error('Error loading saved diagram:', error);
        showNotification('Failed to load saved diagram', 'error');
      }
    }
  }, [showNotification, updateXmlView, convertJsonToBpmnXml]);

  // Create new diagram
  const createNew = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      await modelerRef.current.importXML(DEFAULT_BPMN_DIAGRAM);
      showNotification('New diagram created', 'success');
      setStatus('Ready');
      updateXmlView();
    } catch (error) {
      console.error('Error creating new diagram:', error);
      showNotification('Failed to create new diagram', 'error');
    }
  }, [showNotification, updateXmlView]);

  // Export diagram
  const exportDiagram = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      const result = await modelerRef.current.saveXML({ format: true });
      const blob = new Blob([result.xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bpmn-diagram-${new Date().toISOString().slice(0, 10)}.bpmn`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('Diagram exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting diagram:', error);
      showNotification('Failed to export diagram', 'error');
    }
  }, [showNotification]);

  // Import diagram
  const importDiagram = useCallback(async (file: File) => {
    if (!modelerRef.current) return;

    try {
      const text = await file.text();
      await modelerRef.current.importXML(text);
      showNotification('Diagram imported successfully', 'success');
      setStatus('Imported');
      updateXmlView();
    } catch (error) {
      console.error('Error importing diagram:', error);
      showNotification('Failed to import diagram', 'error');
    }
  }, [showNotification, updateXmlView]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    if (modelerRef.current) {
      modelerRef.current.get('zoomScroll').zoom(1, { x: 300, y: 300 });
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (modelerRef.current) {
      modelerRef.current.get('zoomScroll').zoom(-1, { x: 300, y: 300 });
    }
  }, []);

  const zoomFit = useCallback(() => {
    if (modelerRef.current) {
      modelerRef.current.get('canvas').zoom('fit-viewport');
    }
  }, []);

  // Update element properties
  const updateElementProperties = useCallback((properties: Partial<ElementProperties>) => {
    if (!modelerRef.current || !selectedElement) return;

    try {
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const modeling = modelerRef.current.get('modeling');
      const element = elementRegistry.get(selectedElement.id);
      
      if (element) {
        const newProperties: any = {};
        if (properties.name !== undefined) {
          newProperties.name = properties.name;
        }
        
        modeling.updateProperties(element, newProperties);
        
        setSelectedElement(prev => prev ? { ...prev, ...properties } : null);
        showNotification('Element properties updated', 'success');
      }
    } catch (error) {
      console.error('Error updating element properties:', error);
      showNotification('Failed to update element properties', 'error');
    }
  }, [selectedElement, showNotification]);

  // Copy BPMN XML to clipboard
  const copyXmlToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(diagramXml);
      showNotification('BPMN XML copied to clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy BPMN XML:', error);
      showNotification('Failed to copy BPMN XML to clipboard', 'error');
    }
  }, [diagramXml, showNotification]);

  // Handle element select
  const handleElementSelect = useCallback((elementId: string) => {
    if (!modelerRef.current) return;

    try {
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const selection = modelerRef.current.get('selection');
      const element = elementRegistry.get(elementId);
      
      if (element) {
        selection.select(element);
      }
    } catch (error) {
      console.error('Error selecting element:', error);
    }
  }, []);

  // Connect elements
  const connectElements = useCallback((sourceId: string, targetId: string) => {
    if (!modelerRef.current) return;

    try {
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const modeling = modelerRef.current.get('modeling');
      const source = elementRegistry.get(sourceId);
      const target = elementRegistry.get(targetId);
      
      if (source && target) {
        modeling.connect(source, target);
        showNotification('Elements connected successfully', 'success');
      }
    } catch (error) {
      console.error('Error connecting elements:', error);
      showNotification('Failed to connect elements', 'error');
    }
  }, [showNotification]);

  // Simple contextual toolbar functions
  const createConnection = useCallback((direction: 'right' | 'down' | 'up' | 'left') => {
    showNotification(`Create connection ${direction}`, 'warning');
  }, [showNotification]);

  const createElement = useCallback((elementType: string) => {
    showNotification(`Create ${elementType}`, 'warning');
  }, [showNotification]);

  const deleteSelectedElement = useCallback(() => {
    showNotification('Delete element', 'warning');
  }, [showNotification]);

  const copySelectedElement = useCallback(() => {
    showNotification('Copy element', 'warning');
  }, [showNotification]);

  const activateConnectionMode = useCallback(() => {
    showNotification('Connection mode activated', 'warning');
  }, [showNotification]);

  // Initialize modeler on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeModeler();
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeModeler]);

  return {
    containerRef,
    selectedElement,
    diagramXml,
    isLoading,
    notifications,
    status,
    showNotification,
    removeNotification,
    saveToStorage,
    loadFromStorage,
    createNew,
    exportDiagram,
    importDiagram,
    zoomIn,
    zoomOut,
    zoomFit,
    updateElementProperties,
    copyXmlToClipboard,
    handleElementSelect,
    connectElements,
    createConnection,
    createElement,
    deleteSelectedElement,
    copySelectedElement,
    activateConnectionMode,
  };
}
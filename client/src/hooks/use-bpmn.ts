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
  const [diagramJson, setDiagramJson] = useState<string>('{}');
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
        const selection = event.newSelection;
        if (selection.length === 1) {
          const element = selection[0];
          setSelectedElement({
            id: element.id || '',
            name: element.businessObject?.name || '',
            type: element.type || 'Unknown',
            documentation: element.businessObject?.documentation?.[0]?.text || ''
          });
        } else {
          setSelectedElement(null);
        }
      });

      modeler.on('commandStack.changed', () => {
        updateJsonView();
        setStatus('Modified');
      });

      // Load from localStorage if available
      loadFromStorage();
      updateJsonView();
      setIsLoading(false);
      setStatus('Ready');

    } catch (error) {
      console.error('Error initializing BPMN modeler:', error);
      showNotification('Failed to initialize BPMN modeler', 'error');
      setIsLoading(false);
    }
  }, []);

  // Update JSON view
  const updateJsonView = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      const result = await modelerRef.current.saveXML({ format: true });
      const jsonRepresentation = xmlToJson(result.xml);
      setDiagramJson(jsonRepresentation);
    } catch (error) {
      console.error('Error updating JSON view:', error);
      setDiagramJson(JSON.stringify({ error: 'Failed to generate JSON view' }, null, 2));
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

  // Convert AI-generated JSON to BPMN XML with swimlanes
  const convertJsonToBpmnXml = useCallback((jsonData: any): string => {
    const definitions = jsonData.definitions || jsonData;
    const elements = definitions.elements || [];
    const flows = definitions.flows || [];
    const swimlanes = definitions.swimlanes || [];

    // Generate BPMN XML from JSON structure
    let bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  id="${definitions.id || 'Definitions_1'}" 
  targetNamespace="http://bpmn.io/schema/bpmn">`;

    if (swimlanes.length > 0) {
      // Create collaboration with single participant for swimlanes
      bpmnXml += `
  <bpmn2:collaboration id="Collaboration_1">
    <bpmn2:participant id="Participant_1" name="Process Participant" processRef="Process_1" />
  </bpmn2:collaboration>`;
    }

    // Create single process with all elements
    bpmnXml += `
  <bpmn2:process id="Process_1" isExecutable="false">`;

    if (swimlanes.length > 0) {
      // Add lane sets for swimlanes
      bpmnXml += `
    <bpmn2:laneSet id="LaneSet_1">`;

      swimlanes.forEach((lane: any) => {
        const laneElements = elements.filter((element: any) => element.lane === lane.id);
        const elementRefs = laneElements.map((el: any) => el.id).join('" flowNodeRef="');
        
        bpmnXml += `
      <bpmn2:lane id="${lane.id}" name="${lane.name}">
        <bpmn2:flowNodeRef>${elementRefs}</bpmn2:flowNodeRef>
      </bpmn2:lane>`;
      });

      bpmnXml += `
    </bpmn2:laneSet>`;
    }

    // Add all elements
    elements.forEach((element: any) => {
      const incomingFlows = flows.filter((flow: any) => flow.targetRef === element.id);
      const outgoingFlows = flows.filter((flow: any) => flow.sourceRef === element.id);

      const incomingRefs = incomingFlows.map((flow: any) => `<bpmn2:incoming>${flow.id}</bpmn2:incoming>`).join('\n      ');
      const outgoingRefs = outgoingFlows.map((flow: any) => `<bpmn2:outgoing>${flow.id}</bpmn2:outgoing>`).join('\n      ');

      switch (element.type) {
        case 'startEvent':
          bpmnXml += `
    <bpmn2:startEvent id="${element.id}" name="${element.name || 'Start'}">
      ${outgoingRefs}
    </bpmn2:startEvent>`;
          break;
        case 'task':
        case 'userTask':
        case 'serviceTask':
          const taskType = element.type === 'task' ? 'task' : element.type;
          bpmnXml += `
    <bpmn2:${taskType} id="${element.id}" name="${element.name || 'Task'}">
      ${incomingRefs}
      ${outgoingRefs}
    </bpmn2:${taskType}>`;
          break;
        case 'exclusiveGateway':
          bpmnXml += `
    <bpmn2:exclusiveGateway id="${element.id}" name="${element.name || 'Gateway'}">
      ${incomingRefs}
      ${outgoingRefs}
    </bpmn2:exclusiveGateway>`;
          break;
        case 'parallelGateway':
          bpmnXml += `
    <bpmn2:parallelGateway id="${element.id}" name="${element.name || 'Parallel Gateway'}">
      ${incomingRefs}
      ${outgoingRefs}
    </bpmn2:parallelGateway>`;
          break;
        case 'intermediateCatchEvent':
          bpmnXml += `
    <bpmn2:intermediateCatchEvent id="${element.id}" name="${element.name || 'Wait'}">
      ${incomingRefs}
      ${outgoingRefs}
      <bpmn2:timerEventDefinition />
    </bpmn2:intermediateCatchEvent>`;
          break;
        case 'endEvent':
          bpmnXml += `
    <bpmn2:endEvent id="${element.id}" name="${element.name || 'End'}">
      ${incomingRefs}
    </bpmn2:endEvent>`;
          break;
      }
    });

    // Add all sequence flows
    flows.forEach((flow: any) => {
      bpmnXml += `
    <bpmn2:sequenceFlow id="${flow.id}" sourceRef="${flow.sourceRef}" targetRef="${flow.targetRef}" />`;
    });

    bpmnXml += `
  </bpmn2:process>`;

    // Add BPMN diagram with swimlanes
    const diagramElement = swimlanes.length > 0 ? "Collaboration_1" : "Process_1";
    bpmnXml += `
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${diagramElement}">`;

    if (swimlanes.length > 0) {
      // Add participant shape
      const totalHeight = swimlanes.length * 200;
      bpmnXml += `
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="50" y="50" width="1000" height="${totalHeight}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;

      // Add swimlane shapes
      swimlanes.forEach((lane: any, laneIndex: number) => {
        const laneHeight = 200;
        const laneY = 50 + (laneIndex * laneHeight);
        
        bpmnXml += `
      <bpmndi:BPMNShape id="${lane.id}_di" bpmnElement="${lane.id}" isHorizontal="true">
        <dc:Bounds x="80" y="${laneY}" width="970" height="${laneHeight}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
      });
    }

    // Add element shapes
    let elementPositions: any = {};
    
    if (swimlanes.length > 0) {
      // Position elements within swimlanes
      swimlanes.forEach((lane: any, laneIndex: number) => {
        const laneElements = elements.filter((element: any) => element.lane === lane.id);
        laneElements.forEach((element: any, elementIndex: number) => {
          const x = 150 + (elementIndex * 180);
          const y = 50 + (laneIndex * 200) + 80;
          elementPositions[element.id] = { x, y };
        });
      });
    } else {
      // Position elements without swimlanes
      elements.forEach((element: any, elementIndex: number) => {
        const x = 150 + (elementIndex * 180);
        const y = 150;
        elementPositions[element.id] = { x, y };
      });
    }

    // Add element shapes
    elements.forEach((element: any) => {
      const pos = elementPositions[element.id];
      let width = 100;
      let height = 80;

      if (element.type === 'startEvent' || element.type === 'endEvent' || element.type === 'intermediateCatchEvent') {
        width = 36;
        height = 36;
      } else if (element.type === 'exclusiveGateway' || element.type === 'parallelGateway') {
        width = 50;
        height = 50;
      }

      bpmnXml += `
      <bpmndi:BPMNShape id="${element.id}_di" bpmnElement="${element.id}">
        <dc:Bounds x="${pos.x}" y="${pos.y}" width="${width}" height="${height}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
    });

    // Add flow connectors
    flows.forEach((flow: any) => {
      const sourceElement = elements.find((el: any) => el.id === flow.sourceRef);
      const targetElement = elements.find((el: any) => el.id === flow.targetRef);
      
      if (sourceElement && targetElement) {
        const sourcePos = elementPositions[sourceElement.id];
        const targetPos = elementPositions[targetElement.id];
        
        // Calculate connection points
        const sourceX = sourcePos.x + 50; // Center of element
        const sourceY = sourcePos.y + 40;
        const targetX = targetPos.x;
        const targetY = targetPos.y + 40;

        bpmnXml += `
      <bpmndi:BPMNEdge id="${flow.id}_di" bpmnElement="${flow.id}">
        <di:waypoint x="${sourceX}" y="${sourceY}" />
        <di:waypoint x="${targetX}" y="${targetY}" />
      </bpmndi:BPMNEdge>`;
      }
    });

    bpmnXml += `
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

    return bpmnXml;
  }, []);

  // Load from localStorage
  const loadFromStorage = useCallback(async () => {
    if (!modelerRef.current) return;

    // First check for AI-generated diagram
    const aiDiagram = localStorage.getItem(STORAGE_KEYS.CURRENT_DIAGRAM);
    if (aiDiagram) {
      try {
        const jsonData = JSON.parse(aiDiagram);
        const bpmnXml = convertJsonToBpmnXml(jsonData);
        await modelerRef.current.importXML(bpmnXml);
        showNotification('AI-generated diagram loaded successfully', 'success');
        setStatus('AI Loaded');
        updateJsonView();
        // Clear the AI diagram after loading to prevent reloading
        localStorage.removeItem(STORAGE_KEYS.CURRENT_DIAGRAM);
        return;
      } catch (error) {
        console.error('Error loading AI diagram:', error);
        showNotification('Failed to load AI diagram, loading saved diagram instead', 'warning');
      }
    }

    // Fallback to regular saved diagram
    const savedDiagram = localStorage.getItem(STORAGE_KEYS.DIAGRAM);
    if (savedDiagram) {
      try {
        await modelerRef.current.importXML(savedDiagram);
        showNotification('Diagram loaded from storage', 'success');
        setStatus('Loaded');
        updateJsonView();
      } catch (error) {
        console.error('Error loading saved diagram:', error);
        showNotification('Failed to load saved diagram', 'error');
      }
    }
  }, [showNotification, updateJsonView, convertJsonToBpmnXml]);

  // Create new diagram
  const createNew = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      await modelerRef.current.importXML(DEFAULT_BPMN_DIAGRAM);
      showNotification('New diagram created', 'success');
      setStatus('Ready');
      updateJsonView();
    } catch (error) {
      console.error('Error creating new diagram:', error);
      showNotification('Failed to create new diagram', 'error');
    }
  }, [showNotification, updateJsonView]);

  // Export diagram
  const exportDiagram = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      const result = await modelerRef.current.saveXML({ format: true });
      const blob = new Blob([result.xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'process-diagram.bpmn';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification('Diagram exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting diagram:', error);
      showNotification('Failed to export diagram', 'error');
    }
  }, [showNotification]);

  // Import diagram
  const importDiagram = useCallback(async (content: string) => {
    if (!modelerRef.current) return;

    try {
      await modelerRef.current.importXML(content);
      showNotification('Diagram imported successfully', 'success');
      setStatus('Imported');
      updateJsonView();
    } catch (error) {
      console.error('Error importing diagram:', error);
      showNotification('Failed to import diagram. Please check the file format.', 'error');
    }
  }, [showNotification, updateJsonView]);

  // Canvas controls
  const zoomIn = useCallback(() => {
    if (modelerRef.current) {
      modelerRef.current.get('zoomScroll').stepZoom(1);
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (modelerRef.current) {
      modelerRef.current.get('zoomScroll').stepZoom(-1);
    }
  }, []);

  const zoomFit = useCallback(() => {
    if (modelerRef.current) {
      modelerRef.current.get('canvas').zoom('fit-viewport');
    }
  }, []);

  // Update element properties
  const updateElementProperties = useCallback(async (properties: Partial<ElementProperties>) => {
    if (!modelerRef.current || !selectedElement) return;

    try {
      const modeling = modelerRef.current.get('modeling');
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const element = elementRegistry.get(selectedElement.id);

      if (element) {
        if (properties.name !== undefined) {
          modeling.updateProperties(element, { name: properties.name });
        }
        if (properties.id !== undefined && properties.id !== selectedElement.id) {
          modeling.updateProperties(element, { id: properties.id });
        }

        // Update selected element state
        setSelectedElement(prev => prev ? { ...prev, ...properties } : null);
        updateJsonView();
        showNotification('Element properties updated', 'success');
      }
    } catch (error) {
      console.error('Error updating element properties:', error);
      showNotification('Failed to update element properties', 'error');
    }
  }, [selectedElement, updateJsonView, showNotification]);

  // Copy JSON to clipboard
  const copyJsonToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(diagramJson);
      showNotification('JSON copied to clipboard', 'success');
    } catch (error) {
      console.error('Error copying JSON:', error);
      showNotification('Failed to copy JSON', 'error');
    }
  }, [diagramJson, showNotification]);

  // Connect two elements with sequence flow
  const connectElements = useCallback(() => {
    if (!modelerRef.current) return;

    try {
      const globalConnect = modelerRef.current.get('globalConnect');
      
      if (globalConnect.isActive()) {
        globalConnect.toggle();
        showNotification('Connection mode deactivated', 'success', 2000);
      } else {
        globalConnect.toggle();
        showNotification('Connection mode activated - click two elements to connect', 'success', 3000);
      }
    } catch (error) {
      console.error('Error activating connection tool:', error);
      showNotification('Failed to activate connection tool', 'error');
    }
  }, [showNotification]);

  // Import diagram from JSON structure
  const importFromJson = useCallback(async (jsonData: any) => {
    if (!modelerRef.current) return;

    try {
      // Convert JSON structure to BPMN XML
      const xml = jsonToBpmnXml(jsonData);
      await modelerRef.current.importXML(xml);
      showNotification('Diagram imported successfully from AI plan', 'success');
      setStatus('AI Generated');
      updateJsonView();
    } catch (error) {
      console.error('Error importing from JSON:', error);
      showNotification('Failed to import diagram from AI plan', 'error');
    }
  }, [showNotification, updateJsonView]);

  // Convert JSON structure to BPMN XML
  const jsonToBpmnXml = (jsonData: any): string => {
    const elements = jsonData.definitions?.elements || [];
    const flows = jsonData.definitions?.flows || [];
    
    // Generate basic BPMN XML structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" 
  id="${jsonData.definitions?.id || 'ai-generated'}" 
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">`;

    // Add elements
    elements.forEach((element: any, index: number) => {
      const x = 100 + (index * 180);
      const y = 150;
      
      switch (element.type) {
        case 'startEvent':
          xml += `\n    <bpmn2:startEvent id="${element.id}" name="${element.name || ''}" />`;
          break;
        case 'endEvent':
          xml += `\n    <bpmn2:endEvent id="${element.id}" name="${element.name || ''}" />`;
          break;
        case 'task':
          xml += `\n    <bpmn2:task id="${element.id}" name="${element.name || ''}" />`;
          break;
        case 'exclusiveGateway':
          xml += `\n    <bpmn2:exclusiveGateway id="${element.id}" name="${element.name || ''}" />`;
          break;
      }
    });

    // Add sequence flows
    flows.forEach((flow: any) => {
      xml += `\n    <bpmn2:sequenceFlow id="${flow.id}" sourceRef="${flow.sourceRef}" targetRef="${flow.targetRef}" />`;
    });

    xml += `\n  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">`;

    // Add visual elements
    elements.forEach((element: any, index: number) => {
      const x = 100 + (index * 180);
      const y = 150;
      const width = element.type === 'task' ? 100 : element.type.includes('Gateway') ? 50 : 36;
      const height = element.type === 'task' ? 80 : element.type.includes('Gateway') ? 50 : 36;

      xml += `\n      <bpmndi:BPMNShape id="Shape_${element.id}" bpmnElement="${element.id}">
        <dc:Bounds height="${height}" width="${width}" x="${x}" y="${y}"/>
      </bpmndi:BPMNShape>`;
    });

    // Add flow visuals
    flows.forEach((flow: any, index: number) => {
      const sourceIndex = elements.findIndex((el: any) => el.id === flow.sourceRef);
      const targetIndex = elements.findIndex((el: any) => el.id === flow.targetRef);
      
      if (sourceIndex >= 0 && targetIndex >= 0) {
        const sourceX = 100 + (sourceIndex * 180) + 50;
        const sourceY = 150 + 20;
        const targetX = 100 + (targetIndex * 180);
        const targetY = 150 + 20;

        xml += `\n      <bpmndi:BPMNEdge id="Edge_${flow.id}" bpmnElement="${flow.id}">
        <di:waypoint x="${sourceX}" y="${sourceY}" />
        <di:waypoint x="${targetX}" y="${targetY}" />
      </bpmndi:BPMNEdge>`;
      }
    });

    xml += `\n    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

    return xml;
  };

  // Handle element selection from sidebar
  const handleElementSelect = useCallback((elementType: string) => {
    if (!modelerRef.current) return;

    try {
      const globalConnect = modelerRef.current.get('globalConnect');
      const dragging = modelerRef.current.get('dragging');
      const create = modelerRef.current.get('create');
      const elementFactory = modelerRef.current.get('elementFactory');
      const selection = modelerRef.current.get('selection');

      // First, clear any active tools
      if (globalConnect.isActive()) {
        globalConnect.toggle();
      }

      // Handle different tool types
      switch (elementType) {
        case 'hand-tool':
          // Activate hand tool (panning)
          selection.select([]);
          showNotification('Hand tool activated - drag to pan', 'success', 2000);
          break;

        case 'lasso-tool':
          // Activate selection mode
          selection.select([]);
          showNotification('Selection tool activated', 'success', 2000);
          break;

        case 'create.sequence-flow':
          // Activate connection mode
          globalConnect.toggle();
          showNotification('Connection tool activated - click elements to connect', 'success', 3000);
          break;

        case 'create.start-event':
          const startEvent = elementFactory.createShape({
            type: 'bpmn:StartEvent'
          });
          create.start(null, startEvent);
          showNotification('Start Event tool activated - click to place', 'success', 2000);
          break;

        case 'create.end-event':
          const endEvent = elementFactory.createShape({
            type: 'bpmn:EndEvent'
          });
          create.start(null, endEvent);
          showNotification('End Event tool activated - click to place', 'success', 2000);
          break;

        case 'create.intermediate-event':
          const intermediateEvent = elementFactory.createShape({
            type: 'bpmn:IntermediateThrowEvent'
          });
          create.start(null, intermediateEvent);
          showNotification('Intermediate Event tool activated - click to place', 'success', 2000);
          break;

        case 'create.task':
          const task = elementFactory.createShape({
            type: 'bpmn:Task'
          });
          create.start(null, task);
          showNotification('Task tool activated - click to place', 'success', 2000);
          break;

        case 'create.exclusive-gateway':
          const gateway = elementFactory.createShape({
            type: 'bpmn:ExclusiveGateway'
          });
          create.start(null, gateway);
          showNotification('Exclusive Gateway tool activated - click to place', 'success', 2000);
          break;

        case 'create.subprocess-expanded':
          const subprocess = elementFactory.createShape({
            type: 'bpmn:SubProcess',
            isExpanded: true
          });
          create.start(null, subprocess);
          showNotification('Subprocess tool activated - click to place', 'success', 2000);
          break;

        case 'create.data-object':
          const dataObject = elementFactory.createShape({
            type: 'bpmn:DataObjectReference'
          });
          create.start(null, dataObject);
          showNotification('Data Object tool activated - click to place', 'success', 2000);
          break;

        case 'create.text-annotation':
          const textAnnotation = elementFactory.createShape({
            type: 'bpmn:TextAnnotation'
          });
          create.start(null, textAnnotation);
          showNotification('Text Annotation tool activated - click to place', 'success', 2000);
          break;

        default:
          showNotification('Tool not available', 'warning');
      }
    } catch (error) {
      console.error('Error selecting element:', error);
      showNotification('Tool activation failed', 'error');
    }
  }, [showNotification]);

  // Initialize modeler when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeModeler();
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, [initializeModeler]);

  return {
    containerRef,
    selectedElement,
    diagramJson,
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
    copyJsonToClipboard,
    handleElementSelect,
    connectElements,
    importFromJson,
  };
}

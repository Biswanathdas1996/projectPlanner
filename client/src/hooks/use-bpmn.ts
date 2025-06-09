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

      // Setup event listeners with improved error handling
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
              const elementData = {
                id: element.id || businessObject.id || '',
                name: businessObject.name || element.label || '',
                type: element.type || businessObject.$type || 'Unknown',
                documentation: ''
              };

              // Safe documentation extraction
              try {
                if (businessObject.documentation && Array.isArray(businessObject.documentation) && businessObject.documentation[0]) {
                  elementData.documentation = businessObject.documentation[0].text || '';
                }
              } catch (docError) {
                // Documentation extraction failed, keep empty
              }

              setSelectedElement(elementData);
              return;
            }
          }
          setSelectedElement(null);
        } catch (error) {
          console.error('Error selecting element:', error);
          setSelectedElement(null);
        }
      });

      modeler.on('commandStack.changed', () => {
        updateJsonView();
        setStatus('Modified');
      });

      // Add connection helper when elements are created
      modeler.on('shape.added', (event: any) => {
        try {
          const newElement = event.element;
          if (newElement && newElement.type && !newElement.type.includes('Lane') && !newElement.type.includes('Participant')) {
            // Auto-select newly created elements for easier connection
            const selection = modelerRef.current?.get('selection');
            if (selection) {
              setTimeout(() => selection.select(newElement), 100);
            }
          }
        } catch (error) {
          // Silent error handling for shape addition
        }
      });

      // Load from localStorage if available
      loadFromStorage();
      updateJsonView();
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
    let elements = definitions.elements || [];
    const flows = definitions.flows || [];
    let swimlanes = definitions.swimlanes || [];

    // Validation: Ensure all elements are assigned to swimlanes
    if (swimlanes.length > 0) {
      const swimlaneIds = swimlanes.map((lane: any) => lane.id);
      
      // Check for elements without lane assignment
      elements = elements.map((element: any, index: number) => {
        if (!element.lane || !swimlaneIds.includes(element.lane)) {
          // Auto-assign to first available swimlane
          const targetLane = swimlaneIds[index % swimlaneIds.length];
          console.warn(`Element ${element.id} assigned to lane ${targetLane}`);
          return { ...element, lane: targetLane };
        }
        return element;
      });

      // Ensure each swimlane has at least one element
      swimlanes.forEach((lane: any) => {
        const laneElements = elements.filter((el: any) => el.lane === lane.id);
        if (laneElements.length === 0) {
          console.warn(`Swimlane ${lane.id} has no elements assigned`);
        }
      });
    }

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
      const totalHeight = swimlanes.length * 280;
      bpmnXml += `
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="50" y="50" width="1500" height="${totalHeight}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;

      // Add swimlane shapes
      swimlanes.forEach((lane: any, laneIndex: number) => {
        const laneHeight = 280;
        const laneY = 50 + (laneIndex * laneHeight);
        
        bpmnXml += `
      <bpmndi:BPMNShape id="${lane.id}_di" bpmnElement="${lane.id}" isHorizontal="true">
        <dc:Bounds x="80" y="${laneY}" width="1400" height="${laneHeight}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
      });
    }

    // Add element shapes with proper containment within swimlanes
    let elementPositions: any = {};
    
    if (swimlanes.length > 0) {
      // Position elements within swimlane boundaries with padding
      swimlanes.forEach((lane: any, laneIndex: number) => {
        const laneElements = elements.filter((element: any) => element.lane === lane.id);
        const laneHeight = 280;
        const laneY = 50 + (laneIndex * laneHeight);
        const lanePadding = 30; // Padding from swimlane edges
        const elementSpacing = 280; // Space between elements
        
        laneElements.forEach((element: any, elementIndex: number) => {
          // Ensure elements are within swimlane boundaries
          const x = 150 + lanePadding + (elementIndex * elementSpacing);
          const y = laneY + lanePadding + 60; // Center vertically in lane with padding
          
          // Validate element is within lane bounds
          const maxX = 1400 - 150; // Lane width minus element width
          const constrainedX = Math.min(x, maxX);
          
          elementPositions[element.id] = { 
            x: constrainedX, 
            y: y,
            laneIndex: laneIndex,
            elementIndex: elementIndex
          };
        });
      });
    } else {
      // Position elements without swimlanes
      elements.forEach((element: any, elementIndex: number) => {
        const x = 200 + (elementIndex * 280);
        const y = 200;
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
        
        // Auto-fit AI diagrams to viewport for better visibility
        setTimeout(() => {
          if (modelerRef.current) {
            modelerRef.current.get('canvas').zoom('fit-viewport');
          }
        }, 300);
        
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

  // Create connection from selected element
  const createConnection = useCallback((direction: 'right' | 'down' | 'up' | 'left') => {
    if (!modelerRef.current || !selectedElement) return;

    try {
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const modeling = modelerRef.current.get('modeling');
      const bpmnFactory = modelerRef.current.get('bpmnFactory');
      
      const sourceElement = elementRegistry.get(selectedElement.id);
      if (!sourceElement) return;

      // Calculate position for new element based on direction
      let targetX = sourceElement.x;
      let targetY = sourceElement.y;
      
      switch (direction) {
        case 'right':
          targetX += 220;
          break;
        case 'left':
          targetX -= 220;
          break;
        case 'down':
          targetY += 150;
          break;
        case 'up':
          targetY -= 150;
          break;
      }

      // Create new task business object
      const taskBusinessObject = bpmnFactory.create('bpmn:Task', {
        id: `Task_${generateId()}`,
        name: 'New Task'
      });

      // Create the shape using modeling service
      const newElement = modeling.createShape(
        { type: 'bpmn:Task', businessObject: taskBusinessObject },
        { x: targetX, y: targetY },
        sourceElement.parent
      );

      // Create sequence flow business object
      const flowBusinessObject = bpmnFactory.create('bpmn:SequenceFlow', {
        id: `Flow_${generateId()}`,
        sourceRef: sourceElement.businessObject,
        targetRef: newElement.businessObject
      });

      // Create the connection using modeling service
      modeling.createConnection(
        sourceElement,
        newElement,
        { type: 'bpmn:SequenceFlow', businessObject: flowBusinessObject },
        sourceElement.parent
      );
      
      // Select the new element
      const selection = modelerRef.current.get('selection');
      selection.select(newElement);
      
      showNotification(`Connected ${direction} successfully`, 'success');
      updateJsonView();
    } catch (error) {
      console.error('Error creating connection:', error);
      showNotification('Failed to create connection', 'error');
    }
  }, [selectedElement, showNotification, updateJsonView]);

  // Create new element near selected element
  const createElement = useCallback((elementType: string) => {
    if (!modelerRef.current || !selectedElement) return;

    try {
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const modeling = modelerRef.current.get('modeling');
      const bpmnFactory = modelerRef.current.get('bpmnFactory');
      
      const sourceElement = elementRegistry.get(selectedElement.id);
      if (!sourceElement) return;

      // Create business object based on type
      const elementId = `${elementType.split(':')[1]}_${generateId()}`;
      const elementName = elementType.includes('Event') ? '' : `New ${elementType.split(':')[1]}`;
      
      const businessObject = bpmnFactory.create(elementType, {
        id: elementId,
        name: elementName
      });

      // Position new element to the right of selected element
      const newElement = modeling.createShape(
        { type: elementType, businessObject: businessObject },
        { x: sourceElement.x + 220, y: sourceElement.y },
        sourceElement.parent
      );

      // Select the new element
      const selection = modelerRef.current.get('selection');
      selection.select(newElement);
      
      showNotification(`${elementType.split(':')[1]} created successfully`, 'success');
      updateJsonView();
    } catch (error) {
      console.error('Error creating element:', error);
      showNotification('Failed to create element', 'error');
    }
  }, [selectedElement, showNotification, updateJsonView]);

  // Delete selected element
  const deleteSelectedElement = useCallback(() => {
    if (!modelerRef.current || !selectedElement) return;

    try {
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const modeling = modelerRef.current.get('modeling');
      
      const element = elementRegistry.get(selectedElement.id);
      if (element) {
        modeling.removeElements([element]);
        setSelectedElement(null);
        showNotification('Element deleted successfully', 'success');
        updateJsonView();
      }
    } catch (error) {
      console.error('Error deleting element:', error);
      showNotification('Failed to delete element', 'error');
    }
  }, [selectedElement, showNotification, updateJsonView]);

  // Copy selected element
  const copySelectedElement = useCallback(() => {
    if (!modelerRef.current || !selectedElement) return;

    try {
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const modeling = modelerRef.current.get('modeling');
      const bpmnFactory = modelerRef.current.get('bpmnFactory');
      
      const sourceElement = elementRegistry.get(selectedElement.id);
      if (!sourceElement) return;

      // Create copy business object
      const copyId = `${sourceElement.businessObject.$type.split(':')[1]}_${generateId()}`;
      const copyName = sourceElement.businessObject.name ? `${sourceElement.businessObject.name} (Copy)` : '';
      
      const copyBusinessObject = bpmnFactory.create(sourceElement.businessObject.$type, {
        id: copyId,
        name: copyName
      });

      // Position copy to the right of original
      const newElement = modeling.createShape(
        { type: sourceElement.type, businessObject: copyBusinessObject },
        { x: sourceElement.x + 180, y: sourceElement.y + 80 },
        sourceElement.parent
      );

      // Select the copied element
      const selection = modelerRef.current.get('selection');
      selection.select(newElement);
      
      showNotification('Element copied successfully', 'success');
      updateJsonView();
    } catch (error) {
      console.error('Error copying element:', error);
      showNotification('Failed to copy element', 'error');
    }
  }, [selectedElement, showNotification, updateJsonView]);

  // Update element properties
  const updateElementProperties = useCallback(async (properties: Partial<ElementProperties>) => {
    if (!modelerRef.current || !selectedElement) return;

    try {
      const modeling = modelerRef.current.get('modeling');
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const element = elementRegistry.get(selectedElement.id);

      if (element) {
        const updateProps: any = {};
        
        if (properties.name !== undefined) {
          updateProps.name = properties.name;
        }
        if (properties.id !== undefined && properties.id !== selectedElement.id) {
          updateProps.id = properties.id;
        }
        if (properties.documentation !== undefined) {
          updateProps.documentation = properties.documentation;
        }
        
        // Handle duration properties
        if (properties.duration !== undefined || properties.durationUnit !== undefined) {
          const duration = properties.duration || selectedElement.duration;
          const durationUnit = properties.durationUnit || selectedElement.durationUnit || 'minutes';
          
          // Create time annotation as part of element name if duration exists
          if (duration && duration.trim() !== '') {
            const baseName = (properties.name || selectedElement.name || '').replace(/\s*\(\d+.*?\)$/, '');
            updateProps.name = `${baseName} (${duration} ${durationUnit})`.trim();
          }
        }
        
        modeling.updateProperties(element, updateProps);

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

  // Activate connection mode for connecting to any element
  const activateConnectionMode = useCallback(() => {
    if (!modelerRef.current) return;

    try {
      const globalConnect = modelerRef.current.get('globalConnect');
      const selection = modelerRef.current.get('selection');
      
      if (globalConnect.isActive()) {
        globalConnect.toggle();
        showNotification('Connection mode deactivated', 'success', 2000);
      } else {
        globalConnect.toggle();
        showNotification('Connection mode active - click on target element to connect', 'success', 4000);
      }
    } catch (error) {
      console.error('Error activating connection mode:', error);
      showNotification('Failed to activate connection mode', 'error');
    }
  }, [showNotification]);

  // Connect two elements with sequence flow
  const connectElements = useCallback(() => {
    if (!modelerRef.current) return;

    try {
      const globalConnect = modelerRef.current.get('globalConnect');
      const selection = modelerRef.current.get('selection');
      
      if (globalConnect.isActive()) {
        globalConnect.toggle();
        showNotification('Connection mode deactivated', 'success', 2000);
      } else {
        // Clear any current selection to start fresh
        selection.select([]);
        globalConnect.toggle();
        showNotification('Click on source element, then target element to connect', 'success', 4000);
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
    // Contextual toolbar functions
    createConnection,
    createElement,
    deleteSelectedElement,
    copySelectedElement,
    activateConnectionMode,
  };
}

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

  // Load from localStorage
  const loadFromStorage = useCallback(async () => {
    if (!modelerRef.current) return;

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
  }, [showNotification, updateJsonView]);

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

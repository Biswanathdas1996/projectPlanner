import { useState, useCallback, useRef, useEffect } from 'react';
import type { ElementProperties, NotificationData } from '@shared/schema';
import { DEFAULT_BPMN_DIAGRAM, STORAGE_KEYS, generateId, xmlToJson } from '@/lib/bpmn-utils';

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

  // Validate and categorize BPMN elements 
  const validateAndCategorizeBpmn = useCallback((jsonData: any): any => {
    const definitions = jsonData.definitions || jsonData;
    let elements = definitions.elements || [];
    const flows = definitions.flows || [];
    let swimlanes = definitions.swimlanes || [];

    // Create default categories if none exist
    if (swimlanes.length === 0) {
      swimlanes = [
        { id: 'Lane_Planning', name: 'Planning & Initiation', elements: [] },
        { id: 'Lane_Execution', name: 'Development & Execution', elements: [] },
        { id: 'Lane_Review', name: 'Review & Quality Control', elements: [] },
        { id: 'Lane_Completion', name: 'Completion & Delivery', elements: [] }
      ];
    }

    const swimlaneIds = swimlanes.map((lane: any) => lane.id);
    const uncategorized = elements.filter((el: any) => !el.lane || !swimlaneIds.includes(el.lane));
    
    if (uncategorized.length > 0) {
      console.warn(`Found ${uncategorized.length} uncategorized elements - auto-assigning to appropriate categories`);
      
      uncategorized.forEach((element: any, index: number) => {
        let targetCategory = '';
        
        if (element.type === 'startEvent' || element.name?.toLowerCase().includes('start')) {
          targetCategory = 'Lane_Planning';
        } else if (element.type === 'endEvent' || element.name?.toLowerCase().includes('complete')) {
          targetCategory = 'Lane_Completion';
        } else if (element.type === 'exclusiveGateway' || element.name?.includes('?')) {
          targetCategory = 'Lane_Review';
        } else if (element.name?.toLowerCase().includes('develop') || element.name?.toLowerCase().includes('implement')) {
          targetCategory = 'Lane_Execution';
        } else {
          const availableCategories = ['Lane_Planning', 'Lane_Execution', 'Lane_Review', 'Lane_Completion'];
          targetCategory = availableCategories[index % availableCategories.length];
        }
        
        element.lane = targetCategory;
        console.info(`Auto-categorized ${element.id} → ${swimlanes.find((l: any) => l.id === targetCategory)?.name}`);
      });
    }

    // Update swimlane element lists
    swimlanes.forEach((lane: any) => {
      lane.elements = elements.filter((el: any) => el.lane === lane.id).map((el: any) => el.id);
    });

    const finalCounts = swimlanes.map((lane: any) => {
      const count = elements.filter((el: any) => el.lane === lane.id).length;
      return `${lane.name}: ${count} elements`;
    });
    console.info('Categorization complete:', finalCounts.join(', '));

    return { ...definitions, elements, flows, swimlanes };
  }, []);

  // Convert JSON to BPMN XML
  const convertJsonToBpmnXml = useCallback((jsonData: any): string => {
    const validatedData = validateAndCategorizeBpmn(jsonData);
    const elements = validatedData.elements || [];
    const flows = validatedData.flows || [];

    // Helper function to escape XML attributes
    const escapeXml = (text: string): string => {
      return text.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&apos;');
    };

    let bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">`;

    elements.forEach((element: any) => {
      const elementId = escapeXml(element.id || '');
      const elementName = escapeXml(element.name || '');
      
      switch (element.type) {
        case 'startEvent':
          bpmnXml += `\n    <bpmn2:startEvent id="${elementId}" name="${elementName}" />`;
          break;
        case 'endEvent':
          bpmnXml += `\n    <bpmn2:endEvent id="${elementId}" name="${elementName}" />`;
          break;
        case 'task':
        case 'userTask':
        case 'serviceTask':
          bpmnXml += `\n    <bpmn2:task id="${elementId}" name="${elementName}" />`;
          break;
        case 'exclusiveGateway':
          bpmnXml += `\n    <bpmn2:exclusiveGateway id="${elementId}" name="${elementName}" />`;
          break;
        case 'parallelGateway':
          bpmnXml += `\n    <bpmn2:parallelGateway id="${elementId}" name="${elementName}" />`;
          break;
        case 'intermediateCatchEvent':
        case 'intermediateThrowEvent':
          bpmnXml += `\n    <bpmn2:intermediateCatchEvent id="${elementId}" name="${elementName}" />`;
          break;
        default:
          bpmnXml += `\n    <bpmn2:task id="${elementId}" name="${elementName}" />`;
      }
    });

    flows.forEach((flow: any) => {
      const flowId = escapeXml(flow.id || '');
      const sourceRef = escapeXml(flow.sourceRef || '');
      const targetRef = escapeXml(flow.targetRef || '');
      const flowName = escapeXml(flow.name || '');
      
      bpmnXml += `\n    <bpmn2:sequenceFlow id="${flowId}" sourceRef="${sourceRef}" targetRef="${targetRef}" name="${flowName}" />`;
    });

    bpmnXml += `\n  </bpmn2:process>`;

    // Add diagram layout information
    bpmnXml += `\n  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">`;

    // Add shape positions for elements
    elements.forEach((element: any, index: number) => {
      const x = 100 + (index * 200);
      const y = 150;
      let width = 100;
      let height = 80;

      // Adjust dimensions based on element type
      if (element.type === 'startEvent' || element.type === 'endEvent') {
        width = 36;
        height = 36;
      } else if (element.type.includes('Gateway')) {
        width = 50;
        height = 50;
      }

      bpmnXml += `\n      <bpmndi:BPMNShape id="Shape_${escapeXml(element.id)}" bpmnElement="${escapeXml(element.id)}">
        <dc:Bounds height="${height}" width="${width}" x="${x}" y="${y}" />
      </bpmndi:BPMNShape>`;
    });

    // Add flow connections
    flows.forEach((flow: any) => {
      const sourceIndex = elements.findIndex((el: any) => el.id === flow.sourceRef);
      const targetIndex = elements.findIndex((el: any) => el.id === flow.targetRef);
      
      if (sourceIndex >= 0 && targetIndex >= 0) {
        const sourceX = 100 + (sourceIndex * 200) + 50;
        const sourceY = 150 + 40;
        const targetX = 100 + (targetIndex * 200);
        const targetY = 150 + 40;

        bpmnXml += `\n      <bpmndi:BPMNEdge id="Edge_${escapeXml(flow.id)}" bpmnElement="${escapeXml(flow.id)}">
        <di:waypoint x="${sourceX}" y="${sourceY}" />
        <di:waypoint x="${targetX}" y="${targetY}" />
      </bpmndi:BPMNEdge>`;
      }
    });

    bpmnXml += `\n    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

    console.info('Generated BPMN XML with proper categorization and layout');
    return bpmnXml;
  }, [validateAndCategorizeBpmn]);

  // Load from localStorage
  const loadFromStorage = useCallback(async () => {
    if (!modelerRef.current) return;

    const aiDiagram = localStorage.getItem(STORAGE_KEYS.CURRENT_DIAGRAM);
    if (aiDiagram) {
      try {
        const jsonData = JSON.parse(aiDiagram);
        const bpmnXml = convertJsonToBpmnXml(jsonData);
        
        // Validate XML before importing
        if (!bpmnXml || bpmnXml.length < 100) {
          throw new Error('Generated BPMN XML is invalid or too short');
        }
        
        const result = await modelerRef.current.importXML(bpmnXml);
        
        // Check for import warnings
        if (result.warnings && result.warnings.length > 0) {
          console.warn('BPMN import warnings:', result.warnings);
          showNotification(`Diagram loaded with ${result.warnings.length} warnings`, 'warning');
        } else {
          showNotification('AI-generated diagram loaded successfully', 'success');
        }
        
        setStatus('AI Loaded');
        updateJsonView();
        
        setTimeout(() => {
          if (modelerRef.current) {
            modelerRef.current.get('canvas').zoom('fit-viewport');
          }
        }, 300);
        
        localStorage.removeItem(STORAGE_KEYS.CURRENT_DIAGRAM);
        return;
      } catch (error) {
        console.error('Error loading AI diagram:', error);
        
        // Provide more specific error messages
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('unparsable content')) {
          showNotification('BPMN diagram has formatting issues - loading default diagram', 'warning');
        } else if (errorMessage.includes('XML')) {
          showNotification('Invalid XML format in generated diagram', 'error');
        } else {
          showNotification('Failed to load AI-generated diagram', 'warning');
        }
        
        // Clear the problematic diagram and load default
        localStorage.removeItem(STORAGE_KEYS.CURRENT_DIAGRAM);
      }
    }

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

  // Initialize BPMN modeler
  const initializeModeler = useCallback(async () => {
    if (!containerRef.current) return;
    if (!window.BpmnJS) {
      console.warn('BpmnJS not loaded yet');
      return;
    }

    try {
      const modeler = new window.BpmnJS({
        container: containerRef.current,
        keyboard: { bindTo: document }
      });

      modelerRef.current = modeler;
      await modeler.importXML(DEFAULT_BPMN_DIAGRAM);

      modeler.on('selection.changed', (event: any) => {
        try {
          if (!event?.newSelection) {
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

              try {
                if (businessObject.documentation?.[0]?.text) {
                  elementData.documentation = businessObject.documentation[0].text;
                }
              } catch (docError) {
                // Documentation extraction failed
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

      loadFromStorage();
      updateJsonView();
      setIsLoading(false);
      setStatus('Ready');
      
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
  }, [showNotification, updateJsonView, loadFromStorage]);

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
      a.download = 'bpmn-diagram.bpmn';
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
  const importDiagram = useCallback(async (xml: string) => {
    if (!modelerRef.current) return;

    try {
      await modelerRef.current.importXML(xml);
      showNotification('Diagram imported successfully', 'success');
      setStatus('Imported');
      updateJsonView();
    } catch (error) {
      console.error('Error importing diagram:', error);
      showNotification('Failed to import diagram', 'error');
    }
  }, [showNotification, updateJsonView]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas');
    canvas.zoom(canvas.zoom() + 0.1);
  }, []);

  const zoomOut = useCallback(() => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas');
    canvas.zoom(canvas.zoom() - 0.1);
  }, []);

  const zoomFit = useCallback(() => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas');
    canvas.zoom('fit-viewport');
  }, []);

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

        modeling.updateProperties(element, updateProps);
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

  // Handle element selection from sidebar
  const handleElementSelect = useCallback((elementType: string) => {
    if (!modelerRef.current) return;

    try {
      const create = modelerRef.current.get('create');
      const elementFactory = modelerRef.current.get('elementFactory');
      const selection = modelerRef.current.get('selection');

      switch (elementType) {
        case 'create.start-event':
          const startEvent = elementFactory.createShape({ type: 'bpmn:StartEvent' });
          create.start(null, startEvent);
          showNotification('Start Event tool activated', 'success', 2000);
          break;

        case 'create.end-event':
          const endEvent = elementFactory.createShape({ type: 'bpmn:EndEvent' });
          create.start(null, endEvent);
          showNotification('End Event tool activated', 'success', 2000);
          break;

        case 'create.task':
          const task = elementFactory.createShape({ type: 'bpmn:Task' });
          create.start(null, task);
          showNotification('Task tool activated', 'success', 2000);
          break;

        case 'create.exclusive-gateway':
          const gateway = elementFactory.createShape({ type: 'bpmn:ExclusiveGateway' });
          create.start(null, gateway);
          showNotification('Gateway tool activated', 'success', 2000);
          break;

        default:
          showNotification('Tool not available', 'warning');
      }
    } catch (error) {
      console.error('Error selecting element:', error);
      showNotification('Tool activation failed', 'error');
    }
  }, [showNotification]);

  // Connect elements
  const connectElements = useCallback(() => {
    if (!modelerRef.current) return;

    try {
      const globalConnect = modelerRef.current.get('globalConnect');
      globalConnect.toggle();
      showNotification('Connection tool activated', 'success', 3000);
    } catch (error) {
      console.error('Error activating connection tool:', error);
      showNotification('Failed to activate connection tool', 'error');
    }
  }, [showNotification]);

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

      const copyId = `${sourceElement.businessObject.$type.split(':')[1]}_${generateId()}`;
      const copyName = sourceElement.businessObject.name ? `${sourceElement.businessObject.name} (Copy)` : '';
      
      const copyBusinessObject = bpmnFactory.create(sourceElement.businessObject.$type, {
        id: copyId,
        name: copyName
      });

      const newElement = modeling.createShape(
        { type: sourceElement.type, businessObject: copyBusinessObject },
        { x: sourceElement.x + 180, y: sourceElement.y + 80 },
        sourceElement.parent
      );

      const selection = modelerRef.current.get('selection');
      selection.select(newElement);
      
      showNotification('Element copied successfully', 'success');
      updateJsonView();
    } catch (error) {
      console.error('Error copying element:', error);
      showNotification('Failed to copy element', 'error');
    }
  }, [selectedElement, showNotification, updateJsonView]);

  // Activate connection mode
  const activateConnectionMode = useCallback(() => {
    if (!modelerRef.current) return;

    try {
      const globalConnect = modelerRef.current.get('globalConnect');
      globalConnect.toggle();
      showNotification('Connection mode activated', 'success', 4000);
    } catch (error) {
      console.error('Error activating connection mode:', error);
      showNotification('Failed to activate connection mode', 'error');
    }
  }, [showNotification]);

  // Create connection
  const createConnection = useCallback((direction: 'right' | 'down' | 'up' | 'left') => {
    activateConnectionMode();
  }, [activateConnectionMode]);

  // Create element
  const createElement = useCallback((elementType: string) => {
    handleElementSelect(elementType);
  }, [handleElementSelect]);

  // Import from JSON
  const importFromJson = useCallback(async (jsonData: any) => {
    if (!modelerRef.current) return;

    try {
      const xml = convertJsonToBpmnXml(jsonData);
      await modelerRef.current.importXML(xml);
      showNotification('Diagram imported from AI plan', 'success');
      setStatus('AI Generated');
      updateJsonView();
    } catch (error) {
      console.error('Error importing from JSON:', error);
      showNotification('Failed to import diagram', 'error');
    }
  }, [showNotification, updateJsonView, convertJsonToBpmnXml]);

  // Initialize modeler when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeModeler();
    }, 100);

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
    createConnection,
    createElement,
    deleteSelectedElement,
    copySelectedElement,
    activateConnectionMode,
  };
}
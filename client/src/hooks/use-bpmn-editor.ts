import { useState, useRef, useCallback, useEffect } from 'react';
import { STORAGE_KEYS, generateId } from '@/lib/bpmn-utils';

interface ElementProperties {
  id: string;
  name: string;
  type: string;
  documentation?: string;
  properties?: Record<string, any>;
}

interface NotificationData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number;
}

declare global {
  interface Window {
    BpmnJS: any;
    BpmnModeler: any;
  }
}

export function useBpmnEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);
  const [selectedElement, setSelectedElement] = useState<ElementProperties | null>(null);
  const [diagramXml, setDiagramXml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [status, setStatus] = useState<string>('Initializing...');
  const [isModified, setIsModified] = useState(false);

  // Enhanced notification system
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'warning', duration = 4000) => {
    const notification: NotificationData = {
      id: generateId(),
      message,
      type,
      duration
    };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev: NotificationData[]) => prev.filter(n => n.id !== notification.id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Initialize BPMN modeler with proper drag configuration
  const initializeModeler = useCallback(async () => {
    if (!containerRef.current || !window.BpmnJS) {
      return;
    }

    try {
      setIsLoading(true);
      setStatus('Loading BPMN editor...');

      // Create modeler with minimal configuration for maximum compatibility
      const modeler = new window.BpmnJS({
        container: containerRef.current,
        width: '100%',
        height: '100%'
      });

      modelerRef.current = modeler;

      // Wait for modeler to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Configure modeler for editing after initialization
      try {
        const palette = modeler.get('palette');
        const contextPad = modeler.get('contextPad');
        const directEditing = modeler.get('directEditing');
        
        console.log('BPMN Services:', {
          palette: !!palette,
          contextPad: !!contextPad,
          directEditing: !!directEditing
        });

        if (palette) {
          palette.open();
        }
      } catch (serviceError) {
        console.log('Service configuration:', serviceError);
      }

      // Element selection handler
      modeler.on('element.click', (event: any) => {
        try {
          const element = event.element;
          if (element?.businessObject) {
            const businessObject = element.businessObject;
            const elementData: ElementProperties = {
              id: businessObject.id || generateId(),
              name: businessObject.name || element.id || 'Unnamed Element',
              type: businessObject.$type ? businessObject.$type.replace('bpmn2:', '') : element.type || 'unknown',
              documentation: businessObject.documentation?.[0]?.text || '',
              properties: businessObject.$attrs || {}
            };
            setSelectedElement(elementData);
          } else {
            setSelectedElement(null);
          }
        } catch (error) {
          console.error('Element selection error:', error);
          setSelectedElement(null);
        }
      });

      // Change tracking for auto-save
      modeler.on('commandStack.changed', async () => {
        setIsModified(true);
        setStatus('Modified');
        
        try {
          const result = await modeler.saveXML({ format: true });
          setDiagramXml(result.xml);
          
          // Auto-save with debouncing
          clearTimeout((window as any).autoSaveTimeout);
          (window as any).autoSaveTimeout = setTimeout(() => {
            localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, result.xml);
            localStorage.setItem(STORAGE_KEYS.DIAGRAM, result.xml);
            localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
            setIsModified(false);
            setStatus('Auto-saved');
          }, 1000);
          
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      });

      // Load diagram from storage
      await loadDiagramFromStorage(modeler);
      
      setIsLoading(false);
      setStatus('Ready');
      
      // Auto-fit diagram after short delay
      setTimeout(() => {
        if (modelerRef.current) {
          modelerRef.current.get('canvas').zoom('fit-viewport');
        }
      }, 300);

    } catch (error) {
      console.error('Failed to initialize BPMN editor:', error);
      showNotification('Failed to initialize BPMN editor', 'error');
      setIsLoading(false);
      setStatus('Error');
    }
  }, [showNotification]);

  // Enhanced diagram loading with better error handling
  const loadDiagramFromStorage = useCallback(async (modeler: any) => {
    // Try loading current diagram first (most recent)
    const currentDiagram = localStorage.getItem(STORAGE_KEYS.CURRENT_DIAGRAM);
    if (currentDiagram) {
      try {
        await modeler.importXML(currentDiagram);
        setDiagramXml(currentDiagram);
        showNotification('Diagram loaded successfully', 'success', 2000);
        return;
      } catch (error) {
        console.error('Failed to load current diagram:', error);
      }
    }

    // Fallback to saved diagram
    const savedDiagram = localStorage.getItem(STORAGE_KEYS.DIAGRAM);
    if (savedDiagram) {
      try {
        await modeler.importXML(savedDiagram);
        setDiagramXml(savedDiagram);
        showNotification('Diagram loaded from storage', 'success', 2000);
        return;
      } catch (error) {
        console.error('Failed to load saved diagram:', error);
      }
    }

    // Create new diagram if nothing exists
    await createNewDiagram(modeler);
  }, [showNotification]);

  // Create a new BPMN diagram
  const createNewDiagram = useCallback(async (modeler?: any) => {
    const targetModeler = modeler || modelerRef.current;
    if (!targetModeler) return;

    const newDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   id="Definitions_1"
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1" name="Start">
      <bpmn2:outgoing>SequenceFlow_1</bpmn2:outgoing>
    </bpmn2:startEvent>
    <bpmn2:task id="Task_1" name="Task">
      <bpmn2:incoming>SequenceFlow_1</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_2</bpmn2:outgoing>
    </bpmn2:task>
    <bpmn2:endEvent id="EndEvent_1" name="End">
      <bpmn2:incoming>SequenceFlow_2</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="SequenceFlow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn2:sequenceFlow id="SequenceFlow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="158" y="145" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="392" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="400" y="145" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="SequenceFlow_1_di" bpmnElement="SequenceFlow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="SequenceFlow_2_di" bpmnElement="SequenceFlow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="392" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

    try {
      await targetModeler.importXML(newDiagram);
      setDiagramXml(newDiagram);
      setSelectedElement(null);
      setIsModified(false);
      setStatus('New diagram created');
      showNotification('New diagram created', 'success', 2000);
    } catch (error) {
      console.error('Failed to create new diagram:', error);
      showNotification('Failed to create new diagram', 'error');
    }
  }, [showNotification]);

  // Save diagram
  const saveDiagram = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      const result = await modelerRef.current.saveXML({ format: true });
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, result.xml);
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, result.xml);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
      setDiagramXml(result.xml);
      setIsModified(false);
      setStatus('Saved');
      showNotification('Diagram saved successfully', 'success', 2000);
    } catch (error) {
      console.error('Failed to save diagram:', error);
      showNotification('Failed to save diagram', 'error');
    }
  }, [showNotification]);

  // Import diagram from XML
  const importDiagram = useCallback(async (xml: string) => {
    if (!modelerRef.current) return;

    try {
      await modelerRef.current.importXML(xml);
      setDiagramXml(xml);
      setSelectedElement(null);
      setIsModified(true);
      setStatus('Imported');
      showNotification('Diagram imported successfully', 'success', 2000);
    } catch (error) {
      console.error('Failed to import diagram:', error);
      showNotification('Failed to import diagram', 'error');
    }
  }, [showNotification]);

  // Export diagram
  const exportDiagram = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      const result = await modelerRef.current.saveXML({ format: true });
      const blob = new Blob([result.xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bpmn-diagram-${Date.now()}.bpmn`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('Diagram exported successfully', 'success', 2000);
    } catch (error) {
      console.error('Failed to export diagram:', error);
      showNotification('Failed to export diagram', 'error');
    }
  }, [showNotification]);

  // Zoom functions
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

  const zoomToFit = useCallback(() => {
    if (modelerRef.current) {
      modelerRef.current.get('canvas').zoom('fit-viewport');
    }
  }, []);

  // Update element properties
  const updateElementProperties = useCallback((properties: Partial<ElementProperties>) => {
    if (!modelerRef.current || !selectedElement) return;

    try {
      const modeling = modelerRef.current.get('modeling');
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const element = elementRegistry.get(selectedElement.id);

      if (element && modeling) {
        if (properties.name !== undefined) {
          modeling.updateProperties(element, { name: properties.name });
        }
        if (properties.documentation !== undefined) {
          modeling.updateProperties(element, { 
            documentation: [{ text: properties.documentation }] 
          });
        }

        // Update local state
        setSelectedElement(prev => prev ? { ...prev, ...properties } : null);
        setIsModified(true);
      }
    } catch (error) {
      console.error('Failed to update element properties:', error);
      showNotification('Failed to update element properties', 'error');
    }
  }, [selectedElement, showNotification]);

  // Initialize modeler when container is ready
  useEffect(() => {
    if (containerRef.current && window.BpmnJS) {
      initializeModeler();
    }
  }, [initializeModeler]);

  return {
    containerRef,
    selectedElement,
    diagramXml,
    isLoading,
    isModified,
    notifications,
    status,
    showNotification,
    removeNotification,
    createNewDiagram,
    saveDiagram,
    importDiagram,
    exportDiagram,
    zoomIn,
    zoomOut,
    zoomToFit,
    updateElementProperties,
  };
}
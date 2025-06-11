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

  // Initialize BPMN modeler with enhanced configuration
  const initializeModeler = useCallback(async () => {
    if (!containerRef.current || !window.BpmnJS) return;

    try {
      setIsLoading(true);
      setStatus('Loading BPMN editor...');

      // Create modeler with enhanced configuration for editing capabilities
      const modeler = new window.BpmnJS({
        container: containerRef.current,
        keyboard: {
          bindTo: document
        },
        additionalModules: [],
        moddleExtensions: {},
        height: '100%',
        width: '100%'
      });

      modelerRef.current = modeler;

      // Verify and configure editing capabilities
      try {
        const palette = modeler.get('palette');
        const move = modeler.get('move');
        const dragging = modeler.get('dragging');
        const modeling = modeler.get('modeling');
        
        console.log('🎯 BPMN Editor Services Check:', {
          palette: !!palette,
          move: !!move,
          dragging: !!dragging,
          modeling: !!modeling,
          paletteOpen: palette ? 'opening...' : 'unavailable'
        });
        
        if (palette) {
          palette.open();
        }
        
        // Configure interaction behavior to prioritize element dragging
        if (dragging && move) {
          console.log('✅ Drag services available');
          
          // Configure canvas to prevent panning when clicking on elements
          const canvas = modeler.get('canvas');
          const eventBus = modeler.get('eventBus');
          
          // Configure drag behavior to override canvas interactions
          const zoomScroll = modeler.get('zoomScroll');
          if (zoomScroll) {
            // Disable zoom scroll to prevent interference
            zoomScroll.toggle(false);
          }
          
          // Override element interaction to prevent canvas panning
          eventBus.on('element.mousedown', (event: any) => {
            if (event.element && event.element.type !== 'bpmn:Process' && event.element.type !== 'label') {
              console.log('Element mousedown detected:', event.element.id);
              // Mark this as an element interaction, not canvas interaction
              event.stopPropagation = true;
            }
          });
          
          // Debug drag events
          eventBus.on('drag.init', (event: any) => {
            console.log('Drag initialized for:', event.context?.shape?.id || 'unknown');
          });
          
          eventBus.on('drag.start', (event: any) => {
            console.log('Drag started for:', event.context?.shape?.id || 'unknown');
          });
          
          // Enable direct manipulation mode
          eventBus.on('canvas.init', () => {
            const directEditing = modeler.get('directEditing');
            console.log('Canvas initialized, direct editing:', !!directEditing);
          });
          
        } else {
          console.log('❌ Missing drag services');
        }
        
      } catch (error) {
        console.error('Error configuring editor services:', error);
      }

      // Enhanced element selection handler
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

      // Enhanced change tracking with auto-save (single handler)
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

  // Create new diagram with modern template
  const createNewDiagram = useCallback(async (modeler?: any) => {
    const targetModeler = modeler || modelerRef.current;
    if (!targetModeler) return;

    const newDiagramXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                   xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                   id="Definitions_${generateId()}" 
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_${generateId()}" isExecutable="true">
    <bpmn2:startEvent id="StartEvent_${generateId()}" name="Start">
      <bpmn2:outgoing>Flow_${generateId()}</bpmn2:outgoing>
    </bpmn2:startEvent>
    <bpmn2:sequenceFlow id="Flow_${generateId()}" sourceRef="StartEvent_${generateId()}" targetRef="Activity_${generateId()}" />
    <bpmn2:userTask id="Activity_${generateId()}" name="Sample Task">
      <bpmn2:incoming>Flow_${generateId()}</bpmn2:incoming>
      <bpmn2:outgoing>Flow_${generateId()}</bpmn2:outgoing>
    </bpmn2:userTask>
    <bpmn2:sequenceFlow id="Flow_${generateId()}" sourceRef="Activity_${generateId()}" targetRef="EndEvent_${generateId()}" />
    <bpmn2:endEvent id="EndEvent_${generateId()}" name="End">
      <bpmn2:incoming>Flow_${generateId()}</bpmn2:incoming>
    </bpmn2:endEvent>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_${generateId()}">
    <bpmndi:BPMNPlane id="BPMNPlane_${generateId()}" bpmnElement="Process_${generateId()}">
      <bpmndi:BPMNShape id="StartEvent_${generateId()}_di" bpmnElement="StartEvent_${generateId()}">
        <dc:Bounds x="179" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_${generateId()}_di" bpmnElement="Activity_${generateId()}">
        <dc:Bounds x="270" y="77" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_${generateId()}_di" bpmnElement="EndEvent_${generateId()}">
        <dc:Bounds x="432" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_${generateId()}_di" bpmnElement="Flow_${generateId()}">
        <di:waypoint x="215" y="117" />
        <di:waypoint x="270" y="117" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_${generateId()}_di" bpmnElement="Flow_${generateId()}">
        <di:waypoint x="370" y="117" />
        <di:waypoint x="432" y="117" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

    try {
      await targetModeler.importXML(newDiagramXml);
      setDiagramXml(newDiagramXml);
      showNotification('New diagram created', 'success');
      setStatus('Ready');
    } catch (error) {
      console.error('Failed to create new diagram:', error);
      showNotification('Failed to create new diagram', 'error');
    }
  }, [showNotification]);

  // Enhanced save functionality
  const saveDiagram = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      const result = await modelerRef.current.saveXML({ format: true });
      
      setDiagramXml(result.xml);
      localStorage.setItem(STORAGE_KEYS.DIAGRAM, result.xml);
      localStorage.setItem(STORAGE_KEYS.CURRENT_DIAGRAM, result.xml);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
      
      setIsModified(false);
      setStatus('Saved');
      showNotification('Diagram saved successfully', 'success');
    } catch (error) {
      console.error('Save failed:', error);
      showNotification('Failed to save diagram', 'error');
    }
  }, [showNotification]);

  // Import diagram from XML
  const importDiagram = useCallback(async (xml: string) => {
    if (!modelerRef.current) return;

    try {
      await modelerRef.current.importXML(xml);
      setDiagramXml(xml);
      showNotification('Diagram imported successfully', 'success');
      setStatus('Imported');
      
      // Auto-fit after import
      setTimeout(() => {
        if (modelerRef.current) {
          modelerRef.current.get('canvas').zoom('fit-viewport');
        }
      }, 300);
    } catch (error) {
      console.error('Import failed:', error);
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
      link.download = `bpmn-diagram-${new Date().toISOString().slice(0, 10)}.bpmn`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('Diagram exported successfully', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to export diagram', 'error');
    }
  }, [showNotification]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    if (modelerRef.current) {
      const zoomScroll = modelerRef.current.get('zoomScroll');
      zoomScroll.zoom(1, { x: 400, y: 300 });
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (modelerRef.current) {
      const zoomScroll = modelerRef.current.get('zoomScroll');
      zoomScroll.zoom(-1, { x: 400, y: 300 });
    }
  }, []);

  const zoomToFit = useCallback(() => {
    if (modelerRef.current) {
      modelerRef.current.get('canvas').zoom('fit-viewport');
    }
  }, []);

  // Element management
  const updateElementProperties = useCallback(async (properties: Partial<ElementProperties>) => {
    if (!modelerRef.current || !selectedElement) return;

    try {
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const modeling = modelerRef.current.get('modeling');
      const element = elementRegistry.get(selectedElement.id);
      
      if (element) {
        const updates: any = {};
        if (properties.name !== undefined) {
          updates.name = properties.name;
        }
        
        modeling.updateProperties(element, updates);
        setSelectedElement(prev => prev ? { ...prev, ...properties } : null);
        showNotification('Element updated successfully', 'success', 2000);
      }
    } catch (error) {
      console.error('Failed to update element:', error);
      showNotification('Failed to update element', 'error');
    }
  }, [selectedElement, showNotification]);

  // Initialize on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeModeler();
    }, 100);

    return () => {
      clearTimeout(timer);
      if ((window as any).autoSaveTimeout) {
        clearTimeout((window as any).autoSaveTimeout);
      }
    };
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
    createNewDiagram: () => createNewDiagram(),
    saveDiagram,
    importDiagram,
    exportDiagram,
    zoomIn,
    zoomOut,
    zoomToFit,
    updateElementProperties
  };
}
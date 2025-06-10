export const DEFAULT_BPMN_DIAGRAM = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

export const STORAGE_KEYS = {
  DIAGRAM: 'bpmn-diagram',
  TIMESTAMP: 'bpmn-diagram-timestamp',
  CURRENT_DIAGRAM: 'bpmn-current-diagram',
  PROJECT_PLAN: 'bpmn-project-plan',
  PROJECT_DESCRIPTION: 'bpmn-project-description',
  USER_JOURNEY_FLOWS: 'bpmn-user-journey-flows',
  PERSONA_BPMN_FLOWS: 'bpmn-persona-flows',
  PERSONA_PROMPTS: 'bpmn-persona-prompts',
  EXTRACTED_STAKEHOLDERS: 'bpmn-extracted-stakeholders',
  PERSONA_FLOW_TYPES: 'bpmn-persona-flow-types',
  GENERATED_BPMN_XML: 'bpmn-generated-xml',
} as const;

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function downloadFile(content: string, filename: string, type: string = 'application/xml'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function xmlToJson(xml: string): string {
  try {
    // This is a simplified conversion for display purposes
    // In a real implementation, you'd want a proper XML to JSON parser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    
    const processElements = xmlDoc.getElementsByTagName('bpmn2:process')[0];
    const elements: any[] = [];
    
    if (processElements) {
      Array.from(processElements.children).forEach((child) => {
        elements.push({
          type: child.tagName.replace('bpmn2:', ''),
          id: child.getAttribute('id'),
          name: child.getAttribute('name') || ''
        });
      });
    }
    
    return JSON.stringify({
      definitions: {
        id: xmlDoc.documentElement.getAttribute('id') || 'process_001',
        name: "Current Process",
        lastModified: new Date().toISOString(),
        elements: elements
      }
    }, null, 2);
  } catch (error) {
    console.error('Error converting XML to JSON:', error);
    return JSON.stringify({
      error: 'Failed to parse BPMN XML',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, null, 2);
  }
}

export function validateBpmnFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    if (!file.name.endsWith('.bpmn') && !file.name.endsWith('.xml') && !file.name.endsWith('.json')) {
      resolve(false);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (file.name.endsWith('.json')) {
          JSON.parse(content);
        } else {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, 'text/xml');
          const errorNode = xmlDoc.querySelector('parsererror');
          resolve(!errorNode);
        }
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
}

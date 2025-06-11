// Deterministic BPMN 2.0 XML Generator
// Generates valid BPMN XML from structured data without AI

interface BpmnData {
  processName: string;
  processDescription: string;
  participants: string[];
  trigger: string;
  activities: string[];
  decisionPoints: string[];
  endEvent: string;
  additionalElements: string[];
}

export function generateBpmnXmlFromStructuredData(data: BpmnData): string {
  const timestamp = Date.now();
  const processId = `Process_${sanitizeId(data.processName)}_${timestamp}`;
  const collaborationId = `Collaboration_${timestamp}`;
  
  // Generate participants
  const participants = data.participants.map((participant, index) => {
    const participantId = `Participant_${index + 1}_${timestamp}`;
    return `    <bpmn2:participant id="${participantId}" name="${escapeXml(participant)}" processRef="${processId}" />`;
  }).join('\n');

  // Generate start event
  const startEvent = `    <bpmn2:startEvent id="StartEvent_1_${timestamp}" name="${escapeXml(data.trigger)}" />`;

  // Generate user tasks from activities
  const tasks = data.activities.map((activity, index) => {
    const taskId = `Task_${index + 1}_${timestamp}`;
    return `    <bpmn2:userTask id="${taskId}" name="${escapeXml(activity)}" />`;
  }).join('\n');

  // Generate gateways from decision points
  const gateways = data.decisionPoints.map((decision, index) => {
    const gatewayId = `Gateway_${index + 1}_${timestamp}`;
    return `    <bpmn2:exclusiveGateway id="${gatewayId}" name="${escapeXml(decision)}" />`;
  }).join('\n');

  // Generate end event
  const endEvent = `    <bpmn2:endEvent id="EndEvent_1_${timestamp}" name="${escapeXml(data.endEvent)}" />`;

  // Generate sequence flows
  const flows = generateSequenceFlows(data.activities.length, data.decisionPoints.length, timestamp);

  // Generate visual layout
  const { shapes, edges } = generateVisualLayout(data.participants.length, data.activities.length, data.decisionPoints.length, timestamp);

  // Construct complete BPMN XML
  const bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                   id="Definitions_1" 
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:collaboration id="${collaborationId}">
${participants}
  </bpmn2:collaboration>
  <bpmn2:process id="${processId}" isExecutable="true">
${startEvent}
${tasks}
${gateways}
${endEvent}
${flows}
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${collaborationId}">
${shapes}
${edges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

  return bpmnXml;
}

function sanitizeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_');
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateSequenceFlows(taskCount: number, gatewayCount: number, timestamp: number): string {
  const flows: string[] = [];
  
  // Flow from start to first task
  flows.push(`    <bpmn2:sequenceFlow id="Flow_start_1_${timestamp}" sourceRef="StartEvent_1_${timestamp}" targetRef="Task_1_${timestamp}" />`);
  
  // Flows between tasks
  for (let i = 1; i < taskCount; i++) {
    flows.push(`    <bpmn2:sequenceFlow id="Flow_${i}_${i + 1}_${timestamp}" sourceRef="Task_${i}_${timestamp}" targetRef="Task_${i + 1}_${timestamp}" />`);
  }
  
  // Flow from last task to end
  flows.push(`    <bpmn2:sequenceFlow id="Flow_${taskCount}_end_${timestamp}" sourceRef="Task_${taskCount}_${timestamp}" targetRef="EndEvent_1_${timestamp}" />`);
  
  return flows.join('\n');
}

function generateVisualLayout(participantCount: number, taskCount: number, gatewayCount: number): { shapes: string; edges: string } {
  const diagramWidth = 300 + (taskCount * 150);
  
  const shapes: string[] = [];
  const edges: string[] = [];
  
  // Participant pool
  shapes.push(`      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">`);
  shapes.push(`        <dc:Bounds x="80" y="80" width="${diagramWidth}" height="300" />`);
  shapes.push(`        <bpmndi:BPMNLabel />`);
  shapes.push(`      </bpmndi:BPMNShape>`);
  
  // Start event
  shapes.push(`      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">`);
  shapes.push(`        <dc:Bounds x="130" y="200" width="36" height="36" />`);
  shapes.push(`        <bpmndi:BPMNLabel />`);
  shapes.push(`      </bpmndi:BPMNShape>`);
  
  // Tasks
  for (let i = 1; i <= taskCount; i++) {
    const x = 200 + ((i - 1) * 150);
    shapes.push(`      <bpmndi:BPMNShape id="Task_${i}_di" bpmnElement="Task_${i}">`);
    shapes.push(`        <dc:Bounds x="${x}" y="180" width="100" height="80" />`);
    shapes.push(`        <bpmndi:BPMNLabel />`);
    shapes.push(`      </bpmndi:BPMNShape>`);
  }
  
  // End event
  const endX = 200 + (taskCount * 150) + 50;
  shapes.push(`      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">`);
  shapes.push(`        <dc:Bounds x="${endX}" y="200" width="36" height="36" />`);
  shapes.push(`        <bpmndi:BPMNLabel />`);
  shapes.push(`      </bpmndi:BPMNShape>`);
  
  // Edge from start to first task
  edges.push(`      <bpmndi:BPMNEdge id="Flow_start_1_di" bpmnElement="Flow_start_1">`);
  edges.push(`        <di:waypoint x="166" y="218" />`);
  edges.push(`        <di:waypoint x="200" y="220" />`);
  edges.push(`      </bpmndi:BPMNEdge>`);
  
  // Edges between tasks
  for (let i = 1; i < taskCount; i++) {
    const x1 = 300 + ((i - 1) * 150);
    const x2 = 200 + (i * 150);
    edges.push(`      <bpmndi:BPMNEdge id="Flow_${i}_${i + 1}_di" bpmnElement="Flow_${i}_${i + 1}">`);
    edges.push(`        <di:waypoint x="${x1}" y="220" />`);
    edges.push(`        <di:waypoint x="${x2}" y="220" />`);
    edges.push(`      </bpmndi:BPMNEdge>`);
  }
  
  // Edge from last task to end
  const lastTaskX = 300 + ((taskCount - 1) * 150);
  edges.push(`      <bpmndi:BPMNEdge id="Flow_${taskCount}_end_di" bpmnElement="Flow_${taskCount}_end">`);
  edges.push(`        <di:waypoint x="${lastTaskX}" y="220" />`);
  edges.push(`        <di:waypoint x="${endX}" y="218" />`);
  edges.push(`      </bpmndi:BPMNEdge>`);
  
  return {
    shapes: shapes.join('\n'),
    edges: edges.join('\n')
  };
}
interface StructuredBpmnData {
  processName: string;
  processDescription: string;
  participants: string[];
  trigger: string;
  activities: string[];
  decisionPoints: string[];
  endEvent: string;
  additionalElements: string[];
}

export function generateStructuredBpmn(data: StructuredBpmnData): string {
  const timestamp = Date.now();
  
  // Clean data for XML IDs
  const cleanId = (text: string): string => 
    text.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').substring(0, 50);

  // Generate unique IDs
  const processId = `Process_${timestamp}`;
  const collaborationId = `Collaboration_${timestamp}`;
  
  // Create participant elements
  const participantElements = data.participants.map((participant, index) => {
    const participantId = `Participant_${cleanId(participant)}_${timestamp}`;
    return `    <bpmn2:participant id="${participantId}" name="${participant.replace(/"/g, '&quot;')}" processRef="${processId}" />`;
  }).join('\n');

  // Create activity elements
  const activityElements = data.activities.map((activity, index) => {
    const taskId = `Task_${index + 1}_${timestamp}`;
    return `    <bpmn2:userTask id="${taskId}" name="${activity.replace(/"/g, '&quot;')}" />`;
  }).join('\n');

  // Create gateway elements
  const gatewayElements = data.decisionPoints.map((decision, index) => {
    const gatewayId = `Gateway_${index + 1}_${timestamp}`;
    const shortName = decision.substring(0, 50).replace(/"/g, '&quot;');
    return `    <bpmn2:exclusiveGateway id="${gatewayId}" name="${shortName}" />`;
  }).join('\n');

  // Create sequence flows
  const flows: string[] = [];
  const startEventId = `StartEvent_1_${timestamp}`;
  const endEventId = `EndEvent_1_${timestamp}`;

  // Connect start to first activity or gateway
  if (data.activities.length > 0) {
    flows.push(`    <bpmn2:sequenceFlow id="Flow_start_${timestamp}" sourceRef="${startEventId}" targetRef="Task_1_${timestamp}" />`);
    
    // Connect activities sequentially
    for (let i = 0; i < data.activities.length - 1; i++) {
      flows.push(`    <bpmn2:sequenceFlow id="Flow_${i + 1}_${i + 2}_${timestamp}" sourceRef="Task_${i + 1}_${timestamp}" targetRef="Task_${i + 2}_${timestamp}" />`);
    }
    
    // Connect last activity to end or gateway
    if (data.decisionPoints.length > 0) {
      flows.push(`    <bpmn2:sequenceFlow id="Flow_task_gateway_${timestamp}" sourceRef="Task_${data.activities.length}_${timestamp}" targetRef="Gateway_1_${timestamp}" />`);
      flows.push(`    <bpmn2:sequenceFlow id="Flow_gateway_end_${timestamp}" sourceRef="Gateway_1_${timestamp}" targetRef="${endEventId}" />`);
    } else {
      flows.push(`    <bpmn2:sequenceFlow id="Flow_task_end_${timestamp}" sourceRef="Task_${data.activities.length}_${timestamp}" targetRef="${endEventId}" />`);
    }
  } else {
    flows.push(`    <bpmn2:sequenceFlow id="Flow_start_end_${timestamp}" sourceRef="${startEventId}" targetRef="${endEventId}" />`);
  }

  // Create visual elements
  const diagramWidth = Math.max(600, 200 + data.activities.length * 150 + data.decisionPoints.length * 100);
  
  // Create shape elements
  const participantShape = data.participants.length > 0 ? 
    `      <bpmndi:BPMNShape id="Participant_${cleanId(data.participants[0])}_${timestamp}_di" bpmnElement="Participant_${cleanId(data.participants[0])}_${timestamp}" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="${diagramWidth}" height="300" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>` : '';

  const activityShapes = data.activities.map((activity, index) => {
    const x = 250 + index * 180;
    return `      <bpmndi:BPMNShape id="Task_${index + 1}_${timestamp}_di" bpmnElement="Task_${index + 1}_${timestamp}">
        <dc:Bounds x="${x}" y="190" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
  }).join('\n');

  const gatewayShapes = data.decisionPoints.map((decision, index) => {
    const x = 250 + data.activities.length * 180 + index * 100;
    return `      <bpmndi:BPMNShape id="Gateway_${index + 1}_${timestamp}_di" bpmnElement="Gateway_${index + 1}_${timestamp}">
        <dc:Bounds x="${x}" y="205" width="50" height="50" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
  }).join('\n');

  // Create edge elements
  const flowEdges: string[] = [];
  
  if (data.activities.length > 0) {
    // Start to first task
    flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_start_${timestamp}_di" bpmnElement="Flow_start_${timestamp}">
        <di:waypoint x="218" y="230" />
        <di:waypoint x="250" y="230" />
      </bpmndi:BPMNEdge>`);
    
    // Between activities
    for (let i = 0; i < data.activities.length - 1; i++) {
      const x1 = 350 + i * 180;
      const x2 = 250 + (i + 1) * 180;
      flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_${i + 1}_${i + 2}_${timestamp}_di" bpmnElement="Flow_${i + 1}_${i + 2}_${timestamp}">
        <di:waypoint x="${x1}" y="230" />
        <di:waypoint x="${x2}" y="230" />
      </bpmndi:BPMNEdge>`);
    }
    
    // Last activity to end/gateway
    const lastActivityX = 350 + (data.activities.length - 1) * 180;
    const endX = 250 + data.activities.length * 180 + data.decisionPoints.length * 100 + 50;
    
    if (data.decisionPoints.length > 0) {
      const gatewayX = 250 + data.activities.length * 180;
      flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_task_gateway_${timestamp}_di" bpmnElement="Flow_task_gateway_${timestamp}">
        <di:waypoint x="${lastActivityX}" y="230" />
        <di:waypoint x="${gatewayX}" y="230" />
      </bpmndi:BPMNEdge>`);
      flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_gateway_end_${timestamp}_di" bpmnElement="Flow_gateway_end_${timestamp}">
        <di:waypoint x="${gatewayX + 50}" y="230" />
        <di:waypoint x="${endX}" y="230" />
      </bpmndi:BPMNEdge>`);
    } else {
      flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_task_end_${timestamp}_di" bpmnElement="Flow_task_end_${timestamp}">
        <di:waypoint x="${lastActivityX}" y="230" />
        <di:waypoint x="${endX}" y="230" />
      </bpmndi:BPMNEdge>`);
    }
  } else {
    flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_start_end_${timestamp}_di" bpmnElement="Flow_start_end_${timestamp}">
        <di:waypoint x="218" y="230" />
        <di:waypoint x="300" y="230" />
      </bpmndi:BPMNEdge>`);
  }

  const endEventX = 250 + data.activities.length * 180 + data.decisionPoints.length * 100 + 50;

  // Generate complete BPMN 2.0 XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   id="Definitions_${timestamp}"
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:collaboration id="${collaborationId}">
${participantElements}
  </bpmn2:collaboration>
  <bpmn2:process id="${processId}" name="${data.processName.replace(/"/g, '&quot;')}" isExecutable="true">
    <bpmn2:documentation>${data.processDescription.replace(/"/g, '&quot;')}</bpmn2:documentation>
    <bpmn2:startEvent id="${startEventId}" name="${data.trigger.replace(/"/g, '&quot;')}" />
${activityElements}
${gatewayElements}
    <bpmn2:endEvent id="${endEventId}" name="${data.endEvent.replace(/"/g, '&quot;')}" />
${flows.join('\n')}
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_${timestamp}">
    <bpmndi:BPMNPlane id="BPMNPlane_${timestamp}" bpmnElement="${collaborationId}">
${participantShape}
      <bpmndi:BPMNShape id="${startEventId}_di" bpmnElement="${startEventId}">
        <dc:Bounds x="200" y="212" width="36" height="36" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
${activityShapes}
${gatewayShapes}
      <bpmndi:BPMNShape id="${endEventId}_di" bpmnElement="${endEventId}">
        <dc:Bounds x="${endEventX}" y="212" width="36" height="36" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
${flowEdges.join('\n')}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;
}

export function parseStructuredContent(flowContent: string): StructuredBpmnData {
  const sections = {
    process: flowContent.match(/✅ 1\. Process & Description\n([^✅]*)/)?.[1]?.trim() || '',
    participants: flowContent.match(/✅ 2\. Participants.*?\n((?:- .*\n?)*)/)?.[1]?.trim() || '',
    trigger: flowContent.match(/✅ 3\. Trigger.*?\n([^✅]*)/)?.[1]?.trim() || '',
    activities: flowContent.match(/✅ 4\. Activities.*?\n((?:\d+\. .*\n?)*)/)?.[1]?.trim() || '',
    decisions: flowContent.match(/✅ 5\. Decision Points.*?\n((?:- .*\n?)*)/)?.[1]?.trim() || '',
    endEvent: flowContent.match(/✅ 6\. End Event\n([^✅]*)/)?.[1]?.trim() || '',
    additional: flowContent.match(/✅ 7\. Additional Elements.*?\n((?:- .*\n?)*)/)?.[1]?.trim() || ''
  };

  // Parse participants
  const participants = sections.participants
    .split('\n')
    .map(line => line.replace(/^- /, '').trim())
    .filter(p => p.length > 0);

  // Parse activities
  const activities = sections.activities
    .split('\n')
    .map(line => line.replace(/^\d+\. /, '').trim())
    .filter(a => a.length > 0);

  // Parse decision points
  const decisionPoints = sections.decisions
    .split('\n')
    .map(line => line.replace(/^- /, '').trim())
    .filter(d => d.length > 0);

  // Parse additional elements
  const additionalElements = sections.additional
    .split('\n')
    .map(line => line.replace(/^- /, '').trim())
    .filter(e => e.length > 0);

  // Extract process name from first line of process section
  const processLines = sections.process.split('\n');
  const processName = processLines[0] || 'Business Process';
  const processDescription = processLines.slice(1).join('\n').trim() || sections.process;

  return {
    processName,
    processDescription,
    participants: participants.length > 0 ? participants : ['Process Owner'],
    trigger: sections.trigger || 'Process starts',
    activities: activities.length > 0 ? activities : ['Process activity'],
    decisionPoints,
    endEvent: sections.endEvent || 'Process completes',
    additionalElements
  };
}
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

  // Create multiple participant lanes (swimlanes)
  const participantElements = data.participants.map((participant, index) => {
    const participantId = `Participant_${cleanId(participant)}_${timestamp}`;
    return `    <bpmn2:participant id="${participantId}" name="${participant.replace(/"/g, '&quot;')}" processRef="${processId}" />`;
  }).join('\n');

  // Distribute activities and decision points across different lanes
  const elementsPerLane = Math.ceil((data.activities.length + data.decisionPoints.length) / Math.max(data.participants.length, 1));
  
  // Create activity elements
  const activityElements = data.activities.map((activity, index) => {
    const taskId = `Task_${index + 1}_${timestamp}`;
    return `    <bpmn2:userTask id="${taskId}" name="${activity.replace(/"/g, '&quot;')}" />`;
  }).join('\n');

  // Create gateway elements with proper decision flow structure
  const gatewayElements = data.decisionPoints.map((decision, index) => {
    const gatewayId = `Gateway_${index + 1}_${timestamp}`;
    const shortName = decision.substring(0, 50).replace(/"/g, '&quot;');
    return `    <bpmn2:exclusiveGateway id="${gatewayId}" name="${shortName}" />`;
  }).join('\n');

  // Create sequence flows with decision branches
  const flows: string[] = [];
  const startEventId = `StartEvent_1_${timestamp}`;
  const endEventId = `EndEvent_1_${timestamp}`;

  let currentElementIndex = 0;
  const allElements = [
    ...data.activities.map((_, i) => ({ type: 'task', id: `Task_${i + 1}_${timestamp}` })),
    ...data.decisionPoints.map((_, i) => ({ type: 'gateway', id: `Gateway_${i + 1}_${timestamp}` }))
  ];

  // Connect start event to first element
  if (allElements.length > 0) {
    flows.push(`    <bpmn2:sequenceFlow id="Flow_start_${timestamp}" sourceRef="${startEventId}" targetRef="${allElements[0].id}" />`);
    
    // Connect elements with decision branching
    for (let i = 0; i < allElements.length - 1; i++) {
      const currentElement = allElements[i];
      const nextElement = allElements[i + 1];
      
      if (currentElement.type === 'gateway') {
        // Add YES/NO branches for gateways
        flows.push(`    <bpmn2:sequenceFlow id="Flow_${i + 1}_yes_${timestamp}" name="YES" sourceRef="${currentElement.id}" targetRef="${nextElement.id}">
      <bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression">\${condition == true}</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>`);
        
        // NO branch can go to end or rejection flow
        if (i < allElements.length - 2) {
          flows.push(`    <bpmn2:sequenceFlow id="Flow_${i + 1}_no_${timestamp}" name="NO" sourceRef="${currentElement.id}" targetRef="${allElements[i + 2]?.id || endEventId}" />`);
        } else {
          flows.push(`    <bpmn2:sequenceFlow id="Flow_${i + 1}_no_${timestamp}" name="NO" sourceRef="${currentElement.id}" targetRef="${endEventId}" />`);
        }
      } else {
        // Regular flow for tasks
        flows.push(`    <bpmn2:sequenceFlow id="Flow_${i + 1}_${i + 2}_${timestamp}" sourceRef="${currentElement.id}" targetRef="${nextElement.id}" />`);
      }
    }
    
    // Connect last element to end
    const lastElement = allElements[allElements.length - 1];
    if (lastElement.type === 'gateway') {
      flows.push(`    <bpmn2:sequenceFlow id="Flow_final_yes_${timestamp}" name="YES" sourceRef="${lastElement.id}" targetRef="${endEventId}" />`);
    } else {
      flows.push(`    <bpmn2:sequenceFlow id="Flow_final_${timestamp}" sourceRef="${lastElement.id}" targetRef="${endEventId}" />`);
    }
  } else {
    flows.push(`    <bpmn2:sequenceFlow id="Flow_start_end_${timestamp}" sourceRef="${startEventId}" targetRef="${endEventId}" />`);
  }

  // Calculate layout dimensions
  const laneHeight = 120;
  const diagramWidth = Math.max(800, 300 + Math.max(data.activities.length, data.decisionPoints.length) * 150);
  const totalHeight = Math.max(300, data.participants.length * laneHeight + 100);

  // Create participant shapes (swimlanes)
  const participantShapes = data.participants.map((participant, index) => {
    const participantId = `Participant_${cleanId(participant)}_${timestamp}`;
    const y = 80 + index * laneHeight;
    return `      <bpmndi:BPMNShape id="${participantId}_di" bpmnElement="${participantId}" isHorizontal="true">
        <dc:Bounds x="160" y="${y}" width="${diagramWidth}" height="${laneHeight}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
  }).join('\n');

  // Distribute elements across lanes
  const activityShapes = data.activities.map((activity, index) => {
    const laneIndex = index % Math.max(data.participants.length, 1);
    const x = 250 + index * 150;
    const y = 100 + laneIndex * laneHeight + 20;
    return `      <bpmndi:BPMNShape id="Task_${index + 1}_${timestamp}_di" bpmnElement="Task_${index + 1}_${timestamp}">
        <dc:Bounds x="${x}" y="${y}" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
  }).join('\n');

  const gatewayShapes = data.decisionPoints.map((decision, index) => {
    const laneIndex = (index + data.activities.length) % Math.max(data.participants.length, 1);
    const x = 250 + (data.activities.length + index) * 150;
    const y = 100 + laneIndex * laneHeight + 35;
    return `      <bpmndi:BPMNShape id="Gateway_${index + 1}_${timestamp}_di" bpmnElement="Gateway_${index + 1}_${timestamp}">
        <dc:Bounds x="${x}" y="${y}" width="50" height="50" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
  }).join('\n');

  // Create edge elements with proper routing
  const flowEdges: string[] = [];
  
  if (allElements.length > 0) {
    // Start event position
    const startY = 100 + 40;
    
    // Start to first element
    const firstElementLane = 0;
    const firstElementY = 100 + firstElementLane * laneHeight + 40;
    flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_start_${timestamp}_di" bpmnElement="Flow_start_${timestamp}">
        <di:waypoint x="218" y="${startY}" />
        <di:waypoint x="250" y="${firstElementY}" />
      </bpmndi:BPMNEdge>`);
    
    // Between elements
    for (let i = 0; i < allElements.length - 1; i++) {
      const currentLane = i % Math.max(data.participants.length, 1);
      const nextLane = (i + 1) % Math.max(data.participants.length, 1);
      const x1 = 300 + i * 150;
      const x2 = 250 + (i + 1) * 150;
      const y1 = 100 + currentLane * laneHeight + 40;
      const y2 = 100 + nextLane * laneHeight + 40;
      
      if (allElements[i].type === 'gateway') {
        // YES branch
        flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_${i + 1}_yes_${timestamp}_di" bpmnElement="Flow_${i + 1}_yes_${timestamp}">
        <di:waypoint x="${x1}" y="${y1}" />
        <di:waypoint x="${x2}" y="${y2}" />
      </bpmndi:BPMNEdge>`);
        
        // NO branch (goes down or to end)
        const noTargetY = Math.min(y1 + 60, 100 + (data.participants.length - 1) * laneHeight + 40);
        flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_${i + 1}_no_${timestamp}_di" bpmnElement="Flow_${i + 1}_no_${timestamp}">
        <di:waypoint x="${x1}" y="${y1}" />
        <di:waypoint x="${x1}" y="${noTargetY}" />
        <di:waypoint x="${x2 + 100}" y="${noTargetY}" />
      </bpmndi:BPMNEdge>`);
      } else {
        flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_${i + 1}_${i + 2}_${timestamp}_di" bpmnElement="Flow_${i + 1}_${i + 2}_${timestamp}">
        <di:waypoint x="${x1}" y="${y1}" />
        <di:waypoint x="${x2}" y="${y2}" />
      </bpmndi:BPMNEdge>`);
      }
    }
  }

  const endEventX = 250 + allElements.length * 150 + 50;
  const endEventY = 100 + 40;

  // Generate complete BPMN 2.0 XML with proper namespace
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
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
${participantShapes}
      <bpmndi:BPMNShape id="${startEventId}_di" bpmnElement="${startEventId}">
        <dc:Bounds x="200" y="${endEventY - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
${activityShapes}
${gatewayShapes}
      <bpmndi:BPMNShape id="${endEventId}_di" bpmnElement="${endEventId}">
        <dc:Bounds x="${endEventX}" y="${endEventY - 18}" width="36" height="36" />
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
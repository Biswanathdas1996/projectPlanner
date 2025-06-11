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

  // Create conditional task elements for gateway branches
  const conditionalElements = data.decisionPoints.map((decision, index) => {
    const conditionalTaskId = `Task_Conditional_${index + 1}_${timestamp}`;
    const conditionName = decision.includes('?') ? 
      decision.split('?')[1].trim().substring(0, 30) : 
      `Alternative ${index + 1}`;
    return `    <bpmn2:userTask id="${conditionalTaskId}" name="${conditionName.replace(/"/g, '&quot;')}" />`;
  }).join('\n');

  // Create gateway elements
  const gatewayElements = data.decisionPoints.map((decision, index) => {
    const gatewayId = `Gateway_${index + 1}_${timestamp}`;
    const shortName = decision.substring(0, 50).replace(/"/g, '&quot;');
    return `    <bpmn2:exclusiveGateway id="${gatewayId}" name="${shortName}" />`;
  }).join('\n');

  // Create sequence flows with proper decision gateway logic
  const flows: string[] = [];
  const startEventId = `StartEvent_1_${timestamp}`;
  const endEventId = `EndEvent_1_${timestamp}`;

  if (data.activities.length === 0) {
    flows.push(`    <bpmn2:sequenceFlow id="Flow_start_end_${timestamp}" sourceRef="${startEventId}" targetRef="${endEventId}" />`);
  } else {
    // Connect start to first activity
    flows.push(`    <bpmn2:sequenceFlow id="Flow_start_${timestamp}" sourceRef="${startEventId}" targetRef="Task_1_${timestamp}" />`);
    
    // Connect activities sequentially, inserting gateways where specified
    let currentSourceId = `Task_1_${timestamp}`;
    let activityIndex = 1;
    let gatewayIndex = 0;

    for (let i = 1; i < data.activities.length; i++) {
      const taskId = `Task_${i + 1}_${timestamp}`;
      
      // Check if we should insert a gateway before this activity
      if (gatewayIndex < data.decisionPoints.length && i === Math.floor(data.activities.length / 2)) {
        const gatewayId = `Gateway_${gatewayIndex + 1}_${timestamp}`;
        const conditionalTaskId = `Task_Conditional_${gatewayIndex + 1}_${timestamp}`;
        
        // Flow to gateway
        flows.push(`    <bpmn2:sequenceFlow id="Flow_${activityIndex}_gateway_${gatewayIndex + 1}_${timestamp}" sourceRef="${currentSourceId}" targetRef="${gatewayId}" />`);
        
        // Conditional flows from gateway
        flows.push(`    <bpmn2:sequenceFlow id="Flow_gateway_${gatewayIndex + 1}_yes_${timestamp}" name="Yes" sourceRef="${gatewayId}" targetRef="${taskId}">
      <bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression">true</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>`);
        
        flows.push(`    <bpmn2:sequenceFlow id="Flow_gateway_${gatewayIndex + 1}_no_${timestamp}" name="No" sourceRef="${gatewayId}" targetRef="${conditionalTaskId}">
      <bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression">false</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>`);
        
        // Merge flows back
        flows.push(`    <bpmn2:sequenceFlow id="Flow_conditional_${gatewayIndex + 1}_merge_${timestamp}" sourceRef="${conditionalTaskId}" targetRef="${taskId}" />`);
        
        gatewayIndex++;
        currentSourceId = taskId;
      } else {
        // Regular sequential flow
        flows.push(`    <bpmn2:sequenceFlow id="Flow_${activityIndex}_${i + 1}_${timestamp}" sourceRef="${currentSourceId}" targetRef="${taskId}" />`);
        currentSourceId = taskId;
      }
      activityIndex = i + 1;
    }
    
    // Connect last activity to end
    flows.push(`    <bpmn2:sequenceFlow id="Flow_${activityIndex}_end_${timestamp}" sourceRef="${currentSourceId}" targetRef="${endEventId}" />`);
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
    const x = 250 + Math.floor(data.activities.length / 2) * 180 + index * 200;
    return `      <bpmndi:BPMNShape id="Gateway_${index + 1}_${timestamp}_di" bpmnElement="Gateway_${index + 1}_${timestamp}">
        <dc:Bounds x="${x}" y="205" width="50" height="50" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
  }).join('\n');

  const conditionalShapes = data.decisionPoints.map((decision, index) => {
    const x = 250 + Math.floor(data.activities.length / 2) * 180 + index * 200;
    const y = 320; // Below main flow
    return `      <bpmndi:BPMNShape id="Task_Conditional_${index + 1}_${timestamp}_di" bpmnElement="Task_Conditional_${index + 1}_${timestamp}">
        <dc:Bounds x="${x}" y="${y}" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
  }).join('\n');

  // Calculate end event position
  const endEventX = 250 + data.activities.length * 180 + data.decisionPoints.length * 100 + 50;

  // Create edge elements with proper gateway routing
  const flowEdges: string[] = [];
  
  if (data.activities.length === 0) {
    flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_start_end_${timestamp}_di" bpmnElement="Flow_start_end_${timestamp}">
        <di:waypoint x="218" y="230" />
        <di:waypoint x="300" y="230" />
      </bpmndi:BPMNEdge>`);
  } else {
    // Start to first activity
    flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_start_${timestamp}_di" bpmnElement="Flow_start_${timestamp}">
        <di:waypoint x="236" y="230" />
        <di:waypoint x="250" y="230" />
      </bpmndi:BPMNEdge>`);
    
    // Regular flow between activities and gateways
    let currentIndex = 1;
    let gatewayIndex = 0;
    
    for (let i = 1; i < data.activities.length; i++) {
      const currentX = 300 + (currentIndex - 1) * 180;
      const nextX = 250 + i * 180;
      
      // Check if we insert a gateway at the midpoint
      if (gatewayIndex < data.decisionPoints.length && i === Math.floor(data.activities.length / 2)) {
        const gatewayX = 250 + Math.floor(data.activities.length / 2) * 180 + gatewayIndex * 200;
        const conditionalX = gatewayX;
        const conditionalY = 360; // Below main flow
        
        // Flow to gateway
        flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_${currentIndex}_gateway_${gatewayIndex + 1}_${timestamp}_di" bpmnElement="Flow_${currentIndex}_gateway_${gatewayIndex + 1}_${timestamp}">
        <di:waypoint x="${currentX}" y="230" />
        <di:waypoint x="${gatewayX + 25}" y="230" />
      </bpmndi:BPMNEdge>`);
        
        // Yes path (straight through)
        flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_gateway_${gatewayIndex + 1}_yes_${timestamp}_di" bpmnElement="Flow_gateway_${gatewayIndex + 1}_yes_${timestamp}">
        <di:waypoint x="${gatewayX + 50}" y="230" />
        <di:waypoint x="${nextX}" y="230" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${gatewayX + 55}" y="210" width="18" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`);
        
        // No path (down to conditional task)
        flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_gateway_${gatewayIndex + 1}_no_${timestamp}_di" bpmnElement="Flow_gateway_${gatewayIndex + 1}_no_${timestamp}">
        <di:waypoint x="${gatewayX + 25}" y="255" />
        <di:waypoint x="${gatewayX + 25}" y="320" />
        <di:waypoint x="${conditionalX}" y="360" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${gatewayX + 30}" y="285" width="15" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`);
        
        // Merge back from conditional task
        flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_conditional_${gatewayIndex + 1}_merge_${timestamp}_di" bpmnElement="Flow_conditional_${gatewayIndex + 1}_merge_${timestamp}">
        <di:waypoint x="${conditionalX + 100}" y="360" />
        <di:waypoint x="${nextX + 50}" y="280" />
        <di:waypoint x="${nextX + 50}" y="270" />
      </bpmndi:BPMNEdge>`);
        
        gatewayIndex++;
      } else {
        // Regular sequential flow
        flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_${currentIndex}_${i + 1}_${timestamp}_di" bpmnElement="Flow_${currentIndex}_${i + 1}_${timestamp}">
        <di:waypoint x="${currentX}" y="230" />
        <di:waypoint x="${nextX}" y="230" />
      </bpmndi:BPMNEdge>`);
      }
      currentIndex = i + 1;
    }
    
    // Final activity to end
    const lastActivityX = 300 + (data.activities.length - 1) * 180;
    flowEdges.push(`      <bpmndi:BPMNEdge id="Flow_${data.activities.length}_end_${timestamp}_di" bpmnElement="Flow_${data.activities.length}_end_${timestamp}">
        <di:waypoint x="${lastActivityX}" y="230" />
        <di:waypoint x="${endEventX}" y="230" />
      </bpmndi:BPMNEdge>`);
  }

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
${conditionalElements}
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
${conditionalShapes}
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
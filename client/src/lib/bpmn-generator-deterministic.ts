interface FlowDetails {
  description: string;
  processDescription: string;
  participants: string[];
  trigger: string;
  activities: string[];
  decisionPoints: string[];
  endEvent: string;
  additionalElements: string[];
}

export function generateBpmnXmlDeterministic(flowDetails: FlowDetails): string {
  const timestamp = Date.now();
  const participantIds = flowDetails.participants.map((_, idx) => `Participant_${idx + 1}_${timestamp}`);
  const processIds = flowDetails.participants.map((_, idx) => `Process_${idx + 1}_${timestamp}`);
  
  // Generate unique IDs for activities
  const activityIds = flowDetails.activities.map((_, idx) => `Task_${idx + 1}_${timestamp}`);
  const startEventId = `StartEvent_1_${timestamp}`;
  const endEventId = `EndEvent_1_${timestamp}`;
  const gatewayIds = flowDetails.decisionPoints.map((_, idx) => `Gateway_${idx + 1}_${timestamp}`);
  
  // Create participants (swimlanes)
  const participantsXml = flowDetails.participants.map((participant, idx) => 
    `    <bpmn2:participant id="${participantIds[idx]}" name="${escapeXml(participant)}" processRef="${processIds[idx]}" />`
  ).join('\n');
  
  // Distribute activities across participants
  const activitiesPerParticipant = distributeActivities(flowDetails.activities, flowDetails.participants.length);
  
  // Generate processes for each participant
  const processesXml = flowDetails.participants.map((participant, idx) => {
    const participantActivities = activitiesPerParticipant[idx] || [];
    const isFirstParticipant = idx === 0;
    const isLastParticipant = idx === flowDetails.participants.length - 1;
    
    let processElements = '';
    let sequenceFlows = '';
    
    // Add start event to first participant
    if (isFirstParticipant) {
      processElements += `    <bpmn2:startEvent id="${startEventId}" name="${escapeXml(flowDetails.trigger)}" />\n`;
    }
    
    // Add activities for this participant
    participantActivities.forEach((activity, actIdx) => {
      const activityId = `Task_${idx}_${actIdx}_${timestamp}`;
      processElements += `    <bpmn2:userTask id="${activityId}" name="${escapeXml(activity)}" />\n`;
    });
    
    // Add gateways to appropriate participants
    if (idx < flowDetails.decisionPoints.length) {
      const gatewayId = gatewayIds[idx];
      const decision = flowDetails.decisionPoints[idx];
      processElements += `    <bpmn2:exclusiveGateway id="${gatewayId}" name="${escapeXml(decision)}" />\n`;
    }
    
    // Add end event to last participant
    if (isLastParticipant) {
      processElements += `    <bpmn2:endEvent id="${endEventId}" name="${escapeXml(flowDetails.endEvent)}" />\n`;
    }
    
    // Generate sequence flows for this process
    sequenceFlows = generateSequenceFlowsForProcess(idx, participantActivities.length, isFirstParticipant, isLastParticipant, timestamp);
    
    return `  <bpmn2:process id="${processIds[idx]}" isExecutable="true">
${processElements}${sequenceFlows}  </bpmn2:process>`;
  }).join('\n\n');
  
  // Generate visual layout
  const visualLayout = generateVisualLayoutDeterministic(flowDetails.participants.length, flowDetails.activities.length, participantIds, processIds, timestamp);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   id="Definitions_${timestamp}"
                   targetNamespace="http://bpmn.io/schema/bpmn">

  <bpmn2:collaboration id="Collaboration_${timestamp}">
${participantsXml}
  </bpmn2:collaboration>

${processesXml}

${visualLayout}

</bpmn2:definitions>`;
}

function distributeActivities(activities: string[], participantCount: number): string[][] {
  const distribution: string[][] = Array(participantCount).fill(null).map(() => []);
  
  // Distribute activities evenly across participants
  activities.forEach((activity, idx) => {
    const participantIdx = idx % participantCount;
    distribution[participantIdx].push(activity);
  });
  
  return distribution;
}

function generateSequenceFlowsForProcess(
  participantIdx: number, 
  activityCount: number, 
  isFirst: boolean, 
  isLast: boolean, 
  timestamp: number
): string {
  const flows: string[] = [];
  
  // Connect activities within this participant's process
  for (let i = 0; i < activityCount - 1; i++) {
    const sourceId = `Task_${participantIdx}_${i}_${timestamp}`;
    const targetId = `Task_${participantIdx}_${i + 1}_${timestamp}`;
    const flowId = `Flow_${participantIdx}_${i}_${i + 1}_${timestamp}`;
    flows.push(`    <bpmn2:sequenceFlow id="${flowId}" sourceRef="${sourceId}" targetRef="${targetId}" />`);
  }
  
  // Connect start event (if first participant)
  if (isFirst && activityCount > 0) {
    const flowId = `Flow_start_${participantIdx}_${timestamp}`;
    flows.push(`    <bpmn2:sequenceFlow id="${flowId}" sourceRef="StartEvent_1_${timestamp}" targetRef="Task_${participantIdx}_0_${timestamp}" />`);
  }
  
  // Connect to end event (if last participant)
  if (isLast && activityCount > 0) {
    const flowId = `Flow_${participantIdx}_end_${timestamp}`;
    const lastTaskId = `Task_${participantIdx}_${activityCount - 1}_${timestamp}`;
    flows.push(`    <bpmn2:sequenceFlow id="${flowId}" sourceRef="${lastTaskId}" targetRef="EndEvent_1_${timestamp}" />`);
  }
  
  return flows.length > 0 ? flows.join('\n') + '\n' : '';
}

function generateVisualLayoutDeterministic(
  participantCount: number, 
  totalActivities: number, 
  participantIds: string[], 
  processIds: string[], 
  timestamp: number
): string {
  const swimlaneHeight = 200;
  const swimlaneWidth = Math.max(800, totalActivities * 120 + 200);
  const elementWidth = 100;
  const elementHeight = 60;
  
  let shapes = '';
  let edges = '';
  
  // Generate participant shapes (swimlanes)
  participantIds.forEach((participantId, idx) => {
    const y = 80 + (idx * (swimlaneHeight + 20));
    shapes += `    <bpmndi:BPMNShape id="${participantId}_di" bpmnElement="${participantId}" isHorizontal="true">
      <dc:Bounds x="160" y="${y}" width="${swimlaneWidth}" height="${swimlaneHeight}" />
      <bpmndi:BPMNLabel />
    </bpmndi:BPMNShape>\n`;
  });
  
  // Generate element shapes within swimlanes
  let globalActivityIdx = 0;
  participantIds.forEach((participantId, participantIdx) => {
    const swimlaneY = 80 + (participantIdx * (swimlaneHeight + 20));
    const elementY = swimlaneY + (swimlaneHeight - elementHeight) / 2;
    let x = 240;
    
    // Start event (first participant only)
    if (participantIdx === 0) {
      shapes += `    <bpmndi:BPMNShape id="StartEvent_1_${timestamp}_di" bpmnElement="StartEvent_1_${timestamp}">
        <dc:Bounds x="${x}" y="${elementY + 10}" width="36" height="36" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>\n`;
      x += 100;
    }
    
    // Activities for this participant
    const activitiesInThisLane = Math.ceil(totalActivities / participantCount);
    for (let i = 0; i < activitiesInThisLane && globalActivityIdx < totalActivities; i++) {
      const taskId = `Task_${participantIdx}_${i}_${timestamp}`;
      shapes += `    <bpmndi:BPMNShape id="${taskId}_di" bpmnElement="${taskId}">
        <dc:Bounds x="${x}" y="${elementY}" width="${elementWidth}" height="${elementHeight}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>\n`;
      x += 120;
      globalActivityIdx++;
    }
    
    // End event (last participant only)
    if (participantIdx === participantCount - 1) {
      shapes += `    <bpmndi:BPMNShape id="EndEvent_1_${timestamp}_di" bpmnElement="EndEvent_1_${timestamp}">
        <dc:Bounds x="${x}" y="${elementY + 10}" width="36" height="36" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>\n`;
    }
  });
  
  // Generate sequence flow edges (simplified)
  let flowX = 240;
  const centerY = 80 + (swimlaneHeight / 2);
  
  for (let i = 0; i < totalActivities + 1; i++) {
    const startX = flowX + (i === 0 ? 36 : elementWidth);
    const endX = flowX + 120 + (i === totalActivities ? 0 : 0);
    
    edges += `    <bpmndi:BPMNEdge id="Flow_${i}_${timestamp}_di" bpmnElement="Flow_${i}_${timestamp}">
      <di:waypoint x="${startX}" y="${centerY}" />
      <di:waypoint x="${endX}" y="${centerY}" />
    </bpmndi:BPMNEdge>\n`;
    
    flowX += 120;
  }
  
  return `  <bpmndi:BPMNDiagram id="BPMNDiagram_${timestamp}">
    <bpmndi:BPMNPlane id="BPMNPlane_${timestamp}" bpmnElement="Collaboration_${timestamp}">
${shapes}${edges}    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
function F(i){const n=Date.now(),_=t=>t.replace(/[^a-zA-Z0-9]/g,"_").replace(/_+/g,"_").substring(0,50),r=`Process_${n}`,b=`Collaboration_${n}`,h=i.participants.map((t,e)=>`    <bpmn2:participant id="${`Participant_${_(t)}_${n}`}" name="${t.replace(/"/g,"&quot;")}" processRef="${r}" />`).join(`
`),u=i.activities.map((t,e)=>`    <bpmn2:userTask id="${`Task_${e+1}_${n}`}" name="${t.replace(/"/g,"&quot;")}" />`).join(`
`),y=i.decisionPoints.map((t,e)=>{const o=`Task_Conditional_${e+1}_${n}`,s=t.includes("?")?t.split("?")[1].trim().substring(0,30):`Alternative ${e+1}`;return`    <bpmn2:userTask id="${o}" name="${s.replace(/"/g,"&quot;")}" />`}).join(`
`),P=i.decisionPoints.map((t,e)=>{const o=`Gateway_${e+1}_${n}`,s=t.substring(0,50).replace(/"/g,"&quot;");return`    <bpmn2:exclusiveGateway id="${o}" name="${s}" />`}).join(`
`),a=[],m=`StartEvent_1_${n}`,l=`EndEvent_1_${n}`;if(i.activities.length===0)a.push(`    <bpmn2:sequenceFlow id="Flow_start_end_${n}" sourceRef="${m}" targetRef="${l}" />`);else{a.push(`    <bpmn2:sequenceFlow id="Flow_start_${n}" sourceRef="${m}" targetRef="Task_1_${n}" />`);let t=`Task_1_${n}`,e=1,o=0;for(let s=1;s<i.activities.length;s++){const c=`Task_${s+1}_${n}`;if(o<i.decisionPoints.length&&s===Math.floor(i.activities.length/2)){const $=`Gateway_${o+1}_${n}`,p=`Task_Conditional_${o+1}_${n}`;a.push(`    <bpmn2:sequenceFlow id="Flow_${e}_gateway_${o+1}_${n}" sourceRef="${t}" targetRef="${$}" />`),a.push(`    <bpmn2:sequenceFlow id="Flow_gateway_${o+1}_yes_${n}" name="Yes" sourceRef="${$}" targetRef="${c}">
      <bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression">true</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>`),a.push(`    <bpmn2:sequenceFlow id="Flow_gateway_${o+1}_no_${n}" name="No" sourceRef="${$}" targetRef="${p}">
      <bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression">false</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>`),a.push(`    <bpmn2:sequenceFlow id="Flow_conditional_${o+1}_merge_${n}" sourceRef="${p}" targetRef="${c}" />`),o++,t=c}else a.push(`    <bpmn2:sequenceFlow id="Flow_${e}_${s+1}_${n}" sourceRef="${t}" targetRef="${c}" />`),t=c;e=s+1}a.push(`    <bpmn2:sequenceFlow id="Flow_${e}_end_${n}" sourceRef="${t}" targetRef="${l}" />`)}const B=Math.max(600,200+i.activities.length*150+i.decisionPoints.length*100),E=i.participants.length>0?`      <bpmndi:BPMNShape id="Participant_${_(i.participants[0])}_${n}_di" bpmnElement="Participant_${_(i.participants[0])}_${n}" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="${B}" height="300" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`:"",M=i.activities.map((t,e)=>{const o=250+e*180;return`      <bpmndi:BPMNShape id="Task_${e+1}_${n}_di" bpmnElement="Task_${e+1}_${n}">
        <dc:Bounds x="${o}" y="190" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`}).join(`
`),N=i.decisionPoints.map((t,e)=>{const o=250+Math.floor(i.activities.length/2)*180+e*200;return`      <bpmndi:BPMNShape id="Gateway_${e+1}_${n}_di" bpmnElement="Gateway_${e+1}_${n}">
        <dc:Bounds x="${o}" y="205" width="50" height="50" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`}).join(`
`),x=i.decisionPoints.map((t,e)=>{const o=250+Math.floor(i.activities.length/2)*180+e*200;return`      <bpmndi:BPMNShape id="Task_Conditional_${e+1}_${n}_di" bpmnElement="Task_Conditional_${e+1}_${n}">
        <dc:Bounds x="${o}" y="320" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`}).join(`
`),g=250+i.activities.length*180+i.decisionPoints.length*100+50,d=[];if(i.activities.length===0)d.push(`      <bpmndi:BPMNEdge id="Flow_start_end_${n}_di" bpmnElement="Flow_start_end_${n}">
        <di:waypoint x="218" y="230" />
        <di:waypoint x="300" y="230" />
      </bpmndi:BPMNEdge>`);else{d.push(`      <bpmndi:BPMNEdge id="Flow_start_${n}_di" bpmnElement="Flow_start_${n}">
        <di:waypoint x="236" y="230" />
        <di:waypoint x="250" y="230" />
      </bpmndi:BPMNEdge>`);let t=1,e=0;for(let s=1;s<i.activities.length;s++){const c=300+(t-1)*180,$=250+s*180;if(e<i.decisionPoints.length&&s===Math.floor(i.activities.length/2)){const p=250+Math.floor(i.activities.length/2)*180+e*200,w=p;d.push(`      <bpmndi:BPMNEdge id="Flow_${t}_gateway_${e+1}_${n}_di" bpmnElement="Flow_${t}_gateway_${e+1}_${n}">
        <di:waypoint x="${c}" y="230" />
        <di:waypoint x="${p+25}" y="230" />
      </bpmndi:BPMNEdge>`),d.push(`      <bpmndi:BPMNEdge id="Flow_gateway_${e+1}_yes_${n}_di" bpmnElement="Flow_gateway_${e+1}_yes_${n}">
        <di:waypoint x="${p+50}" y="230" />
        <di:waypoint x="${$}" y="230" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${p+55}" y="210" width="18" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`),d.push(`      <bpmndi:BPMNEdge id="Flow_gateway_${e+1}_no_${n}_di" bpmnElement="Flow_gateway_${e+1}_no_${n}">
        <di:waypoint x="${p+25}" y="255" />
        <di:waypoint x="${p+25}" y="320" />
        <di:waypoint x="${w}" y="360" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${p+30}" y="285" width="15" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`),d.push(`      <bpmndi:BPMNEdge id="Flow_conditional_${e+1}_merge_${n}_di" bpmnElement="Flow_conditional_${e+1}_merge_${n}">
        <di:waypoint x="${w+100}" y="360" />
        <di:waypoint x="${$+50}" y="280" />
        <di:waypoint x="${$+50}" y="270" />
      </bpmndi:BPMNEdge>`),e++}else d.push(`      <bpmndi:BPMNEdge id="Flow_${t}_${s+1}_${n}_di" bpmnElement="Flow_${t}_${s+1}_${n}">
        <di:waypoint x="${c}" y="230" />
        <di:waypoint x="${$}" y="230" />
      </bpmndi:BPMNEdge>`);t=s+1}const o=300+(i.activities.length-1)*180;d.push(`      <bpmndi:BPMNEdge id="Flow_${i.activities.length}_end_${n}_di" bpmnElement="Flow_${i.activities.length}_end_${n}">
        <di:waypoint x="${o}" y="230" />
        <di:waypoint x="${g}" y="230" />
      </bpmndi:BPMNEdge>`)}return`<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   id="Definitions_${n}"
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:collaboration id="${b}">
${h}
  </bpmn2:collaboration>
  <bpmn2:process id="${r}" name="${i.processName.replace(/"/g,"&quot;")}" isExecutable="true">
    <bpmn2:documentation>${i.processDescription.replace(/"/g,"&quot;")}</bpmn2:documentation>
    <bpmn2:startEvent id="${m}" name="${i.trigger.replace(/"/g,"&quot;")}" />
${u}
${y}
${P}
    <bpmn2:endEvent id="${l}" name="${i.endEvent.replace(/"/g,"&quot;")}" />
${a.join(`
`)}
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_${n}">
    <bpmndi:BPMNPlane id="BPMNPlane_${n}" bpmnElement="${b}">
${E}
      <bpmndi:BPMNShape id="${m}_di" bpmnElement="${m}">
        <dc:Bounds x="200" y="212" width="36" height="36" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
${M}
${N}
${x}
      <bpmndi:BPMNShape id="${l}_di" bpmnElement="${l}">
        <dc:Bounds x="${g}" y="212" width="36" height="36" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
${d.join(`
`)}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`}export{F as generateStructuredBpmn};

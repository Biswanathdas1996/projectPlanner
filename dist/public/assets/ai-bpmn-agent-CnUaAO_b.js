import{G as o}from"./index-C-b8a4qm.js";const a=new o("AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg");class c{constructor(){this.model=a.getGenerativeModel({model:"gemini-2.0-flash-lite",generationConfig:{temperature:.1,topK:40,topP:.85,maxOutputTokens:8192}})}async generateLargeBpmn(e,n={complexity:"standard",includeSubProcesses:!1,includeMessageFlows:!0,includeTimerEvents:!1,includeErrorHandling:!1,swimlaneLayout:"horizontal"}){console.log("🤖 AI BPMN Agent: Generating large-scale BPMN 2.0 process...");const s=this.buildAdvancedPrompt(e,n);try{let i=(await(await this.model.generateContent(s)).response).text();return i=this.cleanBpmnOutput(i),i=this.enhanceBpmnStructure(i,e,n),console.log("✅ AI BPMN Agent: Generated comprehensive BPMN 2.0 process",i),console.log(`📊 Process complexity: ${n.complexity}`),console.log(`🏊 Participants: ${e.participants.length}`),console.log(`⚡ Activities: ${e.activities.length}`),console.log(`🔀 Decision points: ${e.decisionPoints.length}`),i}catch(t){throw console.error("❌ AI BPMN Agent Error:",t),new Error(`AI BPMN Agent failed to generate process: ${t}`)}}buildAdvancedPrompt(e,n){return this.getComplexityInstructions(n.complexity),this.getLayoutInstructions(n),`You are an expert BPMN 2.0 architect specializing in large-scale enterprise process modeling. Generate a comprehensive, production-ready BPMN 2.0 XML diagram XML script based on this structured workflow specification.

## WORKFLOW SPECIFICATION

✅ 1. PROCESS & DESCRIPTION:
Process Name: ${e.processName}
Description: ${e.processDescription}

✅ 2. PARTICIPANTS (SWIMLANES):
${e.participants.map((s,t)=>`${t+1}. ${s}`).join(`
`)}

✅ 3. TRIGGER (START EVENT):
${e.trigger}

✅ 4. ACTIVITIES (TASKS):
${e.activities.map((s,t)=>`${t+1}. ${s}`).join(`
`)}

✅ 5. DECISION POINTS (GATEWAYS):
${e.decisionPoints.map((s,t)=>`${t+1}. ${s}`).join(`
`)}

✅ 6. END EVENT:
${e.endEvent}

✅ 7. ADDITIONAL ELEMENTS:
${e.additionalElements.map((s,t)=>`${t+1}. ${s}`).join(`
`)}

### OUTPUT REQUIREMENTS:
- Return ONLY valid BPMN 2.0 XML
- NO explanations, comments, or markdown formatting
- Ensure XML is well-formed and validates against BPMN 2.0 schema
- Use descriptive element names based on actual workflow content
- Create realistic coordinate positioning for professional visualization
- Include proper documentation elements within the process

Generate the complete BPMN 2.0 XML:`}getComplexityInstructions(e){switch(e){case"simple":return`- Create basic sequential flow with minimal branching
- Use standard task types and simple gateways
- Focus on core process flow without advanced elements`;case"standard":return`- Include moderate complexity with decision gateways
- Add parallel flows where appropriate
- Use multiple participant swimlanes effectively
- Include basic error paths and alternative flows`;case"complex":return`- Create sophisticated process with multiple decision points
- Include parallel gateways, event-based gateways, and complex routing
- Add sub-processes for logical grouping
- Include comprehensive error handling and exception flows
- Use advanced BPMN elements like intermediate events`;case"enterprise":return`- Generate enterprise-grade process with full BPMN 2.0 feature set
- Include complex choreography and orchestration patterns
- Add multiple levels of sub-processes and call activities
- Implement comprehensive governance and compliance patterns
- Include advanced event handling, compensation, and transaction boundaries
- Create realistic enterprise integration patterns
- make sure you are closing each tag of the script , also close <?xml version="1.0" encoding="UTF-8"?>
`;default:return"- Create standard business process with appropriate complexity"}}getLayoutInstructions(e){return`- Use ${e.swimlaneLayout==="horizontal"?"horizontal participant pools with vertical activity flow":"vertical participant pools with horizontal activity flow"}
- Ensure proper spacing between elements (minimum 150px)
- Align elements professionally within participant boundaries
- Create clear visual hierarchy with consistent positioning
- Position decision gateways with clear Yes/No flow paths
- Use standard BPMN visual conventions for element sizing`}cleanBpmnOutput(e){e=e.replace(/```xml\n?/g,"").replace(/```\n?/g,""),e=e.trim(),e.startsWith("<?xml")||(e=`<?xml version="1.0" encoding="UTF-8"?>
`+e);const n=e.indexOf("<?xml");return n>0&&(e=e.substring(n)),e=this.fixDuplicateIds(e),e}fixDuplicateIds(e){const n=Date.now(),s=new Set;return e.replace(/id="([^"]+)"/g,(t,r)=>{if(s.has(r)){const i=`${r}_${n}_${Math.random().toString(36).substr(2,5)}`;return s.add(i),`id="${i}"`}return s.add(r),t})}enhanceBpmnStructure(e,n,s){if(!e.includes("<bpmn2:documentation>")){const t=e.indexOf("<bpmn2:startEvent");if(t>0){const r=`    <bpmn2:documentation>${n.processDescription}</bpmn2:documentation>
    `;e=e.substring(0,t)+r+e.substring(t)}}return e.includes("targetNamespace=")||(e=e.replace("<bpmn2:definitions",'<bpmn2:definitions targetNamespace="http://bpmn.io/schema/bpmn"')),e}async generateMultipleVariants(e,n){console.log(`🎯 AI BPMN Agent: Generating ${n.length} process variants...`);const s=await Promise.all(n.map(async(t,r)=>{try{const i=await this.generateLargeBpmn(e,t);return{variant:`${t.complexity}_variant_${r+1}`,xml:i}}catch(i){throw console.error(`Variant ${r+1} failed:`,i),i}}));return console.log("✅ AI BPMN Agent: All variants generated successfully"),s}}function u(){return new c}export{c as AIBpmnAgent,u as createAIBpmnAgent,c as default};

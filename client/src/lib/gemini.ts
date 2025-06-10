import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E");

export async function generateCustomSuggestions(
  projectDescription: string,
): Promise<string[]> {
  if (!projectDescription.trim()) {
    throw new Error("Project description is required");
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  });

  const prompt = `Analyze this project description and generate 10-15 highly relevant, actionable enhancement suggestions: "${projectDescription}"

SUGGESTION CATEGORIES (include 2-3 from each):

1. **Advanced Technical Features**
   - AI/ML integrations and automation
   - Advanced security implementations
   - Performance optimizations and caching
   - Real-time capabilities and websockets
   - API integrations and third-party services

2. **User Experience Enhancements**
   - Accessibility improvements (WCAG compliance)
   - Mobile-first responsive design
   - Progressive web app capabilities
   - User onboarding and tutorial systems
   - Personalization and customization options

3. **Business Intelligence & Analytics**
   - Comprehensive analytics and reporting
   - A/B testing framework implementation
   - User behavior tracking and insights
   - Performance monitoring and KPIs
   - Business intelligence dashboards

4. **Quality & Reliability**
   - Comprehensive testing strategies (unit, integration, e2e)
   - Error handling and graceful degradation
   - Monitoring and alerting systems
   - Backup and disaster recovery plans
   - Load testing and stress testing protocols

5. **Scalability & Infrastructure**
   - Microservices architecture implementation
   - Container orchestration and deployment
   - CDN integration for global performance
   - Database optimization and sharding
   - Auto-scaling and load balancing

REQUIREMENTS:
- Each suggestion must be specific and actionable
- Include implementation complexity consideration
- Focus on measurable business value
- Ensure suggestions are relevant to the project type
- Include both short-term and long-term enhancements
- Consider industry best practices and standards

Return ONLY a JSON array of suggestion strings with no explanations, markdown, or additional text.

Example format: ["Implement multi-factor authentication (MFA) and biometric login options for enhanced security", "Develop a personalized onboarding experience with interactive tutorials tailored to user financial literacy levels"]`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    // Clean the response to extract JSON
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    }
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }
    
    const suggestions = JSON.parse(cleanedText);
    
    // Validate suggestions array
    if (!Array.isArray(suggestions) || suggestions.length < 8) {
      throw new Error("Invalid suggestions format");
    }
    
    return suggestions.slice(0, 15); // Limit to 15 suggestions max
  } catch (error) {
    console.error("Failed to parse suggestions JSON:", error);
    // Enhanced fallback: extract suggestions from text format
    const lines = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => 
        line && 
        !line.includes("```") && 
        !line.includes("JSON") &&
        !line.startsWith("Here") &&
        !line.startsWith("Based") &&
        line.length > 20
      )
      .map(line => line.replace(/^[\d\.\-\*\+]\s*/, "")) // Remove list markers
      .filter(line => line.length > 30); // Filter out short lines
    
    return lines.slice(0, 12);
  }
}

export async function generateProjectPlan(
  projectDescription: string,
): Promise<string> {
  if (!projectDescription.trim()) {
    throw new Error("Project description is required");
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  });

  const prompt = `Create a comprehensive, detailed project plan for: "${projectDescription}"

MANDATORY SECTIONS (ALL MUST BE INCLUDED):

1. **Executive Summary**
   - Project purpose and vision
   - Key objectives and success metrics
   - Target audience and market analysis
   - Budget estimation and ROI projections

2. **Technical Architecture & Infrastructure**
   - Complete technology stack with specific versions
   - System architecture diagrams (described in detail)
   - Database design and data flow
   - Security architecture and compliance requirements
   - Scalability and performance considerations
   - Third-party integrations and APIs

3. **Detailed Feature Specifications**
   - Core functionality with user stories
   - Advanced features and capabilities
   - User roles and permissions matrix
   - Feature prioritization (MVP vs future phases)
   - Acceptance criteria for each feature

4. **Development Methodology & Timeline**
   - Project phases with specific deliverables
   - Detailed timeline with milestones (weeks/months)
   - Team structure and resource allocation
   - Development methodology (Agile/Scrum sprints)
   - Dependencies and critical path analysis

5. **User Experience & Interface Design**
   - User persona definitions
   - User journey mapping
   - Wireframes and mockup descriptions
   - Accessibility requirements (WCAG compliance)
   - Mobile responsiveness strategy

6. **Quality Assurance & Testing Strategy**
   - Testing methodologies (unit, integration, e2e)
   - Performance testing requirements
   - Security testing protocols
   - User acceptance testing procedures
   - Bug tracking and resolution processes

7. **Deployment & DevOps Strategy**
   - Environment setup (dev, staging, production)
   - CI/CD pipeline configuration
   - Monitoring and logging systems
   - Backup and disaster recovery plans
   - Maintenance and support procedures

8. **Risk Management & Mitigation**
   - Technical risks and solutions
   - Business risks and contingencies
   - Resource and timeline risks
   - Security and compliance risks
   - Market and competitive risks

9. **Stakeholder Management**
   - Key stakeholders and their roles
   - Communication plan and reporting
   - Approval processes and sign-offs
   - Change management procedures

10. **Post-Launch Strategy**
    - User onboarding and training
    - Performance monitoring KPIs
    - Feature enhancement roadmap
    - Marketing and growth strategies
    - Long-term maintenance planning

FORMATTING REQUIREMENTS:
- Complete HTML document with embedded CSS
- Professional corporate styling
- Responsive design for all devices
- Clear visual hierarchy with consistent typography
- Color-coded sections for easy navigation
- Interactive table of contents
- Professional charts and diagrams (ASCII/Unicode)
- Print-friendly styling
- Accessibility-compliant markup

QUALITY STANDARDS:
- Each section must be substantial (minimum 200 words)
- Include specific, actionable details
- Provide realistic timelines and estimates
- Use industry-standard terminology
- Include measurable success criteria
- Address scalability from day one

Return ONLY the complete HTML document with embedded CSS. The document must be production-ready and comprehensive enough for actual project implementation.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Validate the response contains required sections
  const requiredSections = [
    'Executive Summary',
    'Technical Architecture',
    'Feature Specifications',
    'Development Methodology',
    'User Experience',
    'Quality Assurance',
    'Deployment',
    'Risk Management',
    'Stakeholder Management',
    'Post-Launch Strategy'
  ];
  
  const missingSections = requiredSections.filter(section => 
    !text.toLowerCase().includes(section.toLowerCase())
  );
  
  if (missingSections.length > 3) {
    // If too many sections are missing, retry with a more specific prompt
    const retryPrompt = `${prompt}

CRITICAL: The response MUST include ALL 10 mandatory sections listed above. Do not skip any sections. Each section must be comprehensive and detailed.`;
    
    const retryResult = await model.generateContent(retryPrompt);
    const retryResponse = await retryResult.response;
    return retryResponse.text();
  }
  
  return text;
}

export async function generateUserJourneyFlows(
  projectPlan: string,
): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Generate comprehensive user journey flow diagrams for different personas based on this project plan: "${projectPlan}"

Create detailed step-by-step flow diagrams for each distinct user persona and their specific journeys. Include:

**User Personas and Journey Types:**
1. **Guest/Anonymous User Journey** - Unauthenticated user interactions, exploration, registration flows
2. **Logged-in User Journey** - Authenticated user core features, profile management, main workflows
3. **Admin User Journey** - Administrative tasks, user management, system configuration, reporting
4. **Power User Journey** - Advanced features, bulk operations, integrations
5. **Mobile User Journey** - Mobile-specific interactions and responsive flows

**For Each Journey Include:**
- **Start Point**: Clear entry point and user context
- **Decision Points**: Where users make choices with branching paths
- **Action Steps**: Specific tasks users perform
- **System Interactions**: Backend processes and validations
- **Success/Failure Paths**: Different outcomes and error handling
- **Exit Points**: How journeys conclude

**Visual Format Requirements:**
- Clean HTML with embedded CSS styling
- Interactive flow diagrams with hover effects
- Color-coded sections for different persona types
- Professional typography and spacing
- Responsive design for all screen sizes
- Clear visual indicators for different flow types

Return ONLY the complete HTML document with embedded CSS - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generatePersonaBpmnFlow(
  projectPlan: string,
  personaType: "guest" | "loggedin" | "admin" | "power" | "mobile",
): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const personaPrompts = {
    guest: {
      title: "Guest User Journey",
      description:
        "Unauthenticated user interactions, exploration, discovery, registration flows",
      swimlanes: [
        "Guest User",
        "Public Interface",
        "Authentication System",
        "Content Service",
      ],
    },
    loggedin: {
      title: "Logged-in User Journey",
      description:
        "Authenticated user core features, profile management, main application workflows",
      swimlanes: [
        "Logged-in User",
        "User Interface",
        "Application Service",
        "Data Storage",
      ],
    },
    admin: {
      title: "Admin User Journey",
      description:
        "Administrative tasks, user management, system configuration, reporting and analytics",
      swimlanes: [
        "Admin User",
        "Admin Panel",
        "Management Service",
        "System Database",
      ],
    },
    power: {
      title: "Power User Journey",
      description:
        "Advanced features, bulk operations, API access, integrations, custom workflows",
      swimlanes: [
        "Power User",
        "Advanced Features",
        "API Gateway",
        "Integration Hub",
      ],
    },
    mobile: {
      title: "Mobile User Journey",
      description:
        "Mobile-specific interactions, responsive flows, offline capabilities, push notifications",
      swimlanes: ["Mobile User", "Mobile App", "Push Service", "Sync Service"],
    },
  };

  const persona = personaPrompts[personaType];

  const prompt = `Generate a BPMN 2.0 XML diagram specifically for ${persona.title} based on this project plan: "${projectPlan}"

**Focus on ${persona.description}**

**BPMN 2.0 Requirements:**
- Create valid BPMN 2.0 XML format following OMG specifications
- Include proper XML namespaces and schema declarations
- Use swimlanes (Participant/Lane elements) for: ${persona.swimlanes.join(", ")}
- Implement proper BPMN elements: StartEvent, Task, ExclusiveGateway, EndEvent
- Include SequenceFlow connections between all elements
- Add proper BPMNDiagram with visual positioning coordinates

**${persona.title} Specific Elements:**
- **Start Events**: ${personaType === "guest" ? "Landing page visit, search discovery" : personaType === "admin" ? "Admin login, dashboard access" : "User login, app launch"}
- **User Tasks**: ${personaType === "guest" ? "Browse content, view features, register" : personaType === "admin" ? "Manage users, configure settings, review reports" : "Use core features, update profile"}
- **Service Tasks**: ${personaType === "guest" ? "Show public content, track analytics" : personaType === "admin" ? "Generate reports, sync data, send notifications" : "Process requests, save data"}
- **Decision Points**: ${personaType === "guest" ? "Register vs browse, feature access" : personaType === "admin" ? "Permission checks, approval workflows" : "Feature availability, data validation"}
- **End Events**: Successful completion, error handling, session timeout

**Flow Patterns for ${persona.title}:**
- Sequential ${personaType} interaction steps
- Decision branching based on ${personaType} permissions and context
- Error handling specific to ${personaType} scenarios
- Cross-swimlane communication patterns

**XML Structure Requirements:**
- Valid XML declaration and BPMN namespace
- Proper Process definition with flowNodeRef elements
- Collaboration element with ${persona.swimlanes.length} participants
- Complete BPMNDiagram with realistic coordinates
- Process ID: "Process_${personaType.charAt(0).toUpperCase() + personaType.slice(1)}_Journey"

Generate a complete, valid BPMN 2.0 XML document focused specifically on the ${persona.title} workflow.

Return ONLY the complete BPMN 2.0 XML - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateSitemapXml(projectPlan: string): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Generate a comprehensive XML sitemap based on this project plan: "${projectPlan}"

Create a realistic sitemap.xml file that includes:
- Homepage and core navigation pages
- Feature-specific pages based on the project plan
- User account and profile pages
- Administrative and management pages
- API documentation and developer resources
- Support and help pages
- Legal and policy pages
- Blog or content sections if applicable
- Search and filtering pages
- Mobile-specific pages if needed

**Requirements:**
- Valid XML sitemap format following sitemap.org protocol
- Realistic URLs that match the project type and structure
- Proper priority values (0.1 to 1.0) based on page importance
- Appropriate changefreq values (always, hourly, daily, weekly, monthly, yearly, never)
- lastmod dates set to current date for all pages
- Clean, properly formatted XML structure
- URLs should be realistic for the project description
- Include both user-facing and administrative pages
- Relevant to the project description

**XML Requirements:**
- Valid XML sitemap format following sitemap.org protocol
- Proper XML declaration and namespace
- Clean, properly formatted structure
- URLs should be realistic for the project type
- Include at least 15-25 pages for comprehensive coverage

Return ONLY the complete XML sitemap - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function extractStakeholdersFromProject(
  projectPlan: string,
): Promise<{ stakeholders: string[], flowTypes: Record<string, string[]> }> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Analyze this project plan and extract all stakeholders/user personas and their potential workflow types: "${projectPlan}"

Extract:
1. **Stakeholders/Personas**: All distinct user types, roles, or personas mentioned in the project plan
2. **Flow Types**: For each stakeholder, identify different workflow scenarios they might encounter

Examples of stakeholders: Guest User, Registered User, Admin, Content Manager, Customer Support, Developer, Power User, Mobile User, API Consumer, etc.

Examples of flow types per stakeholder:
- Guest User: Registration Flow, Browse Content Flow, Search Flow
- Admin: User Management Flow, Content Moderation Flow, Analytics Review Flow
- Customer: Purchase Flow, Support Request Flow, Account Management Flow

Return ONLY a JSON object in this exact format:
{
  "stakeholders": ["Stakeholder1", "Stakeholder2", ...],
  "flowTypes": {
    "Stakeholder1": ["Flow Type A", "Flow Type B", ...],
    "Stakeholder2": ["Flow Type C", "Flow Type D", ...]
  }
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    // Clean the response to extract JSON
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    }
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse stakeholders JSON:', error);
    // Fallback to default stakeholders
    return {
      stakeholders: ["Guest User", "Registered User", "Admin User", "Power User", "Mobile User"],
      flowTypes: {
        "Guest User": ["Registration Flow", "Browse Content Flow", "Search Flow"],
        "Registered User": ["Login Flow", "Main Features Flow", "Profile Management Flow"],
        "Admin User": ["User Management Flow", "System Configuration Flow", "Analytics Flow"],
        "Power User": ["Advanced Features Flow", "Bulk Operations Flow", "API Integration Flow"],
        "Mobile User": ["Mobile App Flow", "Offline Sync Flow", "Push Notification Flow"]
      }
    };
  }
}

export async function generatePersonaBpmnFlowWithType(
  projectPlan: string,
  stakeholder: string,
  flowType: string,
  customPrompt?: string
): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const enhancedProjectPlan = customPrompt 
    ? `${projectPlan}\n\nAdditional Requirements: ${customPrompt}`
    : projectPlan;

  const prompt = `Generate a BPMN 2.0 XML diagram for ${stakeholder} - ${flowType} based on this project plan: "${enhancedProjectPlan}"

**Focus on ${stakeholder} performing ${flowType} workflow**

**BPMN 2.0 Requirements:**
- Create valid BPMN 2.0 XML format following OMG specifications
- Include proper XML namespaces and schema declarations
- Use swimlanes (Participant/Lane elements) for: ${stakeholder}, System, Backend Service, External Service
- Implement proper BPMN elements: StartEvent, UserTask, ServiceTask, ExclusiveGateway, EndEvent
- Include SequenceFlow connections between all elements
- Add proper BPMNDiagram with visual positioning coordinates

**${flowType} Specific Elements:**
- **Start Events**: Entry point for ${flowType}
- **User Tasks**: Actions ${stakeholder} performs during ${flowType}
- **Service Tasks**: System processes supporting ${flowType}
- **Decision Points**: Branching logic specific to ${flowType}
- **End Events**: Completion states for ${flowType}

**Flow Patterns:**
- Sequential steps for ${flowType}
- Decision branching based on ${stakeholder} context
- Error handling specific to ${flowType}
- Cross-swimlane communication patterns

**XML Structure Requirements:**
- Valid XML declaration and BPMN namespace
- Process ID: "Process_${stakeholder.replace(/\s+/g, '_')}_${flowType.replace(/\s+/g, '_')}"
- Collaboration with appropriate participants
- Complete BPMNDiagram with realistic coordinates

Generate a complete, valid BPMN 2.0 XML document focused specifically on the ${stakeholder} ${flowType} workflow.

Return ONLY the complete BPMN 2.0 XML - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Clean the response to remove any markdown formatting
  let cleanedText = text.trim();
  if (cleanedText.startsWith("```xml")) {
    cleanedText = cleanedText.replace(/^```xml\s*/, "").replace(/```\s*$/, "");
  }
  if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  return cleanedText;
}

export async function generateBpmnXml(projectPlan: string): Promise<string> {
  if (!projectPlan.trim()) {
    throw new Error("Project plan is required");
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    }
  });

  const prompt = `Generate a comprehensive BPMN 2.0 XML workflow diagram based on this project plan: "${projectPlan}"

CRITICAL REQUIREMENTS:
1. **Valid BPMN 2.0 XML Structure**
   - Proper XML declaration and BPMN namespace
   - Valid BPMN elements with correct IDs
   - Proper process flow with start/end events
   - Include decision gateways for business logic
   - Add user tasks, service tasks, and script tasks
   - Include sequence flows connecting all elements

2. **Essential BPMN Elements to Include**:
   - startEvent (circle)
   - endEvent (circle with thick border)
   - userTask (rectangle) for user interactions
   - serviceTask (rectangle with gear icon) for system processes
   - exclusiveGateway (diamond) for decision points
   - parallelGateway (diamond with plus) for parallel flows
   - sequenceFlow (arrows) connecting elements

3. **Process Flow Structure**:
   - Start with project initiation
   - Include requirements gathering phase
   - Add design and architecture phase
   - Include development iterations
   - Add testing and quality assurance
   - Include deployment and launch
   - End with project completion

4. **ID Naming Convention**:
   - Use descriptive, valid XML IDs (no spaces, special chars)
   - StartEvent_1, UserTask_Requirements, Gateway_Decision_1
   - Process_ProjectWorkflow
   - SequenceFlow_1, SequenceFlow_2, etc.

5. **Visual Layout (bpmndi:BPMNDiagram)**:
   - Include proper positioning coordinates
   - Logical left-to-right flow
   - Adequate spacing between elements
   - Professional swimlane layout if applicable

EXAMPLE STRUCTURE:
<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   id="Definitions_1" 
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_ProjectWorkflow" isExecutable="true">
    [Process elements here]
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    [Diagram elements here]
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>

VALIDATION REQUIREMENTS:
- XML must be well-formed and valid
- All BPMN elements must have proper IDs
- Sequence flows must connect valid elements
- Process must have clear start and end points
- Include meaningful labels and descriptions

Return ONLY the complete, valid BPMN 2.0 XML - no explanations or markdown.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Clean the response to remove any markdown formatting
  let cleanedText = text.trim();
  if (cleanedText.startsWith("```xml")) {
    cleanedText = cleanedText.replace(/^```xml\s*/, "").replace(/```\s*$/, "");
  }
  if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  // Basic validation - ensure it starts with XML declaration
  if (!cleanedText.startsWith('<?xml') && !cleanedText.startsWith('<bpmn2:definitions')) {
    throw new Error('Generated BPMN XML is not properly formatted');
  }

  // Validate essential BPMN elements are present
  const requiredElements = ['bpmn2:process', 'bpmn2:startEvent', 'bpmn2:endEvent', 'bpmndi:BPMNDiagram'];
  const missingElements = requiredElements.filter(element => !cleanedText.includes(element));
  
  if (missingElements.length > 0) {
    console.warn('BPMN XML missing elements:', missingElements);
    // Continue anyway as some elements might be optional
  }

  return cleanedText;
}

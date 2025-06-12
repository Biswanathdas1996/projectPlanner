import { GoogleGenerativeAI } from '@google/generative-ai';

export interface PageRequirement {
  pageName: string;
  pageType: string;
  purpose: string;
  stakeholders: string[];
  contentElements: ContentElement[];
  userInteractions: string[];
  dataRequirements: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ContentElement {
  type: 'header' | 'form' | 'button' | 'text' | 'image' | 'list' | 'table' | 'chart' | 'input' | 'dropdown' | 'modal' | 'navigation' | 'api-display' | 'upload' | 'search';
  label: string;
  content: string;
  position: 'top' | 'center' | 'bottom' | 'left' | 'right' | 'sidebar';
  required: boolean;
  interactions: string[];
}

export interface WireframeAnalysisResult {
  projectContext: string;
  totalPages: number;
  pageRequirements: PageRequirement[];
  commonElements: ContentElement[];
  userFlowConnections: { from: string; to: string; trigger: string }[];
  dataFlowMap: { source: string; destination: string; dataType: string }[];
}

export class WireframeAnalysisAgent {
  private model: any;

  constructor() {
    const genAI = new GoogleGenerativeAI("AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E");
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async analyzeStakeholderFlows(): Promise<WireframeAnalysisResult> {
    try {
      console.log('Starting stakeholder flow analysis...');
      
      // Get stakeholder flow data from local storage
      const stakeholderFlowData = localStorage.getItem('bpmn-stakeholder-flow-data');
      const personaFlowTypes = localStorage.getItem('bpmn-persona-flow-types');
      const projectDescription = localStorage.getItem('bpmn-project-description') || localStorage.getItem('bpmn-project-plan') || '';
      const extractedStakeholders = localStorage.getItem('bpmn-extracted-stakeholders');

      console.log('Retrieved data:', {
        hasStakeholderFlowData: !!stakeholderFlowData,
        hasPersonaFlowTypes: !!personaFlowTypes,
        hasProjectDescription: !!projectDescription,
        hasExtractedStakeholders: !!extractedStakeholders
      });

      if (!stakeholderFlowData || !personaFlowTypes) {
        throw new Error('No stakeholder flow data found. Please complete the Stakeholder Flow Analysis first.');
      }

      let flowData, flowTypes, stakeholders;
      
      try {
        flowData = JSON.parse(stakeholderFlowData);
        flowTypes = JSON.parse(personaFlowTypes);
        stakeholders = extractedStakeholders ? JSON.parse(extractedStakeholders) : [];
        
        console.log('Parsed data successfully:', {
          flowDataKeys: Object.keys(flowData || {}),
          flowTypesKeys: Object.keys(flowTypes || {}),
          stakeholdersCount: stakeholders.length
        });
      } catch (parseError) {
        console.error('Error parsing stored data:', parseError);
        throw new Error('Invalid stakeholder flow data format. Please regenerate the stakeholder analysis.');
      }

      // If no valid data, provide fallback analysis
      if (!flowData || Object.keys(flowData).length === 0 || !flowTypes || Object.keys(flowTypes).length === 0) {
        console.log('No valid flow data found, generating fallback analysis');
        return this.generateFallbackAnalysis(flowData || {}, flowTypes || {});
      }

      const analysisPrompt = this.buildAnalysisPrompt(flowData, flowTypes, projectDescription, stakeholders);
      console.log('Generated analysis prompt, calling Gemini API...');
      
      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysisText = response.text();

      console.log('Received Gemini response, parsing results...');
      return this.parseAnalysisResult(analysisText, flowData, flowTypes);
    } catch (error) {
      console.error('Error analyzing stakeholder flows:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('API key issue. Please check your Gemini API configuration.');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('API quota exceeded. Please try again later.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        } else if (error.message.includes('stakeholder flow data')) {
          throw error; // Pass through our custom error messages
        }
      }
      
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildAnalysisPrompt(flowData: any, flowTypes: any, projectDescription: string, stakeholders: string[]): string {
    return `
You are an expert UX/UI analyst and wireframe designer. Analyze the following stakeholder flow data and determine what pages/screens are needed for a comprehensive digital solution.

**Project Context:**
${projectDescription || 'Not provided'}

**Stakeholders:**
${stakeholders.join(', ')}

**Flow Data:**
${JSON.stringify(flowData, null, 2)}

**Flow Types by Stakeholder:**
${JSON.stringify(flowTypes, null, 2)}

**Analysis Requirements:**
1. Identify all unique pages/screens needed based on the stakeholder flows
2. For each page, determine:
   - Primary purpose and function
   - Target stakeholders who will use it
   - Required UI elements (forms, buttons, displays, etc.)
   - Content that needs to be shown
   - User interactions available
   - Data inputs and outputs
   - Priority level

3. Consider these UI element types:
   - Headers/Navigation
   - Forms (input fields, dropdowns, checkboxes)
   - Buttons (submit, cancel, approve, reject)
   - Text displays (labels, descriptions, help text)
   - Data visualization (charts, graphs, dashboards)
   - Lists and tables (data grids, item lists)
   - Media elements (images, icons, uploads)
   - Interactive elements (modals, tooltips, search)
   - API integrations (data fetch, submit, real-time updates)

4. Map the flow connections between pages
5. Identify common elements that appear across multiple pages

**Output Format (JSON):**
{
  "projectContext": "brief summary of the project",
  "totalPages": number,
  "pageRequirements": [
    {
      "pageName": "descriptive page name",
      "pageType": "dashboard|form|list|detail|approval|management|reporting",
      "purpose": "what this page accomplishes",
      "stakeholders": ["list of stakeholders who use this page"],
      "contentElements": [
        {
          "type": "element type from list above",
          "label": "element name/title",
          "content": "specific content or placeholder text",
          "position": "where it appears on page",
          "required": true/false,
          "interactions": ["list of possible user actions"]
        }
      ],
      "userInteractions": ["list of main user actions on this page"],
      "dataRequirements": ["what data is needed/displayed"],
      "priority": "critical|high|medium|low"
    }
  ],
  "commonElements": [list of elements that appear on multiple pages],
  "userFlowConnections": [
    {"from": "page1", "to": "page2", "trigger": "what action causes navigation"}
  ],
  "dataFlowMap": [
    {"source": "where data comes from", "destination": "where it goes", "dataType": "type of data"}
  ]
}

Provide a comprehensive analysis that covers all stakeholder needs and business processes identified in the flow data.
`;
  }

  private parseAnalysisResult(analysisText: string, flowData: any, flowTypes: any): WireframeAnalysisResult {
    try {
      // Extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in analysis result');
      }

      const analysisResult = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance the result
      return {
        projectContext: analysisResult.projectContext || 'Project analysis based on stakeholder flows',
        totalPages: analysisResult.totalPages || analysisResult.pageRequirements?.length || 0,
        pageRequirements: this.validatePageRequirements(analysisResult.pageRequirements || []),
        commonElements: analysisResult.commonElements || [],
        userFlowConnections: analysisResult.userFlowConnections || [],
        dataFlowMap: analysisResult.dataFlowMap || []
      };
    } catch (error) {
      console.error('Error parsing analysis result:', error);
      
      // Fallback analysis based on available data
      return this.generateFallbackAnalysis(flowData, flowTypes);
    }
  }

  private validatePageRequirements(requirements: any[]): PageRequirement[] {
    return requirements.map(req => ({
      pageName: req.pageName || 'Unnamed Page',
      pageType: req.pageType || 'form',
      purpose: req.purpose || 'General purpose page',
      stakeholders: Array.isArray(req.stakeholders) ? req.stakeholders : [],
      contentElements: this.validateContentElements(req.contentElements || []),
      userInteractions: Array.isArray(req.userInteractions) ? req.userInteractions : [],
      dataRequirements: Array.isArray(req.dataRequirements) ? req.dataRequirements : [],
      priority: ['critical', 'high', 'medium', 'low'].includes(req.priority) ? req.priority : 'medium'
    }));
  }

  private validateContentElements(elements: any[]): ContentElement[] {
    const validTypes = ['header', 'form', 'button', 'text', 'image', 'list', 'table', 'chart', 'input', 'dropdown', 'modal', 'navigation', 'api-display', 'upload', 'search'];
    const validPositions = ['top', 'center', 'bottom', 'left', 'right', 'sidebar'];

    return elements.map(element => ({
      type: validTypes.includes(element.type) ? element.type : 'text',
      label: element.label || 'Content Element',
      content: element.content || 'Content placeholder',
      position: validPositions.includes(element.position) ? element.position : 'center',
      required: Boolean(element.required),
      interactions: Array.isArray(element.interactions) ? element.interactions : []
    }));
  }

  private generateFallbackAnalysis(flowData: any, flowTypes: any): WireframeAnalysisResult {
    const pageRequirements: PageRequirement[] = [];
    const stakeholders = Object.keys(flowTypes);
    
    // Generate basic pages from flow types
    Object.entries(flowTypes).forEach(([stakeholder, flows]: [string, any]) => {
      if (Array.isArray(flows)) {
        flows.forEach(flow => {
          pageRequirements.push({
            pageName: `${flow} Page`,
            pageType: this.inferPageType(flow),
            purpose: `Handle ${flow} process for ${stakeholder}`,
            stakeholders: [stakeholder],
            contentElements: this.generateBasicContentElements(flow),
            userInteractions: ['View', 'Submit', 'Navigate'],
            dataRequirements: ['User data', 'Process data'],
            priority: 'medium'
          });
        });
      }
    });

    return {
      projectContext: 'Generated from stakeholder flow analysis',
      totalPages: pageRequirements.length,
      pageRequirements,
      commonElements: [
        {
          type: 'navigation',
          label: 'Main Navigation',
          content: 'Site navigation menu',
          position: 'top',
          required: true,
          interactions: ['Navigate']
        }
      ],
      userFlowConnections: [],
      dataFlowMap: []
    };
  }

  private inferPageType(flowName: string): string {
    const flow = flowName.toLowerCase();
    if (flow.includes('dashboard') || flow.includes('overview')) return 'dashboard';
    if (flow.includes('approval') || flow.includes('review')) return 'approval';
    if (flow.includes('management') || flow.includes('admin')) return 'management';
    if (flow.includes('report') || flow.includes('analytics')) return 'reporting';
    if (flow.includes('form') || flow.includes('submit')) return 'form';
    if (flow.includes('list') || flow.includes('browse')) return 'list';
    return 'detail';
  }

  private generateBasicContentElements(flowName: string): ContentElement[] {
    return [
      {
        type: 'header',
        label: `${flowName} Header`,
        content: `${flowName} Management`,
        position: 'top',
        required: true,
        interactions: []
      },
      {
        type: 'form',
        label: 'Main Form',
        content: `${flowName} input form`,
        position: 'center',
        required: true,
        interactions: ['Submit', 'Reset']
      },
      {
        type: 'button',
        label: 'Submit Button',
        content: 'Submit',
        position: 'bottom',
        required: true,
        interactions: ['Click']
      }
    ];
  }
}

export function createWireframeAnalysisAgent(): WireframeAnalysisAgent {
  return new WireframeAnalysisAgent();
}
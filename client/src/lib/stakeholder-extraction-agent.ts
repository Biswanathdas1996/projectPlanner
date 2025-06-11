import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedStakeholder {
  name: string;
  role: string;
  type: 'internal' | 'external' | 'system';
  responsibilities: string[];
  interactions: string[];
  influence: 'high' | 'medium' | 'low';
  interest: 'high' | 'medium' | 'low';
  category: 'primary' | 'secondary' | 'key';
}

export interface StakeholderAnalysis {
  stakeholders: ExtractedStakeholder[];
  stakeholderMatrix: {
    primary: ExtractedStakeholder[];
    secondary: ExtractedStakeholder[];
    key: ExtractedStakeholder[];
  };
  totalCount: number;
  categories: Record<string, number>;
  flowTypes: Record<string, string[]>;
  recommendations: string[];
}

export class StakeholderExtractionAgent {
  private model: any;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1500;

  constructor() {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for stakeholder extraction');
    }
    
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.85,
        maxOutputTokens: 4096,
      }
    });
  }

  async extractStakeholdersFromProjectPlan(
    projectPlan: string,
    progressCallback?: (step: string, progress: number) => void
  ): Promise<StakeholderAnalysis> {
    
    progressCallback?.('Analyzing project plan structure', 10);
    
    // Clean and prepare the project plan text
    const cleanedPlan = this.cleanProjectPlanText(projectPlan);
    
    progressCallback?.('Identifying stakeholder patterns', 25);
    
    // Extract stakeholders using AI analysis
    const stakeholders = await this.identifyStakeholders(cleanedPlan);
    
    progressCallback?.('Categorizing stakeholders', 50);
    
    // Categorize and analyze stakeholders
    const categorizedStakeholders = this.categorizeStakeholders(stakeholders);
    
    progressCallback?.('Analyzing stakeholder relationships', 75);
    
    // Generate flow types and recommendations
    const flowTypes = this.generateFlowTypes(categorizedStakeholders);
    const recommendations = this.generateRecommendations(categorizedStakeholders);
    
    progressCallback?.('Finalizing stakeholder analysis', 100);
    
    return {
      stakeholders: categorizedStakeholders,
      stakeholderMatrix: this.createStakeholderMatrix(categorizedStakeholders),
      totalCount: categorizedStakeholders.length,
      categories: this.countCategories(categorizedStakeholders),
      flowTypes,
      recommendations
    };
  }

  private cleanProjectPlanText(projectPlan: string): string {
    // Remove HTML tags if present
    let cleaned = projectPlan.replace(/<[^>]*>/g, ' ');
    
    // Remove extra whitespace and normalize
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Remove common non-relevant patterns
    cleaned = cleaned.replace(/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi, ' ');
    
    return cleaned;
  }

  private async identifyStakeholders(projectPlan: string): Promise<ExtractedStakeholder[]> {
    const prompt = `
Analyze the following project plan and extract ALL stakeholders involved in the project. 
Be comprehensive and identify both obvious and implicit stakeholders.

Project Plan:
"${projectPlan.substring(0, 6000)}" ${projectPlan.length > 6000 ? '... [truncated]' : ''}

Extract stakeholders and return as JSON array with this exact structure:
[
  {
    "name": "Stakeholder Name",
    "role": "Their specific role/title",
    "type": "internal|external|system",
    "responsibilities": ["responsibility1", "responsibility2"],
    "interactions": ["interaction1", "interaction2"],
    "influence": "high|medium|low",
    "interest": "high|medium|low",
    "category": "primary|secondary|key"
  }
]

Include these stakeholder types:
- End Users (different user personas)
- Internal Team Members (developers, designers, managers, QA, DevOps)
- Business Stakeholders (product owners, executives, sales, marketing)
- External Partners (vendors, clients, regulatory bodies)
- System Stakeholders (databases, APIs, third-party services)
- Support Stakeholders (customer support, training, documentation)

Be thorough and extract 15-25 stakeholders minimum for a comprehensive analysis.
`;

    try {
      const result = await this.retryableRequest(() => this.model.generateContent(prompt));
      const response = result.response.text();
      const cleanedResponse = this.extractJsonFromResponse(response);
      const stakeholders = JSON.parse(cleanedResponse);
      
      return stakeholders.map((s: any) => this.validateStakeholder(s));
    } catch (error) {
      console.warn('Primary stakeholder extraction failed, using fallback method:', error);
      return this.extractStakeholdersFallback(projectPlan);
    }
  }

  private validateStakeholder(stakeholder: any): ExtractedStakeholder {
    return {
      name: stakeholder.name || 'Unknown Stakeholder',
      role: stakeholder.role || 'Unspecified Role',
      type: ['internal', 'external', 'system'].includes(stakeholder.type) ? stakeholder.type : 'internal',
      responsibilities: Array.isArray(stakeholder.responsibilities) ? stakeholder.responsibilities : [],
      interactions: Array.isArray(stakeholder.interactions) ? stakeholder.interactions : [],
      influence: ['high', 'medium', 'low'].includes(stakeholder.influence) ? stakeholder.influence : 'medium',
      interest: ['high', 'medium', 'low'].includes(stakeholder.interest) ? stakeholder.interest : 'medium',
      category: ['primary', 'secondary', 'key'].includes(stakeholder.category) ? stakeholder.category : 'secondary'
    };
  }

  private extractStakeholdersFallback(projectPlan: string): ExtractedStakeholder[] {
    const commonStakeholders = [
      { name: 'End Users', role: 'Primary Users', type: 'external', category: 'primary', influence: 'high', interest: 'high' },
      { name: 'Product Owner', role: 'Product Management', type: 'internal', category: 'key', influence: 'high', interest: 'high' },
      { name: 'Project Manager', role: 'Project Coordination', type: 'internal', category: 'key', influence: 'high', interest: 'high' },
      { name: 'Development Team', role: 'Software Development', type: 'internal', category: 'primary', influence: 'medium', interest: 'high' },
      { name: 'QA Engineers', role: 'Quality Assurance', type: 'internal', category: 'primary', influence: 'medium', interest: 'high' },
      { name: 'UI/UX Designers', role: 'User Experience Design', type: 'internal', category: 'primary', influence: 'medium', interest: 'high' },
      { name: 'System Administrators', role: 'Infrastructure Management', type: 'internal', category: 'secondary', influence: 'medium', interest: 'medium' },
      { name: 'Business Analysts', role: 'Requirements Analysis', type: 'internal', category: 'secondary', influence: 'medium', interest: 'high' },
      { name: 'Stakeholders', role: 'Business Decision Makers', type: 'internal', category: 'key', influence: 'high', interest: 'medium' },
      { name: 'Customer Support', role: 'User Support', type: 'internal', category: 'secondary', influence: 'low', interest: 'medium' }
    ];

    return commonStakeholders.map(s => ({
      ...s,
      responsibilities: [`Manage ${s.role.toLowerCase()}`, 'Ensure project success'],
      interactions: ['Project meetings', 'Status updates', 'Requirements review']
    } as ExtractedStakeholder));
  }

  private categorizeStakeholders(stakeholders: ExtractedStakeholder[]): ExtractedStakeholder[] {
    return stakeholders.map(stakeholder => {
      // Auto-categorize based on influence and interest
      if (stakeholder.influence === 'high' && stakeholder.interest === 'high') {
        stakeholder.category = 'key';
      } else if (stakeholder.influence === 'high' || stakeholder.interest === 'high') {
        stakeholder.category = 'primary';
      } else {
        stakeholder.category = 'secondary';
      }
      
      return stakeholder;
    });
  }

  private createStakeholderMatrix(stakeholders: ExtractedStakeholder[]) {
    return {
      primary: stakeholders.filter(s => s.category === 'primary'),
      secondary: stakeholders.filter(s => s.category === 'secondary'),
      key: stakeholders.filter(s => s.category === 'key')
    };
  }

  private countCategories(stakeholders: ExtractedStakeholder[]): Record<string, number> {
    const counts = { internal: 0, external: 0, system: 0 };
    stakeholders.forEach(s => {
      counts[s.type]++;
    });
    return counts;
  }

  private generateFlowTypes(stakeholders: ExtractedStakeholder[]): Record<string, string[]> {
    const flowTypes: Record<string, string[]> = {};
    
    stakeholders.forEach(stakeholder => {
      const flows = [];
      
      // Generate flow types based on stakeholder role and type
      if (stakeholder.name.toLowerCase().includes('user') || stakeholder.name.toLowerCase().includes('customer')) {
        flows.push('User Registration', 'User Login', 'Core Feature Usage', 'User Support');
      }
      
      if (stakeholder.name.toLowerCase().includes('admin') || stakeholder.role.toLowerCase().includes('admin')) {
        flows.push('Admin Dashboard', 'User Management', 'System Configuration', 'Reporting');
      }
      
      if (stakeholder.name.toLowerCase().includes('manager') || stakeholder.role.toLowerCase().includes('manager')) {
        flows.push('Project Planning', 'Team Coordination', 'Progress Monitoring', 'Resource Management');
      }
      
      if (stakeholder.type === 'system') {
        flows.push('API Integration', 'Data Processing', 'System Monitoring', 'Error Handling');
      }
      
      if (stakeholder.type === 'external') {
        flows.push('External Communication', 'Compliance Reporting', 'Partner Integration', 'Customer Feedback');
      }
      
      // Default flows if none specified
      if (flows.length === 0) {
        flows.push('Standard Workflow', 'Communication Flow', 'Feedback Process');
      }
      
      flowTypes[stakeholder.name] = flows;
    });
    
    return flowTypes;
  }

  private generateRecommendations(stakeholders: ExtractedStakeholder[]): string[] {
    const recommendations = [];
    
    const keyStakeholders = stakeholders.filter(s => s.category === 'key').length;
    const highInfluenceStakeholders = stakeholders.filter(s => s.influence === 'high').length;
    const externalStakeholders = stakeholders.filter(s => s.type === 'external').length;
    
    if (keyStakeholders > 5) {
      recommendations.push('Consider establishing a steering committee to manage the large number of key stakeholders');
    }
    
    if (highInfluenceStakeholders > 8) {
      recommendations.push('Implement a stakeholder engagement hierarchy to manage high-influence stakeholders effectively');
    }
    
    if (externalStakeholders > 3) {
      recommendations.push('Develop external stakeholder communication protocols and regular touchpoint schedules');
    }
    
    recommendations.push('Create detailed BPMN flows for each primary stakeholder to map their journey through the system');
    recommendations.push('Establish regular feedback loops with key stakeholders to ensure alignment throughout the project');
    recommendations.push('Consider stakeholder impact analysis for major project decisions and changes');
    
    return recommendations;
  }

  private async retryableRequest(requestFn: () => Promise<any>): Promise<any> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }
        console.warn(`Request attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  private extractJsonFromResponse(response: string): string {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    return jsonMatch ? jsonMatch[0] : response;
  }
}

export function createStakeholderExtractionAgent(): StakeholderExtractionAgent {
  return new StakeholderExtractionAgent();
}
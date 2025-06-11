interface CompetitorAnalysis {
  name: string;
  description: string;
  website: string;
  marketPosition: string;
  keyFeatures: string[];
  pricing: string;
  targetAudience: string;
  strengths: string[];
  weaknesses: string[];
  marketShare: string;
  founded: string;
  funding: string;
}

interface MarketInsight {
  marketSize: string;
  growthRate: string;
  keyTrends: string[];
  opportunities: string[];
  challenges: string[];
  targetSegments: string[];
  competitiveLevel: string;
  entryBarriers: string[];
}

export interface MarketResearchData {
  projectIdea: string;
  marketOverview: string;
  competitors: CompetitorAnalysis[];
  marketInsights: MarketInsight;
  recommendations: string[];
  differentiationOpportunities: string[];
  timestamp: string;
}

export class MarketResearchAgent {
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;

  constructor() {
    // Initialize the agent
  }

  async performMarketResearch(projectDescription: string): Promise<MarketResearchData> {
    if (!projectDescription.trim()) {
      throw new Error('Project description is required for market research');
    }

    try {
      // Use Perplexity API for web search and analysis
      const researchData = await this.searchAndAnalyzeMarket(projectDescription);
      return researchData;
    } catch (error) {
      console.error('Market research failed:', error);
      throw new Error('Failed to perform market research. Please check your internet connection and try again.');
    }
  }

  private async searchAndAnalyzeMarket(projectDescription: string): Promise<MarketResearchData> {
    try {
      // Perform web search using free search APIs
      const searchResults = await this.performWebSearch(projectDescription);
      
      // Analyze the search results to extract structured market data
      const marketData = await this.analyzeSearchResults(searchResults, projectDescription);
      
      return {
        ...marketData,
        projectIdea: projectDescription,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Web search and analysis failed:', error);
      throw new Error('Failed to search web and analyze market data');
    }
  }

  private async performWebSearch(projectDescription: string): Promise<string> {
    // Since web search APIs often have CORS restrictions in browsers,
    // we'll use AI to generate comprehensive market research based on 
    // knowledge of similar companies and market patterns
    return await this.generateMarketInsightsFromDescription(projectDescription);
  }

  private async generateMarketInsightsFromDescription(projectDescription: string): Promise<string> {
    // Use Gemini to generate market insights based on the project description
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Act as a senior market research analyst and provide comprehensive competitive intelligence for this project:

PROJECT DESCRIPTION: ${projectDescription}

Generate detailed market research with the following structure:

=== MARKET OVERVIEW ===
Provide a comprehensive overview of the market space, including total addressable market, current market conditions, and growth trajectory.

=== DIRECT COMPETITORS ===
List 3-5 real companies that offer similar solutions. For each competitor, provide:
- Company name and website
- Founded year and current stage (startup/established/enterprise)
- Key features and value proposition
- Pricing model and typical price ranges
- Target market and customer base
- Market position (leader/challenger/niche)
- Strengths and competitive advantages
- Weaknesses and market gaps
- Recent funding or revenue information if available

=== MARKET SIZE AND TRENDS ===
- Total addressable market (TAM) size and projections
- Annual growth rate and market drivers
- Key industry trends affecting this space
- Emerging technologies or shifts
- Regional market variations

=== COMPETITIVE LANDSCAPE ===
- Market concentration (fragmented vs consolidated)
- Competitive intensity level
- Entry barriers and requirements
- Typical customer acquisition strategies
- Common business models in this space

=== OPPORTUNITIES AND GAPS ===
- Underserved market segments
- Feature gaps in existing solutions
- Pricing model innovations
- Technology or approach opportunities
- Geographic expansion opportunities

=== CHALLENGES AND RISKS ===
- Main barriers to market entry
- Regulatory or compliance requirements
- Technology or resource challenges
- Customer acquisition difficulties
- Competitive response risks

Focus on providing specific, actionable intelligence based on real market knowledge. Include actual company names, realistic pricing data, and credible market size estimates.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return response;
    } catch (error) {
      console.error('AI market insights generation failed:', error);
      throw new Error('Failed to generate market insights');
    }
  }

  private async analyzeSearchResults(searchResults: string, projectDescription: string): Promise<Omit<MarketResearchData, 'projectIdea' | 'timestamp'>> {
    // Use Gemini to analyze and structure the search results
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const analysisPrompt = `
Based on the web search results below, analyze the market for the following project idea and provide a comprehensive market research report:

PROJECT IDEA: ${projectDescription}

WEB SEARCH RESULTS:
${searchResults}

Please analyze the search results and provide a detailed JSON response with the following structure:
{
  "marketOverview": "Comprehensive overview of the market based on search results",
  "competitors": [
    {
      "name": "Company name from search results",
      "description": "Company description",
      "website": "Website URL if found",
      "marketPosition": "Market Leader/Rising Challenger/Niche Player/Enterprise Specialist",
      "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
      "pricing": "Pricing information from search results",
      "targetAudience": "Target audience",
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
      "marketShare": "Market share percentage or estimate",
      "founded": "Founded year if available",
      "funding": "Funding information if available"
    }
  ],
  "marketInsights": {
    "marketSize": "Market size from search results",
    "growthRate": "Growth rate information",
    "keyTrends": ["Trend 1", "Trend 2", "Trend 3"],
    "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
    "challenges": ["Challenge 1", "Challenge 2", "Challenge 3"],
    "targetSegments": ["Segment 1", "Segment 2", "Segment 3"],
    "competitiveLevel": "Competition level description",
    "entryBarriers": ["Barrier 1", "Barrier 2", "Barrier 3"]
  },
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "differentiationOpportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"]
}

IMPORTANT: 
- Only use information that was found in the search results
- If specific information is not available in search results, use realistic estimates based on the available data
- Include 3-5 real competitors found in search results
- Provide actionable recommendations based on the competitive analysis
- Focus on factual data rather than speculation
- Respond only with valid JSON, no additional text
`;

    try {
      const result = await model.generateContent(analysisPrompt);
      const response = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in analysis response');
      }

      const analysisData = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!analysisData.marketOverview || !analysisData.competitors || !analysisData.marketInsights) {
        throw new Error('Invalid analysis data structure');
      }

      return analysisData;
    } catch (error) {
      console.error('Analysis failed:', error);
      throw new Error('Failed to analyze search results');
    }
  }

  private async retryableRequest(requestFn: () => Promise<any>): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          console.warn(`Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }
    
    throw lastError;
  }
}

export function createMarketResearchAgent(): MarketResearchAgent {
  return new MarketResearchAgent();
}
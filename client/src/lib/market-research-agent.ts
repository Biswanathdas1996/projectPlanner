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
    // Create search queries for different aspects of market research
    const searchQueries = [
      `companies similar to "${projectDescription}" competitors market`,
      `"${projectDescription}" market size industry analysis`,
      `competitors "${projectDescription}" pricing business model`,
      `startups "${projectDescription}" funding investment trends`
    ];

    let allResults = '';

    for (const query of searchQueries) {
      try {
        // Use DuckDuckGo Instant Answer API (free, no API key required)
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`);

        if (!response.ok) {
          throw new Error(`Search API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract relevant information from DuckDuckGo response
        let searchContent = '';
        
        if (data.Abstract) {
          searchContent += `Abstract: ${data.Abstract}\n`;
        }
        
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          searchContent += `Related Topics:\n`;
          data.RelatedTopics.slice(0, 5).forEach((topic: any, index: number) => {
            if (topic.Text) {
              searchContent += `${index + 1}. ${topic.Text}\n`;
            }
          });
        }

        if (data.Results && data.Results.length > 0) {
          searchContent += `Search Results:\n`;
          data.Results.slice(0, 3).forEach((result: any, index: number) => {
            if (result.Text) {
              searchContent += `${index + 1}. ${result.Text}\n`;
            }
          });
        }

        if (searchContent.trim()) {
          allResults += `\n\n=== ${query} ===\n${searchContent}`;
        }

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`Search query failed: ${query}`, error);
        // Continue with other queries even if one fails
      }
    }

    // If DuckDuckGo doesn't provide enough results, use AI to generate market insights
    if (!allResults.trim()) {
      allResults = await this.generateMarketInsightsFromDescription(projectDescription);
    }

    return allResults;
  }

  private async generateMarketInsightsFromDescription(projectDescription: string): Promise<string> {
    // Use Gemini to generate market insights based on the project description
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Generate comprehensive market research insights for the following project idea:

PROJECT: ${projectDescription}

Provide detailed market analysis including:
1. Similar existing companies and solutions in this space
2. Market size estimates and growth trends
3. Competitive landscape analysis
4. Pricing models commonly used
5. Target market segments
6. Key market trends and opportunities
7. Common challenges and barriers to entry

Focus on realistic, industry-standard information based on similar successful companies and market patterns.
Be specific about company names, pricing ranges, and market data where possible.
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
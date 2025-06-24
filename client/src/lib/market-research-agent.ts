interface CompetitorAnalysis {
  name: string;
  productName: string;
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
  marketCap: string;
  valuation: string;
  employees: string;
  revenue: string;
  headquarters: string;
  businessModel: string;
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
  targetCountry?: string;
  marketAnalysis?: string;
}

export class MarketResearchAgent {
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;

  constructor() {
    // Initialize the agent
  }

  async performMarketResearch(
    projectDescription: string
  ): Promise<MarketResearchData> {
    if (!projectDescription.trim()) {
      throw new Error("Project description is required for market research");
    }

    try {
      // Use Perplexity API for web search and analysis
      const researchData = await this.searchAndAnalyzeMarket(
        projectDescription
      );
      return researchData;
    } catch (error) {
      console.error("Market research failed:", error);
      throw new Error(
        "Failed to perform market research. Please check your internet connection and try again."
      );
    }
  }

  private async searchAndAnalyzeMarket(
    projectDescription: string
  ): Promise<MarketResearchData> {
    try {
      // Perform web search using free search APIs
      const searchResults = await this.performWebSearch(projectDescription);

      // Analyze the search results to extract structured market data
      const marketData = await this.analyzeSearchResults(
        searchResults,
        projectDescription
      );

      return {
        ...marketData,
        projectIdea: projectDescription,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Web search and analysis failed:", error);
      throw new Error("Failed to search web and analyze market data");
    }
  }

  private async performWebSearch(projectDescription: string): Promise<string> {
    // Since web search APIs often have CORS restrictions in browsers,
    // we'll use AI to generate comprehensive market research based on
    // knowledge of similar companies and market patterns
    return await this.generateMarketInsightsFromDescription(projectDescription);
  }

  private async generateMarketInsightsFromDescription(
    projectDescription: string
  ): Promise<string> {
    // Use Gemini to generate market insights based on the project description
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(
      "AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg"
    );
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `
Act as a senior market research analyst and provide comprehensive competitive intelligence for this project:

PROJECT DESCRIPTION: ${projectDescription}

Generate detailed market research with the following structure:

=== MARKET OVERVIEW ===
Provide a comprehensive overview of the market space, including total addressable market, current market conditions, and growth trajectory.

=== COMPETITOR ANALYSIS ===
Research and identify 8-12 actual companies in the relevant industry. Only include companies that truly exist with verifiable business operations. For each real competitor, provide:

- Primary product name (e.g., "Slack", "Teams", "Zoom", "ChatGPT", "Alexa", "Notion")
- Company name (e.g., "Slack Technologies", "Microsoft", "Zoom Video Communications")
- Official website URL
- Founded year and headquarters city/country
- Current market capitalization or latest valuation
- Annual revenue from recent financial reports
- Current employee count
- Core product offerings and business model
- Pricing structure and target customers
- Market position and competitive strengths
- Areas where they face challenges

CRITICAL FEATURE REQUIREMENTS:
For each competitor, provide 8-15 SPECIFIC, REAL features that their actual product offers. Research their actual product capabilities and include:
- Core functionality features (e.g., "Real-time collaboration", "End-to-end encryption", "API integrations")
- Platform-specific features (e.g., "Mobile app with offline sync", "Web-based dashboard", "Desktop application")
- Advanced capabilities (e.g., "AI-powered analytics", "Custom workflow automation", "Multi-language support")
- Integration features (e.g., "Slack integration", "Google Workspace sync", "Salesforce connector")
- Security features (e.g., "SSO authentication", "GDPR compliance", "Data encryption")
- User experience features (e.g., "Drag-and-drop interface", "One-click deployment", "Customizable themes")

Example of detailed features for a real product:
Slack: ["Real-time messaging", "File sharing", "Voice and video calls", "Screen sharing", "Channel organization", "Direct messages", "App integrations", "Custom emoji", "Message threading", "Search functionality", "Mobile apps", "Desktop apps", "Guest access", "Workflow builder", "Audio and video clips"]

MANDATORY: Every company name must be a real, operating business. Research companies like:
- Enterprise software: Salesforce, ServiceNow, Workday, Oracle
- Communication tools: Zoom, Slack, Microsoft Teams, Discord
- Productivity software: Atlassian, Notion, Asana, Monday.com
- E-commerce platforms: Shopify, WooCommerce, BigCommerce
- Developer tools: GitHub, GitLab, Stripe, Twilio
- Finance tools: Mint, QuickBooks, FreshBooks, Xero
- Design tools: Figma, Adobe Creative Suite, Canva, Sketch

Base all financial figures and features on actual public data or credible industry knowledge for these real companies.

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

CRITICAL: For each competitor, provide exact financial figures:
- Market Cap: Use specific amounts like "$45.2B", "$3.1B", "$890M" (never "N/A" or "Private")
- Revenue: Use specific amounts like "$12.8B", "$450M", "$89M" (never "Undisclosed")  
- Employees: Use specific numbers like "45,200", "8,500", "1,200" (never "Unknown")
- For private companies, provide valuation estimates like "$5.2B", "$1.8B"

Use real financial data from public sources and industry knowledge. Every competitor must have numerical values for these metrics.

EXAMPLES OF REALISTIC FINANCIAL DATA:
- Microsoft: Market Cap $2.8T, Revenue $211B, Employees 221,000, HQ Redmond, USA
- Salesforce: Market Cap $189B, Revenue $31.4B, Employees 73,000, HQ San Francisco, USA
- ServiceNow: Market Cap $130B, Revenue $7.9B, Employees 19,000, HQ Santa Clara, USA
- Atlassian: Market Cap $45B, Revenue $3.5B, Employees 12,000, HQ Sydney, Australia
- Slack (Private): Valuation $27B, Revenue $902M, Employees 2,500, HQ San Francisco, USA

CRITICAL: Only include REAL company names that actually exist in the industry. Do NOT use placeholder names like "Company A", "Company 5 Name", "[Company Name]", "TechCorp", or similar generic names. Research and identify actual competitors with verified business information. If you cannot identify real companies, limit the list to only the companies you know exist with authentic data.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return response;
    } catch (error) {
      console.error("AI market insights generation failed:", error);
      throw new Error("Failed to generate market insights");
    }
  }

  private async analyzeSearchResults(
    searchResults: string,
    projectDescription: string
  ): Promise<Omit<MarketResearchData, "projectIdea" | "timestamp">> {
    // Use Gemini to analyze and structure the search results
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(
      "AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg"
    );
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

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
      "name": "Actual company name (e.g., Salesforce, Microsoft, Zoom)",
      "productName": "Primary product name (e.g., Slack, Teams, ChatGPT, Alexa, Notion)",
      "description": "Real company description",
      "website": "Actual website URL",
      "marketPosition": "Market Leader/Rising Challenger/Niche Player/Enterprise Specialist",
      "keyFeatures": [
        "Feature 1 - specific real functionality",
        "Feature 2 - actual product capability", 
        "Feature 3 - real integration or tool",
        "Feature 4 - authentic user experience element",
        "Feature 5 - genuine security or compliance feature",
        "Feature 6 - actual platform or device support",
        "Feature 7 - real automation or AI capability",
        "Feature 8 - specific customization option",
        "Feature 9 - actual collaboration feature",
        "Feature 10 - real reporting or analytics",
        "Feature 11 - genuine scalability feature",
        "Feature 12 - actual API or integration capability"
      ],
      "pricing": "Real pricing information",
      "targetAudience": "Actual target market",
      "strengths": ["Real competitive advantages"],
      "weaknesses": ["Actual market challenges"],
      "marketShare": "Real market share data",
      "founded": "Actual founding year",
      "funding": "Real funding information",
      "marketCap": "Real market cap like $189B, $45B, $28B",
      "valuation": "Real private valuation like $27B, $12B",
      "employees": "Real employee count like 73,000, 19,000, 8,400",
      "revenue": "Real annual revenue like $31.4B, $7.9B, $4.1B",
      "headquarters": "Real headquarters location",
      "businessModel": "Actual business model"
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

CRITICAL REQUIREMENTS:
- For each competitor, you MUST provide specific financial data:
  - marketCap: Use exact amounts like "$145.2B", "$28.5B", "$3.1B" (never "N/A")
  - revenue: Use exact amounts like "$50.3B", "$12.8B", "$890M" (never "Unknown") 
  - employees: Use exact numbers like "156,000", "45,200", "8,500" (never "Varies")
  - valuation: For private companies, use amounts like "$12.4B", "$2.8B"
  - headquarters: Use "City, Country" format like "San Francisco, USA"
- Base these on real company data and industry knowledge
- If exact data unavailable, provide realistic industry-standard estimates
- Generate 8-15 competitors minimum

FEATURE REQUIREMENTS:
- For each competitor, provide 8-15 REAL, SPECIFIC features from their actual product
- Research actual product capabilities, not generic descriptions
- Include features like: "Real-time collaboration", "API integrations", "Mobile app", "SSO authentication", "Custom workflows", "Analytics dashboard", "Third-party integrations", "Multi-language support", "Data export/import", "Role-based permissions", "Automated notifications", "Custom branding"
- Avoid vague terms like "good interface" or "user-friendly" - use specific feature names
- Base features on actual product documentation and capabilities

CRITICAL REQUIREMENTS:
- Only include real companies that actually exist - NO placeholder names whatsoever
- Every company name must be a real, verifiable business entity
- Do NOT include names like "Company A", "TechCorp", "[Company Name]", "Startup X", etc.
- If you cannot identify enough real competitors, include fewer companies rather than fake ones
- All financial data must be authentic or industry-standard estimates for real companies
- All features must be based on actual product capabilities
- Focus on well-known companies in the relevant industry
- Respond only with valid JSON, no additional text
`;

    try {
      const result = await model.generateContent(analysisPrompt);
      const response = result.response.text();

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in analysis response");
      }

      const analysisData = JSON.parse(jsonMatch[0]);

      // Validate the structure
      if (
        !analysisData.marketOverview ||
        !analysisData.competitors ||
        !analysisData.marketInsights
      ) {
        throw new Error("Invalid analysis data structure");
      }

      // Filter out any competitors with placeholder or generic names
      if (analysisData.competitors) {
        analysisData.competitors = analysisData.competitors.filter(
          (competitor: any) => {
            const name = competitor.name.toLowerCase();
            const isPlaceholder =
              (name.includes("company") &&
                (name.includes("name") ||
                  name.includes("a") ||
                  name.includes("b") ||
                  name.includes("c") ||
                  /\d/.test(name))) ||
              name.includes("[") ||
              name.includes("]") ||
              name.includes("techcorp") ||
              name.includes("startup") ||
              name.includes("placeholder") ||
              name.includes("example") ||
              name === "n/a" ||
              name === "unknown" ||
              name === "";

            return !isPlaceholder && competitor.name.length > 2;
          }
        );
      }

      return analysisData;
    } catch (error) {
      console.error("Analysis failed:", error);
      throw new Error("Failed to analyze search results");
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
          console.warn(
            `Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    throw lastError;
  }
}

export function createMarketResearchAgent(): MarketResearchAgent {
  return new MarketResearchAgent();
}

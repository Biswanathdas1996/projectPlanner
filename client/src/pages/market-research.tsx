import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { NavigationBar } from "@/components/navigation-bar";
import { WorkflowProgress } from "@/components/workflow-progress";
import {
  createMarketResearchAgent,
  type MarketResearchData,
} from "@/lib/market-research-agent";
import {
  getMarketResearchData,
  saveMarketResearchData,
  clearMarketResearchData,
  getProjectDescription,
} from "@/lib/storage-utils";
import { Link } from "wouter";
import {
  Search,
  Globe,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  ExternalLink,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle,
  ArrowLeft,
  Lightbulb,
  BarChart3,
  Target,
  Zap,
  Star,
  Eye,
  Download,
  Copy,
} from "lucide-react";

// Country list for market research
const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Netherlands", "Sweden", "Norway", "Denmark",
  "Switzerland", "Austria", "Belgium", "Ireland", "Finland", "Italy", "Spain", "Portugal", "Japan", "South Korea",
  "Singapore", "Hong Kong", "New Zealand", "Israel", "United Arab Emirates", "Saudi Arabia", "Brazil", "Mexico", "Argentina", "Chile",
  "Colombia", "Peru", "India", "China", "Thailand", "Malaysia", "Indonesia", "Philippines", "Vietnam", "Taiwan",
  "Poland", "Czech Republic", "Hungary", "Romania", "Bulgaria", "Croatia", "Slovenia", "Estonia", "Latvia", "Lithuania",
  "South Africa", "Nigeria", "Kenya", "Egypt", "Morocco", "Ghana", "Turkey", "Russia", "Ukraine", "Belarus"
];

export default function MarketResearch() {
  const [projectInput, setProjectInput] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [isResearching, setIsResearching] = useState(false);
  const [researchData, setResearchData] = useState<MarketResearchData | null>(
    null,
  );
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState<
    "input" | "research" | "results"
  >("input");
  
  // Pagination state for competitor analysis
  const [currentPage, setCurrentPage] = useState(1);
  const competitorsPerPage = 6;

  // Helper function to convert market cap string to number for sorting
  const parseMarketCap = (marketCap: string): number => {
    if (!marketCap) return 0;
    const cleanValue = marketCap.toLowerCase().replace(/[^0-9.]/g, '');
    const numValue = parseFloat(cleanValue);
    if (marketCap.toLowerCase().includes('trillion')) return numValue * 1000000;
    if (marketCap.toLowerCase().includes('billion')) return numValue * 1000;
    if (marketCap.toLowerCase().includes('million')) return numValue;
    return numValue;
  };

  // Sort competitors by market cap in descending order
  const sortedCompetitors = researchData?.competitors ? 
    [...researchData.competitors].sort((a, b) => parseMarketCap(b.marketCap) - parseMarketCap(a.marketCap)) : [];

  // Calculate pagination
  const totalPages = Math.ceil(sortedCompetitors.length / competitorsPerPage);
  const startIndex = (currentPage - 1) * competitorsPerPage;
  const endIndex = startIndex + competitorsPerPage;
  const currentCompetitors = sortedCompetitors.slice(startIndex, endIndex);

  // Load project input and existing research from localStorage
  useEffect(() => {
    const savedProjectDescription = getProjectDescription();
    const savedResearchData = getMarketResearchData();

    if (savedProjectDescription) {
      setProjectInput(savedProjectDescription);
    }

    if (savedResearchData) {
      setResearchData(savedResearchData);
      setCurrentStep("results");
    } else if (savedProjectDescription) {
      setCurrentStep("input");
    }
  }, []);

  const performMarketResearch = async () => {
    if (!projectInput.trim()) return;

    setIsResearching(true);
    setError("");
    setCurrentStep("research");

    try {
      const marketResearchAgent = createMarketResearchAgent();
      const researchPrompt = `${projectInput}\n\nFocus research specifically on the ${selectedCountry} market. Include country-specific competitors, market conditions, regulations, and opportunities.`;
      const researchData =
        await marketResearchAgent.performMarketResearch(researchPrompt);

      // Add country information to the research data
      const countrySpecificData = {
        ...researchData,
        targetCountry: selectedCountry,
        marketAnalysis: `${researchData.marketOverview}\n\nTarget Market: ${selectedCountry}`
      };

      setResearchData(countrySpecificData);
      setCurrentStep("results");

      // Save to localStorage using storage utilities
      saveMarketResearchData(countrySpecificData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to perform market research";
      setError(errorMessage);
      setCurrentStep("input");
    } finally {
      setIsResearching(false);
    }
  };

  const resetResearch = () => {
    setCurrentStep("input");
    setResearchData(null);
    setError("");

    // Clear localStorage data
    clearMarketResearchData();
  };

  const exportResearchData = () => {
    if (!researchData) return;

    const dataStr = JSON.stringify(researchData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `market-research-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyResearchData = () => {
    if (!researchData) return;

    const formattedData = `
# Market Research Report
**Project:** ${researchData.projectIdea}
**Generated:** ${new Date(researchData.timestamp).toLocaleString()}

## Market Overview
${researchData.marketOverview}

## Market Insights
- **Market Size:** ${researchData.marketInsights.marketSize}
- **Growth Rate:** ${researchData.marketInsights.growthRate}
- **Competitive Level:** ${researchData.marketInsights.competitiveLevel}

## Key Competitors
${researchData.competitors
  .map(
    (comp) => `
**${comp.name}** (${comp.marketPosition})
- ${comp.description}
- Market Share: ${comp.marketShare}
- Pricing: ${comp.pricing}
- Key Features: ${comp.keyFeatures.join(", ")}
`,
  )
  .join("\n")}

## Recommendations
${researchData.recommendations.map((rec) => `- ${rec}`).join("\n")}

## Differentiation Opportunities
${researchData.differentiationOpportunities.map((opp) => `- ${opp}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(formattedData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NavigationBar title="Market Research Agent" showBackButton={true} />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <WorkflowProgress currentStep="research" />

        {/* Data Status Indicator */}
        {researchData && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">
                Market Research Available
              </p>
              <p className="text-green-700 text-sm">
                Research completed on{" "}
                {new Date(researchData.timestamp).toLocaleDateString()} at{" "}
                {new Date(researchData.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <Button
              onClick={resetResearch}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              New Research
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Project Input */}
        {currentStep === "input" && (
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Search className="h-4 w-4 text-white" />
                </div>
                Market Research Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <p className="text-gray-600">
                Enter your project idea and I'll search the web for similar
                solutions, analyze competitors, and provide market insights to
                help you understand the competitive landscape.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="country-select" className="text-sm font-medium text-gray-700">
                    Target Market Country
                  </Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={isResearching}>
                    <SelectTrigger id="country-select" className="w-full">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-description" className="text-sm font-medium text-gray-700">
                    Project Description
                  </Label>
                  <Textarea
                    id="project-description"
                    placeholder="Describe your project idea... (e.g., Create a project management tool for remote teams with time tracking and collaboration features)"
                    value={projectInput}
                    onChange={(e) => setProjectInput(e.target.value)}
                    className="min-h-32 text-sm"
                    disabled={isResearching}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-xs text-gray-400">
                  {projectInput.length}/2000 characters
                </div>
                <Button
                  onClick={performMarketResearch}
                  disabled={!projectInput.trim() || isResearching}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-sm"
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3 mr-2" />
                      Start Market Research
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Research Progress */}
        {currentStep === "research" && (
          <Card className="mb-6">
            <CardContent className="py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Researching Market Landscape
                </h3>
                <p className="text-gray-600 mb-2">
                  Analyzing competitors, market trends, and opportunities for
                  your project idea...
                </p>
                <p className="text-sm text-blue-600 font-medium mb-6">
                  Focusing on {selectedCountry} market
                </p>
                <div className="flex flex-col gap-3 max-w-md mx-auto">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    Searching for similar solutions
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Globe className="h-4 w-4 text-gray-400" />
                    Analyzing competitor landscape
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    Gathering market insights
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Research Results */}
        {currentStep === "results" && researchData && (
          <div className="space-y-6">
            {/* Research Summary */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div>Market Research Results</div>
                      {researchData.targetCountry && (
                        <div className="text-sm font-normal text-blue-600 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {researchData.targetCountry} Market
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={copyResearchData}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Report
                    </Button>
                    <Button
                      onClick={exportResearchData}
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-gray max-w-none">
                  <h3 className="text-lg font-semibold mb-3">
                    Market Overview
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {researchData.marketOverview}
                  </p>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">
                          Market Size
                        </span>
                      </div>
                      <p className="text-green-700">
                        {researchData.marketInsights.marketSize}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">
                          Growth Rate
                        </span>
                      </div>
                      <p className="text-blue-700">
                        {researchData.marketInsights.growthRate}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-800">
                          Competition
                        </span>
                      </div>
                      <p className="text-purple-700">
                        {researchData.marketInsights.competitiveLevel}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitor Analysis */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Users className="h-6 w-6 text-orange-600" />
                  Competitor Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Competitors Header with Count */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sortedCompetitors.length} Competitors Found
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      Sorted by Market Cap
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {currentCompetitors.map((competitor, index) => (
                    <div
                      key={startIndex + index}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all duration-200 bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {competitor.name}
                            </h4>
                            {competitor.website && (
                              <a
                                href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title={`Visit ${competitor.name} website`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {competitor.marketPosition}
                          </Badge>
                          {competitor.website && (
                            <div className="mt-2">
                              <a
                                href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                              >
                                {competitor.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        {competitor.description}
                      </p>

                      {/* Business Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Market Cap</div>
                          <div className="font-semibold text-green-600">{competitor.marketCap || 'N/A'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Revenue</div>
                          <div className="font-semibold text-blue-600">{competitor.revenue || 'N/A'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Founded</div>
                          <div className="font-semibold text-gray-700">{competitor.founded || 'N/A'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Employees</div>
                          <div className="font-semibold text-purple-600">{competitor.employees || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Additional Business Info */}
                      {(competitor.headquarters || competitor.valuation) && (
                        <div className="mb-4 space-y-2">
                          {competitor.headquarters && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{competitor.headquarters}</span>
                            </div>
                          )}
                          {competitor.valuation && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">Valuation: {competitor.valuation}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Market Share:</span>
                          <span className="font-medium">
                            {competitor.marketShare}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pricing:</span>
                          <span className="font-medium">
                            {competitor.pricing}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Founded:</span>
                          <span className="font-medium">
                            {competitor.founded}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="mb-2">
                          <span className="text-xs font-medium text-green-700">
                            Strengths:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {competitor.strengths
                              .slice(0, 2)
                              .map((strength, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs bg-green-50 border-green-200 text-green-700"
                                >
                                  {strength}
                                </Badge>
                              ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-medium text-red-700">
                            Weaknesses:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {competitor.weaknesses
                              .slice(0, 2)
                              .map((weakness, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs bg-red-50 border-red-200 text-red-700"
                                >
                                  {weakness}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, sortedCompetitors.length)} of {sortedCompetitors.length} competitors
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Opportunities */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Lightbulb className="h-5 w-5 text-green-600" />
                    Market Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {researchData.marketInsights.opportunities.map(
                      (opportunity, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {opportunity}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Key Trends */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Key Market Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {researchData.marketInsights.keyTrends.map(
                      (trend, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{trend}</span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Star className="h-6 w-6 text-purple-600" />
                  Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Key Recommendations
                    </h4>
                    <div className="space-y-3">
                      {researchData.recommendations.map(
                        (recommendation, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-purple-600">
                                {index + 1}
                              </span>
                            </div>
                            <span className="text-sm text-gray-700">
                              {recommendation}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Differentiation Opportunities
                    </h4>
                    <div className="space-y-2">
                      {researchData.differentiationOpportunities.map(
                        (opportunity, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="mr-2 mb-2 bg-indigo-50 border-indigo-200 text-indigo-700"
                          >
                            {opportunity}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Button
                variant="outline"
                onClick={resetResearch}
                className="border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                New Research
              </Button>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/plan">
                  <Button
                    variant="outline"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Project Plan
                  </Button>
                </Link>

                <Link href="/user-journey">
                  <Button
                    variant="outline"
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    User Journey Flows
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { BrandGuideline } from "./brand-guideline-extractor";
import { ComprehensiveBrandAnalysis, AgenticPDFRAGAgent } from "./agentic-pdf-rag-agent";
import { BrowserVectorRAG, VectorSearchResult, KeyPoint } from "./browser-vector-rag";

export interface EnhancedBrandAnalysis extends ComprehensiveBrandAnalysis {
  vectorSearchResults: VectorSearchResult;
  enhancedKeyPoints: {
    brandClauses: KeyPoint[];
    designGuidelines: KeyPoint[];
    colorSpecs: KeyPoint[];
    typographyRules: KeyPoint[];
    logoGuidelines: KeyPoint[];
    complianceRules: KeyPoint[];
  };
  analysisMetadata: {
    agenticAnalysisTime: number;
    vectorSearchTime: number;
    totalProcessingTime: number;
    keyPointsExtracted: number;
    confidenceScore: number;
  };
}

export class EnhancedRAGExtractor {
  private agenticAgent: AgenticPDFRAGAgent;
  private vectorRAG: BrowserVectorRAG;

  constructor() {
    this.agenticAgent = new AgenticPDFRAGAgent();
    this.vectorRAG = new BrowserVectorRAG();
  }

  async performEnhancedBrandAnalysis(file: File): Promise<{
    brandGuidelines: BrandGuideline;
    enhancedAnalysis: EnhancedBrandAnalysis;
  }> {
    const startTime = Date.now();
    console.log('🚀 Starting enhanced RAG analysis for:', file.name);

    try {
      // Phase 1: Agentic PDF RAG Analysis
      console.log('📄 Phase 1: Performing comprehensive agentic analysis...');
      const agenticStartTime = Date.now();
      const comprehensiveAnalysis = await this.agenticAgent.performComprehensiveRAGAnalysis(file);
      const agenticAnalysisTime = Date.now() - agenticStartTime;

      // Phase 2: MongoDB Vector Search Analysis
      console.log('🔍 Phase 2: Performing MongoDB vector search analysis...');
      const vectorStartTime = Date.now();
      const vectorResults = await this.vectorRAG.processDocument(file);
      const vectorSearchTime = Date.now() - vectorStartTime;

      // Phase 3: Consolidate and enhance findings
      console.log('🔗 Phase 3: Consolidating and enhancing findings...');
      const enhancedKeyPoints = this.categorizeKeyPoints(vectorResults.keyPoints);
      const enhancedBrandGuidelines = this.synthesizeBrandGuidelines(comprehensiveAnalysis, vectorResults);

      const totalProcessingTime = Date.now() - startTime;
      const keyPointsExtracted = vectorResults.keyPoints.length;
      const confidenceScore = this.calculateOverallConfidence(comprehensiveAnalysis, vectorResults);

      const enhancedAnalysis: EnhancedBrandAnalysis = {
        ...comprehensiveAnalysis,
        vectorSearchResults: vectorResults,
        enhancedKeyPoints,
        analysisMetadata: {
          agenticAnalysisTime,
          vectorSearchTime,
          totalProcessingTime,
          keyPointsExtracted,
          confidenceScore
        }
      };

      console.log('✅ Enhanced RAG analysis completed:', {
        totalTime: totalProcessingTime,
        keyPoints: keyPointsExtracted,
        confidence: Math.round(confidenceScore * 100) + '%'
      });

      return {
        brandGuidelines: enhancedBrandGuidelines,
        enhancedAnalysis
      };

    } catch (error) {
      console.error('Enhanced RAG analysis failed:', error);
      throw new Error('Failed to perform enhanced brand analysis');
    } finally {
      await this.vectorRAG.disconnect();
    }
  }

  private categorizeKeyPoints(keyPoints: KeyPoint[]): EnhancedBrandAnalysis['enhancedKeyPoints'] {
    const categorized = {
      brandClauses: [],
      designGuidelines: [],
      colorSpecs: [],
      typographyRules: [],
      logoGuidelines: [],
      complianceRules: []
    } as EnhancedBrandAnalysis['enhancedKeyPoints'];

    for (const point of keyPoints) {
      switch (point.category) {
        case 'brand_clause':
          categorized.brandClauses.push(point);
          break;
        case 'design_guideline':
          categorized.designGuidelines.push(point);
          break;
        case 'color_spec':
          categorized.colorSpecs.push(point);
          break;
        case 'typography_rule':
          categorized.typographyRules.push(point);
          break;
        case 'logo_guideline':
          categorized.logoGuidelines.push(point);
          break;
        case 'compliance_rule':
          categorized.complianceRules.push(point);
          break;
      }
    }

    return categorized;
  }

  private synthesizeBrandGuidelines(
    comprehensiveAnalysis: ComprehensiveBrandAnalysis,
    vectorResults: VectorSearchResult
  ): BrandGuideline {
    const consolidatedFindings = comprehensiveAnalysis.consolidatedFindings;
    
    // Extract colors from both analyses
    const colors = this.extractColors(consolidatedFindings.allColorSpecs, vectorResults.keyPoints);
    
    // Extract typography from both analyses
    const typography = this.extractTypography(consolidatedFindings.allTypographyRules, vectorResults.keyPoints);
    
    // Extract logos information
    const logos = this.extractLogos(consolidatedFindings.allLogoUsageRules, vectorResults.keyPoints);

    // Synthesize key clauses and points
    const keyClauses = consolidatedFindings.allKeyBrandClauses.slice(0, 10);
    const keyPoints = vectorResults.keyPoints.filter(p => p.category === 'brand_clause').map(p => p.content);
    const keyHighlights = consolidatedFindings.criticalRequirements.slice(0, 8);

    return {
      colors,
      typography,
      logos,
      keyClauses,
      keyPoints,
      keyHighlights,
      brandValues: consolidatedFindings.brandThemes.slice(0, 6),
      designPrinciples: consolidatedFindings.allDesignGuidelines.slice(0, 8),
      layout: {
        spacing: consolidatedFindings.allSpacingSpecs.slice(0, 6),
        gridSystems: [],
        breakpoints: []
      },
      components: {
        buttons: { primary: '', secondary: '', borderRadius: '', fontWeight: '' },
        cards: { design: '', borderRadius: '', spacing: '' },
        navigation: { primaryNav: '', mobileNav: '', states: '' },
        forms: { inputStyles: '', labelStyles: '' }
      },
      accessibility: {
        contrast: consolidatedFindings.allComplianceNotes.filter(note => 
          note.toLowerCase().includes('contrast') || note.toLowerCase().includes('accessibility')
        ).slice(0, 3),
        compliance: consolidatedFindings.consolidatedDosAndDonts.dos.slice(0, 5)
      }
    };
  }

  private extractColors(colorSpecs: string[], keyPoints: KeyPoint[]) {
    const colorKeyPoints = keyPoints.filter(p => p.category === 'color_spec');
    const allColorData = [...colorSpecs, ...colorKeyPoints.map(p => p.content)];
    
    const primary: string[] = [];
    const secondary: string[] = [];
    const accent: string[] = [];
    
    for (const spec of allColorData) {
      const specLower = spec.toLowerCase();
      
      // Extract hex colors
      const hexMatches = spec.match(/#[0-9A-Fa-f]{6}/g);
      if (hexMatches) {
        if (specLower.includes('primary')) {
          primary.push(...hexMatches);
        } else if (specLower.includes('secondary')) {
          secondary.push(...hexMatches);
        } else if (specLower.includes('accent')) {
          accent.push(...hexMatches);
        } else {
          primary.push(...hexMatches.slice(0, 2));
        }
      }
      
      // Extract RGB colors
      const rgbMatches = spec.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g);
      if (rgbMatches && rgbMatches.length <= 3) {
        if (specLower.includes('primary')) {
          primary.push(...rgbMatches);
        } else {
          secondary.push(...rgbMatches);
        }
      }
    }

    return {
      primary: [...new Set(primary)].slice(0, 3),
      secondary: [...new Set(secondary)].slice(0, 3),
      accent: [...new Set(accent)].slice(0, 2),
      text: ['#000000', '#333333'],
      background: ['#FFFFFF', '#F8F9FA']
    };
  }

  private extractTypography(typographyRules: string[], keyPoints: KeyPoint[]) {
    const typographyKeyPoints = keyPoints.filter(p => p.category === 'typography_rule');
    const allTypographyData = [...typographyRules, ...typographyKeyPoints.map(p => p.content)];
    
    const fonts: string[] = [];
    const weights: string[] = [];
    const sizes: string[] = [];
    
    for (const rule of allTypographyData) {
      // Extract font families
      const fontMatches = rule.match(/([A-Z][a-z]+(\s+[A-Z][a-z]+)*)\s*(font|typeface)/gi);
      if (fontMatches) {
        fonts.push(...fontMatches.map(f => f.replace(/\s*(font|typeface)/gi, '').trim()));
      }
      
      // Extract font weights
      const weightMatches = rule.match(/(bold|regular|light|medium|thin|black|heavy|\d00)/gi);
      if (weightMatches) {
        weights.push(...weightMatches);
      }
      
      // Extract font sizes
      const sizeMatches = rule.match(/(\d+)(px|pt|em|rem)/gi);
      if (sizeMatches) {
        sizes.push(...sizeMatches);
      }
    }

    return {
      fonts: [...new Set(fonts)].slice(0, 4),
      weights: [...new Set(weights)].slice(0, 5),
      sizes: [...new Set(sizes)].slice(0, 6),
      lineHeights: ['1.2', '1.4', '1.6'],
      fontFamilies: {
        primary: fonts[0] || 'system-ui, sans-serif',
        heading: fonts[0] || 'system-ui, sans-serif',
        body: fonts[1] || 'system-ui, sans-serif'
      },
      headingStyles: allTypographyData.filter(rule => 
        rule.toLowerCase().includes('heading') || rule.toLowerCase().includes('title')
      ).slice(0, 4)
    };
  }

  private extractLogos(logoRules: string[], keyPoints: KeyPoint[]) {
    const logoKeyPoints = keyPoints.filter(p => p.category === 'logo_guideline');
    const allLogoData = [...logoRules, ...logoKeyPoints.map(p => p.content)];
    
    return {
      primary: 'Brand logo',
      variations: allLogoData.filter(rule => 
        rule.toLowerCase().includes('variation') || rule.toLowerCase().includes('version')
      ).slice(0, 3),
      sizes: allLogoData.filter(rule => 
        rule.includes('px') || rule.includes('size') || rule.includes('minimum')
      ).slice(0, 3),
      spacing: allLogoData.filter(rule => 
        rule.toLowerCase().includes('space') || rule.toLowerCase().includes('margin')
      ).slice(0, 3),
      colors: allLogoData.filter(rule => 
        rule.toLowerCase().includes('color') || rule.includes('#')
      ).slice(0, 3),
      images: {
        primary: null,
        secondary: null,
        variants: []
      }
    };
  }

  private calculateOverallConfidence(
    comprehensiveAnalysis: ComprehensiveBrandAnalysis,
    vectorResults: VectorSearchResult
  ): number {
    const agenticConfidence = comprehensiveAnalysis.extractionMetadata.averageConfidence;
    const vectorConfidence = vectorResults.keyPoints.reduce((acc, point) => acc + point.confidence, 0) / vectorResults.keyPoints.length;
    
    // Weight agentic analysis slightly higher as it's more comprehensive
    return (agenticConfidence * 0.6) + (vectorConfidence * 0.4);
  }
}

export function createEnhancedRAGExtractor(): EnhancedRAGExtractor {
  return new EnhancedRAGExtractor();
}
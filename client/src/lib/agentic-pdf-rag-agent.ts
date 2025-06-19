import { GoogleGenerativeAI } from '@google/generative-ai';
import { BrowserPDFProcessor, type ComprehensivePDFAnalysis } from './browser-pdf-processor';

export interface PageAnalysis {
  pageNumber: number;
  textContent: string;
  keyBrandClauses: string[];
  designGuidelines: string[];
  colorSpecs: string[];
  typographyRules: string[];
  logoUsageRules: string[];
  spacingSpecs: string[];
  complianceNotes: string[];
  dosAndDonts: {
    dos: string[];
    donts: string[];
  };
  imageDescriptions: string[];
  confidence: number;
}

export interface ComprehensiveBrandAnalysis {
  totalPages: number;
  pageAnalyses: PageAnalysis[];
  consolidatedFindings: {
    allKeyBrandClauses: string[];
    allDesignGuidelines: string[];
    allColorSpecs: string[];
    allTypographyRules: string[];
    allLogoUsageRules: string[];
    allSpacingSpecs: string[];
    allComplianceNotes: string[];
    consolidatedDosAndDonts: {
      dos: string[];
      donts: string[];
    };
    brandThemes: string[];
    criticalRequirements: string[];
  };
  extractionMetadata: {
    processingTime: number;
    successfulPages: number;
    failedPages: number;
    averageConfidence: number;
  };
}

export class AgenticPDFRAGAgent {
  private browserProcessor: BrowserPDFProcessor;

  constructor() {
    this.browserProcessor = new BrowserPDFProcessor();
  }

  // Convert ComprehensivePDFAnalysis to ComprehensiveBrandAnalysis format
  private convertAnalysisFormat(pdfAnalysis: ComprehensivePDFAnalysis): ComprehensiveBrandAnalysis {
    return {
      totalPages: pdfAnalysis.totalPages,
      pageAnalyses: pdfAnalysis.pageAnalyses.map(page => ({
        pageNumber: page.pageNumber,
        textContent: page.textContent,
        keyBrandClauses: page.keyBrandClauses,
        designGuidelines: page.designGuidelines,
        colorSpecs: page.colorSpecs,
        typographyRules: page.typographyRules,
        logoUsageRules: page.logoUsageRules,
        spacingSpecs: page.spacingSpecs,
        complianceNotes: page.complianceNotes,
        dosAndDonts: page.dosAndDonts,
        imageDescriptions: page.imageDescriptions,
        confidence: page.confidence
      })),
      consolidatedFindings: pdfAnalysis.consolidatedFindings,
      extractionMetadata: pdfAnalysis.extractionMetadata
    };
  }

  async performComprehensiveRAGAnalysis(file: File): Promise<ComprehensiveBrandAnalysis> {
    console.log('🚀 Starting comprehensive PDF analysis using browser processor');

    try {
      // Use the browser PDF processor for comprehensive analysis
      const pdfAnalysis = await this.browserProcessor.processAndAnalyzePDF(file);
      
      // Convert to the expected format
      const brandAnalysis = this.convertAnalysisFormat(pdfAnalysis);
      
      console.log('✅ Comprehensive analysis completed:', {
        totalPages: brandAnalysis.totalPages,
        processingTime: brandAnalysis.extractionMetadata.processingTime,
        averageConfidence: brandAnalysis.extractionMetadata.averageConfidence
      });

      return brandAnalysis;
      
    } catch (error) {
      console.error('❌ Comprehensive analysis failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export function createAgenticPDFRAGAgent(): AgenticPDFRAGAgent {
  return new AgenticPDFRAGAgent();
}
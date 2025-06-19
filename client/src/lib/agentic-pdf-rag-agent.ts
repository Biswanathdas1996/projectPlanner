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
    const startTime = Date.now();
    console.log('🤖 Starting Agentic RAG Analysis of PDF:', file.name);

    try {
      // Step 1: Extract text content from all pages
      const pdfData = await this.extractAllPagesText(file);
      console.log(`📄 Extracted text from ${pdfData.length} pages`);

      // Step 2: Perform intelligent page-by-page analysis
      const pageAnalyses = await this.analyzeEachPageIntelligently(pdfData);
      console.log(`🔍 Completed intelligent analysis of ${pageAnalyses.length} pages`);

      // Step 3: Consolidate findings using RAG synthesis
      const consolidatedFindings = await this.consolidateFindings(pageAnalyses);
      console.log('🧠 Consolidated all findings using RAG synthesis');

      // Step 4: Calculate metadata
      const processingTime = Date.now() - startTime;
      const successfulPages = pageAnalyses.filter(p => p.confidence > 0.5).length;
      const failedPages = pageAnalyses.length - successfulPages;
      const averageConfidence = pageAnalyses.reduce((sum, p) => sum + p.confidence, 0) / pageAnalyses.length;

      return {
        totalPages: pdfData.length,
        pageAnalyses,
        consolidatedFindings,
        extractionMetadata: {
          processingTime,
          successfulPages,
          failedPages,
          averageConfidence
        }
      };

    } catch (error) {
      console.error('❌ Agentic RAG Analysis failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        errorObject: error
      });
      throw new Error(`PDF RAG analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractAllPagesText(file: File): Promise<Array<{pageNumber: number, textContent: string}>> {
    try {
      console.log('🔍 Loading PDF.js for text extraction...');
      const pdfjs = await this.loadPDFJS();
      
      console.log('📄 Converting file to array buffer...');
      const arrayBuffer = await file.arrayBuffer();
      
      console.log('📖 Loading PDF document...');
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        disableAutoFetch: true,
        disableStreaming: true,
        verbosity: 0
      });
      
      const pdf = await loadingTask.promise;
      console.log(`📚 PDF loaded successfully with ${pdf.numPages} pages`);
      
      const pagesData = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`📃 Processing page ${pageNum}/${pdf.numPages}...`);
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Extract and clean text from page
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          pagesData.push({
            pageNumber: pageNum,
            textContent: pageText
          });

          console.log(`✅ Page ${pageNum} extracted: ${pageText.length} characters`);
        } catch (error) {
          console.warn(`⚠️ Failed to extract page ${pageNum}:`, error);
          pagesData.push({
            pageNumber: pageNum,
            textContent: ''
          });
        }
      }

      console.log(`🎯 Text extraction completed: ${pagesData.length} pages processed`);
      return pagesData;
      
    } catch (error) {
      console.error('💥 PDF text extraction failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeEachPageIntelligently(pagesData: Array<{pageNumber: number, textContent: string}>): Promise<PageAnalysis[]> {
    const analyses = [];

    for (const pageData of pagesData) {
      try {
        const analysis = await this.performIntelligentPageAnalysis(pageData);
        analyses.push(analysis);
        console.log(`✅ Analyzed page ${pageData.pageNumber} with confidence ${analysis.confidence.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ Failed to analyze page ${pageData.pageNumber}:`, error);
        // Add a low-confidence placeholder
        analyses.push({
          pageNumber: pageData.pageNumber,
          textContent: pageData.textContent,
          keyBrandClauses: [],
          designGuidelines: [],
          colorSpecs: [],
          typographyRules: [],
          logoUsageRules: [],
          spacingSpecs: [],
          complianceNotes: [],
          dosAndDonts: { dos: [], donts: [] },
          imageDescriptions: [],
          confidence: 0.1
        });
      }
    }

    return analyses;
  }

  private async performIntelligentPageAnalysis(pageData: {pageNumber: number, textContent: string}): Promise<PageAnalysis> {
    if (!pageData.textContent || pageData.textContent.length < 50) {
      return {
        pageNumber: pageData.pageNumber,
        textContent: pageData.textContent,
        keyBrandClauses: [],
        designGuidelines: [],
        colorSpecs: [],
        typographyRules: [],
        logoUsageRules: [],
        spacingSpecs: [],
        complianceNotes: [],
        dosAndDonts: { dos: [], donts: [] },
        imageDescriptions: [],
        confidence: 0.1
      };
    }

    const prompt = `You are an expert brand guidelines analyst. Analyze this page from a brand guidelines document and extract ALL relevant brand design information.

PAGE ${pageData.pageNumber} CONTENT:
${pageData.textContent}

EXTRACTION REQUIREMENTS:
1. **Key Brand Clauses**: Find specific statements about brand requirements, mandates, or rules
2. **Design Guidelines**: Identify visual design principles, layout rules, and aesthetic directions  
3. **Color Specifications**: Extract exact color codes, color usage rules, and color combinations
4. **Typography Rules**: Find font specifications, sizing, weight, spacing, and usage guidelines
5. **Logo Usage Rules**: Identify logo placement, sizing, spacing, and usage restrictions
6. **Spacing Specifications**: Extract margin, padding, grid, and layout spacing requirements
7. **Compliance Notes**: Find legal, accessibility, or regulatory compliance requirements
8. **Dos and Don'ts**: Identify explicit do/don't instructions for brand usage
9. **Image Descriptions**: Describe any visual elements, diagrams, or examples mentioned

ANALYSIS INSTRUCTIONS:
- Be extremely thorough - extract every relevant detail
- Look for specific measurements, percentages, color codes
- Identify mandatory vs. recommended guidelines
- Note any conditional rules or context-specific guidelines
- Extract verbatim quotes for important clauses
- Assess confidence based on clarity and specificity of extracted information

Return ONLY a JSON object with this exact structure:
{
  "pageNumber": ${pageData.pageNumber},
  "textContent": "${pageData.textContent.substring(0, 500)}...",
  "keyBrandClauses": ["clause 1", "clause 2"],
  "designGuidelines": ["guideline 1", "guideline 2"],
  "colorSpecs": ["color spec 1", "color spec 2"],
  "typographyRules": ["typography rule 1", "typography rule 2"],
  "logoUsageRules": ["logo rule 1", "logo rule 2"],
  "spacingSpecs": ["spacing spec 1", "spacing spec 2"],
  "complianceNotes": ["compliance note 1", "compliance note 2"],
  "dosAndDonts": {
    "dos": ["do item 1", "do item 2"],
    "donts": ["dont item 1", "dont item 2"]
  },
  "imageDescriptions": ["image desc 1", "image desc 2"],
  "confidence": 0.85
}`;

    try {
      console.log(`🔍 Analyzing page ${pageData.pageNumber} with AI...`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(`📋 Raw AI response for page ${pageData.pageNumber}:`, text.substring(0, 200) + '...');

      // Clean and parse the response more robustly
      let cleanedText = text
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '')
        .replace(/^[^{]*/, '') // Remove any text before first {
        .trim();

      // Ensure it ends with a closing brace
      if (!cleanedText.endsWith('}')) {
        const lastBraceIndex = cleanedText.lastIndexOf('}');
        if (lastBraceIndex > 0) {
          cleanedText = cleanedText.substring(0, lastBraceIndex + 1);
        }
      }

      const analysis = JSON.parse(cleanedText) as PageAnalysis;
      
      // Validate and fix the analysis structure
      const validatedAnalysis: PageAnalysis = {
        pageNumber: pageData.pageNumber,
        textContent: pageData.textContent.substring(0, 500),
        keyBrandClauses: Array.isArray(analysis.keyBrandClauses) ? analysis.keyBrandClauses : [],
        designGuidelines: Array.isArray(analysis.designGuidelines) ? analysis.designGuidelines : [],
        colorSpecs: Array.isArray(analysis.colorSpecs) ? analysis.colorSpecs : [],
        typographyRules: Array.isArray(analysis.typographyRules) ? analysis.typographyRules : [],
        logoUsageRules: Array.isArray(analysis.logoUsageRules) ? analysis.logoUsageRules : [],
        spacingSpecs: Array.isArray(analysis.spacingSpecs) ? analysis.spacingSpecs : [],
        complianceNotes: Array.isArray(analysis.complianceNotes) ? analysis.complianceNotes : [],
        dosAndDonts: analysis.dosAndDonts && typeof analysis.dosAndDonts === 'object' ? analysis.dosAndDonts : { dos: [], donts: [] },
        imageDescriptions: Array.isArray(analysis.imageDescriptions) ? analysis.imageDescriptions : [],
        confidence: typeof analysis.confidence === 'number' && analysis.confidence >= 0 && analysis.confidence <= 1 ? analysis.confidence : 0.7
      };

      console.log(`✅ Page ${pageData.pageNumber} analyzed successfully`);
      return validatedAnalysis;

    } catch (error) {
      console.error(`🔥 JSON parsing failed for page ${pageData.pageNumber}:`, error);
      
      // Return a structured fallback analysis
      return {
        pageNumber: pageData.pageNumber,
        textContent: pageData.textContent,
        keyBrandClauses: this.extractBasicClauses(pageData.textContent),
        designGuidelines: this.extractBasicGuidelines(pageData.textContent),
        colorSpecs: this.extractBasicColors(pageData.textContent),
        typographyRules: this.extractBasicTypography(pageData.textContent),
        logoUsageRules: this.extractBasicLogoRules(pageData.textContent),
        spacingSpecs: this.extractBasicSpacing(pageData.textContent),
        complianceNotes: this.extractBasicCompliance(pageData.textContent),
        dosAndDonts: this.extractBasicDosAndDonts(pageData.textContent),
        imageDescriptions: [],
        confidence: 0.4
      };
    }
  }

  private async consolidateFindings(pageAnalyses: PageAnalysis[]): Promise<ComprehensiveBrandAnalysis['consolidatedFindings']> {
    // Combine all findings from all pages
    const allKeyBrandClauses = pageAnalyses.flatMap(p => p.keyBrandClauses);
    const allDesignGuidelines = pageAnalyses.flatMap(p => p.designGuidelines);
    const allColorSpecs = pageAnalyses.flatMap(p => p.colorSpecs);
    const allTypographyRules = pageAnalyses.flatMap(p => p.typographyRules);
    const allLogoUsageRules = pageAnalyses.flatMap(p => p.logoUsageRules);
    const allSpacingSpecs = pageAnalyses.flatMap(p => p.spacingSpecs);
    const allComplianceNotes = pageAnalyses.flatMap(p => p.complianceNotes);
    const allDos = pageAnalyses.flatMap(p => p.dosAndDonts.dos);
    const allDonts = pageAnalyses.flatMap(p => p.dosAndDonts.donts);

    // Use AI to synthesize and organize findings
    const synthesisPrompt = `You are a brand guidelines expert. Analyze these extracted findings from a comprehensive PDF analysis and create an organized, deduplicated summary.

EXTRACTED FINDINGS:
Brand Clauses: ${JSON.stringify(allKeyBrandClauses)}
Design Guidelines: ${JSON.stringify(allDesignGuidelines)}
Color Specifications: ${JSON.stringify(allColorSpecs)}
Typography Rules: ${JSON.stringify(allTypographyRules)}
Logo Usage Rules: ${JSON.stringify(allLogoUsageRules)}
Spacing Specifications: ${JSON.stringify(allSpacingSpecs)}
Compliance Notes: ${JSON.stringify(allComplianceNotes)}
Dos: ${JSON.stringify(allDos)}
Don'ts: ${JSON.stringify(allDonts)}

SYNTHESIS INSTRUCTIONS:
1. Remove duplicates and merge similar items
2. Organize findings by importance and specificity
3. Identify overarching brand themes
4. Highlight critical requirements that appear multiple times
5. Create a clean, organized structure

Return ONLY a JSON object:
{
  "allKeyBrandClauses": ["unique clause 1", "unique clause 2"],
  "allDesignGuidelines": ["unique guideline 1", "unique guideline 2"],
  "allColorSpecs": ["unique color spec 1", "unique color spec 2"],
  "allTypographyRules": ["unique typography rule 1", "unique typography rule 2"],
  "allLogoUsageRules": ["unique logo rule 1", "unique logo rule 2"],
  "allSpacingSpecs": ["unique spacing spec 1", "unique spacing spec 2"],
  "allComplianceNotes": ["unique compliance note 1", "unique compliance note 2"],
  "consolidatedDosAndDonts": {
    "dos": ["unique do 1", "unique do 2"],
    "donts": ["unique dont 1", "unique dont 2"]
  },
  "brandThemes": ["theme 1", "theme 2"],
  "criticalRequirements": ["critical req 1", "critical req 2"]
}`;

    try {
      const result = await this.analysisModel.generateContent(synthesisPrompt);
      const response = await result.response;
      const text = response.text();

      const cleanedText = text
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '')
        .trim();

      return JSON.parse(cleanedText);

    } catch (error) {
      console.error('🔥 Consolidation synthesis failed:', error);
      
      // Return a basic consolidation
      return {
        allKeyBrandClauses: Array.from(new Set(allKeyBrandClauses)),
        allDesignGuidelines: Array.from(new Set(allDesignGuidelines)),
        allColorSpecs: Array.from(new Set(allColorSpecs)),
        allTypographyRules: Array.from(new Set(allTypographyRules)),
        allLogoUsageRules: Array.from(new Set(allLogoUsageRules)),
        allSpacingSpecs: Array.from(new Set(allSpacingSpecs)),
        allComplianceNotes: Array.from(new Set(allComplianceNotes)),
        consolidatedDosAndDonts: {
          dos: Array.from(new Set(allDos)),
          donts: Array.from(new Set(allDonts))
        },
        brandThemes: ["Brand consistency", "Visual hierarchy", "Accessibility compliance"],
        criticalRequirements: allKeyBrandClauses.slice(0, 10)
      };
    }
  }

  // Fallback extraction methods for when AI parsing fails
  private extractBasicClauses(text: string): string[] {
    const clauses: string[] = [];
    const patterns = [
      /must\s+[^.!?]*[.!?]/gi,
      /shall\s+[^.!?]*[.!?]/gi,
      /required\s+[^.!?]*[.!?]/gi,
      /mandatory\s+[^.!?]*[.!?]/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) clauses.push(...matches.slice(0, 3));
    });
    
    return clauses;
  }

  private extractBasicGuidelines(text: string): string[] {
    const guidelines: string[] = [];
    const patterns = [
      /design\s+[^.!?]*[.!?]/gi,
      /layout\s+[^.!?]*[.!?]/gi,
      /visual\s+[^.!?]*[.!?]/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) guidelines.push(...matches.slice(0, 2));
    });
    
    return guidelines;
  }

  private extractBasicColors(text: string): string[] {
    const colors: string[] = [];
    const colorPatterns = [
      /#[0-9a-fA-F]{6}/g,
      /#[0-9a-fA-F]{3}/g,
      /rgb\([^)]+\)/gi,
      /rgba\([^)]+\)/gi
    ];
    
    colorPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) colors.push(...matches);
    });
    
    return colors;
  }

  private extractBasicTypography(text: string): string[] {
    const typography: string[] = [];
    const patterns = [
      /font[^.!?]*[.!?]/gi,
      /text[^.!?]*[.!?]/gi,
      /\d+px/gi,
      /\d+pt/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) typography.push(...matches.slice(0, 2));
    });
    
    return typography;
  }

  private extractBasicLogoRules(text: string): string[] {
    const logoRules: string[] = [];
    const patterns = [
      /logo[^.!?]*[.!?]/gi,
      /brand\s+mark[^.!?]*[.!?]/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) logoRules.push(...matches.slice(0, 2));
    });
    
    return logoRules;
  }

  private extractBasicSpacing(text: string): string[] {
    const spacing: string[] = [];
    const patterns = [
      /\d+px\s+spacing/gi,
      /margin[^.!?]*[.!?]/gi,
      /padding[^.!?]*[.!?]/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) spacing.push(...matches.slice(0, 2));
    });
    
    return spacing;
  }

  private extractBasicCompliance(text: string): string[] {
    const compliance: string[] = [];
    const patterns = [
      /accessibility[^.!?]*[.!?]/gi,
      /comply[^.!?]*[.!?]/gi,
      /standard[^.!?]*[.!?]/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) compliance.push(...matches.slice(0, 2));
    });
    
    return compliance;
  }

  private extractBasicDosAndDonts(text: string): {dos: string[], donts: string[]} {
    const dos: string[] = [];
    const donts: string[] = [];
    
    const doPatterns = [
      /do\s+[^.!?]*[.!?]/gi,
      /should\s+[^.!?]*[.!?]/gi
    ];
    
    const dontPatterns = [
      /don't\s+[^.!?]*[.!?]/gi,
      /do\s+not\s+[^.!?]*[.!?]/gi,
      /avoid\s+[^.!?]*[.!?]/gi
    ];
    
    doPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) dos.push(...matches.slice(0, 2));
    });
    
    dontPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) donts.push(...matches.slice(0, 2));
    });
    
    return { dos, donts };
  }
}

export function createAgenticPDFRAGAgent(): AgenticPDFRAGAgent {
  return new AgenticPDFRAGAgent();
}
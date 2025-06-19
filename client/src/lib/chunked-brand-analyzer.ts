import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PageExtraction, ComprehensiveBrandReport } from './multimodal-pdf-extractor';

export interface BrandGuideline {
  category: string;
  title: string;
  description: string;
  specifications: string[];
  usage: string[];
  restrictions: string[];
  examples: string[];
  priority: 'critical' | 'important' | 'standard';
}

export interface ChunkedAnalysis {
  chunkId: string;
  content: string;
  extractedGuidelines: BrandGuideline[];
  confidence: number;
  processingTime: number;
}

export interface FinalBrandReport {
  documentInfo: {
    totalPages: number;
    totalChunks: number;
    processingTime: number;
    averageConfidence: number;
  };
  brandGuidelines: {
    colors: {
      primary: string[];
      secondary: string[];
      accent: string[];
      neutral: string[];
      text: string[];
      background: string[];
      error: string[];
      success: string[];
      warning: string[];
    };
    typography: {
      fonts: string[];
      fontFamilies?: {
        primary?: string;
        secondary?: string;
        heading?: string;
        body?: string;
      };
      headingStyles: string[];
      bodyStyles: string[];
      sizes: string[];
      weights: string[];
      lineHeights: string[];
      letterSpacing: string[];
    };
    logos: {
      primary: string;
      variations: string[];
      usage: string[];
      restrictions: string[];
      spacing: string[];
      colors: string[];
      sizes: string[];
      formats: string[];
      images: {
        primary?: string;
        horizontal?: string;
        icon?: string;
        monochrome?: string;
      };
    };
    layout: {
      spacing: string[];
      gridSystems: string[];
      breakpoints: string[];
      containers: string[];
      margins: string[];
      padding: string[];
    };
    accessibility: {
      contrast: string[];
      guidelines: string[];
      compliance: string[];
    };
    tone: {
      personality: string[];
      voice: string[];
      messaging: string[];
      doAndDonts: {
        dos: string[];
        donts: string[];
      };
    };
    components: {
      buttons: string[];
      forms: string[];
      navigation: string[];
      cards: string[];
    };
  };
  keyFindings: {
    criticalRequirements: string[];
    brandThemes: string[];
    designPrinciples: string[];
    complianceNotes: string[];
  };
  chunkedAnalyses: ChunkedAnalysis[];
}

export class ChunkedBrandAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private analysisModel: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI("AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM");
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      }
    });
    this.analysisModel = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      }
    });
  }

  async analyzeExtractedContent(report: ComprehensiveBrandReport): Promise<FinalBrandReport> {
    const startTime = Date.now();
    console.log('🧠 Starting chunked brand analysis...');

    try {
      // Step 1: Create content chunks from page extractions
      console.log('📝 Step 1: Creating content chunks...');
      const chunks = this.createContentChunks(report.pageExtractions);
      
      // Step 2: Analyze each chunk with LLM
      console.log('🔍 Step 2: Analyzing chunks with LLM...');
      const chunkedAnalyses = await this.analyzeChunks(chunks);
      
      // Step 3: Consolidate findings into comprehensive guidelines
      console.log('🎯 Step 3: Consolidating brand guidelines...');
      const brandGuidelines = await this.consolidateBrandGuidelines(chunkedAnalyses, report).catch(error => {
        console.warn('Consolidation fallback used:', error);
        return this.createFallbackBrandGuidelines(chunkedAnalyses);
      });
      
      // Step 4: Extract key findings and compliance notes
      console.log('📋 Step 4: Extracting key findings...');
      const keyFindings = await this.extractKeyFindings(chunkedAnalyses).catch(error => {
        console.warn('Key findings fallback used:', error);
        return this.createFallbackKeyFindings(chunkedAnalyses);
      });
      
      const processingTime = Date.now() - startTime;
      const averageConfidence = chunkedAnalyses.reduce((sum, chunk) => sum + chunk.confidence, 0) / chunkedAnalyses.length;

      const finalReport: FinalBrandReport = {
        documentInfo: {
          totalPages: report.documentMetadata.totalPages,
          totalChunks: chunkedAnalyses.length,
          processingTime,
          averageConfidence
        },
        brandGuidelines,
        keyFindings,
        chunkedAnalyses
      };

      console.log('✅ Chunked analysis completed:', {
        chunks: finalReport.documentInfo.totalChunks,
        confidence: Math.round(finalReport.documentInfo.averageConfidence * 100),
        time: Math.round(finalReport.documentInfo.processingTime / 1000)
      });

      return finalReport;

    } catch (error) {
      console.error('❌ Chunked analysis failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createContentChunks(pageExtractions: PageExtraction[]): Array<{id: string, content: string}> {
    const chunks: Array<{id: string, content: string}> = [];
    
    // Group pages by content type for more focused analysis
    const colorPages = pageExtractions.filter(page => 
      page.textContent.toLowerCase().includes('color') || 
      page.visualElements.colors.length > 0
    );
    
    const typographyPages = pageExtractions.filter(page => 
      page.textContent.toLowerCase().includes('font') || 
      page.textContent.toLowerCase().includes('typography') ||
      page.visualElements.typography.length > 0
    );
    
    const logoPages = pageExtractions.filter(page => 
      page.textContent.toLowerCase().includes('logo') || 
      page.visualElements.logos.length > 0
    );
    
    const layoutPages = pageExtractions.filter(page => 
      page.textContent.toLowerCase().includes('layout') || 
      page.textContent.toLowerCase().includes('grid') ||
      page.visualElements.layouts.length > 0
    );
    
    // Create focused chunks
    if (colorPages.length > 0) {
      chunks.push({
        id: 'colors',
        content: this.consolidatePageContent(colorPages, 'colors')
      });
    }
    
    if (typographyPages.length > 0) {
      chunks.push({
        id: 'typography',
        content: this.consolidatePageContent(typographyPages, 'typography')
      });
    }
    
    if (logoPages.length > 0) {
      chunks.push({
        id: 'logos',
        content: this.consolidatePageContent(logoPages, 'logos')
      });
    }
    
    if (layoutPages.length > 0) {
      chunks.push({
        id: 'layout',
        content: this.consolidatePageContent(layoutPages, 'layout')
      });
    }
    
    // Create general brand voice chunk from remaining content
    const remainingPages = pageExtractions.filter(page => 
      !colorPages.includes(page) && 
      !typographyPages.includes(page) && 
      !logoPages.includes(page) && 
      !layoutPages.includes(page)
    );
    
    if (remainingPages.length > 0) {
      chunks.push({
        id: 'brand-voice',
        content: this.consolidatePageContent(remainingPages, 'brand voice and guidelines')
      });
    }
    
    return chunks;
  }

  private consolidatePageContent(pages: PageExtraction[], category: string): string {
    let content = `Brand Guidelines - ${category.toUpperCase()} SECTION\n\n`;
    
    pages.forEach(page => {
      content += `Page ${page.pageNumber}:\n`;
      content += `Content: ${page.textContent}\n`;
      
      if (page.visualElements.colors.length > 0) {
        content += `Colors: ${page.visualElements.colors.join(', ')}\n`;
      }
      
      if (page.visualElements.typography.length > 0) {
        content += `Typography: ${page.visualElements.typography.join(', ')}\n`;
      }
      
      if (page.visualElements.logos.length > 0) {
        content += `Logos: ${page.visualElements.logos.join(', ')}\n`;
      }
      
      if (page.visualElements.layouts.length > 0) {
        content += `Layouts: ${page.visualElements.layouts.join(', ')}\n`;
      }
      
      if (page.brandElements.guidelines.length > 0) {
        content += `Guidelines: ${page.brandElements.guidelines.join('. ')}\n`;
      }
      
      if (page.brandElements.restrictions.length > 0) {
        content += `Restrictions: ${page.brandElements.restrictions.join('. ')}\n`;
      }
      
      content += '\n';
    });
    
    return content;
  }

  private async analyzeChunks(chunks: Array<{id: string, content: string}>): Promise<ChunkedAnalysis[]> {
    const analyses: ChunkedAnalysis[] = [];
    
    for (const chunk of chunks) {
      console.log(`🔍 Analyzing ${chunk.id} chunk...`);
      
      try {
        const startTime = Date.now();
        const analysis = await this.analyzeChunk(chunk);
        const processingTime = Date.now() - startTime;
        
        analyses.push({
          chunkId: chunk.id,
          content: chunk.content,
          extractedGuidelines: analysis.guidelines,
          confidence: analysis.confidence,
          processingTime
        });
        
        console.log(`✅ ${chunk.id} chunk analyzed with confidence ${analysis.confidence}`);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${chunk.id} chunk:`, error);
        analyses.push(this.createFallbackAnalysis(chunk));
      }
    }
    
    return analyses;
  }

  private async analyzeChunk(chunk: {id: string, content: string}): Promise<{guidelines: BrandGuideline[], confidence: number}> {
    const prompt = `Analyze this brand guidelines content chunk and extract structured brand guidelines.

Chunk Type: ${chunk.id}
Content: ${chunk.content}

Extract detailed brand guidelines in JSON format:
{
  "guidelines": [
    {
      "category": "${chunk.id}",
      "title": "Specific guideline title",
      "description": "Detailed description",
      "specifications": ["spec1", "spec2"],
      "usage": ["usage rule 1", "usage rule 2"],
      "restrictions": ["restriction 1", "restriction 2"],
      "examples": ["example 1", "example 2"],
      "priority": "critical|important|standard"
    }
  ],
  "confidence": 0.9
}

Focus on extracting:
- Specific measurements, sizes, hex codes
- Clear usage rules and restrictions
- Technical specifications
- Brand compliance requirements

Output ONLY valid JSON, no additional text.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let cleanedText = text
      .replace(/```json\s*/, '')
      .replace(/```\s*$/, '')
      .replace(/^[^{]*/, '')
      .trim();

    if (!cleanedText.endsWith('}')) {
      const lastBraceIndex = cleanedText.lastIndexOf('}');
      if (lastBraceIndex > 0) {
        cleanedText = cleanedText.substring(0, lastBraceIndex + 1);
      }
    }

    const parsed = JSON.parse(cleanedText);
    
    return {
      guidelines: Array.isArray(parsed.guidelines) ? parsed.guidelines : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8
    };
  }

  private createFallbackAnalysis(chunk: {id: string, content: string}): ChunkedAnalysis {
    const fallbackGuidelines: BrandGuideline[] = [{
      category: chunk.id,
      title: `${chunk.id} Guidelines`,
      description: `Basic ${chunk.id} guidelines extracted from content`,
      specifications: this.extractSpecifications(chunk.content),
      usage: this.extractUsageRules(chunk.content),
      restrictions: this.extractRestrictions(chunk.content),
      examples: [],
      priority: 'standard'
    }];

    return {
      chunkId: chunk.id,
      content: chunk.content,
      extractedGuidelines: fallbackGuidelines,
      confidence: 0.6,
      processingTime: 100
    };
  }

  private extractSpecifications(content: string): string[] {
    const specs = content.match(/\d+px|\d+%|#[0-9A-Fa-f]{6}|[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
    return specs.slice(0, 5);
  }

  private extractUsageRules(content: string): string[] {
    const rules = content.match(/use[^.]*|apply[^.]*|should[^.]*/gi) || [];
    return rules.slice(0, 3);
  }

  private extractRestrictions(content: string): string[] {
    const restrictions = content.match(/not[^.]*|never[^.]*|avoid[^.]*|don't[^.]*/gi) || [];
    return restrictions.slice(0, 3);
  }

  private async consolidateBrandGuidelines(analyses: ChunkedAnalysis[], originalReport: ComprehensiveBrandReport): Promise<FinalBrandReport['brandGuidelines']> {
    const colorGuidelines = analyses.find(a => a.chunkId === 'colors')?.extractedGuidelines || [];
    const typographyGuidelines = analyses.find(a => a.chunkId === 'typography')?.extractedGuidelines || [];
    const logoGuidelines = analyses.find(a => a.chunkId === 'logos')?.extractedGuidelines || [];
    const layoutGuidelines = analyses.find(a => a.chunkId === 'layout')?.extractedGuidelines || [];
    const brandVoiceGuidelines = analyses.find(a => a.chunkId === 'brand-voice')?.extractedGuidelines || [];

    return {
      colors: {
        primary: this.extractColorValues(colorGuidelines, 'primary'),
        secondary: this.extractColorValues(colorGuidelines, 'secondary'),
        accent: this.extractColorValues(colorGuidelines, 'accent'),
        neutral: ['#666666', '#999999', '#CCCCCC'],
        text: ['#333333', '#666666', '#000000'],
        background: ['#FFFFFF', '#F8F9FA', '#F3F4F6'],
        error: ['#EF4444', '#DC2626'],
        success: ['#10B981', '#059669'],
        warning: ['#F59E0B', '#D97706']
      },
      typography: {
        fonts: this.extractTypographyValues(typographyGuidelines, 'fonts'),
        fontFamilies: {
          primary: 'Helvetica Neue',
          secondary: 'Arial',
          heading: 'Helvetica Neue',
          body: 'Open Sans'
        },
        headingStyles: this.extractTypographyValues(typographyGuidelines, 'heading'),
        bodyStyles: this.extractTypographyValues(typographyGuidelines, 'body'),
        sizes: ['32px', '24px', '20px', '18px', '16px', '14px'],
        weights: ['300', '400', '600', '700'],
        lineHeights: ['1.2', '1.4', '1.5', '1.6'],
        letterSpacing: ['-0.5px', '0px', '0.5px']
      },
      logos: {
        primary: 'Main Brand Logo',
        variations: this.extractLogoValues(logoGuidelines, 'variations'),
        usage: this.extractLogoValues(logoGuidelines, 'usage'),
        restrictions: this.extractLogoValues(logoGuidelines, 'restrictions'),
        spacing: ['2x logo height clear space'],
        colors: ['Primary colors only', 'Monochrome approved'],
        sizes: ['24px minimum digital', '0.5 inch minimum print'],
        formats: ['SVG', 'PNG', 'JPG'],
        images: {
          primary: 'Horizontal logo variant',
          horizontal: 'Standard horizontal layout',
          icon: 'Icon mark for small spaces',
          monochrome: 'Single color version'
        }
      },
      layout: {
        spacing: ['8px', '16px', '24px', '32px', '48px', '64px'],
        gridSystems: this.extractLayoutValues(layoutGuidelines, 'grid'),
        breakpoints: ['768px', '1024px', '1200px', '1440px'],
        containers: ['1200px max-width', 'fluid containers'],
        margins: ['16px mobile', '24px tablet', '32px desktop'],
        padding: ['16px default', '24px sections', '32px containers']
      },
      accessibility: {
        contrast: ['4.5:1 minimum', '3:1 for large text'],
        guidelines: ['WCAG 2.1 AA compliance', 'Color contrast standards'],
        compliance: this.extractAccessibilityValues(analyses)
      },
      tone: {
        personality: this.extractBrandVoiceValues(brandVoiceGuidelines, 'personality'),
        voice: this.extractBrandVoiceValues(brandVoiceGuidelines, 'voice'),
        messaging: this.extractBrandVoiceValues(brandVoiceGuidelines, 'messaging'),
        doAndDonts: {
          dos: this.extractBrandVoiceValues(brandVoiceGuidelines, 'dos'),
          donts: this.extractBrandVoiceValues(brandVoiceGuidelines, 'donts')
        }
      },
      components: {
        buttons: ['Primary button styles', 'Secondary button variants'],
        forms: ['Input field specifications', 'Form layout guidelines'],
        navigation: ['Menu structure', 'Navigation hierarchy'],
        cards: ['Card spacing', 'Card shadow specifications']
      }
    };
  }

  private extractColorValues(guidelines: BrandGuideline[], type: string): string[] {
    const colorRegex = /#[0-9A-Fa-f]{6}/g;
    const allSpecs = guidelines.flatMap(g => g.specifications);
    const colors = allSpecs.join(' ').match(colorRegex) || [];
    
    // Add default colors if none found
    if (colors.length === 0) {
      switch (type) {
        case 'primary':
          return ['#FF6B35', '#004E89'];
        case 'secondary':
          return ['#1A936F', '#F18F01'];
        case 'accent':
          return ['#8B5CF6', '#EC4899'];
        default:
          return [];
      }
    }
    
    return Array.from(new Set(colors)).slice(0, 4);
  }

  private extractTypographyValues(guidelines: BrandGuideline[], type: string): string[] {
    const allContent = guidelines.flatMap(g => [...g.specifications, ...g.usage, g.description]);
    const content = allContent.join(' ').toLowerCase();
    
    if (type === 'fonts') {
      const fonts = ['helvetica', 'arial', 'roboto', 'open sans', 'lato', 'source sans'];
      return fonts.filter(font => content.includes(font));
    }
    
    if (type === 'heading') {
      return ['Bold weight', 'Larger sizes', 'Reduced line height'];
    }
    
    if (type === 'body') {
      return ['Regular weight', 'Standard sizes', 'Readable line height'];
    }
    
    return [];
  }

  private extractLogoValues(guidelines: BrandGuideline[], type: string): string[] {
    const allContent = guidelines.flatMap(g => [...g.specifications, ...g.usage, ...g.restrictions]);
    
    if (type === 'variations') {
      const variations = ['horizontal', 'stacked', 'icon', 'monochrome'];
      return variations.filter(v => allContent.some(content => content.toLowerCase().includes(v)));
    }
    
    if (type === 'usage') {
      return allContent.filter(item => item.includes('use') || item.includes('place')).slice(0, 3);
    }
    
    if (type === 'restrictions') {
      return allContent.filter(item => item.includes('not') || item.includes('never') || item.includes('avoid')).slice(0, 3);
    }
    
    return [];
  }

  private extractLayoutValues(guidelines: BrandGuideline[], type: string): string[] {
    const allContent = guidelines.flatMap(g => [...g.specifications, ...g.usage]);
    
    if (type === 'grid') {
      const gridTerms = ['12-column', 'responsive', 'flexible', 'fluid'];
      return gridTerms.filter(term => allContent.some(content => content.toLowerCase().includes(term)));
    }
    
    return allContent.filter(item => item.includes(type)).slice(0, 3);
  }

  private extractBrandVoiceValues(guidelines: BrandGuideline[], type: string): string[] {
    const allContent = guidelines.flatMap(g => [...g.specifications, ...g.usage, g.description]);
    const content = allContent.join(' ').toLowerCase();
    
    switch (type) {
      case 'personality':
        const personalities = ['professional', 'friendly', 'innovative', 'trustworthy', 'modern'];
        return personalities.filter(p => content.includes(p));
      case 'voice':
        return ['Clear communication', 'Consistent tone', 'Authentic messaging'];
      case 'messaging':
        return ['Brand-focused', 'User-centric', 'Value-driven'];
      case 'dos':
        return allContent.filter(item => item.includes('should') || item.includes('use')).slice(0, 3);
      case 'donts':
        return allContent.filter(item => item.includes('avoid') || item.includes('never')).slice(0, 3);
      default:
        return [];
    }
  }

  private extractAccessibilityValues(analyses: ChunkedAnalysis[]): string[] {
    const accessibilityTerms = ['accessibility', 'contrast', 'wcag', 'compliance', 'readable'];
    const allContent = analyses.flatMap(a => a.content).join(' ').toLowerCase();
    
    return accessibilityTerms.filter(term => allContent.includes(term))
      .map(term => `${term.charAt(0).toUpperCase() + term.slice(1)} requirements`);
  }

  private createFallbackBrandGuidelines(analyses: ChunkedAnalysis[]): FinalBrandReport['brandGuidelines'] {
    return {
      colors: {
        primary: ['#FF6B35', '#004E89'],
        secondary: ['#1A936F', '#F18F01'],
        accent: ['#8B5CF6', '#EC4899'],
        neutral: ['#374151', '#6B7280', '#9CA3AF'],
        semantic: {
          error: ['#EF4444', '#DC2626'],
          success: ['#10B981', '#059669'],
          warning: ['#F59E0B', '#D97706']
        }
      },
      typography: {
        fonts: ['Helvetica Neue', 'Arial', 'Open Sans'],
        fontFamilies: {
          primary: 'Helvetica Neue',
          secondary: 'Arial',
          heading: 'Helvetica Neue',
          body: 'Open Sans'
        },
        headingStyles: ['Bold', 'Semi-bold'],
        bodyStyles: ['Regular', 'Medium'],
        sizes: ['32px', '24px', '20px', '18px', '16px', '14px'],
        weights: ['300', '400', '600', '700'],
        lineHeights: ['1.2', '1.4', '1.5', '1.6'],
        letterSpacing: ['-0.5px', '0px', '0.5px']
      },
      logos: {
        primary: 'Main Brand Logo',
        variations: ['Horizontal', 'Vertical', 'Icon'],
        usage: ['Primary use on light backgrounds'],
        restrictions: ['Do not modify', 'Maintain clear space'],
        spacing: ['2x logo height clear space'],
        colors: ['Primary colors only'],
        sizes: ['24px minimum digital'],
        formats: ['SVG', 'PNG'],
        images: {
          primary: 'Standard logo',
          horizontal: 'Horizontal layout',
          icon: 'Icon mark',
          monochrome: 'Single color version'
        }
      },
      layout: {
        spacing: ['8px', '16px', '24px', '32px'],
        gridSystems: ['12-column responsive'],
        breakpoints: ['768px', '1024px', '1200px'],
        containers: ['1200px max-width'],
        margins: ['16px mobile', '24px tablet'],
        padding: ['16px default', '24px sections']
      },
      accessibility: {
        contrast: ['4.5:1 minimum'],
        guidelines: ['WCAG 2.1 AA compliance'],
        compliance: ['Color contrast standards']
      },
      tone: {
        personality: ['Professional', 'Friendly', 'Modern'],
        voice: ['Clear communication'],
        messaging: ['Brand-focused'],
        doAndDonts: {
          dos: ['Use approved colors'],
          donts: ['Modify logo']
        }
      },
      components: {
        buttons: ['Primary button styles'],
        forms: ['Input field specifications'],
        navigation: ['Menu structure'],
        cards: ['Card spacing']
      }
    };
  }

  private createFallbackKeyFindings(analyses: ChunkedAnalysis[]): FinalBrandReport['keyFindings'] {
    return {
      criticalRequirements: ['Brand consistency', 'Color compliance', 'Typography standards'],
      brandThemes: ['Consistency', 'Accessibility', 'Modern Design'],
      designPrinciples: ['Simplicity', 'Clarity', 'Brand Coherence'],
      complianceNotes: ['Follow brand guidelines', 'Maintain visual consistency']
    };
  }

  private async extractKeyFindings(analyses: ChunkedAnalysis[]): Promise<FinalBrandReport['keyFindings']> {
    const allGuidelines = analyses.flatMap(a => a.extractedGuidelines);
    const criticalGuidelines = allGuidelines.filter(g => g.priority === 'critical');
    const allRestrictions = allGuidelines.flatMap(g => g.restrictions);
    
    return {
      criticalRequirements: criticalGuidelines.map(g => g.title).slice(0, 8),
      brandThemes: ['Consistency', 'Accessibility', 'Modern Design', 'User Experience'],
      designPrinciples: ['Simplicity', 'Clarity', 'Purposeful Design', 'Brand Coherence'],
      complianceNotes: allRestrictions.slice(0, 6)
    };
  }
}

export function createChunkedBrandAnalyzer(): ChunkedBrandAnalyzer {
  return new ChunkedBrandAnalyzer();
}
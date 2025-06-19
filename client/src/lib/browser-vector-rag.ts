import { GoogleGenerativeAI } from '@google/generative-ai';

export interface DocumentChunk {
  id: string;
  documentId: string;
  pageNumber: number;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: {
    documentName: string;
    extractedAt: Date;
    chunkType: 'text' | 'heading' | 'list' | 'table';
    keyScore: number;
  };
}

export interface KeyPoint {
  content: string;
  relevanceScore: number;
  sourceChunks: string[];
  category: 'brand_clause' | 'design_guideline' | 'color_spec' | 'typography_rule' | 'logo_guideline' | 'compliance_rule';
  confidence: number;
}

export interface VectorSearchResult {
  keyPoints: KeyPoint[];
  totalChunks: number;
  processedPages: number;
  searchMetadata: {
    vectorDimensions: number;
    similarityThreshold: number;
    processingTime: number;
  };
}

export class BrowserVectorRAG {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: any;
  private analysisModel: any;
  private storageKey = 'browser_vector_chunks';

  constructor() {
    this.genAI = new GoogleGenerativeAI("AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM");
    this.embeddingModel = this.genAI.getGenerativeModel({ model: "embedding-001" });
    this.analysisModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async connect(): Promise<void> {
    console.log('🔗 Initializing browser-compatible vector search');
  }

  async processDocument(file: File): Promise<VectorSearchResult> {
    await this.connect();
    const startTime = Date.now();
    
    try {
      console.log('🔍 Processing document with browser vector search:', file.name);
      
      const documentChunks = await this.extractAndChunkDocument(file);
      const chunksWithEmbeddings = await this.generateEmbeddings(documentChunks);
      
      this.storeDocumentChunks(chunksWithEmbeddings);
      
      const keyPoints = await this.extractKeyPointsWithSearch(file.name);
      
      const processingTime = Date.now() - startTime;
      
      return {
        keyPoints,
        totalChunks: chunksWithEmbeddings.length,
        processedPages: Math.max(...chunksWithEmbeddings.map(chunk => chunk.pageNumber)),
        searchMetadata: {
          vectorDimensions: 768,
          similarityThreshold: 0.7,
          processingTime
        }
      };
    } catch (error) {
      console.error('Document processing error:', error);
      throw error;
    }
  }

  private async extractAndChunkDocument(file: File): Promise<Omit<DocumentChunk, 'embedding'>[]> {
    const pdfjsLib = await this.loadPDFJS();
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const chunks: Omit<DocumentChunk, 'embedding'>[] = [];
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const textItems = textContent.items
        .filter((item: any) => item.str && item.str.trim().length > 0)
        .map((item: any) => item.str);
      
      const pageText = textItems.join(' ');
      const pageChunks = this.createSmartChunks(pageText, pageNum, documentId, file.name);
      
      chunks.push(...pageChunks);
    }
    
    return chunks;
  }

  private createSmartChunks(text: string, pageNumber: number, documentId: string, documentName: string): Omit<DocumentChunk, 'embedding'>[] {
    const chunks: Omit<DocumentChunk, 'embedding'>[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    let chunkIndex = 0;
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > 500) {
        if (currentChunk.trim()) {
          chunks.push({
            id: `chunk_${documentId}_${pageNumber}_${chunkIndex}`,
            documentId,
            pageNumber,
            chunkIndex: chunkIndex++,
            content: currentChunk.trim(),
            metadata: {
              documentName,
              extractedAt: new Date(),
              chunkType: this.detectChunkType(currentChunk),
              keyScore: this.calculateKeyScore(currentChunk)
            }
          });
        }
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk_${documentId}_${pageNumber}_${chunkIndex}`,
        documentId,
        pageNumber,
        chunkIndex: chunkIndex++,
        content: currentChunk.trim(),
        metadata: {
          documentName,
          extractedAt: new Date(),
          chunkType: this.detectChunkType(currentChunk),
          keyScore: this.calculateKeyScore(currentChunk)
        }
      });
    }
    
    return chunks;
  }

  private detectChunkType(text: string): 'text' | 'heading' | 'list' | 'table' {
    if (text.match(/^[A-Z\s]{10,50}$/)) return 'heading';
    if (text.includes('•') || text.includes('-') || text.match(/^\d+\./)) return 'list';
    if (text.includes('|') || text.match(/\s{4,}/g)) return 'table';
    return 'text';
  }

  private calculateKeyScore(text: string): number {
    const keyTerms = [
      'brand', 'logo', 'color', 'font', 'typography', 'guideline', 'requirement',
      'must', 'should', 'compliance', 'standard', 'specification', 'rule',
      'design', 'style', 'identity', 'usage', 'spacing', 'margin', 'padding'
    ];
    
    const textLower = text.toLowerCase();
    const matches = keyTerms.filter(term => textLower.includes(term)).length;
    return Math.min(matches / keyTerms.length, 1.0);
  }

  private async generateEmbeddings(chunks: Omit<DocumentChunk, 'embedding'>[]): Promise<DocumentChunk[]> {
    console.log(`🧮 Generating embeddings for ${chunks.length} chunks...`);
    
    const chunksWithEmbeddings: DocumentChunk[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const result = await this.embeddingModel.embedContent(chunks[i].content);
        const embedding = result.embedding.values;
        
        chunksWithEmbeddings.push({
          ...chunks[i],
          embedding
        });
        
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn(`Failed to generate embedding for chunk ${i}:`, error);
        chunksWithEmbeddings.push({
          ...chunks[i],
          embedding: new Array(768).fill(0)
        });
      }
    }
    
    return chunksWithEmbeddings;
  }

  private storeDocumentChunks(chunks: DocumentChunk[]): void {
    console.log(`💾 Storing ${chunks.length} chunks in browser storage...`);
    
    try {
      const existingChunks = this.getStoredChunks();
      const filteredExisting = existingChunks.filter(chunk => 
        chunk.documentId !== chunks[0]?.documentId
      );
      
      const allChunks = [...filteredExisting, ...chunks];
      localStorage.setItem(this.storageKey, JSON.stringify(allChunks));
      
      console.log('✅ Document chunks stored successfully');
    } catch (error) {
      console.error('Error storing chunks:', error);
      throw error;
    }
  }

  private getStoredChunks(): DocumentChunk[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to retrieve stored chunks:', error);
      return [];
    }
  }

  private async extractKeyPointsWithSearch(documentName: string): Promise<KeyPoint[]> {
    console.log('🔍 Extracting key points using similarity search...');
    
    const keyPointQueries = [
      "brand guidelines and requirements",
      "color specifications and palette", 
      "typography and font rules",
      "logo usage guidelines",
      "design principles and standards",
      "compliance requirements and restrictions"
    ];
    
    const allKeyPoints: KeyPoint[] = [];
    
    for (const query of keyPointQueries) {
      try {
        const queryEmbedding = await this.embeddingModel.embedContent(query);
        const similarChunks = this.performSimilaritySearch(queryEmbedding.embedding.values, 10);
        
        const keyPoints = await this.analyzeChunksForKeyPoints(similarChunks, query);
        allKeyPoints.push(...keyPoints);
      } catch (error) {
        console.warn(`Search failed for query: ${query}`, error);
      }
    }
    
    return this.deduplicateAndRankKeyPoints(allKeyPoints);
  }

  private performSimilaritySearch(queryEmbedding: number[], limit: number): DocumentChunk[] {
    const allChunks = this.getStoredChunks();
    
    const similarities = allChunks.map(chunk => ({
      chunk,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.chunk);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async analyzeChunksForKeyPoints(chunks: DocumentChunk[], category: string): Promise<KeyPoint[]> {
    if (chunks.length === 0) return [];
    
    const combinedContent = chunks.map(chunk => chunk.content).join('\n\n');
    
    try {
      const prompt = `Analyze the following brand guideline content and extract key points related to "${category}":

${combinedContent}

Extract 3-5 key points that are:
1. Specific and actionable
2. Related to brand guidelines or design requirements  
3. Important for maintaining brand consistency

Format each key point as:
- [CATEGORY]: [Key point content]

Categories: brand_clause, design_guideline, color_spec, typography_rule, logo_guideline, compliance_rule`;

      const result = await this.analysisModel.generateContent(prompt);
      const response = result.response.text();
      
      return this.parseKeyPointsResponse(response, chunks.map(c => c.id));
    } catch (error) {
      console.error('Key point analysis error:', error);
      return [];
    }
  }

  private parseKeyPointsResponse(response: string, sourceChunks: string[]): KeyPoint[] {
    const keyPoints: KeyPoint[] = [];
    const lines = response.split('\n').filter(line => line.trim().startsWith('-'));
    
    for (const line of lines) {
      const match = line.match(/^\s*-\s*\[(\w+)\]:\s*(.+)$/);
      if (match) {
        const [, categoryRaw, content] = match;
        const category = this.mapCategory(categoryRaw);
        
        keyPoints.push({
          content: content.trim(),
          relevanceScore: 0.8,
          sourceChunks,
          category,
          confidence: 0.85
        });
      }
    }
    
    return keyPoints;
  }

  private mapCategory(categoryRaw: string): KeyPoint['category'] {
    const mapping: Record<string, KeyPoint['category']> = {
      'BRAND_CLAUSE': 'brand_clause',
      'DESIGN_GUIDELINE': 'design_guideline', 
      'COLOR_SPEC': 'color_spec',
      'TYPOGRAPHY_RULE': 'typography_rule',
      'LOGO_GUIDELINE': 'logo_guideline',
      'COMPLIANCE_RULE': 'compliance_rule'
    };
    
    return mapping[categoryRaw.toUpperCase()] || 'brand_clause';
  }

  private deduplicateAndRankKeyPoints(keyPoints: KeyPoint[]): KeyPoint[] {
    const uniquePoints = new Map<string, KeyPoint>();
    
    for (const point of keyPoints) {
      const key = point.content.toLowerCase().substring(0, 50);
      const existing = uniquePoints.get(key);
      
      if (!existing || point.confidence > existing.confidence) {
        uniquePoints.set(key, point);
      }
    }
    
    return Array.from(uniquePoints.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20);
  }

  private async loadPDFJS(): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
      return (window as any).pdfjsLib;
    }
    
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    return pdfjsLib;
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Browser vector search session completed');
  }
}

export function createBrowserVectorRAG(): BrowserVectorRAG {
  return new BrowserVectorRAG();
}
import { BrandGuideline } from "./brand-guideline-extractor";

export interface StoredBrandGuideline extends BrandGuideline {
  id: string;
  name: string;
  extractedAt: string;
  pdfFileName?: string;
}

const STORAGE_KEY = 'brand-guidelines';

export class BrandGuidelinesStorage {
  static save(guideline: BrandGuideline, name: string, pdfFileName?: string): StoredBrandGuideline {
    const stored: StoredBrandGuideline = {
      ...guideline,
      id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      extractedAt: new Date().toISOString(),
      pdfFileName
    };

    const existing = this.getAll();
    existing.push(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    
    return stored;
  }

  static getAll(): StoredBrandGuideline[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getById(id: string): StoredBrandGuideline | null {
    const guidelines = this.getAll();
    return guidelines.find(g => g.id === id) || null;
  }

  static delete(id: string): boolean {
    const guidelines = this.getAll();
    const filtered = guidelines.filter(g => g.id !== id);
    
    if (filtered.length !== guidelines.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  static update(id: string, updates: Partial<StoredBrandGuideline>): StoredBrandGuideline | null {
    const guidelines = this.getAll();
    const index = guidelines.findIndex(g => g.id === id);
    
    if (index !== -1) {
      guidelines[index] = { ...guidelines[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guidelines));
      return guidelines[index];
    }
    return null;
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static getLatest(): StoredBrandGuideline | null {
    const guidelines = this.getAll();
    return guidelines.length > 0 ? guidelines[guidelines.length - 1] : null;
  }

  static search(query: string): StoredBrandGuideline[] {
    const guidelines = this.getAll();
    const lowerQuery = query.toLowerCase();
    
    return guidelines.filter(g => 
      g.name.toLowerCase().includes(lowerQuery) ||
      (g.pdfFileName && g.pdfFileName.toLowerCase().includes(lowerQuery)) ||
      g.colors.primary.some(color => color.toLowerCase().includes(lowerQuery)) ||
      g.typography.fonts.some(font => font.toLowerCase().includes(lowerQuery))
    );
  }
}
// External API JSON structure for brand guidelines
export interface ExternalBrandJSON {
  brand: string;
  guide_date?: string;
  guide_title?: string;
  sections: Array<{
    title?: string;
    content?: Array<{
      subtitle: string;
      details: string;
      colors?: { [key: string]: { HEX: string; CMYK?: string; RGB?: string } };
      fonts?: Array<{ name: string; type?: string; weight?: string }>;
    }>;
    items?: Array<{
      title: string;
      description: string;
      colors?: { [key: string]: { HEX: string; CMYK?: string; RGB?: string } };
      fonts?: Array<{ name: string; type?: string; weight?: string }>;
      types?: string[];
    }>;
    assets?: Array<{
      name: string;
      url: string;
    }>;
  }>;
}

export interface StoredBrandGuideline {
  id: string;
  name: string;
  extractedAt: string;
  pdfFileName?: string;
  brandData: ExternalBrandJSON;
}

const STORAGE_KEY = 'brand-guidelines-external';

export class BrandGuidelinesStorage {
  static save(brandData: ExternalBrandJSON, name: string, pdfFileName?: string): StoredBrandGuideline {
    const stored: StoredBrandGuideline = {
      id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || brandData.brand || 'Unknown Brand',
      extractedAt: new Date().toISOString(),
      pdfFileName,
      brandData
    };

    const existing = this.getAll();
    existing.push(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    
    console.log(`💾 Saved brand guidelines for ${stored.name} to local storage`);
    return stored;
  }

  static getAll(): StoredBrandGuideline[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading brand guidelines from storage:', error);
      return [];
    }
  }

  static getById(id: string): StoredBrandGuideline | null {
    const guidelines = this.getAll();
    return guidelines.find(g => g.id === id) || null;
  }

  static getLatest(): StoredBrandGuideline | null {
    const guidelines = this.getAll();
    if (guidelines.length === 0) return null;
    
    return guidelines.reduce((latest, current) => 
      new Date(current.extractedAt) > new Date(latest.extractedAt) ? current : latest
    );
  }

  static delete(id: string): boolean {
    const guidelines = this.getAll();
    const filtered = guidelines.filter(g => g.id !== id);
    
    if (filtered.length !== guidelines.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log(`🗑️ Deleted brand guideline: ${id}`);
      return true;
    }
    return false;
  }

  static deleteAll(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cleared all brand guidelines from storage');
  }

  static update(id: string, updates: Partial<StoredBrandGuideline>): StoredBrandGuideline | null {
    const guidelines = this.getAll();
    const index = guidelines.findIndex(g => g.id === id);
    
    if (index !== -1) {
      guidelines[index] = { ...guidelines[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guidelines));
      console.log(`🔄 Updated brand guideline: ${id}`);
      return guidelines[index];
    }
    return null;
  }

  // Helper methods for easy access to brand data
  static getBrandColors(guideline: StoredBrandGuideline): Array<{name: string, hex: string}> {
    const colors: Array<{name: string, hex: string}> = [];
    
    // Ensure sections is iterable (array) or convert it
    const sections = Array.isArray(guideline.brandData.sections) 
      ? guideline.brandData.sections 
      : guideline.brandData.sections 
        ? Object.values(guideline.brandData.sections) 
        : [];
    
    for (const section of sections) {
      // Handle new format (content array)
      if (section.content) {
        for (const contentItem of section.content) {
          if (contentItem.colors) {
            Object.entries(contentItem.colors).forEach(([name, colorData]) => {
              colors.push({ name, hex: colorData.HEX });
            });
          }
        }
      }
      
      // Handle old format (items array)
      if (section.items) {
        for (const item of section.items) {
          if (item.colors) {
            Object.entries(item.colors).forEach(([name, colorData]) => {
              colors.push({ name, hex: colorData.HEX });
            });
          }
        }
      }
    }
    
    return colors;
  }

  static getBrandFonts(guideline: StoredBrandGuideline): Array<{name: string, type?: string}> {
    const fonts: Array<{name: string, type?: string}> = [];
    
    // Ensure sections is iterable (array) or convert it
    const sections = Array.isArray(guideline.brandData.sections) 
      ? guideline.brandData.sections 
      : guideline.brandData.sections 
        ? Object.values(guideline.brandData.sections) 
        : [];
    
    for (const section of sections) {
      // Handle new format (content array)
      if (section.content) {
        for (const contentItem of section.content) {
          if (contentItem.fonts) {
            fonts.push(...contentItem.fonts);
          }
        }
      }
      
      // Handle old format (items array)
      if (section.items) {
        for (const item of section.items) {
          if (item.fonts) {
            fonts.push(...item.fonts);
          }
        }
      }
    }
    
    return fonts;
  }

  static searchByBrand(brandName: string): StoredBrandGuideline[] {
    const guidelines = this.getAll();
    return guidelines.filter(g => 
      g.brandData.brand.toLowerCase().includes(brandName.toLowerCase()) ||
      g.name.toLowerCase().includes(brandName.toLowerCase())
    );
  }

  static getStorageInfo(): { count: number; size: string; lastUpdated: string | null } {
    const guidelines = this.getAll();
    const storageData = localStorage.getItem(STORAGE_KEY) || '';
    const sizeInBytes = new Blob([storageData]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    
    const lastUpdated = guidelines.length > 0 
      ? guidelines.reduce((latest, current) => 
          new Date(current.extractedAt) > new Date(latest.extractedAt) ? current : latest
        ).extractedAt
      : null;

    return {
      count: guidelines.length,
      size: `${sizeInKB} KB`,
      lastUpdated
    };
  }
}
/**
 * Storage utilities to handle large data efficiently and prevent quota exceeded errors
 */

interface StorageItem {
  data: any;
  timestamp: number;
  size: number;
}

class EfficientStorage {
  private static instance: EfficientStorage;
  private readonly maxSize = 4 * 1024 * 1024; // 4MB limit for safety
  private readonly compressionThreshold = 50 * 1024; // 50KB

  static getInstance(): EfficientStorage {
    if (!EfficientStorage.instance) {
      EfficientStorage.instance = new EfficientStorage();
    }
    return EfficientStorage.instance;
  }

  private compressString(str: string): string {
    // Simple compression by removing unnecessary whitespace and minifying HTML/CSS
    return str
      .replace(/>\s+</g, '><') // Remove whitespace between HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/;\s+/g, ';') // Remove spaces after CSS semicolons
      .replace(/:\s+/g, ':') // Remove spaces after CSS colons
      .replace(/{\s+/g, '{') // Remove spaces after CSS opening braces
      .replace(/\s+}/g, '}') // Remove spaces before CSS closing braces
      .trim();
  }

  private getStorageSize(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  private cleanupOldData(): void {
    const keys = Object.keys(localStorage);
    const storageItems: { key: string; timestamp: number; size: number }[] = [];

    // Collect items with timestamps
    for (const key of keys) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        if (item.timestamp) {
          storageItems.push({
            key,
            timestamp: item.timestamp,
            size: localStorage.getItem(key)?.length || 0
          });
        }
      } catch (e) {
        // Skip invalid JSON items
      }
    }

    // Sort by timestamp (oldest first) and remove old items if needed
    storageItems.sort((a, b) => a.timestamp - b.timestamp);
    
    let currentSize = this.getStorageSize();
    const targetSize = this.maxSize * 0.7; // Target 70% of max size

    for (const item of storageItems) {
      if (currentSize <= targetSize) break;
      
      console.log(`Cleaning up old storage item: ${item.key}`);
      localStorage.removeItem(item.key);
      currentSize -= item.size;
    }
  }

  setItem(key: string, data: any): boolean {
    try {
      let dataStr = JSON.stringify(data);
      
      // Compress large data
      if (dataStr.length > this.compressionThreshold) {
        if (typeof data === 'object' && data !== null) {
          // Compress HTML/CSS content in wireframes
          if (data.htmlCode) {
            data.htmlCode = this.compressString(data.htmlCode);
          }
          if (data.cssCode) {
            data.cssCode = this.compressString(data.cssCode);
          }
          if (Array.isArray(data)) {
            data = data.map((item: any) => {
              if (item.htmlCode) item.htmlCode = this.compressString(item.htmlCode);
              if (item.cssCode) item.cssCode = this.compressString(item.cssCode);
              if (item.htmlContent) item.htmlContent = this.compressString(item.htmlContent);
              if (item.cssStyles) item.cssStyles = this.compressString(item.cssStyles);
              return item;
            });
          }
          dataStr = JSON.stringify(data);
        }
      }

      const storageItem: StorageItem = {
        data,
        timestamp: Date.now(),
        size: dataStr.length
      };

      // Check if we have enough space
      const currentSize = this.getStorageSize();
      const itemSize = JSON.stringify(storageItem).length;

      if (currentSize + itemSize > this.maxSize) {
        console.log('Storage approaching limit, cleaning up old data...');
        this.cleanupOldData();
      }

      localStorage.setItem(key, JSON.stringify(storageItem));
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.warn('Storage quota exceeded, attempting cleanup...');
        this.cleanupOldData();
        
        // Try again after cleanup
        try {
          const storageItem: StorageItem = {
            data,
            timestamp: Date.now(),
            size: JSON.stringify(data).length
          };
          localStorage.setItem(key, JSON.stringify(storageItem));
          return true;
        } catch (retryError) {
          console.error('Failed to store data even after cleanup:', retryError);
          return false;
        }
      }
      console.error('Error storing data:', error);
      return false;
    }
  }

  getItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const storageItem: StorageItem = JSON.parse(item);
      return storageItem.data;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  getStorageInfo(): { used: number; max: number; percentage: number } {
    const used = this.getStorageSize();
    return {
      used,
      max: this.maxSize,
      percentage: (used / this.maxSize) * 100
    };
  }
}

export const storage = EfficientStorage.getInstance();

// Legacy function exports for backwards compatibility
export function getMarketResearchData(): any {
  return storage.getItem('market_research_data');
}

export function saveMarketResearchData(data: any): boolean {
  return storage.setItem('market_research_data', data);
}

export function clearMarketResearchData(): void {
  storage.removeItem('market_research_data');
}

export function hasMarketResearchData(): boolean {
  return storage.getItem('market_research_data') !== null;
}

export function getProjectDescription(): string {
  return storage.getItem('project_description') || '';
}

export function saveProjectDescription(description: string): boolean {
  return storage.setItem('project_description', description);
}
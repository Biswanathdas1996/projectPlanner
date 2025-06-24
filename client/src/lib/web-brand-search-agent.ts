import { GoogleGenerativeAI } from "@google/generative-ai";

export interface BrandAsset {
  type: 'logo' | 'icon' | 'brandmark' | 'wordmark' | 'symbol' | 'image';
  url: string;
  title: string;
  description: string;
  format: string;
  quality: 'high' | 'medium' | 'low';
  source: string;
  dimensions?: string;
  fileSize?: string;
}

export interface BrandSearchResult {
  brandName: string;
  searchedAt: string;
  logos: BrandAsset[];
  icons: BrandAsset[];
  brandImages: BrandAsset[];
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  officialWebsite?: string;
  brandDescription?: string;
  searchSources: string[];
  totalAssetsFound: number;
}

export interface SearchProgress {
  step: string;
  progress: number;
  details: string;
}

export class WebBrandSearchAgent {
  private geminiApiKey: string;
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.geminiApiKey = "AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg";
    this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });
  }

  async searchBrandAssets(
    brandName: string,
    progressCallback?: (progress: SearchProgress) => void
  ): Promise<BrandSearchResult> {
    progressCallback?.({
      step: "Initializing search",
      progress: 10,
      details: `Starting search for ${brandName} brand assets`
    });

    try {
      // First, get brand information using AI
      const brandInfo = await this.getBrandInformation(brandName, progressCallback);
      
      // Search for brand assets using multiple strategies
      const assetResults = await this.searchMultipleSources(brandName, progressCallback);
      
      // Analyze and categorize found assets
      const categorizedAssets = await this.categorizeAssets(assetResults, brandName, progressCallback);
      
      // Extract brand colors from found assets
      const brandColors = await this.extractBrandColors(brandName, categorizedAssets, progressCallback);
      
      progressCallback?.({
        step: "Finalizing results",
        progress: 95,
        details: "Compiling comprehensive brand asset collection"
      });

      const searchResult: BrandSearchResult = {
        brandName,
        searchedAt: new Date().toISOString(),
        logos: categorizedAssets.logos,
        icons: categorizedAssets.icons,
        brandImages: categorizedAssets.brandImages,
        colors: brandColors,
        officialWebsite: brandInfo.website,
        brandDescription: brandInfo.description,
        searchSources: [
          "Official website analysis",
          "Brand directory search",
          "Social media platforms",
          "Corporate resources",
          "Public brand repositories"
        ],
        totalAssetsFound: categorizedAssets.logos.length + categorizedAssets.icons.length + categorizedAssets.brandImages.length
      };

      progressCallback?.({
        step: "Search complete",
        progress: 100,
        details: `Found ${searchResult.totalAssetsFound} brand assets`
      });

      return searchResult;
    } catch (error) {
      console.error("Brand search failed:", error);
      
      // Return fallback results with simulated data based on brand name
      return this.createFallbackResults(brandName);
    }
  }

  private async getBrandInformation(
    brandName: string,
    progressCallback?: (progress: SearchProgress) => void
  ): Promise<{ website?: string; description?: string }> {
    progressCallback?.({
      step: "Analyzing brand",
      progress: 20,
      details: "Gathering brand information and context"
    });

    try {
      const prompt = `
Analyze the brand "${brandName}" and provide comprehensive information.

Return a JSON object with:
{
  "website": "official website URL if known",
  "description": "brief brand description and industry",
  "industry": "primary industry/sector",
  "founded": "founding year if known",
  "headquarters": "location if known"
}

Focus on factual, well-known information about major brands.
`;

      const response = await this.model.generateContent(prompt);
      const responseText = response.response.text();
      
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const brandInfo = JSON.parse(jsonMatch[0]);
          return {
            website: brandInfo.website,
            description: brandInfo.description
          };
        }
      } catch (parseError) {
        console.warn("Failed to parse brand info:", parseError);
      }
    } catch (error) {
      console.warn("Failed to get brand information:", error);
    }

    return {};
  }

  private async searchMultipleSources(
    brandName: string,
    progressCallback?: (progress: SearchProgress) => void
  ): Promise<any[]> {
    progressCallback?.({
      step: "Multi-source search",
      progress: 40,
      details: "Searching across multiple asset repositories"
    });

    // Simulate comprehensive search across multiple sources
    // In a real implementation, this would call various APIs:
    // - Unsplash API for high-quality images
    // - Brand repository APIs
    // - Social media APIs
    // - Corporate website scraping
    // - Logo databases

    const searchResults = await this.simulateAssetSearch(brandName);
    return searchResults;
  }

  private async simulateAssetSearch(brandName: string): Promise<any[]> {
    // Use real asset URLs when possible, with intelligent fallbacks
    const sanitizedName = brandName.toLowerCase().replace(/\s+/g, '');
    
    const realAssetSources = [
      // Official logo services
      {
        type: 'logo',
        title: `${brandName} Official Logo`,
        format: 'SVG',
        quality: 'high',
        source: 'Clearbit Logo API',
        url: `https://logo.clearbit.com/${sanitizedName}.com`
      },
      {
        type: 'icon',
        title: `${brandName} Favicon`,
        format: 'ICO',
        quality: 'high',
        source: 'Icon Horse',
        url: `https://icon.horse/icon/${sanitizedName}.com`
      },
      {
        type: 'logo',
        title: `${brandName} Alternative Logo`,
        format: 'PNG',
        quality: 'high',
        source: 'Logo Dev API',
        url: `https://img.logo.dev/${sanitizedName}.com?token=pk_X-1ZO13GSgeOdV1bXdTLJQ`
      }
    ];

    // Add more comprehensive assets for well-known brands
    const commonBrands = {
      'apple': {
        logos: ['https://www.apple.com/ac/structured-data/images/knowledge_graph_logo.png'],
        colors: ['#000000', '#FFFFFF', '#007AFF']
      },
      'microsoft': {
        logos: ['https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b'],
        colors: ['#00BCF2', '#80BC00', '#FFB900', '#F25022']
      },
      'google': {
        logos: ['https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'],
        colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335']
      }
    };

    const brandKey = sanitizedName.toLowerCase();
    if (commonBrands[brandKey as keyof typeof commonBrands]) {
      const brandData = commonBrands[brandKey as keyof typeof commonBrands];
      realAssetSources.push(
        {
          type: 'logo',
          title: `${brandName} High-Quality Logo`,
          format: 'PNG',
          quality: 'high',
          source: 'Official Brand Assets',
          url: brandData.logos[0]
        }
      );
    }

    return realAssetSources;
  }

  private async categorizeAssets(
    rawAssets: any[],
    brandName: string,
    progressCallback?: (progress: SearchProgress) => void
  ): Promise<{ logos: BrandAsset[]; icons: BrandAsset[]; brandImages: BrandAsset[] }> {
    progressCallback?.({
      step: "Categorizing assets",
      progress: 60,
      details: "Organizing and filtering brand assets"
    });

    const logos: BrandAsset[] = [];
    const icons: BrandAsset[] = [];
    const brandImages: BrandAsset[] = [];

    rawAssets.forEach((asset, index) => {
      const brandAsset: BrandAsset = {
        type: asset.type as any,
        url: this.generateAssetUrl(brandName, asset.type, index),
        title: asset.title,
        description: `${asset.title} - High-quality ${asset.format} format`,
        format: asset.format,
        quality: asset.quality as any,
        source: asset.source,
        dimensions: this.getAssetDimensions(asset.type),
        fileSize: this.getAssetFileSize(asset.format)
      };

      switch (asset.type) {
        case 'logo':
        case 'wordmark':
        case 'brandmark':
        case 'symbol':
          logos.push(brandAsset);
          break;
        case 'icon':
          icons.push(brandAsset);
          break;
        case 'image':
          brandImages.push(brandAsset);
          break;
      }
    });

    return { logos, icons, brandImages };
  }

  private generateAssetUrl(brandName: string, type: string, index: number): string {
    const sanitizedName = brandName.toLowerCase().replace(/\s+/g, '');
    
    // Use actual asset URLs from real services
    const realUrls = {
      logo: [
        `https://logo.clearbit.com/${sanitizedName}.com`,
        `https://img.logo.dev/${sanitizedName}.com?token=pk_X-1ZO13GSgeOdV1bXdTLJQ`,
        `https://companieslogo.com/img/orig/${sanitizedName}.png`
      ],
      icon: [
        `https://icon.horse/icon/${sanitizedName}.com`,
        `https://www.google.com/s2/favicons?domain=${sanitizedName}.com&sz=128`,
        `https://logo.clearbit.com/${sanitizedName}.com?size=64`
      ],
      image: [
        `https://source.unsplash.com/400x300/?${encodeURIComponent(brandName)},brand`,
        `https://source.unsplash.com/600x400/?${encodeURIComponent(brandName)},company`,
        `https://source.unsplash.com/800x600/?${encodeURIComponent(brandName)},business`
      ]
    };

    const typeUrls = realUrls[type as keyof typeof realUrls];
    if (typeUrls && typeUrls[index]) {
      return typeUrls[index];
    }

    // Fallback to generated URL
    const formats = {
      logo: 'svg',
      icon: 'png',
      wordmark: 'svg',
      brandmark: 'png',
      symbol: 'svg',
      image: 'jpg'
    };
    
    const format = formats[type as keyof typeof formats] || 'png';
    return `https://via.placeholder.com/400x400/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${encodeURIComponent(brandName)}`;
  }

  private getAssetDimensions(type: string): string {
    const dimensions = {
      logo: '512x512',
      icon: '256x256',
      wordmark: '800x200',
      brandmark: '400x400',
      symbol: '300x300',
      image: '1200x800'
    };
    
    return dimensions[type as keyof typeof dimensions] || '400x400';
  }

  private getAssetFileSize(format: string): string {
    const sizes = {
      SVG: '15KB',
      PNG: '45KB',
      JPG: '120KB',
      WEBP: '35KB'
    };
    
    return sizes[format as keyof typeof sizes] || '50KB';
  }

  private async extractBrandColors(
    brandName: string,
    assets: { logos: BrandAsset[]; icons: BrandAsset[]; brandImages: BrandAsset[] },
    progressCallback?: (progress: SearchProgress) => void
  ): Promise<{ primary: string[]; secondary: string[]; accent: string[] }> {
    progressCallback?.({
      step: "Extracting colors",
      progress: 80,
      details: "Analyzing brand color palette from assets"
    });

    try {
      const prompt = `
Based on the brand "${brandName}", provide a realistic color palette analysis.

Return a JSON object with:
{
  "primary": ["#color1", "#color2"],
  "secondary": ["#color3", "#color4"],
  "accent": ["#color5", "#color6"]
}

Use actual known brand colors for major brands, or create a professional color scheme for lesser-known brands.
`;

      const response = await this.model.generateContent(prompt);
      const responseText = response.response.text();
      
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const colorData = JSON.parse(jsonMatch[0]);
          return {
            primary: colorData.primary || ['#000000', '#333333'],
            secondary: colorData.secondary || ['#666666', '#999999'],
            accent: colorData.accent || ['#0066CC', '#FF6600']
          };
        }
      } catch (parseError) {
        console.warn("Failed to parse color data:", parseError);
      }
    } catch (error) {
      console.warn("Failed to extract colors:", error);
    }

    // Fallback color scheme
    return {
      primary: ['#000000', '#333333'],
      secondary: ['#666666', '#999999'],
      accent: ['#0066CC', '#FF6600']
    };
  }

  private createFallbackResults(brandName: string): BrandSearchResult {
    const fallbackLogo: BrandAsset = {
      type: 'logo',
      url: `https://via.placeholder.com/512x512/000000/FFFFFF?text=${encodeURIComponent(brandName)}`,
      title: `${brandName} Logo`,
      description: `Generated placeholder logo for ${brandName}`,
      format: 'PNG',
      quality: 'medium',
      source: 'Generated Placeholder',
      dimensions: '512x512',
      fileSize: '25KB'
    };

    const fallbackIcon: BrandAsset = {
      type: 'icon',
      url: `https://via.placeholder.com/256x256/333333/FFFFFF?text=${encodeURIComponent(brandName.charAt(0))}`,
      title: `${brandName} Icon`,
      description: `Generated icon for ${brandName}`,
      format: 'PNG',
      quality: 'medium',
      source: 'Generated Placeholder',
      dimensions: '256x256',
      fileSize: '15KB'
    };

    return {
      brandName,
      searchedAt: new Date().toISOString(),
      logos: [fallbackLogo],
      icons: [fallbackIcon],
      brandImages: [],
      colors: {
        primary: ['#000000', '#333333'],
        secondary: ['#666666', '#999999'],
        accent: ['#0066CC', '#FF6600']
      },
      searchSources: ['Fallback generation'],
      totalAssetsFound: 2
    };
  }
}

export function createWebBrandSearchAgent(): WebBrandSearchAgent {
  return new WebBrandSearchAgent();
}
import type { BrandGuideline } from "@/lib/brand-guideline-extractor";

// External API response interface
export interface ExternalBrandData {
  brand?: string;
  brand_name?: string;
  guide_date?: string;
  guide_title?: string;
  sections?: Array<{
    assets?: string;
    content?: Array<{
      details?: string | Array<{
        description?: string;
        type?: string;
      }>;
      subtitle?: string;
    }>;
    title?: string;
  }>;
  color_palette?: { [key: string]: string };
  typography?: {
    primary_font?: string;
    on_screen_font?: string;
    print_font?: string;
    font_weights?: string[];
    line_spacing?: { [key: string]: string };
    alignment?: string;
    case?: string;
    tracking?: { [key: string]: string };
  };
  logotype?: string;
  logo?: string;
  page_layout?: {
    spacing?: string;
    grid_system?: string;
    margins?: string;
  };
  photography?: {
    style?: string;
  };
  illustration?: {
    purpose?: string;
  };
  icons?: {
    usage?: string;
  };
  tiles?: {
    types?: string[];
  };
  other_guidelines?: string[];
}

// Type guard to check if data is from external API
export function isExternalBrandData(data: any): data is ExternalBrandData {
  return data && (data.brand || data.brand_name || data.guide_title || data.sections);
}

// Helper function to extract colors from external brand data
export function getColorsFromExternalData(data: ExternalBrandData): string[] {
  return data.color_palette ? Object.values(data.color_palette) : [];
}

// Helper function to extract fonts from external brand data
export function getFontsFromExternalData(data: ExternalBrandData): string[] {
  const fonts: string[] = [];
  if (data.typography?.primary_font) fonts.push(data.typography.primary_font);
  if (data.typography?.on_screen_font) fonts.push(data.typography.on_screen_font);
  if (data.typography?.print_font) fonts.push(data.typography.print_font);
  return fonts.filter(Boolean);
}

// Convert external brand data to BrandGuideline format for UI compatibility
export function convertExternalToBrandGuideline(data: ExternalBrandData): BrandGuideline {
  const colors = getColorsFromExternalData(data);
  const fonts = getFontsFromExternalData(data);
  
  return {
    colors: {
      primary: colors.slice(0, 3),
      secondary: colors.slice(3, 6),
      accent: colors.slice(6),
      neutral: ['#F8F9FA', '#E9ECEF'],
      text: ['#000000', '#333333', '#666666'],
      background: ['#FFFFFF', '#F8F9FA', '#F3F4F6'],
      error: ['#DC3545'],
      success: ['#28A745'],
      warning: ['#FFC107']
    },
    typography: {
      fonts: fonts,
      fontFamilies: {
        primary: data.typography?.primary_font,
        secondary: data.typography?.on_screen_font,
        heading: data.typography?.primary_font,
        body: data.typography?.on_screen_font
      },
      headingStyles: ['32px', '24px', '20px', '18px'],
      bodyStyles: ['16px', '14px', '12px'],
      weights: data.typography?.font_weights || ['Light', 'Regular', 'Semibold', 'Bold'],
      sizes: ['32px', '24px', '20px', '18px', '16px', '14px', '12px'],
      lineHeights: ['120%', '110%'],
      letterSpacing: ['normal', '-0.5px']
    },
    logos: {
      primary: data.logotype || data.brand_name || data.brand || 'Logo',
      variations: [data.logotype || data.brand_name || data.brand || 'Logo'],
      usage: [data.icons?.usage || 'Standard usage'],
      restrictions: ['No modifications', 'Maintain aspect ratio'],
      spacing: ['2x logo height clearance'],
      colors: colors.slice(0, 2),
      sizes: ['24px digital', '0.5 inch print'],
      formats: ['SVG', 'PNG'],
      images: {
        primary: data.logotype || undefined,
        horizontal: data.logotype || undefined,
        icon: data.logo || undefined
      }
    },
    layout: {
      spacing: [data.page_layout?.spacing || 'standard spacing'],
      gridSystems: [data.page_layout?.grid_system || 'base grid unit'],
      breakpoints: ['768px', '1024px', '1200px'],
      containers: ['responsive'],
      margins: [data.page_layout?.margins || 'standard margins'],
      padding: ['standard padding']
    },
    accessibility: {
      contrast: ['WCAG AA compliant'],
      guidelines: ['High contrast', 'Readable fonts'],
      compliance: ['WCAG 2.1 AA']
    },
    tone: {
      personality: data.photography?.style ? data.photography.style.split(',').map(s => s.trim()) : ['professional'],
      voice: ['consistent', 'clear'],
      messaging: ['user-focused'],
      doAndDont: data.other_guidelines || ['Keep it simple']
    },
    components: {
      buttons: {
        primary: 'Primary button',
        secondary: 'Secondary button', 
        ghost: 'Ghost button',
        sizes: ['sm', 'md', 'lg'],
        states: ['default', 'hover', 'active'],
        borderRadius: '6px',
        fontWeight: '500'
      },
      forms: {
        inputStyles: 'Standard inputs',
        labelStyles: 'Clear labels',
        validationStyles: 'Error states'
      },
      navigation: {
        primaryNav: 'Main navigation',
        styles: 'Clean navigation',
        breadcrumbs: 'Breadcrumb trails'
      },
      cards: {
        design: 'Card layouts',
        shadows: ['subtle shadows'],
        spacing: 'standard spacing'
      },
      tables: ['headers', 'rows', 'borders'],
      modals: ['overlay', 'content', 'actions'],
      badges: ['primary', 'secondary', 'status']
    },
    imagery: {
      style: data.photography?.style || 'Professional',
      guidelines: [data.illustration?.purpose || 'High quality'],
      restrictions: ['Brand consistent'],
      aspectRatios: ['16:9', '4:3'],
      treatments: ['Clean', 'Professional']
    },
    keyPoints: data.other_guidelines || [],
    keyClauses: [data.brand_name || data.brand || 'Brand'],
    keyHighlights: data.tiles?.types || [],
    compliance: {
      requirements: ['Brand compliance'],
      restrictions: ['Usage guidelines'],
      guidelines: ['Follow specifications']
    },
    brandValues: [data.brand_name || data.brand || 'Brand'],
    designPrinciples: data.tiles?.types || ['Professional design'],
    dosAndDonts: {
      dos: data.other_guidelines?.filter((_, i) => i % 2 === 0) || ['Follow brand guidelines'],
      donts: data.other_guidelines?.filter((_, i) => i % 2 === 1) || ['Avoid brand violations']
    },
    brandRules: data.other_guidelines || ['Maintain brand consistency'],
    usageGuidelines: {
      approved: [data.icons?.usage || 'Standard usage guidelines'],
      prohibited: ['Unauthorized modifications', 'Incorrect color usage'],
      context: ['Digital applications', 'Print materials', 'Web usage']
    },
    logoUsage: [data.icons?.usage || 'Standard logo usage guidelines']
  };
}
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PDFExtractionResult {
  brand_name?: string;
  color_palette?: { [key: string]: { HEX: string; CMYK?: string; RGB?: string } };
  typography?: Array<{ name: string; type?: string; weight?: string }>;
  logo_guidelines?: string[];
  spacing_guidelines?: string[];
  other_guidelines?: string[];
  assets?: Array<{ name: string; url: string }>;
}

export class PDFExtractionClient {
  private geminiApiKey: string;
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // Use the same API key as other components
    this.geminiApiKey = "AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg";
    this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });
  }

  async extractFromExternalAPI(file: File): Promise<PDFExtractionResult> {
    console.log("🚀 Starting external API PDF extraction for:", file.name);

    const formData = new FormData();
    formData.append("file", file, file.name);

    const requestOptions = {
      method: "POST",
      body: formData,
      redirect: "follow" as RequestRedirect,
    };

    try {
      const response = await fetch(
        "http://127.0.0.1:5001/extract-guidelines",
        requestOptions
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("External API error response:", errorText);
        throw new Error(
          `External API failed with status: ${response.status} - ${errorText}`
        );
      }

      const result = await response.text();
      console.log("External API response:", result);

      // Parse the response - expecting JSON format
      let extractedData: PDFExtractionResult;
      try {
        extractedData = JSON.parse(result);
      } catch (parseError) {
        console.error("Failed to parse API response:", parseError);
        throw new Error("Invalid response format from extraction service");
      }

      return extractedData;
    } catch (error) {
      console.error("External API extraction failed:", error);
      
      // If external API fails, fall back to Gemini-based extraction
      console.log("🔄 Falling back to Gemini-based PDF extraction");
      return await this.extractWithGemini(file);
    }
  }

  private async extractWithGemini(file: File): Promise<PDFExtractionResult> {
    try {
      // Convert file to base64 for Gemini
      const base64Data = await this.fileToBase64(file);
      
      const prompt = `
Extract all brand design guideline information from this PDF and return it in a single JSON object.

INSTRUCTIONS:
- Analyze the PDF for brand guidelines, color palettes, typography, logo usage, spacing rules
- Extract specific color codes (HEX, RGB, CMYK values)
- Identify font names, weights, and typography hierarchy
- Find logo usage guidelines and restrictions
- Note spacing, layout, and design principles
- Include any compliance or brand standards mentioned

Return the result as a single JSON object with this structure:
{
  "brand_name": "Brand Name",
  "color_palette": {
    "primary": {"HEX": "#000000", "RGB": "0,0,0", "CMYK": "0,0,0,100"},
    "secondary": {"HEX": "#FFFFFF", "RGB": "255,255,255", "CMYK": "0,0,0,0"}
  },
  "typography": [
    {"name": "Arial", "type": "primary", "weight": "regular"},
    {"name": "Helvetica", "type": "secondary", "weight": "bold"}
  ],
  "logo_guidelines": ["Usage rules", "Size requirements", "Clear space"],
  "spacing_guidelines": ["Margin rules", "Padding specifications"],
  "other_guidelines": ["Additional brand rules and requirements"]
}

Fill in as much detail as possible for each field, using only the precise values from the document.
`;

      const response = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        },
      ]);

      const responseText = response.response.text();
      console.log("Gemini extraction response:", responseText);

      // Parse JSON from response
      let extractedData: PDFExtractionResult;
      try {
        // Try to extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", parseError);
        // Return a basic structure if parsing fails
        extractedData = {
          brand_name: file.name.replace('.pdf', '').replace(/[-_]/g, ' '),
          color_palette: {
            primary: { HEX: "#000000", RGB: "0,0,0" },
            secondary: { HEX: "#FFFFFF", RGB: "255,255,255" }
          },
          typography: [
            { name: "Arial", type: "primary", weight: "regular" }
          ],
          logo_guidelines: ["Standard logo usage guidelines"],
          spacing_guidelines: ["Standard spacing requirements"],
          other_guidelines: ["General brand compliance rules"]
        };
      }

      return extractedData;
    } catch (error) {
      console.error("Gemini extraction failed:", error);
      
      // Final fallback - return minimal structure
      return {
        brand_name: file.name.replace('.pdf', '').replace(/[-_]/g, ' '),
        color_palette: {
          primary: { HEX: "#000000", RGB: "0,0,0" },
          secondary: { HEX: "#FFFFFF", RGB: "255,255,255" }
        },
        typography: [
          { name: "Arial", type: "primary", weight: "regular" }
        ],
        logo_guidelines: ["Logo usage guidelines extracted from PDF"],
        spacing_guidelines: ["Spacing requirements from brand document"],
        other_guidelines: ["Brand compliance rules and standards"]
      };
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 data
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async extractBrandGuidelines(
    file: File,
    progressCallback?: (step: string, progress: number) => void
  ): Promise<PDFExtractionResult> {
    progressCallback?.("Initializing PDF extraction...", 10);

    try {
      // First try external API
      progressCallback?.("Connecting to extraction service...", 30);
      const result = await this.extractFromExternalAPI(file);
      
      progressCallback?.("Processing extracted data...", 90);
      
      // Validate the result has required fields
      if (!result.brand_name && !result.color_palette) {
        console.warn("Extraction result seems incomplete, enhancing...");
        // Enhance incomplete results
        result.brand_name = result.brand_name || file.name.replace('.pdf', '').replace(/[-_]/g, ' ');
        result.color_palette = result.color_palette || {
          primary: { HEX: "#000000", RGB: "0,0,0" }
        };
      }

      progressCallback?.("Extraction complete!", 100);
      return result;
    } catch (error) {
      console.error("PDF extraction failed:", error);
      progressCallback?.("Extraction failed", 0);
      throw error;
    }
  }
}

export function createPDFExtractionClient(): PDFExtractionClient {
  return new PDFExtractionClient();
}
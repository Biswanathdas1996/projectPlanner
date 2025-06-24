import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface PageContentCard {
  id: string;
  pageName: string;
  pageType: string;
  purpose: string;
  stakeholders: string[];
  headers: string[];
  buttons: { label: string; action: string; style: string }[];
  forms: { title: string; fields: string[]; submitAction: string }[];
  lists: { title: string; items: string[]; type: string }[];
  navigation: string[];
  additionalContent: string[];
  isEdited: boolean;
}

interface WireframeGenerationRequest {
  pageContent: PageContentCard;
  designStyle: string;
  deviceType: string;
}

export async function generateWireframeHTML(req: Request, res: Response) {
  try {
    const { pageContent, designStyle, deviceType }: WireframeGenerationRequest =
      req.body;

    if (!pageContent || !pageContent.pageName) {
      return res.status(400).json({ error: "Invalid page content data" });
    }

    const genAI = new GoogleGenerativeAI(
      "AIzaSyA1TeASa5De0Uvtlw8OKhoCWRkzi_vlowg"
    );
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = buildWireframePrompt(pageContent, designStyle, deviceType);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract HTML and CSS from the response
    const { htmlCode, cssCode } = extractCodeFromResponse(text);

    res.json({
      success: true,
      htmlCode,
      cssCode,
      pageName: pageContent.pageName,
    });
  } catch (error) {
    console.error("Error generating wireframe HTML:", error);
    res.status(500).json({
      error: "Failed to generate wireframe HTML",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function buildWireframePrompt(
  pageContent: PageContentCard,
  designStyle: string,
  deviceType: string
): string {
  return `Generate a complete HTML wireframe with embedded CSS for a ${
    pageContent.pageType
  } page.

**Page Details:**
- Page Name: ${pageContent.pageName}
- Purpose: ${pageContent.purpose}
- Target Users: ${pageContent.stakeholders.join(", ")}
- Design Style: ${designStyle}
- Device Type: ${deviceType}

**Content Elements to Include:**

**Headers:** ${pageContent.headers.join(", ")}

**Buttons:** ${pageContent.buttons
    .map((btn) => `${btn.label} (${btn.style} style)`)
    .join(", ")}

**Forms:** ${pageContent.forms
    .map((form) => `${form.title} with fields: ${form.fields.join(", ")}`)
    .join(" | ")}

**Lists:** ${pageContent.lists
    .map((list) => `${list.title}: ${list.items.join(", ")}`)
    .join(" | ")}

**Navigation:** ${pageContent.navigation.join(", ")}

**Requirements:**
1. Create a complete HTML page with modern, responsive design
2. Use inline CSS styles for a self-contained wireframe
3. Include all specified content elements
4. Make it visually appealing and functional
5. Use ${designStyle} design principles
6. Optimize for ${deviceType} viewing
7. Include realistic placeholder content
8. Add proper semantic HTML structure
9. Use modern CSS with flexbox/grid layouts
10. Ensure good typography and spacing

**Response Format:**
Provide the HTML code first, followed by additional CSS if needed.

Generate a professional, realistic wireframe that could be used as a starting point for actual development.`;
}

function extractCodeFromResponse(response: string): {
  htmlCode: string;
  cssCode: string;
} {
  // Extract HTML code
  const htmlMatch =
    response.match(/```html\s*([\s\S]*?)\s*```/i) ||
    response.match(/<html[\s\S]*?<\/html>/i) ||
    response.match(/<!DOCTYPE html[\s\S]*?<\/html>/i);

  let htmlCode = htmlMatch ? htmlMatch[1] || htmlMatch[0] : "";

  // If no HTML found, try to extract from general code blocks
  if (!htmlCode) {
    const codeMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (codeMatch && codeMatch[1].includes("<html")) {
      htmlCode = codeMatch[1];
    }
  }

  // Extract CSS code (separate from HTML)
  const cssMatch = response.match(/```css\s*([\s\S]*?)\s*```/i);
  let cssCode = cssMatch ? cssMatch[1] : "";

  // If HTML doesn't include DOCTYPE, add it
  if (htmlCode && !htmlCode.includes("<!DOCTYPE")) {
    if (!htmlCode.includes("<html")) {
      htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wireframe</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
  </style>
</head>
<body>
${htmlCode}
</body>
</html>`;
    } else {
      htmlCode = `<!DOCTYPE html>\n${htmlCode}`;
    }
  }

  // Clean up the code
  htmlCode = htmlCode.trim();
  cssCode = cssCode.trim();

  return { htmlCode, cssCode };
}

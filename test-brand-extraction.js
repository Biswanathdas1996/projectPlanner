// Test script for brand guideline extraction
import { createBrandGuidelineExtractor } from './client/src/lib/brand-guideline-extractor.js';

async function testBrandExtraction() {
  try {
    console.log('Testing brand guideline extraction...');
    
    // Create sample text based on McDonald's brand guidelines
    const mockPdfText = `
    Feel-Good Design Cheatsheets
    McDonald's Brand Guidelines 2019
    
    Our goal: Create an inspirational design system that delivers on our brand promise
    Our philosophy: Every touchpoint is an opportunity for a Feel-Good Moment
    Our personality: Lighthearted, Welcoming, Dependable, Unpretentious, Playful
    
    Color palette:
    We're a Golden Brand with Red accents.
    Primary colors: #FFBC0D (McDonald's Gold), #DA020E (McDonald's Red)
    
    Typography:
    Speedee Bold - A custom, proprietary typeface
    Speedee Regular - to unify our global voice
    Speedee Light - available in three weights
    
    Visual identity principles:
    - Confidently humble
    - Familiar yet surprising  
    - Flawesome
    
    Layout principles:
    - Negative space is a positive
    - Modern, refreshing, and unexpected interpretations
    - Celebrate simple moments and imperfections
    `;
    
    const extractor = createBrandGuidelineExtractor();
    const guidelines = await extractor.analyzeWithGemini(mockPdfText);
    
    console.log('Extracted guidelines:', JSON.stringify(guidelines, null, 2));
    
    return guidelines;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Run test
testBrandExtraction().then(result => {
  console.log('Test completed successfully!');
}).catch(error => {
  console.error('Test failed:', error);
});
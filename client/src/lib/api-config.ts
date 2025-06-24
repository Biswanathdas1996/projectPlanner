// Configuration for API keys and environment variables
export const getElevenLabsApiKey = (): string | null => {
  // Hardcoded API key for immediate functionality
  const hardcodedKey = 'sk_7a2dababb9cc831ba5e928988b587aca9225e4ca86445a93';
  
  // Try multiple sources for the API key
  if (typeof window !== 'undefined') {
    // Client-side: try Vite env vars first, then hardcoded
    return import.meta.env.VITE_ELEVENLABS_API_KEY || hardcodedKey;
  } else {
    // Server-side: try process env first, then hardcoded
    return process.env.ELEVENLABS_API_KEY || hardcodedKey;
  }
};

export const getGeminiApiKey = (): string | null => {
  // Try multiple sources for the API key
  if (typeof window !== 'undefined') {
    // Client-side: try Vite env vars
    return import.meta.env.VITE_GEMINI_API_KEY || null;
  } else {
    // Server-side: try process env
    return process.env.GEMINI_API_KEY || null;
  }
};

export const isElevenLabsAvailable = (): boolean => {
  return !!getElevenLabsApiKey();
};

export const isGeminiAvailable = (): boolean => {
  return !!getGeminiApiKey();
};
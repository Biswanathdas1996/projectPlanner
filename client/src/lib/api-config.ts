// Configuration for API keys and environment variables
export const getElevenLabsApiKey = (): string | null => {
  // Try multiple sources for the API key
  if (typeof window !== 'undefined') {
    // Client-side: try Vite env vars
    return import.meta.env.VITE_ELEVENLABS_API_KEY || null;
  } else {
    // Server-side: try process env
    return process.env.ELEVENLABS_API_KEY || null;
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
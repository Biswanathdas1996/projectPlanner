import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chat, textToSpeech, speechToText, generateProjectPlan as generateAIProjectPlan } from "./elevenlabs";

export async function registerRoutes(app: Express): Promise<Server> {
  // ElevenLabs AI Consultant routes
  app.post("/api/elevenlabs/chat", chat);
  app.post("/api/elevenlabs/text-to-speech", textToSpeech);
  app.post("/api/elevenlabs/speech-to-text", speechToText);
  app.post("/api/elevenlabs/generate-plan", generateAIProjectPlan);
  
  const httpServer = createServer(app);

  return httpServer;
}

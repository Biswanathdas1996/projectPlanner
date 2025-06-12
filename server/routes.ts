import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateWireframeHTML } from "./wireframe-html-generator";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for Gemini-powered HTML wireframe generation
  app.post("/api/generate-wireframe-html", generateWireframeHTML);
  
  const httpServer = createServer(app);

  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateProjectPlan, generateBpmnJson } from "./gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Project Planning Routes
  app.post("/api/generate-plan", generateProjectPlan);
  app.post("/api/generate-bpmn", generateBpmnJson);

  const httpServer = createServer(app);

  return httpServer;
}

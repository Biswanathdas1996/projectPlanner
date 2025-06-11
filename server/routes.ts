import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateBpmnXml } from "./gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // BPMN generation endpoints
  app.post("/api/bpmn/xml", generateBpmnXml);

  const httpServer = createServer(app);

  return httpServer;
}

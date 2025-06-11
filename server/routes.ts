import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // All BPMN generation now happens client-side
  
  const httpServer = createServer(app);

  return httpServer;
}

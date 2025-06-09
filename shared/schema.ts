import { z } from "zod";

export const users = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
});

export const bpmnDiagramSchema = z.object({
  id: z.string(),
  name: z.string(),
  xml: z.string(),
  json: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const elementPropertiesSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.string(),
  documentation: z.string().optional(),
  duration: z.string().optional(),
  durationUnit: z.enum(['minutes', 'hours', 'days', 'weeks']).optional(),
});

export type BpmnDiagram = z.infer<typeof bpmnDiagramSchema>;
export type ElementProperties = z.infer<typeof elementPropertiesSchema>;

export interface NotificationData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number;
}

export interface ConfirmationModalData {
  title: string;
  message: string;
  onConfirm: () => void;
  visible: boolean;
}

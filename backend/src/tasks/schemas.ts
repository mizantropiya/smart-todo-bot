import { z } from "zod";
import { MAX_TASK_TEXT_LENGTH } from "./constants";

export const taskIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const createTaskSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TASK_TEXT_LENGTH)
});

export const updateTaskSchema = z.object({
  completed: z.boolean()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

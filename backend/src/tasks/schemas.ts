import { z } from "zod";

export const taskIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const createTaskSchema = z.object({
  text: z.string().trim().min(1).max(500)
});

export const updateTaskSchema = z.object({
  completed: z.boolean()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

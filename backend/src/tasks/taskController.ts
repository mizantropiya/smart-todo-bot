import type { Request, Response } from "express";
import type { TaskService } from "./taskService";
import { createTaskSchema, taskIdParamsSchema, updateTaskSchema } from "./schemas";
import { unauthorizedError } from "../lib/errors";

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const userId = requireAuthUserId(req);
    const tasks = await this.taskService.list(userId);
    res.status(200).json(tasks);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = requireAuthUserId(req);
    const input = createTaskSchema.parse(req.body);
    const task = await this.taskService.create(userId, input);
    res.status(201).json(task);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const userId = requireAuthUserId(req);
    const { id } = taskIdParamsSchema.parse(req.params);
    const input = updateTaskSchema.parse(req.body);
    const task = await this.taskService.update(userId, id, input);
    res.status(200).json(task);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = requireAuthUserId(req);
    const { id } = taskIdParamsSchema.parse(req.params);
    await this.taskService.delete(userId, id);
    res.status(204).send();
  };
}

function requireAuthUserId(req: Request): string {
  if (!req.authUser?.telegramUserId) {
    throw unauthorizedError();
  }

  return req.authUser.telegramUserId;
}

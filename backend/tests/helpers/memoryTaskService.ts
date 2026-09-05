import crypto from "node:crypto";
import { notFoundError, taskLimitReachedError } from "../../src/lib/errors";
import { MAX_TASKS_PER_USER } from "../../src/tasks/constants";
import type { CreateTaskInput, UpdateTaskInput } from "../../src/tasks/schemas";
import type { TaskDto, TaskService } from "../../src/tasks/taskService";

export class MemoryTaskService implements TaskService {
  private readonly tasks = new Map<string, TaskDto & { telegramUserId: string }>();

  async list(telegramUserId: string): Promise<TaskDto[]> {
    return [...this.tasks.values()]
      .filter((task) => task.telegramUserId === telegramUserId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map(stripOwner);
  }

  async create(telegramUserId: string, input: CreateTaskInput): Promise<TaskDto> {
    const taskCount = [...this.tasks.values()].filter((task) => task.telegramUserId === telegramUserId).length;
    if (taskCount >= MAX_TASKS_PER_USER) {
      throw taskLimitReachedError();
    }

    const now = new Date();
    const task = {
      id: crypto.randomUUID(),
      telegramUserId,
      text: input.text,
      completed: false,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(task.id, task);
    return stripOwner(task);
  }

  async update(telegramUserId: string, id: string, input: UpdateTaskInput): Promise<TaskDto> {
    const task = this.tasks.get(id);
    if (!task || task.telegramUserId !== telegramUserId) {
      throw notFoundError();
    }

    const updated = { ...task, completed: input.completed, updatedAt: new Date() };
    this.tasks.set(id, updated);
    return stripOwner(updated);
  }

  async delete(telegramUserId: string, id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (!task || task.telegramUserId !== telegramUserId) {
      throw notFoundError();
    }
    this.tasks.delete(id);
  }
}

function stripOwner(task: TaskDto & { telegramUserId: string }): TaskDto {
  return {
    id: task.id,
    text: task.text,
    completed: task.completed,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

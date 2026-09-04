import type { PrismaClient, Task } from "@prisma/client";
import { notFoundError } from "../lib/errors";
import type { CreateTaskInput, UpdateTaskInput } from "./schemas";

export type TaskDto = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface TaskService {
  list(telegramUserId: string): Promise<TaskDto[]>;
  create(telegramUserId: string, input: CreateTaskInput): Promise<TaskDto>;
  update(telegramUserId: string, id: string, input: UpdateTaskInput): Promise<TaskDto>;
  delete(telegramUserId: string, id: string): Promise<void>;
}

export class PrismaTaskService implements TaskService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(telegramUserId: string): Promise<TaskDto[]> {
    const tasks = await this.prisma.task.findMany({
      where: { telegramUserId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });

    return tasks.map(toDto);
  }

  async create(telegramUserId: string, input: CreateTaskInput): Promise<TaskDto> {
    const task = await this.prisma.task.create({
      data: {
        telegramUserId,
        text: input.text
      }
    });

    return toDto(task);
  }

  async update(telegramUserId: string, id: string, input: UpdateTaskInput): Promise<TaskDto> {
    const result = await this.prisma.task.updateMany({
      where: { id, telegramUserId },
      data: { completed: input.completed }
    });

    if (result.count === 0) {
      throw notFoundError();
    }

    const task = await this.prisma.task.findFirstOrThrow({
      where: { id, telegramUserId }
    });

    return toDto(task);
  }

  async delete(telegramUserId: string, id: string): Promise<void> {
    const result = await this.prisma.task.deleteMany({
      where: { id, telegramUserId }
    });

    if (result.count === 0) {
      throw notFoundError();
    }
  }
}

function toDto(task: Task): TaskDto {
  return {
    id: task.id,
    text: task.text,
    completed: task.completed,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

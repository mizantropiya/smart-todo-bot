import { Router } from "express";
import type { Request, RequestHandler, Response, NextFunction } from "express";
import type { TaskService } from "./taskService";
import { TaskController } from "./taskController";

export function createTaskRouter(taskService: TaskService, authMiddleware: RequestHandler): Router {
  const router = Router();
  const controller = new TaskController(taskService);

  router.get("/tasks", authMiddleware, asyncHandler(controller.list));
  router.post("/tasks", authMiddleware, asyncHandler(controller.create));
  router.patch("/tasks/:id", authMiddleware, asyncHandler(controller.update));
  router.delete("/tasks/:id", authMiddleware, asyncHandler(controller.delete));

  return router;
}

function asyncHandler(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

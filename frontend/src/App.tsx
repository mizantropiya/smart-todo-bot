import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { ApiError, createTask, deleteTask, getTasks, updateTask } from "./api/client";
import type { Task } from "./api/types";
import { AddTaskForm } from "./components/AddTaskForm";
import { TaskColumn } from "./components/TaskColumn";
import { MAX_TASKS_PER_USER } from "./constants";
import { useTelegramWebApp } from "./hooks/useTelegramWebApp";

const TASKS_QUERY_KEY = ["tasks"];

export function App() {
  const queryClient = useQueryClient();
  const { hasInitData } = useTelegramWebApp();

  const tasksQuery = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: getTasks
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => updateTask(id, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
  });

  const tasks = tasksQuery.data ?? [];
  const todoTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const isTaskLimitReached = tasks.length >= MAX_TASKS_PER_USER;
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const createErrorMessage = createMutation.error ? getCreateErrorMessage(createMutation.error) : null;
  const devAuthActive =
    import.meta.env.DEV &&
    import.meta.env.VITE_DEV_AUTH_ENABLED === "true" &&
    !hasInitData;

  async function handleCreate(text: string) {
    await createMutation.mutateAsync(text);
  }

  function handleToggle(task: Task) {
    updateMutation.mutate({ id: task.id, completed: !task.completed });
  }

  function handleDelete(task: Task) {
    deleteMutation.mutate(task.id);
  }

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Сводка задач">
        <div className="topbar__title">
          <h1>Ваши задачи:</h1>
        </div>
      </section>

      {devAuthActive ? <p className="dev-note">Dev auth включен для локального браузера.</p> : null}

      <AddTaskForm disabled={isMutating || isTaskLimitReached} onSubmit={handleCreate} />
      {isTaskLimitReached ? (
        <p className="form-hint">
          Достигнут лимит в 99 задач. Удалите одну задачу, чтобы добавить новую.
        </p>
      ) : null}
      {createErrorMessage ? (
        <p className="form-hint form-hint--error" role="alert">
          {createErrorMessage}
        </p>
      ) : null}

      {tasksQuery.isLoading ? (
        <div className="state state--loading" role="status">
          <div className="loader-line">
            <Loader2 className="spin" size={22} />
            <span>Загружаем задачи...</span>
          </div>
          <div className="skeleton-list" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}

      {tasksQuery.isError ? (
        <div className="state state--error" role="alert">
          <AlertCircle size={22} />
          <span>{getLoadErrorMessage(tasksQuery.error)}</span>
        </div>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && tasks.length === 0 ? (
        <div className="state state--empty">
          <span>Список пуст.</span>
          <strong>Добавьте первую задачу.</strong>
        </div>
      ) : null}

      {tasks.length > 0 ? (
        <div className="board-grid" aria-label="Доска задач">
          <TaskColumn
            title="Надо сделать"
            emptyText="Здесь пока пусто"
            tasks={todoTasks}
            isBusy={isMutating}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
          <TaskColumn
            title="Сделано"
            emptyText="Здесь пока пусто"
            tasks={completedTasks}
            isBusy={isMutating}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        </div>
      ) : null}

    </main>
  );
}

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Не удалось подтвердить Telegram-сессию.";
    }
    if (error.status === 0) {
      return "Не удалось связаться с сервером.";
    }
    if (error.status >= 500) {
      return "Ошибка сервера при загрузке задач.";
    }
  }

  return "Не удалось загрузить задачи.";
}

function getCreateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409 && error.code === "TASK_LIMIT_REACHED") {
      return "Достигнут лимит в 99 задач. Удалите одну задачу, чтобы добавить новую.";
    }
    if (error.status === 401) {
      return "Не удалось подтвердить Telegram-сессию.";
    }
    if (error.status === 0) {
      return "Не удалось связаться с сервером.";
    }
  }

  return "Не удалось добавить задачу.";
}

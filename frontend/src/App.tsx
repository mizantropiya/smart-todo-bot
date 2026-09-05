import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { createTask, deleteTask, getTasks, updateTask } from "./api/client";
import type { Task } from "./api/types";
import { AddTaskForm } from "./components/AddTaskForm";
import { TaskColumn } from "./components/TaskColumn";
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
  const completedCount = tasks.filter((task) => task.completed).length;
  const counterText = `${formatCount(completedCount)} из ${formatCount(tasks.length)}`;
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
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
        <div className="counter" aria-label={`Выполнено задач: ${counterText}`}>
          <strong>{counterText}</strong>
        </div>
      </section>

      {devAuthActive ? <p className="dev-note">Dev auth включен для локального браузера.</p> : null}

      <AddTaskForm disabled={isMutating} onSubmit={handleCreate} />

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
          <span>Не удалось загрузить задачи. Проверь авторизацию и backend.</span>
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
            count={todoTasks.length}
            emptyText="Здесь пока пусто"
            tasks={todoTasks}
            isBusy={isMutating}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
          <TaskColumn
            title="Сделано"
            count={completedTasks.length}
            emptyText="Здесь пока пусто"
            tasks={completedTasks}
            isBusy={isMutating}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        </div>
      ) : null}

      <footer className="app-footer">@mysmarttodooo_bot</footer>
    </main>
  );
}

function formatCount(count: number): string {
  return String(Math.min(count, 99));
}

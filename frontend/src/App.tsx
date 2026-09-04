import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { createTask, deleteTask, getTasks, updateTask } from "./api/client";
import type { Task } from "./api/types";
import { AddTaskForm } from "./components/AddTaskForm";
import { TaskItem } from "./components/TaskItem";
import { useTelegramWebApp } from "./hooks/useTelegramWebApp";

const TASKS_QUERY_KEY = ["tasks"];

export function App() {
  const queryClient = useQueryClient();
  const { displayName, hasInitData } = useTelegramWebApp();

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
  const completedCount = tasks.filter((task) => task.completed).length;
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
        <div>
          <p className="eyebrow">Smart To-Do Bot</p>
          <h1>Задачи: {displayName}</h1>
        </div>
        <div className="counter" aria-label="Выполнено задач">
          <strong>{completedCount}</strong>
          <span>из {tasks.length}</span>
        </div>
      </section>

      {devAuthActive ? <p className="dev-note">Dev auth включен для локального браузера.</p> : null}

      <AddTaskForm disabled={isMutating} onSubmit={handleCreate} />

      {tasksQuery.isLoading ? (
        <div className="state" role="status">
          <Loader2 className="spin" size={22} />
          <span>Загружаю задачи</span>
        </div>
      ) : null}

      {tasksQuery.isError ? (
        <div className="state state--error" role="alert">
          <AlertCircle size={22} />
          <span>Не удалось загрузить задачи. Проверь авторизацию и backend.</span>
        </div>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && tasks.length === 0 ? (
        <div className="state">
          <span>Список пуст. Добавь первую задачу.</span>
        </div>
      ) : null}

      {tasks.length > 0 ? (
        <ul className="task-list" aria-label="Список задач">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isBusy={isMutating}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      ) : null}
    </main>
  );
}

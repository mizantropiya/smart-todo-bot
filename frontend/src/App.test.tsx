import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "./api/types";
import { App } from "./App";
import { MAX_TASKS_PER_USER } from "./constants";

const api = vi.hoisted(() => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn()
}));

vi.mock("./api/client", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    createTask: api.createTask,
    deleteTask: api.deleteTask,
    getTasks: api.getTasks,
    updateTask: api.updateTask
  };
});

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

function makeTask(index: number, completed = false): Task {
  return {
    id: `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
    text: `Задача ${index}`,
    completed,
    createdAt: new Date(2026, 0, index + 1).toISOString(),
    updatedAt: new Date(2026, 0, index + 1).toISOString()
  };
}

describe("App", () => {
  beforeEach(() => {
    api.createTask.mockReset();
    api.deleteTask.mockReset();
    api.getTasks.mockReset();
    api.updateTask.mockReset();
  });

  it("groups tasks into todo and completed sections without visible counters", async () => {
    api.getTasks.mockResolvedValue([makeTask(1), makeTask(2, true)]);

    renderApp();

    const todoColumn = await screen.findByRole("region", { name: "Надо сделать" });
    const completedColumn = screen.getByRole("region", { name: "Сделано" });

    expect(within(todoColumn).getByText("Задача 1")).toBeInTheDocument();
    expect(within(completedColumn).getByText("Задача 2")).toBeInTheDocument();
    expect(screen.queryByText(/из/)).not.toBeInTheDocument();
  });

  it("disables create at 99 tasks and enables it again after delete", async () => {
    const user = userEvent.setup();
    let tasks = Array.from({ length: MAX_TASKS_PER_USER }, (_, index) => makeTask(index + 1));

    api.getTasks.mockImplementation(() => Promise.resolve(tasks));
    api.deleteTask.mockImplementation(async (id: string) => {
      tasks = tasks.filter((task) => task.id !== id);
    });

    renderApp();

    expect(
      await screen.findByText("Достигнут лимит в 99 задач. Удалите одну задачу, чтобы добавить новую.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Добавить задачу")).toBeDisabled();

    await user.click(screen.getAllByLabelText("Удалить задачу")[0]);

    await waitFor(() => expect(screen.getByLabelText("Добавьте задачу")).toBeEnabled());

    await user.type(screen.getByLabelText("Добавьте задачу"), "Новая задача");

    expect(screen.getByLabelText("Добавить задачу")).toBeEnabled();
  });
});

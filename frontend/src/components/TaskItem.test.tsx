import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "../api/types";
import { TaskItem } from "./TaskItem";

const baseTask: Task = {
  id: "00000000-0000-4000-8000-000000000001",
  text: "Сверить список",
  completed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe("TaskItem", () => {
  it("renders an incomplete checkbox without a check icon", () => {
    render(<TaskItem task={baseTask} onToggle={vi.fn()} onDelete={vi.fn()} />);

    const checkbox = screen.getByLabelText("Отметить выполненной");
    expect(checkbox.querySelector("svg")).toBeNull();
  });

  it("renders a completed checkbox with a check icon", () => {
    render(<TaskItem task={{ ...baseTask, completed: true }} onToggle={vi.fn()} onDelete={vi.fn()} />);

    const checkbox = screen.getByLabelText("Вернуть в работу");
    expect(checkbox.querySelector("svg")).toBeInTheDocument();
  });
});

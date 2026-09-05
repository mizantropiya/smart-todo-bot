import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddTaskForm } from "./AddTaskForm";

describe("AddTaskForm", () => {
  it("submits a trimmed task text and clears the input", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddTaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Добавьте задачу"), "  Купить продукты  ");
    await user.click(screen.getByLabelText("Добавить задачу"));

    expect(onSubmit).toHaveBeenCalledWith("Купить продукты");
    expect(screen.getByLabelText("Добавьте задачу")).toHaveValue("");
  });

  it("submits by Enter from the input", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddTaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Добавьте задачу"), "Задача{Enter}");

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith("Задача");
  });

  it("disables submit while the input is empty", () => {
    render(<AddTaskForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Добавить задачу")).toBeDisabled();
  });

  it("keeps the submit button icon-only with an accessible label", () => {
    render(<AddTaskForm onSubmit={vi.fn()} />);

    const button = screen.getByLabelText("Добавить задачу");
    expect(button).toHaveTextContent("");
    expect(screen.queryByText("Enter")).not.toBeInTheDocument();
  });

  it("accepts a 160 character task", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const taskText = "а".repeat(160);

    render(<AddTaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Добавьте задачу"), taskText);
    await user.click(screen.getByLabelText("Добавить задачу"));

    expect(onSubmit).toHaveBeenCalledWith(taskText);
  });

  it("rejects whitespace-only tasks", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddTaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Добавьте задачу"), "   {Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Добавить задачу")).toBeDisabled();
  });
});

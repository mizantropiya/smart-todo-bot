import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddTaskForm } from "./AddTaskForm";

describe("AddTaskForm", () => {
  it("submits a trimmed task text and clears the input", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddTaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Новая задача"), "  Купить продукты  ");
    await user.click(screen.getByLabelText("Добавить задачу"));

    expect(onSubmit).toHaveBeenCalledWith("Купить продукты");
    expect(screen.getByLabelText("Новая задача")).toHaveValue("");
  });

  it("disables submit while the input is empty", () => {
    render(<AddTaskForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Добавить задачу")).toBeDisabled();
  });
});

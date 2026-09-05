import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskColumn } from "./TaskColumn";

describe("TaskColumn", () => {
  it("shows the calm empty state text without a counter badge", () => {
    render(
      <TaskColumn
        title="Надо сделать"
        emptyText="Здесь пока пусто"
        tasks={[]}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Надо сделать" })).toBeInTheDocument();
    expect(screen.getByText("Здесь пока пусто")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});

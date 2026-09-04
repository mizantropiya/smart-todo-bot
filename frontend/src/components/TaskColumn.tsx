import type { Task } from "../api/types";
import { TaskItem } from "./TaskItem";

type TaskColumnProps = {
  title: string;
  count: number;
  emptyText: string;
  tasks: Task[];
  isBusy?: boolean;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskColumn({
  title,
  count,
  emptyText,
  tasks,
  isBusy = false,
  onToggle,
  onDelete
}: TaskColumnProps) {
  const headingId = `column-${title}`;

  return (
    <section className="task-column" aria-labelledby={headingId}>
      <div className="column-label">
        <h2 id={headingId}>{title}</h2>
        <span>{count}</span>
      </div>

      {tasks.length > 0 ? (
        <ul className="task-list" aria-label={title}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isBusy={isBusy}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : (
        <p className="column-empty">{emptyText}</p>
      )}
    </section>
  );
}

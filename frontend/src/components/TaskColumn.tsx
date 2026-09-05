import type { Task } from "../api/types";
import { TaskItem } from "./TaskItem";

type TaskColumnProps = {
  title: string;
  emptyText: string;
  tasks: Task[];
  isBusy?: boolean;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskColumn({
  title,
  emptyText,
  tasks,
  isBusy = false,
  onToggle,
  onDelete
}: TaskColumnProps) {
  return (
    <section className="task-column" role="region" aria-label={title}>
      <h2 className="column-title">{title}</h2>

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

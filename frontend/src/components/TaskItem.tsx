import { Check, Trash2 } from "lucide-react";
import type { Task } from "../api/types";

type TaskItemProps = {
  task: Task;
  isBusy?: boolean;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskItem({ task, isBusy = false, onToggle, onDelete }: TaskItemProps) {
  return (
    <li className={task.completed ? "task task--completed" : "task"}>
      <button
        className="task__checkbox"
        type="button"
        title={task.completed ? "Вернуть в работу" : "Отметить выполненной"}
        aria-label={task.completed ? "Вернуть в работу" : "Отметить выполненной"}
        disabled={isBusy}
        aria-pressed={task.completed}
        onClick={() => onToggle(task)}
      >
        {task.completed ? <Check size={18} aria-hidden="true" /> : null}
      </button>
      <span className="task__text">{task.text}</span>
      <button
        className="icon-button task__delete"
        type="button"
        title="Удалить задачу"
        aria-label="Удалить задачу"
        disabled={isBusy}
        onClick={() => onDelete(task)}
      >
        <Trash2 size={18} />
      </button>
    </li>
  );
}

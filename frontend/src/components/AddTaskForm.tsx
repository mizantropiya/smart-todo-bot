import { useState } from "react";
import type { FormEvent } from "react";
import { Plus } from "lucide-react";

type AddTaskFormProps = {
  disabled?: boolean;
  onSubmit: (text: string) => Promise<void>;
};

export function AddTaskForm({ disabled = false, onSubmit }: AddTaskFormProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedText = text.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedText || isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedText);
      setText("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        aria-label="Новая задача"
        maxLength={500}
        placeholder="Новая задача"
        value={text}
        disabled={disabled || isSubmitting}
        onChange={(event) => setText(event.target.value)}
      />
      <button
        type="submit"
        title="Добавить задачу"
        aria-label="Добавить задачу"
        disabled={!trimmedText || disabled || isSubmitting}
      >
        <Plus size={20} />
      </button>
    </form>
  );
}

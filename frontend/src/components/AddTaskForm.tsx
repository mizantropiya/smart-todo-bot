import { useState } from "react";
import type { FormEvent } from "react";
import { CornerDownLeft } from "lucide-react";

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
        aria-label="Добавьте задачу"
        maxLength={500}
        placeholder="Добавьте задачу"
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
        <span>Enter</span>
        <CornerDownLeft size={17} aria-hidden="true" />
      </button>
    </form>
  );
}

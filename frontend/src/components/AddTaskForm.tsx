import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CornerDownLeft } from "lucide-react";
import { MAX_TASK_LENGTH } from "../constants";

type AddTaskFormProps = {
  disabled?: boolean;
  onSubmit: (text: string) => Promise<void>;
};

export function AddTaskForm({ disabled = false, onSubmit }: AddTaskFormProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardPressing, setIsKeyboardPressing] = useState(false);
  const submittedByKeyboard = useRef(false);
  const pressTimeout = useRef<number | undefined>(undefined);
  const trimmedText = text.trim();
  const isOverLimit = trimmedText.length > MAX_TASK_LENGTH;
  const showLengthHint = text.length >= 130;
  const isSubmitDisabled = !trimmedText || isOverLimit || disabled || isSubmitting;

  useEffect(() => {
    return () => {
      if (pressTimeout.current) {
        window.clearTimeout(pressTimeout.current);
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitDisabled) {
      submittedByKeyboard.current = false;
      return;
    }

    if (submittedByKeyboard.current) {
      flashKeyboardPress();
    }
    submittedByKeyboard.current = false;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedText);
      setText("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function flashKeyboardPress() {
    setIsKeyboardPressing(true);
    if (pressTimeout.current) {
      window.clearTimeout(pressTimeout.current);
    }
    pressTimeout.current = window.setTimeout(() => setIsKeyboardPressing(false), 150);
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <div className="add-form__field">
        <input
          aria-label="Добавьте задачу"
          maxLength={MAX_TASK_LENGTH}
          placeholder="Добавьте задачу"
          value={text}
          disabled={disabled || isSubmitting}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submittedByKeyboard.current = true;
            }
          }}
          onChange={(event) => setText(event.target.value)}
        />
        {showLengthHint ? (
          <span className="add-form__limit" aria-live="polite">
            {text.length}/{MAX_TASK_LENGTH}
          </span>
        ) : null}
      </div>
      <button
        className={isKeyboardPressing ? "is-keyboard-pressing" : undefined}
        type="submit"
        title="Добавить задачу"
        aria-label="Добавить задачу"
        disabled={isSubmitDisabled}
      >
        <CornerDownLeft size={21} aria-hidden="true" />
      </button>
    </form>
  );
}

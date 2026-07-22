"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function InputScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Give the sky something to work with — a word or phrase.");
      return;
    }
    const params = new URLSearchParams({ input: trimmed });
    if (question.trim()) params.set("question", question.trim());
    router.push(`/reading?${params.toString()}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-center font-display text-5xl font-semibold tracking-wide text-star-silver">
          Syzygy
        </h1>
        <p className="mt-3 text-center text-sm text-foreground-muted">
          Every reading draws on today&apos;s actual sky. Say what&apos;s on
          your mind, and the constellation will trace itself.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="input"
              className="text-xs uppercase tracking-[0.2em] text-foreground-muted"
            >
              A word or phrase
            </label>
            <input
              id="input"
              name="input"
              type="text"
              autoComplete="off"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="threshold, letting go, what comes next..."
              className="rounded-md border border-line-violet/40 bg-surface px-4 py-3 text-foreground placeholder:text-foreground-muted/60 outline-none focus:border-line-violet-bright"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="question"
              className="text-xs uppercase tracking-[0.2em] text-foreground-muted"
            >
              A question, if you have one (optional)
            </label>
            <input
              id="question"
              name="question"
              type="text"
              autoComplete="off"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What should I pay attention to?"
              className="rounded-md border border-line-violet/40 bg-surface px-4 py-3 text-foreground placeholder:text-foreground-muted/60 outline-none focus:border-line-violet-bright"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-star-gold">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-2 rounded-md bg-line-violet px-4 py-3 font-display text-lg font-semibold tracking-wide text-foreground transition-colors hover:bg-line-violet-bright"
          >
            Draw the sky
          </button>
        </form>
      </div>
    </main>
  );
}

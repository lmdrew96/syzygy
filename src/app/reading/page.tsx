type ReadingPageProps = {
  searchParams: Promise<{ input?: string; question?: string }>;
};

export default async function ReadingPage({ searchParams }: ReadingPageProps) {
  const { input, question } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
        Reading for
      </p>
      <h1 className="mt-2 font-display text-3xl text-star-silver">
        {input ?? "—"}
      </h1>
      {question && (
        <p className="mt-2 max-w-md text-sm text-foreground-muted">
          &ldquo;{question}&rdquo;
        </p>
      )}
      <p className="mt-8 text-sm text-foreground-muted">
        The constellation engine isn&apos;t wired up yet.
      </p>
    </main>
  );
}

/** Заглушка раздела, который появится на следующих шагах. */
export function SectionPlaceholder({
  title,
  step,
}: {
  title: string;
  step: number;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted">
        Раздел появится на шаге {step} плана админки.
      </p>
    </section>
  );
}

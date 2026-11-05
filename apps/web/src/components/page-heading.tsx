export function PageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-12 flex flex-col gap-3">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="max-w-2xl text-lg text-pretty text-muted">{description}</p>
    </header>
  );
}

export function StackList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

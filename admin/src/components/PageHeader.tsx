export function PageHeader({
  title,
  description,
  children,
  eyebrow,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-header-actions">{children}</div>
    </div>
  );
}

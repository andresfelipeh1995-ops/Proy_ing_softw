export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="is-page-header d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        {eyebrow && <span className="is-eyebrow">{eyebrow}</span>}
        <h1 className="h3 fw-bold mb-1">{title}</h1>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

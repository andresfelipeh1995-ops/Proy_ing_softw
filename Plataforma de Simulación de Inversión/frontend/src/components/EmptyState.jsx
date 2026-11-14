export default function EmptyState({
  icon = "fa-inbox",
  title = "Sin información",
  text = "Todavía no hay datos para mostrar.",
  action = null,
}) {
  return (
    <div className="is-state is-empty py-5">
      <div className="is-empty-icon">
        <i className={`fa-solid ${icon}`} />
      </div>
      <h3 className="h6 fw-bold mt-3 mb-1">{title}</h3>
      <p className="text-muted mb-0">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

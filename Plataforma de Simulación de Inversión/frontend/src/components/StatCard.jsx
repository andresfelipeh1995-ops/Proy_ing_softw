import { Card } from "react-bootstrap";

export default function StatCard({
  title,
  value,
  hint,
  icon = "fa-chart-simple",
  tone = "primary",
}) {
  return (
    <Card className={`is-stat-card is-tone-${tone} h-100 border-0`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <p className="is-stat-label mb-1">{title}</p>
            <h3 className="is-stat-value mb-1">{value}</h3>
            {hint && <p className="is-stat-hint mb-0">{hint}</p>}
          </div>
          <span className="is-stat-icon">
            <i className={`fa-solid ${icon}`} />
          </span>
        </div>
      </Card.Body>
    </Card>
  );
}

import { Spinner } from "react-bootstrap";

export default function LoadingState({ label = "Cargando información..." }) {
  return (
    <div className="is-state py-5">
      <Spinner animation="border" role="status" className="text-primary" />
      <p className="text-muted mt-3 mb-0">{label}</p>
    </div>
  );
}

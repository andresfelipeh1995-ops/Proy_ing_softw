import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
} from "react-bootstrap";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { listEducation } from "../services/educationService";
import { formatDate } from "../utils/format";

const LEVEL_LABELS = {
  BASICO: "Básico",
  INTERMEDIO: "Intermedio",
  AVANZADO: "Avanzado",
};

export default function EducationPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("Todas");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;

    listEducation()
      .then((response) => active && setArticles(response.data ?? []))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(articles.map((article) => article.category).filter(Boolean))];
    return ["Todas", ...unique];
  }, [articles]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return articles
      .filter((article) => category === "Todas" || article.category === category)
      .filter(
        (article) =>
          !term ||
          article.title?.toLowerCase().includes(term) ||
          article.summary?.toLowerCase().includes(term),
      )
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [articles, category, query]);

  if (loading) {
    return <LoadingState label="Cargando contenido educativo..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Aprendizaje"
        title="Aprende a invertir"
        subtitle="Guías cortas sobre mercado, riesgo, diversificación y finanzas personales."
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="is-card mb-4">
        <Card.Body>
          <Row className="g-3 align-items-center">
            <Col lg={5}>
              <Form.Control
                type="search"
                placeholder="Buscar un tema..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Col>
            <Col lg={7}>
              <div className="d-flex flex-wrap gap-2">
                {categories.map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant={category === item ? "primary" : "outline-secondary"}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {filtered.length === 0 ? (
        <Card className="is-card">
          <Card.Body>
            <EmptyState
              icon="fa-graduation-cap"
              title="Sin contenido"
              text="No hay artículos que coincidan con el filtro seleccionado."
            />
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {filtered.map((article) => (
            <Col md={6} xl={4} key={article.id}>
              <Card className="is-card is-card-hover is-education-card h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <span className="is-soft-badge">{article.category}</span>
                    <span className="is-level">
                      {LEVEL_LABELS[article.level] || article.level}
                    </span>
                  </div>

                  <h2 className="h6 fw-bold mb-2">{article.title}</h2>
                  <p className="text-muted small flex-grow-1 mb-3">
                    {article.summary}
                  </p>

                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {formatDate(article.createdAt)}
                    </small>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => setSelected(article)}
                    >
                      Leer guía
                      <i className="fa-solid fa-arrow-right ms-1" />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        show={Boolean(selected)}
        onHide={() => setSelected(null)}
        size="lg"
        centered
        scrollable
      >
        {selected && (
          <>
            <Modal.Header closeButton>
              <div>
                <div className="d-flex gap-2 mb-2">
                  <Badge bg="primary">{selected.category}</Badge>
                  <Badge bg="warning" text="dark">
                    {LEVEL_LABELS[selected.level] || selected.level}
                  </Badge>
                </div>
                <Modal.Title className="h5 fw-bold">{selected.title}</Modal.Title>
              </div>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted">{selected.summary}</p>
              <div className="is-divider" />
              <div className="is-education-content">{selected.content}</div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={() => setSelected(null)}>
                Entendido
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  );
}

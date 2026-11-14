import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import {
  createEducation,
  deactivateEducation,
  listEducation,
  updateEducation,
} from "../services/educationService";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../utils/alerts";
import { formatDate } from "../utils/format";

const LEVELS = [
  { value: "BASICO", label: "Básico" },
  { value: "INTERMEDIO", label: "Intermedio" },
  { value: "AVANZADO", label: "Avanzado" },
];

const initialForm = {
  title: "",
  slug: "",
  category: "",
  summary: "",
  content: "",
  level: "BASICO",
  displayOrder: "0",
};

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminEducationPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await listEducation();
      setArticles(response.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return articles.filter(
      (article) =>
        !term ||
        article.title?.toLowerCase().includes(term) ||
        article.category?.toLowerCase().includes(term),
    );
  }, [articles, query]);

  const stats = useMemo(() => {
    const categories = new Set(articles.map((article) => article.category));
    return {
      total: articles.length,
      categories: categories.size,
      basics: articles.filter((article) => article.level === "BASICO").length,
      advanced: articles.filter((article) => article.level === "AVANZADO").length,
    };
  }, [articles]);

  function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setFieldErrors({});
    setShowModal(true);
  }

  function openEdit(article) {
    setEditing(article);
    setForm({
      title: article.title ?? "",
      slug: article.slug ?? "",
      category: article.category ?? "",
      summary: article.summary ?? "",
      content: article.content ?? "",
      level: article.level ?? "BASICO",
      displayOrder: String(article.displayOrder ?? 0),
    });
    setFieldErrors({});
    setShowModal(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "title" && !editing) {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase(),
      category: form.category.trim(),
      summary: form.summary.trim(),
      content: form.content.trim(),
      level: form.level,
      displayOrder: Math.max(Math.round(Number(form.displayOrder) || 0), 0),
    };

    try {
      const response = editing
        ? await updateEducation(editing.id, payload)
        : await createEducation(payload);
      notifySuccess(response.message);
      setShowModal(false);
      setForm(initialForm);
      setEditing(null);
      await load();
    } catch (err) {
      if (err.data && typeof err.data === "object") {
        setFieldErrors(err.data);
      } else {
        notifyError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(article) {
    const confirmed = await confirmAction({
      title: "Desactivar contenido",
      html: `El artículo <strong>${article.title}</strong> dejará de mostrarse en la sección de aprendizaje.`,
      confirmButtonText: "Desactivar",
    });

    if (!confirmed) return;

    try {
      const response = await deactivateEducation(article.id);
      notifySuccess(response.message);
      await load();
    } catch (err) {
      notifyError(err.message);
    }
  }

  if (loading) {
    return <LoadingState label="Cargando contenido educativo..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Contenido educativo"
        subtitle="Crea, edita y desactiva las guías disponibles para los usuarios."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <i className="fa-solid fa-plus me-1" />
            Nuevo artículo
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard title="Artículos activos" value={stats.total} icon="fa-book-open" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Categorías"
            value={stats.categories}
            icon="fa-tags"
            tone="info"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Nivel básico"
            value={stats.basics}
            hint="Ideales para empezar"
            icon="fa-seedling"
            tone="success"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Nivel avanzado"
            value={stats.advanced}
            icon="fa-graduation-cap"
            tone="warning"
          />
        </Col>
      </Row>

      <Card className="is-card">
        <Card.Header className="bg-white border-0 pt-3 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <h2 className="h6 fw-bold mb-0">
            <i className="fa-solid fa-book-open me-2 text-primary" />
            Guías publicadas
          </h2>
          <Form.Control
            type="search"
            placeholder="Buscar título o categoría..."
            style={{ maxWidth: "18rem" }}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Card.Header>
        <Card.Body className="pt-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon="fa-book-open"
              title="Sin artículos"
              text="No hay contenido que coincida con la búsqueda."
              action={
                <Button variant="primary" size="sm" onClick={openCreate}>
                  Crear artículo
                </Button>
              }
            />
          ) : (
            <Table responsive hover className="is-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Nivel</th>
                  <th>Slug</th>
                  <th>Creado</th>
                  <th className="text-end" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((article) => (
                  <tr key={article.id}>
                    <td className="text-muted small">{article.displayOrder}</td>
                    <td>
                      <div className="fw-semibold">{article.title}</div>
                      <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: "22rem" }}>
                        {article.summary}
                      </small>
                    </td>
                    <td>
                      <span className="is-soft-badge">{article.category}</span>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border">
                        {LEVELS.find((level) => level.value === article.level)?.label ||
                          article.level}
                      </Badge>
                    </td>
                    <td className="text-muted small">{article.slug}</td>
                    <td className="text-muted small">{formatDate(article.createdAt)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openEdit(article)}
                        >
                          <i className="fa-solid fa-pen" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDeactivate(article)}
                        >
                          <i className="fa-solid fa-eye-slash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        scrollable
      >
        <Form noValidate onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">
              {editing ? "Editar artículo" : "Nuevo artículo"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={8}>
                <Form.Group controlId="educationTitle">
                  <Form.Label>Título</Form.Label>
                  <Form.Control
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    isInvalid={Boolean(fieldErrors.title)}
                    maxLength={160}
                    required
                  />
                  {fieldErrors.title && (
                    <div className="invalid-feedback d-block">{fieldErrors.title}</div>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="educationOrder">
                  <Form.Label>Orden</Form.Label>
                  <Form.Control
                    type="number"
                    name="displayOrder"
                    min="0"
                    step="1"
                    value={form.displayOrder}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="educationSlug">
                  <Form.Label>Slug</Form.Label>
                  <Form.Control
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    isInvalid={Boolean(fieldErrors.slug)}
                    maxLength={160}
                    required
                  />
                  {fieldErrors.slug && (
                    <div className="invalid-feedback d-block">{fieldErrors.slug}</div>
                  )}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="educationCategory">
                  <Form.Label>Categoría</Form.Label>
                  <Form.Control
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    isInvalid={Boolean(fieldErrors.category)}
                    maxLength={80}
                    required
                  />
                  {fieldErrors.category && (
                    <div className="invalid-feedback d-block">
                      {fieldErrors.category}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="educationLevel">
                  <Form.Label>Nivel</Form.Label>
                  <Form.Select name="level" value={form.level} onChange={handleChange}>
                    {LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group controlId="educationSummary">
                  <Form.Label>Resumen</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="summary"
                    value={form.summary}
                    onChange={handleChange}
                    isInvalid={Boolean(fieldErrors.summary)}
                    maxLength={400}
                    required
                  />
                  {fieldErrors.summary && (
                    <div className="invalid-feedback d-block">{fieldErrors.summary}</div>
                  )}
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group controlId="educationContent">
                  <Form.Label>Contenido</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={10}
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    isInvalid={Boolean(fieldErrors.content)}
                    required
                  />
                  {fieldErrors.content && (
                    <div className="invalid-feedback d-block">{fieldErrors.content}</div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setShowModal(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Guardando...
                </>
              ) : editing ? (
                "Guardar cambios"
              ) : (
                "Crear artículo"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import {
  createPortfolio,
  listPortfolios,
} from "../services/portfolioService";
import { getMyProfile } from "../services/userService";
import { notifyError, notifySuccess } from "../utils/alerts";
import {
  formatDate,
  formatMoney,
  formatPercent,
  percentClass,
  toNumber,
} from "../utils/format";

const initialForm = { name: "", description: "" };

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function load() {
    const results = await Promise.allSettled([listPortfolios(), getMyProfile()]);

    if (results[0].status === "fulfilled") {
      setPortfolios(results[0].value.data ?? []);
    } else {
      setError(results[0].reason.message);
    }

    if (results[1].status === "fulfilled") {
      setProfile(results[1].value.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const marketValue = portfolios.reduce(
      (sum, portfolio) => sum + toNumber(portfolio.summary?.totalMarketValue),
      0,
    );
    const cost = portfolios.reduce(
      (sum, portfolio) => sum + toNumber(portfolio.summary?.totalCost),
      0,
    );
    const pnl = marketValue - cost;

    return {
      marketValue,
      cost,
      pnl,
      pnlPercent: cost > 0 ? (pnl / cost) * 100 : 0,
      positions: portfolios.reduce(
        (sum, portfolio) => sum + toNumber(portfolio.summary?.positionsCount),
        0,
      ),
    };
  }, [portfolios]);

  function openModal() {
    setForm(initialForm);
    setFieldErrors({});
    setShowModal(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});

    try {
      await createPortfolio({
        name: form.name.trim(),
        description: form.description.trim(),
      });
      notifySuccess("Portafolio creado correctamente.");
      setShowModal(false);
      setForm(initialForm);
      setLoading(true);
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

  if (loading) {
    return <LoadingState label="Cargando tus portafolios..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Portafolios"
        title="Tus estrategias de inversión"
        subtitle="Agrupa tus posiciones, revisa el rendimiento y opera en cada portafolio."
        actions={
          <Button variant="primary" onClick={openModal}>
            <i className="fa-solid fa-plus me-1" />
            Crear portafolio
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Portafolios"
            value={portfolios.length}
            hint={`${totals.positions} posición(es) activas`}
            icon="fa-folder-open"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Valor de mercado"
            value={formatMoney(totals.marketValue)}
            hint={`Costo: ${formatMoney(totals.cost)}`}
            icon="fa-chart-pie"
            tone="info"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Ganancia / pérdida"
            value={formatMoney(totals.pnl)}
            hint={formatPercent(totals.pnlPercent)}
            icon="fa-arrow-trend-up"
            tone={totals.pnl >= 0 ? "success" : "danger"}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Efectivo disponible"
            value={formatMoney(profile?.availableBalance)}
            hint="Saldo para nuevas compras"
            icon="fa-wallet"
            tone="warning"
          />
        </Col>
      </Row>

      {portfolios.length === 0 ? (
        <Card className="is-card">
          <Card.Body>
            <EmptyState
              icon="fa-folder-plus"
              title="Todavía no tienes portafolios"
              text="Crea tu primer portafolio para empezar a registrar operaciones simuladas."
              action={
                <Button variant="primary" onClick={openModal}>
                  Crear mi primer portafolio
                </Button>
              }
            />
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {portfolios.map((portfolio) => {
            const summary = portfolio.summary ?? {};
            const pnl = toNumber(summary.totalPnl);

            return (
              <Col md={6} xl={4} key={portfolio.id}>
                <Card className="is-card is-card-hover is-portfolio-card h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="is-portfolio-name">{portfolio.name}</div>
                        <p className="text-muted small mb-0">
                          {portfolio.description || "Sin descripción"}
                        </p>
                      </div>
                      <span
                        className={`is-soft-badge ${
                          portfolio.active ? "" : "is-muted"
                        }`}
                      >
                        {portfolio.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="is-metric-mini">
                      <span>Valor de mercado</span>
                      <strong>{formatMoney(summary.totalMarketValue)}</strong>
                    </div>

                    <Row className="g-2">
                      <Col xs={6}>
                        <div className="is-metric-mini">
                          <span>Costo</span>
                          <strong>{formatMoney(summary.totalCost)}</strong>
                        </div>
                      </Col>
                      <Col xs={6}>
                        <div className="is-metric-mini">
                          <span>Posiciones</span>
                          <strong>{summary.positionsCount ?? 0}</strong>
                        </div>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Resultado</span>
                      <span className={`fw-bold ${percentClass(pnl)}`}>
                        {formatMoney(summary.totalPnl)}{" "}
                        <small>({formatPercent(summary.totalPnlPercent)})</small>
                      </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">
                        Creado {formatDate(portfolio.createdAt)}
                      </span>
                      <span className="text-muted small">
                        Saldo: {formatMoney(summary.cashBalance)}
                      </span>
                    </div>

                    <div className="d-flex gap-2 mt-1">
                      <Button
                        as={Link}
                        to={`/portafolios/${portfolio.id}`}
                        size="sm"
                        variant="outline-primary"
                        className="flex-fill"
                      >
                        <i className="fa-solid fa-eye me-1" />
                        Detalle
                      </Button>
                      <Button
                        as={Link}
                        to={`/operar?portfolioId=${portfolio.id}`}
                        size="sm"
                        variant="primary"
                        className="flex-fill"
                      >
                        <i className="fa-solid fa-right-left me-1" />
                        Operar
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form noValidate onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">Nuevo portafolio</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="portfolioName">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej. Crecimiento a largo plazo"
                isInvalid={Boolean(fieldErrors.name)}
                required
              />
              {fieldErrors.name && (
                <div className="invalid-feedback d-block">{fieldErrors.name}</div>
              )}
            </Form.Group>
            <Form.Group controlId="portfolioDescription">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="¿Qué estrategia seguirás con este portafolio?"
                isInvalid={Boolean(fieldErrors.description)}
              />
              {fieldErrors.description && (
                <div className="invalid-feedback d-block">
                  {fieldErrors.description}
                </div>
              )}
            </Form.Group>
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
                  Creando...
                </>
              ) : (
                "Crear portafolio"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

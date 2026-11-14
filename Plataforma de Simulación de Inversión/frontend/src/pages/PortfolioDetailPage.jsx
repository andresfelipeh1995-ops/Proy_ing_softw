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
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import LineChart from "../components/LineChart";
import {
  deactivatePortfolio,
  getPortfolio,
  updatePortfolio,
} from "../services/portfolioService";
import { getPortfolioAnalytics } from "../services/analyticsService";
import { listTransactionsByPortfolio } from "../services/tradingService";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../utils/alerts";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPercent,
  percentClass,
  toNumber,
} from "../utils/format";

export default function PortfolioDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");
  const [days, setDays] = useState(180);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      getPortfolio(id),
      listTransactionsByPortfolio(id),
    ]);

    if (results[0].status === "fulfilled") {
      const data = results[0].value.data;
      setPortfolio(data);
      setForm({
        name: data.name ?? "",
        description: data.description ?? "",
      });
    } else {
      setError(results[0].reason.message);
    }

    if (results[1].status === "fulfilled") {
      setTransactions(results[1].value.data ?? []);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;
    setAnalyticsError("");

    getPortfolioAnalytics(id, days)
      .then((response) => active && setAnalytics(response.data))
      .catch((err) => {
        if (active) {
          setAnalytics(null);
          setAnalyticsError(err.message);
        }
      });

    return () => {
      active = false;
    };
  }, [id, days]);

  const chartData = useMemo(
    () =>
      (analytics?.series ?? []).map((point) => ({
        date: point.date,
        value: point.value,
      })),
    [analytics],
  );

  const summary = portfolio?.summary ?? {};

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});

    try {
      const response = await updatePortfolio(id, {
        name: form.name.trim(),
        description: form.description.trim(),
      });
      setPortfolio(response.data);
      setShowEdit(false);
      notifySuccess("Portafolio actualizado.");
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

  async function handleDeactivate() {
    const confirmed = await confirmAction({
      title: "Desactivar portafolio",
      html: "El portafolio dejará de estar disponible para operar. Las posiciones existentes se conservan para consulta.",
      confirmButtonText: "Sí, desactivar",
    });

    if (!confirmed) return;

    try {
      await deactivatePortfolio(id);
      notifySuccess("Portafolio desactivado.");
      navigate("/portafolios", { replace: true });
    } catch (err) {
      notifyError(err.message);
    }
  }

  if (loading) {
    return <LoadingState label="Cargando portafolio..." />;
  }

  if (!portfolio) {
    return (
      <>
        <Alert variant="danger">{error || "No se encontró el portafolio."}</Alert>
        <Button as={Link} to="/portafolios" variant="primary">
          Volver a portafolios
        </Button>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Detalle de portafolio"
        title={portfolio.name}
        subtitle={portfolio.description || "Sin descripción"}
        actions={
          <>
            <Button as={Link} to="/portafolios" variant="outline-secondary">
              <i className="fa-solid fa-arrow-left me-1" />
              Volver
            </Button>
            <Button
              as={Link}
              to={`/operar?portfolioId=${portfolio.id}`}
              variant="primary"
            >
              <i className="fa-solid fa-right-left me-1" />
              Operar
            </Button>
          </>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Badge bg={portfolio.active ? "success" : "secondary"}>
          {portfolio.active ? "Activo" : "Inactivo"}
        </Badge>
        <span className="text-muted small">
          Creado el {formatDate(portfolio.createdAt)} ·{" "}
          {summary.positionsCount ?? 0} posición(es)
        </span>
        <div className="ms-auto d-flex gap-2">
          <Button size="sm" variant="outline-primary" onClick={() => setShowEdit(true)}>
            <i className="fa-solid fa-pen me-1" />
            Editar
          </Button>
          {portfolio.active && (
            <Button size="sm" variant="outline-danger" onClick={handleDeactivate}>
              <i className="fa-solid fa-ban me-1" />
              Desactivar
            </Button>
          )}
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Valor de mercado"
            value={formatMoney(summary.totalMarketValue)}
            hint={`Costo: ${formatMoney(summary.totalCost)}`}
            icon="fa-chart-pie"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Ganancia / pérdida"
            value={formatMoney(summary.totalPnl)}
            hint={formatPercent(summary.totalPnlPercent)}
            icon="fa-arrow-trend-up"
            tone={toNumber(summary.totalPnl) >= 0 ? "success" : "danger"}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Saldo disponible"
            value={formatMoney(summary.cashBalance)}
            hint="Efectivo compartido entre portafolios"
            icon="fa-wallet"
            tone="info"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Posiciones"
            value={summary.positionsCount ?? 0}
            hint={`${transactions.length} operación(es) registradas`}
            icon="fa-layer-group"
            tone="warning"
          />
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col xl={7}>
          <Card className="is-card h-100">
            <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
              <h2 className="h6 fw-bold mb-0">
                <i className="fa-solid fa-chart-area me-2 text-primary" />
                Evolución del portafolio
              </h2>
              <Form.Select
                size="sm"
                style={{ width: "auto" }}
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
              >
                <option value={30}>30 días</option>
                <option value={90}>90 días</option>
                <option value={180}>180 días</option>
                <option value={365}>1 año</option>
              </Form.Select>
            </Card.Header>
            <Card.Body>
              {analyticsError ? (
                <Alert variant="warning" className="mb-0">
                  {analyticsError}
                </Alert>
              ) : (
                <LineChart
                  data={chartData}
                  color={toNumber(analytics?.totalReturnPercent) >= 0 ? "#0f766e" : "#dc2626"}
                />
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xl={5}>
          <Card className="is-card h-100">
            <Card.Header className="bg-white border-0 pt-3">
              <h2 className="h6 fw-bold mb-0">
                <i className="fa-solid fa-gauge-high me-2 text-primary" />
                Métricas del periodo
              </h2>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Valor inicial</span>
                <strong>{formatMoney(analytics?.initialValue)}</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Valor actual</span>
                <strong>{formatMoney(analytics?.currentValue)}</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Retorno total</span>
                <strong className={percentClass(analytics?.totalReturnPercent)}>
                  {formatPercent(analytics?.totalReturnPercent)}
                </strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Volatilidad anualizada</span>
                <strong>{formatPercent(analytics?.annualizedVolatilityPercent, { signed: false })}</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Máxima caída</span>
                <strong className="text-danger">
                  {formatPercent(analytics?.maxDrawdownPercent, { signed: false })}
                </strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Mejor / peor día</span>
                <strong>
                  <span className="text-success">
                    {formatPercent(analytics?.bestDayPercent)}
                  </span>{" "}
                  /{" "}
                  <span className="text-danger">
                    {formatPercent(analytics?.worstDayPercent)}
                  </span>
                </strong>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted small">Ratio de Sharpe</span>
                <strong>{toNumber(analytics?.sharpeRatio).toFixed(2)}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="is-card mb-4">
        <Card.Header className="bg-white border-0 pt-3">
          <h2 className="h6 fw-bold mb-0">
            <i className="fa-solid fa-layer-group me-2 text-primary" />
            Posiciones actuales
          </h2>
        </Card.Header>
        <Card.Body className="pt-2">
          {(portfolio.positions ?? []).length === 0 ? (
            <EmptyState
              icon="fa-cart-plus"
              title="Sin posiciones"
              text="Este portafolio aún no tiene instrumentos. Realiza tu primera compra."
              action={
                <Button
                  as={Link}
                  to={`/operar?portfolioId=${portfolio.id}&type=BUY`}
                  size="sm"
                  variant="primary"
                >
                  Comprar instrumento
                </Button>
              }
            />
          ) : (
            <Table responsive hover className="is-table">
              <thead>
                <tr>
                  <th>Símbolo</th>
                  <th className="text-end">Cantidad</th>
                  <th className="text-end">Costo promedio</th>
                  <th className="text-end">Precio actual</th>
                  <th className="text-end">Valor</th>
                  <th className="text-end">P&L</th>
                  <th className="text-end" />
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((position) => (
                  <tr key={position.id}>
                    <td>
                      <span className="is-symbol">{position.symbol}</span>
                    </td>
                    <td className="text-end">{toNumber(position.quantity).toFixed(4)}</td>
                    <td className="text-end">{formatMoney(position.averageCost)}</td>
                    <td className="text-end">{formatMoney(position.currentPrice)}</td>
                    <td className="text-end fw-semibold">
                      {formatMoney(position.marketValue)}
                    </td>
                    <td className={`text-end fw-semibold ${percentClass(position.unrealizedPnl)}`}>
                      {formatMoney(position.unrealizedPnl)}
                      <small className="d-block">
                        {formatPercent(position.unrealizedPnlPercent)}
                      </small>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Button
                          as={Link}
                          to={`/operar?portfolioId=${portfolio.id}&symbol=${position.symbol}&type=BUY`}
                          size="sm"
                          variant="outline-success"
                          title="Comprar más"
                        >
                          <i className="fa-solid fa-cart-plus" />
                        </Button>
                        <Button
                          as={Link}
                          to={`/operar?portfolioId=${portfolio.id}&symbol=${position.symbol}&type=SELL`}
                          size="sm"
                          variant="outline-danger"
                          title="Vender"
                        >
                          <i className="fa-solid fa-money-bill-transfer" />
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

      <Card className="is-card">
        <Card.Header className="bg-white border-0 pt-3">
          <h2 className="h6 fw-bold mb-0">
            <i className="fa-solid fa-clock-rotate-left me-2 text-primary" />
            Historial de operaciones
          </h2>
        </Card.Header>
        <Card.Body className="pt-2">
          {transactions.length === 0 ? (
            <EmptyState
              icon="fa-right-left"
              title="Sin operaciones"
              text="Las compras y ventas de este portafolio aparecerán aquí."
            />
          ) : (
            <Table responsive hover className="is-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Símbolo</th>
                  <th className="text-end">Cantidad</th>
                  <th className="text-end">Precio</th>
                  <th className="text-end">Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="text-muted small">
                      {formatDateTime(transaction.executedAt)}
                    </td>
                    <td>
                      <span
                        className={`is-soft-badge ${
                          transaction.type === "BUY" ? "is-buy" : "is-sell"
                        }`}
                      >
                        {transaction.type === "BUY" ? "Compra" : "Venta"}
                      </span>
                    </td>
                    <td>
                      <span className="is-symbol">{transaction.symbol}</span>
                    </td>
                    <td className="text-end">{toNumber(transaction.quantity).toFixed(4)}</td>
                    <td className="text-end">{formatMoney(transaction.price)}</td>
                    <td className="text-end fw-semibold">{formatMoney(transaction.total)}</td>
                    <td className="text-muted small">{transaction.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Form noValidate onSubmit={handleUpdate}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">Editar portafolio</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="editName">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                isInvalid={Boolean(fieldErrors.name)}
                required
              />
              {fieldErrors.name && (
                <div className="invalid-feedback d-block">{fieldErrors.name}</div>
              )}
            </Form.Group>
            <Form.Group controlId="editDescription">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={form.description}
                onChange={handleChange}
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
              onClick={() => setShowEdit(false)}
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
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

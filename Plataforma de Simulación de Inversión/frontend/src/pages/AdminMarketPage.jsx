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
  createInstrument,
  getIngestionLogs,
  getProviders,
  ingestAll,
  ingestInstrument,
  listInstruments,
} from "../services/marketService";
import {
  notifyError,
  notifySuccess,
} from "../utils/alerts";
import {
  formatDateTime,
  formatMoney,
  formatPercent,
  percentClass,
  toNumber,
} from "../utils/format";

const initialForm = {
  symbol: "",
  name: "",
  type: "STOCK",
  currency: "USD",
  exchange: "",
};

export default function AdminMarketPage() {
  const [instruments, setInstruments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [runningIngest, setRunningIngest] = useState(false);
  const [ingestingSymbol, setIngestingSymbol] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      listInstruments(),
      getIngestionLogs(),
      getProviders(),
    ]);

    if (results[0].status === "fulfilled") {
      setInstruments(results[0].value.data ?? []);
    } else {
      setError(results[0].reason.message);
    }

    if (results[1].status === "fulfilled") {
      setLogs(results[1].value.data ?? []);
    }

    if (results[2].status === "fulfilled") {
      setProvider(results[2].value.data?.activeQuoteProvider ?? "");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return instruments.filter(
      (instrument) =>
        !term ||
        instrument.symbol?.toLowerCase().includes(term) ||
        instrument.name?.toLowerCase().includes(term),
    );
  }, [instruments, query]);

  const stats = useMemo(
    () => ({
      total: instruments.length,
      stocks: instruments.filter((instrument) => instrument.type === "STOCK").length,
      etfs: instruments.filter((instrument) => instrument.type === "ETF").length,
      active: instruments.filter((instrument) => instrument.active).length,
    }),
    [instruments],
  );

  async function handleIngestAll() {
    setRunningIngest(true);
    try {
      const response = await ingestAll();
      notifySuccess(response.message);
      await load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setRunningIngest(false);
    }
  }

  async function handleIngest(symbol) {
    setIngestingSymbol(symbol);
    try {
      const response = await ingestInstrument(symbol);
      notifySuccess(response.message);
      await load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setIngestingSymbol("");
    }
  }

  function openModal() {
    setForm(initialForm);
    setFieldErrors({});
    setShowModal(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});

    try {
      const response = await createInstrument({
        symbol: form.symbol.trim().toUpperCase(),
        name: form.name.trim(),
        type: form.type,
        currency: form.currency.trim().toUpperCase() || "USD",
        exchange: form.exchange.trim(),
      });
      notifySuccess(response.message);
      setShowModal(false);
      setForm(initialForm);
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
    return <LoadingState label="Cargando administración de mercado..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Instrumentos e ingesta"
        subtitle="Registra instrumentos y actualiza cotizaciones desde los proveedores de datos."
        actions={
          <>
            <Button
              variant="outline-primary"
              onClick={handleIngestAll}
              disabled={runningIngest}
            >
              {runningIngest ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-rotate me-1" />
                  Ejecutar ingesta
                </>
              )}
            </Button>
            <Button variant="primary" onClick={openModal}>
              <i className="fa-solid fa-plus me-1" />
              Nuevo instrumento
            </Button>
          </>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard title="Instrumentos" value={stats.total} icon="fa-coins" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Acciones"
            value={stats.stocks}
            hint={`${stats.etfs} ETF(s)`}
            icon="fa-building-columns"
            tone="info"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Activos"
            value={stats.active}
            hint={`${stats.total - stats.active} inactivo(s)`}
            icon="fa-toggle-on"
            tone="success"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Proveedor de cotización"
            value={provider || "—"}
            hint="Fuente activa configurada"
            icon="fa-plug"
            tone="warning"
          />
        </Col>
      </Row>

      <Card className="is-card mb-4">
        <Card.Header className="bg-white border-0 pt-3 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <h2 className="h6 fw-bold mb-0">
            <i className="fa-solid fa-list me-2 text-primary" />
            Catálogo de instrumentos
          </h2>
          <Form.Control
            type="search"
            placeholder="Buscar símbolo o nombre..."
            style={{ maxWidth: "18rem" }}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Card.Header>
        <Card.Body className="pt-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon="fa-coins"
              title="Sin instrumentos"
              text="No hay instrumentos que coincidan con la búsqueda."
            />
          ) : (
            <Table responsive hover className="is-table">
              <thead>
                <tr>
                  <th>Símbolo</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th className="text-end">Precio</th>
                  <th className="text-end">Cambio</th>
                  <th>Estado</th>
                  <th>Actualizado</th>
                  <th className="text-end" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((instrument) => (
                  <tr key={instrument.symbol}>
                    <td>
                      <span className="is-symbol">{instrument.symbol}</span>
                    </td>
                    <td>
                      <div className="fw-semibold">{instrument.name}</div>
                      <small className="text-muted">
                        {instrument.exchange || "—"} · {instrument.currency}
                      </small>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border">
                        {instrument.type}
                      </Badge>
                    </td>
                    <td className="text-end fw-semibold">
                      {formatMoney(instrument.currentPrice)}
                    </td>
                    <td
                      className={`text-end fw-semibold ${percentClass(
                        instrument.dailyChangePercent,
                      )}`}
                    >
                      {formatPercent(instrument.dailyChangePercent)}
                    </td>
                    <td>
                      <span
                        className={`is-soft-badge ${
                          instrument.active ? "" : "is-muted"
                        }`}
                      >
                        {instrument.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {formatDateTime(instrument.lastUpdated)}
                    </td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        disabled={ingestingSymbol === instrument.symbol}
                        onClick={() => handleIngest(instrument.symbol)}
                      >
                        {ingestingSymbol === instrument.symbol ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : (
                          <>
                            <i className="fa-solid fa-rotate me-1" />
                            Ingestar
                          </>
                        )}
                      </Button>
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
            <i className="fa-solid fa-file-lines me-2 text-primary" />
            Registros de ingesta
          </h2>
        </Card.Header>
        <Card.Body className="pt-2">
          {logs.length === 0 ? (
            <EmptyState
              icon="fa-file-lines"
              title="Sin registros"
              text="Los resultados de cada ingesta aparecerán en esta tabla."
            />
          ) : (
            <Table responsive hover className="is-table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Símbolo</th>
                  <th>Operación</th>
                  <th>Estado</th>
                  <th className="text-end">Registros</th>
                  <th>Mensaje</th>
                  <th>Inicio</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="fw-semibold">{log.provider}</td>
                    <td>{log.symbol || "Todos"}</td>
                    <td className="text-muted small">{log.operation}</td>
                    <td>
                      <Badge
                        bg={
                          log.status === "SUCCESS"
                            ? "success"
                            : log.status === "ERROR"
                              ? "danger"
                              : "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="text-end">{toNumber(log.recordsProcessed)}</td>
                    <td className="text-muted small text-truncate" style={{ maxWidth: "16rem" }}>
                      {log.message || "—"}
                    </td>
                    <td className="text-muted small">
                      {formatDateTime(log.startedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form noValidate onSubmit={handleCreate}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">Nuevo instrumento</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col sm={6}>
                <Form.Group controlId="instrumentSymbol">
                  <Form.Label>Símbolo</Form.Label>
                  <Form.Control
                    name="symbol"
                    value={form.symbol}
                    onChange={handleChange}
                    placeholder="Ej. MELI"
                    isInvalid={Boolean(fieldErrors.symbol)}
                    required
                  />
                  {fieldErrors.symbol && (
                    <div className="invalid-feedback d-block">{fieldErrors.symbol}</div>
                  )}
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="instrumentType">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select name="type" value={form.type} onChange={handleChange}>
                    <option value="STOCK">Acción</option>
                    <option value="ETF">ETF</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={12}>
                <Form.Group controlId="instrumentName">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ej. MercadoLibre Inc."
                    isInvalid={Boolean(fieldErrors.name)}
                    required
                  />
                  {fieldErrors.name && (
                    <div className="invalid-feedback d-block">{fieldErrors.name}</div>
                  )}
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="instrumentCurrency">
                  <Form.Label>Moneda</Form.Label>
                  <Form.Control
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    maxLength={5}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="instrumentExchange">
                  <Form.Label>Bolsa</Form.Label>
                  <Form.Control
                    name="exchange"
                    value={form.exchange}
                    onChange={handleChange}
                    placeholder="Ej. NASDAQ"
                  />
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
              ) : (
                "Registrar instrumento"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

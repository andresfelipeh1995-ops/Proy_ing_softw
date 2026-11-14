import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { listPortfolios } from "../services/portfolioService";
import {
  deleteScenario,
  listScenarios,
  simulateScenario,
} from "../services/scenarioService";
import {
  confirmAction,
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
  portfolioId: "",
  name: "",
  description: "",
  marketShockPercent: "-20",
  interestRateDelta: "0",
  volatilityMultiplier: "1",
  durationDays: "30",
  save: true,
};

const PRESETS = [
  { label: "Crisis severa", shock: -35, volatility: 2, days: 90, danger: true },
  { label: "Corrección", shock: -10, volatility: 1.5, days: 30, danger: true },
  { label: "Rally", shock: 15, volatility: 1.2, days: 30, danger: false },
  { label: "Alta volatilidad", shock: -5, volatility: 2.5, days: 60, danger: true },
];

export default function ScenariosPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const results = await Promise.allSettled([listPortfolios(), listScenarios()]);

    if (results[0].status === "fulfilled") {
      const list = results[0].value.data ?? [];
      setPortfolios(list);
      setForm((current) =>
        current.portfolioId || list.length === 0
          ? current
          : { ...current, portfolioId: String(list[0].id) },
      );
    } else {
      setError(results[0].reason.message);
    }

    if (results[1].status === "fulfilled") {
      setScenarios(results[1].value.data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function applyPreset(preset) {
    setForm((current) => ({
      ...current,
      marketShockPercent: String(preset.shock),
      volatilityMultiplier: String(preset.volatility),
      durationDays: String(preset.days),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.portfolioId) {
      setError("Selecciona un portafolio.");
      return;
    }

    setRunning(true);

    try {
      const response = await simulateScenario({
        portfolioId: Number(form.portfolioId),
        name: form.name.trim() || "Escenario simulado",
        description: form.description.trim(),
        marketShockPercent: toNumber(form.marketShockPercent),
        interestRateDelta: toNumber(form.interestRateDelta) / 100,
        volatilityMultiplier: toNumber(form.volatilityMultiplier),
        durationDays: Math.round(toNumber(form.durationDays)),
        save: Boolean(form.save),
      });

      setResult(response.data);
      notifySuccess(response.message);

      if (form.save) {
        const refreshed = await listScenarios();
        setScenarios(refreshed.data ?? []);
      }
    } catch (err) {
      if (err.data && typeof err.data === "object") {
        setError(Object.values(err.data).join(" "));
      } else {
        notifyError(err.message);
      }
    } finally {
      setRunning(false);
    }
  }

  async function handleDelete(scenario) {
    const confirmed = await confirmAction({
      title: "Eliminar escenario",
      html: `¿Deseas eliminar el escenario <strong>${scenario.name}</strong>?`,
      confirmButtonText: "Eliminar",
    });

    if (!confirmed) return;

    try {
      const response = await deleteScenario(scenario.id);
      notifySuccess(response.message);
      const refreshed = await listScenarios();
      setScenarios(refreshed.data ?? []);
    } catch (err) {
      notifyError(err.message);
    }
  }

  if (loading) {
    return <LoadingState label="Cargando escenarios..." />;
  }

  const hasPortfolios = portfolios.length > 0;

  return (
    <>
      <PageHeader
        eyebrow="Escenarios"
        title="Prueba tu portafolio bajo estrés"
        subtitle="Aplica choques de mercado y volatilidad para estimar el impacto en tus posiciones."
        actions={
          <Button as={Link} to="/portafolios" variant="outline-secondary">
            <i className="fa-solid fa-folder-open me-1" />
            Mis portafolios
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {!hasPortfolios ? (
        <Card className="is-card">
          <Card.Body>
            <EmptyState
              icon="fa-folder-plus"
              title="Necesitas un portafolio con posiciones"
              text="Crea un portafolio y compra instrumentos antes de simular escenarios."
              action={
                <Button as={Link} to="/portafolios" variant="primary">
                  Crear portafolio
                </Button>
              }
            />
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4 mb-4">
          <Col xl={5}>
            <Card className="is-card h-100">
              <Card.Body className="p-4">
                <h2 className="h6 fw-bold mb-3">
                  <i className="fa-solid fa-sliders me-2 text-primary" />
                  Configuración del escenario
                </h2>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      size="sm"
                      variant={preset.danger ? "outline-danger" : "outline-success"}
                      type="button"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                <Form noValidate onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="scenarioPortfolio">
                    <Form.Label>Portafolio</Form.Label>
                    <Form.Select
                      name="portfolioId"
                      value={form.portfolioId}
                      onChange={handleChange}
                    >
                      {portfolios.map((portfolio) => (
                        <option key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="scenarioName">
                    <Form.Label>Nombre del escenario</Form.Label>
                    <Form.Control
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Ej. Recesión 2026"
                      maxLength={120}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="scenarioDescription">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      maxLength={300}
                      placeholder="Supuestos del escenario (opcional)"
                    />
                  </Form.Group>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="scenarioShock">
                        <Form.Label>Choque de mercado (%)</Form.Label>
                        <Form.Control
                          type="number"
                          name="marketShockPercent"
                          step="1"
                          min="-100"
                          max="500"
                          value={form.marketShockPercent}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="scenarioVolatility">
                        <Form.Label>Multiplicador de volatilidad</Form.Label>
                        <Form.Control
                          type="number"
                          name="volatilityMultiplier"
                          step="0.1"
                          min="0"
                          max="10"
                          value={form.volatilityMultiplier}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="scenarioRate">
                        <Form.Label>Cambio de tasa (%)</Form.Label>
                        <Form.Control
                          type="number"
                          name="interestRateDelta"
                          step="0.1"
                          min="-100"
                          max="100"
                          value={form.interestRateDelta}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="scenarioDays">
                        <Form.Label>Duración (días)</Form.Label>
                        <Form.Control
                          type="number"
                          name="durationDays"
                          step="1"
                          min="1"
                          max="3650"
                          value={form.durationDays}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Check
                    type="checkbox"
                    id="scenarioSave"
                    name="save"
                    className="mt-3"
                    label="Guardar este escenario en mi historial"
                    checked={form.save}
                    onChange={handleChange}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 mt-4 fw-bold"
                    disabled={running}
                  >
                    {running ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Simulando...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-flask me-1" />
                        Simular escenario
                      </>
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={7}>
            <Card className="is-card h-100">
              <Card.Body className="p-4">
                <h2 className="h6 fw-bold mb-3">
                  <i className="fa-solid fa-chart-column me-2 text-primary" />
                  Resultado del escenario
                </h2>

                {!result ? (
                  <EmptyState
                    icon="fa-flask"
                    title="Sin resultados"
                    text="Configura un escenario y ejecútalo para ver el impacto estimado."
                  />
                ) : (
                  <>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <Badge bg="light" text="dark" className="border">
                        Choque {formatPercent(result.marketShockPercent)}
                      </Badge>
                      <Badge bg="light" text="dark" className="border">
                        Volatilidad x{toNumber(result.volatilityMultiplier).toFixed(1)}
                      </Badge>
                      <Badge bg="light" text="dark" className="border">
                        {result.durationDays} días
                      </Badge>
                    </div>

                    <Row className="g-2 mb-3">
                      <Col sm={4}>
                        <div className="is-metric-mini">
                          <span>Valor inicial</span>
                          <strong>{formatMoney(result.initialValue)}</strong>
                        </div>
                      </Col>
                      <Col sm={4}>
                        <div className="is-metric-mini">
                          <span>Valor proyectado</span>
                          <strong>{formatMoney(result.projectedValue)}</strong>
                        </div>
                      </Col>
                      <Col sm={4}>
                        <div className="is-metric-mini">
                          <span>Variación</span>
                          <strong className={percentClass(result.changePercent)}>
                            {formatMoney(result.changeAmount)}
                          </strong>
                          <small className={percentClass(result.changePercent)}>
                            {formatPercent(result.changePercent)}
                          </small>
                        </div>
                      </Col>
                    </Row>

                    {(result.positions ?? []).length === 0 ? (
                      <Alert variant="warning" className="mb-0">
                        El portafolio no tiene posiciones para evaluar.
                      </Alert>
                    ) : (
                      <Table responsive hover className="is-table">
                        <thead>
                          <tr>
                            <th>Símbolo</th>
                            <th className="text-end">Cantidad</th>
                            <th className="text-end">Inicial</th>
                            <th className="text-end">Proyectado</th>
                            <th className="text-end">Cambio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.positions.map((position) => (
                            <tr key={position.symbol}>
                              <td>
                                <span className="is-symbol">{position.symbol}</span>
                              </td>
                              <td className="text-end">
                                {toNumber(position.quantity).toFixed(4)}
                              </td>
                              <td className="text-end">
                                {formatMoney(position.initialValue)}
                              </td>
                              <td className="text-end">
                                {formatMoney(position.projectedValue)}
                              </td>
                              <td
                                className={`text-end fw-semibold ${percentClass(
                                  position.changePercent,
                                )}`}
                              >
                                {formatMoney(position.changeAmount)}
                                <small className="d-block">
                                  {formatPercent(position.changePercent)}
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Card className="is-card">
        <Card.Header className="bg-white border-0 pt-3">
          <h2 className="h6 fw-bold mb-0">
            <i className="fa-solid fa-bookmark me-2 text-primary" />
            Escenarios guardados
          </h2>
        </Card.Header>
        <Card.Body className="pt-2">
          {scenarios.length === 0 ? (
            <EmptyState
              icon="fa-bookmark"
              title="Sin escenarios guardados"
              text="Marca la casilla «Guardar» al simular para conservar un escenario."
            />
          ) : (
            <Table responsive hover className="is-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th className="text-end">Choque</th>
                  <th className="text-end">Volatilidad</th>
                  <th className="text-end">Días</th>
                  <th>Creado</th>
                  <th className="text-end" />
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario) => (
                  <tr key={scenario.id}>
                    <td>
                      <div className="fw-semibold">
                        {scenario.name || "Escenario simulado"}
                      </div>
                      <small className="text-muted">
                        {scenario.description || "Sin descripción"}
                      </small>
                    </td>
                    <td
                      className={`text-end fw-semibold ${percentClass(
                        scenario.marketShockPercent,
                      )}`}
                    >
                      {formatPercent(scenario.marketShockPercent)}
                    </td>
                    <td className="text-end">
                      x{toNumber(scenario.volatilityMultiplier).toFixed(1)}
                    </td>
                    <td className="text-end">{scenario.durationDays}</td>
                    <td className="text-muted small">
                      {formatDateTime(scenario.createdAt)}
                    </td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(scenario)}
                      >
                        <i className="fa-solid fa-trash" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
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
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import LineChart from "../components/LineChart";
import {
  closeSavingsAccount,
  createSavingsAccount,
  listSavings,
  simulateSavings,
} from "../services/savingsService";
import { getMyProfile } from "../services/userService";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../utils/alerts";
import {
  formatDate,
  formatMoney,
  formatPercent,
  toNumber,
} from "../utils/format";

const FREQUENCIES = [
  { value: "DAILY", label: "Diaria", periods: 365 },
  { value: "MONTHLY", label: "Mensual", periods: 12 },
  { value: "QUARTERLY", label: "Trimestral", periods: 4 },
  { value: "ANNUALLY", label: "Anual", periods: 1 },
];

const FREQUENCY_LABELS = Object.fromEntries(
  FREQUENCIES.map((item) => [item.value, item.label]),
);

const initialForm = {
  name: "",
  principal: "1000",
  annualRate: "8",
  frequency: "MONTHLY",
  termMonths: "12",
};

function buildSeries({ principal, annualRate, frequency, termMonths }) {
  const periods =
    FREQUENCIES.find((item) => item.value === frequency)?.periods ?? 12;
  const monthlyRate = Math.pow(
    1 + (toNumber(annualRate) / 100) / periods,
    periods / 12,
  ) - 1;
  const months = Math.max(Math.round(toNumber(termMonths)), 1);
  const totalPoints = Math.min(months, 60);
  const step = Math.max(Math.floor(months / totalPoints), 1);
  const points = [];
  const start = new Date();

  for (let month = 0; month <= months; month += step) {
    const date = new Date(start.getFullYear(), start.getMonth() + month, start.getDate());
    points.push({
      date: date.toISOString().slice(0, 10),
      value: toNumber(principal) * Math.pow(1 + monthlyRate, month),
    });
  }

  if (points[points.length - 1]?.value !== toNumber(principal) * Math.pow(1 + monthlyRate, months)) {
    const date = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
    points.push({
      date: date.toISOString().slice(0, 10),
      value: toNumber(principal) * Math.pow(1 + monthlyRate, months),
    });
  }

  return points;
}

export default function SavingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const results = await Promise.allSettled([listSavings(), getMyProfile()]);

    if (results[0].status === "fulfilled") {
      setAccounts(results[0].value.data ?? []);
    } else {
      setError(results[0].reason.message);
    }

    if (results[1].status === "fulfilled") {
      setProfile(results[1].value.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(
    () => ({
      principal: accounts.reduce(
        (sum, account) => sum + toNumber(account.principal),
        0,
      ),
      projected: accounts.reduce(
        (sum, account) => sum + toNumber(account.projectedFinalAmount),
        0,
      ),
    }),
    [accounts],
  );

  const payload = {
    name: form.name.trim() || "Cuenta de ahorro",
    principal: toNumber(form.principal),
    annualInterestRate: toNumber(form.annualRate) / 100,
    frequency: form.frequency,
    termMonths: Math.round(toNumber(form.termMonths)),
  };

  const previewSeries = projection
    ? buildSeries({
        principal: projection.principal,
        annualRate: toNumber(projection.annualInterestRate) * 100,
        frequency: projection.frequency,
        termMonths: projection.months,
      })
    : [];

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setProjection(null);
  }

  async function handleSimulate(event) {
    event.preventDefault();
    setError("");
    setSimulating(true);

    try {
      const response = await simulateSavings(payload);
      setProjection(response.data);
    } catch (err) {
      if (err.data && typeof err.data === "object") {
        setError(Object.values(err.data).join(" "));
      } else {
        notifyError(err.message);
      }
    } finally {
      setSimulating(false);
    }
  }

  async function handleCreate() {
    setError("");

    if (payload.principal <= 0) {
      setError("El capital inicial debe ser mayor que cero.");
      return;
    }

    if (payload.principal > toNumber(profile?.availableBalance)) {
      setError("Saldo insuficiente para abrir la cuenta de ahorro.");
      return;
    }

    setCreating(true);

    try {
      const response = await createSavingsAccount(payload);
      notifySuccess(response.message);
      setForm(initialForm);
      setProjection(null);
      await load();
    } catch (err) {
      if (err.data && typeof err.data === "object") {
        setError(Object.values(err.data).join(" "));
      } else {
        notifyError(err.message);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleClose(account) {
    const confirmed = await confirmAction({
      title: "Cerrar cuenta de ahorro",
      html: `Se devolverá el capital más los intereses generados a tu saldo disponible y se cerrará <strong>${account.name}</strong>.`,
      confirmButtonText: "Cerrar cuenta",
    });

    if (!confirmed) return;

    try {
      const response = await closeSavingsAccount(account.id);
      notifySuccess(response.message);
      await load();
    } catch (err) {
      notifyError(err.message);
    }
  }

  if (loading) {
    return <LoadingState label="Cargando cuentas de ahorro..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Ahorros"
        title="Simula interés compuesto"
        subtitle="Proyecta cuánto crecería tu dinero con distintas tasas y frecuencias de capitalización."
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Saldo disponible"
            value={formatMoney(profile?.availableBalance)}
            hint="Efectivo sin invertir"
            icon="fa-wallet"
            tone="info"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Capital en ahorros"
            value={formatMoney(totals.principal)}
            hint={`${accounts.length} cuenta(s) activa(s)`}
            icon="fa-piggy-bank"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Proyección total"
            value={formatMoney(totals.projected)}
            hint={`Intereses: ${formatMoney(totals.projected - totals.principal)}`}
            icon="fa-arrow-trend-up"
            tone="success"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Interés proyectado"
            value={formatMoney(totals.projected - totals.principal)}
            hint="Al vencimiento de cada cuenta"
            icon="fa-coins"
            tone="warning"
          />
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col xl={6}>
          <Card className="is-card h-100">
            <Card.Body className="p-4">
              <h2 className="h6 fw-bold mb-3">
                <i className="fa-solid fa-calculator me-2 text-primary" />
                Parámetros de la cuenta
              </h2>

              <Form noValidate onSubmit={handleSimulate}>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group controlId="savingsName">
                      <Form.Label>Nombre de la cuenta</Form.Label>
                      <Form.Control
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Ej. Fondo de emergencia"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="savingsPrincipal">
                      <Form.Label>Capital inicial</Form.Label>
                      <Form.Control
                        type="number"
                        name="principal"
                        min="0.01"
                        step="0.01"
                        value={form.principal}
                        onChange={handleChange}
                        required
                      />
                      <Form.Text className="text-muted">
                        Disponible: {formatMoney(profile?.availableBalance)}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="savingsRate">
                      <Form.Label>Tasa anual (%)</Form.Label>
                      <Form.Control
                        type="number"
                        name="annualRate"
                        min="0"
                        max="100"
                        step="0.1"
                        value={form.annualRate}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="savingsFrequency">
                      <Form.Label>Capitalización</Form.Label>
                      <Form.Select
                        name="frequency"
                        value={form.frequency}
                        onChange={handleChange}
                      >
                        {FREQUENCIES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="savingsTerm">
                      <Form.Label>Plazo (meses)</Form.Label>
                      <Form.Control
                        type="number"
                        name="termMonths"
                        min="1"
                        max="600"
                        step="1"
                        value={form.termMonths}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex flex-wrap gap-2 mt-4">
                  <Button type="submit" variant="outline-primary" disabled={simulating}>
                    {simulating ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-calculator me-1" />
                        Simular proyección
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Abriendo...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-piggy-bank me-1" />
                        Abrir cuenta
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={6}>
          <Card className="is-card h-100">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h6 fw-bold mb-0">
                  <i className="fa-solid fa-chart-area me-2 text-primary" />
                  Resultado de la proyección
                </h2>
                {projection && (
                  <Badge bg="light" text="dark" className="border">
                    {FREQUENCY_LABELS[projection.frequency] || projection.frequency}
                  </Badge>
                )}
              </div>

              {!projection ? (
                <EmptyState
                  icon="fa-calculator"
                  title="Sin proyección todavía"
                  text="Completa los parámetros y pulsa «Simular proyección» para ver el resultado."
                />
              ) : (
                <>
                  <Row className="g-2 mb-3">
                    <Col xs={6}>
                      <div className="is-metric-mini">
                        <span>Monto final</span>
                        <strong>{formatMoney(projection.finalAmount)}</strong>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="is-metric-mini">
                        <span>Intereses ganados</span>
                        <strong className="text-success">
                          {formatMoney(projection.interestEarned)}
                        </strong>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="is-metric-mini">
                        <span>Tasa efectiva anual</span>
                        <strong>{formatPercent(projection.effectiveAnnualRate, { signed: false })}</strong>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="is-metric-mini">
                        <span>Plazo</span>
                        <strong>{projection.months} meses</strong>
                      </div>
                    </Col>
                  </Row>

                  <p className="text-muted small mb-2">Crecimiento estimado mes a mes</p>
                  <LineChart data={previewSeries} color="#0f766e" height={200} />
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="is-card">
        <Card.Header className="bg-white border-0 pt-3">
          <h2 className="h6 fw-bold mb-0">
            <i className="fa-solid fa-list-check me-2 text-primary" />
            Mis cuentas de ahorro
          </h2>
        </Card.Header>
        <Card.Body className="pt-2">
          {accounts.length === 0 ? (
            <EmptyState
              icon="fa-piggy-bank"
              title="Sin cuentas de ahorro"
              text="Abre una cuenta para reservar parte de tu saldo y proyectar sus intereses."
            />
          ) : (
            <Table responsive hover className="is-table">
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th className="text-end">Capital</th>
                  <th className="text-end">Tasa anual</th>
                  <th>Capitalización</th>
                  <th className="text-end">Plazo</th>
                  <th className="text-end">Monto proyectado</th>
                  <th className="text-end">Vence</th>
                  <th className="text-end" />
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className="fw-semibold">{account.name}</div>
                      <small className="text-muted">
                        Desde {formatDate(account.startDate)}
                      </small>
                    </td>
                    <td className="text-end">{formatMoney(account.principal)}</td>
                    <td className="text-end">
                      {formatPercent(toNumber(account.annualInterestRate) * 100, {
                        signed: false,
                      })}
                    </td>
                    <td>
                      <span className="is-soft-badge">
                        {FREQUENCY_LABELS[account.frequency] || account.frequency}
                      </span>
                    </td>
                    <td className="text-end">{account.termMonths} meses</td>
                    <td className="text-end">
                      <div className="fw-semibold">
                        {formatMoney(account.projectedFinalAmount)}
                      </div>
                      <small className="text-success">
                        +{formatMoney(account.projectedInterest)}
                      </small>
                    </td>
                    <td className="text-end text-muted small">
                      {formatDate(account.maturityDate)}
                    </td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleClose(account)}
                      >
                        <i className="fa-solid fa-lock-open me-1" />
                        Cerrar
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

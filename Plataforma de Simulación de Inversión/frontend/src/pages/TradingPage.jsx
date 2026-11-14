import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { listPortfolios } from "../services/portfolioService";
import { listInstruments } from "../services/marketService";
import {
  buy,
  listTransactionsByPortfolio,
  sell,
} from "../services/tradingService";
import { notifyError, notifySuccess } from "../utils/alerts";
import {
  formatDateTime,
  formatMoney,
  formatPercent,
  percentClass,
  toNumber,
} from "../utils/format";

const initialForm = {
  portfolioId: "",
  symbol: "",
  type: "BUY",
  quantity: "",
};

export default function TradingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [portfolios, setPortfolios] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadBase = useCallback(async () => {
    const results = await Promise.allSettled([listPortfolios(), listInstruments()]);

    if (results[0].status === "fulfilled") {
      setPortfolios(results[0].value.data ?? []);
    } else {
      setError(results[0].reason.message);
    }

    if (results[1].status === "fulfilled") {
      setInstruments(results[1].value.data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (loading) return;

    setForm((current) => {
      const requestedPortfolio = searchParams.get("portfolioId");
      const requestedSymbol = searchParams.get("symbol");
      const requestedType = searchParams.get("type");

      const next = { ...current };
      let changed = false;

      if (requestedPortfolio && requestedPortfolio !== current.portfolioId) {
        const exists = portfolios.some(
          (portfolio) => String(portfolio.id) === requestedPortfolio,
        );
        if (exists) {
          next.portfolioId = requestedPortfolio;
          changed = true;
        }
      }

      if (!next.portfolioId && portfolios.length > 0) {
        next.portfolioId = String(portfolios[0].id);
        changed = true;
      }

      if (requestedSymbol && requestedSymbol !== current.symbol) {
        const exists = instruments.some(
          (instrument) => instrument.symbol === requestedSymbol,
        );
        if (exists) {
          next.symbol = requestedSymbol;
          changed = true;
        }
      }

      if (!next.symbol && instruments.length > 0) {
        next.symbol = instruments[0].symbol;
        changed = true;
      }

      if (
        (requestedType === "BUY" || requestedType === "SELL") &&
        requestedType !== current.type
      ) {
        next.type = requestedType;
        changed = true;
      }

      return changed ? next : current;
    });
  }, [loading, portfolios, instruments, searchParams]);

  const refreshTransactions = useCallback(async (portfolioId) => {
    if (!portfolioId) {
      setTransactions([]);
      return;
    }

    try {
      const response = await listTransactionsByPortfolio(portfolioId);
      setTransactions(response.data ?? []);
    } catch (err) {
      setTransactions([]);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refreshTransactions(form.portfolioId);
  }, [form.portfolioId, refreshTransactions]);

  const selectedPortfolio = portfolios.find(
    (portfolio) => String(portfolio.id) === String(form.portfolioId),
  );
  const selectedInstrument = instruments.find(
    (instrument) => instrument.symbol === form.symbol,
  );
  const selectedPosition = (selectedPortfolio?.positions ?? []).find(
    (position) => position.symbol === form.symbol,
  );

  const estimatedTotal = useMemo(
    () => toNumber(selectedInstrument?.currentPrice) * toNumber(form.quantity),
    [selectedInstrument, form.quantity],
  );

  const availableCash = toNumber(selectedPortfolio?.summary?.cashBalance);
  const maxSellQuantity = toNumber(selectedPosition?.quantity);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));

    if (name === "portfolioId" || name === "symbol" || name === "type") {
      const next = { ...searchParams };
      if (name === "portfolioId") next.set("portfolioId", value);
      if (name === "symbol") next.set("symbol", value);
      if (name === "type") next.set("type", value);
      setSearchParams(next, { replace: true });
    }
  }

  function switchType(type) {
    setForm((current) => ({ ...current, type, quantity: "" }));
    const next = { ...searchParams };
    next.set("type", type);
    setSearchParams(next, { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const quantity = toNumber(form.quantity);

    if (!form.portfolioId) {
      setError("Selecciona un portafolio.");
      return;
    }
    if (!form.symbol) {
      setError("Selecciona un instrumento.");
      return;
    }
    if (quantity <= 0) {
      setError("La cantidad debe ser mayor que cero.");
      return;
    }
    if (form.type === "BUY" && estimatedTotal > availableCash) {
      setError("El portafolio no tiene efectivo suficiente para esta compra.");
      return;
    }
    if (form.type === "SELL" && quantity > maxSellQuantity) {
      setError("No tienes suficientes unidades de este instrumento para vender.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        portfolioId: Number(form.portfolioId),
        symbol: form.symbol,
        quantity: quantity.toFixed(4),
      };

      const response = form.type === "BUY" ? await buy(payload) : await sell(payload);
      notifySuccess(response.message);

      const refreshed = await listPortfolios();
      setPortfolios(refreshed.data ?? []);
      await refreshTransactions(form.portfolioId);
      setForm((current) => ({ ...current, quantity: "" }));
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label="Preparando la mesa de operaciones..." />;
  }

  const noPortfolios = portfolios.length === 0;

  return (
    <>
      <PageHeader
        eyebrow="Operar"
        title="Compra y venta simulada"
        subtitle="Ejecuta operaciones con precios de mercado ficticios sobre tus portafolios."
        actions={
          <Button as={Link} to="/portafolios" variant="outline-secondary">
            <i className="fa-solid fa-folder-open me-1" />
            Mis portafolios
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {noPortfolios ? (
        <Card className="is-card">
          <Card.Body>
            <EmptyState
              icon="fa-folder-plus"
              title="Necesitas un portafolio"
              text="Crea un portafolio antes de ejecutar compras o ventas simuladas."
              action={
                <Button as={Link} to="/portafolios" variant="primary">
                  Crear portafolio
                </Button>
              }
            />
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          <Col lg={7}>
            <Card className="is-card mb-4">
              <Card.Body className="p-4">
                <div className="d-flex gap-2 mb-4">
                  <Button
                    variant={form.type === "BUY" ? "success" : "outline-success"}
                    className="flex-fill fw-bold"
                    onClick={() => switchType("BUY")}
                  >
                    <i className="fa-solid fa-cart-plus me-1" />
                    Comprar
                  </Button>
                  <Button
                    variant={form.type === "SELL" ? "danger" : "outline-danger"}
                    className="flex-fill fw-bold"
                    onClick={() => switchType("SELL")}
                  >
                    <i className="fa-solid fa-money-bill-transfer me-1" />
                    Vender
                  </Button>
                </div>

                <Form noValidate onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="tradePortfolio">
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
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="tradeSymbol">
                        <Form.Label>Instrumento</Form.Label>
                        <Form.Select
                          name="symbol"
                          value={form.symbol}
                          onChange={handleChange}
                        >
                          {instruments.map((instrument) => (
                            <option key={instrument.symbol} value={instrument.symbol}>
                              {instrument.symbol} · {instrument.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="tradeQuantity">
                        <Form.Label>Cantidad</Form.Label>
                        <Form.Control
                          type="number"
                          name="quantity"
                          min="0.0001"
                          step="0.0001"
                          placeholder="0.0000"
                          value={form.quantity}
                          onChange={handleChange}
                          required
                        />
                        <Form.Text className="text-muted">
                          {form.type === "BUY"
                            ? `Efectivo disponible: ${formatMoney(availableCash)}`
                            : `Unidades disponibles: ${maxSellQuantity.toFixed(4)}`}
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="tradeTotal">
                        <Form.Label>Total estimado</Form.Label>
                        <Form.Control
                          readOnly
                          value={formatMoney(estimatedTotal)}
                          className="fw-bold"
                        />
                        <Form.Text className="text-muted">
                          Precio actual: {formatMoney(selectedInstrument?.currentPrice)}
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex flex-wrap gap-2 mt-4">
                    <Button
                      type="submit"
                      variant={form.type === "BUY" ? "success" : "danger"}
                      className="fw-bold"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Procesando...
                        </>
                      ) : form.type === "BUY" ? (
                        <>
                          <i className="fa-solid fa-cart-plus me-1" />
                          Comprar {form.symbol || "instrumento"}
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-money-bill-transfer me-1" />
                          Vender {form.symbol || "instrumento"}
                        </>
                      )}
                    </Button>
                    {form.type === "SELL" && maxSellQuantity > 0 && (
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            quantity: String(maxSellQuantity),
                          }))
                        }
                      >
                        Vender todo
                      </Button>
                    )}
                  </div>
                </Form>
              </Card.Body>
            </Card>

            <Card className="is-card">
              <Card.Header className="bg-white border-0 pt-3">
                <h2 className="h6 fw-bold mb-0">
                  <i className="fa-solid fa-clock-rotate-left me-2 text-primary" />
                  Operaciones del portafolio
                </h2>
              </Card.Header>
              <Card.Body className="pt-2">
                {transactions.length === 0 ? (
                  <EmptyState
                    icon="fa-right-left"
                    title="Sin operaciones"
                    text="Las operaciones de este portafolio se listarán aquí."
                  />
                ) : (
                  <Table responsive hover className="is-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Símbolo</th>
                        <th className="text-end">Cantidad</th>
                        <th className="text-end">Total</th>
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
                          <td className="text-end">
                            {toNumber(transaction.quantity).toFixed(4)}
                          </td>
                          <td className="text-end fw-semibold">
                            {formatMoney(transaction.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5}>
            <Card className="is-card is-sticky">
              <Card.Body>
                <h2 className="h6 fw-bold mb-3">
                  <i className="fa-solid fa-circle-info me-2 text-primary" />
                  Resumen de la operación
                </h2>

                {selectedInstrument ? (
                  <>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <span className="is-symbol me-2">{selectedInstrument.symbol}</span>
                        <strong>{selectedInstrument.name}</strong>
                        <div className="text-muted small">
                          {selectedInstrument.type === "ETF" ? "ETF" : "Acción"} ·{" "}
                          {selectedInstrument.exchange || "Simulado"}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">
                          {formatMoney(selectedInstrument.currentPrice)}
                        </div>
                        <span
                          className={`small fw-semibold ${percentClass(
                            selectedInstrument.dailyChangePercent,
                          )}`}
                        >
                          {formatPercent(selectedInstrument.dailyChangePercent)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted">Selecciona un instrumento.</p>
                )}

                <div className="is-divider" />

                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Portafolio</span>
                  <strong className="text-end">
                    {selectedPortfolio?.name || "—"}
                  </strong>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Tipo de operación</span>
                  <span
                    className={`is-soft-badge ${
                      form.type === "BUY" ? "is-buy" : "is-sell"
                    }`}
                  >
                    {form.type === "BUY" ? "Compra" : "Venta"}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Cantidad</span>
                  <strong>{toNumber(form.quantity).toFixed(4)}</strong>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Precio unitario</span>
                  <strong>{formatMoney(selectedInstrument?.currentPrice)}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-top mt-2 pt-2">
                  <span className="text-muted small">Total estimado</span>
                  <strong className="fs-5">{formatMoney(estimatedTotal)}</strong>
                </div>

                <div className="is-divider" />

                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Saldo disponible</span>
                  <strong>{formatMoney(availableCash)}</strong>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">
                    Unidades de {form.symbol || "instrumento"}
                  </span>
                  <strong>{maxSellQuantity.toFixed(4)}</strong>
                </div>

                <Alert variant="light" className="border small mt-3 mb-0">
                  <i className="fa-solid fa-shield-halved me-1 text-primary" />
                  Operación simulada: no se involucra dinero real. El precio se toma
                  del último cierre disponible.
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
}

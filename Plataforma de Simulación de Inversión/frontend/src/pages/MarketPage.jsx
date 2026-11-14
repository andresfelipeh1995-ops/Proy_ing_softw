import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import LineChart from "../components/LineChart";
import { getHistory, listInstruments } from "../services/marketService";
import {
  formatDate,
  formatMoney,
  formatPercent,
  percentClass,
  toNumber,
} from "../utils/format";

function mapHistory(points) {
  return (points ?? []).map((point) => ({
    date: point.date,
    value: point.close,
  }));
}

export default function MarketPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState(searchParams.get("symbol") || "");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [days, setDays] = useState(180);

  useEffect(() => {
    let active = true;

    listInstruments()
      .then((response) => {
        if (!active) return;
        const list = response.data ?? [];
        setInstruments(list);
        setSelectedSymbol((current) =>
          list.some((instrument) => instrument.symbol === current)
            ? current
            : (list[0]?.symbol ?? ""),
        );
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedSymbol) return;

    let active = true;
    setHistoryLoading(true);

    getHistory(selectedSymbol, days)
      .then((response) => {
        if (active) setHistory(mapHistory(response.data));
      })
      .catch((err) => {
        if (active) {
          setHistory([]);
          setError(err.message);
        }
      })
      .finally(() => active && setHistoryLoading(false));

    return () => {
      active = false;
    };
  }, [selectedSymbol, days]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return instruments.filter((instrument) => {
      const matchesType = !type || instrument.type === type;
      const matchesTerm =
        !term ||
        instrument.symbol?.toLowerCase().includes(term) ||
        instrument.name?.toLowerCase().includes(term);
      return matchesType && matchesTerm;
    });
  }, [instruments, type, query]);

  const selected = instruments.find(
    (instrument) => instrument.symbol === selectedSymbol,
  );

  function selectInstrument(symbol) {
    setSelectedSymbol(symbol);
    setSearchParams(symbol ? { symbol } : {});
  }

  if (loading) {
    return <LoadingState label="Consultando instrumentos del mercado..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Mercado"
        title="Instrumentos disponibles"
        subtitle="Consulta precios, evolución histórica y opera sobre tu portafolio simulado."
        actions={
          <Button as={Link} to="/operar" variant="primary">
            <i className="fa-solid fa-right-left me-1" />
            Ir a operar
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col xl={7}>
          <Card className="is-card">
            <Card.Header className="bg-white border-0 pt-3">
              <Row className="g-2 align-items-center">
                <Col sm={7}>
                  <Form.Control
                    type="search"
                    placeholder="Buscar por símbolo o nombre..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </Col>
                <Col sm={5}>
                  <Form.Select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                  >
                    <option value="">Todos los tipos</option>
                    <option value="STOCK">Acciones</option>
                    <option value="ETF">ETFs</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="pt-2">
              {filtered.length === 0 ? (
                <EmptyState
                  icon="fa-magnifying-glass"
                  title="Sin resultados"
                  text="Ajusta el filtro o el término de búsqueda."
                />
              ) : (
                <Table responsive hover className="is-table">
                  <thead>
                    <tr>
                      <th>Símbolo</th>
                      <th>Nombre</th>
                      <th className="text-end">Precio</th>
                      <th className="text-end">Cambio</th>
                      <th className="text-end" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((instrument) => (
                      <tr
                        key={instrument.symbol}
                        role="button"
                        className={instrument.symbol === selectedSymbol ? "table-active" : ""}
                        onClick={() => selectInstrument(instrument.symbol)}
                      >
                        <td>
                          <span className="is-symbol">{instrument.symbol}</span>
                        </td>
                        <td>
                          <div className="fw-semibold">{instrument.name}</div>
                          <small className="text-muted">
                            {instrument.type === "ETF" ? "ETF" : "Acción"} ·{" "}
                            {instrument.exchange || "—"}
                          </small>
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
                        <td className="text-end">
                          <Button
                            as={Link}
                            to={`/analisis?symbol=${instrument.symbol}`}
                            size="sm"
                            variant="outline-secondary"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <i className="fa-solid fa-chart-area" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xl={5}>
          <Card className="is-card is-sticky">
            <Card.Body>
              {!selected ? (
                <EmptyState
                  icon="fa-hand-pointer"
                  title="Selecciona un instrumento"
                  text="Haz clic en una fila para ver su detalle y evolución."
                />
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <div>
                      <span className="is-symbol me-2">{selected.symbol}</span>
                      <Badge bg="light" text="dark" className="border">
                        {selected.type}
                      </Badge>
                      <h2 className="h5 fw-bold mt-2 mb-0">{selected.name}</h2>
                      <p className="text-muted small mb-0">
                        {selected.exchange || "Mercado simulado"} ·{" "}
                        {selected.currency || "USD"}
                      </p>
                    </div>
                    <div className="text-end">
                      <div className="h5 fw-bold mb-0">
                        {formatMoney(selected.currentPrice)}
                      </div>
                      <span className={`small fw-semibold ${percentClass(selected.dailyChangePercent)}`}>
                        {formatPercent(selected.dailyChangePercent)}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted">
                      Histórico de cierre
                    </span>
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
                  </div>

                  {historyLoading ? (
                    <LoadingState label="Cargando histórico..." />
                  ) : (
                    <LineChart
                      data={history}
                      color={toNumber(selected.dailyChangePercent) >= 0 ? "#0f766e" : "#dc2626"}
                    />
                  )}

                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <Button
                      as={Link}
                      to={`/operar?symbol=${selected.symbol}&type=BUY`}
                      size="sm"
                      variant="primary"
                    >
                      <i className="fa-solid fa-cart-plus me-1" />
                      Comprar
                    </Button>
                    <Button
                      as={Link}
                      to={`/operar?symbol=${selected.symbol}&type=SELL`}
                      size="sm"
                      variant="outline-danger"
                    >
                      <i className="fa-solid fa-money-bill-transfer me-1" />
                      Vender
                    </Button>
                    <Button
                      as={Link}
                      to={`/analisis?symbol=${selected.symbol}`}
                      size="sm"
                      variant="outline-secondary"
                    >
                      <i className="fa-solid fa-chart-area me-1" />
                      Análisis
                    </Button>
                  </div>

                  <div className="is-divider" />
                  <div className="d-flex justify-content-between small text-muted">
                    <span>Cierre anterior</span>
                    <span className="fw-semibold text-dark">
                      {formatMoney(selected.previousClose)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mt-1">
                    <span>Última actualización</span>
                    <span className="fw-semibold text-dark">
                      {formatDate(selected.lastUpdated)}
                    </span>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

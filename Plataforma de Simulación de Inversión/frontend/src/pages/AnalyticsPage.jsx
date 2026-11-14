import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Nav,
  Row,
  Table,
} from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import LineChart from "../components/LineChart";
import {
  getInstrumentAnalytics,
  getPortfolioAnalytics,
} from "../services/analyticsService";
import { listPortfolios } from "../services/portfolioService";
import { listInstruments } from "../services/marketService";
import {
  formatDate,
  formatMoney,
  formatPercent,
  percentClass,
  toNumber,
} from "../utils/format";

const RANGES = [30, 90, 180, 365];

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSymbol = searchParams.get("symbol") || "";
  const [mode, setMode] = useState(initialSymbol ? "instrument" : "portfolio");
  const [portfolios, setPortfolios] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [portfolioId, setPortfolioId] = useState("");
  const [symbol, setSymbol] = useState(initialSymbol);
  const [days, setDays] = useState(180);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.allSettled([listPortfolios(), listInstruments()]).then((results) => {
      if (!active) return;

      if (results[0].status === "fulfilled") {
        const list = results[0].value.data ?? [];
        setPortfolios(list);
        if (list.length > 0) {
          setPortfolioId(String(list[0].id));
        }
      }

      if (results[1].status === "fulfilled") {
        const list = results[1].value.data ?? [];
        setInstruments(list);
        setSymbol((current) => current || list[0]?.symbol || "");
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const hasSelection = mode === "portfolio" ? Boolean(portfolioId) : Boolean(symbol);
    if (!hasSelection) {
      setAnalytics(null);
      return;
    }

    let active = true;
    setLoadingData(true);
    setError("");

    const request =
      mode === "portfolio"
        ? getPortfolioAnalytics(portfolioId, days)
        : getInstrumentAnalytics(symbol, days);

    request
      .then((response) => active && setAnalytics(response.data))
      .catch((err) => {
        if (active) {
          setAnalytics(null);
          setError(err.message);
        }
      })
      .finally(() => active && setLoadingData(false));

    return () => {
      active = false;
    };
  }, [mode, portfolioId, symbol, days, loading, reloadToken]);

  const chartData = useMemo(
    () =>
      (analytics?.series ?? []).map((point) => ({
        date: point.date,
        value: point.value,
      })),
    [analytics],
  );

  function switchMode(nextMode) {
    setMode(nextMode);
    setAnalytics(null);
    setError("");
    if (nextMode === "portfolio" && searchParams.get("symbol")) {
      setSearchParams({});
    }
  }

  function handleSelectionChange(event) {
    const { value } = event.target;
    if (mode === "portfolio") {
      setPortfolioId(value);
    } else {
      setSymbol(value);
      setSearchParams(value ? { symbol: value } : {});
    }
  }

  if (loading) {
    return <LoadingState label="Cargando datos de análisis..." />;
  }

  const isPortfolio = mode === "portfolio";
  const title = isPortfolio ? analytics?.name : analytics?.symbol;

  return (
    <>
      <PageHeader
        eyebrow="Análisis"
        title="Rendimiento y riesgo"
        subtitle="Revisa la evolución, volatilidad y máxima caída de tus portafolios o de un instrumento."
      />

      <Card className="is-card mb-4">
        <Card.Body>
          <Nav
            variant="pills"
            className="is-tabs mb-3"
            activeKey={mode}
            onSelect={(key) => switchMode(key)}
          >
            <Nav.Item>
              <Nav.Link eventKey="portfolio">
                <i className="fa-solid fa-folder-open me-1" />
                Portafolio
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="instrument">
                <i className="fa-solid fa-arrow-trend-up me-1" />
                Instrumento
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Row className="g-3 align-items-end">
            <Col md={6} lg={5}>
              <Form.Group controlId="analyticsSelection">
                <Form.Label>{isPortfolio ? "Portafolio" : "Instrumento"}</Form.Label>
                <Form.Select
                  value={isPortfolio ? portfolioId : symbol}
                  onChange={handleSelectionChange}
                >
                  {isPortfolio
                    ? portfolios.map((portfolio) => (
                        <option key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </option>
                      ))
                    : instruments.map((instrument) => (
                        <option key={instrument.symbol} value={instrument.symbol}>
                          {instrument.symbol} · {instrument.name}
                        </option>
                      ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6} lg={4}>
              <Form.Group controlId="analyticsDays">
                <Form.Label>Periodo</Form.Label>
                <Form.Select
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                >
                  {RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range} días
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col lg={3} className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => setReloadToken((current) => current + 1)}
              >
                <i className="fa-solid fa-rotate me-1" />
                Actualizar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {loadingData ? (
        <LoadingState label="Calculando métricas..." />
      ) : !analytics ? (
        <Card className="is-card">
          <Card.Body>
            <EmptyState
              icon="fa-chart-area"
              title="Sin datos para analizar"
              text={
                isPortfolio
                  ? "Selecciona un portafolio con historial de operaciones."
                  : "Selecciona un instrumento con histórico de precios."
              }
            />
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col sm={6} xl={4}>
              <Card className="is-stat-card is-tone-info h-100 border-0">
                <Card.Body>
                  <p className="is-stat-label mb-1">
                    {isPortfolio ? "Valor" : "Precio"}
                  </p>
                  <h3 className="is-stat-value mb-1">
                    {formatMoney(isPortfolio ? analytics.currentValue : analytics.currentPrice)}
                  </h3>
                  <p className="is-stat-hint mb-0">
                    Inicial:{" "}
                    {formatMoney(isPortfolio ? analytics.initialValue : analytics.initialPrice)}
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={4}>
              <Card
                className={`is-stat-card h-100 border-0 ${
                  toNumber(analytics.totalReturnPercent) >= 0
                    ? "is-tone-success"
                    : "is-tone-danger"
                }`}
              >
                <Card.Body>
                  <p className="is-stat-label mb-1">Retorno total</p>
                  <h3 className="is-stat-value mb-1">
                    {formatPercent(analytics.totalReturnPercent)}
                  </h3>
                  <p className="is-stat-hint mb-0">
                    {formatDate(analytics.startDate)} → {formatDate(analytics.endDate)}
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={4}>
              <Card className="is-stat-card is-tone-warning h-100 border-0">
                <Card.Body>
                  <p className="is-stat-label mb-1">Ratio de Sharpe</p>
                  <h3 className="is-stat-value mb-1">
                    {toNumber(analytics.sharpeRatio).toFixed(2)}
                  </h3>
                  <p className="is-stat-hint mb-0">
                    Volatilidad:{" "}
                    {formatPercent(analytics.annualizedVolatilityPercent, {
                      signed: false,
                    })}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="is-card mb-4">
            <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
              <h2 className="h6 fw-bold mb-0">
                <i className="fa-solid fa-chart-area me-2 text-primary" />
                {title} · últimos {days} días
              </h2>
              <span
                className={`small fw-semibold ${percentClass(
                  analytics.totalReturnPercent,
                )}`}
              >
                {formatPercent(analytics.totalReturnPercent)}
              </span>
            </Card.Header>
            <Card.Body>
              <LineChart
                data={chartData}
                color={toNumber(analytics.totalReturnPercent) >= 0 ? "#0f766e" : "#dc2626"}
              />
            </Card.Body>
          </Card>

          <Row className="g-4">
            <Col xl={7}>
              <Card className="is-card h-100">
                <Card.Header className="bg-white border-0 pt-3">
                  <h2 className="h6 fw-bold mb-0">
                    <i className="fa-solid fa-gauge-high me-2 text-primary" />
                    Métricas de riesgo
                  </h2>
                </Card.Header>
                <Card.Body>
                  <Table responsive className="is-table mb-0">
                    <tbody>
                      <tr>
                        <td>Volatilidad anualizada</td>
                        <td className="text-end fw-semibold">
                          {formatPercent(analytics.annualizedVolatilityPercent, {
                            signed: false,
                          })}
                        </td>
                      </tr>
                      <tr>
                        <td>Máxima caída (drawdown)</td>
                        <td className="text-end fw-semibold text-danger">
                          {formatPercent(analytics.maxDrawdownPercent, {
                            signed: false,
                          })}
                        </td>
                      </tr>
                      <tr>
                        <td>Mejor día</td>
                        <td className="text-end fw-semibold text-success">
                          {formatPercent(analytics.bestDayPercent)}
                        </td>
                      </tr>
                      <tr>
                        <td>Peor día</td>
                        <td className="text-end fw-semibold text-danger">
                          {formatPercent(analytics.worstDayPercent)}
                        </td>
                      </tr>
                      <tr>
                        <td>Ratio de Sharpe</td>
                        <td className="text-end fw-semibold">
                          {toNumber(analytics.sharpeRatio).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td>Periodo analizado</td>
                        <td className="text-end fw-semibold">
                          {formatDate(analytics.startDate)} – {formatDate(analytics.endDate)}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={5}>
              <Card className="is-card h-100">
                <Card.Header className="bg-white border-0 pt-3">
                  <h2 className="h6 fw-bold mb-0">
                    <i className="fa-solid fa-circle-info me-2 text-primary" />
                    Cómo leer estas métricas
                  </h2>
                </Card.Header>
                <Card.Body className="small text-muted">
                  <p>
                    <strong className="text-dark">Volatilidad:</strong> qué tanto
                    oscila el valor. Más volatilidad implica mayor incertidumbre.
                  </p>
                  <p>
                    <strong className="text-dark">Máxima caída:</strong> la peor
                    pérdida desde un máximo previo en el periodo.
                  </p>
                  <p>
                    <strong className="text-dark">Sharpe:</strong> retorno obtenido
                    por unidad de riesgo. Valores más altos sugieren mejor relación
                    riesgo-retorno.
                  </p>
                  <p className="mb-0">
                    <strong className="text-dark">Mejor / peor día:</strong> los
                    extremos diarios del periodo seleccionado.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}

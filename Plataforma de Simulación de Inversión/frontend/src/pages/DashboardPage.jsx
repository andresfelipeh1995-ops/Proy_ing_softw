import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { getMyProfile } from "../services/userService";
import { listPortfolios } from "../services/portfolioService";
import { listInstruments } from "../services/marketService";
import { listTransactions } from "../services/tradingService";
import { listSavings } from "../services/savingsService";
import {
  formatDate,
  formatMoney,
  formatPercent,
  percentClass,
  toNumber,
} from "../utils/format";

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const results = await Promise.allSettled([
        getMyProfile(),
        listPortfolios(),
        listInstruments(),
        listTransactions(),
        listSavings(),
      ]);

      if (!active) return;

      const [profileResult, portfoliosResult, instrumentsResult, transactionsResult, savingsResult] =
        results;

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value.data);
      } else {
        setError(profileResult.reason.message);
      }

      if (portfoliosResult.status === "fulfilled") {
        setPortfolios(portfoliosResult.value.data ?? []);
      }
      if (instrumentsResult.status === "fulfilled") {
        setInstruments(instrumentsResult.value.data ?? []);
      }
      if (transactionsResult.status === "fulfilled") {
        setTransactions(transactionsResult.value.data ?? []);
      }
      if (savingsResult.status === "fulfilled") {
        setSavings(savingsResult.value.data ?? []);
      }

      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
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
    const positions = portfolios.reduce(
      (sum, portfolio) => sum + toNumber(portfolio.summary?.positionsCount),
      0,
    );
    const savingsTotal = savings.reduce(
      (sum, account) => sum + toNumber(account.principal),
      0,
    );
    const cash = toNumber(profile?.availableBalance);
    const invested = toNumber(profile?.initialBalance) || 1;

    return {
      marketValue,
      cost,
      pnl,
      pnlPercent: cost > 0 ? (pnl / cost) * 100 : 0,
      positions,
      savingsTotal,
      cash,
      totalValue: cash + marketValue + savingsTotal,
      growthPercent: ((cash + marketValue + savingsTotal - invested) / invested) * 100,
    };
  }, [portfolios, savings, profile]);

  const movers = useMemo(
    () =>
      [...instruments]
        .filter((instrument) => instrument.currentPrice)
        .sort(
          (a, b) =>
            Math.abs(toNumber(b.dailyChangePercent)) -
            Math.abs(toNumber(a.dailyChangePercent)),
        )
        .slice(0, 6),
    [instruments],
  );

  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return <LoadingState label="Preparando tu panel de inversión..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Panel general"
        title={`Hola${profile?.firstName ? `, ${profile.firstName}` : ""}`}
        subtitle="Este es el resumen de tu simulador. Todo el dinero es ficticio."
        actions={
          <>
            <Button as={Link} to="/mercado" variant="outline-primary">
              <i className="fa-solid fa-arrow-trend-up me-1" />
              Explorar mercado
            </Button>
            <Button as={Link} to="/portafolios" variant="primary">
              <i className="fa-solid fa-plus me-1" />
              Nuevo portafolio
            </Button>
          </>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="is-hero mb-4">
        <Card.Body className="p-4 p-lg-5 position-relative">
          <Row className="align-items-center g-4 position-relative">
            <Col lg={7}>
              <span className="is-hero-label">Patrimonio simulado</span>
              <div className="is-hero-value mt-1">{formatMoney(totals.totalValue)}</div>
              <div className="d-flex flex-wrap gap-3 mt-2 small text-white-50">
                <span>
                  <i className="fa-solid fa-wallet me-1" />
                  Efectivo: {formatMoney(totals.cash)}
                </span>
                <span>
                  <i className="fa-solid fa-chart-pie me-1" />
                  Invertido: {formatMoney(totals.marketValue)}
                </span>
                <span>
                  <i className="fa-solid fa-piggy-bank me-1" />
                  Ahorros: {formatMoney(totals.savingsTotal)}
                </span>
              </div>
              <div className="mt-3">
                <span
                  className={`badge ${
                    totals.growthPercent >= 0 ? "text-bg-success" : "text-bg-danger"
                  }`}
                >
                  <i className="fa-solid fa-arrow-trend-up me-1" />
                  {formatPercent(totals.growthPercent)} frente al saldo inicial
                </span>
              </div>
            </Col>
            <Col lg={5}>
              <div className="bg-white bg-opacity-10 border border-white border-opacity-10 rounded-3 p-3">
                <p className="small text-white-50 mb-2">Accesos rápidos</p>
                <div className="d-grid gap-2">
                  <Link className="btn btn-light btn-sm text-start" to="/operar">
                    <i className="fa-solid fa-right-left me-2 text-primary" />
                    Comprar o vender instrumentos
                  </Link>
                  <Link className="btn btn-outline-light btn-sm text-start" to="/ahorros">
                    <i className="fa-solid fa-piggy-bank me-2" />
                    Simular interés compuesto
                  </Link>
                  <Link className="btn btn-outline-light btn-sm text-start" to="/escenarios">
                    <i className="fa-solid fa-shield-halved me-2" />
                    Probar un escenario de crisis
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Saldo disponible"
            value={formatMoney(profile?.availableBalance)}
            hint={`Inicial: ${formatMoney(profile?.initialBalance)}`}
            icon="fa-wallet"
            tone="info"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Valor de portafolios"
            value={formatMoney(totals.marketValue)}
            hint={`Costo: ${formatMoney(totals.cost)}`}
            icon="fa-chart-pie"
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
            title="Posiciones activas"
            value={totals.positions}
            hint={`${portfolios.length} portafolio(s) · ${savings.length} ahorro(s)`}
            icon="fa-layer-group"
            tone="warning"
          />
        </Col>
      </Row>

      <Row className="g-4">
        <Col xl={7}>
          <Card className="is-card h-100">
            <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
              <h2 className="h6 fw-bold mb-0">
                <i className="fa-solid fa-arrow-trend-up me-2 text-primary" />
                Movimientos del mercado
              </h2>
              <Button as={Link} to="/mercado" size="sm" variant="link" className="p-0">
                Ver todo
              </Button>
            </Card.Header>
            <Card.Body className="pt-2">
              {movers.length === 0 ? (
                <EmptyState
                  icon="fa-chart-line"
                  title="Sin cotizaciones"
                  text="Ejecuta una ingesta desde el panel administrador o consulta el mercado."
                />
              ) : (
                <Table responsive className="is-table">
                  <thead>
                    <tr>
                      <th>Instrumento</th>
                      <th className="text-end">Precio</th>
                      <th className="text-end">Cambio</th>
                      <th className="text-end">Actualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movers.map((instrument) => (
                      <tr key={instrument.symbol}>
                        <td>
                          <span className="is-symbol me-2">{instrument.symbol}</span>
                          <span className="text-muted small">{instrument.name}</span>
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
                        <td className="text-end text-muted small">
                          {instrument.lastUpdated
                            ? formatDate(instrument.lastUpdated)
                            : "—"}
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
          <Card className="is-card h-100">
            <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
              <h2 className="h6 fw-bold mb-0">
                <i className="fa-solid fa-clock-rotate-left me-2 text-primary" />
                Operaciones recientes
              </h2>
              <Button as={Link} to="/operar" size="sm" variant="link" className="p-0">
                Historial
              </Button>
            </Card.Header>
            <Card.Body className="pt-2">
              {recentTransactions.length === 0 ? (
                <EmptyState
                  icon="fa-right-left"
                  title="Aún no has operado"
                  text="Realiza tu primera compra simulada desde la sección Operar."
                  action={
                    <Button as={Link} to="/operar" size="sm">
                      Ir a operar
                    </Button>
                  }
                />
              ) : (
                <div className="d-grid gap-2">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="d-flex justify-content-between align-items-center border-bottom pb-2"
                    >
                      <div>
                        <span
                          className={`is-soft-badge ${
                            transaction.type === "BUY" ? "is-buy" : "is-sell"
                          } me-2`}
                        >
                          {transaction.type === "BUY" ? "Compra" : "Venta"}
                        </span>
                        <strong>{transaction.symbol}</strong>
                        <div className="text-muted small">
                          {transaction.quantity} unidades · {formatMoney(transaction.price)}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-semibold">{formatMoney(transaction.total)}</div>
                        <small className="text-muted">
                          {formatDate(transaction.executedAt)}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

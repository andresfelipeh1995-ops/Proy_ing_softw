import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Table,
} from "react-bootstrap";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../auth/AuthContext";
import { deactivateUser, listUsers } from "../services/userService";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../utils/alerts";
import { formatDate, formatMoney, toNumber } from "../utils/format";

export default function AdminUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    try {
      const response = await listUsers();
      setUsers(response.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesTerm =
        !term ||
        user.email?.toLowerCase().includes(term) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term);
      const matchesRole = !role || user.role === role;
      const matchesStatus =
        !status ||
        (status === "active" ? user.active : !user.active);
      return matchesTerm && matchesRole && matchesStatus;
    });
  }, [users, query, role, status]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.active).length,
      admins: users.filter((user) => user.role === "ADMIN").length,
      balance: users.reduce(
        (sum, user) => sum + toNumber(user.availableBalance),
        0,
      ),
    }),
    [users],
  );

  async function handleDeactivate(user) {
    const confirmed = await confirmAction({
      title: "Desactivar usuario",
      html: `Se desactivará la cuenta de <strong>${user.firstName} ${user.lastName}</strong> (${user.email}).`,
      confirmButtonText: "Desactivar",
    });

    if (!confirmed) return;

    try {
      const response = await deactivateUser(user.id);
      notifySuccess(response.message);
      await load();
    } catch (err) {
      notifyError(err.message);
    }
  }

  if (loading) {
    return <LoadingState label="Cargando usuarios..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Usuarios registrados"
        subtitle="Consulta las cuentas de la plataforma y desactiva usuarios cuando sea necesario."
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard title="Usuarios" value={stats.total} icon="fa-users" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Activos"
            value={stats.active}
            hint={`${stats.total - stats.active} inactivo(s)`}
            icon="fa-user-check"
            tone="success"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Administradores"
            value={stats.admins}
            icon="fa-user-shield"
            tone="warning"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Saldo en plataforma"
            value={formatMoney(stats.balance)}
            hint="Suma de saldos disponibles"
            icon="fa-wallet"
            tone="info"
          />
        </Col>
      </Row>

      <Card className="is-card">
        <Card.Header className="bg-white border-0 pt-3">
          <Row className="g-2">
            <Col md={6}>
              <Form.Control
                type="search"
                placeholder="Buscar por nombre o email..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="">Todos los roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="CLIENTE">Cliente</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="pt-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon="fa-users"
              title="Sin usuarios"
              text="No hay cuentas que coincidan con los filtros seleccionados."
            />
          ) : (
            <Table responsive hover className="is-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th className="text-end">Saldo disponible</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th className="text-end" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const isSelf = user.email === session?.email;
                  return (
                    <tr key={user.id}>
                      <td className="text-muted small">{user.id}</td>
                      <td className="fw-semibold">
                        {user.firstName} {user.lastName}
                        {isSelf && (
                          <Badge bg="light" text="dark" className="border ms-2">
                            Tú
                          </Badge>
                        )}
                      </td>
                      <td className="text-muted">{user.email}</td>
                      <td>
                        <Badge bg={user.role === "ADMIN" ? "warning" : "info"} text="dark">
                          {user.role === "ADMIN" ? "Admin" : "Cliente"}
                        </Badge>
                      </td>
                      <td className="text-end fw-semibold">
                        {formatMoney(user.availableBalance)}
                      </td>
                      <td>
                        <span
                          className={`is-soft-badge ${
                            user.active ? "" : "is-muted"
                          }`}
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="text-muted small">{formatDate(user.createdAt)}</td>
                      <td className="text-end">
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={!user.active || isSelf}
                          title={
                            isSelf
                              ? "No puedes desactivar tu propia cuenta desde aquí"
                              : "Desactivar usuario"
                          }
                          onClick={() => handleDeactivate(user)}
                        >
                          <i className="fa-solid fa-user-slash" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  );
}

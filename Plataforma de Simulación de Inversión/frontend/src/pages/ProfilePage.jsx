import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Tab,
  Tabs,
} from "react-bootstrap";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../auth/AuthContext";
import { useSearchParams } from "react-router-dom";
import {
  addBalance,
  deactivateMyAccount,
  getMyProfile,
  updateMyPassword,
  updateMyProfile,
} from "../services/userService";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../utils/alerts";
import { formatDate, formatMoney } from "../utils/format";

export default function ProfilePage() {
  const { refreshSession, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceErrors, setBalanceErrors] = useState({});
  const [addingBalance, setAddingBalance] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let active = true;

    getMyProfile()
      .then((response) => {
        if (!active) return;
        const data = response.data;
        setProfile(data);
        setProfileForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email ?? "",
        });
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileErrors({});
    setSavingProfile(true);

    try {
      const response = await updateMyProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
      });

      setProfile({ ...response.data, token: undefined });
      refreshSession(response.data.token);
      notifySuccess(response.message);
    } catch (err) {
      if (err.data && typeof err.data === "object") {
        setProfileErrors(err.data);
      } else {
        notifyError(err.message);
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordErrors({});

    if (passwordForm.newPassword.length < 8) {
      setPasswordErrors({
        newPassword: "La nueva contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: "Las contraseñas no coinciden." });
      return;
    }

    setSavingPassword(true);

    try {
      const response = await updateMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      notifySuccess(response.message);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      if (err.data && typeof err.data === "object") {
        setPasswordErrors(err.data);
      } else {
        notifyError(err.message);
      }
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleBalanceSubmit(event) {
    event.preventDefault();
    setBalanceErrors({});

    const amount = Number(balanceAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setBalanceErrors({ amount: "Ingresa un monto mayor que cero." });
      return;
    }

    setAddingBalance(true);

    try {
      const response = await addBalance(amount);
      setProfile(response.data);
      setBalanceAmount("");
      notifySuccess(response.message);
    } catch (err) {
      if (err.data && typeof err.data === "object") {
        setBalanceErrors(err.data);
      } else {
        notifyError(err.message);
      }
    } finally {
      setAddingBalance(false);
    }
  }

  async function handleDeactivate() {
    const confirmed = await confirmAction({
      title: "Desactivar mi cuenta",
      html: "Tu cuenta dejará de estar activa y se cerrará la sesión. Esta acción no se puede deshacer desde la aplicación.",
      confirmButtonText: "Desactivar cuenta",
    });

    if (!confirmed) return;

    try {
      await deactivateMyAccount();
      await notifySuccess("Tu cuenta ha sido desactivada.");
      logout();
    } catch (err) {
      notifyError(err.message);
    }
  }

  if (loading) {
    return <LoadingState label="Cargando tu perfil..." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Perfil"
        title={`${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() || "Mi cuenta"}
        subtitle="Administra tus datos personales, contraseña y el estado de tu cuenta."
        actions={
          <Badge bg={profile?.active ? "success" : "secondary"}>
            {profile?.active ? "Cuenta activa" : "Cuenta inactiva"}
          </Badge>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Saldo disponible"
            value={formatMoney(profile?.availableBalance)}
            hint="Efectivo para operar"
            icon="fa-wallet"
            tone="info"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Saldo inicial"
            value={formatMoney(profile?.initialBalance)}
            hint="Asignado al registrarte"
            icon="fa-flag-checkered"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Rol"
            value={profile?.role === "ADMIN" ? "Administrador" : "Cliente"}
            hint={
              profile?.role === "ADMIN"
                ? "Acceso al panel de administración"
                : "Acceso a módulos de simulación"
            }
            icon="fa-user-shield"
            tone="warning"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Miembro desde"
            value={formatDate(profile?.createdAt)}
            hint={profile?.email}
            icon="fa-calendar-days"
          />
        </Col>
      </Row>

      <Card className="is-card">
        <Card.Body className="p-4">
          <Tabs
            defaultActiveKey={searchParams.get("tab") === "saldo" ? "saldo" : "datos"}
            className="is-tabs mb-4"
          >
            <Tab eventKey="datos" title="Datos personales">
              <Form noValidate onSubmit={handleProfileSubmit} className="mt-2">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="profileFirstName">
                      <Form.Label>Nombres</Form.Label>
                      <Form.Control
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={handleProfileChange}
                        isInvalid={Boolean(profileErrors.firstName)}
                        required
                      />
                      {profileErrors.firstName && (
                        <div className="invalid-feedback d-block">
                          {profileErrors.firstName}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="profileLastName">
                      <Form.Label>Apellidos</Form.Label>
                      <Form.Control
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={handleProfileChange}
                        isInvalid={Boolean(profileErrors.lastName)}
                        required
                      />
                      {profileErrors.lastName && (
                        <div className="invalid-feedback d-block">
                          {profileErrors.lastName}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group controlId="profileEmail">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        isInvalid={Boolean(profileErrors.email)}
                        required
                      />
                      {profileErrors.email && (
                        <div className="invalid-feedback d-block">
                          {profileErrors.email}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  type="submit"
                  variant="primary"
                  className="mt-4"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk me-1" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="saldo" title="Agregar saldo">
              <Form noValidate onSubmit={handleBalanceSubmit} className="mt-2">
                <p className="text-muted">
                  Agrega saldo ficticio a tu cuenta para seguir simulando
                  operaciones. Saldo disponible actual:{" "}
                  <strong>{formatMoney(profile?.availableBalance)}</strong>.
                </p>
                <Row className="g-3 align-items-end">
                  <Col md={6}>
                    <Form.Group controlId="balanceAmount">
                      <Form.Label>Monto a agregar (USD)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={balanceAmount}
                        onChange={(event) => setBalanceAmount(event.target.value)}
                        isInvalid={Boolean(balanceErrors.amount)}
                        required
                      />
                      {balanceErrors.amount && (
                        <div className="invalid-feedback d-block">
                          {balanceErrors.amount}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex flex-wrap gap-2">
                      {[1000, 5000, 10000].map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => setBalanceAmount(String(amount))}
                        >
                          +{formatMoney(amount)}
                        </Button>
                      ))}
                    </div>
                  </Col>
                </Row>

                <Button
                  type="submit"
                  variant="success"
                  className="mt-4"
                  disabled={addingBalance}
                >
                  {addingBalance ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-circle-plus me-1" />
                      Agregar saldo
                    </>
                  )}
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="seguridad" title="Seguridad">
              <Form noValidate onSubmit={handlePasswordSubmit} className="mt-2">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="currentPassword">
                      <Form.Label>Contraseña actual</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        autoComplete="current-password"
                        isInvalid={Boolean(passwordErrors.currentPassword)}
                        required
                      />
                      {passwordErrors.currentPassword && (
                        <div className="invalid-feedback d-block">
                          {passwordErrors.currentPassword}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6} />
                  <Col md={6}>
                    <Form.Group controlId="newPassword">
                      <Form.Label>Nueva contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        isInvalid={Boolean(passwordErrors.newPassword)}
                        required
                      />
                      {passwordErrors.newPassword && (
                        <div className="invalid-feedback d-block">
                          {passwordErrors.newPassword}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="confirmPassword">
                      <Form.Label>Confirmar nueva contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        isInvalid={Boolean(passwordErrors.confirmPassword)}
                        required
                      />
                      {passwordErrors.confirmPassword && (
                        <div className="invalid-feedback d-block">
                          {passwordErrors.confirmPassword}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  type="submit"
                  variant="primary"
                  className="mt-4"
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-key me-1" />
                      Cambiar contraseña
                    </>
                  )}
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="cuenta" title="Estado de la cuenta">
              <div className="mt-2">
                <Alert variant="warning" className="mb-3">
                  <strong>Zona de riesgo.</strong> Desactivar tu cuenta impide volver
                  a iniciar sesión con estas credenciales.
                </Alert>
                <p className="text-muted">
                  Tu saldo simulado actual es{" "}
                  <strong>{formatMoney(profile?.availableBalance)}</strong>. Los datos
                  de portafolios, ahorros y escenarios quedarán asociados a una cuenta
                  inactiva.
                </p>
                <Button variant="outline-danger" onClick={handleDeactivate}>
                  <i className="fa-solid fa-user-slash me-1" />
                  Desactivar mi cuenta
                </Button>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
}

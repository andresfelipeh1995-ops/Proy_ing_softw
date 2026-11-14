import { useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { registerUser } from "../services/userService";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (form.password.length < 8) {
      setFieldErrors({ password: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Las contraseñas no coinciden." });
      return;
    }

    setLoading(true);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    try {
      const response = await registerUser(payload);
      const authResult = await login({
        email: payload.email,
        password: payload.password,
      });

      setLoading(false);

      if (authResult.success) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setError(
        response.message ||
          "La cuenta fue creada, pero no fue posible iniciar sesión.",
      );
    } catch (err) {
      setLoading(false);
      if (err.data && typeof err.data === "object") {
        setFieldErrors(err.data);
      } else {
        setError(err.message);
      }
    }
  }

  function fieldProps(name) {
    return {
      name,
      value: form[name],
      onChange: handleChange,
      isInvalid: Boolean(fieldErrors[name]),
    };
  }

  return (
    <div className="is-auth">
      <aside className="is-auth-side">
        <div className="is-auth-brand">
          <span className="is-brand-mark">
            <i className="fa-solid fa-chart-line" />
          </span>
          InvestSim
        </div>

        <div>
          <span className="is-eyebrow text-info">Tu primer portafolio</span>
          <h1>Empieza con $100.000 ficticios y aprende haciendo.</h1>
          <p className="mt-3">
            Al registrarte recibes un saldo inicial de simulación para comprar
            acciones, ETFs y abrir cuentas de ahorro con interés compuesto.
          </p>
          <ul className="is-auth-points">
            <li>
              <i className="fa-solid fa-circle-check" />
              Sin tarjetas, sin depósitos y sin riesgo
            </li>
            <li>
              <i className="fa-solid fa-circle-check" />
              Métricas de rendimiento y volatilidad
            </li>
            <li>
              <i className="fa-solid fa-circle-check" />
              Escenarios de crisis para poner a prueba tu estrategia
            </li>
          </ul>
        </div>

        <small className="text-white-50">
          Los datos de mercado pueden ser reales o sintéticos con fines educativos.
        </small>
      </aside>

      <main className="is-auth-panel">
        <Card className="is-auth-card">
          <Card.Body>
            <div className="d-lg-none is-auth-brand text-dark mb-4">
              <span className="is-brand-mark">
                <i className="fa-solid fa-chart-line" />
              </span>
              InvestSim
            </div>

            <h2 className="h3 fw-bold mb-1">Crear cuenta</h2>
            <p className="text-muted mb-4">
              Completa tus datos para comenzar a simular.
            </p>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form noValidate onSubmit={handleSubmit}>
              <Row className="g-3 mb-3">
                <Col sm={6}>
                  <Form.Group controlId="firstName">
                    <Form.Label>Nombres</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ana"
                      autoComplete="given-name"
                      required
                      {...fieldProps("firstName")}
                    />
                    {fieldErrors.firstName && (
                      <div className="invalid-feedback d-block">
                        {fieldErrors.firstName}
                      </div>
                    )}
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="lastName">
                    <Form.Label>Apellidos</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Gómez"
                      autoComplete="family-name"
                      required
                      {...fieldProps("lastName")}
                    />
                    {fieldErrors.lastName && (
                      <div className="invalid-feedback d-block">
                        {fieldErrors.lastName}
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                  {...fieldProps("email")}
                />
                {fieldErrors.email && (
                  <div className="invalid-feedback d-block">
                    {fieldErrors.email}
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                  {...fieldProps("password")}
                />
                {fieldErrors.password && (
                  <div className="invalid-feedback d-block">
                    {fieldErrors.password}
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-4" controlId="confirmPassword">
                <Form.Label>Confirmar contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  required
                  {...fieldProps("confirmPassword")}
                />
                {fieldErrors.confirmPassword && (
                  <div className="invalid-feedback d-block">
                    {fieldErrors.confirmPassword}
                  </div>
                )}
              </Form.Group>

              <Button
                type="submit"
                className="w-100 py-2 fw-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2"
                    />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-plus me-2" />
                    Crear mi cuenta
                  </>
                )}
              </Button>
            </Form>

            <p className="text-center text-muted small mt-4 mb-0">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="fw-semibold">
                Inicia sesión
              </Link>
            </p>
          </Card.Body>
        </Card>
      </main>
    </div>
  );
}

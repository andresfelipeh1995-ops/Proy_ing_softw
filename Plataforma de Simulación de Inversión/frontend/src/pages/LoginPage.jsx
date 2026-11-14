import { useState } from "react";
import { Alert, Button, Card, Form, Spinner } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await login({
      email: form.email.trim(),
      password: form.password,
    });

    setLoading(false);

    if (result.success) {
      navigate(location.state?.from || "/dashboard", { replace: true });
    } else {
      setError(result.message || "Email o contraseña incorrectos.");
    }
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
          <span className="is-eyebrow text-info">Aprende invirtiendo</span>
          <h1>Simula el mercado sin arriesgar dinero real.</h1>
          <p className="mt-3">
            Crea portafolios, compra acciones y ETFs, proyecta cuentas de ahorro
            y analiza el impacto de escenarios económicos en tus decisiones.
          </p>
          <ul className="is-auth-points">
            <li>
              <i className="fa-solid fa-circle-check" />
              Portafolios y operaciones 100% ficticias
            </li>
            <li>
              <i className="fa-solid fa-circle-check" />
              Gráficas, métricas y análisis de riesgo
            </li>
            <li>
              <i className="fa-solid fa-circle-check" />
              Contenido educativo para empezar desde cero
            </li>
          </ul>
        </div>

        <small className="text-white-50">
          Plataforma educativa · Ingeniería de Software I
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

            <h2 className="h3 fw-bold mb-1">Iniciar sesión</h2>
            <p className="text-muted mb-4">
              Ingresa con tu cuenta para abrir tu simulador.
            </p>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="username"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="password">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  name="password"
                  type="password"
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
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
                    Ingresando...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket me-2" />
                    Entrar a InvestSim
                  </>
                )}
              </Button>
            </Form>

            <div className="is-divider" />

            <p className="text-center text-muted small mb-2">
              ¿Aún no tienes cuenta?{" "}
              <Link to="/registro" className="fw-semibold">
                Regístrate
              </Link>
            </p>
            <p className="text-center text-muted small mb-0">
              Acceso administrador de prueba:{" "}
              <code>admin@investsim.co</code> / <code>Admin123!</code>
            </p>
          </Card.Body>
        </Card>
      </main>
    </div>
  );
}

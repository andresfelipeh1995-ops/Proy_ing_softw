import { Badge, Button, Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { session, isAdmin, logout } = useAuth();

  return (
    <>
      <Navbar
        expand="lg"
        variant="dark"
        className="is-navbar"
        collapseOnSelect
      >
        <Container fluid="xl">
          <Navbar.Brand as={NavLink} to="/dashboard" className="fw-bold">
            <span className="is-brand-mark">
              <i className="fa-solid fa-chart-line" />
            </span>
            InvestSim
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-content" />
          <Navbar.Collapse id="navbar-content">
            <Nav className="me-auto mb-2 mb-lg-0 gap-lg-1">
              <Nav.Link as={NavLink} to="/dashboard" end>
                <i className="fa-solid fa-house me-1" />
                Inicio
              </Nav.Link>
              <Nav.Link as={NavLink} to="/mercado">
                <i className="fa-solid fa-arrow-trend-up me-1" />
                Mercado
              </Nav.Link>
              <Nav.Link as={NavLink} to="/portafolios">
                <i className="fa-solid fa-folder-open me-1" />
                Portafolios
              </Nav.Link>
              <Nav.Link as={NavLink} to="/operar">
                <i className="fa-solid fa-right-left me-1" />
                Operar
              </Nav.Link>
              <Nav.Link as={NavLink} to="/ahorros">
                <i className="fa-solid fa-piggy-bank me-1" />
                Ahorros
              </Nav.Link>
              <Nav.Link as={NavLink} to="/escenarios">
                <i className="fa-solid fa-shield-halved me-1" />
                Escenarios
              </Nav.Link>
              <Nav.Link as={NavLink} to="/analisis">
                <i className="fa-solid fa-chart-area me-1" />
                Análisis
              </Nav.Link>
              <Nav.Link as={NavLink} to="/aprendizaje">
                <i className="fa-solid fa-graduation-cap me-1" />
                Aprender
              </Nav.Link>
              {isAdmin && (
                <NavDropdown
                  title={
                    <>
                      <i className="fa-solid fa-user-shield me-1" />
                      Admin
                    </>
                  }
                  id="admin-menu"
                  menuVariant="dark"
                >
                  <NavDropdown.Item as={NavLink} to="/admin/usuarios">
                    Usuarios
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/admin/mercado">
                    Instrumentos e ingesta
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/admin/educacion">
                    Contenido educativo
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>

            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
              <Nav.Link
                as={NavLink}
                to="/perfil"
                className="is-user-chip text-lg-end"
              >
                <span className="d-block text-truncate">
                  <i className="fa-solid fa-circle-user me-1" />
                  {session?.email}
                </span>
                <Badge bg={isAdmin ? "warning" : "info"} text="dark">
                  {session?.rol}
                </Badge>
              </Nav.Link>
              <Button variant="outline-light" size="sm" onClick={logout}>
                <i className="fa-solid fa-right-from-bracket me-1" />
                Salir
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid="xl" as="main" className="py-4 is-main">
        <Outlet />
      </Container>

      <footer className="is-footer">
        <Container fluid="xl" className="d-flex flex-wrap justify-content-between gap-2">
          <span>
            <i className="fa-solid fa-chart-line me-1" />
            InvestSim · Simulación educativa de inversiones
          </span>
          <span className="text-muted">El dinero y las operaciones son ficticios.</span>
        </Container>
      </footer>
    </>
  );
}
